/**
 * 13F 정보표 파서 — **순수**. 네트워크·파일시스템·시계에 닿지 않는다(테스트가 실제 공시 문자열로 돈다).
 *
 * ## 🔴 이 파일이 처리하는 함정 (전부 2026-08-02 실측으로 드러난 것)
 *
 * 1. **CUSIP 중복 행** — 같은 종목이 보유 형태·운용 재량별로 여러 행에 나뉘어 신고된다.
 *    버크셔의 애플이 두 줄(7.8% + 5.9%)로 갈려 **1위가 아멕스로 잘못 나왔다.** 합치니 22.0% 1위다.
 *    합산하지 않으면 순위와 비중이 조용히 틀어진다 — 화면은 그럴듯해 보이므로 아무도 눈치채지 못한다.
 * 2. **금액 단위 혼재** — 13F 는 2023년에 천달러 → 달러로 바뀌었는데 **일부 제출자는 여전히 천 단위**다
 *    (실측: 바우포스트 $5.1B 가 $0.0B 로, 듀케인 $3.4B 가 $0.0B 로 나왔다).
 * 3. **네임스페이스 접두사** — 제출자에 따라 `<ns1:infoTable>` 처럼 접두사가 붙는다.
 * 4. **HTML 엔티티** — `S&amp;P 500`, `Wells Fargo &amp; Co`.
 * 5. **🔴 옵션이 주식과 같은 표에 실린다(`putCall`)** — 이게 가장 위험했다. 2026-08-02 실측:
 *    마이클 버리(Scion)의 8행 중 **4행이 옵션**이고, 최대 항목인 팔란티어(66%)·엔비디아(13.5%)가
 *    **풋(Put)** 이었다. 즉 *하락에 건 포지션*인데 우리 화면은 "최대 보유 종목"으로 그렸다 —
 *    방향이 정반대로 뒤집힌 거짓이다. 그래서 합산 키를 CUSIP 단독이 아니라 **CUSIP + 포지션 종류**로
 *    두고, 종류를 결과에 실어 화면이 반드시 구분해 말하게 한다.
 *    ⚠ 옵션 행의 `value` 는 **기초자산 명목 금액**이라 같은 자본으로도 비중이 크게 잡힌다.
 *      그 성질까지 여기서 보정하지 않는다(보정하면 공시와 다른 숫자가 된다) — 화면이 종류를 밝힌다.
 *
 * ⚠ 정보표 **파일명은 제출자마다 다르다**(`53405.xml` 같은 임의 이름). 파일 선택은 호출부의 몫이고
 *   이 파서는 XML 문자열만 받는다 — 그래서 순수하게 유지된다.
 */

/**
 * 금액 단위 판별 경계.
 *
 * 🔴 임의로 고른 배수가 아니라 **제도에서 온 값**이다: 13F 제출 의무는 운용자산 **$100M 이상**에 붙는다.
 * 그러므로 합계가 $100M 미만으로 나오면 그 숫자는 달러가 아니라 천 달러다.
 * ⚠ 경계 근처($100M 언저리) 제출자가 생기면 오판할 수 있다 — 그래서 결과에 `valueUnit` 을 실어
 *   호출부가 리포트에 남길 수 있게 한다(조용히 보정하고 끝내지 않는다).
 */
export const FILING_THRESHOLD_USD = 100_000_000;

/**
 * 포지션 종류.
 *
 * 🔴 `put` 은 **보유가 아니라 하락 베팅**이다. `share` 와 한 덩어리로 합치면 방향이 뒤집힌다.
 * `call` 도 주식 보유가 아니다(권리일 뿐이고 만기가 있다).
 * ⚠ 공시의 `putCall` 값은 대소문자가 제출자마다 다르다(`Put`·`PUT`) — 소문자로 정규화해 비교한다.
 */
export type PositionKind = 'share' | 'put' | 'call';

export type Holding = {
  readonly cusip: string;
  /** 공시에 적힌 발행사 이름(엔티티 디코드 완료). 티커가 아니다 — 13F 는 티커를 주지 않는다. */
  readonly issuer: string;
  /** 미국 달러. 천 단위 신고분은 이미 보정됐다. */
  readonly valueUsd: number;
  /** 🔴 화면이 **반드시** 구분해 말해야 하는 값. 기본값을 share 로 넘겨짚지 마라. */
  readonly kind: PositionKind;
};

export type Parsed13F = {
  readonly holdings: readonly Holding[];
  /** 합산 전 원본 행 수. `holdings.length` 와 다르면 중복이 있었다는 뜻이다(리포트용). */
  readonly rowCount: number;
  /** 신고 금액의 원래 단위. `thousands` 면 이 파서가 1000 을 곱했다. */
  readonly valueUnit: 'dollars' | 'thousands';
  readonly totalValueUsd: number;
};

