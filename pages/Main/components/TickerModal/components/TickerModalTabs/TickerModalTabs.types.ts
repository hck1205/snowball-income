import type { TickerModalMode } from '@/shared/types/snowball';

/** 티커 모달 탭 키 — 프리셋 선택 / 직접 입력 / 검색(현재 비노출). */
export type ModalTabKey = 'input' | 'preset' | 'search';

export type TickerModalTabsProps = {
  activeTab: ModalTabKey;
  /** analytics 이벤트에 함께 실리는 모달 모드. */
  mode: TickerModalMode;
  /** 검색 탭 노출 여부(현재 비활성 플래그). */
  showSearchTab: boolean;
  onSelectTab: (tab: ModalTabKey) => void;
};
