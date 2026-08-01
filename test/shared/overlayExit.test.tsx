import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { SideDrawer } from '@/components/common';
import { useSetActiveHelpWrite } from '@/jotai';
import HelpModal from '@/pages/Main/components/HelpModal';
import { useOverlayPresence } from '@/shared/hooks';

/**
 * **오버레이는 즉시 사라지지 않는다** — 퇴장 모션이 그려질 시간을 갖는다.
 *
 * 2026-07-31 이전 이 앱의 퇴장 애니메이션은 **0곳**이었다. 모달은 호출부가 조건부로 마운트해서
 * 닫기 = 즉시 언마운트였고, 그래서 열 때는 부드럽고 닫을 때는 화면이 뚝 끊겼다.
 *
 * 🔴 **소스만 봐서는 통과한다.** `sb-modal-sink` 키프레임이 선언돼 있어도 트리가 그 프레임 전에
 *   사라지면 아무 일도 일어나지 않는다 — 그래서 여기서는 **DOM 이 실제로 남아 있는가**를 잰다.
 *
 * 잔류 시간(`MODAL_EXIT_MS` = 120ms)은 진입(200ms)의 60% 다. 사라지는 것은 이미 관심 밖이라
 * 같은 시간을 쓰면 "안 없어진다"로 느껴진다.
 */

afterEach(() => {
  vi.useRealTimers();
  document.body.style.overflow = '';
});

describe('useOverlayPresence — 닫은 뒤에도 잠깐 살아 있다', () => {
  it('열림은 즉시 통과시킨다 (여는 쪽에 한 프레임도 미루지 않는다)', () => {
    const { result, rerender } = renderHook(({ open }) => useOverlayPresence(open, 120), {
      initialProps: { open: null as string | null }
    });

    expect(result.current.value).toBeNull();

    rerender({ open: '도움말' });

    expect(result.current.value).toBe('도움말');
    expect(result.current.phase).toBe('enter');
  });

  it('닫으면 값이 잔류하고 단계가 exit 으로 바뀐다 — 시간이 지나야 비워진다', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ open }) => useOverlayPresence(open, 120), {
      initialProps: { open: '도움말' as string | null }
    });

    rerender({ open: null });

    // 닫은 직후: 아직 그려야 한다.
    expect(result.current.value).toBe('도움말');
    expect(result.current.phase).toBe('exit');

    await act(async () => {
      vi.advanceTimersByTime(119);
    });
    expect(result.current.value).toBe('도움말');

    await act(async () => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.value).toBeNull();
  });

  it('퇴장 도중 다시 열면 잔류 타이머가 취소된다 (열어 둔 오버레이가 스스로 사라지지 않는다)', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ open }) => useOverlayPresence(open, 120), {
      initialProps: { open: '도움말' as string | null }
    });

    rerender({ open: null });
    await act(async () => {
      vi.advanceTimersByTime(60);
    });
    rerender({ open: '도움말' });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.value).toBe('도움말');
    expect(result.current.phase).toBe('enter');
  });
});

/**
 * 훅만 초록이고 화면은 그대로일 수 있다 — **실제 모달 하나**로 끝까지 잰다.
 *
 * 🔴 퇴장 중인 껍데기는 **다이얼로그가 아니다.** 닫은 순간 접근성 트리에서는 사라져야 하고
 *   (보조기기가 "닫았는데 아직 열린 대화상자"를 읽으면 안 된다), 화면에만 120ms 더 남는다.
 */
