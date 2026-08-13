import { useId, useMemo, useState } from 'react';
import { ChartPie } from 'lucide-react';
import {
  Button,
  PageHero,
  ResponsiveEChart,
  SideDrawer,
  TickerSelectorBar,
  TickerSelectorCheckbox
} from '@/components/common';
import { useCompareSelection } from '@/pages/Ticker/hooks';
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
  topComparableGuruHoldings,
  topComparableTradeTickers,
  topSells,
  tradeWindow
} from '../utils';
import type { CompareSelection } from '@/pages/Ticker/hooks';
import {
  Caveats,
  ChartBox,
  CompareBlock,
  CompareCount,
  CompareIssuer,
  CompareItem,
  CompareList,
  CompareTickerLabel,
  Disclaimer,
  Note,
  PageBody,
  PieBlock,
  PieRow,
  PieTitle,
  Section,
  SectionHead,
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

/** 담기 목록 한 줄 — 두 절(대가 보유·공시 거래)이 서로 다른 원천을 같은 모양으로 낸다. */
type PickerRow = {
  ticker: string;
  /** 티커 옆에 서는 종목명. 대가 쪽은 발행사명, 거래 쪽은 신고서의 종목명이다. */
  name: string;
  /** 줄 오른쪽 끝의 근거 숫자("대가 3명" / "신고 12건"). 절마다 세는 것이 다르다. */
  meta: string;
};

/**
 * 담을 수 있는 종목을 고르는 **서랍**. 두 절이 같은 부품을 쓴다.
 *
 * 🔴 껍데기를 새로 만들지 않고 공용 `SideDrawer` 를 쓴다 — 대가들 포폴 카드의 보유 표 드로어와
 *    같은 조합(right · 전 폭 딤 · 목록 피커)이라 이 앱의 서랍이 어디서나 같게 열리고 닫힌다.
 * ⚠ 제목은 드로어가 `h2` 로 그린다 — 안에서 제목을 또 세우지 마라(같은 말이 두 번 읽힌다).
 */
function ComparePickerDrawer({
  id,
  isOpen,
  title,
  closeLabel,
  lede,
  rows,
  unavailableReason,
  compare,
  onClose
}: {
  id: string;
  isOpen: boolean;
  title: string;
  closeLabel: string;
  lede: string;
  rows: readonly PickerRow[];
  unavailableReason: string;
  compare: CompareSelection;
  onClose: () => void;
}) {
  return (
    <SideDrawer
      id={id}
      side="right"
      isOpen={isOpen}
      title={title}
      closeLabel={closeLabel}
      onClose={onClose}
      width="min(520px, 94vw)"
      dimBelow="always"
    >
      <CompareBlock>
        <SectionLede>{lede}</SectionLede>
        <CompareList>
          {rows.map((row) => (
            <CompareItem key={row.ticker}>
              <TickerSelectorCheckbox
                ticker={row.ticker}
                checked={compare.isSelected(row.ticker)}
                disabled={compare.isDisabled(row.ticker)}
                disabledReason={unavailableReason}
                onToggle={compare.toggle}
              />
              <CompareTickerLabel>{row.ticker}</CompareTickerLabel>
              <CompareIssuer title={row.name}>{row.name}</CompareIssuer>
              <CompareCount>{row.meta}</CompareCount>
            </CompareItem>
          ))}
        </CompareList>
      </CompareBlock>
    </SideDrawer>
  );
}

/**
 * 절 제목 옆의 여는 버튼.
 *
 * 🔴 담을 것이 없으면 그리지 않는다(`null`) — 열어 봤자 빈 서랍인 컨트롤을 두지 않는다.
 * ⚠ 보이는 글자는 두 절이 같고 접근성 이름만 절마다 다르다 — 보이는 글자가 그 이름의 부분
 *   문자열이라 음성 조작도 그대로 듣는다(카피 `comparePickerOpen` 주석).
 */
function ComparePickerButton({
  id,
  isOpen,
  label,
  onOpen
}: {
  id: string;
  isOpen: boolean;
  label: string;
  onOpen: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={id}
      onClick={onOpen}
    >
      {copy.comparePickerOpen}
    </Button>
  );
}

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

  /*
   * 종목 비교로 보내는 연결(기획서 연결①). `from='stats'` 는 측정용이다.
   * 🔴 이 화면은 표가 아니라 도넛뿐이라 체크박스를 걸 행이 없다 — 그래서 **절마다** 그 절이 다룬
   *    종목 중 비교 표에 담을 수 있는 것만 따로 목록으로 세운다(도넛 앞자리의 무배당 대형주는
   *    담아도 빈 비교가 열린다). 유니버스 최종 판정은 `compare.isDisabled` 가 한 번 더 하므로
   *    여기서 걸러 끄지 않고 **아예 빼서** 목록이 눌러도 되는 줄만 남게 한다.
   * ⚠ 두 목록은 겹칠 수 있다(실측: MSFT·NVDA 등 6종). 같은 티커의 체크박스가 두 서랍에 생기지만
   *   선택은 `useCompareSelection` 한 곳에 있어 어느 쪽에서 담아도 같은 하나가 담긴다.
   */
  const compare = useCompareSelection('stats');
  const guruPicks: PickerRow[] = useMemo(() => topComparableGuruHoldings(), [])
    .filter((row) => !compare.isDisabled(row.ticker))
    .map((row) => ({ ticker: row.ticker, name: row.issuer, meta: copy.guruCompareHolders(row.holders) }));

  /*
   * 🔴 거래 절도 같은 목록을 갖는다(2026-08-14 사용자 지시: "두 군데 다 버튼을"). 도넛 조각에는
   *    티커가 없어 그림에서 곧바로 담을 수 없는 사정이 대가 절과 똑같다.
   */
  const tradePicks: PickerRow[] = useMemo(() => topComparableTradeTickers(), [])
    .filter((row) => !compare.isDisabled(row.ticker))
    .map((row) => ({ ticker: row.ticker, name: row.name, meta: copy.tradeCompareCount(row.count) }));

  /*
   * 🔴 두 목록은 **드로어**로 연다(2026-08-14 사용자 지시). 본문에 펼쳐 두면 도넛 사이를 목록이
   *    갈라, 그림 넷을 이어 보려는 스크롤이 매번 끊겼다. 이 화면의 본문은 그림이 주인공이고
   *    고르기는 곁가지다 — 곁가지를 서랍에 넣는다.
   * ⚠ 열림 상태를 컨테이너가 아니라 **여기**가 갖는다(대가들 포폴 화면과 같은 자리) — 주소에
   *   실리지 않는 순수 화면 상태라 URL·영속과 무관하다.
   * ⚠ 서랍은 하나씩만 연다 — 둘을 각자 boolean 으로 두면 둘 다 열린 상태가 만들어질 수 있고,
   *   그때 두 패널이 같은 층에 겹쳐 뒤엣것이 앞엣것을 가린다(`stacked` 는 한 겹까지의 계약이다).
   */
  const [openPicker, setOpenPicker] = useState<'guru' | 'trade' | null>(null);
  const guruPickerId = useId();
  const tradePickerId = useId();

  return (
    <>
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
        <SectionHead>
          <SectionTitle id="stats-guru">{copy.guruTitle}</SectionTitle>
          {guruPicks.length > 0 ? (
            <ComparePickerButton
              id={guruPickerId}
              isOpen={openPicker === 'guru'}
              label={copy.guruComparePickerLabel}
              onOpen={() => setOpenPicker('guru')}
            />
          ) : null}
        </SectionHead>
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
        <SectionHead>
          <SectionTitle id="stats-trades">{copy.tradeTitle}</SectionTitle>
          {tradePicks.length > 0 ? (
            <ComparePickerButton
              id={tradePickerId}
              isOpen={openPicker === 'trade'}
              label={copy.tradeComparePickerLabel}
              onOpen={() => setOpenPicker('trade')}
            />
          ) : null}
        </SectionHead>
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

    {/*
      담을 수 있는 종목을 고르는 서랍 둘 — **`PageBody` 밖**이다(`position: fixed` 라 조상이
      스태킹 컨텍스트를 만들면 갇힌다). 도넛 조각에는 티커가 없어 그림에서 곧바로 담을 수 없으니
      절마다 담을 수 있는 것만 줄로 세운다.
    */}
    {guruPicks.length > 0 ? (
      <ComparePickerDrawer
        id={guruPickerId}
        isOpen={openPicker === 'guru'}
        title={copy.guruCompareTitle}
        closeLabel={copy.guruComparePickerClose}
        lede={copy.guruCompareLede}
        rows={guruPicks}
        unavailableReason={copy.guruCompareUnavailable}
        compare={compare}
        onClose={() => setOpenPicker(null)}
      />
    ) : null}

    {tradePicks.length > 0 ? (
      <ComparePickerDrawer
        id={tradePickerId}
        isOpen={openPicker === 'trade'}
        title={copy.tradeCompareTitle}
        closeLabel={copy.tradeComparePickerClose}
        lede={copy.tradeCompareLede}
        rows={tradePicks}
        unavailableReason={copy.tradeCompareUnavailable}
        compare={compare}
        onClose={() => setOpenPicker(null)}
      />
    ) : null}

    {/* 🔴 `PageBody` 밖이다 — `position: fixed` 라 조상이 스태킹 컨텍스트를 만들면 갇힌다(Nps 와 같은 처방). */}
    <TickerSelectorBar
      selected={compare.selected}
      max={compare.max}
      min={compare.min}
      href={compare.href}
      onRemove={compare.remove}
      onClear={compare.clear}
    />
    </>
  );
}

export default HippoStatsView;
