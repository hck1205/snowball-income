// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { FILING_THRESHOLD_USD, parse13fInfoTable, topHoldings, weightPercent } from '@/scripts/investorHoldings/parse13f';

/**
 * 13F 파서의 계약.
 *
 * 🔴 이 스위트가 지키는 것은 하나다: **틀린 순위를 그럴듯하게 보여주지 않는다.**
 * 13F 파싱 오류는 화면에서 티가 나지 않는다 — 숫자가 나오긴 하니까. 그래서 실측으로 드러난 함정마다
 * 케이스를 박아 둔다. 아래 XML 은 전부 실제 공시의 구조를 그대로 옮긴 것이다.
 */

/** 한 행. 실제 공시와 같은 태그 순서·중첩을 쓴다. */
const row = (issuer: string, cusip: string, value: number, prefix = ''): string => `
  <${prefix}infoTable>
    <${prefix}nameOfIssuer>${issuer}</${prefix}nameOfIssuer>
    <${prefix}cusip>${cusip}</${prefix}cusip>
    <${prefix}value>${value}</${prefix}value>
  </${prefix}infoTable>`;

const doc = (...rows: string[]): string => `<?xml version="1.0"?><informationTable>${rows.join('')}</informationTable>`;

describe('🔴 CUSIP 중복 합산 — 순위를 뒤집는 함정', () => {
  /*
   * 실측(버크셔 2026-03-31): 애플이 두 행으로 나뉘어 각각 7.8%·5.9% 로 보였고 1위가 아멕스였다.
   * 합치면 22.0% 로 애플이 1위다. 합산하지 않으면 "버핏의 1위 종목"이 틀린 채로 나간다.
   */
  it('같은 CUSIP 이 여러 행이면 합쳐서 한 종목으로 센다', () => {
    const parsed = parse13fInfoTable(
      doc(
        row('APPLE INC', '037833100', 30_000_000_000),
        row('AMERICAN EXPRESS CO', '025816109', 45_000_000_000),
        row('APPLE INC', '037833100', 25_000_000_000)
      )
    );

    expect(parsed.rowCount).toBe(3);
    expect(parsed.holdings).toHaveLength(2);
    expect(parsed.holdings[0]?.cusip).toBe('037833100');
    expect(parsed.holdings[0]?.valueUsd).toBe(55_000_000_000);
  });

  it('합산 결과로 정렬한다 — 합치기 전 최대 행이 1위가 아닐 수 있다', () => {
    const parsed = parse13fInfoTable(
      doc(row('SPLIT CO', 'AAA111111', 6), row('BIG SINGLE CO', 'BBB222222', 10), row('SPLIT CO', 'AAA111111', 6))
    );
    // 행 단위로는 BIG(10)이 최대지만, 합치면 SPLIT(12)이 1위다.
    expect(parsed.holdings[0]?.issuer).toBe('SPLIT CO');
  });

  it('rowCount 는 합산 전 원본 행 수를 유지한다 (리포트가 중복 여부를 알 수 있게)', () => {
    const parsed = parse13fInfoTable(doc(row('A', 'X', 1), row('A', 'X', 1), row('A', 'X', 1)));
    expect(parsed.rowCount).toBe(3);
    expect(parsed.holdings).toHaveLength(1);
  });
});

describe('🔴 금액 단위 혼재 — 1000배 틀리는 함정', () => {
  /*
   * 13F 는 2023년에 천달러 → 달러로 바뀌었으나 일부 제출자가 옛 방식을 유지한다.
   * 실측: 바우포스트 $5.1B 가 $0.0B 로, 듀케인 $3.4B 가 $0.0B 로 나왔다.
   * 판별 경계는 제도에서 온다 — 13F 제출 의무가 $100M 이상이므로 합계가 그 미만이면 천 단위다.
   */
  it('합계가 $100M 미만이면 천 단위로 보고 1000 을 곱한다', () => {
    const parsed = parse13fInfoTable(doc(row('AMAZON COM INC', '023135106', 5_100_000)));

    expect(parsed.valueUnit).toBe('thousands');
    expect(parsed.totalValueUsd).toBe(5_100_000_000);
    expect(parsed.holdings[0]?.valueUsd).toBe(5_100_000_000);
  });

  it('합계가 $100M 이상이면 달러로 보고 그대로 둔다', () => {
    const parsed = parse13fInfoTable(doc(row('APPLE INC', '037833100', 263_000_000_000)));

    expect(parsed.valueUnit).toBe('dollars');
    expect(parsed.totalValueUsd).toBe(263_000_000_000);
  });

  it('경계값 바로 위는 달러로 본다', () => {
    const parsed = parse13fInfoTable(doc(row('A', 'X', FILING_THRESHOLD_USD)));
    expect(parsed.valueUnit).toBe('dollars');
  });

  it('🔴 빈 결과에는 단위 보정을 하지 않는다 — 0 은 "천 단위"라는 뜻이 아니다', () => {
    const parsed = parse13fInfoTable(doc());
    expect(parsed.holdings).toEqual([]);
    expect(parsed.valueUnit).toBe('dollars');
    expect(parsed.totalValueUsd).toBe(0);
  });

  it('보정 사실을 결과에 실어 호출부가 리포트할 수 있게 한다 (조용히 고치지 않는다)', () => {
    expect(parse13fInfoTable(doc(row('A', 'X', 1_000))).valueUnit).toBe('thousands');
  });
});

