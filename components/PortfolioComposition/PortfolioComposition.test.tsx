import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TickerProfile } from '@/shared/types/snowball';
import type { PortfolioCompositionProps } from './PortfolioComposition.types';
import PortfolioComposition from './PortfolioComposition';

/**
 * 모바일 "잠금/고정" UX 회귀 테스트 (사용자 행동 기반).
 *
 * 검증 대상: 슬라이더 disabled 판정, 범례 하단 단일 힌트 우선순위,
 * '고정 전체 해제' 노출·클릭, 고정 버튼 접근성 토글, 슬라이더 aria-label 불변.
 *
 * jsdom은 @media/matchMedia(max-width:960px)를 항상 false로 스텁하므로(test/setup.ts)
 * isLocked 기본값은 false(조절) — 잠금 분기는 토글을 클릭해 켠다. touch-action 등
 * 모바일 CSS 분기는 jsdom에서 관측 불가 → 코드 존재 확인/실기기 몫(리스크로 보고).
 */

const makeProfile = (id: string, ticker: string): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield: 0.03,
  dividendGrowth: 0,
  expectedTotalReturn: 0.07,
  frequency: 'quarterly'
});

const StubChart = () => null;

type Overrides = Partial<PortfolioCompositionProps>;

const renderComposition = (profiles: TickerProfile[], overrides: Overrides = {}) => {
  const percentByTickerId = profiles.reduce<Record<string, number>>((acc, profile, _index, arr) => {
    acc[profile.id] = Math.round(100 / arr.length);
    return acc;
  }, {});

  const props: PortfolioCompositionProps = {
    includedProfiles: profiles,
    normalizedAllocation: profiles.map((profile) => ({ profile, weight: 1 / profiles.length })),
    allocationPieOption: {},
    allocationPercentByTickerId: percentByTickerId,
    fixedByTickerId: {},
    adjustableTickerCount: profiles.length,
    onSetTickerWeight: vi.fn(),
    onToggleTickerFixed: vi.fn(),
    onClearAllFixed: vi.fn(),
    onRemoveIncludedTicker: vi.fn(),
    ResponsiveChart: StubChart,
    ...overrides
  };

  const utils = render(createElement(PortfolioComposition, props));
  return { ...utils, props };
};

const sliderFor = (ticker: string) => screen.getByRole('slider', { name: `${ticker} 비율` });
const fixButton = (ariaName: string) => screen.getByRole('button', { name: ariaName });

describe('PortfolioComposition — 슬라이더 disabled 판정', () => {
  it('2종목 중 1개 고정 시 나머지 슬라이더도 비활성이고 "고정된 종목" 힌트를 보인다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')], {
      fixedByTickerId: { a: true },
      // 부모가 계산해 넘기는 값: 고정 1 → 조절 가능 종목은 b 하나뿐
      adjustableTickerCount: 1
    });

    // 자기 고정 행은 물론, 유일한 조절 후보인 나머지 행도 disabled(명세)
    expect(sliderFor('AAA')).toBeDisabled();
    expect(sliderFor('BBB')).toBeDisabled();

    // 힌트 2번: "다른 종목이 고정돼 조절할 여지가 없어요…"
    expect(
      screen.getByText(/다른 종목이 고정돼 조절할 여지가 없어요/)
    ).toBeInTheDocument();
    // 힌트 1/3번은 뜨지 않는다
    expect(screen.queryByText(/비중 조절이 잠겨 있어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/종목이 하나뿐이라/)).not.toBeInTheDocument();

    // 조절 후보 슬라이더는 왜 비활성인지 힌트를 스크린리더로 전달한다(aria-describedby)
    expect(sliderFor('BBB')).toHaveAccessibleDescription(
      /다른 종목이 고정돼 조절할 여지가 없어요/
    );
  });

  it('3종목 중 1개 고정 시 나머지 2개는 활성이다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')], {
      fixedByTickerId: { a: true },
      adjustableTickerCount: 2
    });

    expect(sliderFor('AAA')).toBeDisabled();
    expect(sliderFor('BBB')).toBeEnabled();
    expect(sliderFor('CCC')).toBeEnabled();

    // 조절 여지가 있으므로 비활성 사유 텍스트 힌트는 없다(고정 전체 해제 버튼만)
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있어요/)).not.toBeInTheDocument();
  });
});

