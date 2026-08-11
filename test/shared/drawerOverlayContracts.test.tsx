import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from '@/components/common';
import { PickerDrawer } from '@/pages/DividendCalendar/components/PickerDrawer';
import { HoldingPickerDrawer } from '@/pages/Portfolio/components/HoldingPickerDrawer';
import TickerModalView from '@/pages/Main/components/TickerModal/TickerModal.view';
import type { TickerModalViewProps } from '@/pages/Main/components/TickerModal/TickerModal.types';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import { restoreMatchMedia, stubViewportWidth } from '@/test';

/**
 * **페이지 드로어 3벌의 오버레이 계약** — 뒤로가기·Escape·중첩·스크롤락.
 *
 * 왜 이 파일이 필요한가: 2026-07-30 까지 이 드로어들은 공용 껍데기를 각자 **복제**하고 있었고
 * 복제본은 `useOverlayEscape`(중첩 스택)를 빠뜨렸다. 그 결손은 **각자 잘 동작한다** — 그 화면에
 * 위층 오버레이가 없으면 증상이 0이라 어떤 렌더 테스트도 빨개지지 않는다. 그래서 여기서는
 * 각 드로어 위에 **실제로 한 겹을 더 올려** "Escape 한 번 = 맨 위 한 겹"을 못 박는다.
 * (`test/main/overlayEscapeNesting.test.tsx` 가 설정 드로어에 대해 하는 일의 페이지 판이다.)
 *
 * ⚠ Escape 는 `userEvent.keyboard` 로 보낸다 — 실제 브라우저처럼 포커스된 요소(없으면 `body`)에서
 *   올라가므로 리스너를 document/window 어디로 옮겨도 경로가 유지된다. `fireEvent.keyDown(window)`
 *   는 전파 경로가 `[window]` 하나뿐이라 조용히 위음성이 된다.
 */

const INITIAL_HREF = window.location.href;

/** jsdom 의 `history.back()` 은 비동기 태스크라 popstate 가 다음 틱에 온다. */
async function goBack() {
  window.history.back();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** 이펙트 정리에서 비동기로 날아오는 `history.back()`·popstate 까지 가라앉힌다. */
async function settle() {
  await new Promise((resolve) => {
    setTimeout(resolve, 30);
  });
}

afterEach(async () => {
  await settle();
  restoreMatchMedia();
  window.history.replaceState(null, '', INITIAL_HREF);
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
});

/* -------------------------------------------------------------------------- */
/* A. 목록 피커 드로어 2벌 (포트폴리오 / 배당 캘린더)                            */
/* -------------------------------------------------------------------------- */

/** 두 피커는 prop 계약이 같다 — 같은 하네스에 태워 한쪽만 고쳐지는 일을 막는다. */
const PICKER_DRAWERS = [
  ['포트폴리오 종목 추가', HoldingPickerDrawer],
  ['배당 캘린더 종목 선택', PickerDrawer]
] as const;

function PickerHarness({ Drawer }: { Drawer: (typeof PICKER_DRAWERS)[number][1] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <button type="button" aria-controls="picker-drawer" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        피커 열기
      </button>
      <Drawer
        id="picker-drawer"
        isOpen={isOpen}
        title="종목 고르기"
        closeLabel="종목 고르기 닫기"
        // 인라인 화살표라 렌더마다 identity 가 바뀐다 — 실제 호출부와 같은 조건이다.
        onClose={() => setIsOpen(false)}
      >
        <input aria-label="종목 검색" />
        <button type="button" onClick={() => setIsShareOpen(true)}>
          위층 열기
        </button>
      </Drawer>
      {isShareOpen ? (
        <ShareDialog
          url="https://snowball.example/?s=abc"
          onCopy={vi.fn()}
          onSelectChannel={vi.fn()}
          onClose={() => setIsShareOpen(false)}
        />
      ) : null}
    </>
  );
}

const pickerTrigger = () => screen.getByRole('button', { name: '피커 열기' });
const isPickerOpen = () => pickerTrigger().getAttribute('aria-expanded') === 'true';

describe.each(PICKER_DRAWERS)('%s 드로어 — 오버레이 계약', (_label, Drawer) => {
  it('Escape 로 닫힌다', async () => {
    const user = userEvent.setup();
    render(<PickerHarness Drawer={Drawer} />);

    await user.click(pickerTrigger());
    expect(isPickerOpen()).toBe(true);

    await user.keyboard('{Escape}');

    expect(isPickerOpen()).toBe(false);
  });

  it('뒤로가기로 닫히고, 그때 URL 은 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    render(<PickerHarness Drawer={Drawer} />);

    const urlBeforeOpen = window.location.href;
    await user.click(pickerTrigger());
    expect(window.location.href).toBe(urlBeforeOpen);

    await goBack();

    await waitFor(() => expect(isPickerOpen()).toBe(false));
    expect(window.location.href).toBe(urlBeforeOpen);
  });

  it('위층(공유 창)이 열려 있으면 Escape 는 공유 창만 닫고, 한 번 더 눌러야 드로어가 닫힌다', async () => {
    const user = userEvent.setup();
    render(<PickerHarness Drawer={Drawer} />);

    await user.click(pickerTrigger());
    await user.click(screen.getByRole('button', { name: '위층 열기' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    // 회귀의 핵심: 공유 창을 취소했을 뿐인데 뒤의 피커까지 사라지면 고르던 자리를 잃는다.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isPickerOpen()).toBe(true);

    // "그럼 영영 안 닫히나"도 함께 못 박는다 — 위층이 사라졌으니 이제 드로어의 차례다.
    await user.keyboard('{Escape}');
    expect(isPickerOpen()).toBe(false);
  });

  it('넓은 화면에서도 배경 스크롤을 잠근다 — 피커는 전 폭 모달이다(설정 드로어와 반대)', async () => {
    // 설정 드로어는 같은 폭에서 잠그지 **않는다**(조정↔확인 루프 보존, SideDrawer.test.tsx).
    // 두 정책이 한 컴포넌트 안에서 갈리므로 양쪽을 각자의 테스트가 지켜야 한다.
    stubViewportWidth(1440);
    const user = userEvent.setup();
    render(<PickerHarness Drawer={Drawer} />);

    await user.click(pickerTrigger());
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: '종목 고르기 닫기' }));
    // 절대값으로 단정한다 — "열기 전 값과 같다"는 앞선 누수가 있을수록 초록이 되는 역-신호다.
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });
});

