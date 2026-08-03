import { useId, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { BrandGlyph, Button } from '@/components/common';
import {
  AlertIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DeleteAccountDialog,
  UserRoundIcon
} from '@/components/community';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { NICKNAME_MAX_LENGTH } from '@/shared/lib/community';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { CommunityTopBar } from '@/pages/Community/components';
import type { CommunityProfileViewProps } from './CommunityProfilePage.types';
import {
  BootBar,
  BootBody,
  BootRail,
  BootRailBar,
  BootStatus,
  BootWrap,
  Chevron,
  ConsoleBody,
  ConsoleRoot,
  Counter,
  DangerAccordion,
  DangerActions,
  DangerCaption,
  DangerGlyph,
  DangerHeader,
  DangerHeaderText,
  DangerIrreversible,
  DangerLabelRow,
  DangerPanel,
  DangerPanelBody,
  DangerPanelInner,
  DangerScopeCard,
  DangerScopeIntro,
  DangerScopeList,
  DangerTitle,
  DangerZone,
  Feedback,
  FieldBlock,
  FieldError,
  FieldLabel,
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
  Hint,
  IdentityRail,
  LabelRow,
  NicknameInput,
  PreviewCaption,
  PreviewCard,
  PreviewGlyph,
  PreviewName,
  PreviewTexts,
  RailDivider,
  RailEyebrow,
  RailGlyph,
  RailLead,
  RailNav,
  RailNavLink,
  RailTitle,
  SaveRow,
  Section,
  SectionGlyph,
  SectionHead,
  SectionTitle,
  SuccessText,
  TopBarSlot
} from './CommunityProfilePage.styled';

const p = COMMUNITY_COPY.profile;
const m = COMMUNITY_COPY.myPosts;

/** 레일 눈썹 라벨 — 두 자매 화면이 한 묶음(계정)임을 상시 말한다. */
const CONSOLE_LABEL = '내 계정';
const CONSOLE_LEAD = '커뮤니티에 표시될 이름과 계정을 관리합니다.';
const PREVIEW_CAPTION = '커뮤니티 글과 댓글에 이렇게 표시됩니다';
const PREVIEW_EMPTY = '닉네임을 입력해주세요';
const GATE_PROVIDERS_LABEL = '로그인 수단';
const GATE_FOOTNOTE = '로그인은 커뮤니티 기능에만 쓰입니다. 시뮬레이터는 로그인 없이 그대로 사용할 수 있습니다.';
const DANGER_ZONE_LABEL = '위험 영역';

export default function CommunityProfileView({ viewModel }: CommunityProfileViewProps) {
  const { nickname, deletion, authReady, isLoggedIn, onLogin } = viewModel;

  // 위험 영역 아코디언 — 순수 UI 상태이므로 뷰 로컬에 둔다(useProfileEditor 계약 불변).
  const [dangerOpen, setDangerOpen] = useState(false);

  const profileSectionId = useId();
  const nicknameFieldId = useId();
  const nicknameErrorId = useId();
  const dangerHeaderId = useId();
  const dangerPanelId = useId();

  // ── 게이트: 인증 확인 중 / 비로그인(딥링크) ────────────────────────────────
  /*
   * 세션 확인 중에는 "불러오는 중" 한 줄이 아니라 **들어올 화면의 골격**을 세운다.
   * 로그인 상태가 확정되는 순간 레이아웃이 그대로 채워지므로 화면이 튀지 않는다.
   */
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
          <BootBar w="120px" h="18px" aria-hidden="true" />
          <BootBar w="100%" h="56px" aria-hidden="true" />
          <BootBar w="70%" h="14px" aria-hidden="true" />
          <BootStatus role="status">{p.loading}</BootStatus>
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
              <BrandGlyph size={32} />
            </GateGlyph>
            <GateTitle>{p.loginGateTitle}</GateTitle>
            <GateSubtitle>{p.loginGateSubtitle}</GateSubtitle>
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

  const trimmed = nickname.value.trim();
  const length = [...trimmed].length;

  return (
    <ConsoleRoot>
      <TopBarSlot>
        <CommunityTopBar />
      </TopBarSlot>

      {/* ① 아이덴티티 레일 — 화면 제목(h1)과 자매 화면 전환을 함께 진다. */}
      <IdentityRail>
        <RailGlyph>
          <BrandGlyph size={32} />
        </RailGlyph>
        <div>
          <RailEyebrow>{CONSOLE_LABEL}</RailEyebrow>
          <RailTitle>{p.title}</RailTitle>
          <RailLead>{CONSOLE_LEAD}</RailLead>
        </div>
        <RailDivider />
        <RailNav aria-label={CONSOLE_LABEL}>
          <RailNavLink to="/community/profile" aria-current="page">
            {p.menuItem}
          </RailNavLink>
          <RailNavLink to="/community/my-posts">{m.menuItem}</RailNavLink>
        </RailNav>
      </IdentityRail>

      <ConsoleBody>
        {/* ② 닉네임 카드 — 유일한 편집 대상. 미리보기가 입력을 즉시 되비춘다. */}
        <Section aria-labelledby={profileSectionId}>
          <SectionHead>
            <SectionGlyph>
              <UserRoundIcon size={20} strokeWidth={1.8} />
            </SectionGlyph>
            <SectionTitle id={profileSectionId}>{p.accountSectionLabel}</SectionTitle>
          </SectionHead>

          <PreviewCard>
            <PreviewGlyph>
              <BrandGlyph size={16} />
            </PreviewGlyph>
            <PreviewTexts>
              <PreviewName>{trimmed || PREVIEW_EMPTY}</PreviewName>
              <PreviewCaption>{PREVIEW_CAPTION}</PreviewCaption>
            </PreviewTexts>
          </PreviewCard>

          <FieldBlock>
            <LabelRow>
              <FieldLabel htmlFor={nicknameFieldId}>{p.nicknameLabel}</FieldLabel>
              <Counter near={length > NICKNAME_MAX_LENGTH - 4}>
                {`${length}/${NICKNAME_MAX_LENGTH}`}
              </Counter>
            </LabelRow>
            <NicknameInput
              id={nicknameFieldId}
              value={nickname.value}
              maxLength={NICKNAME_MAX_LENGTH}
              invalid={Boolean(nickname.error)}
              aria-invalid={Boolean(nickname.error)}
              aria-describedby={nickname.error ? nicknameErrorId : undefined}
              onChange={(event) => nickname.onChange(event.target.value)}
            />
            <Hint>{p.nicknameHint}</Hint>
            <Feedback aria-live="polite">
              {/* 검사 중·통과는 상태(status)로, 중복·실패는 아래 error(alert)로 나간다.
                  저장 버튼이 잠긴 이유를 화면에 항상 남기기 위한 것 — 무음 비활성을 만들지 않는다. */}
              {nickname.availability === 'checking' ? <Hint role="status">{p.nicknameChecking}</Hint> : null}
              {nickname.availability === 'available' ? (
                <SuccessLine text={p.nicknameAvailable} />
              ) : null}
              {nickname.saved ? <SuccessLine text={p.nicknameSaved} /> : null}
              {nickname.error ? (
                <FieldError id={nicknameErrorId} role="alert">
                  <AlertIcon size={16} strokeWidth={1.8} />
                  {nickname.error}
                </FieldError>
              ) : null}
            </Feedback>
          </FieldBlock>

          <SaveRow>
            <Button
              variant="primary"
              onClick={nickname.onSave}
              loading={nickname.status === 'saving'}
              disabled={!nickname.canSave}
            >
              {p.nicknameSave}
            </Button>
          </SaveRow>
        </Section>

        {/* ③ 회원 탈퇴 — 기본 접힘. 펼치면 삭제 범위를 먼저 읽고, 그 아래에서 탈퇴 버튼이 탭 순서에 들어온다.
            "내 글"은 이 페이지가 아니라 독립 화면(/community/my-posts)에 있다 — 좌측 레일에서 이동한다. */}
        <DangerZone>
          <DangerLabelRow>{DANGER_ZONE_LABEL}</DangerLabelRow>
          <DangerAccordion>
            <DangerHeader
              type="button"
              id={dangerHeaderId}
              aria-expanded={dangerOpen}
              aria-controls={dangerPanelId}
              onClick={() => setDangerOpen((open) => !open)}
            >
              <DangerGlyph>
                <AlertIcon size={20} strokeWidth={1.8} />
              </DangerGlyph>
              <DangerHeaderText>
                <DangerTitle>{p.dangerTitle}</DangerTitle>
                <DangerCaption>{p.dangerBody}</DangerCaption>
              </DangerHeaderText>
              <Chevron open={dangerOpen}>
                <ChevronDownIcon size={20} strokeWidth={1.8} />
              </Chevron>
            </DangerHeader>

            <DangerPanel
              data-open={dangerOpen}
              role="region"
              id={dangerPanelId}
              aria-labelledby={dangerHeaderId}
            >
              <DangerPanelInner>
                <DangerPanelBody>
                  {/* 무엇이 사라지는지를 **다이얼로그 전에** 읽게 한다(다이얼로그는 재확인일 뿐이다). */}
                  <DangerScopeCard>
                    <DangerScopeIntro>{p.deleteScopeIntro}</DangerScopeIntro>
                    <DangerScopeList>
                      {p.deleteScopeItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </DangerScopeList>
                  </DangerScopeCard>
                  <DangerIrreversible>
                    <AlertIcon size={16} strokeWidth={1.8} />
                    {p.deleteIrreversible}
                  </DangerIrreversible>
                  <DangerActions>
                    <Button variant="danger" onClick={deletion.onStart}>
                      {p.dangerCta}
                    </Button>
                  </DangerActions>
                </DangerPanelBody>
              </DangerPanelInner>
            </DangerPanel>
          </DangerAccordion>
        </DangerZone>
      </ConsoleBody>

      {deletion.open ? (
        <DeleteAccountDialog
          loading={deletion.submitting}
          error={deletion.error}
          onConfirm={deletion.onConfirm}
          onCancel={deletion.onCancel}
        />
      ) : null}
    </ConsoleRoot>
  );
}

/** 성공 피드백 한 줄(체크 글리프 + 문장). 두 자리에서 같은 모양을 쓰므로 지역 부품으로 묶었다. */
function SuccessLine({ text }: { text: string }) {
  return (
    <SuccessText role="status">
      <CheckCircleIcon size={16} strokeWidth={1.8} />
      {text}
    </SuccessText>
  );
}
