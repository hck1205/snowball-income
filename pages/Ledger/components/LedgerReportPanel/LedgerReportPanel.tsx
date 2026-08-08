import { useMemo } from 'react';
import { Card, ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { LEDGER_HOLDING_LABEL, LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { getChartTheme } from '@/shared/styles';
import {
  buildInsights,
  buildKpis,
  categoryTrend,
  cumulativeNet,
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
  categoryTrendOption,
  cumulativeOption,
  donutOption,
  fixityOption,
  holdingTrendOption,
  horizontalBarOption,
  monthlyFlowOption,
  netWorthOption,
  payerOption,
  weekdayOption
} from './LedgerReportPanel.utils';

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
        </Section>

        <Section>
          <SectionTitle>지출</SectionTitle>

          <ReportRow>
            <ChartBlock>
              <ChartTitle>{latestMonth === null ? '지출 구성' : `${monthLabel(latestMonth)} 지출은 어디로 갔나`}</ChartTitle>
              <ChartNote>기록이 있는 가장 최근 달 기준입니다.</ChartNote>
              <ChartArea>
                <ResponsiveEChart option={donutOption(categorySlices, theme)} />
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

          <ReportRow>
            <ChartBlock>
              <ChartTitle>요일별 소비 리듬</ChartTitle>
              <ChartNote>
                {'하루 평균입니다. 기록 구간에 따라 요일마다 날 수가 달라, 합계로 비교하면 습관처럼 보입니다.'}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={weekdayOption(weekdays, theme)} />
              </ChartArea>
            </ChartBlock>

            {methodSlices.length > 0 ? (
              <ChartBlock>
                <ChartTitle>결제수단별 지출</ChartTitle>
                <ChartNote>전 기간 합계입니다. 시트에 적으신 이름 그대로 셉니다.</ChartNote>
                <ChartArea>
                  <ResponsiveEChart option={horizontalBarOption(methodSlices, theme)} />
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
                    {'자산에서 부채를 뺀 값입니다. 잔액을 적지 않은 달은 점이 없습니다 — 0원과 다릅니다.'}
                  </ChartNote>
                  <ChartArea>
                    <ResponsiveEChart option={netWorthOption(netWorth, theme)} />
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
