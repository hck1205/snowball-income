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
 * 좁은 폭에서 **설정 드로어(body 잠금)** 와 **티커 모달(html 잠금)** 이 겹칠 때 배경 스크롤이
 * 영구 잠기지 않는지 검증한다. 두 잠금이 서로 다른 엘리먼트를 소유한다는 것이 "정리 순서와
 * 무관하게 항상 풀린다"의 유일한 근거라, 그 주장을 순서를 바꿔가며 실제로 구동해 확인한다.
 *
 * 설정 패널은 이제 **전 해상도에서 오버레이 드로어**다. 갈리는 것은 "열려 있는가"가 아니라
 * **딤·스크롤 잠금을 걸 만큼 좁은가**(≤960)뿐이다 — 전역 `matchMedia` 스텁이 `matches: false` 라
 * 기본은 "딤 없음"이고, 좁은 폭은 아래에서 따로 스텁한다.
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
  onBackdropClick: vi.fn(),
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
 * Main.view 와 **같은 트리 순서**(드로어가 모달보다 앞선 형제)로 둘을 함께 마운트한다 —
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

describe('모바일 오버레이 스크롤 잠금 — 설정 드로어(body) × 티커 모달(html)', () => {
  beforeEach(() => {
    // 딤·스크롤 잠금이 걸리는 좁은 폭(≤960). 전역 스텁은 어떤 질의도 매치하지 않는다.
    stubViewportWidth(360);
  });

  afterEach(() => {
    restoreMatchMedia();
  });

  it('두 잠금은 서로 다른 엘리먼트를 소유한다(같은 값을 덮어쓰지 않는다)', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    renderHarness();

    // 드로어와 모달이 동시에 열려 있어도 각자 자기 엘리먼트만 잠근다.
    expect(locks()).toEqual({ body: 'hidden', html: 'hidden' });
    expect(screen.getByRole('dialog', { name: '티커 생성' })).toBeInTheDocument();
  });

  it('티커 저장처럼 드로어·모달이 같은 커밋에 함께 닫혀도 두 잠금이 모두 풀린다', () => {
    const view = renderHarness();
    expect(locks()).toEqual({ body: 'hidden', html: 'hidden' });

    // ⚠ 이것이 회귀의 핵심 동선이다: 둘 다 body 를 잠그던 시절엔 정리 순서(트리 순서) 탓에
    //    드로어가 ''로 되돌린 뒤 모달이 'hidden'을 복원해 페이지가 영영 잠겼다.
    view.act((handle) => handle.closeBoth());

    expect(locks()).toEqual({ body: '', html: '' });
  });

  it('닫히는 순서를 바꿔도(드로어 먼저 / 모달 먼저) 잠금이 남지 않는다', () => {
    const first = renderHarness();
    first.act((handle) => handle.closeDrawerOnly());
    // 모달은 아직 열려 있다 — html 만 잠긴 채 body 는 풀린다.
    expect(locks()).toEqual({ body: '', html: 'hidden' });
    first.act((handle) => handle.closeModalOnly());
    expect(locks()).toEqual({ body: '', html: '' });
    first.unmount();

    const second = renderHarness();
    second.act((handle) => handle.closeModalOnly());
    // 반대로 모달만 먼저 — body 만 잠긴 채 html 은 풀린다.
    expect(locks()).toEqual({ body: 'hidden', html: '' });
    second.act((handle) => handle.closeDrawerOnly());
    expect(locks()).toEqual({ body: '', html: '' });
  });

  it('언마운트(라우트 이동 등)로 한꺼번에 사라져도 잠금이 남지 않는다', () => {
    const view = renderHarness();
    expect(locks()).toEqual({ body: 'hidden', html: 'hidden' });

    view.unmount();

    expect(locks()).toEqual({ body: '', html: '' });
  });
});

/**
 * 🔄 **뒤집힌 계약(2026-07-28)**: 설정 패널은 이제 넓은 폭에서도 오버레이 드로어다.
 * 그래서 대조군은 "오버레이가 아니면 안 잠근다"가 아니라 **"딤이 없는 폭(≥961)에서는
 * 열려 있어도 스크롤을 잠그지 않는다"** 다 — 설정을 만지면서 결과를 계속 스크롤하는 동선이
 * 이 계약에 걸려 있다.
 */
describe('넓은 폭 대조군 — 드로어는 열리되 딤·스크롤 잠금은 걸리지 않는다', () => {
  beforeEach(() => {
    // 넓은 폭: `(max-width: 960px)` 는 false, `(min-width: 961px)` 는 true.
    stubViewportWidth(1440);
  });

  afterEach(() => {
    restoreMatchMedia();
  });

  it('드로어가 열려 있어도 body 를 잠그지 않는다(결과를 계속 스크롤할 수 있어야 한다)', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    const view = renderHarness();

    // 드로어는 실제로 열려 있다 — 잠금이 없는 이유가 "안 열려서"가 아님을 못 박는다.
    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');

    view.act((handle) => handle.closeBoth());
    expect(locks()).toEqual({ body: '', html: '' });
  });

  it('티커 모달이 열려도 html 을 잠그지 않는다(클래식 스크롤바가 사라져 배경이 밀리는 것 방지)', () => {
    expect(locks()).toEqual({ body: '', html: '' });

    const view = renderHarness();

    // 모달은 실제로 열려 있다 — 잠금이 없는 이유가 "안 떠서"가 아님을 못 박는다.
    expect(screen.getByRole('dialog', { name: '티커 생성' })).toBeInTheDocument();
    expect(locks()).toEqual({ body: '', html: '' });

    view.act((handle) => handle.closeBoth());
    expect(locks()).toEqual({ body: '', html: '' });
  });
});
