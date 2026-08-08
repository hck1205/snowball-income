/**
 * **문장과 타일** — 숫자에서 사람이 읽을 것을 만든다.
 *
 * 🔴 여기서 조언하지 않는다. 관측까지다 — 무엇을 줄일지는 그 사람의 사정이다.
 * 🔴 근거가 모자라면 아무 말도 하지 않는다. 빈 배열이 정상이다.
 */
import type { ReportFixitySplit, ReportMonthlyFlow } from './reportFlows';
import type { ReportNetWorthPoint } from './reportHoldings';

/* ── 인사이트 ────────────────────────────────────────────────────────────────── */

export type ReportInsight = {
  readonly id: string;
  readonly text: string;
};

/** 평균을 낼 만큼의 달이 모였는가. 두 달로 "평균"을 말하면 그건 평균이 아니다. */
export const MIN_MONTHS_FOR_AVERAGE = 3;

/**
 * 숫자에서 **문장**을 만든다.
 *
 * 🔴 여기서 조언하지 않는다. "줄이세요" 는 투자·소비 권유에 가깝고, 무엇을 줄일지는 그 사람의
 *    사정이다. 이 문장들은 **관측**만 말한다 — "고정비가 지출의 62%입니다" 까지다.
 * 🔴 근거가 모자라면 아무 말도 하지 않는다. 빈 배열이 정상이다.
 */
export const buildInsights = (params: {
  readonly flows: readonly ReportMonthlyFlow[];
  readonly fixity: readonly ReportFixitySplit[];
  readonly netWorth: readonly ReportNetWorthPoint[];
}): readonly ReportInsight[] => {
  const insights: ReportInsight[] = [];
  const { flows, fixity, netWorth } = params;

  /* 저축률 평균 — 수입이 0 인 달은 애초에 셀 수 없으니 뺀다. */
  const rates = flows.map((flow) => flow.savingRate).filter((rate): rate is number => rate !== null);
  if (rates.length >= MIN_MONTHS_FOR_AVERAGE) {
    const average = rates.reduce((total, rate) => total + rate, 0) / rates.length;
    insights.push({
      id: 'saving-rate',
      text: `기록이 있는 ${rates.length}개월의 평균 저축률은 ${Math.round(average * 100)}%입니다.`
    });
  }

  /* 고정비 비중 — 가장 최근 달 기준. */
  const lastFixity = fixity.at(-1);
  if (lastFixity && lastFixity.fixedRatio !== null) {
    insights.push({
      id: 'fixed-ratio',
      text: `가장 최근 달 지출에서 고정비가 ${Math.round(lastFixity.fixedRatio * 100)}%를 차지합니다.`
    });
  }

  /* 순자산 변화 — 두 점이 있어야 "변했다"를 말할 수 있다. */
  if (netWorth.length >= 2) {
    const first = netWorth[0];
    const last = netWorth[netWorth.length - 1];
    const delta = last.netWorth - first.netWorth;
    const direction = delta === 0 ? '그대로입니다' : delta > 0 ? '늘었습니다' : '줄었습니다';
    insights.push({
      id: 'net-worth',
      text:
        `순자산은 ${first.month.replace('-', '년 ')}월부터 ${last.month.replace('-', '년 ')}월까지 `
        + `${Math.abs(Math.round(delta)).toLocaleString('ko-KR')}원 ${direction}.`
    });
  }

  /* 이체(저축·투자)로 옮긴 돈 — 지출과 헷갈리기 쉬운 자리라 숫자로 못 박는다. */
  const transferTotal = flows.reduce((total, flow) => total + flow.transfer, 0);
  if (transferTotal > 0) {
    insights.push({
      id: 'transfer',
      text:
        `저축·투자로 옮긴 돈은 모두 ${Math.round(transferTotal).toLocaleString('ko-KR')}원입니다. `
        + '이 금액은 지출 합계에 들어 있지 않습니다.'
    });
  }

  return insights;
};

/* ── 요약 타일 ───────────────────────────────────────────────────────────────── */

export type ReportKpi = {
  readonly id: string;
  readonly label: string;
  /** 🔴 낼 수 없으면 `null` — 화면이 대시로 그리고 사유를 적는다. 0 으로 위장하지 않는다. */
  readonly value: number | null;
  readonly unit: 'krw' | 'percent';
  /** 왜 그 숫자인지 한 줄. */
  readonly note: string;
};

/**
 * 화면 맨 위의 큰 숫자 넷.
 *
 * 🔴 **낼 수 없는 값은 `null`** 이다. 자산을 안 적었으면 순자산은 0 이 아니라 없음이고,
 *    수입이 없는 달의 저축률도 없음이다.
 */
export const buildKpis = (params: {
  readonly flows: readonly ReportMonthlyFlow[];
  readonly fixity: readonly ReportFixitySplit[];
  readonly netWorth: readonly ReportNetWorthPoint[];
}): readonly ReportKpi[] => {
  const { flows, fixity, netWorth } = params;
  const lastFlow = flows.at(-1) ?? null;
  const lastFixity = fixity.at(-1) ?? null;
  const lastNetWorth = netWorth.at(-1) ?? null;

  const expenses = flows.map((flow) => flow.expense).filter((value) => value > 0);
  const averageExpense =
    expenses.length === 0 ? null : expenses.reduce((total, value) => total + value, 0) / expenses.length;

  return [
    {
      id: 'saving-rate',
      label: '최근 달 저축률',
      value: lastFlow?.savingRate ?? null,
      unit: 'percent',
      note: (lastFlow?.savingRate ?? null) === null ? '수입 기록이 없어 잴 수 없습니다.' : '수입에서 지출을 뺀 몫입니다.'
    },
    {
      id: 'average-expense',
      label: '월평균 지출',
      value: averageExpense,
      unit: 'krw',
      note: `지출이 있는 ${expenses.length}개월 평균입니다.`
    },
    {
      id: 'fixed-ratio',
      label: '고정비 비중',
      value: lastFixity?.fixedRatio ?? null,
      unit: 'percent',
      note: '최근 달 지출에서 고정비가 차지하는 몫입니다.'
    },
    {
      id: 'net-worth',
      label: '순자산',
      value: lastNetWorth?.netWorth ?? null,
      unit: 'krw',
      note:
        lastNetWorth === null
          ? '자산 탭에 잔액을 적으시면 여기에 나타납니다.'
          : `${lastNetWorth.month.slice(0, 4)}년 ${Number(lastNetWorth.month.slice(5))}월 기준입니다.`
    }
  ];
};
