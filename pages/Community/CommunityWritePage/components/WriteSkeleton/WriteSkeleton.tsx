import {
  Bar,
  BarActions,
  BarRow,
  Canvas,
  SkeletonShell,
  Sheet,
  Side,
  SrOnly,
  Tile,
  Work
} from './WriteSkeleton.styled';

/**
 * 글쓰기 로딩 상태 — 작업대의 **자리**를 먼저 세운다(커맨드 바 · 문서 시트 · 인스펙터).
 *
 * 인증 확인(`authReady`)과 수정 모드 로드에서 함께 쓴다. 시각은 스켈레톤이지만 상태는
 * `role="status"` + 스크린리더 문장이 말한다 — 모양만 있고 알림이 없으면 보조기기 사용자에게는
 * 그냥 빈 화면이다.
 */
export default function WriteSkeleton({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <SkeletonShell role="status" aria-busy="true">
      <SrOnly>{label}</SrOnly>
      <BarRow aria-hidden="true">
        <Bar w="160px" h="20px" />
        <BarActions>
          <Bar w="72px" h="36px" />
          <Bar w="96px" h="36px" />
        </BarActions>
      </BarRow>
      <Work aria-hidden="true">
        <Sheet>
          <Bar w="64px" h="12px" />
          <Bar w="min(100%, 520px)" h="28px" />
          <Bar w="64px" h="12px" />
          <Canvas />
        </Sheet>
        <Side>
          <Tile>
            <Bar w="72px" h="12px" />
            <Bar w="100%" h="40px" />
          </Tile>
          <Tile>
            <Bar w="88px" h="12px" />
            <Bar w="100%" h="64px" />
          </Tile>
        </Side>
      </Work>
    </SkeletonShell>
  );
}
