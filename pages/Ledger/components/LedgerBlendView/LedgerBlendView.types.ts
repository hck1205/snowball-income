import type { LedgerBlendModel, LedgerBlendSourceKey } from '../../types';

export type LedgerBlendViewProps = {
  model: LedgerBlendModel;
  /** 보고 있는 달. 캡션·빈 상태 문장이 쓴다(이 컴포넌트는 달을 계산하지 않는다). */
  monthLabel: string;
  /**
   * "이 가계부에서 열기"를 줄 수 있는 출처. 🔴 여기 없는 출처에는 버튼을 그리지 않는다 —
   * 다른 스프레드시트의 가계부는 피커를 다시 거쳐야 열린다(되지 않는 버튼을 만들지 않는다).
   */
  openableSources: readonly LedgerBlendSourceKey[];
  /**
   * "열기"가 막힌 사유(`null` 이면 열 수 있다). 🔴 이 버튼은 결국 **탭 전환**이라 탭 피커와 같은
   * 조건에서 막힌다 — 값이 있으면 버튼을 비활성으로 두고 이 문장을 화면에 함께 세운다
   * (사유 없는 회색 버튼 금지). 판단은 이 컴포넌트가 하지 않는다.
   */
  openBlockedReason: string | null;
  onOpenSource: (source: LedgerBlendSourceKey) => void;
  /** 사용자가 누르는 "다시 불러오기". 🔴 자동 재시도는 없다(429). */
  onReload: () => void;
};
