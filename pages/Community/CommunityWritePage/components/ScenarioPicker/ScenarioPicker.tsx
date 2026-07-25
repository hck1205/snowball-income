import { useCallback, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SimSummaryStats } from '@/components/community';
import { attachSummary } from '../../CommunityWritePage.utils';
import type { ScenarioPickerProps } from './ScenarioPicker.types';
import {
  AttachCheck,
  OptionContext,
  OptionHead,
  OptionTitle,
  OptionUnavailable,
  PickerGrid,
  ScenarioOption
} from './ScenarioPicker.styled';

const w = COMMUNITY_COPY.write;

/**
 * 택1 카드 피커 — role="radiogroup". **1단계**: 카드를 고르면 바로 첨부된다(선택=첨부).
 * 첨부 여부(활성/해제)는 섹션 헤더의 "첨부" 토글이 쥔다 — 이 피커는 토글 ON일 때만 렌더된다.
 * 시각 선택 = `aria-checked` 셀렉터로만 스타일. 화살표는 포커스만 옮기고(비활성 건너뜀),
 * Space/Enter는 네이티브 button 클릭으로 선택된다.
 */
export default function ScenarioPicker({ candidates, attachedCandidateId, onSelectScenario }: ScenarioPickerProps) {
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
