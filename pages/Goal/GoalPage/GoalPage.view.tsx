import { useId } from 'react';
import { CircleCheck, Target } from 'lucide-react';
import { Banner, Button, StatTile } from '@/components/common';
import { TARGET_MONTHLY_DIVIDEND_MAX } from '@/shared/constants';
import { GOAL_COPY } from '../copy';
import { GoalMeter, GoalSetupPanel } from '../components';
import type { GoalViewProps } from './GoalPage.types';
import {
  ActionRow,
  AsOfLine,
  CardHead,
  CardTitle,
  ConditionRow,
  ConditionTerm,
  ConditionValue,
  ConditionsDetails,
  ConditionsList,
  ConditionsNote,
  ConditionsSummary,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  FootNote,
  FootNoteCard,
  FootNoteTitle,
  GoalCard,
  HeroIconBadge,
  HeroLede,
  HeroSlot,
  HeroTitle,
  HeroTitleRow,
  LiveRegion,
  PageHero,
  PageStack,
  PreviewBlock,
  PreviewItem,
  PreviewLabel,
  PreviewList,
  StatusLine,
  TileGrid
} from './GoalPage.styled';

const copy = GOAL_COPY;

/**
 * 순수 뷰 — 상태를 갖지 않고 화면 모델만 그린다.
 *
 * 상태 7종이 **전부 명시적으로** 그려진다(빈 화면 금지): 로딩은 골격 + '—', 포트폴리오 없음과
 * 계산 불가는 카드 자리를 빈 상태가 **대체**하고(카드 안 카드 금지), 목표 미설정은 달성률·예상 달성·
 * 상태 문장을 아예 렌더하지 않는다(0원 목표를 "달성"이라 말하지 않기 위한 구조적 방어).
 */
