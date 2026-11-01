import type { CSSProperties } from 'react';
import { INFLATION_RATE_BASIS_LABEL, INFLATION_RATE_CHOICES } from '@/shared/constants/inflation';
import { DIVIDEND_TARGET_COPY } from '../../copy';
import { formatPercent, formatPercentPoints, formatSignedPercent } from '../../utils';
import type { InflationCompareProps } from './InflationCompare.types';
import {
  BarFill,
  BarLabel,
  BarRow,
  Bars,
  BarTrack,
  BarValue,
  CompareIntro,
  CompareLede,
  CompareRoot,
  CompareTitle,
  GrowthBasis,
  RateBasis,
  RateChip,
  RateGroup,
  RateLabel,
  Verdict
} from './InflationCompare.styled';

const COPY = DIVIDEND_TARGET_COPY.inflation;

/** 두 막대가 공유하는 눈금의 최댓값(%). 둘 중 큰 값에 여유를 둬 긴 막대가 끝에 붙지 않게 한다. */
const scaleMaxFor = (growth: number | null, inflation: number): number =>
  Math.max(Math.abs(growth ?? 0), inflation, 1) * 1.15;

const barStyle = (value: number, max: number): CSSProperties =>
  ({ '--bar': `${Math.max(0, Math.min(100, (value / max) * 100))}%` }) as CSSProperties;

/**
 * 과거 배당 인상률 vs 물가 가정.
 *
 * 🔴 인상률은 **관측 참고치**(`observedDividendCagr`)이고 물가는 **사용자가 고른 가정**이다. 둘 다
 * 표 안에서 그렇다고 말한다 — 라벨에 "과거"·"가정"이 붙어 있지 않으면 이 비교는 예측처럼 읽힌다.
 */
export default function InflationCompare({ item, inflationRate, onInflationChange }: InflationCompareProps) {
  const growth = item.dividendCagrPercent;
  const max = scaleMaxFor(growth, inflationRate);
  const { verdict, gapPercentPoints } = item.inflation;

  const verdictText =
    verdict === 'unknown' || gapPercentPoints === null
      ? COPY.verdict.unknown
      : COPY.verdict[verdict](formatPercentPoints(gapPercentPoints));

  return (
    <CompareRoot>
      <CompareIntro>
        <CompareTitle>{COPY.title}</CompareTitle>
        <CompareLede>{COPY.lede}</CompareLede>
        <RateGroup role="group" aria-label={COPY.assumptionLabel}>
          <RateLabel>{COPY.assumptionLabel}</RateLabel>
          {INFLATION_RATE_CHOICES.map((rate) => (
            <RateChip key={rate} type="button" aria-pressed={rate === inflationRate} onClick={() => onInflationChange(rate)}>
              {formatPercent(rate)}
            </RateChip>
          ))}
        </RateGroup>
        <RateBasis>{INFLATION_RATE_BASIS_LABEL[inflationRate]}</RateBasis>
      </CompareIntro>

      <Bars>
        <BarRow>
          <BarLabel>{COPY.growthLabel}</BarLabel>
          <BarValue>{growth === null ? COPY.unknownValue : formatSignedPercent(growth)}</BarValue>
          <BarTrack aria-hidden>
            <BarFill $kind="growth" style={barStyle(growth ?? 0, max)} />
          </BarTrack>
        </BarRow>
        <BarRow>
          <BarLabel>{COPY.inflationLabel}</BarLabel>
          <BarValue>{formatPercent(inflationRate)}</BarValue>
          <BarTrack aria-hidden>
            <BarFill $kind="inflation" style={barStyle(inflationRate, max)} />
          </BarTrack>
        </BarRow>
        <Verdict $verdict={verdict} role="status">
          {verdictText}
        </Verdict>
        <GrowthBasis>{COPY.growthBasis}</GrowthBasis>
      </Bars>
    </CompareRoot>
  );
}
