import { memo } from 'react';
import { PrimaryNav, PrimaryNavLinks } from '@/components/PrimaryNav';
import { Actions, ControlsRow, HeaderInner, HeaderRoot, LeadingSlot } from './SimulatorHeader.styled';
import type { SimulatorHeaderProps } from './SimulatorHeader.types';

/**
 * 시뮬레이터 전역 헤더 — 커뮤니티 헤더와 같은 형태(전폭 sticky 글래스 바 + 2줄 스택)다.
 *
 * `MobileMenuDrawer`가 아니라 이 컴포넌트가 헤더를 소유한다. 드로어가 헤더를 품고 있던 시절에는
 * 헤더가 모바일 floating 토글과 그 IntersectionObserver 앵커를 자손으로 갖게 되어
 * sticky·backdrop-filter를 둘 다 쓸 수 없었다(SimulatorHeader.styled 주석 참고).
 */
function SimulatorHeaderComponent({ leading, status, actions }: SimulatorHeaderProps) {
  return (
    <HeaderRoot>
      <HeaderInner>
        {/* 1줄(2026-07-25 개편) — 좌: 브랜드(홈 링크, h1 랜드마크 제목) + 설정 토글·저장 상태 /
            우: 로그인·더보기·테마. 액션이 윗줄로 올라온 건 사용자 결정 — 메뉴보다 먼저 닿아야 하는
            컨트롤이라서다. 라우트 링크는 아랫줄 전용(PrimaryNavLinks). */}
        <ControlsRow>
          <LeadingSlot>
            <PrimaryNav brandAs="h1" withLinks={false} />
            {leading}
            {status}
          </LeadingSlot>
          {actions ? <Actions>{actions}</Actions> : null}
        </ControlsRow>
        {/* 2줄 — 라우트 메뉴. 가운데 정렬 + 넘치면 가로 스크롤, 라벨은 어떤 폭에서도 유지. */}
        <PrimaryNavLinks />
      </HeaderInner>
    </HeaderRoot>
  );
}

const SimulatorHeader = memo(SimulatorHeaderComponent);

export default SimulatorHeader;
