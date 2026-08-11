import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog, SideDrawer } from '@/components/common';
import TickerModalView from '@/pages/Main/components/TickerModal/TickerModal.view';
import type { TickerModalViewProps } from '@/pages/Main/components/TickerModal/TickerModal.types';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

/**
 * **중첩 오버레이에서 Escape 한 번 = 맨 위 한 겹만 닫힌다.**
 *
 * 설정 드로어(`SideDrawer`) 위에는 티커 모달과 공유 창이 열린다. 각 층이 자기 Escape 리스너를
 * 전역(document/window)에 다는 구조라, 층끼리 순서를 합의하지 않으면 **한 번의 Escape 가 두 겹을
 * 함께 닫는다** — 사용자는 모달을 취소했을 뿐인데 설정까지 사라지고, 다시 열어 하던 자리로
 * 돌아가야 한다.
 *
 * 이 계약을 보는 테스트가 없어서 전 스위트가 그린인 채로 회귀가 랜딩했다(2026-07-29 리뷰).
 * 여기서는 **드로어가 열린 채로 남는가**를 층별로 못 박는다.
 */

const INITIAL_HREF = window.location.href;

/** 이펙트 정리에서 비동기로 날아오는 `history.back()`·popstate 까지 가라앉힌다. */
async function settle() {
  await new Promise((resolve) => {
    setTimeout(resolve, 30);
  });
}

afterEach(async () => {
  await settle();
  window.history.replaceState(null, '', INITIAL_HREF);
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
});

const makeDraft = (ticker: string): TickerDraft => ({
  name: ticker,
  ticker,
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 3,
  expectedTotalReturn: 6,
  frequency: 'monthly'
});

const PRESET_TICKERS = { A: makeDraft('A') } as unknown as Record<PresetTickerKey, TickerDraft>;

const makeModalProps = (onClose: () => void): TickerModalViewProps => ({
  isOpen: true,
  mode: 'create',
  selectedPreset: 'custom',
  presetTickers: PRESET_TICKERS,
  tickerDraft: makeDraft(''),
  onSelectPreset: vi.fn(),
  onChangeDraft: vi.fn(),
  onHelpExpectedTotalReturn: vi.fn(),
  onDelete: vi.fn(),
  onClose,
  onSave: vi.fn()
});

const openDrawerButton = () => screen.getByRole('button', { name: '설정 열기' });
const isDrawerOpen = () => openDrawerButton().getAttribute('aria-expanded') === 'true';

/** 설정 드로어 안에서 위층 오버레이를 여는, 실제 화면과 같은 중첩 구조. */
function Harness({ overlay }: { overlay: 'ticker-modal' | 'share-dialog' }) {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-controls="config-drawer"
        aria-expanded={isDrawerVisible}
        onClick={() => setIsDrawerVisible(true)}
      >
        설정 열기
      </button>
      <SideDrawer
        id="config-drawer"
        isOpen={isDrawerVisible}
        title="투자 설정"
        closeLabel="설정 닫기"
        // 인라인 화살표라 렌더마다 identity 가 바뀐다 — 실제 호출부와 같은 조건이다.
        onClose={() => setIsDrawerVisible(false)}
      >
        <button type="button" onClick={() => setIsOverlayOpen(true)}>
          위층 열기
        </button>
      </SideDrawer>
      {isOverlayOpen && overlay === 'ticker-modal' ? (
        <TickerModalView {...makeModalProps(() => setIsOverlayOpen(false))} />
      ) : null}
      {isOverlayOpen && overlay === 'share-dialog' ? (
        <ShareDialog
          url="https://snowball.example/?s=abc"
          onCopy={vi.fn()}
          onSelectChannel={vi.fn()}
          onClose={() => setIsOverlayOpen(false)}
        />
      ) : null}
    </>
  );
}

async function openDrawerThenOverlay(user: ReturnType<typeof userEvent.setup>) {
  await user.click(openDrawerButton());
  await user.click(screen.getByRole('button', { name: '위층 열기' }));
}

describe('중첩 오버레이 Escape — 한 번에 한 겹만 닫힌다', () => {
  it('설정 드로어 위 티커 모달에서 Escape 를 누르면 모달만 닫힌다', async () => {
    const user = userEvent.setup();
    render(<Harness overlay="ticker-modal" />);

    await openDrawerThenOverlay(user);
    expect(screen.getByRole('complementary', { name: '티커 생성' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('complementary', { name: '티커 생성' })).not.toBeInTheDocument();
    // 회귀의 핵심: 모달을 취소했을 뿐인데 뒤의 설정까지 사라지면 사용자는 하던 자리를 잃는다.
    expect(isDrawerOpen()).toBe(true);
  });

  it('설정 드로어 위 공유 창에서 Escape 를 누르면 공유 창만 닫힌다', async () => {
    const user = userEvent.setup();
    render(<Harness overlay="share-dialog" />);

    await openDrawerThenOverlay(user);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isDrawerOpen()).toBe(true);
  });

  it('위층을 닫은 뒤의 Escape 는 그제서야 드로어를 닫는다(두 번째 Escape 로 순서대로)', async () => {
    const user = userEvent.setup();
    render(<Harness overlay="ticker-modal" />);

    await openDrawerThenOverlay(user);

    await user.keyboard('{Escape}');
    expect(isDrawerOpen()).toBe(true);

    // 위층이 사라졌으니 이제 드로어가 Escape 의 주인이다 — "영영 안 닫힌다"가 아님을 못 박는다.
    await user.keyboard('{Escape}');
    expect(isDrawerOpen()).toBe(false);
  });

  it('드로어 없이 열린 오버레이도 Escape 로 닫힌다(대조군 — 스택이 단독 오버레이를 막지 않는다)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ShareDialog url="https://snowball.example/?s=abc" onCopy={vi.fn()} onSelectChannel={vi.fn()} onClose={onClose} />
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
