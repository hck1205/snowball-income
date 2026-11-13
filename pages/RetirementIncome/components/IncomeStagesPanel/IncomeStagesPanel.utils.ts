import type { RetirementStage } from '@/shared/lib/retirementIncome';
import { formatKoreanWon, formatRatePercent } from '@/shared/utils';
import { RETIREMENT_INCOME_COPY } from '../../copy';

const copy = RETIREMENT_INCOME_COPY.results;

export type IncomeSource = 'nps' | 'account' | 'dividend';

const SOURCE_LABEL: Record<IncomeSource, string> = { nps: '국민연금', account: '연금계좌', dividend: '배당' };
const SOURCES: readonly IncomeSource[] = ['nps', 'account', 'dividend'];

export type StageView = {
  readonly key: number;
  readonly range: string;
  /** 막대 조각 — 0 인 수입원은 뺀다. share = 막대 칸 기준 폭 대비 비율. */
  readonly segments: readonly { readonly source: IncomeSource; readonly share: number }[];
  /** "국민연금 100만원 + 배당 85만원 · 연금소득세 5.5%". */
  readonly breakdown: string;
  readonly total: string;
  /** 목표 대비. 목표가 0이면 null(말하지 않는다). */
  readonly gap: { readonly label: string; readonly tone: 'short' | 'ok' } | null;
  /** 목표선 위치(0~1). 목표가 0이면 null. */
  readonly targetAt: number | null;
};

/**
 * 막대 칸의 기준 폭 — max(목표, 가장 큰 구간 합계). 모든 구간이 같은 자로 그려져야 구간끼리 길이를 견줄 수 있다.
 * 전부 0이면 1(0으로 나누지 않게).
 */
export const stageScale = (stages: readonly RetirementStage[], target: number): number =>
  Math.max(target, ...stages.map((stage) => stage.total), 1);

/** 나이 구간 한 줄이 말할 것(순수). */
export const buildStageView = (stage: RetirementStage, scale: number, target: number): StageView => {
  const shown = SOURCES.filter((source) => stage[source] > 0);
  const parts = shown.map((source) => `${SOURCE_LABEL[source]} ${formatKoreanWon(stage[source])}`).join(' + ');
  const tax = stage.accountTaxRate !== null ? ` · ${copy.accountTax(formatRatePercent(stage.accountTaxRate))}` : '';
  return {
    key: stage.fromAge,
    range: copy.stageRange(stage.fromAge, stage.toAge),
    segments: shown.map((source) => ({ source, share: stage[source] / scale })),
    breakdown: (parts || '수입 없음') + tax,
    total: `월 ${formatKoreanWon(stage.total)}`,
    gap:
      target > 0
        ? {
            label:
              stage.gap < 0 ? copy.short(formatKoreanWon(-stage.gap)) : stage.gap > 0 ? copy.surplus(formatKoreanWon(stage.gap)) : copy.exact,
            tone: stage.gap < 0 ? 'short' : 'ok'
          }
        : null,
    targetAt: target > 0 ? Math.min(1, target / scale) : null
  };
};
