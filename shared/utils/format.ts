const krw = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

export const formatKRW = (value: number): string => krw.format(value);

/**
 * 근사 한국어 단위 라벨 — `formatApproxKRW`/`formatSummaryKRW`가 **같은 구간·반올림 규칙**을
 * 공유하기 위한 코어(커뮤니티 프리뷰 스펙 §F3 "하나의 포맷터").
 * 억: 소수 1자리(정수면 0자리) · 만: 반올림 정수 · 그 미만: 원 단위 정수.
 */
const approxKRWLabel = (absValue: number): { unit: '억' | '만' | '원'; text: string } => {
  if (absValue >= 100_000_000) {
    const inEok = Math.round((absValue / 100_000_000) * 10) / 10;
    return { unit: '억', text: Number.isInteger(inEok) ? `${inEok.toFixed(0)}억` : `${inEok.toFixed(1)}억` };
  }

  if (absValue >= 10_000) {
    return { unit: '만', text: `${Math.round(absValue / 10_000).toLocaleString()}만` };
  }

  return { unit: '원', text: `${Math.round(absValue).toLocaleString()}원` };
};

/**
 * "약 9.2억" / "약 187만" / "약 1,234원" — 메인 대시보드의 축약 금액 표기.
 * `pages/Main/utils/formatters`에서 승격했다(커뮤니티가 페이지 결합 없이 쓰기 위해) —
 * 기존 호출부는 그쪽의 re-export로 무변경 동작한다.
 */
export const formatApproxKRW = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  return `${sign}약 ${approxKRWLabel(Math.abs(value)).text}`;
};

/**
 * "9.2억" / "187만원" / "1,234원" — 커뮤니티 시뮬 요약(카드·리스트·글쓰기 첨부) 공용 표기.
 * `formatApproxKRW`와 같은 구간·반올림 규칙을 쓰되, 라벨("월 배당(세후)")이 조건을 이미 말하므로
 * '약 ' 접두를 빼고, 만 단위에는 '원'을 붙여 금액임을 분명히 한다(스펙 §E1·§G 표기).
 */
export const formatSummaryKRW = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const { unit, text } = approxKRWLabel(Math.abs(value));
  return `${sign}${unit === '만' ? `${text}원` : text}`;
};

// ── 달러 표시(결과 화면 전용) ──────────────────────────────────────────────────
// 계산은 언제나 원화다. 아래 포맷터는 **표시 직전 한 번** 환산한 달러 값만 받는다
// (원화를 반올림한 뒤 나누거나, 달러로 바꾼 뒤 합산하면 오차가 쌓인다 — 합계는 원화에서).
//
// ⚠ 로케일이 `en-US` 인 이유: `ko-KR` + USD 는 `"US$1,234"` 로 렌더된다(장황·비관용).
//   화면 표기는 `"$1,234"` 다.

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const usdCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * `formatKRW` 의 달러 대응(정밀 표기).
 *
 * `0 < |v| < 10` 구간만 소수 2자리다 — 0자리로 깎으면 소액이 `$0` 이 되어
 * "정밀 모드는 실제 값을 보여준다"는 계약이 깨진다(원화는 1원 단위라 이 문제가 없다).
 */
export const formatUSD = (value: number): string => {
  const abs = Math.abs(value);
  return abs > 0 && abs < 10 ? usdCents.format(value) : usd.format(value);
};

/**
 * 근사 달러 단위 라벨 — 원화의 억/만/원 3층과 **1:1 동형**인 M/K/무단위 3층.
 *
 * 원화의 억(10^8)·만(10^4)을 달러에 얹으면 자릿수 감각이 깨지므로 달러는 10^6(M)·10^3(K) 체계를 쓴다.
 * M: 소수 1자리(정수면 0자리) · K: 반올림 정수 · 그 미만: 정수 콤마(1 미만은 소수 2자리).
 *
 * ⚠ 알려진 quirk(의도적 수용): `$999,999` → `"약 $1,000K"`. 원화도 동일하게
 *   `99,999,999원` → `"약 10,000만"` 이라, KRW 동작을 바꾸지 않기 위해 그대로 미러링한다.
 */
const approxUSDLabel = (absValue: number): string => {
  if (absValue >= 1_000_000) {
    const inMillions = Math.round((absValue / 1_000_000) * 10) / 10;
    return `$${Number.isInteger(inMillions) ? inMillions.toFixed(0) : inMillions.toFixed(1)}M`;
  }

  if (absValue >= 1_000) {
    return `$${Math.round(absValue / 1_000).toLocaleString('en-US')}K`;
  }

  // 1 달러 미만을 정수로 깎으면 "약 $0" 이 되어 값이 사라진다 — 센트까지 보여준다.
  if (absValue > 0 && absValue < 1) return `$${absValue.toFixed(2)}`;

  return `$${Math.round(absValue).toLocaleString('en-US')}`;
};

/** "약 $1.4M" / "약 $271K" / "약 $812" — `formatApproxKRW` 의 달러 대응(부호는 동일하게 sign-first). */
export const formatApproxUSD = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  return `${sign}약 ${approxUSDLabel(Math.abs(value))}`;
};
