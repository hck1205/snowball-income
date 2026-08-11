import { useState, type ReactNode } from 'react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog, SideDrawer } from '@/components/common';
import { useSetActiveHelpWrite } from '@/jotai';
import HelpModal from '@/pages/Main/components/HelpModal';
import TickerModalView from '@/pages/Main/components/TickerModal/TickerModal.view';
import type { TickerModalViewProps } from '@/pages/Main/components/TickerModal/TickerModal.types';
import { useDrawerBackClose } from '@/shared/hooks';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

/**
 * **3층 중첩에서 뒤로가기·닫기가 두 칸 아래 층까지 걷어내지 않는다.**
 *
 * `test/main/overlayEscapeNesting.test.tsx` 가 Escape 에 대해 하는 일의 **뒤로가기 판**이다.
 * 두 제스처는 서로 다른 훅이 맡으므로(Escape=`useOverlayEscape`, 뒤로가기=`useDrawerBackClose`)
 * 한쪽이 초록이어도 다른 쪽은 깨져 있을 수 있다 — 실제로 그랬다.
 *
 * 왜 **3층**이어야 하는가(2026-07-30 실브라우저 재현): 히스토리 마커가 "현재 엔트리 1칸"만 보던
 * 시절엔 2층까지는 우연히 맞았다. 필터(3층)가 자기 엔트리를 되감으면 착지한 엔트리의 마커는
 * **모달(2층)의 것**이고, 그때 설정 드로어(1층)는 "내 마커가 아니다 = 사용자가 뒤로가기를 눌렀다"로
 * 오판해 스스로 닫혔다. 즉 2층 테스트로는 절대 잡히지 않는 결함이라 층을 하나 더 쌓는다.
 *
 * ⚠ 층이 닫히는 **모든 경로**(닫기 버튼·Escape·기기 뒤로가기)를 각각 본다 — 버튼과 Escape 는
 *   "되감기(`history.back()`)"를, 기기 뒤로가기는 "진짜 popstate"를 타므로 실패 모드가 다르다.
 */

const INITIAL_HREF = window.location.href;

/** jsdom 의 `history.back()` 은 비동기 태스크라 popstate 가 다음 틱에 온다. */
async function goBack() {
  window.history.back();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * 이펙트 정리에서 비동기로 날아오는 `history.back()`·popstate 까지 가라앉힌다.
 *
 * `act` 로 감싸는 이유: 그 popstate 가 **닫혀야 할 층의 상태를 갱신**하므로 밖에서 기다리면
 * "not wrapped in act" 경고가 뜨고, 무엇보다 단정 시점에 그 갱신이 커밋됐는지가 운에 달린다.
 */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
  });
}

afterEach(async () => {
  await settle();
  window.history.replaceState(null, '', INITIAL_HREF);
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
});

/* -------------------------------------------------------------------------- */
/* A. 훅 단독 — 합성 3층                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 층 하나. 열려 있는 동안만 자식(위층)을 렌더하므로 **여는 순서 = 쌓이는 순서**이고, 실제 화면처럼
 * 각 층이 서로의 존재를 모른 채 자기 히스토리 엔트리만 소유한다.
 */
function Layer({ name, onCloseSpy, children }: { name: string; onCloseSpy?: () => void; children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    onCloseSpy?.();
    setIsOpen(false);
  };

  useDrawerBackClose(isOpen, close);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        {name} 열기
      </button>
      {isOpen ? (
        <>
          <button type="button" onClick={close}>
            {name} 닫기
          </button>
          {children}
        </>
      ) : null}
    </>
  );
}

const isLayerOpen = (name: string) => screen.queryByRole('button', { name: `${name} 닫기` }) !== null;

async function openThreeLayers(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '1층 열기' }));
  await user.click(screen.getByRole('button', { name: '2층 열기' }));
  await user.click(screen.getByRole('button', { name: '3층 열기' }));
}

