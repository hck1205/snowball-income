import { SkeletonCell, SkeletonList, SkeletonRow } from '../../LedgerPage/LedgerPage.styled';

/** 골격 줄 수. 셋이면 "목록이 온다"는 것을 말하기에 충분하고, 더 그리면 로딩이 무거워 보인다. */
const SKELETON_ROWS = [0, 1, 2];

/**
 * 목록 자리의 **골격**.
 *
 * 🔴 `aria-hidden` 이다 — 낭독기에는 빈 칸 셋이 아니라 바깥의 `aria-busy` 가 "불러오는 중"을 말한다.
 * ⚠ 2026-08-31 에 `LedgerPageView` 의 지역 함수에서 부품으로 올렸다. 쓰는 곳이 셋인데(연결 확인 중 ·
 *   탭 전환 중 · 기록 목록) 기록 화면만 별도 부품으로 갈라져서, 지역 함수로 두면 **복사본이 생긴다.**
 */
export default function LedgerSkeletonList() {
  return (
    <SkeletonList aria-hidden>
      {SKELETON_ROWS.map((row) => (
        <SkeletonRow key={row}>
          <SkeletonCell />
        </SkeletonRow>
      ))}
    </SkeletonList>
  );
}
