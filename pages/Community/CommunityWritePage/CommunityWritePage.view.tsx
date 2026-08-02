import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import { Banner, Button } from '@/components/common';
import { ConfirmDialog, EmptyState } from '@/components/community';
import { CommunityTopBar } from '@/pages/Community/components';
import type { CommunityWriteViewProps } from './CommunityWritePage.types';
import type { ScenarioCandidate } from './hooks';
import {
  AttachScenarioSection,
  PublishSettingsSection,
  WriteFormFields,
  WriteLoginGate
} from './components';
import { ActionBar, PageTitle, WriteForm, WriteShell } from './CommunityWritePage.styled';

const w = COMMUNITY_COPY.write;

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
    return <WriteLoginGate onLogin={onLogin} />;
  }

  if (composer.mode === 'edit') {
    if (composer.loadState === 'loading') return <EmptyState title="불러오는 중…" />;
    if (composer.loadState === 'forbidden')
      return <EmptyState title="이 글을 수정할 권한이 없습니다" subtitle={COMMUNITY_COPY.detail.notFoundTitle} />;
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

  const pageTitle = isBoard
    ? composer.mode === 'edit'
      ? w.titleEditBoard
      : w.titleNewBoard
    : composer.mode === 'edit'
      ? w.titleEdit
      : w.titleNew;

  return (
    <>
      {/* 🔴 상단 바·제목·폼이 **같은 좌우 경계**를 갖는다 — 그전에는 "← 목록"만 전폭이라 왼쪽 끝에
          혼자 붙어 제목 줄과 어긋나 보였다(2026-08-02 사용자 지적).
          상세 페이지가 2026-07-28 에 `DetailShell` 로 해결한 것과 **같은 처방**이다.
          ⚠ 확인 대화상자는 이 껍데기 **밖**이다 — 포털로 뜨는 오버레이라 폭 제한과 무관하다. */}
      <WriteShell>
        <CommunityTopBar />
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

        <WriteFormFields composer={composer} isBoard={isBoard} categoryOptions={categoryOptions} />

        {/* 시뮬레이션 — 헤더 "첨부" 토글로 활성/해제, 활성 시 1단계 택1 피커.
            자유게시판(kind='board')은 순수 텍스트 글이라 이 섹션 자체를 렌더하지 않는다. */}
        {showAttachSection ? (
          <AttachScenarioSection
            attachEnabled={attachEnabled}
            onToggleAttach={handleToggleAttach}
            attachedPayload={composer.attachedPayload}
            attachedCandidate={attachedCandidate}
            attachedSimSummary={attachedSimSummary}
            candidates={candidates}
            onSelectScenario={handleAttachScenario}
            error={composer.errors.attach}
          />
        ) : null}

        {/* 게시 설정 — 공개 범위만 남은 섹션이라, 그 유일한 필드가 숨겨질 때는 섹션(제목·테두리)을
            통째로 렌더하지 않는다(빈 껍데기 금지). 갤러리는 항상 노출, 게시판은 운영자만.
            숨겨진 경우 신규 글은 공개 고정, 수정 글은 서버에서 온 기존 값이 그대로 보존된다. */}
        {canChooseVisibility ? (
          <PublishSettingsSection isPublic={composer.isPublic} onIsPublicChange={composer.setIsPublic} />
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
      </WriteShell>

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
