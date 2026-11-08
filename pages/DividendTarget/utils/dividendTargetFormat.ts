/*
 * "11억 2,781만원" 포맷터의 정본은 `@/shared/utils`(format.ts)로 옮겼다(2026-11-09) — 티커 페이지와
 * 크롤러 HTML 도 같은 표기를 써야 해서다. 이 화면의 import 경로는 그대로 두려고 다시 내보낸다.
 */
import { formatKoreanWon } from '@/shared/utils';

export { formatKoreanWon };

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
