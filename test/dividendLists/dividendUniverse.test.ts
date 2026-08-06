// @vitest-environment node — 네트워크·DOM 없는 순수 계산 테스트.
import { describe, expect, it } from 'vitest';

import {
  annualPaymentFrequency,
  auditCandidate,
  buildUniverseCandidates,
  computeTickerMetrics,
  epochSecondsToUtcDate,
  epochSecondsToUtcYear,
  findRecentRateCut,
  fiveYearDividendGrowthPercent,
  isLatestPaymentOutlier,
  ListSourceError,
  parseProSharesHoldings,
  parseSdyWorkbook,
  parseSharedStrings,
  parseSheetRows,
  parseWikipediaSectorHtml,
  toAnnualPaymentRates,
  toSdyHoldings
} from '@/scripts/dividendLists';
import type { UniverseCandidate, UniverseSources } from '@/scripts/dividendLists';
import type { WikipediaSectorRow, YahooDividendChart, YahooDividendEvent } from '@/scripts/dividendLists';
import { dividendUniverseSnapshotSchema } from '@/shared/constants/dividendLists';

/**
 * 후보 유니버스 수집기의 **계산과 가드**를 고정 입력으로 못 박는다.
 *
 * 🔴 여기 있는 숫자는 대부분 2026-08-04 실측 사례를 그대로 옮긴 것이다(KO·AFG·FULT·ACN·RLI·FCPT).
 * 실제로 수집기를 틀리게 만들었던 형태만 골라 뒀으므로, 이 테스트가 깨지면 그때 그 버그가 돌아온 것이다.
 */

const CURRENT_YEAR = 2026;
const NOW_SECONDS = Date.UTC(2026, 7, 4) / 1000;

/** `YYYY-MM-DD`(UTC) → epoch 초. 테스트 픽스처를 사람이 읽을 수 있게 쓰기 위한 도구다. */
const at = (year: number, month: number, day: number): number => Date.UTC(year, month - 1, day) / 1000;

/** 연도별 지급액을 분기(또는 지정 월)로 편다. */
const payments = (
  amountsByYear: ReadonlyArray<[year: number, amount: number, months?: readonly number[]]>
): YahooDividendEvent[] =>
  amountsByYear.flatMap(([year, amount, months = [1, 4, 7, 10]]) =>
    months.map((month) => ({ amount, timestampSeconds: at(year, month, 15) }))
  );

const chartOf = (events: YahooDividendEvent[], price: number): YahooDividendChart => ({
  ticker: 'TEST',
  price,
  currency: 'USD',
  longName: 'Test Company Inc.',
  events
});

describe('1970년 이전 타임스탬프 (야후 배당은 1962년부터 온다)', () => {
  it('음수 epoch 를 연도로 바꾼다 — KO 첫 배당 이벤트가 실제로 음수다', () => {
    // 실측: KO 의 첫 배당은 `{ amount: 0.001563, date: -238501800 }` 이다.
    expect(epochSecondsToUtcYear(-238_501_800)).toBe(1962);
    expect(epochSecondsToUtcDate(-238_501_800)).toBe('1962-06-11');
  });

  it('epoch 경계에서 하루도 밀리지 않는다', () => {
    expect(epochSecondsToUtcYear(0)).toBe(1970);
    expect(epochSecondsToUtcDate(0)).toBe('1970-01-01');
    // -1초는 1969-12-31 이다. 절삭(trunc)으로 구현하면 여기서 1970-01-01 이 나온다.
    expect(epochSecondsToUtcYear(-1)).toBe(1969);
    expect(epochSecondsToUtcDate(-1)).toBe('1969-12-31');
  });

  it('윤년을 센다 (1968·2000 은 윤년, 1900 은 아니다)', () => {
    expect(epochSecondsToUtcDate(at(1968, 2, 29))).toBe('1968-02-29');
    expect(epochSecondsToUtcDate(at(2000, 2, 29))).toBe('2000-02-29');
    expect(epochSecondsToUtcDate(at(1900, 3, 1))).toBe('1900-03-01');
    expect(epochSecondsToUtcDate(at(2026, 12, 31))).toBe('2026-12-31');
  });
});

