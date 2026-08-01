import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, forwardRef } from 'react';
import type { TickerProfile } from '@/shared/types/snowball';

vi.mock('echarts-for-react', () => ({
  default: forwardRef<HTMLDivElement>((_props, ref) => createElement('div', { ref }))
}));

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn(), setUserProperties: vi.fn() };
});

import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import {
  includedTickerIdsAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { resolveQuickAdjustFields } from '@/pages/Main/components/MainRightPanel/components/QuickAdjustBar';

/**
 * **결과 바로 아래의 1차 조정**(월 적립 · 투자 기간 · 목표 월배당).
 *
 * 여기서 못 박는 것은 두 가지이고, 둘 다 "화면을 봐서는 안 보이는" 계약이다.
 *  1. 🔴 **커밋은 손을 뗄 때 한 번.** 드래그 중 매 스텝 커밋하면 전체 시뮬레이션이 수십 번 다시 돌고,
 *     `investment_setting_changed` 가 한 번의 조정에 수십 발 나가 설정 분포 지표가 망가진다.
 *  2. 🔴 **드로어와 같은 이벤트를 쏜다.** 인라인 조정만의 새 이벤트를 만들면 퍼널이 두 갈래로 갈려
 *     "설정을 바꾼 사용자" 비율을 더 이상 한 지표로 셀 수 없다.
 */

const PROFILE: TickerProfile = {
  id: 'p1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly'
};

const renderPanel = () => {
  const store = createStore();
  store.set(tickerProfilesAtom, [PROFILE]);
  store.set(includedTickerIdsAtom, [PROFILE.id]);
  store.set(weightByTickerIdAtom, { [PROFILE.id]: 100 });
  store.set(yieldFormAtom, (prev) => ({ ...prev, monthlyContribution: 1_000_000 }));

  render(
    <Provider store={store}>
      <MainRightPanel configDrawerId="config-drawer" />
    </Provider>
  );
  return store;
};

const monthlySlider = () => screen.getByRole('slider', { name: '월 적립' });

const settingEvents = () =>
  vi
    .mocked(trackEvent)
    .mock.calls.filter(([event]) => event === ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED)
    .map(([, params]) => params);

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});

describe('빠른 조정 — 커밋 시점', () => {
  it('드래그하는 동안에는 폼에 커밋하지 않는다(중간값이 시뮬레이션을 돌리지 않는다)', () => {
    const store = renderPanel();

    fireEvent.change(monthlySlider(), { target: { value: '2000000' } });
    fireEvent.change(monthlySlider(), { target: { value: '2500000' } });
    fireEvent.change(monthlySlider(), { target: { value: '3000000' } });

    expect(store.get(yieldFormAtom).monthlyContribution).toBe(1_000_000);
    expect(settingEvents()).toEqual([]);
  });

  it('화면의 값은 드래그를 즉시 따라간다(커밋만 미룬다)', () => {
    renderPanel();

    fireEvent.change(monthlySlider(), { target: { value: '3000000' } });

    expect(monthlySlider()).toHaveAttribute('aria-valuetext', '300만원');
  });

  it('손을 떼면 한 번만 커밋하고, 드로어와 같은 이벤트를 한 발만 쏜다', () => {
    const store = renderPanel();

    fireEvent.change(monthlySlider(), { target: { value: '2000000' } });
    fireEvent.change(monthlySlider(), { target: { value: '3000000' } });
    fireEvent.pointerUp(monthlySlider());

    expect(store.get(yieldFormAtom).monthlyContribution).toBe(3_000_000);
    expect(settingEvents()).toEqual([
      expect.objectContaining({ field_name: 'monthlyContribution', value: 3_000_000 })
    ]);
  });

  it('값이 그대로면 손을 떼도 아무 일도 일어나지 않는다', () => {
    renderPanel();

    fireEvent.pointerUp(monthlySlider());

    expect(settingEvents()).toEqual([]);
  });

  it('키보드로 조작해도 손을 뗄 때 커밋된다', () => {
    const store = renderPanel();

    fireEvent.change(monthlySlider(), { target: { value: '1100000' } });
    fireEvent.keyUp(monthlySlider(), { key: 'ArrowRight' });

    expect(store.get(yieldFormAtom).monthlyContribution).toBe(1_100_000);
  });
});

describe('빠른 조정 — 트랙 범위', () => {
  it('저장된 값이 기본 상한을 넘으면 트랙이 넓어진다(슬라이더가 값을 잘라 보여 주지 않는다)', () => {
    const fields = resolveQuickAdjustFields({
      monthlyContribution: 12_000_000,
      durationYears: 12,
      targetMonthlyDividend: 0
    });
    const monthly = fields.find((field) => field.key === 'monthlyContribution');

    expect(monthly?.max).toBeGreaterThanOrEqual(12_000_000);
  });

  it('값이 범위 안이면 기본 상한 그대로다', () => {
    const fields = resolveQuickAdjustFields({
      monthlyContribution: 1_000_000,
      durationYears: 12,
      targetMonthlyDividend: 0
    });

    expect(fields.find((field) => field.key === 'monthlyContribution')?.max).toBe(5_000_000);
  });
});

/**
 * 🔴 **낭독 지점은 슬라이더 하나뿐이다.**
 *
 * 값 표시가 `<output>` 이면 브라우저 기본 role 이 `status`(= `aria-live="polite"`)이고, 이 값은
 * `onChange` 마다(슬라이더 매 스텝) 갱신된다. 그러면 한 번의 조정이 **두 벌**로 발화한다 —
 * 슬라이더의 `aria-valuetext` 와 라이브 리전이 같은 값을 각각. 키보드로 5년→20년(15회 이동)이면
 * 30발, 마우스 드래그면 수십~수백 배다.
 *
 * 두 단정이 서로 다른 회귀를 잡는다: `aria-hidden` 을 떼면 두 번째가, 태그를 `output` 으로
 * 되돌리면 첫 번째가 빨개진다(둘 중 하나만으로는 반쪽이다 — 실제로 뮤턴트로 확인했다).
 */
describe('빠른 조정 — 스크린리더 발화', () => {
  const monthlyItem = () => {
    const item = monthlySlider().closest('div');
    if (!item) throw new Error('빠른 조정 항목을 찾지 못했다');
    return item;
  };

  it('값 표시는 라이브 리전이 아니다(드래그 중 라이브 발화 0)', () => {
    renderPanel();

    expect(within(monthlyItem()).queryAllByRole('status')).toEqual([]);
  });

  it('값 표시는 보조기기에서 감춰진다 — 값은 슬라이더가 이미 정확히 읽는다', () => {
    renderPanel();

    expect(within(monthlyItem()).getByText('100만원')).toHaveAttribute('aria-hidden', 'true');
    expect(monthlySlider()).toHaveAttribute('aria-valuetext', '100만원');
  });

  it('감췄어도 화면에는 그대로 보인다(시각 표시 전용)', () => {
    renderPanel();

    fireEvent.change(monthlySlider(), { target: { value: '3000000' } });

    expect(within(monthlyItem()).getByText('300만원')).toBeVisible();
  });
});
