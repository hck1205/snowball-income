import { memo } from 'react';
import { PrimaryNav } from '@/components/PrimaryNav';
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
        {/* 전역 nav — 로고+앱이름(홈 링크) + 라우트 링크(시뮬레이터·갤러리·게시판).
            brandAs="h1"로 워드마크가 이 페이지의 랜드마크 제목("Snowball Income")을 겸한다. */}
        <PrimaryNav brandAs="h1" />
        {/* 2줄 — 좌: 모바일 설정 토글 + 클라우드 저장 상태 / 우: 로그인·더보기·테마.
            PrimaryNav와 같은 3컬럼 그리드(1fr auto 1fr)라 두 줄의 좌우 끝선이 맞는다.
            1열 슬롯은 내용이 없어도 렌더해 트랙 자리를 지킨다. */}
        <ControlsRow>
          <LeadingSlot>
            {leading}
            {status}
          </LeadingSlot>
          {actions ? <Actions>{actions}</Actions> : null}
        </ControlsRow>
      </HeaderInner>
    </HeaderRoot>
  );
}

const SimulatorHeader = memo(SimulatorHeaderComponent);

export default SimulatorHeader;
