import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { SideDrawer } from '@/components/common';
import TickerModalView from '@/pages/Main/components/TickerModal/TickerModal.view';
import type { TickerModalViewProps } from '@/pages/Main/components/TickerModal/TickerModal.types';
import { restoreMatchMedia, stubViewportWidth } from '@/test';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

/**
 * 설정 드로어와 티커 생성 드로어가 겹칠 때 배경 스크롤이 **영구 잠기지 않는지** 검증한다.
 *
 * ## 🔄 뒤집힌 계약 (2026-08-11 티커 생성 모달 → 겹친 드로어)
 *
 * 종전 계약은 "**서로 다른 엘리먼트**를 잠근다"(설정=body · 티커 모달=html)였다. 두 층이 각자
 * 저장·복원하던 시절, 같은 엘리먼트를 두고 겹치면 먼저 닫히는 쪽이 남은 층의 잠금을 풀거나
 * 반대로 영구 잠금을 남겼기 때문이다.
 *
 * 지금은 두 층이 **같은 공용 `SideDrawer`** 이고, 잠금은 그 모듈의 **refcount** 가 소유한다.
 * 그래서 계약이 이렇게 바뀐다:
 *   · 잠그는 곳은 `body` **한 곳**이다. `html` 은 아무도 건드리지 않는다.
 *   · 두 층이 겹쳐도 잠금은 하나이고, **마지막 층이 닫힐 때만** 복원된다.
 *   · 티커 층은 `dimBelow='always'` 라 **넓은 폭에서도** 잠근다(겹친 층은 아래를 덮는 동선이다).
 *     설정 층은 `'drawer'`(≤960) 그대로 — 넓은 화면에서 조정↔확인 루프를 끊지 않는다.
 *
 * 이 파일이 지키는 것은 여전히 하나다: **어떤 순서로 닫아도 잠금이 남지 않는다.**
 */

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

const makeModalProps = (): TickerModalViewProps => ({
  isOpen: true,
  mode: 'create',
  selectedPreset: 'custom',
  presetTickers: PRESET_TICKERS,
  tickerDraft: makeDraft(''),
  onSelectPreset: vi.fn(),
  onChangeDraft: vi.fn(),
  onHelpExpectedTotalReturn: vi.fn(),
  onDelete: vi.fn(),
  onClose: vi.fn(),
  onSave: vi.fn()
});

type HarnessHandle = {
  closeBoth: () => void;
  closeDrawerOnly: () => void;
  closeModalOnly: () => void;
};

/**
 * Main.view 와 **같은 트리 순서**(설정 층이 티커 층보다 앞선 형제)로 둘을 함께 마운트한다 —
 * 언마운트 정리는 트리 순서로 도므로 순서를 바꾸면 검증 대상 자체가 달라진다.
 */
