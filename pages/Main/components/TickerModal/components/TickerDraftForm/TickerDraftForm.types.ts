import type { TickerDraft } from '@/shared/types/snowball';

export type TickerDraftFormProps = {
  tickerDraft: TickerDraft;
  /** 프리셋이 아닌 신규 티커를 직접 입력 중인지 — 빈 입력(NaN)을 빈칸으로 보여줄지 결정한다. */
  isCreateCustomInput: boolean;
  /** 배당률 + 배당 성장률에서 파생된 총수익률(NaN 이면 빈칸). */
  derivedTotalReturn: number;
  /** 총수익률 분해 캡션. null 이면 캡션을 감춘다. */
  totalReturnCaption: string | null;
  onChangeDraft: (updater: (prev: TickerDraft) => TickerDraft) => void;
  onHelpExpectedTotalReturn: () => void;
};
