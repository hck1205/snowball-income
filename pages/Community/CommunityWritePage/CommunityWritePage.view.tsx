import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import { isNaverEnabled, POST_TITLE_MAX_LENGTH, type PostCategory } from '@/shared/lib/supabase';
import { Banner, Button, FormSection, Select, ToggleField } from '@/components/common';
import { ConfirmDialog, EmptyState, SimSummaryStats } from '@/components/community';
import { RichTextEditor } from '@/components/community/RichTextEditor';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import type { CommunityWriteViewProps } from './CommunityWritePage.types';
import { countIncludedTickers, type ScenarioCandidate } from './hooks';
import {
  ActionBar,
  AttachCard,
  AttachCheck,
  AttachEmpty,
  AttachEmptyCtaLink,
  AttachInfo,
  AttachPreviewInfo,
  AttachSection,
  AttachSectionHeader,
  AttachSectionTitle,
  AttachStates,
  AttachedHint,
  Counter,
  EditorHint,
  FieldBlock,
  FieldError,
  FieldLabel,
  GateButtons,
  GateWrap,
  LabelRow,
  OptionContext,
  OptionHead,
  OptionTitle,
  OptionUnavailable,
  PageTitle,
  PickerGrid,
  ScenarioOption,
  TitleInput,
  VisibilityRow,
  VisibilityText,
  WriteForm
} from './CommunityWritePage.styled';

const w = COMMUNITY_COPY.write;

/** 프리뷰와 첨부 카드가 **같은 포맷**을 써야 "이게 그거구나"가 성립한다(§B3). */
const attachSummary = (tickerCount: number, initial: number, monthly: number) =>
  `${w.attachTickerCount(tickerCount)} · 초기 ${formatKRW(initial)} · 월 ${formatKRW(monthly)}`;

/**
 * 택1 카드 피커 — role="radiogroup". **1단계**: 카드를 고르면 바로 첨부된다(선택=첨부).
 * 첨부 여부(활성/해제)는 섹션 헤더의 "첨부" 토글이 쥔다 — 이 피커는 토글 ON일 때만 렌더된다.
 * 시각 선택 = `aria-checked` 셀렉터로만 스타일. 화살표는 포커스만 옮기고(비활성 건너뜀),
 * Space/Enter는 네이티브 button 클릭으로 선택된다.
 */
function ScenarioPicker({
  candidates,
  attachedCandidateId,
  onSelectScenario
}: {
  candidates: ScenarioCandidate[];
  /** 첨부된 후보 id(피커에 있을 때). null = 아직 아무 카드도 안 고름. */
  attachedCandidateId: string | null;
  onSelectScenario: (candidate: ScenarioCandidate) => void;
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reasonId = useId();

  // 로빙 tabindex 대상 = 첨부된 카드, 없으면 첫 선택 가능 카드.
  const attachedIndex = candidates.findIndex((c) => c.selectable && c.id === attachedCandidateId);
  const rovingIndex = attachedIndex >= 0 ? attachedIndex : candidates.findIndex((c) => c.selectable);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const direction =
        event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
            ? -1
            : 0;
      if (direction === 0) return;
      event.preventDefault();

      const n = candidates.length;
      const focusedIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
      const base = focusedIndex >= 0 ? focusedIndex : Math.max(0, rovingIndex);

      // base에서 방향대로 순회하며 **선택 가능한** 다음 카드로 포커스(순환, 비활성 건너뜀).
      for (let step = 1; step <= n; step += 1) {
        const idx = (((base + direction * step) % n) + n) % n;
        if (candidates[idx].selectable) {
          optionRefs.current[idx]?.focus();
          break;
        }
      }
    },
    [candidates, rovingIndex]
  );

  return (
    <PickerGrid role="radiogroup" aria-label={w.attachPickerGroupLabel} onKeyDown={handleKeyDown}>
      {candidates.map((candidate, index) => {
        const checked = candidate.selectable && candidate.id === attachedCandidateId;
        return (
          <ScenarioOption
            key={candidate.id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-disabled={!candidate.selectable}
            aria-describedby={candidate.selectable ? undefined : `${reasonId}-${candidate.id}`}
            tabIndex={rovingIndex === index ? 0 : -1}
            onClick={() => {
              if (candidate.selectable) onSelectScenario(candidate);
            }}
          >
            <OptionHead>
              <OptionTitle muted={!candidate.selectable}>{candidate.name}</OptionTitle>
              {checked ? <AttachCheck aria-hidden="true">✓</AttachCheck> : null}
            </OptionHead>

            {candidate.selectable ? (
              <>
                {candidate.summary ? <SimSummaryStats variant="attach" summary={candidate.summary} /> : null}
                <OptionContext>
                  {attachSummary(candidate.tickerCount, candidate.initial, candidate.monthly)}
                </OptionContext>
              </>
            ) : (
              <OptionUnavailable id={`${reasonId}-${candidate.id}`}>
                {w.attachOptionUnavailable}
                {candidate.disabledReason ? ` — ${candidate.disabledReason}` : ''}
              </OptionUnavailable>
            )}
          </ScenarioOption>
        );
      })}
    </PickerGrid>
  );
}