describe('중첩 뒤로가기 — 훅 단독 3층', () => {
  it('3층을 닫기 버튼으로 닫으면 1·2층은 그대로 남는다', async () => {
    const user = userEvent.setup();
    let bottomCloseCalls = 0;

    render(
      <Layer
        name="1층"
        onCloseSpy={() => {
          bottomCloseCalls += 1;
        }}
      >
        <Layer name="2층">
          <Layer name="3층" />
        </Layer>
      </Layer>
    );

    await openThreeLayers(user);
    await user.click(screen.getByRole('button', { name: '3층 닫기' }));
    await settle();

    expect(isLayerOpen('3층')).toBe(false);
    expect(isLayerOpen('2층')).toBe(true);
    // 회귀의 핵심: 되감기가 착지한 엔트리의 마커는 2층 것이라, 1층이 "남이 뒤로 갔다"고 오판했다.
    expect(isLayerOpen('1층')).toBe(true);
    expect(bottomCloseCalls).toBe(0);
  });

  it('기기 뒤로가기는 3층 → 2층 → 1층 순서로 한 겹씩만 걷는다', async () => {
    const user = userEvent.setup();
    render(
      <Layer name="1층">
        <Layer name="2층">
          <Layer name="3층" />
        </Layer>
      </Layer>
    );

    await openThreeLayers(user);
    const hrefWhileOpen = window.location.href;

    await goBack();
    await waitFor(() => {
      expect(isLayerOpen('3층')).toBe(false);
    });
    expect(isLayerOpen('2층')).toBe(true);
    expect(isLayerOpen('1층')).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isLayerOpen('2층')).toBe(false);
    });
    expect(isLayerOpen('1층')).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isLayerOpen('1층')).toBe(false);
    });

    // 세 번의 뒤로가기가 세 겹만 걷어냈다 = URL 은 한 번도 안 바뀌었다(페이지 이탈 없음).
    expect(window.location.href).toBe(hrefWhileOpen);
  });

  it('3층을 여닫기 반복해도 1·2층이 살아 있고 히스토리도 쌓이지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <Layer name="1층">
        <Layer name="2층">
          <Layer name="3층" />
        </Layer>
      </Layer>
    );

    await openThreeLayers(user);
    const lengthWhileOpen = window.history.length;

    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: '3층 닫기' }));
      await settle();
      expect(isLayerOpen('1층')).toBe(true);
      expect(isLayerOpen('2층')).toBe(true);

      await user.click(screen.getByRole('button', { name: '3층 열기' }));
      // 매번 "직전 닫기에서 되감은 자리"에 1개만 얹힌다 — 늘면 뒤로가기 한 번이 먹통이 된다.
      expect(window.history.length).toBe(lengthWhileOpen);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* B. 실제 화면 — 설정 드로어 → 티커 모달 → 프리셋 필터 드로어                    */
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

/** 실제 재현 경로와 같은 중첩: 설정 드로어 안에서 티커 모달을 열고, 그 안에서 필터를 연다. */
function RealHarness() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-controls="config-drawer"
        aria-expanded={isDrawerOpen}
        onClick={() => setIsDrawerOpen(true)}
      >
        설정 열기
      </button>
      <SideDrawer
        id="config-drawer"
        isOpen={isDrawerOpen}
        title="투자 설정"
        closeLabel="설정 닫기"
        // 인라인 화살표라 렌더마다 identity 가 바뀐다 — 실제 호출부와 같은 조건이다.
        onClose={() => setIsDrawerOpen(false)}
      >
        <button type="button" onClick={() => setIsModalOpen(true)}>
          티커 생성 열기
        </button>
      </SideDrawer>
      {isModalOpen ? <TickerModalView {...makeModalProps(() => setIsModalOpen(false))} /> : null}
    </>
  );
}

const isSettingsOpen = () => screen.getByRole('button', { name: '설정 열기' }).getAttribute('aria-expanded') === 'true';
const isModalOpen = () => screen.queryByRole('complementary', { name: '티커 생성' }) !== null;
const isFilterOpen = () => screen.queryByRole('dialog', { name: '프리셋 필터' }) !== null;

async function openSettingsModalFilter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '설정 열기' }));
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  await user.click(screen.getByRole('button', { name: '필터' }));
  expect(isFilterOpen()).toBe(true);
}

