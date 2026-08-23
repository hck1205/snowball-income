/**
 * 타이핑 중인 문자열 → 커밋할 주식 수. 커밋하지 않을 중간 상태면 `null`.
 *
 * `''`(지우고 다시 치는 중)과 `'.'`(소수점만 찍은 중)에서 커밋하면 그 종목 비중이 0으로 무너졌다가
 * 다음 타건에 되살아난다 — 그 사이 다른 종목 비중이 요동친다. 중간 상태는 그냥 통과시킨다.
 *
 * ⚠ 표시 쪽 짝(`toSharesDisplayValue`)은 이 파일이 아니라 그것을 **유일하게 쓰는**
 *   `components/HoldingRow` 안에 있다(폴더 배럴을 우회하는 import 를 만들지 않기 위해서이기도 하고,
 *   유틸은 소비자 옆에 있는 편이 낡지 않는다 — `.cursor/rules` §2·§8).
 */
export const toSharesCommitValue = (raw: string): number | null => {
  if (raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};