describe('연 지급횟수 (최빈값)', () => {
  it('완결 연도의 최빈값을 쓴다 — 특별배당이 한 해 섞여도 흔들리지 않는다', () => {
    const events = [
      ...payments([
        [2021, 0.4],
        [2022, 0.45],
        [2023, 0.5],
        [2024, 0.55]
      ]),
      // 2025년에만 특별배당이 얹혀 5회가 된다. 평균을 쓰면 주기가 4.2로 부풀어 배당률이 틀어진다.
      ...payments([[2025, 0.6, [1, 4, 7, 10, 12]]])
    ];
    expect(annualPaymentFrequency(events, CURRENT_YEAR)).toBe(4);
  });

  it('진행 중인 해는 세지 않는다 — 세면 매년 1월에 전 종목의 주기가 1이 된다', () => {
    const events = payments([
      [2024, 0.5],
      [2025, 0.5],
      [2026, 0.5, [1]]
    ]);
    expect(annualPaymentFrequency(events, CURRENT_YEAR)).toBe(4);
  });

  it('동률이면 더 최근 연도의 주기를 쓴다 (주기 변경 종목)', () => {
    const events = [
      ...payments([[2024, 0.5]]),
      ...payments([[2025, 0.17, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]]])
    ];
    expect(annualPaymentFrequency(events, CURRENT_YEAR)).toBe(12);
  });

  it('완결 연도가 없으면 null 이다 (0 으로 대체하지 않는다)', () => {
    expect(annualPaymentFrequency(payments([[2026, 0.5, [1]]]), CURRENT_YEAR)).toBeNull();
  });
});

describe('선행 배당률 (② 최신 지급액 × 연 지급횟수)', () => {
  it('KO 실측값을 재현한다 — 0.53 × 4 ÷ 86.86 = 2.441%', () => {
    const events = [
      { amount: 0.001_563, timestampSeconds: -238_501_800 }, // 1962년 첫 배당(음수 타임스탬프)
      ...payments([
        [2020, 0.41],
        [2021, 0.42],
        [2022, 0.44],
        [2023, 0.46],
        [2024, 0.485],
        [2025, 0.51]
      ]),
      ...payments([[2026, 0.53, [1, 4, 7]]])
    ];
    const { metrics, problems } = computeTickerMetrics(chartOf(events, 86.86), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });

    expect(problems).toEqual([]);
    expect(metrics).not.toBeNull();
    expect(metrics?.paymentsPerYear).toBe(4);
    expect(metrics?.latestDividend).toBe(0.53);
    expect(metrics?.forwardAnnualDividend).toBeCloseTo(2.12, 10);
    expect(metrics?.forwardYieldPercent).toBeCloseTo(2.441, 3);
    // 🔴 "작년+올해 누적"(2.04 + 1.59 = 3.63 → 4.18%) 로 돌아가면 여기서 깨진다.
    expect(metrics?.forwardYieldPercent).toBeLessThan(3);
    expect(metrics?.firstDividendYear).toBe(1962);
    expect(metrics?.latestDividendDate).toBe('2026-07-15');
  });

  it('가격이 없으면 지표 전체가 null 이다 (0 으로 대체하지 않는다)', () => {
    const events = payments([
      [2024, 0.5],
      [2025, 0.5]
    ]);
    const result = computeTickerMetrics(chartOf(events, 0), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });
    expect(result.metrics).toBeNull();
    expect(result.problems.map((problem) => problem.kind)).toContain('noPrice');
  });

  it('최신 지급이 오래되면 막는다 — 배당을 끊은 종목의 옛 지급액으로 배당률을 만들지 않는다', () => {
    const events = payments([
      [2023, 0.5],
      [2024, 0.5],
      [2025, 0.5, [1]]
    ]);
    const result = computeTickerMetrics(chartOf(events, 50), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });
    expect(result.metrics).toBeNull();
    expect(result.problems.map((problem) => problem.kind)).toContain('staleDividend');
  });
});

describe('최신 지급액 이상치 (② 방식이 성립하지 않는 형태)', () => {
  it('RLI — 최신 회차에 특별배당이 얹히면 막는다 (안 막으면 배당률 14.2%)', () => {
    const events = [
      ...payments([
        [2024, 0.145, [2, 5, 8]],
        [2025, 0.16, [2, 5, 8]]
      ]),
      { amount: 2.145, timestampSeconds: at(2024, 11, 29) },
      { amount: 2.16, timestampSeconds: at(2025, 11, 28) },
      { amount: 0.16, timestampSeconds: at(2026, 3, 2) },
      { amount: 2.18, timestampSeconds: at(2026, 5, 29) }
    ].sort((left, right) => left.timestampSeconds - right.timestampSeconds);

    expect(isLatestPaymentOutlier(events, 4)).toBe(true);
    const result = computeTickerMetrics(chartOf(events, 61.29), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });
    expect(result.metrics).toBeNull();
    expect(result.problems.map((problem) => problem.kind)).toContain('abnormalLatestPayment');
  });

  it('FCPT — 최신 회차가 평소보다 **작아도** 막는다 (분기→월 전환)', () => {
    // 실측: 0.367 분기 배당을 쓰다가 2026-07-31 에 0.122(= 0.367/3) 를 지급했다.
    // 이걸 그대로 ② 에 넣으면 0.122 × 4 로 실제의 1/3 짜리 배당률이 나온다.
    const events = [
      ...payments([
        [2024, 0.345],
        [2025, 0.355]
      ]),
      { amount: 0.367, timestampSeconds: at(2026, 3, 31) },
      { amount: 0.367, timestampSeconds: at(2026, 6, 30) },
      { amount: 0.122, timestampSeconds: at(2026, 7, 31) }
    ];
    expect(isLatestPaymentOutlier(events, 4)).toBe(true);
    const result = computeTickerMetrics(chartOf(events, 25.3), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });
    expect(result.metrics).toBeNull();
  });

  it('평범한 증배는 이상치가 아니다', () => {
    const events = payments([
      [2025, 0.5],
      [2026, 0.55, [1, 4, 7]]
    ]);
    expect(isLatestPaymentOutlier(events, 4)).toBe(false);
  });
});