describe('중첩 뒤로가기 — 설정 드로어 > 티커 모달 > 필터 드로어', () => {
  it('필터를 닫기 버튼으로 닫으면 모달과 설정이 모두 남는다', async () => {
    const user = userEvent.setup();
    render(<RealHarness />);

    await openSettingsModalFilter(user);
    await user.click(screen.getByRole('button', { name: '필터 닫기' }));
    await settle();

    expect(isFilterOpen()).toBe(false);
    expect(isModalOpen()).toBe(true);
    // 실브라우저 실측 증상(2026-07-30): 필터만 닫았는데 설정 드로어까지 사라졌다.
    expect(isSettingsOpen()).toBe(true);
  });

  it('필터를 Escape 로 닫아도 모달과 설정이 모두 남는다', async () => {
    const user = userEvent.setup();
    render(<RealHarness />);

    await openSettingsModalFilter(user);
    await user.keyboard('{Escape}');
    await settle();

    expect(isFilterOpen()).toBe(false);
    expect(isModalOpen()).toBe(true);
    expect(isSettingsOpen()).toBe(true);
  });

  it('기기 뒤로가기는 필터 → 모달 → 설정 순서로 한 겹씩만 걷는다', async () => {
    const user = userEvent.setup();
    render(<RealHarness />);

    await openSettingsModalFilter(user);
    const hrefWhileOpen = window.location.href;

    await goBack();
    await waitFor(() => {
      expect(isFilterOpen()).toBe(false);
    });
    expect(isModalOpen()).toBe(true);
    expect(isSettingsOpen()).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isModalOpen()).toBe(false);
    });
    expect(isSettingsOpen()).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isSettingsOpen()).toBe(false);
    });

    expect(window.location.href).toBe(hrefWhileOpen);
  });
});

/* -------------------------------------------------------------------------- */
/* C. 드로어 위의 모달 — 도움말 · 공유 창                                        */
/* -------------------------------------------------------------------------- */

/**
 * **두 제스처를 한쪽만 배선하면 정확히 반대로 동작한다.**
 *
 * `HelpModal`·`ShareDialog` 는 2026-07-30 까지 `useOverlayEscape` 에만 참여했다 — Escape 는
 * 맨 위 한 겹만 닫혀 정상이었지만, **기기 뒤로가기**는 이 두 층을 보지 못해 그 아래 드로어의
 * 엔트리를 소비했다: 도움말은 그대로 남고 **뒤의 설정 드로어가 닫혔다.** 사용자가 "뒤로"에
 * 기대하는 것과 정확히 반대다. 위 A·B 절의 3층 하네스로는 안 잡힌다 — 그 층들은 모두 이미
 * 두 훅에 배선돼 있었기 때문이다.
 */

const HELP_TITLE = '배당률';

function HelpHarness() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const setActiveHelp = useSetActiveHelpWrite();

  return (
    <>
      <button
        type="button"
        aria-controls="help-harness-drawer"
        aria-expanded={isDrawerOpen}
        onClick={() => setIsDrawerOpen(true)}
      >
        설정 열기
      </button>
      <SideDrawer
        id="help-harness-drawer"
        isOpen={isDrawerOpen}
        title="투자 설정"
        closeLabel="설정 닫기"
        onClose={() => setIsDrawerOpen(false)}
      >
        <button type="button" onClick={() => setActiveHelp('dividendYield')}>
          도움말 열기
        </button>
      </SideDrawer>
      {/* 실제 화면과 같이 **항상 마운트**하고 열림은 atom 이 정한다(Main.view.tsx). */}
      <HelpModal onBackdropClick={() => setActiveHelp(null)} onClose={() => setActiveHelp(null)} />
    </>
  );
}

function ShareHarness() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-controls="share-harness-drawer"
        aria-expanded={isDrawerOpen}
        onClick={() => setIsDrawerOpen(true)}
      >
        설정 열기
      </button>
      <SideDrawer
        id="share-harness-drawer"
        isOpen={isDrawerOpen}
        title="투자 설정"
        closeLabel="설정 닫기"
        onClose={() => setIsDrawerOpen(false)}
      >
        <button type="button" onClick={() => setIsShareOpen(true)}>
          공유 창 열기
        </button>
      </SideDrawer>
      {isShareOpen ? (
        <ShareDialog
          url="https://example.com/share"
          onCopy={async () => undefined}
          onSelectChannel={() => undefined}
          // 인라인 화살표 — 렌더마다 identity 가 바뀌어도 엔트리가 쌓이지 않아야 한다.
          onClose={() => setIsShareOpen(false)}
        />
      ) : null}
    </>
  );
}

