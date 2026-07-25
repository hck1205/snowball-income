// per-icon named import → 이 아이콘들만 번들에 포함된다(트리셰이킹). 기본 SVG/탭 아이콘을 lucide로.
import { LayoutGrid, Pencil } from 'lucide-react';
import { TabButton as ModalTabButton, TabList as ModalTabList } from '@/components/common';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { TickerModalTabsProps } from './TickerModalTabs.types';

/**
 * 티커 모달 상단 탭 스트립(프리셋 / 직접 입력 / 검색).
 * TickerModal 본체에서 뷰 조각만 분리했다 — 탭 전환 시 analytics 호출 순서는 그대로다.
 */
function TickerModalTabs({ activeTab, mode, showSearchTab, onSelectTab }: TickerModalTabsProps) {
  return (
    <ModalTabList role="tablist" aria-label="티커 생성 탭">
      <ModalTabButton
        type="button"
        role="tab"
        active={activeTab === 'preset'}
        aria-selected={activeTab === 'preset'}
        onClick={() => {
          trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
            cta_name: 'ticker_modal_tab_preset',
            mode
          });
          onSelectTab('preset');
        }}
      >
        <LayoutGrid size={15} aria-hidden focusable={false} />
        프리셋
      </ModalTabButton>
      <ModalTabButton
        type="button"
        role="tab"
        active={activeTab === 'input'}
        aria-selected={activeTab === 'input'}
        onClick={() => {
          trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
            cta_name: 'ticker_modal_tab_input',
            mode
          });
          onSelectTab('input');
        }}
      >
        <Pencil size={15} aria-hidden focusable={false} />
        직접 입력
      </ModalTabButton>
      {showSearchTab ? (
        <ModalTabButton
          type="button"
          role="tab"
          active={activeTab === 'search'}
          aria-selected={activeTab === 'search'}
          onClick={() => onSelectTab('search')}
        >
          검색
        </ModalTabButton>
      ) : null}
    </ModalTabList>
  );
}

export default TickerModalTabs;
