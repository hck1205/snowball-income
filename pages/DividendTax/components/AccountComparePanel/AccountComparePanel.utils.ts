import type { DividendTaxResult } from '@/shared/lib/dividendTax';
import { formatKoreanWon, formatRatePercent } from '@/shared/utils';
import { DIVIDEND_TAX_COPY } from '../../copy';

const copy = DIVIDEND_TAX_COPY.results;

export type AccountId = 'general' | 'isa' | 'pension';

export type AccountRow = {
  readonly id: AccountId;
  /** 칸 라벨(세율 포함). */
  readonly label: string;
  /** 문장 속 짧은 이름 — "ISA가 일반계좌보다…". */
  readonly short: string;
  readonly tax: number;
};

export type AccountComparison = {
  readonly rows: readonly AccountRow[];
  /** 세금이 가장 적은 계좌. 일반계좌보다 적지 않으면 null(강조하지 않는다). */
  readonly best: AccountRow | null;
  /** 일반계좌 대비 절감액(best 가 없으면 0). */
  readonly saving: number;
  /**
   * 연금계좌가 피하는 부담 — 위 결과 카드에서 생긴 것의 이름. 연금계좌의 진짜 이점은 세율이 아니라
   * "받는 동안 금융소득이 아니다"이다(큰 금액에서는 16.5% 가 15.4% 보다 높아 보여도).
   */
  readonly pensionAvoids: readonly string[];
};

/** 일반계좌 · ISA · 연금계좌 비교(순수) — 계산 결과에서 화면이 말할 것만 뽑는다. */
export const buildAccountComparison = (result: DividendTaxResult): AccountComparison => {
  const rows: AccountRow[] = [
    { id: 'general', label: copy.isaGeneral, short: '일반계좌', tax: result.isa.generalTax },
    { id: 'isa', label: copy.isaAccount(formatKoreanWon(result.isa.taxFreeLimit)), short: 'ISA', tax: result.isa.isaTax },
    {
      id: 'pension',
      label: result.pension.overSeparateLimit
        ? copy.pensionAccountOver
        : copy.pensionAccount(formatRatePercent(result.pension.rate)),
      short: '연금계좌',
      tax: result.pension.tax
    }
  ];
  const cheapest = rows.reduce((acc, row) => (row.tax < acc.tax ? row : acc));
  const saving = result.isa.generalTax - cheapest.tax;
  return {
    rows,
    best: saving > 0 ? cheapest : null,
    saving: Math.max(0, saving),
    pensionAvoids: [
      ...(result.health.monthlyIncrease > 0
        ? [`건강보험료 증가(월 ${result.health.monthlyIncrease.toLocaleString('ko-KR')}원)`]
        : []),
      ...(result.health.dependentLost ? ['피부양자 탈락'] : []),
      ...(result.comprehensive ? ['금융소득종합과세'] : [])
    ]
  };
};