const renderWithStore = (ui: ReactNode) => render(<Provider store={createStore()}>{ui}</Provider>);

const isDrawerOpen = () => screen.getByRole('button', { name: '설정 열기' }).getAttribute('aria-expanded') === 'true';
const isHelpOpen = () => screen.queryByRole('dialog', { name: HELP_TITLE }) !== null;
const isShareOpen = () => screen.queryByRole('dialog', { name: '공유하기' }) !== null;

describe('중첩 뒤로가기 — 설정 드로어 > 도움말 모달', () => {
  it('기기 뒤로가기는 도움말만 닫고 드로어를 남긴다', async () => {
    const user = userEvent.setup();
    renderWithStore(<HelpHarness />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    await user.click(screen.getByRole('button', { name: '도움말 열기' }));
    expect(isHelpOpen()).toBe(true);
    const hrefWhileOpen = window.location.href;

    await goBack();
    await waitFor(() => {
      expect(isHelpOpen()).toBe(false);
    });
    // 회귀의 핵심: 이 훅에 참여하기 전에는 도움말이 남고 **드로어가** 닫혔다.
    expect(isDrawerOpen()).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isDrawerOpen()).toBe(false);
    });
    expect(window.location.href).toBe(hrefWhileOpen);
  });

  it('도움말을 닫기 버튼으로 닫으면 뒤로가기 횟수가 늘지 않는다', async () => {
    const user = userEvent.setup();
    renderWithStore(<HelpHarness />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    await user.click(screen.getByRole('button', { name: '도움말 열기' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await settle();

    expect(isHelpOpen()).toBe(false);
    expect(isDrawerOpen()).toBe(true);

    /*
     * ⚠ `history.length` 로는 못 잰다 — `history.back()` 은 엔트리를 **지우지 않고** 포인터만
     * 뒤로 옮기므로(앞쪽 엔트리가 남는다) 길이는 그대로 1 늘어난 채다. 실제로 사용자가 겪는
     * 것은 "뒤로 몇 번 눌러야 하나"이므로 그것을 직접 잰다 — 닫기 버튼이 자기 엔트리를 되감았다면
     * **한 번**에 드로어까지 닫힌다. 안 되감았다면 첫 뒤로가기가 빈 엔트리에 먹혀 아무 일도 없다.
     */
    await goBack();
    await waitFor(() => {
      expect(isDrawerOpen()).toBe(false);
    });
  });
});

describe('중첩 뒤로가기 — 설정 드로어 > 공유 창', () => {
  it('기기 뒤로가기는 공유 창만 닫고 드로어를 남긴다', async () => {
    const user = userEvent.setup();
    renderWithStore(<ShareHarness />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    await user.click(screen.getByRole('button', { name: '공유 창 열기' }));
    expect(isShareOpen()).toBe(true);

    await goBack();
    await waitFor(() => {
      expect(isShareOpen()).toBe(false);
    });
    expect(isDrawerOpen()).toBe(true);
  });

  it('링크 복사 후 닫기로 닫아도 뒤로가기 횟수가 늘지 않는다', async () => {
    const user = userEvent.setup();
    renderWithStore(<ShareHarness />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    await user.click(screen.getByRole('button', { name: '공유 창 열기' }));
    await user.click(screen.getByRole('button', { name: '링크 복사' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await settle();

    expect(isShareOpen()).toBe(false);
    expect(isDrawerOpen()).toBe(true);

    // 공유 창이 자기 엔트리를 되감았다면 뒤로가기 **한 번**에 드로어까지 닫힌다(위 도움말 절 참고).
    await goBack();
    await waitFor(() => {
      expect(isDrawerOpen()).toBe(false);
    });
  });
});