describe('5년 배당 성장률', () => {
  const rates = [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year, index) => ({
    year,
    rate: [0.4, 0.41, 0.42, 0.44, 0.46, 0.485, 0.51][index],
    paymentCount: 4
  }));

  it('(작년 규칙 배당 ÷ 6년전 규칙 배당)^(1/5) − 1 — KO 실측 4.46%', () => {
    expect(fiveYearDividendGrowthPercent(rates, CURRENT_YEAR)).toBeCloseTo(4.462, 3);
  });

  it('🔴 특별배당이 섞인 해가 성장률을 뒤집지 않는다 (COST 실측)', () => {
    // 2020년의 $10 특별배당을 연간 합계에 넣으면 −16.88% 가 나온다. 규칙 배당은 5년 내내 올랐다.
    const cost = [
      ...payments([[2020, 0.7]]),
      { amount: 10, timestampSeconds: at(2020, 12, 3) },
      ...payments([
        [2021, 0.79],
        [2022, 0.9],
        [2023, 1.02],
        [2024, 1.16],
        [2025, 1.3]
      ])
    ];
    expect(fiveYearDividendGrowthPercent(toAnnualPaymentRates(cost), CURRENT_YEAR)).toBeCloseTo(13.18, 2);
  });

  it('🔴 지급 빈도 체계가 바뀌면 null 이다 (CTAS 실측 — 연 1회 → 분기 4회)', () => {
    const ctas = [
      { amount: 0.8775, timestampSeconds: at(2020, 5, 15) },
      ...payments([
        [2021, 0.1875],
        [2022, 0.2375],
        [2023, 0.2875],
        [2024, 0.3375],
        [2025, 0.39]
      ])
    ];
    // 그대로 비교하면 0.8775 → 0.39 이라 −14.97% 라는 정반대의 사실이 나온다.
    expect(fiveYearDividendGrowthPercent(toAnnualPaymentRates(ctas), CURRENT_YEAR)).toBeNull();
  });

  it('지급일이 연초로 밀려 3회가 된 해는 통과시킨다 (±1 흔들림은 체계 변경이 아니다)', () => {
    const drifted = [
      ...payments([[2020, 0.41]]),
      ...payments([
        [2021, 0.42],
        [2022, 0.44],
        [2023, 0.46],
        [2024, 0.485]
      ]),
      ...payments([[2025, 0.51, [1, 4, 7]]])
    ];
    expect(fiveYearDividendGrowthPercent(toAnnualPaymentRates(drifted), CURRENT_YEAR)).toBeCloseTo(4.462, 3);
  });

  it('🔴 완결 6개 연도가 없으면 null 이다 — 0% 로 대체하지 않는다 (뜻이 다르다)', () => {
    expect(fiveYearDividendGrowthPercent(rates.slice(-3), CURRENT_YEAR)).toBeNull();
    expect(fiveYearDividendGrowthPercent([], CURRENT_YEAR)).toBeNull();
    // 기준 연도 값이 0이면 나눗셈이 무한대가 된다.
    expect(
      fiveYearDividendGrowthPercent(
        [
          { year: 2020, rate: 0, paymentCount: 1 },
          { year: 2025, rate: 2, paymentCount: 4 }
        ],
        CURRENT_YEAR
      )
    ).toBeNull();
  });

  it('계산 불가는 지표를 막지 않는다 — 성장률만 null 이고 배당률은 남는다', () => {
    const events = payments([
      [2024, 0.5],
      [2025, 0.5],
      [2026, 0.5, [1, 4, 7]]
    ]);
    const result = computeTickerMetrics(chartOf(events, 50), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });
    expect(result.metrics?.fiveYearGrowthPercent).toBeNull();
    expect(result.metrics?.forwardYieldPercent).toBeCloseTo(4, 6);
    expect(result.problems.map((problem) => problem.kind)).toEqual(['growthUnavailable']);
  });
});