describe('HelpModal — 닫으면 다이얼로그는 즉시 사라지고 껍데기만 잠깐 남는다', () => {
  function HelpHarness() {
    const setActiveHelp = useSetActiveHelpWrite();

    return (
      <>
        <button type="button" onClick={() => setActiveHelp('dividendYield')}>
          도움말 열기
        </button>
        <HelpModal onClose={() => setActiveHelp(null)} onBackdropClick={() => setActiveHelp(null)} />
      </>
    );
  }

  it('닫기 직후 role=dialog 는 없어지지만 본문은 아직 DOM 에 있다', async () => {
    render(
      <Provider store={createStore()}>
        <HelpHarness />
      </Provider>
    );

    act(() => {
      screen.getByRole('button', { name: '도움말 열기' }).click();
    });

    const dialog = screen.getByRole('dialog');
    const title = dialog.querySelector('h3')?.textContent ?? '';
    expect(title.length).toBeGreaterThan(0);

    act(() => {
      screen.getByRole('button', { name: '닫기' }).click();
    });

    // 접근성 트리에서는 즉시 사라진다.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // 그러나 화면에는 아직 있다 — 여기가 퇴장 모션이 그려지는 시간이다.
    expect(document.body.textContent).toContain(title);

    // 그리고 곧 정리된다(고아 노드가 남지 않는다).
    await waitFor(() => {
      expect(document.body.textContent).not.toContain(title);
    });
  });

  /*
   * 🔴 **퇴장 120ms 동안 포커스가 `aria-hidden` 서브트리 안에 남으면 안 된다**(axe `aria-hidden-focus`).
   *   '닫기' 버튼을 눌러 닫으면 그 버튼이 바로 그 서브트리 안에 있다. 그 뒤 트리가 사라지면 포커스는
   *   `<body>` 로 떨어져 키보드 사용자가 문서 맨 처음부터 다시 탭해 내려와야 한다.
   *   두 문제의 답이 같다 — **열기 트리거로 되돌린다.**
   */
  it('🔴 닫으면 포커스가 열기 트리거로 돌아온다 (감춰진 서브트리에 포커스를 남기지 않는다)', () => {
    render(
      <Provider store={createStore()}>
        <HelpHarness />
      </Provider>
    );

    const trigger = screen.getByRole('button', { name: '도움말 열기' });
    act(() => {
      // 실제 브라우저는 버튼을 누르면 포커스가 그 버튼에 간다 — 그 상태에서 모달이 열린다.
      trigger.focus();
      trigger.click();
    });

    const close = screen.getByRole('button', { name: '닫기' });
    act(() => {
      close.focus();
      close.click();
    });

    expect(document.activeElement).toBe(trigger);
    // 퇴장 중인 껍데기는 감춰져 있고, 그 안에 포커스가 없다.
    expect(close.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(close.contains(document.activeElement)).toBe(false);
  });
});

/**
 * 드로어의 퇴장은 훅이 아니라 **"패널이 항상 마운트"** 라는 계약이 만든다 —
 * 닫힘도 열림과 같은 `transition` 한 벌을 타고 슬라이드해 나간다.
 *
 * 🔴 조건부 마운트(`{isOpen && …}`)로 바꾸면 이 퇴장이 통째로 사라진다(그리고 자동저장 flush 와
 *   ref 등록 3종이 무음 no-op 이 된다 — `test/main/settingsDrawerAlwaysMounted.test.tsx`).
 */
describe('SideDrawer — 닫아도 패널은 사라지지 않는다(슬라이드해 나간다)', () => {
  function Harness() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setIsOpen(false)}>
          닫기 트리거
        </button>
        <SideDrawer id="exit-drawer" isOpen={isOpen} title="설정" closeLabel="설정 닫기" onClose={() => setIsOpen(false)}>
          <p>본문</p>
        </SideDrawer>
      </>
    );
  }

  it('닫은 뒤에도 패널과 본문이 DOM 에 남는다 (transition 이 그릴 대상이 있다)', () => {
    render(<Harness />);

    expect(screen.getByText('본문')).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: '닫기 트리거' }).click();
    });

    // 언마운트되지 않는다 — 대신 visibility 로 숨는다(스크린리더·탭 이동에서는 빠진다).
    const panel = screen.getByText('본문').closest('aside');
    expect(panel).not.toBeNull();
    expect(window.getComputedStyle(panel as Element).visibility).toBe('hidden');
    // 화면 밖으로 밀려나는 transform 이 선언돼 있어야 "슬라이드해 나간다"가 성립한다.
    expect(window.getComputedStyle(panel as Element).transform).toContain('-100%');
  });
});
