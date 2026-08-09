import { PULSE_SCALES, bandOf, bandWidthsOf, scalePositionOf } from '@/shared/lib/marketPulse';
import { BandLabel, BandLabels, MarkerLayer, Marker, ScaleBand, ScaleRoot, ScaleTrack } from './BandScale.styled';
import type { BandScaleProps } from './BandScale.types';

/**
 * 이름 붙은 구간 위의 현재 위치.
 *
 * 🔴 시계열만으로는 "지금 이게 높은 건가"를 매번 머리로 계산해야 한다. 공포탐욕지수를 CNN 처럼
 *    다이얼로 그리고 나니 VIX·기간구조·금리차가 **전부 같은 구조**라는 게 드러났다(2026-08-09
 *    사용자 지적) — 값 하나가 이름 붙은 구간 중 어디에 있는가.
 * ⚠ 스케일이 정의되지 않은 지표에는 **그리지 않는다**. 관습적 경계가 없는데 구간을 그리면
 *   지어낸 기준이 그림이 되어 근거처럼 보인다(근거는 shared/lib/marketPulse/thresholds.ts).
 */
export function BandScale({ indicatorId, value, label }: BandScaleProps) {
  const scale = PULSE_SCALES[indicatorId];
  if (!scale) return null;

  const widths = bandWidthsOf(scale);
  const current = bandOf(indicatorId, value);
  const position = scalePositionOf(scale, value);

  return (
    <ScaleRoot role="img" aria-label={`${label}: ${current?.name ?? ''} 구간`}>
      <MarkerLayer>
        <Marker $left={position} />
      </MarkerLayer>
      <ScaleTrack aria-hidden>
        {scale.bands.map((band, index) => (
          <ScaleBand key={band.name} $tone={band.tone} $width={widths[index]} />
        ))}
      </ScaleTrack>
      <BandLabels aria-hidden>
        {scale.bands.map((band, index) => (
          <BandLabel key={band.name} $width={widths[index]} $active={band === current}>
            {band.name}
          </BandLabel>
        ))}
      </BandLabels>
    </ScaleRoot>
  );
}

export default BandScale;
