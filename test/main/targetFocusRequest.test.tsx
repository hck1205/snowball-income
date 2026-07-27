import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TargetFocusRequest } from '@/pages/Main/components/MainRightPanel/components';
import {
  FOCUS_TARGET_MONTHLY_DIVIDEND_STATE,
  TARGET_MONTHLY_DIVIDEND_MAX,
  buildFocusTargetMonthlyDividendState
} from '@/shared/constants';

/**
 * 내 포트폴리오의 목표 달성 카드 → 시뮬레이터 이동 시 실려 오는 **목표 요청**의 수신 계약.
 *
 * 여기서만 잡히는 회귀 넷: ①요청을 처리하고도 `location.state`를 안 지워 새로고침·뒤로가기마다
 * 값이 다시 덮이고 포커스가 튀는 것 ②요청이 없는 평범한 진입에서도 포커스를 빼앗는 것
 * ③프리필 값이 폼에 커밋되지 않는 것 ④히스토리를 조작해 넣은 이상한 값이 그대로 저장되는 것.
 */

const LocationProbe = ({ onState }: { onState: (state: unknown) => void }) => {
  const location = useLocation();
  onState(location.state);
  return null;
};

const renderWithState = (state: unknown) => {
  const onFocusTarget = vi.fn();
  const onApplyTarget = vi.fn();
  let lastState: unknown = 'unset';

  render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
      <TargetFocusRequest onApplyTarget={onApplyTarget} onFocusTarget={onFocusTarget} />
      <LocationProbe
        onState={(value) => {
          lastState = value;
        }}
      />
    </MemoryRouter>
  );

  return { onApplyTarget, onFocusTarget, readState: () => lastState };
};

describe('TargetFocusRequest — 목표 입력 포커스 요청 수신', () => {
  it('요청이 실려 오면 한 번만 포커스를 요청하고 state를 지운다', async () => {
    const { onFocusTarget, readState } = renderWithState(FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);

    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));
    // 소거되지 않으면 새로고침·뒤로가기에서 같은 요청이 되살아나 사용자 입력을 빼앗는다.
    await waitFor(() => expect(readState()).toBeNull());
    expect(onFocusTarget).toHaveBeenCalledTimes(1);
  });

  it('요청이 없으면 아무 일도 하지 않는다', async () => {
    const { onFocusTarget, readState } = renderWithState(null);

    await waitFor(() => expect(readState()).toBeNull());
    expect(onFocusTarget).not.toHaveBeenCalled();
  });

  it('모양이 다른 state는 요청으로 오인하지 않는다', async () => {
    const { onFocusTarget } = renderWithState({ focusTargetMonthlyDividend: 'yes' });

    await waitFor(() => expect(onFocusTarget).not.toHaveBeenCalled());
  });

  it('StrictMode의 이중 마운트에서도 포커스를 두 번 빼앗지 않는다', async () => {
    const onFocusTarget = vi.fn();

    render(
      <StrictMode>
        <MemoryRouter initialEntries={[{ pathname: '/', state: FOCUS_TARGET_MONTHLY_DIVIDEND_STATE }]}>
          <TargetFocusRequest onApplyTarget={vi.fn()} onFocusTarget={onFocusTarget} />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));
  });

  /*
   * 소거 후 같은 화면에서 패널이 다시 마운트되는 경우(탭 전환·조건부 렌더 복귀).
   * ref는 마운트마다 새로 생기므로, 재발화를 막는 것은 ref가 아니라 **state가 비어 있다는 사실**이다.
   */
  it('요청을 처리한 뒤 다시 마운트돼도 포커스가 재발화하지 않는다', async () => {
    const onFocusTarget = vi.fn();
    let remount: () => void = () => undefined;

    const Host = () => {
      const [key, setKey] = useState(0);
      remount = () => setKey((value) => value + 1);
      return <TargetFocusRequest key={key} onApplyTarget={vi.fn()} onFocusTarget={onFocusTarget} />;
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: FOCUS_TARGET_MONTHLY_DIVIDEND_STATE }]}>
        <Host />
      </MemoryRouter>
    );

    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));

    act(() => remount());
    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));
  });
});

describe('TargetFocusRequest — 목표 값 프리필', () => {
  it('실려 온 값을 폼에 커밋한 뒤 포커스하고 state를 지운다', async () => {
    const { onApplyTarget, onFocusTarget, readState } = renderWithState(
      buildFocusTargetMonthlyDividendState(1_500_000)
    );

    await waitFor(() => expect(onApplyTarget).toHaveBeenCalledTimes(1));
    expect(onApplyTarget).toHaveBeenCalledWith(1_500_000);
    // 값이 들어간 뒤에 포커스가 가야 사용자가 "무엇이 채워졌는지" 확인할 수 있다.
    expect(onApplyTarget.mock.invocationCallOrder[0]).toBeLessThan(onFocusTarget.mock.invocationCallOrder[0]);
    await waitFor(() => expect(readState()).toBeNull());
  });

  it('값 없는 기존 요청은 커밋 없이 포커스만 한다 (하위 호환)', async () => {
    const { onApplyTarget, onFocusTarget } = renderWithState(FOCUS_TARGET_MONTHLY_DIVIDEND_STATE);

    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));
    expect(onApplyTarget).not.toHaveBeenCalled();
  });

  it.each([
    ['문자열', '3000000'],
    ['NaN', Number.NaN],
    ['음수', -1],
    ['상한 초과', TARGET_MONTHLY_DIVIDEND_MAX + 1]
  ])('히스토리로 주입된 %s 값은 저장하지 않고 포커스만 한다', async (_label, value) => {
    /*
     * `location.state`는 사용자가 조작할 수 있는 입력이다. setField는 클램프하지 않으므로
     * 여기서 막지 않으면 이상한 목표가 그대로 영속되고, 정규화가 나중에 조용히 기본값으로 바꾼다.
     */
    const { onApplyTarget, onFocusTarget } = renderWithState({
      focusTargetMonthlyDividend: true,
      targetMonthlyDividend: value
    });

    await waitFor(() => expect(onFocusTarget).toHaveBeenCalledTimes(1));
    expect(onApplyTarget).not.toHaveBeenCalled();
  });
});