describe('삭감 탐지 (연간 합계가 아니라 규칙 배당 수준으로)', () => {
  it('ACN — 지급일이 연초로 밀려 합계가 준 해를 삭감으로 보지 않는다', () => {
    const events = [
      ...payments([[2024, 1.29, [1, 4, 7]]]),
      { amount: 1.48, timestampSeconds: at(2024, 10, 10) },
      ...payments([[2025, 1.48, [1, 4, 7]]]) // 4회차가 2026-01 로 넘어가 3회만 남았다
    ];
    expect(findRecentRateCut(toAnnualPaymentRates(events), CURRENT_YEAR)).toBeNull();
  });

  it('AFG — 규칙 배당 위에 얹힌 대형 특별배당에 흔들리지 않는다', () => {
    // 실측 그대로: 0.5 0.5 14 0.5 2 4 0.56 4 2 (2021) → 0.56 2 0.56 8 0.56 0.63 2 (2022)
    const events: YahooDividendEvent[] = [
      ...[0.5, 0.5, 14, 0.5, 2, 4, 0.56, 4, 2].map((amount, index) => ({
        amount,
        timestampSeconds: at(2021, 1, 1) + index * 86_400 * 30
      })),
      ...[0.56, 2, 0.56, 8, 0.56, 0.63, 2].map((amount, index) => ({
        amount,
        timestampSeconds: at(2022, 1, 1) + index * 86_400 * 30
      }))
    ];
    const rates = toAnnualPaymentRates(events);
    expect(rates.find((rate) => rate.year === 2021)?.rate).toBe(0.5);
    expect(rates.find((rate) => rate.year === 2022)?.rate).toBe(0.56);
    expect(findRecentRateCut(rates, 2023)).toBeNull();
  });

  it('FULT — 규칙 배당 **밑에** 섞인 작은 추가 지급에도 흔들리지 않는다', () => {
    // 실측 그대로: 매년 11~12월에 작은 추가 지급이 한 번 있다(0.08 → 0.06). 최솟값을 쓰면 삭감으로 오탐한다.
    const events: YahooDividendEvent[] = [
      ...payments([[2021, 0.14, [3, 6, 9, 12]]]),
      { amount: 0.08, timestampSeconds: at(2021, 11, 30) },
      ...payments([[2022, 0.15, [3, 6, 9, 12]]]),
      { amount: 0.06, timestampSeconds: at(2022, 11, 30) }
    ];
    const rates = toAnnualPaymentRates(events);
    expect(rates.find((rate) => rate.year === 2021)?.rate).toBe(0.14);
    expect(rates.find((rate) => rate.year === 2022)?.rate).toBe(0.15);
    expect(findRecentRateCut(rates, 2023)).toBeNull();
  });

  it('MMM — 진짜 삭감은 잡는다 (1.50 → 0.70)', () => {
    const events = [
      ...payments([[2023, 1.5]]),
      { amount: 1.51, timestampSeconds: at(2024, 2, 15) },
      ...payments([[2024, 0.7, [5, 8, 11]]])
    ];
    const cut = findRecentRateCut(toAnnualPaymentRates(events), 2025);
    expect(cut).toEqual({ fromYear: 2023, toYear: 2024, fromRate: 1.5, toRate: 0.7 });
  });
});

/* ────────────────────────────── 소스 파서 ────────────────────────────── */

