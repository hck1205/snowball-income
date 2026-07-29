import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { displayCurrencyAtom, fxViewAtom } from '@/jotai';
import { SIMULATOR_COPY } from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
import SimulatorHero from './SimulatorHero';

/**
 * 시뮬레이터 히어로.
 *
 * 핵심 계약은 `meta`(근거 한 줄)의 **조건부 부재**다 — 원화 모드에는 여기 적을 새로운 근거가 없고
 * (기준일은 푸터가, 환율 위젯은 드로어가 소유한다), 환율을 못 구했는데도 "…원 기준"을 적으면
 * 근거 없는 숫자를 지어내는 셈이 된다.
 */

const FX_RATE = { rate: 1_382, base: 'USD', quote: 'KRW', asOf: '2026-07-28T00:00:00.000Z' } as const;

type Options = { currency?: 'KRW' | 'USD'; withRate?: boolean };

const renderHero = ({ currency = 'KRW', withRate = true }: Options = {}) => {
  const store = createStore();
  if (withRate) store.set(fxViewAtom, { status: 'success', rate: FX_RATE });
  store.set(displayCurrencyAtom, currency);

  const onOpenSettings = vi.fn();
  render(
    <Provider store={store}>
      <SimulatorHero drawerId="config-drawer" isSettingsOpen={false} onOpenSettings={onOpenSettings} />
    </Provider>
  );

  return { onOpenSettings, user: userEvent.setup() };
};

describe('SimulatorHero', () => {
  it('제목은 h2 다 — h1 은 헤더 워드마크가 갖는다(확정 결정)', () => {
    renderHero();

    expect(screen.getByRole('heading', { level: 2, name: SIMULATOR_COPY.heroTitle })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('리드 문장을 그린다', () => {
    renderHero();

    expect(screen.getByText(SIMULATOR_COPY.heroLede)).toBeInTheDocument();
  });

  it('원화 모드에서는 근거 줄을 아예 그리지 않는다', () => {
    renderHero({ currency: 'KRW' });

    expect(screen.queryByText(/기준$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/달러로 표시 중/)).not.toBeInTheDocument();
  });

  it('달러 모드에서만 "달러로 표시 중 · N원 기준"을 붙인다', () => {
    renderHero({ currency: 'USD' });

    expect(screen.getByText(`달러로 표시 중 · ${formatKRW(FX_RATE.rate)} 기준`)).toBeInTheDocument();
  });

  it('환율을 못 구했으면 달러 모드여도 근거를 지어내지 않는다', () => {
    renderHero({ currency: 'USD', withRate: false });

    expect(screen.queryByText(/달러로 표시 중/)).not.toBeInTheDocument();
  });

  it('히어로 액션이 설정 드로어를 가리키고 연다', async () => {
    const { onOpenSettings, user } = renderHero();

    const action = screen.getByRole('button', { name: SIMULATOR_COPY.settingsTitle });
    expect(action).toHaveAttribute('aria-controls', 'config-drawer');
    expect(action).toHaveAttribute('aria-expanded', 'false');

    await user.click(action);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
