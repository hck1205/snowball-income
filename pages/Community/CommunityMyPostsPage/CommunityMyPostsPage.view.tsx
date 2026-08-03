import { COMMUNITY_COPY } from '@/shared/constants/community';
import { BrandGlyph } from '@/components/common';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { CommunityTopBar } from '@/pages/Community/components';
import type { CommunityMyPostsViewProps } from './CommunityMyPostsPage.types';
import { MyPostsSection } from './components';
import {
  BootBar,
  BootBody,
  BootRail,
  BootRailBar,
  BootStatus,
  BootWrap,
  ConsoleBody,
  ConsoleRoot,
  GateBody,
  GateBodyLabel,
  GateButtons,
  GateCard,
  GateFootnote,
  GateGlyph,
  GateHead,
  GateSubtitle,
  GateTitle,
  GateWrap,
  IdentityRail,
  RailDivider,
  RailEyebrow,
  RailGlyph,
  RailLead,
  RailNav,
  RailNavLink,
  RailTitle,
  TopBarSlot
} from './CommunityMyPostsPage.styled';

const c = COMMUNITY_COPY.myPosts;
const p = COMMUNITY_COPY.profile;

const CONSOLE_LABEL = '내 계정';
const CONSOLE_LEAD = '공개 글과 나만 보는 비공개 글을 한곳에서 관리합니다.';
const GATE_PROVIDERS_LABEL = '로그인 수단';
const GATE_FOOTNOTE = '로그인은 커뮤니티 기능에만 쓰입니다. 시뮬레이터는 로그인 없이 그대로 사용할 수 있습니다.';

/**
 * "내가 쓴 글" 화면의 순수 뷰 — 계정 콘솔 셸(레일 + 작업 영역) + 목록 섹션.
 * 목록 자체(로딩/실패/빈/목록/필터)는 `MyPostsSection` 이 소유한다.
 */
export default function CommunityMyPostsView({ viewModel }: CommunityMyPostsViewProps) {
  const { authReady, isLoggedIn, onLogin } = viewModel;

  // ── 게이트: 인증 확인 중 / 비로그인(딥링크) ────────────────────────────────
  // 프로필 설정과 같은 처리다 — 이 경로는 남의 글이 아니라 **내 글**(비공개 포함)을 보여주므로
  // 로그인 전에는 목록 조회를 아예 시작하지 않는다.
  if (!authReady) {
    return (
      <BootWrap>
        <BootRail aria-hidden="true">
          <BootRailBar w="56px" h="56px" />
          <BootRailBar w="60%" h="12px" />
          <BootRailBar w="85%" h="26px" />
          <BootRailBar w="100%" h="1px" />
          <BootRailBar w="100%" h="20px" />
        </BootRail>
        <BootBody>
          <BootBar w="180px" h="18px" aria-hidden="true" />
          <BootBar w="100%" h="72px" aria-hidden="true" />
          <BootBar w="100%" h="72px" aria-hidden="true" />
          <BootStatus role="status">{c.loading}</BootStatus>
        </BootBody>
      </BootWrap>
    );
  }

  if (!isLoggedIn) {
    return (
      <GateWrap>
        <GateCard>
          <GateHead>
            <GateGlyph>
              <BrandGlyph size={32} accent />
            </GateGlyph>
            <GateTitle>{c.loginGateTitle}</GateTitle>
            <GateSubtitle>{c.loginGateSubtitle}</GateSubtitle>
          </GateHead>
          <GateBody>
            <GateBodyLabel>{GATE_PROVIDERS_LABEL}</GateBodyLabel>
            <GateButtons>
              <SocialLoginButton provider="google" onClick={() => onLogin('google')} />
              {/* 네이버: env 미설정이면 숨기지 않고 "준비 중"(pending)으로 노출, 클릭 무동작. 순서 구글→네이버→카카오. */}
              <SocialLoginButton
                provider="naver"
                pending={!isNaverEnabled}
                onClick={() => {
                  if (isNaverEnabled) onLogin('naver');
                }}
              />
              <SocialLoginButton provider="kakao" onClick={() => onLogin('kakao')} />
            </GateButtons>
            <GateFootnote>{GATE_FOOTNOTE}</GateFootnote>
          </GateBody>
        </GateCard>
      </GateWrap>
    );
  }

  return (
    <ConsoleRoot>
      <TopBarSlot>
        <CommunityTopBar />
      </TopBarSlot>

      <IdentityRail>
        <RailGlyph>
          <BrandGlyph size={32} accent />
        </RailGlyph>
        <div>
          <RailEyebrow>{CONSOLE_LABEL}</RailEyebrow>
          <RailTitle>{c.title}</RailTitle>
          <RailLead>{CONSOLE_LEAD}</RailLead>
        </div>
        <RailDivider />
        <RailNav aria-label={CONSOLE_LABEL}>
          <RailNavLink to="/community/profile">{p.menuItem}</RailNavLink>
          <RailNavLink to="/community/my-posts" aria-current="page">
            {c.menuItem}
          </RailNavLink>
        </RailNav>
      </IdentityRail>

      <ConsoleBody>
        <MyPostsSection />
      </ConsoleBody>
    </ConsoleRoot>
  );
}
