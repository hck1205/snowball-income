import { useCallback, useEffect, useId, useRef } from 'react';
import type { MouseEvent } from 'react';
import { ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common/Modal';
import { formatRelativeTime } from '@/shared/lib/community';
import type { CloudWorkspaceSummary } from '@/jotai/snowball/cloud';
import type { CloudReconcileModalProps } from './CloudReconcileModal.types';
import {
  ChoiceButton,
  ChoiceHint,
  ChoiceList,
  ChoiceTitleRow,
  CompareCol,
  CompareCount,
  CompareHead,
  CompareLabel,
  CompareMeta,
  CompareRow,
  RecentTag,
  RecommendBadge,
  ResolveError,
  TabChip,
  TabChipList
} from './CloudReconcileModal.styled';

/** 칩으로 보여줄 탭 이름 최대 개수 — 넘치면 "+N개 더"로 접는다. */
const MAX_TAB_CHIPS = 6;

const describeEditedAt = (lastEditedAt: number | null, now: Date): string => {
  if (lastEditedAt === null) return '편집 시각 정보 없음';
  const relative = formatRelativeTime(new Date(lastEditedAt).toISOString(), now);
  return relative ? `마지막 편집 ${relative}` : '편집 시각 정보 없음';
};

/** 한 측 요약 카드(이 기기 / 클라우드). isRecent면 "최근 편집" 태그를 단다. */
function CompareColumn({
  label,
  summary,
  isRecent,
  now
}: {
  label: string;
  summary: CloudWorkspaceSummary;
  isRecent: boolean;
  now: Date;
}) {
  const shownNames = summary.tabNames.slice(0, MAX_TAB_CHIPS);
  const overflow = summary.tabNames.length - shownNames.length;
  return (
    <CompareCol>
      <CompareHead>
        <CompareLabel>{label}</CompareLabel>
        {isRecent ? <RecentTag>최근 편집</RecentTag> : null}
      </CompareHead>
      <CompareCount>
        시나리오 탭 <strong>{summary.tabCount}개</strong>
      </CompareCount>
      {summary.tabNames.length > 0 ? (
        <TabChipList aria-label={`${label} 탭 목록`}>
          {shownNames.map((name, index) => (
            <TabChip key={`${name}-${index}`} title={name}>
              {name}
            </TabChip>
          ))}
          {overflow > 0 ? <TabChip>+{overflow}개 더</TabChip> : null}
        </TabChipList>
      ) : null}
      <CompareMeta>{describeEditedAt(summary.lastEditedAt, now)}</CompareMeta>
    </CompareCol>
  );
}

/**
 * 세션 시작 시 감지된 **디바이스↔클라우드 충돌**을 사용자가 3택(이 기기/클라우드/둘 다 합치기)으로
 * 화해하는 모달. 뒤엔 이미 이 기기 상태가 보이고, 여기선 어느 쪽으로 맞출지만 고른다.
 *
 * - 표시 정보는 **경량**이다 — 각 측 탭 개수·이름 목록·마지막 편집 시각(상대표기)만. 무거운 시뮬 계산 없음.
 * - **닫기(Esc/바깥클릭)=이연**: `onDefer`. 무음 화해 금지 — 앱은 이 기기 상태를 유지하고 헤더가 표면화한다.
 * - **둘 다 합치기(블렌드)** 는 비파괴라 기본 권장 + 기본 포커스. 파괴적 선택지는 보조 설명을 danger 톤으로 경고.
 *
 * 포털/렌더 게이트는 호출부(MainLeftPanel)가 소유한다 — 이 컴포넌트는 열렸을 때만 마운트된다.
 */
export default function CloudReconcileModal({
  summary,
  blendTabCount,
  now = new Date(),
  isResolving = false,
  hasResolveFailed = false,
  onUseDevice,
  onUseCloud,
  onBlend,
  onDefer
}: CloudReconcileModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const blendButtonRef = useRef<HTMLButtonElement | null>(null);

  // 비파괴(블렌드)에 기본 포커스 — 첫 마운트엔 커밋 후 ref가 잡히므로 effect 안에서 읽는다(초기 null 함정 회피).
  useEffect(() => {
    blendButtonRef.current?.focus();
  }, []);

  // Esc = 이연(모달 닫기). 문서 레벨로 잡아 어느 자식에 포커스가 있어도 동작한다.
  // 화해 IO가 도는 중에는 닫지 않는다 — 진행 중 결과(성공/실패)를 못 보고 사라지는 걸 막는다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isResolving) onDefer();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isResolving, onDefer]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      // 패널 내부 클릭은 무시하고, 백드롭 자체를 눌렀을 때만 이연으로 닫는다.
      if (event.target !== event.currentTarget) return;
      if (isResolving) return;
      onDefer();
    },
    [isResolving, onDefer]
  );

  // 두 측 모두 편집 시각을 알고 서로 다를 때만 "최근 편집"을 판정한다(한쪽만 알면 비교 불가 → 태그 없음).
  const deviceEditedAt = summary.device.lastEditedAt;
  const cloudEditedAt = summary.cloud.lastEditedAt;
  const bothKnown = deviceEditedAt !== null && cloudEditedAt !== null && deviceEditedAt !== cloudEditedAt;
  const deviceIsRecent = bothKnown && deviceEditedAt! > cloudEditedAt!;
  const cloudIsRecent = bothKnown && cloudEditedAt! > deviceEditedAt!;

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClick={handleBackdropClick}
    >
      <ModalPanel>
        <ModalTitle id={titleId}>이 기기와 클라우드에 저장된 내용이 다릅니다</ModalTitle>
        <ModalBody id={bodyId}>
          양쪽 모두 저장된 시나리오가 있어요. 어느 쪽을 기준으로 맞출지 골라 주세요.
        </ModalBody>

        <CompareRow>
          <CompareColumn label="이 기기" summary={summary.device} isRecent={deviceIsRecent} now={now} />
          <CompareColumn label="클라우드" summary={summary.cloud} isRecent={cloudIsRecent} now={now} />
        </CompareRow>

        {hasResolveFailed ? (
          <ResolveError role="alert">
            클라우드에 반영하지 못했습니다. 이 기기의 데이터는 그대로 있어요 — 연결을 확인한 뒤 다시 선택해
            주세요.
          </ResolveError>
        ) : null}

        <ChoiceList>
          <ChoiceButton ref={blendButtonRef} type="button" recommended disabled={isResolving} onClick={onBlend}>
            <ChoiceTitleRow>
              둘 다 합치기
              <RecommendBadge>추천</RecommendBadge>
            </ChoiceTitleRow>
            <ChoiceHint>
              합치면 {blendTabCount}개 탭 · 탭이 10개를 넘을 수 있어요 · 아무것도 지우지 않습니다
            </ChoiceHint>
          </ChoiceButton>

          <ChoiceButton type="button" disabled={isResolving} onClick={onUseDevice}>
            <ChoiceTitleRow>이 기기 데이터로 맞추기</ChoiceTitleRow>
            <ChoiceHint destructive>클라우드의 다른 탭은 사라집니다</ChoiceHint>
          </ChoiceButton>

          <ChoiceButton type="button" disabled={isResolving} onClick={onUseCloud}>
            <ChoiceTitleRow>클라우드 데이터로 맞추기</ChoiceTitleRow>
            <ChoiceHint destructive>이 기기의 다른 탭은 사라집니다</ChoiceHint>
          </ChoiceButton>
        </ChoiceList>
      </ModalPanel>
    </ModalBackdrop>
  );
}