describe('ProShares 전펀드 CSV 파싱', () => {
  const csv = [
    'PORTFOLIO HOLDINGS INFORMATION,,,,',
    'AS OF 7/31/2026,,,,',
    ',,,,',
    'Fund Ticker, Fund Name, Security Ticker, Security Sedol, Security Description',
    '"NOBL","ProShares S&P 500 Dividend Aristocrats","KO","2588173","COCA-COLA CO/THE"',
    '"NOBL","ProShares S&P 500 Dividend Aristocrats","BF/B","2087460","BROWN-FORMAN CORP, CLASS B"',
    '"NOBL","ProShares S&P 500 Dividend Aristocrats","","","Net Other Assets (Liabilities)"',
    '"REGL","ProShares S&P MidCap 400 Dividend Aristocrats","ABM","2035928","ABM INDUSTRIES INC"',
    '"SMDV","ProShares Russell 2000 Dividend Growers","GRC","2380167","GORMAN-RUPP CO/THE"',
    '"UPRO","ProShares UltraPro S&P500","","","S&P 500 INDEX SWAP"'
  ].join('\n');

  it('펀드별로 가르고, 티커 없는 행(현금)은 버리고, 클래스 주식은 점 표기로 통일한다', () => {
    const parsed = parseProSharesHoldings(csv);
    expect(parsed.fileAsOf).toBe('2026-07-31');
    expect(parsed.byFund.NOBL.map((holding) => holding.ticker)).toEqual(['KO', 'BF.B']);
    expect(parsed.byFund.REGL.map((holding) => holding.ticker)).toEqual(['ABM']);
    expect(parsed.byFund.SMDV.map((holding) => holding.ticker)).toEqual(['GRC']);
    // 회사명에 쉼표가 있어도 열이 밀리지 않는다.
    expect(parsed.byFund.NOBL[1].description).toBe('BROWN-FORMAN CORP, CLASS B');
  });

  it('🔴 한 펀드라도 0종이면 실패로 올린다 — 빈 목록을 조용히 넘기지 않는다', () => {
    const withoutSmdv = csv.split('\n').filter((line) => !line.startsWith('"SMDV"')).join('\n');
    expect(() => parseProSharesHoldings(withoutSmdv)).toThrow(ListSourceError);
  });
});

describe('위키피디아 렌더 HTML 섹터 파싱', () => {
  const html = `
    <table class="wikitable"><tbody><tr>
      <th><a href="/wiki/Ticker_symbol">Symbol</a></th><th>Security</th>
      <th><a href="/wiki/GICS">GICS</a> Sector</th><th>GICS Sub-Industry</th>
    </tr>
    <tr><td><a class="external text" href="#">MMM</a></td><td><a href="/wiki/3M">3M</a></td>
      <td>Industrials</td><td>Industrial Conglomerates</td></tr>
    <tr><td><a class="external text" href="#">BF.B</a></td><td><a href="#">Brown &amp; Brown</a></td>
      <td>Consumer Staples</td><td>Distillers &amp; Vintners</td></tr>
    <tr><td><a class="external text" href="#">T</a></td><td>AT&amp;T<sup class="reference">[1]</sup></td>
      <td>Communication Services</td><td>Integrated Telecommunication Services</td></tr>
    </tbody></table>`;

  it('열 이름으로 위치를 잡고 태그·엔티티·각주를 걷어낸다', () => {
    const rows = parseWikipediaSectorHtml(html, 'S&P 500');
    expect(rows).toEqual<WikipediaSectorRow[]>([
      { ticker: 'MMM', name: '3M', sectorLabel: 'Industrials' },
      { ticker: 'BF.B', name: 'Brown & Brown', sectorLabel: 'Consumer Staples' },
      { ticker: 'T', name: 'AT&T', sectorLabel: 'Communication Services' }
    ]);
  });

  it('🔴 열을 못 찾으면 실패로 올린다 — 빈 사전을 조용히 넘기면 전 종목의 섹터가 사라진다', () => {
    expect(() => parseWikipediaSectorHtml('<table><tr><td>MMM</td></tr></table>', 'S&P 500')).toThrow(
      ListSourceError
    );
  });
});

describe('SDY xlsx 파싱', () => {
  const sharedStringsXml =
    '<sst><si><t>Holdings:</t></si><si><t>As of 31-Jul-2026</t></si><si><t>Name</t></si>' +
    '<si><t>Ticker</t></si><si><t>Sector</t></si><si><t>VERIZON COMMUNICATIONS INC</t></si>' +
    '<si><t>VZ</t></si><si><r><t>US </t></r><r><t>DOLLAR</t></r></si><si><t>-</t></si>' +
    '<si><t>S+P500 EMINI FUT</t></si><si><t>ESU6</t></si>';
  const sheetXml =
    '<sheetData>' +
    '<row r="3"><c r="A3" t="s"><v>0</v></c><c r="B3" t="s"><v>1</v></c></row>' +
    '<row r="5"><c r="A5" t="s"><v>2</v></c><c r="B5" t="s"><v>3</v></c><c r="F5" t="s"><v>4</v></c></row>' +
    '<row r="6"><c r="A6" t="s"><v>5</v></c><c r="B6" t="s"><v>6</v></c><c r="F6" t="s"><v>8</v></c></row>' +
    '<row r="7"><c r="A7" t="s"><v>9</v></c><c r="B7" t="s"><v>10</v></c><c r="F7" t="s"><v>8</v></c></row>' +
    '<row r="8"><c r="A8" t="s"><v>7</v></c><c r="B8" t="s"><v>8</v></c><c r="F8" t="s"><v>8</v></c></row>' +
    '</sheetData>';

  it('헤더 행을 값으로 찾고, 종목이 아닌 행(선물·현금)은 세어서 뺀다', () => {
    const shared = parseSharedStrings(sharedStringsXml);
    // 서식이 나뉜 문자열은 조각을 이어 붙인다.
    expect(shared[7]).toBe('US DOLLAR');

    const result = toSdyHoldings(parseSheetRows(sheetXml, shared));
    expect(result.fileAsOf).toBe('2026-07-31');
    expect(result.holdings).toEqual([{ ticker: 'VZ', name: 'VERIZON COMMUNICATIONS INC', sectorLabel: null }]);
    // `Sector` 열의 `-` 는 "모르는 문자열"이 아니라 "안 적혀 있음"이다 → null 이고 에러가 아니다.
    expect(result.skipped).toEqual(['ESU6: S+P500 EMINI FUT', '-: US DOLLAR']);
  });

  it('zip 중앙 디렉터리를 읽어 두 파트를 꺼낸다', () => {
    const workbook = buildStoredZip([
      ['xl/sharedStrings.xml', sharedStringsXml],
      ['xl/worksheets/sheet1.xml', sheetXml]
    ]);
    // 무압축(method 0) 항목이므로 해제 함수는 불릴 일이 없다.
    const result = parseSdyWorkbook(workbook, () => {
      throw new Error('무압축 항목에서 해제를 시도했다');
    });
    expect(result.holdings.map((holding) => holding.ticker)).toEqual(['VZ']);
  });
});

