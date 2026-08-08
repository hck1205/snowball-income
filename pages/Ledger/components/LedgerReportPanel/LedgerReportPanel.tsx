import { useMemo } from 'react';
import { Card, ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { LEDGER_HOLDING_LABEL, LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { getChartTheme } from '@/shared/styles';
import {
  buildInsights,
  buildKpis,
  categoryRadar,
  categorySunburst,
  categoryTrend,
  cumulativeNet,
  dailySpending,
  methodFixitySplit,
  monthWaterfall,
  sankeyFlow,
  spendingYears,
  expenseByCategory,
  expenseByMethod,
  fixityTrend,
  holdingKindTrend,
  investmentByAccount,
  investmentMix,
  latestHoldingMix,
  monthlyFlows,
  netWorthTrend,
  payerTrend,
  weekdaySpending
} from '../../utils';
import type { ReportKpi } from '../../utils';
import type { LedgerReportPanelProps } from './LedgerReportPanel.types';
import {
  ChartArea,
  ChartBlock,
  ChartNote,
  ChartTitle,
  DebtNote,
  EmptyBlock,
  EmptyBody,
  EmptyTitle,
  InsightItem,
  InsightList,
  KpiGrid,
  KpiLabel,
  KpiNote,
  KpiTile,
  KpiValue,
  ReportBody,
  ReportRow,
  Section,
  SectionTitle
} from './LedgerReportPanel.styled';
import {
  calendarOption,
  categoryTrendOption,
  cumulativeOption,
  donutOption,
  fixityOption,
  fixityRatioOption,
  holdingTrendOption,
  horizontalBarOption,
  monthlyFlowOption,
  netWorthStepOption,
  payerOption,
  radarOption,
  roseOption,
  sankeyOption,
  savingGaugeOption,
  stackedHorizontalOption,
  sunburstOption,
  waterfallOption
} from '../../utils';

/**
 * **한눈에 보기** — 가계부·자산·투자를 그래프로.
 *
 * ## 왜 이제야 차트를 쓰나
 *
 * `이 달 살펴보기` 카드를 만들 때는 일부러 차트 라이브러리를 안 썼다 — 말하는 것이 "무엇이 큰가"
 * 하나뿐이라 축·범례가 필요 없었고, ECharts 를 끌어오면 가계부만 쓰는 사용자의 번들이 무거워지기
 * 때문이다. 그때 "축과 시계열이 필요해지면 그때 도입한다"고 적어 두었고, **지금이 그때다.**
 * 번들은 `ResponsiveEChart` 가 `lazy()` 로 갈라 두어 이 탭을 열지 않으면 한 바이트도 안 받는다.
 *
 * ## 🔴 구획에 면을 깔지 않는다 (2026-08-09 사용자 지적)
 *
 * 처음에는 차트마다 회색 상자를 깔았다가 화면이 격자무늬가 되어 차트가 배경 소음에 묻혔다.
 * 지금은 **여백과 제목**이 구획을 나누고, 면을 갖는 것은 위쪽 숫자 타일뿐이다.
 *
 * ## 🔴 없으면 "없다"고 말한다 (2026-08-09 사용자 지적)
 *
 * 자산·투자를 안 적었을 때 그 구획을 통째로 감췄더니 "그래프가 안 보인다"로 읽혔다 —
 * 없는 것과 안 그리는 것을 사용자가 구분할 방법이 없었다. 무엇을 적으면 무엇이 나타나는지 적는다.
 *
 * ## 🔴 그 밖의 규율
 *
 * - **색 단독 채널 금지.** 범례를 끄지 않고 차트마다 기준을 한 줄로 적는다.
 * - **지어내지 않는다.** 기록이 없는 달은 건너뛰고, 잴 수 없는 값은 선을 끊는다.
 * - **조언하지 않는다.** 인사이트는 관측까지다 — 무엇을 줄일지는 그 사람의 사정이다.
 */

const KRW = (value: number): string => `${Math.round(value).toLocaleString('ko-KR')}원`;

/** 🔴 낼 수 없는 값은 대시다 — 0 으로 위장하지 않는다. */
const kpiText = (kpi: ReportKpi): string => {
  if (kpi.value === null) return '—';
  return kpi.unit === 'percent' ? `${Math.round(kpi.value * 100)}%` : KRW(kpi.value);
};

const monthLabel = (month: string): string => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;

export default function LedgerReportPanel({
  entries,
  holdings,
  investments,
  isLoadingSideTabs
}: LedgerReportPanelProps) {
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 테마 두 축(색 프리셋·밝기) 어느 쪽이 바뀌어도 다시 빌드한다. */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
  const theme = useMemo(() => getChartTheme(), [colorScheme, palettePreset]);

  const flows = useMemo(() => monthlyFlows(entries), [entries]);
  const cumulative = useMemo(() => cumulativeNet(flows), [flows]);
  const fixity = useMemo(() => fixityTrend(entries), [entries]);
  const categories = useMemo(() => categoryTrend(entries), [entries]);
  const weekdays = useMemo(() => weekdaySpending(entries), [entries]);
  const methodSlices = useMemo(() => expenseByMethod(entries), [entries]);
  const methodSplit = useMemo(() => methodFixitySplit(entries), [entries]);

  const netWorth = useMemo(() => netWorthTrend(holdings), [holdings]);
  const holdingMix = useMemo(() => latestHoldingMix(holdings), [holdings]);
  const holdingTrend = useMemo(
    () => holdingKindTrend(holdings, (kind) => LEDGER_HOLDING_LABEL[kind]),
    [holdings]
  );

  const investmentGroups = useMemo(() => investmentMix(investments), [investments]);
  const accountGroups = useMemo(() => investmentByAccount(investments), [investments]);

  /** 가장 최근에 기록이 있는 달. 🔴 "이번 달"이 아니다 — 이번 달이 비어 있으면 빈 파이가 된다. */
  const latestMonth = flows.at(-1)?.month ?? null;
  const categorySlices = useMemo(
    () => (latestMonth === null ? [] : expenseByCategory(entries, latestMonth)),
    [entries, latestMonth]
  );

  const payerPoints = useMemo(() => payerTrend(entries, LEDGER_PAYER_SHARED), [entries]);
  const payers = useMemo(() => {
    const found = new Set<string>();
    for (const point of payerPoints) for (const payer of point.byPayer.keys()) found.add(payer);
    /* 🔴 공동은 언제나 마지막 — 사람 이름들의 공통분모라 뒤가 자연스럽다. */
    const named = [...found].filter((payer) => payer !== LEDGER_PAYER_SHARED).sort((a, b) => a.localeCompare(b, 'ko'));
    return found.has(LEDGER_PAYER_SHARED) ? [...named, LEDGER_PAYER_SHARED] : named;
  }, [payerPoints]);

  const sankey = useMemo(() => sankeyFlow(entries, latestMonth ?? undefined), [entries, latestMonth]);
  const daily = useMemo(() => dailySpending(entries), [entries]);
  const years = useMemo(() => spendingYears(daily), [daily]);
  const sunburst = useMemo(
    () => (latestMonth === null ? [] : categorySunburst(entries, latestMonth)),
    [entries, latestMonth]
  );
  const waterfall = useMemo(
    () => (latestMonth === null ? [] : monthWaterfall(entries, latestMonth)),
    [entries, latestMonth]
  );
  const radar = useMemo(() => categoryRadar(entries), [entries]);

  /* 게이지에 쓸 최근 달 저축률. 🔴 잴 수 없으면 그리지 않는다. */
  const savingRate = flows.at(-1)?.savingRate ?? null;

  const kpis = useMemo(() => buildKpis({ flows, fixity, netWorth }), [fixity, flows, netWorth]);
  const insights = useMemo(() => buildInsights({ flows, fixity, netWorth }), [fixity, flows, netWorth]);

  if (flows.length === 0) {
    return (
      <Card tone="default" title="한눈에 보기">
        <EmptyBlock>
          <EmptyTitle>아직 그릴 기록이 없습니다</EmptyTitle>
          <EmptyBody>가계부 탭에 몇 건을 적으시면 여기에 흐름과 구성이 나타납니다.</EmptyBody>
        </EmptyBlock>
      </Card>
    );
  }

  /* 🔴 주체가 둘 이상일 때만 그린다 — 한 사람짜리 막대는 정보가 아니라 소음이다. */
  const showPayers = payers.length >= 2;

  return (
    <Card tone="default" title="한눈에 보기">
      <ReportBody>
        <Section>
          <KpiGrid>
            {kpis.map((kpi) => (
              <KpiTile key={kpi.id}>
                <KpiLabel>{kpi.label}</KpiLabel>
                <KpiValue>{kpiText(kpi)}</KpiValue>
                <KpiNote>{kpi.note}</KpiNote>
              </KpiTile>
            ))}
          </KpiGrid>

          {insights.length > 0 ? (
            <InsightList>
              {insights.map((insight) => (
                <InsightItem key={insight.id}>{insight.text}</InsightItem>
              ))}
            </InsightList>
          ) : null}
        </Section>

        <Section>
          <SectionTitle>현금흐름</SectionTitle>

          {/*
            🔴 **이 화면에서 가장 많은 것을 한 번에 말하는 그림.** 파이는 지출 안의 비율만,
               막대는 달별 크기만 보여 주는데 흐름도는 번 돈이 어떻게 쪼개졌나를 통째로 보여 준다.
          */}
          {sankey.links.length > 0 ? (
            <ChartBlock>
              <ChartTitle>
                {latestMonth === null ? '돈이 어디로 갔나' : monthLabel(latestMonth) + ' 돈이 어디로 갔나'}
              </ChartTitle>
              <ChartNote>
                {'왼쪽이 들어온 곳, 오른쪽이 나간 곳입니다. 저축·투자로 옮긴 돈도 한 갈래로 세웁니다.'}
                {sankey.overspent > 0 ? ' 이 달은 번 것보다 ' + KRW(sankey.overspent) + '을 더 썼습니다.' : ''}
              </ChartNote>
              <ChartArea $tall>
                <ResponsiveEChart option={sankeyOption(sankey, theme)} />
              </ChartArea>
            </ChartBlock>
          ) : null}

          <ChartBlock>
            <ChartTitle>달마다의 수입·지출과 저축률</ChartTitle>
            <ChartNote>
              {'저축률은 수입에서 지출을 뺀 몫입니다. 수입이 없는 달은 잴 수 없어 선이 끊깁니다. '}
              {'저축·투자로 옮긴 돈은 지출에 넣지 않습니다.'}
            </ChartNote>
            <ChartArea $tall>
              <ResponsiveEChart option={monthlyFlowOption(flows, theme)} />
            </ChartArea>
          </ChartBlock>

          <ReportRow>
            {waterfall.length > 0 ? (
              <ChartBlock>
                <ChartTitle>
                  {latestMonth === null ? '무엇이 깎아 갔나' : monthLabel(latestMonth) + ' 무엇이 깎아 갔나'}
                </ChartTitle>
                <ChartNote>
                  {'수입에서 시작해 항목마다 깎이고 무엇이 남았는지 보여 줍니다.'}
                </ChartNote>
                <ChartArea>
                  <ResponsiveEChart option={waterfallOption(waterfall, theme)} />
                </ChartArea>
              </ChartBlock>
            ) : null}

            {savingRate === null ? null : (
              <ChartBlock>
                <ChartTitle>최근 달 저축률</ChartTitle>
                <ChartNote>
                  {'눈금에 좋고 나쁨을 칠하지 않았습니다 — 적정 저축률은 사람마다 다릅니다.'}
                </ChartNote>
                <ChartArea>
                  <ResponsiveEChart option={savingGaugeOption(savingRate, theme)} />
                </ChartArea>
              </ChartBlock>
            )}
          </ReportRow>

          <ReportRow>
            <ChartBlock>
              <ChartTitle>지금까지 얼마나 모았나</ChartTitle>
              <ChartNote>
                {'달마다 남은 돈을 쌓은 값입니다. 점선 아래로 내려간 구간은 번 것보다 쓴 것이 많았던 때입니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={cumulativeOption(cumulative, theme)} />
              </ChartArea>
            </ChartBlock>

            <ChartBlock>
              <ChartTitle>고정비와 변동비</ChartTitle>
              <ChartNote>
                {'고정비는 계약을 바꿔야 줄고, 변동비는 이번 달에 줄일 수 있습니다. 아래가 고정비입니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={fixityOption(fixity, theme)} />
              </ChartArea>
            </ChartBlock>
          </ReportRow>

          {/*
            🔴 위 그림은 **금액**, 이 그림은 **비중**이다. 금액만 보면 총액이 커졌을 때 고정비도
               커 보이는데, 비중을 따로 보면 씀씀이가 커진 것과 고정비가 늘어난 것이 갈린다.
          */}
          <ChartBlock>
            <ChartTitle>고정비가 차지하는 몫</ChartTitle>
            <ChartNote>
              {'달마다 지출을 100으로 놓고 비중만 본 그림입니다. 지출이 없던 달은 뺐습니다.'}
            </ChartNote>
            <ChartArea>
              <ResponsiveEChart option={fixityRatioOption(fixity, theme)} />
            </ChartArea>
          </ChartBlock>
        </Section>

        <Section>
          <SectionTitle>지출</SectionTitle>

          <ReportRow>
            <ChartBlock>
              <ChartTitle>{latestMonth === null ? '지출 구성' : `${monthLabel(latestMonth)} 지출은 어디로 갔나`}</ChartTitle>
              {/*
                🔴 **도넛이 아니라 선버스트**다. 도넛은 한 층만 말해서 식비가 크다는 것까지는 알아도
                   그 안에서 무엇이 컸는지는 못 본다 — 시트가 이미 두 층을 갖고 있다.
                ⚠ 상세항목이 하나도 없으면 선버스트가 도넛과 같아지므로 그때는 도넛으로 떨어진다.
              */}
              <ChartNote>안쪽이 항목, 바깥이 상세항목입니다. 바깥 이름은 짚으면 나옵니다.</ChartNote>
              <ChartArea>
                <ResponsiveEChart
                  option={
                    sunburst.length > 0 ? sunburstOption(sunburst, theme) : donutOption(categorySlices, theme)
                  }
                />
              </ChartArea>
            </ChartBlock>

            <ChartBlock>
              <ChartTitle>무엇이 늘고 있나</ChartTitle>
              <ChartNote>
                {'많이 쓴 항목 다섯을 달마다 쌓았습니다. 파이는 비중만 말하지만 이 그림은 총액 변화까지 말합니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={categoryTrendOption(categories, theme)} />
              </ChartArea>
            </ChartBlock>
          </ReportRow>

          {radar.length > 0 ? (
            <ChartBlock>
              <ChartTitle>이번 달은 평소와 어떻게 달랐나</ChartTitle>
              <ChartNote>
                {'실선이 최근 달, 점선이 그 이전 달들의 평균입니다. 평균은 그 항목에 지출이 있던 달로만 냅니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={radarOption(radar, theme)} />
              </ChartArea>
            </ChartBlock>
          ) : null}

          {/* 🔴 기록이 있는 날만 칠한다 — 안 쓴 날과 안 적은 날을 같게 칠하면 뜻이 사라진다. */}
          {years.map((year) => (
            <ChartBlock key={year}>
              <ChartTitle>{year + '년 지출 달력'}</ChartTitle>
              <ChartNote>진할수록 그날 많이 썼다는 뜻입니다. 기록이 없는 날은 비어 있습니다.</ChartNote>
              <ChartArea>
                <ResponsiveEChart option={calendarOption(year, daily, theme)} />
              </ChartArea>
            </ChartBlock>
          ))}

          <ReportRow>
            <ChartBlock>
              {/*
                🔴 **로즈**를 쓰는 이유는 요일이 **주기**를 갖기 때문이다 — 일곱 조각이 한 바퀴를
                   도는 것이 한 주가 도는 것과 같아 그림 모양 자체가 리듬을 말한다.
                ⚠ 일반 구성(항목별 지출)에는 로즈를 쓰지 않는다. 반지름까지 값에 묶여 면적이 값에
                  비례하지 않으므로, 크기를 눈으로 비교해야 하는 자리에서는 도넛보다 부정확하다.
              */}
              <ChartTitle>요일별 소비 리듬</ChartTitle>
              <ChartNote>
                {'하루 평균입니다. 기록 구간에 따라 요일마다 날 수가 달라, 합계로 비교하면 습관처럼 보입니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={roseOption(weekdays, theme)} />
              </ChartArea>
            </ChartBlock>

            {methodSlices.length > 0 ? (
              <ChartBlock>
                {/*
                  🔴 합계만 보면 "이 카드를 많이 쓴다"까지다. 고정/변동을 쪼개면 그 카드에 묶인 것이
                     자동이체인지 그때그때 쓴 것인지가 보인다 — 카드를 바꿀 수 있는지 판단하는 자리다.
                */}
                <ChartTitle>결제수단별 지출</ChartTitle>
                <ChartNote>
                  {'전 기간 합계입니다. 시트에 적으신 이름 그대로 세고, 고정비와 변동비를 나눠 쌓았습니다.'}
                </ChartNote>
                <ChartArea>
                  <ResponsiveEChart
                    option={stackedHorizontalOption(
                      {
                        categories: methodSplit.methods,
                        series: [
                          { label: '고정비', values: methodSplit.fixed },
                          { label: '변동비', values: methodSplit.variable }
                        ]
                      },
                      theme
                    )}
                  />
                </ChartArea>
              </ChartBlock>
            ) : null}
          </ReportRow>

          {showPayers ? (
            <ChartBlock>
              <ChartTitle>누가 얼마를 썼나</ChartTitle>
              <ChartNote>
                {'주체를 적지 않은 기록은 공동으로 셉니다. 사람별 막대를 더하면 그 달 지출 합계가 됩니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={payerOption(payerPoints, payers, theme)} />
              </ChartArea>
            </ChartBlock>
          ) : null}
        </Section>

        <Section>
          <SectionTitle>자산</SectionTitle>

          {/* 🔴 "없다"와 "아직 안 읽었다"는 다른 사실이다 — 읽는 중에는 없다고 말하지 않는다. */}
          {isLoadingSideTabs && netWorth.length === 0 ? (
            <ChartNote>자산을 읽고 있습니다…</ChartNote>
          ) : netWorth.length === 0 ? (
            <EmptyBlock>
              <EmptyTitle>아직 적은 잔액이 없습니다</EmptyTitle>
              <EmptyBody>
                {'자산 탭에 월말 통장·적금·부채를 적으시면 순자산 추이와 구성이 여기에 나타납니다.'}
              </EmptyBody>
            </EmptyBlock>
          ) : (
            <>
              <ReportRow>
                <ChartBlock>
                  <ChartTitle>순자산은 어떻게 움직였나</ChartTitle>
                  <ChartNote>
                    {'자산에서 부채를 뺀 값입니다. 계단인 것은 잰 날의 값만 알기 때문입니다 — '}
                    {'스냅샷 사이를 매끈하게 이으면 재지 않은 것을 잰 척하는 것이 됩니다.'}
                  </ChartNote>
                  <ChartArea>
                    <ResponsiveEChart option={netWorthStepOption(netWorth, theme)} />
                  </ChartArea>
                </ChartBlock>

                <ChartBlock>
                  <ChartTitle>지금 무엇으로 갖고 있나</ChartTitle>
                  <ChartNote>
                    {holdingMix.month === null
                      ? '아직 적은 잔액이 없습니다.'
                      : `${monthLabel(holdingMix.month)}에 적으신 잔액입니다.`}
                  </ChartNote>
                  <ChartArea>
                    <ResponsiveEChart option={donutOption(holdingMix.assets, theme)} />
                  </ChartArea>
                  {/* 🔴 부채는 파이에 섞지 않는다 — 섞으면 "부채도 내 자산"으로 읽힌다. */}
                  {holdingMix.debt > 0 ? (
                    <DebtNote>{`부채 ${KRW(holdingMix.debt)}은 이 그림에 없습니다. 순자산에서 뺐습니다.`}</DebtNote>
                  ) : null}
                </ChartBlock>
              </ReportRow>

              {holdingTrend.months.length >= 2 ? (
                <ChartBlock>
                  <ChartTitle>무엇으로 쌓여 왔나</ChartTitle>
                  <ChartNote>
                    {'종류별로 쌓은 그림입니다. 부채는 여기 없습니다 — 그건 위 순자산 선이 이미 반영합니다.'}
                  </ChartNote>
                  <ChartArea>
                    <ResponsiveEChart option={holdingTrendOption(holdingTrend, theme)} />
                  </ChartArea>
                </ChartBlock>
              ) : null}
            </>
          )}
        </Section>

        <Section>
          <SectionTitle>투자</SectionTitle>

          {isLoadingSideTabs && investmentGroups.length === 0 ? (
            <ChartNote>투자를 읽고 있습니다…</ChartNote>
          ) : investmentGroups.length === 0 ? (
            <EmptyBlock>
              <EmptyTitle>아직 그릴 종목이 없습니다</EmptyTitle>
              <EmptyBody>
                {'투자 탭에 티커·수량·매입단가를 적으시면 종목과 계좌 구성이 여기에 나타납니다. '}
                {'매입단가를 적지 않으면 금액을 낼 수 없어 그림에 들어가지 않습니다.'}
              </EmptyBody>
            </EmptyBlock>
          ) : (
            investmentGroups.map((group) => {
              const accounts = accountGroups.find((item) => item.currency === group.currency);
              return (
                <ReportRow key={group.currency}>
                  <ChartBlock>
                    <ChartTitle>{`종목별 구성 (${group.currency})`}</ChartTitle>
                    <ChartNote>
                      {'매입금액 기준입니다 — 시세를 받아 오지 않으므로 평가금액은 낼 수 없습니다.'}
                    </ChartNote>
                    <ChartArea>
                      <ResponsiveEChart option={donutOption(group.slices, theme)} />
                    </ChartArea>
                  </ChartBlock>

                  {accounts && accounts.slices.length > 0 ? (
                    <ChartBlock>
                      <ChartTitle>{`계좌별 구성 (${group.currency})`}</ChartTitle>
                      <ChartNote>계좌를 적지 않은 종목은 “계좌 미기재”로 모입니다.</ChartNote>
                      <ChartArea>
                        <ResponsiveEChart option={horizontalBarOption(accounts.slices, theme)} />
                      </ChartArea>
                    </ChartBlock>
                  ) : null}
                </ReportRow>
              );
            })
          )}
        </Section>
      </ReportBody>
    </Card>
  );
}
