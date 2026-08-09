import { useMemo } from 'react';
import { ChartPie } from 'lucide-react';
import { Button, PageHero, ResponsiveEChart } from '@/components/common';
import { ZONE_LABEL, elevatedCountOf, overallLevelOf, overallTensionOf, tensionAxesOf } from '@/shared/lib/marketPulse';
import { getChartTheme } from '@/shared/styles';
import { HIPPO_STATS_COPY as copy } from '../copy';
import {
  donutOption,
  excludedDerivativeCount,
  guruCount,
  guruReportDates,
  radarOption,
  topBuys,
  topByHolders,
  topByValue,
  topSells,
  tradeWindow
} from '../utils';
import {
  Caveats,
  ChartBox,
  Disclaimer,
  Note,
  PageBody,
  PieBlock,
  PieRow,
  PieTitle,
  Section,
  SectionLede,
  SectionTitle,
  StatusBox,
  StatusChip,
  StatusScore,
  SummaryRow,
  SummaryText
} from './HippoStatsPage.styled';
import type { HippoStatsViewProps } from './HippoStatsPage.types';

/** 레이더는 축이 셋 미만이면 도형이 되지 않는다. */
const MIN_AXES = 3;

/** 단계 → 색. 지표 카드의 `ZONE_VISUAL` 과 같은 매핑이다(한 서비스에 잣대는 하나다). */
const LEVEL_TONE = { calm: 'accent', normal: 'neutral', elevated: 'warning', stressed: 'danger' } as const;