/* -------------------------------------------------------------------------- */
/* B. 프리셋 필터 드로어 (티커 모달 안에 중첩)                                   */
/* -------------------------------------------------------------------------- */

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

const filterDrawer = () => screen.queryByRole('dialog', { name: '프리셋 필터' });
const tickerModal = () => screen.queryByRole('complementary', { name: '티커 생성' });

/** 필터는 모달의 프리셋 탭 검색행에서 연다(앱 전체에서 `aria-expanded` 를 가진 유일한 버튼). */
async function openFilter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '필터' }));
  await waitFor(() => expect(filterDrawer()).not.toBeNull());
}

describe('프리셋 필터 드로어 — 티커 모달 위 한 겹', () => {
  it('Escape 는 필터만 닫는다 — 뒤의 티커 모달은 남는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TickerModalView {...makeModalProps(onClose)} />);

    await openFilter(user);
    await user.keyboard('{Escape}');

    expect(filterDrawer()).toBeNull();
    expect(tickerModal()).not.toBeNull();
    // 옛 구현은 포커스가 패널 안에 있을 때만 전파를 끊었다 — 포커스가 밖이면 모달까지 닫혔다.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('패널 안 빈 곳을 클릭해 포커스가 빠져도 Escape 는 필터만 닫는다', async () => {
    /*
     * 🔴 옛 구현(패널 React `onKeyDown` + `nativeEvent.stopPropagation`)이 **실제로 틀렸던 자리**다.
     * 라벨처럼 포커서블이 아닌 곳을 누르면 포커스가 `body` 로 떨어지고, 그때 Escape 는 패널 핸들러를
     * 거치지 않아 전파 차단이 무효가 된다 → 필터가 아니라 **모달이 닫힌다**. 포커스가 패널 안에
     * 있는 동안만 초록이던 계약이라, 이 케이스 없이는 스택 참여를 되돌려도 테스트가 안 빨개진다
     * (뮤테이션 실측 2026-07-30).
     */
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TickerModalView {...makeModalProps(onClose)} />);

    await openFilter(user);
    await user.click(screen.getByText('지급 주기'));
    expect(document.activeElement).toBe(document.body);

    await user.keyboard('{Escape}');

    expect(filterDrawer()).toBeNull();
    expect(tickerModal()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('필터가 닫힌 뒤의 Escape 는 그제서야 모달을 닫는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TickerModalView {...makeModalProps(onClose)} />);

    await openFilter(user);
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('뒤로가기 1회도 필터만 닫는다 — URL 은 그대로다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TickerModalView {...makeModalProps(onClose)} />);

    const urlBeforeOpen = window.location.href;
    await openFilter(user);
    await goBack();

    await waitFor(() => expect(filterDrawer()).toBeNull());
    expect(tickerModal()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(window.location.href).toBe(urlBeforeOpen);
  });

  it('배경 스크롤락을 추가하지 않는다 — 잠금은 티커 드로어 것 하나뿐이다', async () => {
    /*
     * 🔄 2026-08-11: 티커 생성이 모달 → **겹친 드로어**가 되면서 잠금의 주인이 바뀌었다.
     *   종전에는 모달이 좁은 폭에서 `documentElement` 를 잠갔고, 이 필터 패널이 `body` 까지
     *   잠그면 두 잠금이 얽혀 "페이지 영구 잠김"이 되살아났다.
     *   지금은 티커 층이 공용 드로어의 **refcount 잠금(body)** 을 쥐고, `html` 은 아무도 안 만진다.
     *   이 패널이 지켜야 할 것은 그대로다 — **잠금을 하나 더 만들지 않는다.**
     * ⚠ 여기서 `body: 'hidden'` 은 필터가 아니라 **티커 층**이 걸어 둔 것이다. 필터를 닫아도
     *   남아 있어야 정상이고, 그 해제는 티커 층이 닫힐 때 일어난다(overlayScrollLock 이 잠근다).
     */
    stubViewportWidth(360);
    const user = userEvent.setup();
    render(<TickerModalView {...makeModalProps(vi.fn())} />);

    await openFilter(user);

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('hidden');
  });
});
