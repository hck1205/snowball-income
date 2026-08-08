import { useMemo } from 'react';
import { Card, ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { getChartTheme } from '@/shared/styles';
import {
  buildInsights,
  expenseByCategory,
  expenseByMethod,
  fixityTrend,
  investmentMix,
  latestHoldingMix,
  monthlyFlows,
  netWorthTrend,
  payerTrend
} from '../../utils';
import type { LedgerReportPanelProps } from './LedgerReportPanel.types';
import {
  ChartArea,
  ChartBlock,
  ChartNote,
  ChartTitle,
  DebtNote,
  EmptyNote,
  InsightItem,
  InsightList,
  ReportBody,
  ReportRow
} from './LedgerReportPanel.styled';
import {
  donutOption,
  fixityOption,
  horizontalBarOption,
  monthlyFlowOption,
  netWorthOption,
  payerOption
} from './LedgerReportPanel.utils';

/**
 * **한눈에 보기** — 가계부·자산·투자를 그래프로.
 *
 * ## 왜 이제야 차트를 쓰나
 *
 * `이 달 살펴보기` 카드를 만들 때는 일부러 차트 라이브러리를 안 썼다 — 말하는 것이 "무엇이 큰가"
 * 하나뿐이라 축·범례가 필요 없었고, ECharts 를 끌어오면 가계부만 쓰는 사용자의 번들이 무거워지기
 * 때문이다. 그때 "축과 시계열이 필요해지면 그때 도입한다"고 적어 두었고, **지금이 그때다.**
 *
 * ⚠ 번들 걱정은 `ResponsiveEChart` 가 이미 푼다 — echarts 를 `lazy()` 로 갈라 두어, 이 탭을
 *   열지 않은 사용자는 한 바이트도 받지 않는다.
 *
 * ## 🔴 이 화면의 규율
 *
 * - **손익색 금지.** 지출이 빨강이 아니다 — 가계부의 수입·지출은 손익(P&L)이 아니다.
 * - **색 단독 채널 금지.** 범례를 끄지 않고, 차트마다 기준을 한 줄로 적는다.
 * - **지어내지 않는다.** 기록이 없는 달은 건너뛰고, 잴 수 없는 값은 선을 끊는다.
 * - **조언하지 않는다.** 인사이트는 관측까지다 — 무엇을 줄일지는 그 사람의 사정이다.
 */
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
  const fixity = useMemo(() => fixityTrend(entries), [entries]);
  const netWorth = useMemo(() => netWorthTrend(holdings), [holdings]);
  const holdingMix = useMemo(() => latestHoldingMix(holdings), [holdings]);
  const investmentGroups = useMemo(() => investmentMix(investments), [investments]);
  const methodSlices = useMemo(() => expenseByMethod(entries), [entries]);

  /** 가장 최근에 기록이 있는 달. 🔴 "이번 달"이 아니다 — 이번 달이 비어 있으면 빈 파이가 된다. */
  const latestMonth = flows.at(-1)?.month ?? null;
  const categorySlices = useMemo(
    () => (latestMonth === null ? [] : expenseByCategory(entries, latestMonth)),
    [entries, latestMonth]
  );

  const payers = useMemo(() => {
    const found = new Set<string>();
    for (const point of payerTrend(entries, LEDGER_PAYER_SHARED)) {
      for (const payer of point.byPayer.keys()) found.add(payer);
    }
    /* 🔴 공동은 언제나 마지막 — 사람 이름들의 공통분모라 뒤가 자연스럽다. */
    const named = [...found].filter((payer) => payer !== LEDGER_PAYER_SHARED).sort((a, b) => a.localeCompare(b, 'ko'));
    return found.has(LEDGER_PAYER_SHARED) ? [...named, LEDGER_PAYER_SHARED] : named;
  }, [entries]);
  const payerPoints = useMemo(() => payerTrend(entries, LEDGER_PAYER_SHARED), [entries]);

  const insights = useMemo(
    () => buildInsights({ flows, fixity, netWorth }),
    [fixity, flows, netWorth]
  );

  if (flows.length === 0) {
    return (
      <Card tone="default" title="한눈에 보기">
        <EmptyNote>
          {'아직 그릴 기록이 없습니다. 가계부 탭에 몇 건을 적으시면 여기에 흐름과 구성이 나타납니다.'}
        </EmptyNote>
      </Card>
    );
  }

  const latestMonthLabel = latestMonth === null ? '' : `${latestMonth.slice(0, 4)}년 ${Number(latestMonth.slice(5))}월`;
  /* 🔴 주체가 둘 이상일 때만 그린다 — 한 사람짜리 막대는 정보가 아니라 소음이다. */
  const showPayers = payers.length >= 2;

  return (
    <Card tone="default" title="한눈에 보기">
      <ReportBody>
        {insights.length > 0 ? (
          <InsightList>
            {insights.map((insight) => (
              <InsightItem key={insight.id}>{insight.text}</InsightItem>
            ))}
          </InsightList>
        ) : null}

        <ChartBlock>
          <ChartTitle>달마다의 수입·지출과 저축률</ChartTitle>
          <ChartNote>
            {'저축률은 (수입 − 지출) ÷ 수입입니다. 수입이 없는 달은 잴 수 없어 선이 끊깁니다. '}
            {'저축·투자로 옮긴 돈은 지출에 넣지 않습니다.'}
          </ChartNote>
          <ChartArea>
            <ResponsiveEChart option={monthlyFlowOption(flows, theme)} />
          </ChartArea>
        </ChartBlock>

        <ReportRow>
          <ChartBlock>
            <ChartTitle>{`${latestMonthLabel} 지출은 어디로 갔나`}</ChartTitle>
            <ChartNote>기록이 있는 가장 최근 달 기준입니다.</ChartNote>
            <ChartArea>
              <ResponsiveEChart option={donutOption(categorySlices, theme)} />
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

        {methodSlices.length > 0 ? (
          <ChartBlock>
            <ChartTitle>결제수단별 지출</ChartTitle>
            <ChartNote>전 기간 합계입니다. 시트에 적으신 이름 그대로 셉니다.</ChartNote>
            <ChartArea>
              <ResponsiveEChart option={horizontalBarOption(methodSlices, theme)} />
            </ChartArea>
          </ChartBlock>
        ) : null}

        {/* 🔴 "없다"와 "아직 안 읽었다"는 다른 사실이다 — 읽는 중에는 없다고 말하지 않는다. */}
        {isLoadingSideTabs ? <ChartNote>자산·투자를 읽고 있습니다…</ChartNote> : null}

        {netWorth.length > 0 ? (
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
                  : `${holdingMix.month.slice(0, 4)}년 ${Number(holdingMix.month.slice(5))}월에 적으신 잔액입니다.`}
              </ChartNote>
              <ChartArea>
                <ResponsiveEChart option={donutOption(holdingMix.assets, theme)} />
              </ChartArea>
              {/* 🔴 부채는 파이에 섞지 않는다 — 섞으면 "부채도 내 자산"으로 읽힌다. */}
              {holdingMix.debt > 0 ? (
                <DebtNote>{`부채 ${Math.round(holdingMix.debt).toLocaleString('ko-KR')}원은 이 그림에 없습니다. 순자산에서 뺐습니다.`}</DebtNote>
              ) : null}
            </ChartBlock>
          </ReportRow>
        ) : null}

        {investmentGroups.map((group) => (
          <ChartBlock key={group.currency}>
            <ChartTitle>{`투자 구성 (${group.currency})`}</ChartTitle>
            <ChartNote>
              {'매입금액 기준입니다 — 시세를 받아 오지 않으므로 평가금액은 낼 수 없습니다. '}
              {'매입단가를 적지 않은 종목은 이 그림에 없습니다.'}
            </ChartNote>
            <ChartArea>
              <ResponsiveEChart option={donutOption(group.slices, theme)} />
            </ChartArea>
          </ChartBlock>
        ))}
      </ReportBody>
    </Card>
  );
}