export function HippoStatsView({ state, onReload }: HippoStatsViewProps) {
  /*
   * 🔴 `getChartTheme()` 은 DOM 의 CSS 변수를 읽는다 — 모듈 최상위에서 한 번 읽어 두면
   *    첫 테마의 색이 영원히 굳는다.
   */
  const theme = useMemo(() => getChartTheme(), []);

  const axes = useMemo(
    () => (state.status === 'ready' ? tensionAxesOf(state.snapshot.indicators) : []),
    [state]
  );

  /* 🔴 거래 집계는 커밋된 스냅샷이라 네트워크와 무관하다 — 지표를 못 받아도 이 절은 선다. */
  const buys = useMemo(() => topBuys(), []);
  const sells = useMemo(() => topSells(), []);
  const window = tradeWindow();

  /* 대가들 13F 도 커밋된 스냅샷이라 네트워크를 타지 않는다. */
  const byHolders = useMemo(() => topByHolders(), []);
  const byValue = useMemo(() => topByValue(), []);

  return (
    <PageBody>
      <PageHero
        icon={<ChartPie size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.title}
        titleAs="h1"
        lede={copy.lede}
      />

      <Disclaimer role="note">{copy.disclaimer}</Disclaimer>

      {/* ── 지표 긴장도 ─────────────────────────────────────────────────────── */}
      <Section aria-labelledby="stats-radar">
        <SectionTitle id="stats-radar">{copy.radarTitle}</SectionTitle>
        <SectionLede>{copy.radarLede}</SectionLede>

        {state.status === 'loading' ? <StatusBox>{copy.loading}</StatusBox> : null}

        {state.status === 'failed' ? (
          <StatusBox>
            <strong>{copy.failedTitle}</strong>
            <span>{copy.failedBody}</span>
            {/* 🔴 자동 재시도는 없다 — 상류가 연속 호출을 차단한다. */}
            <Button variant="secondary" size="sm" onClick={onReload}>
              {copy.retry}
            </Button>
          </StatusBox>
        ) : null}

        {state.status === 'ready' && axes.length >= MIN_AXES ? (
          <>
            {/*
              🔴 종합 단계 + **세어 본 사실**. 단계 옆에 점수와 계산식을 함께 적는다 —
                 합쳐 만든 값은 그 셈을 밝히지 않으면 근거처럼 보이기만 한다.
            */}
            <SummaryRow>
              <StatusChip $tone={LEVEL_TONE[overallLevelOf(overallTensionOf(axes) ?? 0)]}>
                {`${copy.statusLabel} ${ZONE_LABEL[overallLevelOf(overallTensionOf(axes) ?? 0)]}`}
              </StatusChip>
              <StatusScore>{copy.statusFormula(Math.round(overallTensionOf(axes) ?? 0))}</StatusScore>
              <SummaryText>
                {copy.radarSummary(axes.length, elevatedCountOf(axes))} {copy.statusCaution}
              </SummaryText>
            </SummaryRow>
            <ChartBox $height={360} role="img" aria-label={copy.radarTitle}>
              <ResponsiveEChart option={radarOption(axes, theme)} />
            </ChartBox>
            <Note>{copy.radarNote}</Note>
          </>
        ) : null}

        {state.status === 'ready' && axes.length < MIN_AXES ? <StatusBox>{copy.radarEmpty}</StatusBox> : null}
      </Section>

      {/* ── 대가들 보유 ─────────────────────────────────────────────────────── */}
      <Section aria-labelledby="stats-guru">
        <SectionTitle id="stats-guru">{copy.guruTitle}</SectionTitle>
        {/* 🔴 매수·매도가 아니라 **보유**라는 사실을 먼저 말한다. */}
        <SectionLede>{copy.guruScope(guruCount(), guruReportDates())}</SectionLede>

        <PieRow>
          <PieBlock>
            <PieTitle>{copy.guruHoldersTitle}</PieTitle>
            <ChartBox $height={340} role="img" aria-label={copy.guruHoldersTitle}>
              <ResponsiveEChart
                option={donutOption(
                  byHolders.map((row) => ({ ticker: row.issuer, name: row.issuer, count: row.holders })),
                  theme,
                  theme.series[2],
                  copy.guruHoldersCenter,
                  copy.guruHoldersUnit
                )}
              />
            </ChartBox>
          </PieBlock>
          <PieBlock>
            <PieTitle>{copy.guruValueTitle}</PieTitle>
            <ChartBox $height={340} role="img" aria-label={copy.guruValueTitle}>
              <ResponsiveEChart
                option={donutOption(
                  /* 🔴 달러 원값은 조 단위라 파이 라벨에 안 들어간다 — **억 달러**로 줄여 담는다. */
                  byValue.map((row) => ({
                    ticker: row.issuer,
                    name: row.issuer,
                    count: Math.round(row.valueUsd / 100_000_000)
                  })),
                  theme,
                  theme.series[3],
                  copy.guruValueCenter,
                  copy.guruValueUnit
                )}
              />
            </ChartBox>
          </PieBlock>
        </PieRow>

        <Caveats>
          {copy.guruCaveats(excludedDerivativeCount()).map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </Caveats>
      </Section>
      {/* ── 공시된 거래 ─────────────────────────────────────────────────────── */}
      <Section aria-labelledby="stats-trades">
        <SectionTitle id="stats-trades">{copy.tradeTitle}</SectionTitle>
        {/* 🔴 범위를 먼저 말한다 — 이 문장이 없으면 실제보다 넓은 자료로 읽힌다. */}
        <SectionLede>{copy.tradeScope(window.start, window.end)}</SectionLede>

        <PieRow>
          <PieBlock>
            <PieTitle>{copy.buyTitle}</PieTitle>
            <ChartBox $height={340} role="img" aria-label={copy.buyTitle}>
              <ResponsiveEChart option={donutOption(buys, theme, theme.series[0], copy.buyCenter, copy.tradeUnit)} />
            </ChartBox>
          </PieBlock>
          <PieBlock>
            <PieTitle>{copy.sellTitle}</PieTitle>
            <ChartBox $height={340} role="img" aria-label={copy.sellTitle}>
              <ResponsiveEChart option={donutOption(sells, theme, theme.series[4], copy.sellCenter, copy.tradeUnit)} />
            </ChartBox>
          </PieBlock>
        </PieRow>

        {/* ⚠ 이 셋은 "왜 다른 자료는 안 썼나"에 대한 답이다. 지우지 마라. */}
        <Caveats>
          {copy.tradeCaveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </Caveats>
      </Section>

    </PageBody>
  );
}

export default HippoStatsView;
