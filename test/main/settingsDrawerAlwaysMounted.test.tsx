import { useRef, useState } from 'react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MainPage } from '@/pages';
import SettingsDrawer from '@/pages/Main/components/SettingsDrawer';
import { SIMULATOR_COPY } from '@/shared/constants';

/**
 * 🔴 **설정 드로어의 좌패널은 조건부 마운트가 아니다.**
 *
 * `SettingsDrawer` 안의 `MainLeftPanel` 은 ①IndexedDB 하이드레이션 트리거와
 * ②`onHydratedChange` · `onRegisterRetryCloudSave` · `onRegisterResumeConflict` 세 배선의 **소유자**다.
 * `{isOpen && <MainLeftPanel/>}` 로 바꾸는 순간 조용히 세 가지가 한꺼번에 무너진다.
 *
 *  - 첫 렌더에 드로어가 닫혀 있으므로 하이드레이션이 시작되지 않는다 → 우패널이 **영구 로더**로 굳는다.
 *  - 여닫을 때마다 자동저장 언마운트 flush 가 돌아 IndexedDB 쓰기가 반복된다.
 *  - 헤더의 "다시 시도"·"다시 열기"가 등록 해제된 채 남아 **무음 no-op** 이 된다.
 *
 * 이 파일은 그 전제를 코드 주석이 아니라 **동작으로** 못 박는다.
 */

/**
 * 드로어가 닫혀 있으면 `visibility: hidden` 이라 접근성 트리에서 빠진다 — 그래서 "DOM 에 있다"는
 * 역할 쿼리로 볼 수 없다(`hidden: true` 를 줘도 숨은 노드의 **접근명 계산이 빈 문자열**이 되어 못 찾는다).
 * `getByLabelText` 는 `aria-label` 속성을 직접 보므로 가시성과 무관하게 존재를 관측할 수 있다.
 */
const tickerCreateButton = () => screen.getByLabelText('티커 생성 열기');

describe('설정 드로어 — 닫혀 있어도 좌패널은 살아 있다', () => {
  it('드로어를 한 번도 열지 않아도 하이드레이션이 끝나 결과 화면이 나온다', () => {
    render(
      <Provider store={createStore()}>
        <MainPage />
      </Provider>
    );

    // 우패널은 `isPortfolioHydrated` 게이트 뒤에 있다 — 조건부 마운트면 여기서 로더가 대신 보인다.
    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
    expect(screen.queryByText('결과를 불러오는 중…')).not.toBeInTheDocument();

    // 설정은 DOM 에 있고(항상 마운트), 다만 닫혀 있어 보이지도 탭 이동에 닿지도 않는다.
    expect(tickerCreateButton()).toBeInTheDocument();
    expect(tickerCreateButton()).not.toBeVisible();
    expect(screen.queryByRole('button', { name: '티커 생성 열기' })).not.toBeInTheDocument();
  });

  it('여닫기를 반복해도 결과가 로더로 되돌아가지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createStore()}>
        <MainPage />
      </Provider>
    );

    const trigger = screen.getByRole('button', { name: SIMULATOR_COPY.settingsTitle });

    await user.click(trigger);
    expect(screen.getByRole('button', { name: '티커 생성 열기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '설정 닫기' }));
    await user.click(trigger);

    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();
    expect(screen.queryByText('결과를 불러오는 중…')).not.toBeInTheDocument();
  });
});

describe('설정 드로어 — ref 배선 3종은 드로어 상태와 무관하다', () => {
  /**
   * Main.view 와 **같은 배선**(등록 콜백 → ref 대입 → 헤더가 ref 를 통해 호출)을 그대로 재현한다.
   *
   * ⚠ 좌패널의 등록 effect 는 `retryCloudSave` identity 가 바뀔 때마다 `null` → 함수로 재등록한다
   *   (설계된 동작 — ref 대입이라 리렌더를 안 만든다). 그래서 계약은 "null 이 한 번도 안 온다"가 아니라
   *   **"여닫기 뒤에도 ref 가 살아 있는 함수를 쥐고 있다"** 다. 조건부 마운트면 마지막 정리에서
   *   `null` 로 끝나 헤더 버튼이 무음 no-op 이 된다.
   */
  function Harness({ onHydratedChange, probe }: { onHydratedChange: (value: boolean) => void; probe: Probe }) {
    const [isOpen, setIsOpen] = useState(false);
    const retryRef = useRef<(() => void) | null>(null);
    const resumeRef = useRef<(() => void) | null>(null);

    probe.readRetry = () => retryRef.current;
    probe.readResume = () => resumeRef.current;

    return (
      <>
        <button type="button" aria-controls="config" aria-expanded={isOpen} onClick={() => setIsOpen((v) => !v)}>
          설정 토글
        </button>
        <SettingsDrawer
          drawerId="config"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onHydratedChange={onHydratedChange}
          onRegisterRetryCloudSave={(fn) => {
            retryRef.current = fn;
          }}
          onRegisterResumeConflict={(fn) => {
            resumeRef.current = fn;
          }}
        />
      </>
    );
  }

  type Probe = { readRetry: () => (() => void) | null; readResume: () => (() => void) | null };

  const renderHarness = () => {
    const onHydratedChange = vi.fn();
    const probe: Probe = { readRetry: () => null, readResume: () => null };

    render(
      <Provider store={createStore()}>
        <Harness onHydratedChange={onHydratedChange} probe={probe} />
      </Provider>
    );

    return { onHydratedChange, probe, user: userEvent.setup() };
  };

  it('드로어가 닫힌 채 마운트돼도 세 배선이 모두 걸린다', () => {
    const { onHydratedChange, probe } = renderHarness();

    expect(onHydratedChange).toHaveBeenCalledWith(true);
    expect(probe.readRetry()).toBeTypeOf('function');
    expect(probe.readResume()).toBeTypeOf('function');
  });

  it('여닫기를 반복해도 헤더가 쥔 함수가 살아 있다(무음 no-op 이 되지 않는다)', async () => {
    const { probe, user } = renderHarness();

    const toggle = screen.getByRole('button', { name: '설정 토글' });
    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);

    expect(probe.readRetry()).toBeTypeOf('function');
    expect(probe.readResume()).toBeTypeOf('function');
  });

  it('하이드레이션 신호는 드로어를 열지 않아도 참으로 끝난다', () => {
    const { onHydratedChange } = renderHarness();

    const last = onHydratedChange.mock.calls[onHydratedChange.mock.calls.length - 1];
    expect(last).toEqual([true]);
  });
});
