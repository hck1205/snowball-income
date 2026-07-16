import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';
import { SCENARIO_DESCRIPTION_MAX_LENGTH, SCENARIO_TITLE_MAX_LENGTH } from '@/shared/lib/supabase';
import { Banner, Button, FormSection, ToggleField } from '@/components/common';
import { ConfirmDialog, EmptyState } from '@/components/community';
import { RichTextEditor } from '@/components/community/RichTextEditor';
import type { CommunityWriteViewProps } from './CommunityWritePage.types';
import {
  ActionBar,
  AttachCard,
  AttachEmpty,
  AttachInfo,
  Counter,
  DescriptionTextarea,
  FieldBlock,
  FieldError,
  FieldLabel,
  GateButtons,
  GateWrap,
  LabelRow,
  ProviderButton,
  TitleInput,
  VisibilityRow,
  VisibilityText,
  WriteForm
} from './CommunityWritePage.styled';

const w = COMMUNITY_COPY.write;

export default function CommunityWriteView({ viewModel }: CommunityWriteViewProps) {
  const { composer, authReady, isLoggedIn, onLogin } = viewModel;
  const navigate = useNavigate();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const titleErrorId = useId();
  const bodyErrorId = useId();

  // 하드 리로드/탭 닫기 이탈 방지.
  useEffect(() => {
    if (!composer.dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [composer.dirty]);

  const leaveToList = () => navigate('/community');

  const handleCancel = () => {
    if (composer.dirty) setLeaveOpen(true);
    else leaveToList();
  };

  // ── 게이트: 인증 확인 중 / 비로그인 / 수정 로드 상태 ──────────────────────────
  if (!authReady) {
    return <EmptyState title="불러오는 중…" />;
  }

  if (!isLoggedIn) {
    return (
      <GateWrap>
        <EmptyState title={w.loginGateTitle} subtitle={w.loginGateSubtitle} />
        <GateButtons>
          <ProviderButton type="button" onClick={() => onLogin('google')}>
            {COMMUNITY_COPY.login.google}
          </ProviderButton>
          <ProviderButton type="button" onClick={() => onLogin('kakao')}>
            {COMMUNITY_COPY.login.kakao}
          </ProviderButton>
        </GateButtons>
      </GateWrap>
    );
  }

  if (composer.mode === 'edit') {
    if (composer.loadState === 'loading') return <EmptyState title="불러오는 중…" />;
    if (composer.loadState === 'forbidden')
      return <EmptyState title="이 글을 수정할 권한이 없어요" subtitle={COMMUNITY_COPY.detail.notFoundTitle} />;
    if (composer.loadState === 'notfound')
      return (
        <EmptyState
          title={COMMUNITY_COPY.detail.notFoundTitle}
          action={
            <Button variant="secondary" onClick={leaveToList}>
              {COMMUNITY_COPY.detail.notFoundCta}
            </Button>
          }
        />
      );
    if (composer.loadState === 'error')
      return (
        <Banner tone="danger" role="alert" title={COMMUNITY_COPY.detail.errorTitle}>
          {COMMUNITY_COPY.detail.errorBody}
        </Banner>
      );
  }

  const ticker = composer.attachedPayload?.portfolio?.tickerProfiles?.length ?? 0;
  const initial = composer.attachedPayload?.investmentSettings?.initialInvestment ?? 0;
  const monthly = composer.attachedPayload?.investmentSettings?.monthlyContribution ?? 0;

  return (
    <>
      <WriteForm
        onSubmit={(event) => {
          event.preventDefault();
          void composer.submit();
        }}
      >
        {composer.submitError ? (
          <Banner tone="danger" role="alert">
            {w.saveFailed}
          </Banner>
        ) : null}

        {/* 제목 */}
        <FieldBlock>
          <LabelRow>
            <FieldLabel htmlFor="community-title">{w.fieldTitle}</FieldLabel>
            <Counter>{w.counter(composer.title.length, SCENARIO_TITLE_MAX_LENGTH)}</Counter>
          </LabelRow>
          <TitleInput
            id="community-title"
            value={composer.title}
            maxLength={SCENARIO_TITLE_MAX_LENGTH}
            placeholder={w.fieldTitle}
            invalid={Boolean(composer.errors.title)}
            aria-invalid={Boolean(composer.errors.title)}
            aria-describedby={composer.errors.title ? titleErrorId : undefined}
            onChange={(event) => composer.setTitle(event.target.value)}
          />
          {composer.errors.title ? <FieldError id={titleErrorId}>{composer.errors.title}</FieldError> : null}
        </FieldBlock>

        {/* 본문 */}
        <FieldBlock>
          <FieldLabel as="span">{w.fieldBody}</FieldLabel>
          <RichTextEditor
            initialHtml={composer.initialBodyHtml}
            ariaLabel={w.bodyAriaLabel}
            placeholder={w.bodyPlaceholder}
            onChange={composer.handleBodyChange}
          />
          {composer.errors.body ? <FieldError id={bodyErrorId}>{composer.errors.body}</FieldError> : null}
        </FieldBlock>

        {/* 시뮬레이션 첨부 */}
        <FormSection title={w.fieldAttachment}>
          {composer.attachedPayload ? (
            <AttachCard>
              <AttachInfo>
                <strong>{w.attachTickerCount(ticker)}</strong>
                <span>
                  {`초기 ${formatKRW(initial)} · 월 ${formatKRW(monthly)}`}
                </span>
              </AttachInfo>
              <Button variant="ghost" size="sm" onClick={composer.detachScenario}>
                {w.attachDetach}
              </Button>
            </AttachCard>
          ) : (
            <AttachEmpty>
              <span>{w.attachEmpty}</span>
              <Button variant="secondary" size="sm" onClick={() => void composer.attachCurrentScenario()}>
                {w.attachButton}
              </Button>
            </AttachEmpty>
          )}
          {composer.errors.attach ? <FieldError>{composer.errors.attach}</FieldError> : null}
        </FormSection>

        {/* 요약 */}
        <FieldBlock>
          <LabelRow>
            <FieldLabel htmlFor="community-description">{w.fieldDescription}</FieldLabel>
            <Counter>{w.counter(composer.description.length, SCENARIO_DESCRIPTION_MAX_LENGTH)}</Counter>
          </LabelRow>
          <DescriptionTextarea
            id="community-description"
            value={composer.description}
            maxLength={SCENARIO_DESCRIPTION_MAX_LENGTH}
            placeholder={w.descriptionPlaceholder}
            onChange={(event) => composer.setDescription(event.target.value)}
          />
        </FieldBlock>

        {/* 공개 범위 — "비공개" 스위치. 기본 off=공개, on=비공개. */}
        <FieldBlock>
          <VisibilityRow>
            <ToggleField
              label="비공개"
              checked={!composer.isPublic}
              onChange={(event) => composer.setIsPublic(!event.target.checked)}
            />
          </VisibilityRow>
          <VisibilityText>{composer.isPublic ? w.visibilityPublic : w.visibilityPrivate}</VisibilityText>
        </FieldBlock>

        <ActionBar>
          <Button variant="secondary" onClick={handleCancel} disabled={composer.submitting}>
            {w.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={composer.submitting}
            disabled={!composer.canSubmit}
          >
            {composer.mode === 'edit' ? w.submitEdit : w.submitNew}
          </Button>
        </ActionBar>
      </WriteForm>

      {leaveOpen ? (
        <ConfirmDialog
          title={w.leaveConfirmTitle}
          body={w.leaveConfirmBody}
          confirmLabel={w.leaveConfirmLeave}
          cancelLabel={w.leaveConfirmStay}
          danger
          onConfirm={leaveToList}
          onCancel={() => setLeaveOpen(false)}
        />
      ) : null}
    </>
  );
}