describe('PortfolioComposition — 힌트 우선순위 분기', () => {
  it('잠금 ON이면 잠금 힌트(1번)만 노출하고 고정/단일 힌트는 숨긴다', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')], {
      fixedByTickerId: { a: true },
      adjustableTickerCount: 2
    });

    // 기본은 조절(matchMedia=false). 토글을 눌러 잠금 ON.
    await user.click(screen.getByRole('checkbox', { name: '비율 조절 잠금' }));

    // 힌트 1번만
    expect(screen.getByText(/비중 조절이 잠겨 있어요/)).toBeInTheDocument();
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/종목이 하나뿐이라/)).not.toBeInTheDocument();

    // 잠금 상태에서는 모든 슬라이더 비활성
    expect(sliderFor('AAA')).toBeDisabled();
    expect(sliderFor('BBB')).toBeDisabled();
    expect(sliderFor('CCC')).toBeDisabled();
  });

  it('종목이 하나뿐이면 100% 힌트(3번)를 노출한다', () => {
    renderComposition([makeProfile('a', 'AAA')], { adjustableTickerCount: 1 });

    expect(screen.getByText('종목이 하나뿐이라 비중은 100%예요.')).toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없어요/)).not.toBeInTheDocument();
    expect(sliderFor('AAA')).toBeDisabled();
  });

  it('종목이 하나뿐이면 잠금 ON이어도 100% 힌트를 유지한다(잠금 힌트는 거짓 안내)', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA')], { adjustableTickerCount: 1 });

    // 잠금을 켜도 단일 종목은 잠금을 풀어도 계속 disabled라 "잠금을 풀면 드래그" 안내는 거짓이다.
    await user.click(screen.getByRole('checkbox', { name: '비율 조절 잠금' }));

    expect(screen.getByText('종목이 하나뿐이라 비중은 100%예요.')).toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있어요/)).not.toBeInTheDocument();
    expect(sliderFor('AAA')).toBeDisabled();
  });
});

describe("PortfolioComposition — '고정 전체 해제'", () => {
  it('고정이 1개 이상이고 잠금이 아니면 노출되고 클릭 시 onClearAllFixed를 부른다', async () => {
    const user = userEvent.setup();
    const { props } = renderComposition(
      [makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')],
      { fixedByTickerId: { a: true }, adjustableTickerCount: 2 }
    );

    const clearButton = screen.getByRole('button', { name: '모든 종목 비중 고정 해제' });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(props.onClearAllFixed).toHaveBeenCalledTimes(1);
  });

  it('고정이 없으면 노출되지 않는다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')], {
      fixedByTickerId: {},
      adjustableTickerCount: 2
    });

    expect(screen.queryByRole('button', { name: '모든 종목 비중 고정 해제' })).not.toBeInTheDocument();
  });

  it('잠금 ON이면 고정이 있어도 숨긴다', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')], {
      fixedByTickerId: { a: true },
      adjustableTickerCount: 2
    });

    await user.click(screen.getByRole('checkbox', { name: '비율 조절 잠금' }));

    expect(screen.queryByRole('button', { name: '모든 종목 비중 고정 해제' })).not.toBeInTheDocument();
  });
});

describe('PortfolioComposition — 고정 버튼 접근성', () => {
  it('비고정/고정 상태에 따라 aria-label·title·aria-pressed가 토글된다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')], {
      fixedByTickerId: { a: true },
      adjustableTickerCount: 1
    });

    // 고정된 a: 해제 라벨/타이틀 + pressed
    const fixedBtn = fixButton('AAA 비중 고정 해제');
    expect(fixedBtn).toHaveAttribute('title', '비중 고정 해제');
    expect(fixedBtn).toHaveAttribute('aria-pressed', 'true');

    // 비고정 b: 고정 라벨/타이틀 + not pressed
    const unfixedBtn = fixButton('BBB 비중 고정');
    expect(unfixedBtn).toHaveAttribute('title', '비중 고정');
    expect(unfixedBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('고정 버튼 클릭 시 해당 종목 id로 onToggleTickerFixed를 부른다', async () => {
    const user = userEvent.setup();
    const { props } = renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')], {
      fixedByTickerId: {},
      adjustableTickerCount: 2
    });

    await user.click(fixButton('BBB 비중 고정'));
    expect(props.onToggleTickerFixed).toHaveBeenCalledWith('b');
  });
});

describe('PortfolioComposition — 회귀 안전망', () => {
  it('슬라이더 aria-label은 기존 "<종목> 비율" 문구가 그대로 유지된다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    // 기존 테스트가 이 접근성 이름으로 슬라이더를 잡는다 — 불변 증명
    expect(screen.getAllByRole('slider', { name: /비율/ })).toHaveLength(2);
    expect(sliderFor('AAA')).toBeInTheDocument();
    expect(sliderFor('BBB')).toBeInTheDocument();
  });

  it('고정이 없는 다종목에서는 슬라이더가 활성이고 드래그 시 onSetTickerWeight를 부른다', () => {
    const { props } = renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    const slider = sliderFor('AAA');
    expect(slider).toBeEnabled();

    // range input 값 변경(사용자 드래그) → 콜백에 (id, number) 전달
    fireEvent.change(slider, { target: { value: '70' } });

    expect(props.onSetTickerWeight).toHaveBeenCalledWith('a', 70);
  });

  it('종목이 없으면 안내 문구만 보이고 슬라이더/힌트가 없다', () => {
    renderComposition([], { normalizedAllocation: [], allocationPieOption: null, adjustableTickerCount: 0 });

    expect(screen.getByText('좌측 티커 생성을 통해 포트폴리오를 구성해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