const ENTITIES: readonly (readonly [RegExp, string])[] = [
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&apos;/g, "'"],
  /* ⚠ &amp; 는 **맨 마지막**이다. 먼저 풀면 `&amp;lt;` 가 `<` 로 이중 디코드된다. */
  [/&amp;/g, '&']
];

const decodeEntities = (value: string): string =>
  ENTITIES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);

/** 접두사(`ns1:`)를 허용하는 태그 추출. 첫 번째 것만 본다 — 정보표 한 행에 같은 태그는 하나뿐이다. */
const readTag = (block: string, name: string): string | null => {
  const match = block.match(new RegExp(`<(?:\\w+:)?${name}>([^<]*)</(?:\\w+:)?${name}>`));
  return match ? match[1].trim() : null;
};

/**
 * 정보표 XML → 종목별 합산 보유.
 *
 * 🔴 **CUSIP 이 없는 행은 버린다.** CUSIP 은 이 데이터의 유일한 식별자라, 없으면 뒤에서 티커에 붙일
 * 방법이 없다. 이름으로 이어 붙이면 같은 이름의 다른 클래스·우선주를 섞게 된다.
 * 🔴 **파싱 결과가 0종목이면 그대로 0을 돌려준다.** 여기서 예외를 던지지 않는 이유는, "받아 왔는데
 * 비었다"와 "못 받아 왔다"를 호출부가 구분해서 다뤄야 하기 때문이다(빈 결과로 스냅샷을 덮어쓰면 안 된다).
 */
const readKind = (block: string): PositionKind => {
  const raw = (readTag(block, 'putCall') ?? '').trim().toLowerCase();
  if (raw === 'put') return 'put';
  if (raw === 'call') return 'call';
  /* 🔴 알 수 없는 값을 옵션으로 넘겨짚지 않는다 — 태그 자체가 없는 행이 정상적인 주식 보유다. */
  return 'share';
};

export const parse13fInfoTable = (xml: string): Parsed13F => {
  const blocks = [...xml.matchAll(/<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/g)].map((match) => match[1]);

  /*
   * 🔴 합산 키가 **CUSIP + 종류**다. CUSIP 단독으로 합치면 같은 종목의 주식과 풋이 한 줄로 뭉쳐
   * 방향이 사라진다(버리의 팔란티어 풋이 "보유 66%"가 됐던 그 결함).
   * 형태별로 갈린 같은 종류의 행은 여전히 합쳐진다 — 버크셔의 애플 두 줄이 그 경우다.
   */
  const byKey = new Map<string, { cusip: string; issuer: string; valueUsd: number; kind: PositionKind }>();
  for (const block of blocks) {
    const cusip = readTag(block, 'cusip');
    if (!cusip) continue;

    const rawValue = Number(readTag(block, 'value') ?? 0);
    const value = Number.isFinite(rawValue) ? rawValue : 0;
    const kind = readKind(block);
    const key = `${cusip}:${kind}`;
    const existing = byKey.get(key);

    if (existing) existing.valueUsd += value;
    else
      byKey.set(key, {
        cusip,
        issuer: decodeEntities(readTag(block, 'nameOfIssuer') ?? ''),
        valueUsd: value,
        kind
      });
  }

  const merged = [...byKey.values()].sort((left, right) => right.valueUsd - left.valueUsd);
  const rawTotal = merged.reduce((sum, item) => sum + item.valueUsd, 0);

  /* 빈 결과에는 단위 판정을 하지 않는다 — 0 은 $100M 미만이지만 "천 단위"라는 뜻이 아니다. */
  const isThousands = merged.length > 0 && rawTotal > 0 && rawTotal < FILING_THRESHOLD_USD;
  const scale = isThousands ? 1000 : 1;

  const holdings: Holding[] = merged.map((item) => ({
    cusip: item.cusip,
    issuer: item.issuer,
    valueUsd: item.valueUsd * scale,
    kind: item.kind
  }));

  return {
    holdings,
    rowCount: blocks.length,
    valueUnit: isThousands ? 'thousands' : 'dollars',
    totalValueUsd: rawTotal * scale
  };
};

/** 상위 N종. 켄 피셔(1,016종)와 데일리 저널(4종)을 같은 화면에 그리려면 자를 수밖에 없다. */
export const topHoldings = (parsed: Parsed13F, limit: number): readonly Holding[] =>
  parsed.holdings.slice(0, Math.max(0, limit));

/** 비중(%). 합계가 0이면 `null` — 0으로 나눈 값을 0%로 위장하지 않는다. */
export const weightPercent = (holding: Holding, parsed: Parsed13F): number | null =>
  parsed.totalValueUsd > 0 ? (holding.valueUsd / parsed.totalValueUsd) * 100 : null;
