import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TickerProfile } from '@/shared/types/snowball';
import ReinvestRouting from './ReinvestRouting';
import type { ReinvestRoutingProps } from './ReinvestRouting.types';

/**
 * 종목별 배당 재투자 — **사용자 행동 기반**으로만 본다(className·Emotion 내부 금지, 레포 규율).
 *
 * 이 화면의 계약은 둘이다: ① 접힌 태그가 **현재 설정을 그대로 말한다** ② 누른 태그만 편집기로
 * 늘어난다. ①이 깨지면 공유 링크로 받은 라우팅이 화면에서 사라진 것처럼 보인다.
 */

const profile = (id: string, ticker: string): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 5,
  expectedTotalReturn: 8,
  frequency: 'quarterly'
});

const PROFILES = [profile('a', 'SCHD'), profile('b', 'JEPI'), profile('c', 'QQQ')];

const baseProps = (overrides: Partial<ReinvestRoutingProps> = {}): ReinvestRoutingProps => ({
  includedProfiles: PROFILES,
  percentByTickerId: {},
  targetByTickerId: {},
  globalPercent: 100,
  enabled: true,
  onSetPercent: vi.fn(),
  onSetTarget: vi.fn(),
  ...overrides
});

const renderRouting = (overrides: Partial<ReinvestRoutingProps> = {}) => {
  const props = baseProps(overrides);
  return { ...render(createElement(ReinvestRouting, props)), props };
};

/**
 * 접힌 카드. **낭독 문장이 곧 화면 문장**이다(`aria-label` 로 덮지 않는다) — 그래서 이 쿼리가
 * "사용자가 읽는 것"을 그대로 검증한다.
 */
const tag = (label: string) => screen.getByRole('button', { name: label });
const percentInput = (ticker: string) => screen.getByRole('spinbutton', { name: `${ticker} 배당 재투자 비율` });
const targetSelect = (ticker: string) => screen.getByRole('combobox', { name: `${ticker} 배당을 보낼 종목` });
const queryTargetSelect = (ticker: string) => screen.queryByRole('combobox', { name: `${ticker} 배당을 보낼 종목` });
const collapseButton = (ticker: string) => screen.getByRole('button', { name: `${ticker} 배당 재투자 설정 접기` });

