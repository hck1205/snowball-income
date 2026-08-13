import { ArrowRight, Thermometer } from 'lucide-react';
import { Button, PageHero } from '@/components/common';
import { PULSE_AXIS_LABEL, type PulseAxis } from '@/shared/lib/marketPulse';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { ICON } from '@/shared/styles';
import { PulseCard } from '../components';
import { MARKET_PULSE_COPY as copy } from '../copy';
import { AXIS_ORDER } from '../utils';
import {
  AxisHead,
  AxisNote,
  AxisSection,
  AxisTitle,
  CardGrid,
  Disclaimer,
  LegendBody,
  LegendBox,
  LegendCaution,
  LegendChip,
  LegendLevel,
  LegendLevels,
  LegendTitle,
  NudgeBody,
  NudgeBox,
  NudgeCta,
  NudgeText,
  NudgeTitle,
  PageBody,
  StatusBox
} from './MarketPulsePage.styled';
import type { MarketPulseViewProps } from './MarketPulsePage.types';

/** 범례 칩의 색 — `ZONE_VISUAL` 과 같은 순서(안정→보통→주의→경계)를 쓴다. */
const LEGEND_TONES = ['accent', 'neutral', 'warning', 'danger'] as const;

/** `2026-08-09T06:08:15.000Z` → `8월 9일 15:08`. 표시 전용이라 로컬 시각으로 읽어도 된다. */
const formatFetchedAt = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

export function MarketPulseView({ state, onReload }: MarketPulseViewProps) {
  return (
    <PageBody>
      <PageHero
        icon={<Thermometer size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.title}
        titleAs="h1"
        lede={copy.lede}
        meta={
          state.status === 'ready'
            ? `${copy.updatedPrefix} ${formatFetchedAt(state.snapshot.fetchedAt)}`
            : undefined
        }
      />

      {/* 🔴 지표보다 먼저 읽혀야 한다 — 이 화면이 무엇이고 무엇이 아닌지를 정하는 문장이다. */}
      <Disclaimer role="note">{copy.disclaimer}</Disclaimer>

      {state.status === 'loading' ? <StatusBox>{copy.loading}</StatusBox> : null}

      {state.status === 'failed' ? (
        <StatusBox>
          <strong>{copy.failedTitle}</strong>
          <span>{copy.failedBody}</span>
          {/* 🔴 자동 재시도는 없다 — 상류가 연속 호출을 차단한다. 다시 받는 것은 사람이 누를 때만. */}
          <Button variant="secondary" size="sm" onClick={onReload}>
            {copy.retry}
          </Button>
        </StatusBox>
      ) : null}

      {state.status === 'ready'
        ? AXIS_ORDER.map((axis) => {
            const indicators = state.snapshot.indicators.filter((indicator) => indicator.axis === axis);
            /* 그 축에 지표가 하나도 없으면 빈 제목만 남기지 않는다. */
            if (indicators.length === 0) return null;

            return (
              <AxisSection key={axis} aria-labelledby={`axis-${axis}`}>
                <AxisHead>
                  <AxisTitle id={`axis-${axis}`}>{PULSE_AXIS_LABEL[axis as PulseAxis]}</AxisTitle>
                  <AxisNote>{copy.axisNote[axis as PulseAxis]}</AxisNote>
                </AxisHead>
                <CardGrid>
                  {indicators.map((indicator) => (
                    <PulseCard key={indicator.id} indicator={indicator} />
                  ))}
                </CardGrid>
              </AxisSection>
            );
          })
        : null}

      {state.status === 'ready' ? (
        <LegendBox aria-labelledby="pulse-legend">
          <LegendTitle id="pulse-legend">{copy.zoneLegendTitle}</LegendTitle>
          <LegendBody>{copy.zoneLegendBody}</LegendBody>
          {/* 🔴 네 단계를 색 칩 + 이름 + 풀이로 함께 보여 준다 — 색만으로는 채널이 되지 못한다. */}
          <LegendLevels>
            {copy.zoneLevels.map((level, index) => (
              <LegendLevel key={level.name}>
                <LegendChip $tone={LEGEND_TONES[index]}>{level.name}</LegendChip>
                <span>{level.body}</span>
              </LegendLevel>
            ))}
          </LegendLevels>
          <LegendCaution>{copy.zoneLegendCaution}</LegendCaution>
        </LegendBox>
      ) : null}

      {/*
        🔴 시뮬레이터로 잇는 넛지(연결⑤). 상태와 무관하게 늘 보인다 — 지표를 못 받았어도 "타이밍보다
           기간"이라는 문장은 그대로 참이고, 막다른 화면 대신 다음 걸음을 준다.
        🔴 클릭을 계측한다(도착이 아니라) — 시뮬레이터 도착은 URL 에 표식이 없어 셀 수 없다.
      */}
      <NudgeBox aria-labelledby="pulse-nudge">
        <NudgeText>
          <NudgeTitle id="pulse-nudge">{copy.simulatorNudge.title}</NudgeTitle>
          <NudgeBody>{copy.simulatorNudge.body}</NudgeBody>
        </NudgeText>
        <NudgeCta to={SIMULATOR_PATH} onClick={() => track(ANALYTICS_EVENT.MARKET_PULSE_TO_SIMULATOR)}>
          {copy.simulatorNudge.cta}
          <ArrowRight size={16} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
        </NudgeCta>
      </NudgeBox>
    </PageBody>
  );
}

export default MarketPulseView;