export default function CommunityWriteView({ viewModel }: CommunityWriteViewProps) {
  const { composer, candidates, authReady, isLoggedIn, canChooseVisibility, categoryOptions, kind, listPath, onLogin } =
    viewModel;
  const isBoard = kind === 'board';
  // 첨부 섹션 렌더 여부의 단일 출처는 composer다(훅이 저장 경로도 같은 값으로 게이트한다).
  const showAttachSection = composer.attachAllowed;
  const navigate = useNavigate();
  const [leaveOpen, setLeaveOpen] = useState(false);
  // 첨부된 후보 id(피커 선택). 첨부=후보 id, 미첨부=null. 첨부 시점의 이름/요약은 후보가 직접 들고 있다.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // "첨부" 토글 — ON이면 피커/첨부 활성, OFF면 미첨부(기본). 첨부 여부를 이 토글이 쥔다("첨부 안 함" 라디오 대체).
  const [attachEnabled, setAttachEnabled] = useState(false);
  const titleErrorId = useId();
  const bodyErrorId = useId();

  // 수정 모드: 서버 payload가 로드돼 첨부가 생기면 토글을 ON으로 켠다(요약 카드 노출).
  // detach(토글 OFF)로 payload가 null이 되면 조건이 거짓이라 다시 켜지지 않는다(토글과 안 싸움).
  // 게시판(attachAllowed=false)은 composer.attachedPayload가 항상 null이라 이 effect가 무동작이다.
  useEffect(() => {
    if (composer.attachedPayload) setAttachEnabled(true);
  }, [composer.attachedPayload]);

  // 첨부된 payload가 현재 피커 후보 중 하나인지(신규 글) — 아니면 외부 첨부(수정 모드의 서버 payload).
  const attachedCandidate =
    composer.attachedPayload !== null && candidates.status === 'ready'
      ? candidates.candidates.find((candidate) => candidate.id === selectedId && candidate.selectable) ?? null
      : null;

  // 외부 첨부(수정 모드) 표시용 시뮬 요약 — 첨부된 payload에서 클라이언트 계산(**표시 전용, 저장 아님**).
  // 게이트 early return보다 앞이어야 훅 순서가 고정된다.
  const attachedSimSummary = useMemo(
    () => (composer.attachedPayload ? buildScenarioSimSummary(composer.attachedPayload) : null),
    [composer.attachedPayload]
  );

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

  const leaveToList = () => navigate(listPath);

  const handleCancel = () => {
    if (composer.dirty) setLeaveOpen(true);
    else leaveToList();
  };

  // 1단계 첨부 — 카드 선택 즉시 커밋(선택=첨부).
  const handleAttachScenario = (candidate: ScenarioCandidate) => {
    setSelectedId(candidate.id);
    composer.attachScenario(candidate.payload);
  };

  // "첨부" 토글 — ON이면 피커만 노출(아직 미첨부, 카드를 골라야 붙는다), OFF면 미첨부로 되돌린다(detach).
  // optional 유지: OFF거나 아무 카드도 안 고르면 본문만으로 게시 가능(canSubmit 불변).
  const handleToggleAttach = (enabled: boolean) => {
    setAttachEnabled(enabled);
    if (!enabled) {
      setSelectedId(null);
      composer.detachScenario();
    }
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

  // 외부 첨부(수정 모드) 카드용 요약 숫자 — 저장 요약과 같은 included 기준으로 센다.
  const ticker = attachedSimSummary?.tickerCount ?? countIncludedTickers(composer.attachedPayload);
  const initial = composer.attachedPayload?.investmentSettings?.initialInvestment ?? 0;
  const monthly = composer.attachedPayload?.investmentSettings?.monthlyContribution ?? 0;

  const pageTitle = isBoard
    ? composer.mode === 'edit'
      ? w.titleEditBoard
      : w.titleNewBoard
    : composer.mode === 'edit'
      ? w.titleEdit
      : w.titleNew;

  return (
    <>
      <PageTitle>{pageTitle}</PageTitle>

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

        {/* 글 종류 — 자유게시판 전용(갤러리는 분류 개념이 없어 미렌더). 선택지 구성(공지=운영자 전용)은
            컨테이너가 categoryOptions로 접어 내려준다. 렌더 게이트의 단일 출처는 composer다.
            제목보다 **위**에 둔다 — 글의 성격을 먼저 정하고 그에 맞는 제목을 쓰는 순서가 자연스럽고,
            제목은 폼에서 가장 큰 타이포라 그 아래 작은 셀렉트가 오면 위계가 역행해 보인다. */}
        {composer.categoryAllowed ? (
          <FieldBlock>
            <FieldLabel htmlFor="community-category">{w.fieldCategory}</FieldLabel>
            <Select
              id="community-category"
              width="auto"
              minWidth="140px"
              value={composer.category}
              onChange={(event) => composer.setCategory(event.target.value as PostCategory)}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {w.categoryLabels[option]}
                </option>
              ))}
            </Select>
          </FieldBlock>
        ) : null}

        {/* 제목 */}
        <FieldBlock>
          <LabelRow>
            <FieldLabel htmlFor="community-title">{w.fieldTitle}</FieldLabel>
            <Counter>{w.counter(composer.title.length, POST_TITLE_MAX_LENGTH)}</Counter>
          </LabelRow>
          <TitleInput
            id="community-title"
            value={composer.title}
            maxLength={POST_TITLE_MAX_LENGTH}
            placeholder={isBoard ? w.titlePlaceholderBoard : w.titlePlaceholder}
            invalid={Boolean(composer.errors.title)}
            aria-invalid={Boolean(composer.errors.title)}
            aria-describedby={composer.errors.title ? titleErrorId : undefined}
            onChange={(event) => composer.setTitle(event.target.value)}
          />
          {composer.errors.title ? <FieldError id={titleErrorId}>{composer.errors.title}</FieldError> : null}
        </FieldBlock>

        {/* 본문 — 게시 규칙(내용/첨부 중 하나)을 에러 전에 미리 알려준다(§A3). */}
        <FieldBlock>
          <FieldLabel as="span">{w.fieldBody}</FieldLabel>
          <RichTextEditor
            initialHtml={composer.initialBodyHtml}
            ariaLabel={w.bodyAriaLabel}
            placeholder={isBoard ? w.bodyPlaceholderBoard : w.bodyPlaceholder}
            onChange={composer.handleBodyChange}
          />
          <EditorHint>{isBoard ? w.bodyRequiredHintBoard : w.bodyOrAttachHint}</EditorHint>
          {composer.errors.body ? <FieldError id={bodyErrorId}>{composer.errors.body}</FieldError> : null}
        </FieldBlock>

        {/* 시뮬레이션 — 헤더 "첨부" 토글로 활성/해제, 활성 시 1단계 택1 피커.
            자유게시판(kind='board')은 순수 텍스트 글이라 이 섹션 자체를 렌더하지 않는다. */}
        {showAttachSection ? (
          <AttachSection>
            <AttachSectionHeader>
              <AttachSectionTitle>{w.fieldAttachment}</AttachSectionTitle>
              <ToggleField
                label={w.attachToggleLabel}
                checked={attachEnabled}
                onChange={(event) => handleToggleAttach(event.target.checked)}
              />
            </AttachSectionHeader>
            <EditorHint>{w.attachSectionHint}</EditorHint>

            {attachEnabled ? (
              /* aria-live가 동작하도록 상태가 같은 부모(AttachStates) 안에서 교체된다. */
              <AttachStates aria-live="polite">
                {
                  composer.attachedPayload && !attachedCandidate ? (
                    /* 외부 첨부(수정 모드) — 피커 후보와 매칭 안 되는 첨부. 요약만 노출(해제는 헤더 토글). */
                    <AttachCard>
                      <AttachInfo>
                        {attachedSimSummary ? (
                          <SimSummaryStats variant="attach" summary={attachedSimSummary} />
                        ) : null}
                        <span>{attachSummary(ticker, initial, monthly)}</span>
                        <AttachedHint>{w.attachedHint}</AttachedHint>
                      </AttachInfo>
                    </AttachCard>
                  ) : candidates.status === 'ready' ? (
                    /* 택1 피커 — 카드 선택 즉시 첨부(1단계). */
                    <>
                      <EditorHint>{w.attachPickerHeading}</EditorHint>
                      <ScenarioPicker
                        candidates={candidates.candidates}
                        attachedCandidateId={attachedCandidate?.id ?? null}
                        onSelectScenario={handleAttachScenario}
                      />
                      {attachedCandidate ? <AttachedHint>{w.attachedHint}</AttachedHint> : null}
                    </>
                  ) : candidates.status === 'empty' ? (
                    /* 첨부할 시나리오 없음: 실패할 버튼 대신 길을 보여준다 */
                    <AttachEmpty>
                      <AttachPreviewInfo>
                        <strong>{w.attachEmptyTitle}</strong>
                        <span>{w.attachEmptyBody}</span>
                      </AttachPreviewInfo>
                      <AttachEmptyCtaLink to="/">{w.attachEmptyCta}</AttachEmptyCtaLink>
                    </AttachEmpty>
                  ) : null /* loading — 빈 상태 깜빡임 방지로 렌더 없음 */}
              </AttachStates>
            ) : null}
            {composer.errors.attach ? <FieldError>{composer.errors.attach}</FieldError> : null}
          </AttachSection>
        ) : null}

        {/* 게시 설정 — 공개 범위만 남은 섹션이라, 그 유일한 필드가 숨겨질 때는 섹션(제목·테두리)을
            통째로 렌더하지 않는다(빈 껍데기 금지). 갤러리는 항상 노출, 게시판은 운영자만.
            숨겨진 경우 신규 글은 공개 고정, 수정 글은 서버에서 온 기존 값이 그대로 보존된다. */}
        {canChooseVisibility ? (
          <FormSection title={w.sectionPublish}>
            {/* 공개 범위 — "비공개" 스위치 + 상태 안내를 **한 행에 나란히**. 기본 off=공개, on=비공개. */}
            <FieldBlock>
              <VisibilityRow>
                <ToggleField
                  label="비공개"
                  checked={!composer.isPublic}
                  onChange={(event) => composer.setIsPublic(!event.target.checked)}
                />
                <VisibilityText>{composer.isPublic ? w.visibilityPublic : w.visibilityPrivate}</VisibilityText>
              </VisibilityRow>
            </FieldBlock>
          </FormSection>
        ) : null}

        <ActionBar>
          <Button variant="ghost" onClick={handleCancel} disabled={composer.submitting}>
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