describe('제출자마다 다른 XML 형태', () => {
  it('네임스페이스 접두사가 붙은 태그도 읽는다', () => {
    const parsed = parse13fInfoTable(doc(row('BERKSHIRE HATHAWAY INC', '084670702', 8_000_000_000, 'ns1:')));

    expect(parsed.holdings).toHaveLength(1);
    expect(parsed.holdings[0]?.issuer).toBe('BERKSHIRE HATHAWAY INC');
  });

  it('HTML 엔티티를 디코드한다', () => {
    const parsed = parse13fInfoTable(
      doc(row('STATE STR SPDR S&amp;P 500', '78462F103', 3_000_000_000), row('Wells Fargo &amp; Co', '949746101', 1_000_000_000))
    );

    expect(parsed.holdings[0]?.issuer).toBe('STATE STR SPDR S&P 500');
    expect(parsed.holdings[1]?.issuer).toBe('Wells Fargo & Co');
  });

  it('🔴 &amp; 를 마지막에 풀어 이중 디코드를 막는다', () => {
    // `&amp;lt;` 는 문자 그대로 "&lt;" 를 뜻한다 — `<` 로 풀리면 안 된다.
    const parsed = parse13fInfoTable(doc(row('A &amp;lt; B', 'X', 1_000_000_000)));
    expect(parsed.holdings[0]?.issuer).toBe('A &lt; B');
  });
});

describe('망가진 입력에 조용히 틀리지 않는다', () => {
  it('CUSIP 이 없는 행은 버린다 — 티커에 붙일 방법이 없는 데이터다', () => {
    const withoutCusip = `<infoTable><nameOfIssuer>NO CUSIP CO</nameOfIssuer><value>9999999999</value></infoTable>`;
    const parsed = parse13fInfoTable(doc(withoutCusip, row('OK CO', 'X', 1_000_000_000)));

    expect(parsed.holdings).toHaveLength(1);
    expect(parsed.holdings[0]?.issuer).toBe('OK CO');
  });

  it('value 가 없거나 숫자가 아니면 0 으로 센다 (NaN 이 합계를 오염시키지 않는다)', () => {
    const broken = `<infoTable><nameOfIssuer>X</nameOfIssuer><cusip>ZZZ</cusip><value>N/A</value></infoTable>`;
    const parsed = parse13fInfoTable(doc(broken, row('OK', 'Y', 500_000_000)));

    expect(Number.isFinite(parsed.totalValueUsd)).toBe(true);
    expect(parsed.totalValueUsd).toBe(500_000_000);
  });

  it('infoTable 이 하나도 없으면 빈 결과다 (예외를 던지지 않는다)', () => {
    // 호출부가 "받아 왔는데 비었다"와 "못 받아 왔다"를 구분해서 다뤄야 하므로 여기서 던지지 않는다.
    expect(parse13fInfoTable('<html>Not a filing</html>').holdings).toEqual([]);
  });

  it('발행사 이름이 없어도 CUSIP 만 있으면 살린다', () => {
    const noName = `<infoTable><cusip>QQQ</cusip><value>200000000</value></infoTable>`;
    expect(parse13fInfoTable(doc(noName)).holdings[0]?.cusip).toBe('QQQ');
  });
});

describe('표시 보조', () => {
  const parsed = parse13fInfoTable(
    doc(row('A', 'AA', 50_000_000_000), row('B', 'BB', 30_000_000_000), row('C', 'CC', 20_000_000_000))
  );

  it('상위 N종을 자른다 — 1,016종과 4종을 같은 화면에 그리려면 필요하다', () => {
    expect(topHoldings(parsed, 2).map((h) => h.cusip)).toEqual(['AA', 'BB']);
  });

  it('limit 이 0 이하이거나 전체보다 크면 안전하게 동작한다', () => {
    expect(topHoldings(parsed, 0)).toEqual([]);
    expect(topHoldings(parsed, -1)).toEqual([]);
    expect(topHoldings(parsed, 99)).toHaveLength(3);
  });

  it('비중을 계산한다', () => {
    expect(weightPercent(parsed.holdings[0]!, parsed)).toBeCloseTo(50, 5);
  });

  it('🔴 합계가 0 이면 비중은 null 이다 — 0% 로 위장하지 않는다', () => {
    const empty = parse13fInfoTable(doc());
    expect(weightPercent({ cusip: 'X', issuer: 'X', valueUsd: 0 }, empty)).toBeNull();
  });
});
