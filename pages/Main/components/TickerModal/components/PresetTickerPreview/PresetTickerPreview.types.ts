import type { TickerDraft } from '@/shared/types/snowball';

export type PresetTickerPreviewProps = {
  tickerDraft: TickerDraft;
  /**
   * 이름 칸에 보여 줄 **표시 전용** 이름(프리셋의 한글 이름). 드래프트의 `name` 을 쓰지 않는 이유:
   *
   * 프리셋에서 만든 티커는 `name` 을 **일부러 비운다** — `getTickerDisplayName` 이 name 을 우선하므로
   * 실으면 좌측 종목 칩이 심볼(SCHD) 대신 영문 풀네임으로 보인다(TickerModal.tsx 의 같은 주석).
   * 그 결과 이 미리보기의 이름 칸이 **늘 공란**이었다(2026-08-11 사용자 지적). 저장값은 그대로 두고
   * 보여 주기만 한다 — 그래서 이 값은 폼이 아니라 **표시**의 문제다.
   */
  displayName: string;
  /** 배당률 + 배당 성장률에서 파생된 총수익률(NaN 이면 빈칸). */
  derivedTotalReturn: number;
  /** 총수익률 분해 캡션. null 이면 캡션을 감춘다. */
  totalReturnCaption: string | null;
  onHelpExpectedTotalReturn: () => void;
};
