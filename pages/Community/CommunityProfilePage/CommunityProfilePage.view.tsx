import { useId, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Button } from '@/components/common';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  DeleteAccountDialog,
  EmptyState
} from '@/components/community';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { NICKNAME_MAX_LENGTH } from '@/shared/lib/community';
import { isNaverEnabled } from '@/shared/lib/supabase';
import type { CommunityProfileViewProps } from './CommunityProfilePage.types';
import {
  Chevron,
  Counter,
  DangerAccordion,
  DangerActions,
  DangerCaption,
  DangerHeader,
  DangerHeaderText,
  DangerPanel,
  DangerPanelBody,
  DangerPanelInner,
  DangerTitle,
  Feedback,
  FieldBlock,
  FieldError,
  FieldLabel,
  GateButtons,
  GateWrap,
  Hint,
  LabelRow,
  NicknameInput,
  PageTitle,
  ProfileMain,
  SaveRow,
  Section,
  SectionTitle,
  SuccessText
} from './CommunityProfilePage.styled';

const p = COMMUNITY_COPY.profile;

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
  if (!authReady) {
    return <EmptyState title={p.loading} />;
  }

  if (!isLoggedIn) {
    return (
      <GateWrap>
        <EmptyState title={p.loginGateTitle} subtitle={p.loginGateSubtitle} />
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
      </GateWrap>
    );
  }

  return (
    <ProfileMain>
      <PageTitle>{p.title}</PageTitle>

      {/* ① 닉네임 카드 — 유일한 편집 대상 */}
      <Section aria-labelledby={profileSectionId}>
        <SectionTitle id={profileSectionId}>{p.accountSectionLabel}</SectionTitle>

        <FieldBlock>
          <LabelRow>
            <FieldLabel htmlFor={nicknameFieldId}>{p.nicknameLabel}</FieldLabel>
            <Counter>{`${[...nickname.value.trim()].length}/${NICKNAME_MAX_LENGTH}`}</Counter>
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
            {nickname.saved ? (
              <SuccessText role="status">
                <CheckCircleIcon size={16} />
                {p.nicknameSaved}
              </SuccessText>
            ) : null}
            {nickname.error ? (
              <FieldError id={nicknameErrorId} role="alert">
                {nickname.error}
              </FieldError>
            ) : null}
          </Feedback>
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
        </FieldBlock>
      </Section>

      {/* ② 회원 탈퇴 아코디언 — 기본 접힘. 펼치면 탈퇴 버튼이 탭 순서/화면에 들어온다. */}
      <DangerAccordion>
        <DangerHeader
          type="button"
          id={dangerHeaderId}
          aria-expanded={dangerOpen}
          aria-controls={dangerPanelId}
          onClick={() => setDangerOpen((open) => !open)}
        >
          <DangerHeaderText>
            <DangerTitle>{p.dangerTitle}</DangerTitle>
            <DangerCaption>{p.dangerBody}</DangerCaption>
          </DangerHeaderText>
          <Chevron open={dangerOpen}>
            <ChevronDownIcon size={20} />
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
              <DangerActions>
                <Button variant="danger" onClick={deletion.onStart}>
                  {p.dangerCta}
                </Button>
              </DangerActions>
            </DangerPanelBody>
          </DangerPanelInner>
        </DangerPanel>
      </DangerAccordion>

      {deletion.open ? (
        <DeleteAccountDialog
          loading={deletion.submitting}
          error={deletion.error}
          onConfirm={deletion.onConfirm}
          onCancel={deletion.onCancel}
        />
      ) : null}
    </ProfileMain>
  );
}
