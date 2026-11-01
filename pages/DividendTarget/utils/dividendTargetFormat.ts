/**
 * 이 화면의 금액 표기 — **"11억 2,781만원"** 꼴.
 *
 * 공용 `formatSummaryKRW`("11.3억")를 쓰지 않는 이유: 이 화면의 주인공 숫자가 필요 원금이고, 사람은
 * 그 숫자를 **통장 잔고처럼** 읽는다. 소수 억("11.3억")은 대시보드 요약엔 맞지만 "그래서 정확히
 * 얼마냐"는 이 화면의 질문에 한 번 더 환산을 시킨다. 만원 아래는 버린다(원 단위 정밀도는 거짓 정밀이다 —
 * 배당률 자체가 소수 둘째 자리 추정치다).
 */
export const formatKoreanWon = (value: number): string => {
  if (!Number.isFinite(value)) return '-';
  const sign = value < 0 ? '-' : '';
  const totalMan = Math.round(Math.abs(value) / 10_000);
  const eok = Math.floor(totalMan / 10_000);
  const man = totalMan % 10_000;

  if (eok === 0) return `${sign}${man.toLocaleString('ko-KR')}만원`;
  if (man === 0) return `${sign}${eok.toLocaleString('ko-KR')}억원`;
  return `${sign}${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만원`;
};

/** 만원 단위 정수 → "250만원" / "1억원". 칩·제목용. */
export const formatManWon = (man: number): string => formatKoreanWon(man * 10_000);

/** 퍼센트. 소수 둘째 자리까지, 뒤의 0 은 지운다("15%" · "3.13%"). */
export const formatPercent = (value: number): string =>
  `${Number(value.toFixed(2)).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;

/** %p 격차. 부호는 문구가 말하므로 절댓값만("7.13%p"). */
export const formatPercentPoints = (value: number): string =>
  `${Number(Math.abs(value).toFixed(2)).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%p`;

/** 부호 있는 퍼센트(배당 인상률용) — 마이너스 인상률을 그대로 보여 준다("-4.33%"). */
export const formatSignedPercent = (value: number): string => `${value > 0 ? '+' : ''}${formatPercent(value)}`;
