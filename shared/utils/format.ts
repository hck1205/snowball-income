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
