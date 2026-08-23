import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALLOCATION_COPY, SIMULATOR_COPY } from '@/shared/constants';
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
    onSetTickerShares: vi.fn(),
    holdings: { byTickerId: {}, totalAmount: 0, totalMonthlyDividend: 0, hasUnpricedShares: false, usesFxRate: false },
    formatAmount: (value: number) => `${value}원`,
    fxRate: 1390,
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

    // 힌트 2번: "다른 종목이 고정돼 조절할 여지가 없습니다…"
    expect(
      screen.getByText(/다른 종목이 고정돼 조절할 여지가 없습니다/)
    ).toBeInTheDocument();
    // 힌트 1/3번은 뜨지 않는다
    expect(screen.queryByText(/비중 조절이 잠겨 있습니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/종목이 하나뿐이라/)).not.toBeInTheDocument();

    // 조절 후보 슬라이더는 왜 비활성인지 힌트를 스크린리더로 전달한다(aria-describedby)
    expect(sliderFor('BBB')).toHaveAccessibleDescription(
      /다른 종목이 고정돼 조절할 여지가 없습니다/
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
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없습니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있습니다/)).not.toBeInTheDocument();
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
    expect(screen.getByText(/비중 조절이 잠겨 있습니다/)).toBeInTheDocument();
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없습니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/종목이 하나뿐이라/)).not.toBeInTheDocument();

    // 잠금 상태에서는 모든 슬라이더 비활성
    expect(sliderFor('AAA')).toBeDisabled();
    expect(sliderFor('BBB')).toBeDisabled();
    expect(sliderFor('CCC')).toBeDisabled();
  });

  it('종목이 하나뿐이면 100% 힌트(3번)를 노출한다', () => {
    renderComposition([makeProfile('a', 'AAA')], { adjustableTickerCount: 1 });

    expect(screen.getByText('종목이 하나뿐이라 비중은 100%입니다.')).toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있습니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/다른 종목이 고정돼 조절할 여지가 없습니다/)).not.toBeInTheDocument();
    expect(sliderFor('AAA')).toBeDisabled();
  });

  it('종목이 하나뿐이면 잠금 ON이어도 100% 힌트를 유지한다(잠금 힌트는 거짓 안내)', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA')], { adjustableTickerCount: 1 });

    // 잠금을 켜도 단일 종목은 잠금을 풀어도 계속 disabled라 "잠금을 풀면 드래그" 안내는 거짓이다.
    await user.click(screen.getByRole('checkbox', { name: '비율 조절 잠금' }));

    expect(screen.getByText('종목이 하나뿐이라 비중은 100%입니다.')).toBeInTheDocument();
    expect(screen.queryByText(/비중 조절이 잠겨 있습니다/)).not.toBeInTheDocument();
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

    expect(screen.getByText(SIMULATOR_COPY.emptyPortfolioHint)).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});

/**
 * 슬라이더 트랙 색 ↔ 도넛 조각 색의 **연결**을 잠근다.
 *
 * 예전에는 트랙이 전 행 똑같은 브랜드색이라 "이 슬라이더가 도넛의 어느 조각인가"가 화면에서
 * 연결되지 않았다. 브랜드색으로 되돌리면(또는 인덱스 규칙이 어긋나면) 이 테스트가 빨개진다.
 *
 * jsdom 은 레이아웃을 계산하지 않지만 **emotion 이 만든 선언값은 `getComputedStyle` 로 읽힌다**
 * (className 기반 단정이 아니다). CSS 변수는 `var(--sb-…)` 문자열 그대로 나오는데, 그게 오히려
 * 여기서 원하는 것이다 — 캔버스(파이)도 같은 `--sb-chart-series-N` 을 읽으므로 **변수 이름의
 * 일치가 곧 색의 일치**다. 실제 렌더 색이 같은지는 `tools/dev` 의 실측이 따로 증명한다.
 */
