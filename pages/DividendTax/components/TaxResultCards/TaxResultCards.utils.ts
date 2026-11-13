import type { DividendTaxResult } from '@/shared/lib/dividendTax';
import { formatKoreanWon } from '@/shared/utils';
import { DIVIDEND_TAX_COPY } from '../../copy';

const copy = DIVIDEND_TAX_COPY;

/** 결과 카드 한 장의 내용 — 작은 제목 → 큰 값 → 상태 배지 → 설명(같은 해부). */
export type ResultCardModel = {
  readonly eyebrow: string;
  readonly value: string;
  readonly tone: 'ok' | 'warn' | 'info';
  readonly badge: string;
  readonly note: string;
};

/** 세 장(원천징수 뒤 · 종합과세 · 건강보험)의 내용(순수). */
export const buildResultCards = (result: DividendTaxResult): readonly ResultCardModel[] => {
  const health = result.health;
  const healthCard: ResultCardModel =
    health.status === 'dependent'
      ? {
          eyebrow: '건강보험 피부양자',
          value: health.dependentLost ? '탈락 가능' : '유지',
          tone: health.dependentLost ? 'warn' : 'ok',
          badge: health.dependentLost ? '소득요건 초과' : '소득요건 이내',
          note: copy.results.dependentNote
        }
      : {
          eyebrow: '늘어나는 월 건강보험료',
          value: health.monthlyIncrease > 0 ? `월 +${health.monthlyIncrease.toLocaleString('ko-KR')}원` : '변화 없음',
          tone: health.monthlyIncrease > 0 ? 'warn' : 'ok',
          badge: copy.inputs.healthOptions[health.status],
          note:
            health.monthlyIncrease > 0
              ? `보험료에 반영되는 금융소득 연 ${formatKoreanWon(health.countedIncome)} · 장기요양 포함`
              : health.status === 'regional'
                ? copy.results.premiumZeroRegional
                : copy.results.premiumZeroEmployee
        };

  return [
    {
      eyebrow: copy.results.withholding,
      value: `월 ${formatKoreanWon(result.usNetAfterWithholding / 12)}`,
      tone: 'info',
      badge: '미국 원천징수 15%',
      note: `${copy.results.perYear(formatKoreanWon(result.usNetAfterWithholding))} · 원천징수 연 ${formatKoreanWon(result.usWithheld)}`
    },
    {
      eyebrow: '금융소득종합과세',
      value: result.comprehensive
        ? result.extraIncomeTax > 0
          ? `연 +${formatKoreanWon(result.extraIncomeTax)}`
          : '대상'
        : '대상 아님',
      tone: result.comprehensive ? 'warn' : 'ok',
      badge: result.comprehensive ? '연 2,000만원 초과 · 추정' : '연 2,000만원 이하',
      note:
        copy.results.comprehensiveDetail(formatKoreanWon(result.financialIncome)) +
        (result.comprehensive && result.extraIncomeTax === 0 ? ` ${copy.results.extraTaxZero}` : '')
    },
    healthCard
  ];
};
