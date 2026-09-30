import { useId } from 'react';
import { ETF_MIX_COPY } from '../../../copy';
import { useTweenedNumber } from '../../../hooks';
import { deltaTone, formatDelta, formatPercent, overlapLevel } from '../../../utils';
import { VisuallyHidden } from '../../styled';
import type { OverlapVerdictProps } from './OverlapVerdict.types';
import {
  DeltaChip,
  Gauge,
  GaugeCenter,
  GaugeFill,
  GaugeTrack,
  Stat,
  StatGrid,
  Verdict,
  VerdictBody,
  VerdictEyebrow,
  VerdictNote,
  VerdictSentence,
  VerdictText,
  VerdictUnit,
  VerdictValue
} from './OverlapVerdict.styled';

const copy = ETF_MIX_COPY.verdict;

/** 링 게이지 반지름(viewBox 120 기준). 둘레는 여기서 파생한다 — 손으로 적은 326.7 같은 숫자를 두지 않는다. */
const GAUGE_RADIUS = 52;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * 결론 — 이 화면의 초점. 담을 때마다 숫자가 새 값으로 흘러가고, 방금 바뀐 폭이 칩으로 붙는다.
 * 🔴 흐르는 중간값은 낭독하지 않는다 — 최종 값은 `VisuallyHidden`, 변화 칩은 `aria-live` 로 한 번 읽힌다.
 */
export default function OverlapVerdict({ analysis, analyzedCount, change }: OverlapVerdictProps) {
  const baseId = useId();
  const rate = analysis.overlapRate;
  const shownRate = useTweenedNumber(rate);
  const level = overlapLevel(rate, analyzedCount);
  const topShared = analysis.stocks.find((stock) => stock.holders.length >= 2);

  return (
    <Verdict aria-labelledby={`${baseId}-title`}>
      <VerdictBody>
        <Gauge>
          <svg viewBox="0 0 120 120" aria-hidden focusable={false}>
            <GaugeTrack cx="60" cy="60" r={GAUGE_RADIUS} strokeWidth="12" />
            <GaugeFill
              $high={level === 'high'}
              cx="60"
              cy="60"
              r={GAUGE_RADIUS}
              strokeWidth="12"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, rate)) / 100)}
            />
          </svg>
          <GaugeCenter>
            <VerdictEyebrow id={`${baseId}-title`}>{copy.eyebrow}</VerdictEyebrow>
            <VerdictValue>
              <VisuallyHidden>{copy.valueLabel(formatPercent(rate))}</VisuallyHidden>
              <span aria-hidden>{formatPercent(shownRate)}</span>
              <VerdictUnit aria-hidden>{copy.unit}</VerdictUnit>
            </VerdictValue>
          </GaugeCenter>
        </Gauge>

        <VerdictText>
          <div aria-live="polite">
            {change ? (
              <DeltaChip key={change.id} $tone={deltaTone(change.delta)}>
                {change.kind === 'added'
                  ? copy.changeAdded(change.ticker, formatDelta(change.delta))
                  : copy.changeRemoved(change.ticker, formatDelta(change.delta))}
              </DeltaChip>
            ) : null}
          </div>
          <VerdictSentence>{copy.sentence[level]}</VerdictSentence>
          <VerdictNote>{copy.assumption}</VerdictNote>
        </VerdictText>
      </VerdictBody>

      <StatGrid>
        <Stat>
          <dt>{copy.stats.unique}</dt>
          <dd>{analysis.uniqueCount.toLocaleString('ko-KR')}</dd>
        </Stat>
        <Stat>
          <dt>{copy.stats.shared}</dt>
          <dd>{analysis.sharedCount.toLocaleString('ko-KR')}</dd>
        </Stat>
        <Stat>
          <dt>{copy.stats.top}</dt>
          <dd title={topShared?.name}>
            {topShared ? copy.stats.topValue(topShared.symbol ?? topShared.name, topShared.holders.length) : copy.stats.none}
          </dd>
        </Stat>
      </StatGrid>
    </Verdict>
  );
}