describe('PortfolioComposition — 슬라이더 트랙 색 = 도넛 조각 색', () => {
  const seriesVarOf = (element: Element) => {
    const background = getComputedStyle(element).background || getComputedStyle(element).backgroundColor;
    return /--sb-chart-series-\d+/.exec(background)?.[0] ?? null;
  };

  it('행마다 다른 시리즈 변수를 쓰고, 같은 행의 색 점과 트랙이 같은 변수를 공유한다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')]);

    const trackVars = ['AAA', 'BBB', 'CCC'].map((ticker) => seriesVarOf(sliderFor(ticker)));

    /*
     * 🔴 **인덱스를 0,1,2 로 단정하지 않는다**(2026-08-03 D4). 배정이 목록 순서가 아니라
     * 종목 이름 해시 + 충돌 회피로 바뀌었으므로 어떤 번호가 나오는지는 구현 세부다.
     * 이 테스트가 지켜야 하는 계약은 두 가지이고, 그 둘은 그대로다:
     *  ① 행마다 **서로 다른** 변수를 쓴다(같으면 슬라이더가 어느 조각인지 구분이 안 된다)
     *  ② 같은 행의 색 점과 트랙이 **한 값**을 공유한다
     * 번호를 고정하면 종목을 하나 더 추가하는 것만으로 빨개진다 — 그건 회귀가 아니라 정상 동작이다.
     */
    for (const variable of trackVars) expect(variable).toMatch(/^--sb-chart-series-\d+$/);
    expect(new Set(trackVars).size).toBe(trackVars.length);

    // 같은 행의 범례 점과 트랙이 한 값을 공유한다(둘이 갈리면 색이 두 개가 된다)
    const dotVars = ['AAA', 'BBB', 'CCC'].map((ticker) => {
      const row = sliderFor(ticker).closest('li');
      return seriesVarOf(row!.firstElementChild!);
    });
    expect(dotVars).toEqual(trackVars);
  });

  it('색이 유일한 단서가 아니다 — 슬라이더 옆에 종목명이 함께 선다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    for (const ticker of ['AAA', 'BBB']) {
      expect(sliderFor(ticker).closest('li')).toHaveTextContent(ticker);
    }
  });
  /* ── 파이 중앙 배당 표시 토글 (2026-08-14) ─────────────────────────────────── */

  /**
   * 🔴 기본값은 **최근 실지급**이다(사용자 요청). 적립식에서 월평균(연÷12)은 연말 시점의 수령액을
   * 크게 과소평가한다 — JEPI 100% · 초기 2,500만 · 월 500만 · 1년이면 평균 30.5만 vs 실지급 47.1만.
   * "1년 뒤 매달 얼마 받나"에 답하는 값이 기본이어야 한다.
   */
  it('배당 표시 토글이 카드 헤더에 있고 기본값은 최근 실지급이다', () => {
    renderComposition([makeProfile('a', 'AAA')]);

    const toggle = screen.getByRole('checkbox', { name: ALLOCATION_COPY.dividendCenterToggleLabel });
    expect(toggle).toBeChecked();
  });

  it('토글을 끄면 월평균으로, 다시 켜면 최근 실지급으로 돌아온다', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA')]);

    const toggle = screen.getByRole('checkbox', { name: ALLOCATION_COPY.dividendCenterToggleLabel });

    await user.click(toggle);
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
  });

  /** 잠금 스위치와 **함께** 선다 — 하나를 넣으면서 다른 하나를 밀어내지 않았는지 본다. */
  it('배당 표시 토글이 생겨도 비율 조절 잠금 토글은 그대로 있다', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    expect(screen.getByRole('checkbox', { name: ALLOCATION_COPY.lockToggleLabel })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: ALLOCATION_COPY.dividendCenterToggleLabel })).toBeInTheDocument();
  });
});

/**
 * 보유 줄 — 주식 수 입력은 비중 슬라이더와 **같은 배분**을 반대 방향에서 만진다.
 * 여기서 보는 것은 화면의 계약뿐이다(총액·비중을 실제로 어떻게 다시 계산하는지는
 * `test/main/allocationShares.test.ts` 의 순수 함수 테스트가 맡는다).
 */