describe('종목별 재투자 — 접힌 태그가 설정을 말한다', () => {
  it('편입된 종목마다 태그가 하나씩 서고 전역 비율을 보여준다', () => {
    renderRouting({ globalPercent: 70 });

    expect(tag('SCHD 재투자 70%')).toBeInTheDocument();
    expect(tag('JEPI 재투자 70%')).toBeInTheDocument();
    expect(tag('QQQ 재투자 70%')).toBeInTheDocument();
  });

  it('종목별 값이 전역값을 덮는다', () => {
    renderRouting({ globalPercent: 70, percentByTickerId: { a: 25 } });

    expect(tag('SCHD 재투자 25%')).toBeInTheDocument();
    expect(tag('JEPI 재투자 70%')).toBeInTheDocument();
  });

  it('🔴 다른 종목으로 보내면 접힌 태그에도 목적지가 보인다', () => {
    /* 펼치지 않아도 보여야 한다 — 공유 링크로 받은 설정이 사라진 것처럼 보이면 안 된다. */
    renderRouting({ percentByTickerId: { c: 50 }, targetByTickerId: { c: 'a' } });

    expect(tag('QQQ 재투자 50% → SCHD')).toBeInTheDocument();
  });

  it('기본은 자기 종목이라 화살표를 붙이지 않는다', () => {
    renderRouting({ targetByTickerId: { a: 'a' } });

    expect(tag('SCHD 재투자 100%')).toBeInTheDocument();
  });

  it('평소에는 입력을 세우지 않는다', () => {
    renderRouting();

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('담은 종목이 없으면 아무것도 그리지 않는다', () => {
    const { container } = renderRouting({ includedProfiles: [] });

    expect(container).toBeEmptyDOMElement();
  });
});

describe('종목별 재투자 — 태그를 누르면 늘어난다', () => {
  it('누른 종목만 편집기로 바뀐다', async () => {
    const user = userEvent.setup();
    renderRouting();

    await user.click(tag('QQQ 재투자 100%'));

    expect(percentInput('QQQ')).toBeInTheDocument();
    expect(targetSelect('QQQ')).toBeInTheDocument();
    /* 나머지는 태그 그대로다. */
    expect(tag('SCHD 재투자 100%')).toBeInTheDocument();
    expect(queryTargetSelect('SCHD')).not.toBeInTheDocument();
  });

  it('접으면 태그로 되돌아간다', async () => {
    const user = userEvent.setup();
    renderRouting();

    await user.click(tag('QQQ 재투자 100%'));
    await user.click(collapseButton('QQQ'));

    expect(queryTargetSelect('QQQ')).not.toBeInTheDocument();
    expect(tag('QQQ 재투자 100%')).toBeInTheDocument();
  });

  it('여러 종목을 동시에 펼칠 수 있다', async () => {
    const user = userEvent.setup();
    renderRouting();

    await user.click(tag('SCHD 재투자 100%'));
    await user.click(tag('QQQ 재투자 100%'));

    expect(percentInput('SCHD')).toBeInTheDocument();
    expect(percentInput('QQQ')).toBeInTheDocument();
  });

  it('목적지 후보는 편입된 종목뿐이고 이름만 둔다', () => {
    /* 자기 종목은 기본값이라 셀렉트가 이미 그것을 고른 채로 열린다 — 라벨에 덧말을 붙이지 않는다. */
    renderRouting({ includedProfiles: [PROFILES[0], PROFILES[1]] });

    return userEvent.setup()
      .click(tag('SCHD 재투자 100%'))
      .then(() => {
        const options = Array.from(targetSelect('SCHD').querySelectorAll('option')).map((node) => node.textContent);
        expect(options).toEqual(['SCHD', 'JEPI']);
        expect(targetSelect('SCHD')).toHaveValue('a');
      });
  });
});

describe('종목별 재투자 — 조작', () => {
  /*
   * ⚠ `user.type` 을 쓰지 않는다. 이 입력은 **제어 컴포넌트**인데 여기서는 부모가 mock 이라 값이
   *   되돌아오지 않는다 — 타건이 누적되지 않아 마지막 글자만 반영된 값이 올라간다(테스트가 재현하는
   *   것은 컴포넌트가 아니라 그 사정이다). 값을 통째로 바꾸는 change 가 이 계약을 정확히 본다.
   */
  it('비율을 고치면 그 종목 id 와 함께 올려보낸다', async () => {
    const user = userEvent.setup();
    const { props } = renderRouting({ percentByTickerId: { b: 50 } });
    await user.click(tag('JEPI 재투자 50%'));

    fireEvent.change(percentInput('JEPI'), { target: { value: '30' } });

    expect(props.onSetPercent).toHaveBeenLastCalledWith('b', 30);
  });

  it('100을 넘기면 100으로 잘린다', async () => {
    const user = userEvent.setup();
    const { props } = renderRouting({ percentByTickerId: { a: 0 } });
    await user.click(tag('SCHD 재투자 0%'));

    fireEvent.change(percentInput('SCHD'), { target: { value: '150' } });

    expect(props.onSetPercent).toHaveBeenLastCalledWith('a', 100);
  });

  it('음수는 0으로 잘린다', async () => {
    const user = userEvent.setup();
    const { props } = renderRouting({ percentByTickerId: { a: 50 } });
    await user.click(tag('SCHD 재투자 50%'));

    fireEvent.change(percentInput('SCHD'), { target: { value: '-20' } });

    expect(props.onSetPercent).toHaveBeenLastCalledWith('a', 0);
  });

  it('목적지를 고르면 출발지와 목적지를 함께 올려보낸다', async () => {
    const user = userEvent.setup();
    const { props } = renderRouting();
    await user.click(tag('QQQ 재투자 100%'));

    await user.selectOptions(targetSelect('QQQ'), 'a');

    expect(props.onSetTarget).toHaveBeenCalledWith('c', 'a');
  });

  it('자기 종목을 다시 고르면 그것도 그대로 올려보낸다 (되돌리기)', async () => {
    const user = userEvent.setup();
    const { props } = renderRouting({ targetByTickerId: { c: 'a' } });
    await user.click(tag('QQQ 재투자 100% → SCHD'));

    await user.selectOptions(targetSelect('QQQ'), 'c');

    expect(props.onSetTarget).toHaveBeenCalledWith('c', 'c');
  });
});

describe('종목별 재투자 — 잠기는 조건', () => {
  it('전역 재투자가 꺼져 있으면 태그를 누를 수 없다', () => {
    renderRouting({ enabled: false });

    expect(tag('SCHD 재투자 100%')).toBeDisabled();
  });

  it('🔴 비율이 0이면 목적지를 잠근다 — 보낼 것이 없다', async () => {
    const user = userEvent.setup();
    renderRouting({ percentByTickerId: { a: 0 } });

    await user.click(tag('SCHD 재투자 0%'));

    expect(targetSelect('SCHD')).toBeDisabled();
    /* 비율 입력은 살아 있어야 한다 — 잠그면 0에서 되돌릴 방법이 없다. */
    expect(percentInput('SCHD')).toBeEnabled();
  });

  it('펼친 상태에서 전역 재투자가 꺼지면 입력도 잠긴다', async () => {
    const user = userEvent.setup();
    const { rerender } = renderRouting();

    await user.click(tag('SCHD 재투자 100%'));
    rerender(createElement(ReinvestRouting, baseProps({ enabled: false })));

    expect(percentInput('SCHD')).toBeDisabled();
    expect(targetSelect('SCHD')).toBeDisabled();
  });
});

/**
 * 🔴 위의 전역 비율이 거짓말하지 않아야 한다 (2026-08-23 사용자 지적).
 *
 * 종목 하나라도 기본값과 다르면 "배당 재투자 100%" 는 포트폴리오 전체를 설명하지 못한다.
 * 이 줄이 그 사실을 밝히는 유일한 자리다.
 */
describe('종목별 재투자 — 전역 비율이 기본값임을 밝힌다', () => {
  it('전부 기본값이면 안내 문구만 둔다', () => {
    renderRouting({ globalPercent: 100 });

    expect(screen.getByText(/기본은 그 종목에 다시 넣습니다/)).toBeInTheDocument();
  });

  it('비율이 다른 종목이 있으면 몇 개인지 말한다', () => {
    renderRouting({ globalPercent: 100, percentByTickerId: { a: 50, b: 0 } });

    expect(screen.getByText('2개 종목이 기본값과 다르게 설정돼 있습니다.')).toBeInTheDocument();
  });

  it('목적지만 바꾼 종목도 "따로 설정"으로 센다', () => {
    renderRouting({ globalPercent: 100, targetByTickerId: { c: 'a' } });

    expect(screen.getByText('1개 종목이 기본값과 다르게 설정돼 있습니다.')).toBeInTheDocument();
  });

  it('종목별 값이 전역값과 같으면 세지 않는다', () => {
    renderRouting({ globalPercent: 100, percentByTickerId: { a: 100 } });

    expect(screen.getByText(/기본은 그 종목에 다시 넣습니다/)).toBeInTheDocument();
  });
});