export default function GoalPageView({
  viewModel,
  liveMessage,
  onOpenSimulator,
  onOpenTargetSetup,
  onCommitTarget
}: GoalViewProps) {
  const cardTitleId = useId();
  const emptyTitleId = useId();

  const { conditions, current, eta, meter, remaining, statusLine } = viewModel;
  const isError = viewModel.errorMessage !== null;

  return (
    <PageStack>
      <PageHero>
        <HeroTitleRow>
          <HeroIconBadge>
            <Target size={20} strokeWidth={1.8} aria-hidden focusable={false} />
          </HeroIconBadge>
          <HeroTitle>{copy.hero.title}</HeroTitle>
        </HeroTitleRow>
        <HeroLede>{copy.hero.lede}</HeroLede>
        <AsOfLine>{viewModel.asOfLine}</AsOfLine>
      </PageHero>

      <LiveRegion role="status" aria-live="polite">
        {liveMessage}
      </LiveRegion>

      {viewModel.showEmptyState ? (
        <EmptyStateCard aria-labelledby={emptyTitleId}>
          {viewModel.errorMessage ? (
            /* 경고이지 에러 팝업이 아니다 — 하던 낭독을 끊지 않는 role="status". */
            <Banner tone="warning" role="status">
              {viewModel.errorMessage}
            </Banner>
          ) : null}

          <EmptyTitle id={emptyTitleId}>{isError ? copy.error.title : copy.empty.title}</EmptyTitle>
          {isError ? null : <EmptyBody>{copy.empty.body}</EmptyBody>}

          <ActionRow>
            <Button type="button" variant="primary" onClick={onOpenSimulator}>
              {isError ? copy.error.cta : copy.empty.cta}
            </Button>
          </ActionRow>

          {isError ? null : (
            /* 장식 — 낭독되지 않는다. 라벨을 반드시 함께 그려 로딩 골격과 눈으로 구분되게 한다. */
            <PreviewBlock aria-hidden>
              <PreviewLabel>{copy.empty.previewLabel}</PreviewLabel>
              <PreviewList>
                {copy.empty.previewItems.map((item) => (
                  <PreviewItem key={item}>{item}</PreviewItem>
                ))}
              </PreviewList>
            </PreviewBlock>
          )}
        </EmptyStateCard>
      ) : (
        <GoalCard aria-labelledby={cardTitleId} aria-busy={viewModel.isLoading || undefined}>
          <CardHead>
            <CardTitle id={cardTitleId}>{copy.card.title}</CardTitle>
            {viewModel.showEditTarget ? (
              <Button
                type="button"
                size="sm"
                /* 이미 달성 상태에서는 다음 행동이 "목표 올리기"라 한 단계 강조한다. */
                variant={viewModel.emphasizeEditTarget ? 'secondary' : 'ghost'}
                onClick={onOpenTargetSetup}
              >
                {copy.card.editTarget}
              </Button>
            ) : null}
          </CardHead>

          <HeroSlot>
            {viewModel.showSetupPanel ? (
              <GoalSetupPanel
                title={copy.setup.title}
                body={copy.setup.body}
                pickLead={copy.setup.pickLead}
                chipsLabel={copy.setup.chipsLabel}
                inputLabel={copy.setup.inputLabel}
                inputPlaceholder={copy.setup.inputPlaceholder}
                invalidMessage={copy.setup.inputInvalid(TARGET_MONTHLY_DIVIDEND_MAX / 10_000)}
                submitLabel={copy.setup.submit}
                ctaLabel={copy.setup.cta}
                onCommitTarget={onCommitTarget}
                onStart={onOpenTargetSetup}
              />
            ) : (
              <StatTile emphasis="hero" label={copy.tiles.target} value={viewModel.target ?? copy.tiles.empty} />
            )}
          </HeroSlot>

          {/* 목표가 없으면 달성률 자체가 성립하지 않는다 — 미터를 그리지 않는다. */}
          {viewModel.showSetupPanel ? null : (
            <GoalMeter
              percent={meter?.percent ?? null}
              valueText={meter ? copy.meter.value(meter.percent) : null}
              label={copy.meter.label}
              ariaLabel={copy.meter.ariaLabel}
              emptyValue={copy.tiles.empty}
              sentence={meter?.sentence ?? null}
            />
          )}

          <TileGrid>
            <StatTile label={copy.tiles.current} value={current.value} hint={current.hint ?? undefined} />
            {/* 달성률 옆의 "그래서 얼마가 더 필요한가" — 이미 넘어선 상태에서는 자리 자체가 없다. */}
            {remaining || viewModel.isLoading ? (
              <StatTile
                label={copy.tiles.remaining}
                value={remaining?.value ?? copy.tiles.empty}
                hint={remaining?.hint ?? undefined}
              />
            ) : null}
            {eta || viewModel.isLoading ? (
              <StatTile label={copy.tiles.eta} value={eta?.value ?? copy.tiles.empty} hint={eta?.hint ?? undefined} />
            ) : null}
          </TileGrid>

          {statusLine ? (
            <StatusLine tone={statusLine.tone}>
              {statusLine.tone === 'success' ? (
                <CircleCheck size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              ) : (
                <Target size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              )}
              {statusLine.text}
            </StatusLine>
          ) : null}

          {viewModel.showChangeConditions ? (
            <ActionRow>
              <Button type="button" variant="secondary" onClick={onOpenSimulator}>
                {copy.status.changeConditions}
              </Button>
            </ActionRow>
          ) : null}
        </GoalCard>
      )}

      {/* 조건 요약 — 카드 밖 부속 정보(박스를 새로 만들지 않고 왼쪽 선으로만 구분). 계산이 성립할 때만. */}
      {conditions ? (
        <ConditionsDetails>
          <ConditionsSummary>{copy.conditions.summary}</ConditionsSummary>
          <ConditionsList>
            {conditions.map((row) => (
              <ConditionRow key={row.label}>
                <ConditionTerm>{row.label}</ConditionTerm>
                <ConditionValue>{row.value}</ConditionValue>
              </ConditionRow>
            ))}
          </ConditionsList>
          <ConditionsNote>{copy.conditions.currencyNote}</ConditionsNote>
        </ConditionsDetails>
      ) : null}

      <FootNoteCard>
        <FootNoteTitle>{copy.footnote.title}</FootNoteTitle>
        <FootNote>{copy.footnote.estimate}</FootNote>
        <FootNote>{copy.footnote.notAdvice}</FootNote>
      </FootNoteCard>
    </PageStack>
  );
}