describe('PortfolioComposition — 주식 수 입력', () => {
  const holdingsFor = (shares: number | null, amount: number, monthlyDividend: number) => ({
    byTickerId: { a: { shares, amount, monthlyDividend } },
    totalAmount: amount,
    totalMonthlyDividend: monthlyDividend,
    hasUnpricedShares: shares === null,
    usesFxRate: false
  });

  const sharesInput = (ticker: string) =>
    screen.getByRole('textbox', { name: ALLOCATION_COPY.sharesInputAria(ticker) });

  it('배분에서 되읽은 주식 수를 보여준다', () => {
    renderComposition([makeProfile('a', 'AAA')], { holdings: holdingsFor(120, 12_000_000, 35_000) });

    expect(sharesInput('AAA')).toHaveValue('120');
  });

  it('부동소수 잡음은 표시에서 접는다 — 방금 친 숫자가 그대로 서 있어야 한다', () => {
    renderComposition([makeProfile('a', 'AAA')], { holdings: holdingsFor(119.99999999, 12_000_000, 35_000) });

    expect(sharesInput('AAA')).toHaveValue('120');
  });

  it('수량을 고치면 그 값으로 배분을 바꾼다', async () => {
    const user = userEvent.setup();
    const { props } = renderComposition([makeProfile('a', 'AAA')], {
      holdings: holdingsFor(0, 0, 0)
    });

    await user.type(sharesInput('AAA'), '12');

    // 타건마다 즉시 반영한다 — 값이 바뀌는 순간 월 배당이 갱신되는 것이 이 입력의 목적이다.
    expect(props.onSetTickerShares).toHaveBeenCalledWith('a', 1);
    expect(props.onSetTickerShares).toHaveBeenLastCalledWith('a', 12);
  });

  it('지우는 중(빈 값)에는 배분을 건드리지 않는다', async () => {
    const user = userEvent.setup();
    const { props } = renderComposition([makeProfile('a', 'AAA')], {
      holdings: holdingsFor(120, 12_000_000, 35_000)
    });

    await user.clear(sharesInput('AAA'));

    // 비웠다고 0주로 커밋하면 그 종목 비중이 무너졌다가 다음 타건에 되살아난다.
    expect(props.onSetTickerShares).not.toHaveBeenCalled();
    expect(sharesInput('AAA')).toHaveValue('');
  });

  it('포커스를 잃으면 표시값이 다시 배분에서 파생된다', async () => {
    const user = userEvent.setup();
    renderComposition([makeProfile('a', 'AAA')], { holdings: holdingsFor(120, 12_000_000, 35_000) });

    await user.clear(sharesInput('AAA'));
    await user.tab();

    expect(sharesInput('AAA')).toHaveValue('120');
  });

  it('그 종목의 금액과 월 배당을 같은 줄에서 보여준다', () => {
    renderComposition([makeProfile('a', 'AAA')], {
      holdings: holdingsFor(120, 12_000_000, 35_000),
      formatAmount: (value: number) => `<${value}>`
    });

    expect(screen.getAllByText(/<12000000>/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/<35000>/).length).toBeGreaterThan(0);
  });

  it('합계와 기준(시작 시점·세후)을 한 번만 밝힌다', () => {
    renderComposition([makeProfile('a', 'AAA')], { holdings: holdingsFor(120, 12_000_000, 35_000) });

    expect(screen.getByText(ALLOCATION_COPY.holdingTotalLabel)).toBeInTheDocument();
    expect(screen.getByText(ALLOCATION_COPY.holdingBasisNote)).toBeInTheDocument();
  });
});

describe('PortfolioComposition — 환율이 없을 때', () => {
  const sharesInput = (ticker: string) =>
    screen.getByRole('textbox', { name: ALLOCATION_COPY.sharesInputAria(ticker) });

  const unpriced = {
    byTickerId: { a: { shares: null, amount: 12_000_000, monthlyDividend: 35_000 } },
    totalAmount: 12_000_000,
    totalMonthlyDividend: 35_000,
    hasUnpricedShares: true,
    usesFxRate: false
  };

  it('수량 입력을 잠그고 사유를 낭독까지 연결한다 (무음 비활성 금지)', () => {
    renderComposition([makeProfile('a', 'AAA')], { holdings: unpriced, fxRate: null });

    expect(sharesInput('AAA')).toBeDisabled();
    expect(screen.getByText(ALLOCATION_COPY.holdingFxUnavailable)).toBeInTheDocument();
    expect(sharesInput('AAA')).toHaveAccessibleDescription(ALLOCATION_COPY.holdingFxUnavailable);
  });

  it('낼 수 없는 주식 수를 0주로 지어내지 않는다', () => {
    renderComposition([makeProfile('a', 'AAA')], { holdings: unpriced, fxRate: null });

    expect(sharesInput('AAA')).toHaveValue('');
  });

  it('금액과 월 배당은 그대로 보여준다 — 환율과 무관하게 정확하다', () => {
    renderComposition([makeProfile('a', 'AAA')], {
      holdings: unpriced,
      fxRate: null,
      formatAmount: (value: number) => `<${value}>`
    });

    expect(screen.getAllByText(/<12000000>/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/<35000>/).length).toBeGreaterThan(0);
  });

  it('환율을 실제로 쓴 경우에만 적용 환율을 밝힌다', () => {
    const { unmount } = renderComposition([makeProfile('a', 'AAA')], {
      holdings: {
        byTickerId: { a: { shares: 120, amount: 12_000_000, monthlyDividend: 35_000 } },
        totalAmount: 12_000_000,
        totalMonthlyDividend: 35_000,
        hasUnpricedShares: false,
        usesFxRate: true
      },
      fxRate: 1390
    });
    expect(screen.getByText(/환율 1,390원 적용/)).toBeInTheDocument();
    unmount();

    renderComposition([makeProfile('a', 'AAA')], { holdings: unpriced, fxRate: null });
    expect(screen.queryByText(/환율 .*원 적용/)).not.toBeInTheDocument();
  });
});