/** 무압축(stored) zip 을 만든다 — 중앙 디렉터리 읽기가 맞는지 확인하려는 최소 픽스처다. */
const buildStoredZip = (files: ReadonlyArray<[name: string, content: string]>): Uint8Array => {
  const encoder = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];
  const pushUint16 = (target: number[], value: number): void => {
    target.push(value & 0xff, (value >> 8) & 0xff);
  };
  const pushUint32 = (target: number[], value: number): void => {
    target.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
  };

  for (const [name, content] of files) {
    const nameBytes = [...encoder.encode(name)];
    const dataBytes = [...encoder.encode(content)];
    const offset = local.length;
    pushUint32(local, 0x0403_4b50);
    for (let index = 0; index < 4; index += 1) pushUint16(local, 0); // version/flags/method/modtime
    pushUint16(local, 0); // moddate
    pushUint32(local, 0); // crc32 — 읽기 구현이 검사하지 않는다
    pushUint32(local, dataBytes.length);
    pushUint32(local, dataBytes.length);
    pushUint16(local, nameBytes.length);
    pushUint16(local, 0);
    local.push(...nameBytes, ...dataBytes);

    pushUint32(central, 0x0201_4b50);
    pushUint16(central, 20); // version made by
    for (let index = 0; index < 4; index += 1) pushUint16(central, 0); // version needed/flags/method/modtime
    pushUint16(central, 0); // moddate
    pushUint32(central, 0);
    pushUint32(central, dataBytes.length);
    pushUint32(central, dataBytes.length);
    pushUint16(central, nameBytes.length);
    pushUint16(central, 0); // extra
    pushUint16(central, 0); // comment
    pushUint16(central, 0); // disk
    pushUint16(central, 0); // internal attrs
    pushUint32(central, 0); // external attrs
    pushUint32(central, offset);
    central.push(...nameBytes);
  }

  const end: number[] = [];
  pushUint32(end, 0x0605_4b50);
  pushUint16(end, 0);
  pushUint16(end, 0);
  pushUint16(end, files.length);
  pushUint16(end, files.length);
  pushUint32(end, central.length);
  pushUint32(end, local.length);
  pushUint16(end, 0);
  return new Uint8Array([...local, ...central, ...end]);
};

/* ────────────────────────────── 조립 + 가드 ────────────────────────────── */

const sectorDictionary = (rows: readonly WikipediaSectorRow[]): UniverseSources['sectors'] => ({
  byTicker: new Map(rows.map((row) => [row.ticker, row])),
  rowCountByPage: [{ page: 'test', rowCount: rows.length }],
  conflicts: []
});

const sourcesOf = (sectorLabel = 'Consumer Staples'): UniverseSources => ({
  proShares: {
    byFund: {
      NOBL: [{ ticker: 'KO', description: 'COCA-COLA CO/THE' }],
      REGL: [{ ticker: 'ABM', description: 'ABM INDUSTRIES INC' }],
      SMDV: [{ ticker: 'YORW', description: 'YORK WATER CO/THE' }]
    },
    fileAsOf: '2026-07-31'
  },
  sdy: {
    holdings: [
      { ticker: 'KO', name: 'COCA-COLA CO', sectorLabel: null },
      { ticker: 'YORW', name: 'YORK WATER CO', sectorLabel: null }
    ],
    fileAsOf: '2026-07-31'
  },
  sectors: sectorDictionary([
    { ticker: 'KO', name: 'Coca-Cola', sectorLabel },
    { ticker: 'ABM', name: 'ABM Industries', sectorLabel: 'Industrials' }
  ])
});