function Harness({ onReady }: { onReady: (handle: HarnessHandle) => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(true);

  onReady({
    closeBoth: () => {
      setIsDrawerOpen(false);
      setIsModalOpen(false);
    },
    closeDrawerOnly: () => setIsDrawerOpen(false),
    closeModalOnly: () => setIsModalOpen(false)
  });

  return (
    <>
      <SideDrawer
        id="config-drawer"
        isOpen={isDrawerOpen}
        title="투자 설정"
        closeLabel="설정 닫기"
        onClose={() => setIsDrawerOpen(false)}
      >
        <p>설정 패널</p>
      </SideDrawer>
      {isModalOpen ? <TickerModalView {...makeModalProps()} isOpen /> : null}
    </>
  );
}

const renderHarness = () => {
  let handle: HarnessHandle | null = null;
  const view = render(<Harness onReady={(next) => { handle = next; }} />);
  return {
    ...view,
    handle: () => handle as unknown as HarnessHandle,
    act: (run: (handle: HarnessHandle) => void) => {
      act(() => {
        run(handle as unknown as HarnessHandle);
      });
    }
  };
};

const locks = () => ({
  body: document.body.style.overflow,
  html: document.documentElement.style.overflow
});

describe('모바일 오버레이 스크롤 잠금 — 겹친 두 드로어가 body 잠금 하나를 공유한다', () => {
  beforeEach(() => {
    // 딤·스크롤 잠금이 걸리는 좁은 폭(≤960). 전역 스텁은 어떤 질의도 매치하지 않는다.
    stubViewportWidth(360);
  });

  afterEach(() => {
    restoreMatchMedia();
  });

  it('두 층이 겹쳐도 잠그는 곳은 body 한 곳이다 — html 은 아무도 건드리지 않는다', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    renderHarness();

    expect(locks()).toEqual({ body: 'hidden', html: '' });
    expect(screen.getByRole('complementary', { name: '티커 생성' })).toBeInTheDocument();
  });

  it('티커 저장처럼 두 층이 같은 커밋에 함께 닫혀도 잠금이 풀린다', () => {
    const view = renderHarness();
    expect(locks()).toEqual({ body: 'hidden', html: '' });

    /*
     * ⚠ 회귀의 핵심 동선. 층마다 저장·복원하던 시절엔 정리 순서(트리 순서) 탓에 한쪽이 ''로
     *   되돌린 뒤 다른 쪽이 'hidden'을 복원해 페이지가 영영 잠겼다. 지금은 refcount 가 막는다.
     */
    view.act((handle) => handle.closeBoth());

    expect(locks()).toEqual({ body: '', html: '' });
  });

  it('🔴 한 층만 닫혀도 잠금은 유지된다 — 남은 층 위에서 배경이 굴러가면 딤이 거짓말이 된다', () => {
    const first = renderHarness();

    first.act((handle) => handle.closeDrawerOnly());
    // 티커 층이 남아 있다 → 잠금도 남는다(조기 해제 금지).
    expect(locks()).toEqual({ body: 'hidden', html: '' });
    first.act((handle) => handle.closeModalOnly());
    expect(locks()).toEqual({ body: '', html: '' });
    first.unmount();

    const second = renderHarness();
    // 반대 순서도 같다 — 마지막 하나가 놓을 때만 복원된다.
    second.act((handle) => handle.closeModalOnly());
    expect(locks()).toEqual({ body: 'hidden', html: '' });
    second.act((handle) => handle.closeDrawerOnly());
    expect(locks()).toEqual({ body: '', html: '' });
  });

  it('언마운트(라우트 이동 등)로 한꺼번에 사라져도 잠금이 남지 않는다', () => {
    const view = renderHarness();
    expect(locks()).toEqual({ body: 'hidden', html: '' });

    view.unmount();

    expect(locks()).toEqual({ body: '', html: '' });
  });
});

describe('넓은 폭 — 설정 층은 잠그지 않고, 겹친 티커 층은 잠근다', () => {
  beforeEach(() => {
    // 넓은 폭: `(max-width: 960px)` 는 false, `(min-width: 961px)` 는 true.
    stubViewportWidth(1440);
  });

  afterEach(() => {
    restoreMatchMedia();
  });

  it('설정 층만 열려 있으면 잠그지 않는다 — 결과를 계속 스크롤할 수 있어야 한다', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    const view = renderHarness();
    // 티커 층을 닫아 설정 층만 남긴다(이 대조군의 관심사는 설정 층 단독 상태다).
    view.act((handle) => handle.closeModalOnly());

    // 드로어는 실제로 열려 있다 — 잠금이 없는 이유가 "안 열려서"가 아님을 못 박는다.
    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
    expect(locks()).toEqual({ body: '', html: '' });

    view.act((handle) => handle.closeDrawerOnly());
    expect(locks()).toEqual({ body: '', html: '' });
  });

  /**
   * 🔴 겹친 층은 **넓은 폭에서도** 잠근다(`dimBelow='always'`). 아래 층을 딤으로 덮은 채 배경이
   *    굴러가면 그 딤이 거짓말이 된다 — 딤과 잠금은 한 축이다.
   * ⚠ 잠금이 스크롤바를 없애 배경이 밀리는 문제는 `padding-right` 보정이 맡는다(`SideDrawer`).
   *    jsdom 은 스크롤바 폭이 0 이라 여기서는 보정값이 붙지 않는다.
   */
  it('겹친 티커 층은 넓은 폭에서도 body 를 잠근다', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    const view = renderHarness();

    expect(screen.getByRole('complementary', { name: '티커 생성' })).toBeInTheDocument();
    expect(locks()).toEqual({ body: 'hidden', html: '' });

    view.act((handle) => handle.closeBoth());
    expect(locks()).toEqual({ body: '', html: '' });
  });
});
