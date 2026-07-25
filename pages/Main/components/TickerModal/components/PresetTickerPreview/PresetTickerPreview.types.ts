import type { TickerDraft } from '@/shared/types/snowball';

export type PresetTickerPreviewProps = {
  tickerDraft: TickerDraft;
  /** 배당률 + 배당 성장률에서 파생된 총수익률(NaN 이면 빈칸). */
  derivedTotalReturn: number;
  /** 총수익률 분해 캡션. null 이면 캡션을 감춘다. */
  totalReturnCaption: string | null;
  onHelpExpectedTotalReturn: () => void;
};
