import { memo, useId, useMemo, useState } from 'react';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import { ChevronDownIcon, SimSummaryStats } from '@/components/community';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { usePalettePresetAtomValue } from '@/jotai';
import { ResponsiveEChart } from '@/pages/Main/components/ResponsiveEChart';
import type { ScenarioPreviewProps } from './ScenarioPreview.types';
import { buildAllocationSummaryText, buildPreviewNormalizedAllocation, buildPreviewPieOption } from './ScenarioPreview.utils';
import {
  ChartFrame,
  Chevron,
  PreviewAccordion,
  PreviewBody,
  PreviewHeader,
  PreviewHeaderText,
  PreviewPanel
} from './ScenarioPreview.styled';

const c = COMMUNITY_COPY.detail;

/**
 * 첨부 시나리오 미리보기 — 상세 페이지 "시뮬레이션 열기" CTA 밑의 **아코디언**(기본 접힘).
 * 펼치면 ① 핵심 숫자(월 배당·최종 자산·투입 대비 — 카드와 같은 `SimSummaryStats` 포맷)
 * ② 시뮬레이터와 동일한 비중 도넛(`buildAllocationPieOption` 그대로)만 보여준다(범례·슬라이더 없음).
 *
 * 계산은 표시 전용(`buildScenarioSimSummary` 순수). 요약이 null이면 숫자를 접고, 비중이 비면 파이를 접는다.
 * 파이(ECharts)는 **펼칠 때만 마운트**한다 — 첫 페인트 부담을 줄이고 lazy 청크와도 맞는다.
 */
function ScenarioPreviewComponent({ payload }: ScenarioPreviewProps) {
  const [open, setOpen] = useState(false);
  const headerId = useId();
  const panelId = useId();

  // 캔버스는 CSS 변수를 다시 읽지 않는다 — 팔레트 전환 시 파이 옵션을 다시 빌드하려 구독한다.
  const palettePreset = usePalettePresetAtomValue();
  const summary = useMemo(() => buildScenarioSimSummary(payload), [payload]);
  const normalizedAllocation = useMemo(() => buildPreviewNormalizedAllocation(payload), [payload]);
  const pieOption = useMemo(
    () => (open ? buildPreviewPieOption(normalizedAllocation, summary?.finalMonthlyDividend ?? null) : null),
    [open, normalizedAllocation, summary, palettePreset]
  );

  if (!summary && normalizedAllocation.length === 0) return null;

  return (
    <PreviewAccordion>
      <PreviewHeader type="button" id={headerId} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((prev) => !prev)}>
        <PreviewHeaderText>{c.previewTitle}</PreviewHeaderText>
        <Chevron open={open} aria-hidden="true">
          <ChevronDownIcon size={18} />
        </Chevron>
      </PreviewHeader>

      <PreviewPanel id={panelId} role="region" aria-labelledby={headerId} hidden={!open}>
        {open ? (
          <PreviewBody>
            {summary ? <SimSummaryStats summary={summary} variant="card" /> : null}
            {pieOption ? (
              <ChartFrame role="img" aria-label={`${c.previewChartLabel}: ${buildAllocationSummaryText(normalizedAllocation)}`}>
                <ResponsiveEChart option={pieOption} replaceMerge={['graphic']} />
              </ChartFrame>
            ) : null}
          </PreviewBody>
        ) : null}
      </PreviewPanel>
    </PreviewAccordion>
  );
}

const ScenarioPreview = memo(ScenarioPreviewComponent);

export default ScenarioPreview;
