/**
 * "2,500,000" → "250만원". 문장 안에 박히는 **고정 상수 라벨** 전용이라 단위를 항상 만원으로 고정한다.
 *
 * ⚠ `shared/utils/format.ts`의 `formatSummaryKRW`와 **같은 일이 아니다** — 그쪽은 억/만/원 3층을
 *   `Math.round`로 근사하는 표기(커뮤니티 요약 스펙 §E1)라 단위가 값에 따라 바뀐다.
 *   여기서는 "기본공제 연 ○○만원"처럼 단위를 문장이 이미 전제하므로 층을 나눌 수 없다.
 *
 * 같은 정의가 `pages/Main/.../FinancialIncomeNotice/FinancialIncomeNotice.utils.ts`에도 있다.
 * **의도적 복제**다 — 재사용 레이어(`components/`)와 페이지 레이어(`pages/`)는 서로 import 하지 않는다.
 * 공용화가 필요해지면 새 포맷터를 만들지 말고 `shared/utils/format.ts` 안에서 통합할 것.
 */
export const toManWon = (won: number): string => `${(won / 10_000).toLocaleString()}만원`;