describe('후보 유니버스 조립', () => {
  it('네 ETF 를 합치고, 겹치는 종목은 하한이 더 높은 쪽을 남긴다', () => {
    const candidates = buildUniverseCandidates(sourcesOf());
    expect(candidates.map((candidate) => candidate.ticker)).toEqual(['ABM', 'KO', 'YORW']);

    const ko = candidates.find((candidate) => candidate.ticker === 'KO');
    expect(ko?.sourceEtfs).toEqual(['NOBL', 'SDY']);
    // NOBL 25년 · SDY 20년 → 하한은 둘 중 큰 값.
    expect(ko?.minimumStreakYears).toBe(25);
    expect(ko?.sector).toBe('consumerStaples');
    // 위키피디아 표기가 있으면 그쪽을 쓴다(SDY 는 전부 대문자다).
    expect(ko?.name).toBe('Coca-Cola');

    expect(candidates.find((candidate) => candidate.ticker === 'ABM')?.minimumStreakYears).toBe(15);
    // YORW 는 SMDV(10년)와 SDY(20년) 둘 다에 있다 → 하한은 더 강한 20년이다.
    const yorw = candidates.find((candidate) => candidate.ticker === 'YORW');
    expect(yorw?.sourceEtfs).toEqual(['SDY', 'SMDV']);
    expect(yorw?.minimumStreakYears).toBe(20);
  });

  it('어느 소스에도 섹터가 없으면 null 이다 — 지어내지 않는다', () => {
    const yorw = buildUniverseCandidates(sourcesOf()).find((candidate) => candidate.ticker === 'YORW');
    expect(yorw?.sector).toBeNull();
    expect(yorw?.sourceSectorLabel).toBeNull();
  });

  it('🔴 모르는 섹터 **문자열**은 실패로 올린다 — 조용히 null 로 뭉개지 않는다', () => {
    expect(() => buildUniverseCandidates(sourcesOf('Crypto & Vibes'))).toThrow(ListSourceError);
  });
});

describe('교차검증 가드', () => {
  const candidate: UniverseCandidate = {
    ticker: 'KO',
    name: 'Coca-Cola',
    nameSource: 'wikipedia',
    sector: 'consumerStaples',
    sourceSectorLabel: 'Consumer Staples',
    sourceEtfs: ['NOBL'],
    minimumStreakYears: 25
  };

  const metricsFor = (events: YahooDividendEvent[], price: number) =>
    computeTickerMetrics(chartOf(events, price), {
      currentYear: CURRENT_YEAR,
      nowEpochSeconds: NOW_SECONDS
    });

  const healthy = payments([
    [2020, 0.41],
    [2021, 0.42],
    [2022, 0.44],
    [2023, 0.46],
    [2024, 0.485],
    [2025, 0.51],
    [2026, 0.53, [1, 4, 7]]
  ]);

  it('정상 종목은 신고 없이 지표를 남긴다', () => {
    const audit = auditCandidate(candidate, { ok: true, result: metricsFor(healthy, 86.86) }, '2026-08-04');
    expect(audit.issues).toEqual([]);
    expect(audit.entry.metrics?.measuredAt).toBe('2026-08-04');
    expect(audit.entry.metrics?.forwardYieldPercent).toBeCloseTo(2.441, 3);
  });

  it('🔴 하한과 모순되면(귀족 ETF 종목인데 삭감) 막고 지표를 비운다', () => {
    const cutEvents = payments([
      [2020, 0.41],
      [2021, 0.42],
      [2022, 0.44],
      [2023, 0.46],
      [2024, 0.485],
      [2025, 0.2],
      [2026, 0.2, [1, 4, 7]]
    ]);
    const audit = auditCandidate(candidate, { ok: true, result: metricsFor(cutEvents, 86.86) }, '2026-08-04');
    const contradiction = audit.issues.find((issue) => issue.kind === 'streakContradiction');
    expect(contradiction?.blocking).toBe(true);
    expect(contradiction?.detail).toContain('하한 25년');
    expect(audit.entry.metrics).toBeNull();
    // 후보에서 빼지는 않는다 — 편입 사실 자체는 여전히 참이다.
    expect(audit.entry.ticker).toBe('KO');
    expect(audit.entry.sourceEtfs).toEqual(['NOBL']);
  });

  it('🔴 배당률이 비상식 범위(>20%)면 막는다', () => {
    const audit = auditCandidate(candidate, { ok: true, result: metricsFor(healthy, 5) }, '2026-08-04');
    const issue = audit.issues.find((item) => item.kind === 'implausibleYield');
    expect(issue?.blocking).toBe(true);
    expect(audit.entry.metrics).toBeNull();
  });

  it('성장률 결측은 막지 않는다 — 지표는 남고 그 사실만 기록된다', () => {
    const shortHistory = payments([
      [2024, 0.5],
      [2025, 0.5],
      [2026, 0.5, [1, 4, 7]]
    ]);
    const audit = auditCandidate(candidate, { ok: true, result: metricsFor(shortHistory, 50) }, '2026-08-04');
    expect(audit.issues.map((issue) => issue.kind)).toEqual(['growthUnavailable']);
    expect(audit.issues[0].blocking).toBe(false);
    expect(audit.entry.metrics?.fiveYearGrowthPercent).toBeNull();
    expect(audit.entry.metrics?.forwardYieldPercent).toBeCloseTo(4, 6);
  });

  it('조회 실패는 삭감이 아니다 — 사실 그대로 남긴다', () => {
    const audit = auditCandidate(candidate, { ok: false, error: 'HTTP 429' }, '2026-08-04');
    expect(audit.issues).toEqual([
      { ticker: 'KO', kind: 'fetchFailed', detail: 'HTTP 429', blocking: true }
    ]);
    expect(audit.entry.metrics).toBeNull();
  });

  it('섹터가 없으면 기록하되 막지 않는다', () => {
    const audit = auditCandidate(
      { ...candidate, sector: null, sourceSectorLabel: null },
      { ok: true, result: metricsFor(healthy, 86.86) },
      '2026-08-04'
    );
    expect(audit.issues.map((issue) => issue.kind)).toEqual(['sectorMissing']);
    expect(audit.entry.metrics).not.toBeNull();
  });

  it('위키피디아 표기가 없으면 야후 회사명을 쓴다', () => {
    const audit = auditCandidate(
      { ...candidate, name: 'YORK WATER CO', nameSource: 'sdy' },
      { ok: true, result: metricsFor(healthy, 86.86) },
      '2026-08-04',
      'The York Water Company'
    );
    expect(audit.entry.name).toBe('The York Water Company');
  });
});

