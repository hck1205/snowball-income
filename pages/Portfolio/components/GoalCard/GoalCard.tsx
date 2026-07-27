import { useId } from 'react';
import { CircleCheck, Info, Target } from 'lucide-react';
import { Button, StatTile } from '@/components/common';
import { TARGET_MONTHLY_DIVIDEND_MAX } from '@/shared/constants';
import { PORTFOLIO_COPY } from '../../copy';
import { GoalMeter } from '../GoalMeter';
import { GoalSetupPanel } from '../GoalSetupPanel';
import type { GoalCardProps } from './GoalCard.types';
import {
  ActionRow,
  BasisNote,
  BasisNoteText,
  CardHead,
  CardRoot,
  CardTitle,
  StatusLine,
  TileGrid
} from './GoalCard.styled';

const copy = PORTFOLIO_COPY;

/**
 * 내 포트폴리오의 **두 번째 카드** — 요약(지금 받는 배당)과 보유 목록 사이.
 *
 * 순수 표시 컴포넌트다: 렌더 여부·값·문장은 전부 `buildPortfolioGoalCardModel` 이 정하고
 * (모델이 `null` 이면 호출부가 이 컴포넌트를 아예 렌더하지 않는다) 여기서는 그리기만 한다.
 *
 * ⚠ 이 카드에는 `emphasis="hero"` 타일이 없다 — 페이지의 유일한 hero 는 요약 카드의 `월 배당(세후)`다.
 * 카드 안 시각 주인공은 `GoalMeter`(StatTile 이 아닌 자체 블록)가 맡아 hero 규칙과 충돌하지 않는다.
 */
export default function GoalCard({
  model,
  pickerId,
  isPickerOpen,
  onOpenTargetSetup,
  onCommitTarget,
  onOpenSimulator,
  onAddHolding
}: GoalCardProps) {
  const titleId = useId();
  const { basisNote, meter, statusLine } = model;

  return (
    <CardRoot aria-labelledby={titleId} aria-busy={model.isLoading || undefined}>
      <CardHead>
        <CardTitle id={titleId}>{copy.goal.title}</CardTitle>
        {model.showEditTarget ? (
          <Button
            type="button"
            size="sm"
            /* 이미 달성 상태에서는 다음 행동이 "목표 올리기"라 한 단계 강조한다. */
            variant={model.emphasizeEditTarget ? 'secondary' : 'ghost'}
            onClick={onOpenTargetSetup}
          >
            {copy.goal.editTarget}
          </Button>
        ) : null}
      </CardHead>

      {model.showSetupPanel ? (
        <GoalSetupPanel
          title={copy.goal.setup.title}
          body={copy.goal.setup.body}
          pickLead={copy.goal.setup.pickLead}
          chipsLabel={copy.goal.setup.chipsLabel}
          inputLabel={copy.goal.setup.inputLabel}
          inputPlaceholder={copy.goal.setup.inputPlaceholder}
          invalidMessage={copy.goal.setup.inputInvalid(TARGET_MONTHLY_DIVIDEND_MAX / 10_000)}
          submitLabel={copy.goal.setup.submit}
          onCommitTarget={onCommitTarget}
        />
      ) : (
        <>
          <GoalMeter
            percent={meter?.percent ?? null}
            valueText={meter ? copy.goal.meter.value(meter.percent) : null}
            label={copy.goal.meter.label}
            ariaLabel={copy.goal.meter.ariaLabel}
            emptyValue={copy.summary.tiles.empty}
            sentence={meter?.sentence ?? null}
          />

          <TileGrid>
            {model.tiles.map((tile) => (
              <StatTile key={tile.label} label={tile.label} value={tile.value} hint={tile.hint} />
            ))}
          </TileGrid>

          {/* 두 숫자가 만나는 자리 바로 아래 — 경고가 아니라 안내라 role 을 주지 않는다. */}
          {basisNote ? (
            <BasisNote>
              <Info size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              <BasisNoteText>{basisNote.text}</BasisNoteText>
              {basisNote.actionLabel ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-expanded={isPickerOpen}
                  aria-controls={pickerId}
                  onClick={onAddHolding}
                >
                  {basisNote.actionLabel}
                </Button>
              ) : null}
            </BasisNote>
          ) : null}

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

          {/* D·E′ 모두 **프리필 없이** 시뮬레이터로 — 프리필은 위 타일이 보여 준 ETA 의 근거 시나리오를 덮는다. */}
          {model.actionLabel ? (
            <ActionRow>
              <Button type="button" variant="secondary" onClick={onOpenSimulator}>
                {model.actionLabel}
              </Button>
            </ActionRow>
          ) : null}
        </>
      )}
    </CardRoot>
  );
}
