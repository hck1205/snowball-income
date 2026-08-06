import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AgendaList } from '@/pages/DividendCalendar/components';
import type { AgendaDay } from '@/pages/DividendCalendar/utils';

/**
 * 지급 일정 목록의 **잘린 종목명**을 다시 읽을 수 있는가에 대한 계약.
 *
 * 이 목록의 이름 칸은 좁다(1280 실측 133px). 대부분의 한글 ETF 이름이 말줄임표로 잘리는데,
 * 잘린 뒤에는 전체 이름을 볼 방법이 화면에 없었다. 그래서 잘린 이름에만 툴팁을 단다.
 *
 * 여기서 잠그는 것은 세 가지다.
 *  ① **잘렸을 때만** 툴팁이 붙는다 — 다 보이는 글자에 같은 글자를 또 띄우면 소음이고
 *     쓸데없는 탭 정거장이 생긴다. 티커 칸에는 애초에 붙지 않는다(잘리지 않는 고정폭이다).
 *  ② 여는 경로가 **hover 하나가 아니다** — 클릭(터치의 유일한 경로)과 키보드 포커스로도 열린다.
 *     `title` 속성으로는 이 둘을 만족할 수 없어 공용 Tooltip 을 쓴다.
 *  ③ 잘림은 CSS 라 스크린리더는 원래부터 전체 이름을 읽는다 — 툴팁이 생겨도 그 사실이 유지된다.
 *
 * ⚠ jsdom 은 레이아웃을 계산하지 않는다. `test/setup.dom.ts` 가 `clientWidth` 를 900 으로 고정하고
 * `scrollWidth` 는 0 이라 **기본 상태가 곧 "잘리지 않음"** 이다. 잘린 상태는 아래에서 `scrollWidth` 를
 * 덮어써서 만든다 — 실제 폭에서 정말 잘리는지는 브라우저 실측의 몫이다(uiprobe).
 */

const LONG_NAME = '앰플리파이 CWP 인핸스드 디비던드 인컴 ETF';
const SHORT_NAME = '리얼티 인컴';

const days: AgendaDay[] = [
  {
    date: '2026-08-30',
    month: 8,
    day: 30,
    weekday: 0,
    items: [
      { ticker: 'DIVO', koreanName: LONG_NAME, source: 'ex', day: 30 },
      { ticker: 'O', koreanName: SHORT_NAME, source: 'pay', day: 30 }
    ]
  }
];

/** 렌더된 이름이 상자보다 넓은 상태(= 말줄임표로 잘린 상태)를 만든다. */
const clipEveryText = () => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 1200 });
};

afterEach(() => {
  // jsdom 기본값(0)으로 되돌린다 — 남기면 다른 테스트가 모두 "잘린 상태"가 된다.
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 0 });
});

const renderAgenda = () => {
  const user = userEvent.setup();
  render(<AgendaList days={days} hasUndated={false} />);
  return { user, agenda: screen.getByRole('region', { name: '지급 일정 목록' }) };
};

describe('지급 일정 목록 — 잘린 종목명 툴팁', () => {
  it('이름이 잘리지 않으면 툴팁도, 탭 정거장도 만들지 않는다', async () => {
    const { user, agenda } = renderAgenda();

    const name = within(agenda).getByText(LONG_NAME);
    expect(name).not.toHaveAttribute('tabindex');

    await user.hover(name);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('이름이 잘리면 hover 로 전체 이름이 뜨고, 벗어나면 닫힌다', async () => {
    clipEveryText();
    const { user, agenda } = renderAgenda();

    const name = within(agenda).getByText(LONG_NAME);
    expect(name).toHaveAttribute('tabindex', '0');

    await user.hover(name);
    expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_NAME);

    await user.unhover(name);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  /**
   * 🔴 클릭 경로가 이 기능의 핵심 절반이다 — 터치 기기에는 hover 가 없다.
   * 눌러서 고정되고, 손가락이 떠나도 남아야 읽을 시간이 생긴다.
   */
  it('클릭하면 고정되어 마우스가 떠나도 남고, 다시 누르면 닫힌다', async () => {
    clipEveryText();
    const { user, agenda } = renderAgenda();
    const name = within(agenda).getByText(LONG_NAME);

    await user.click(name);
    await user.unhover(name);
    expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_NAME);

    await user.click(name);
    await user.unhover(name);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('키보드 포커스로 열리고 Escape 로 닫힌다', async () => {
    clipEveryText();
    const { user, agenda } = renderAgenda();
    const name = within(agenda).getByText(LONG_NAME);

    await user.tab();
    expect(name).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_NAME);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  /** 툴팁이 열려 있는 동안 트리거가 말풍선을 가리켜야 보조기기가 둘을 잇는다. */
  it('열려 있는 동안 이름이 말풍선을 aria-describedby 로 가리킨다', async () => {
    clipEveryText();
    const { user, agenda } = renderAgenda();
    const name = within(agenda).getByText(LONG_NAME);

    expect(name).not.toHaveAttribute('aria-describedby');

    await user.hover(name);
    expect(name).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  });

  /**
   * 티커 칸은 고정폭이고 유니버스 최장 심볼(GOOGL)도 넘치지 않는다(2026-08-04 uiprobe 실측
   * 51.8px 상자 / 48.8px 글자). 잘리지 않는 곳에 툴팁을 다는 것은 소음이므로 측정 대상이 아니다.
   */
  it('티커에는 툴팁을 달지 않는다', async () => {
    clipEveryText();
    const { user, agenda } = renderAgenda();

    const ticker = within(agenda).getByText('DIVO');
    expect(ticker).not.toHaveAttribute('tabindex');

    await user.hover(ticker);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  /**
   * 잘림은 순수 CSS 라 접근성 트리에는 처음부터 전체 이름이 있다.
   * 툴팁을 붙이면서 그 텍스트를 쪼개거나 감추면 스크린리더가 잃는 것이 생긴다.
   */
  it('툴팁이 없든 있든 전체 이름은 항상 문서 텍스트로 남는다', () => {
    clipEveryText();
    const { agenda } = renderAgenda();

    expect(within(agenda).getByText(LONG_NAME)).toBeInTheDocument();
    expect(within(agenda).getByText(SHORT_NAME)).toBeInTheDocument();
  });
});