describe('생성물 스키마 (쓰기 전 마지막 방벽)', () => {
  const validSnapshot = {
    asOf: '2026-08-04',
    sourceAsOf: { proShares: '2026-07-31', sdy: '2026-07-31' },
    memberCountByEtf: { NOBL: 69, SDY: 155, REGL: 65, SMDV: 100 },
    entries: [
      {
        ticker: 'KO',
        name: 'Coca-Cola',
        sector: 'consumerStaples',
        sourceSectorLabel: 'Consumer Staples',
        sourceEtfs: ['NOBL', 'SDY'],
        minimumStreakYears: 25,
        metrics: {
          price: 86.86,
          currency: 'USD',
          latestDividend: 0.53,
          latestDividendDate: '2026-07-15',
          paymentsPerYear: 4,
          forwardAnnualDividend: 2.12,
          forwardYieldPercent: 2.441,
          fiveYearGrowthPercent: 4.46,
          recentCut: null,
          firstDividendYear: 1962,
          measuredAt: '2026-08-04'
        }
      }
    ],
    issues: [],
    coverage: { total: 1, withMetrics: 1, withSector: 1, withGrowth: 1 }
  };

  it('정상 스냅샷은 통과한다', () => {
    expect(dividendUniverseSnapshotSchema.safeParse(validSnapshot).success).toBe(true);
  });

  it('🔴 빈 유니버스는 막는다 — 절반쯤 실패한 수집이 0종을 쓰고 지나가면 아무도 모른다', () => {
    expect(dividendUniverseSnapshotSchema.safeParse({ ...validSnapshot, entries: [] }).success).toBe(false);
  });

  it('🔴 20% 초과 배당률은 스키마가 막는다 (가드가 뚫려도 파일에는 못 들어간다)', () => {
    const broken = structuredClone(validSnapshot);
    broken.entries[0].metrics.forwardYieldPercent = 42;
    expect(dividendUniverseSnapshotSchema.safeParse(broken).success).toBe(false);
  });

  it('🔴 어느 ETF 에서 왔는지 없는 종목은 막는다 — 그게 후보인 이유이자 연수 하한의 근거다', () => {
    const broken = structuredClone(validSnapshot);
    broken.entries[0].sourceEtfs = [];
    expect(dividendUniverseSnapshotSchema.safeParse(broken).success).toBe(false);
  });
});
