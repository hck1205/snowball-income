import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';
import { MonthCalendar } from '@/pages/DividendCalendar/components';
import { buildMonthViewModel } from '@/pages/DividendCalendar/utils';
import type { CalendarTickerEntry } from '@/pages/DividendCalendar/utils';
import { MARKET_DATA } from '@/shared/constants/marketData';

/**
 * 달력 날짜 칸 → 아젠다(지급 일정 목록) 이동. 표와 목록은 같은 데이터의 두 표현이고,
 * 좁은 폭에서 칸이 잃는 정보(티커 이름·실측/추정)의 **원본**이 목록에 있다 —
 * 그래서 "칸을 눌렀다"가 그 날 목록으로 이어지지 않으면 좁은 화면에서 정보가 도달 불가능해진다.
 *
 * ⚠ 이 파일은 **폭에 따른 시각 변화(칩→점, '오늘' 배지 시각 숨김)를 단정하지 않는다.**
 * jsdom 은 `@media` 를 평가하지 않아 DOM 은 모든 폭에서 같다 — "좁으면 안 보인다"를 여기서
 * 주장하면 거짓 확신이 된다. 대신 폭과 무관하게 지켜져야 하는 **DOM·시맨틱 계약**만 고정한다:
 * 티커 글자는 어느 폭에서도 DOM 에 남고(시각적으로만 감춘다), 칸의 이동 버튼은 그 날 종목을
 * `title` 로 말한다.
 *
 * ⚠ 이동은 `requestAnimationFrame` 을 한 번 거친다(탭 전환·강조 렌더가 커밋된 다음 프레임에
 * 대상을 찾는다) — **이 파일에서 가짜 타이머를 쓰면 안 된다**. 포커스 단정은 `waitFor` 로 기다린다.
 */

/** 2026-07-25(토). '오늘'을 주입하지 않으면 달력 단정이 실제 날짜에 매인다. */
const TODAY = new Date(2026, 6, 25);
const YEAR = 2026;
const MONTH = 7;
const MONTH_LABEL = '2026년 7월';

/**
 * 날짜 있는 지급 2건(서로 다른 날) + 날짜 미정 1건이 한 달에 공존하는 조합.
 * 미정이 있어야 '날짜 미정' 탭이 생겨 "다른 탭을 보던 중 눌렀을 때" 시나리오가 성립한다.
 */
const SELECTED = ['JEPI', 'KO', 'O'];

/** 모바일에서만 보이는 발견 가능성 힌트 — 누를 칸이 실제로 있을 때만 붙는다. */
const JUMP_HINT = '지급 예정이 있는 날짜를 누르면 아래 목록에서 그 날 일정을 볼 수 있습니다.';

const renderCalendar = async (tickers: string[] = SELECTED) => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={[`/dividend/calendar?tickers=${tickers.join(',')}`]}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage today={TODAY} />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 2, name: MONTH_LABEL });
  await waitFor(() => {
    expect(screen.queryByText('저장된 종목 선택을 불러오는 중입니다.')).not.toBeInTheDocument();
  });

  return { user };
};

/* ---------------------------------------------------------------------------
 * 스냅샷 파생 기대값 — 지급'일'을 리터럴로 적지 않는다(크론이 갱신하면 날짜가 움직인다).
 * ------------------------------------------------------------------------- */

const pad2 = (value: number): string => String(value).padStart(2, '0');

const isoOf = (day: number, month: number = MONTH, year: number = YEAR): string =>
  `${year}-${pad2(month)}-${pad2(day)}`;

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

const paysIn = (ticker: string, month: number): boolean =>
  MARKET_DATA.entries[ticker]?.payoutMonths?.includes(month) ?? false;

const snapshotPayDay = (ticker: string, month: number, year: number = YEAR): number | null => {
  if (!paysIn(ticker, month)) return null;

  const raw = MARKET_DATA.entries[ticker]?.estimatedPayDayByMonth?.[String(month) as '1'] ?? null;
  if (raw === null || !Number.isFinite(raw) || raw < 1) return null;

  return Math.min(Math.trunc(raw), daysInMonth(year, month));
};

/** 선택 종목이 그 달에 실제로 놓이는 날들(오름차순). 이동 버튼이 생겨야 하는 날의 전부다. */
const datedDaysOf = (tickers: string[], month: number, year: number = YEAR): number[] =>
  [...new Set(tickers.map((ticker) => snapshotPayDay(ticker, month, year)))]
    .filter((day): day is number => day !== null)
    .sort((left, right) => left - right);

/** 그 날에 놓이는 종목들(티커순) — 접근명의 건수·title 의 나열과 같은 순서. */
const tickersOnDay = (tickers: string[], day: number, month: number = MONTH, year: number = YEAR): string[] =>
  tickers.filter((ticker) => snapshotPayDay(ticker, month, year) === day).sort();

/** 6주 그리드가 다음 달에서 빌려온 날들(주 시작 = 일요일). 순수 달력 산술이라 데이터와 무관하다. */
const carriedOverDaysOf = (year: number, month: number): number[] => {
  const leading = new Date(year, month - 1, 1).getDay();
  const trailing = 6 * 7 - leading - daysInMonth(year, month);

  return Array.from({ length: Math.max(trailing, 0) }, (_, index) => index + 1);
};

/** 시나리오 전제를 실패 메시지로 드러낸다 — 화면 회귀와 데이터 변화를 로그만 보고 구분하려고. */
const requireDatedDays = (tickers: string[], month: number): number[] => {
  const days = datedDaysOf(tickers, month);
  if (days.length < 2) {
    throw new Error(
      `시나리오 전제 불성립: 스냅샷(${MARKET_DATA.asOf})에 ${tickers.join(',')} 의 ${month}월 예상 지급일이 2일 이상 필요합니다.`
    );
  }
  return days;
};

/* ---------------------------------------------------------------------------
 * 쿼리 — 역할·접근명으로만 집는다
 * ------------------------------------------------------------------------- */

const calendarTable = (label: string = MONTH_LABEL) => screen.getByRole('table', { name: label });

/** 같은 숫자의 이월 칸과 겹치므로 `<time datetime>` 으로 집는다(스펙이 요구한 마크업 계약). */
const dayCell = (isoDate: string, label: string = MONTH_LABEL): HTMLElement => {
  const time = within(calendarTable(label)).getByText(
    (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === isoDate
  );
  const cell = time.closest('td');
  if (cell === null) throw new Error(`${isoDate} 칸을 찾지 못했습니다.`);
  return cell;
};

const jumpButtonName = (day: number, count: number, month: number = MONTH): string =>
  `${month}월 ${day}일 지급 예정 ${count}종, 아래 지급 일정 목록에서 보기`;

const jumpButtons = () =>
  screen.queryAllByRole('button', { name: /\d+월 \d+일 지급 예정 \d+종, 아래 지급 일정 목록에서 보기$/ });

const jumpButton = (day: number, tickers: string[] = SELECTED, month: number = MONTH) =>
  screen.getByRole('button', { name: jumpButtonName(day, tickersOnDay(tickers, day, month).length, month) });

const agenda = () => screen.getByRole('region', { name: '지급 일정 목록' });

/** 아젠다의 한 날짜 블록(`<li>`). 이동의 착지점이다. */
const agendaDay = (isoDate: string): HTMLElement => {
  const time = within(agenda()).getByText(
    (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === isoDate
  );
  const item = time.closest('li');
  if (item === null) throw new Error(`아젠다에서 ${isoDate} 블록을 찾지 못했습니다.`);
  return item;
};

/** 강조된 날짜 블록 전부. 언제나 0개 또는 1개여야 한다. */
const highlightedAgendaDays = (): HTMLElement[] =>
  within(agenda())
    .queryAllByRole('listitem')
    .filter((item) => item.getAttribute('aria-current') === 'true');

/* ---------------------------------------------------------------------------
 * 환경 스텁 — 원복 책임을 한 곳에 모은다
 * ------------------------------------------------------------------------- */

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia');

/** reduce 선호 사용자. 전역 스텁(test/setup.ts)은 항상 matches:false 라 여기서만 갈아 끼운다. */
const stubReducedMotion = (reduce: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

afterEach(() => {
  if (ORIGINAL_MATCH_MEDIA) Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA);
});

describe('배당 지급 캘린더 — 날짜 칸 이동 버튼의 존재 범위', () => {
  it('지급 예정이 있는 날 칸에만 버튼이 생기고, 접근명이 날짜와 건수를 말한다', async () => {
    await renderCalendar();

    const datedDays = requireDatedDays(SELECTED, MONTH);
    // 누를 수 있는 칸의 수 = 그 달에 실제로 지급이 놓인 날의 수. 하나라도 더/덜이면 거짓말이다.
    expect(jumpButtons()).toHaveLength(datedDays.length);

    for (const day of datedDays) {
      const onThatDay = tickersOnDay(SELECTED, day);
      const cell = dayCell(isoOf(day));
      // 칸에는 칩(툴팁 트리거) 버튼도 있으므로 이동 버튼은 접근명으로 식별한다.
      const button = within(cell).getByRole('button', { name: jumpButtonName(day, onThatDay.length) });

      // 좁은 폭에서 칩은 표시 전용(포인터 꺼짐)이라 칸 hover 의 종목 나열은 이 title 이 맡는다.
      expect(button).toHaveAttribute('title', `${MONTH}월 ${day}일 예상 지급: ${onThatDay.join(', ')}`);
    }
  });

  it('지급 예정이 없는 날 칸에는 누를 것이 없다', async () => {
    await renderCalendar();

    const datedDays = requireDatedDays(SELECTED, MONTH);
    const emptyDays = Array.from({ length: daysInMonth(YEAR, MONTH) }, (_, index) => index + 1).filter(
      (day) => !datedDays.includes(day)
    );

    expect(emptyDays.length).toBeGreaterThan(0);
    for (const day of emptyDays) {
      expect(within(dayCell(isoOf(day))).queryAllByRole('button')).toHaveLength(0);
    }
  });

  it('다음 달에서 빌려온 이월 칸은 그 날이 실제 지급일이어도 누를 수 없다', async () => {
    await renderCalendar();

    const carriedDays = carriedOverDaysOf(YEAR, MONTH);
    // 단정이 공허해지지 않게, 이월 칸 중 실제로 다음 달 예상 지급일인 날이 있음을 먼저 세운다.
    const carriedPayDays = SELECTED.map((ticker) => snapshotPayDay(ticker, MONTH + 1)).filter(
      (day): day is number => day !== null && carriedDays.includes(day)
    );
    expect(carriedPayDays.length).toBeGreaterThan(0);

    for (const day of carriedDays) {
      expect(within(dayCell(isoOf(day, MONTH + 1))).queryAllByRole('button')).toHaveLength(0);
    }
  });

  it('누를 수 있는 날짜가 있으면 그 사실을 안내한다', async () => {
    await renderCalendar();

    expect(screen.getByText(JUMP_HINT)).toBeInTheDocument();
  });

  it('그 달에 지급이 하나도 없으면 없는 상호작용을 광고하지 않는다', async () => {
    // SCHD 는 분기(3·6·9·12) 종목이라 7월엔 지급 자체가 없다 — 달력 표는 남고 누를 칸만 없다.
    await renderCalendar(['SCHD']);

    expect(calendarTable()).toBeInTheDocument();
    expect(datedDaysOf(['SCHD'], MONTH)).toHaveLength(0);
    expect(jumpButtons()).toHaveLength(0);
    expect(screen.queryByText(JUMP_HINT)).not.toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 날짜 칸을 누르면 목록의 그 날로 간다', () => {
  it('그 날짜 블록만 강조되고 포커스가 그리로 옮겨간다', async () => {
    const { user } = await renderCalendar();
    const [firstDay, secondDay] = requireDatedDays(SELECTED, MONTH);

    await user.click(jumpButton(firstDay));

    const landed = agendaDay(isoOf(firstDay));
    expect(landed).toHaveAttribute('aria-current', 'true');
    expect(highlightedAgendaDays()).toEqual([landed]);
    // 착지점의 id 는 만드는 쪽(목록)과 찾는 쪽(페이지)이 공유하는 계약이다 — 어긋나면 무음 실패한다.
    expect(landed).toHaveAttribute('id', `dividend-agenda-day-${isoOf(firstDay)}`);

    // 이동은 rAF 한 프레임 뒤다.
    await waitFor(() => {
      expect(landed).toHaveFocus();
    });

    // 다른 날을 누르면 강조가 옮겨간다(쌓이지 않는다).
    await user.click(jumpButton(secondDay));

    const moved = agendaDay(isoOf(secondDay));
    expect(highlightedAgendaDays()).toEqual([moved]);
    expect(agendaDay(isoOf(firstDay))).not.toHaveAttribute('aria-current');
    await waitFor(() => {
      expect(moved).toHaveFocus();
    });
  });

  it("'날짜 미정' 탭을 보던 중 눌러도 목록 탭으로 돌아와 그 날짜로 간다", async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    await user.click(screen.getByRole('button', { name: /^날짜 미정/ }));
    // 전제: 이 탭에서는 아젠다가 아직 DOM 에 없다 — 그냥 스크롤하면 아무 일도 일어나지 않는다.
    expect(screen.queryByRole('region', { name: '지급 일정 목록' })).not.toBeInTheDocument();

    await user.click(jumpButton(day));

    expect(screen.getByRole('region', { name: '지급 일정 목록' })).toBeInTheDocument();
    const landed = agendaDay(isoOf(day));
    expect(landed).toHaveAttribute('aria-current', 'true');
    await waitFor(() => {
      expect(landed).toHaveFocus();
    });
  });

  it('같은 날짜를 다시 눌러도 다시 이동한다', async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    await user.click(jumpButton(day));
    const landed = agendaDay(isoOf(day));
    await waitFor(() => {
      expect(landed).toHaveFocus();
    });

    // 포커스를 딴 데로 옮겨 둔다(클릭이 아니라 focus 만 — 상태를 건드리지 않기 위해).
    const elsewhere = screen.getByRole('button', { name: /종목 선택 열기/ });
    elsewhere.focus();
    expect(landed).not.toHaveFocus();

    await user.click(jumpButton(day));

    // 같은 날짜라 상태값이 그대로면 effect 가 안 돌아 "버튼이 안 먹는" 것처럼 보인다.
    await waitFor(() => {
      expect(landed).toHaveFocus();
    });
    expect(landed).toHaveAttribute('aria-current', 'true');
  });
});

describe('배당 지급 캘린더 — 강조는 그 달·그 선택에서만 참이다', () => {
  it('달을 옮기면 강조가 사라지고, 되돌아와도 살아나지 않는다', async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    await user.click(jumpButton(day));
    expect(highlightedAgendaDays()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));
    // 다른 달 목록에 지난 달 강조가 남으면 화면이 거짓말을 한다.
    expect(highlightedAgendaDays()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '이전 달로 이동, 2026년 7월' }));
    expect(await screen.findByRole('heading', { level: 2, name: MONTH_LABEL })).toBeInTheDocument();
    expect(highlightedAgendaDays()).toHaveLength(0);
    expect(agendaDay(isoOf(day))).not.toHaveAttribute('aria-current');
  });

  it('선택 종목을 바꾸면 그 날 구성이 달라지므로 강조를 들고 가지 않는다', async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    await user.click(jumpButton(day));
    expect(highlightedAgendaDays()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /종목 선택 열기/ }));
    await user.click(screen.getByRole('button', { name: /^SCHD (?!선택 해제)/ }));

    // 그 날짜 블록 자체는 남아 있다(SCHD 는 7월에 지급하지 않는다) — 사라져서가 아니라 해제돼서 없다.
    expect(agendaDay(isoOf(day))).toBeInTheDocument();
    expect(highlightedAgendaDays()).toHaveLength(0);
  });
});

describe('배당 지급 캘린더 — 스크롤 이동의 안전장치', () => {
  const ORIGINAL_SCROLL_INTO_VIEW = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');

  const restoreScrollIntoView = () => {
    if (ORIGINAL_SCROLL_INTO_VIEW) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', ORIGINAL_SCROLL_INTO_VIEW);
      return;
    }
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
  };

  afterEach(restoreScrollIntoView);

  it('scrollIntoView 가 없는 환경에서도 이동이 죽지 않는다', async () => {
    // jsdom 기본값이지만 다른 테스트가 심어 둘 수 있으니 명시적으로 지운다.
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;

    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    await user.click(jumpButton(day));

    const landed = agendaDay(isoOf(day));
    await waitFor(() => {
      expect(landed).toHaveFocus();
    });
    expect(landed).toHaveAttribute('aria-current', 'true');
  });

  it('scrollIntoView 가 있으면 그 날짜 블록을 화면 가운데로 한 번만 부드럽게 옮긴다', async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    // 착지점에만 심는다 — 전역 프로토타입에 심으면 다른 요소의 호출까지 섞인다.
    const landed = agendaDay(isoOf(day));
    const scrollIntoView = vi.fn();
    landed.scrollIntoView = scrollIntoView;

    await user.click(jumpButton(day));

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    // 포커스가 먼저(preventScroll), 스크롤이 나중 — 반대면 화면이 두 번 튄다.
    expect(landed).toHaveFocus();
  });

  it('모션 최소화를 선호하면 부드러운 스크롤을 쓰지 않는다', async () => {
    const { user } = await renderCalendar();
    const [day] = requireDatedDays(SELECTED, MONTH);

    const landed = agendaDay(isoOf(day));
    const scrollIntoView = vi.fn();
    landed.scrollIntoView = scrollIntoView;
    // 전역 CSS 의 `scroll-behavior: auto !important` 는 JS 가 지정한 'smooth' 를 못 이긴다 —
    // 그래서 호출 시점에 JS 가 선호를 한 번 더 본다.
    stubReducedMotion(true);

    await user.click(jumpButton(day));

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });
});

describe('MonthCalendar — 이동 콜백이 없으면 버튼도 없다', () => {
  const entryOf = (ticker: string): CalendarTickerEntry => ({
    ticker,
    name: `${ticker} 한글명`,
    hasSchedule: true,
    isNonDividend: false,
    payoutMonths: [MONTH],
    source: 'pay'
  });

  /** 스냅샷과 무관한 격리 픽스처 — AAA 는 4일에 놓이고 BBB 는 날짜를 모른다. */
  const weeksFixture = buildMonthViewModel({
    year: YEAR,
    month: MONTH,
    today: TODAY,
    selected: ['AAA', 'BBB'],
    entries: [entryOf('AAA'), entryOf('BBB')],
    resolveDay: (ticker) => (ticker === 'AAA' ? 4 : null)
  }).weeks;

  const renderIsolated = (onDayJump?: (isoDate: string) => void) =>
    render(
      <>
        <h2 id="month-title">{MONTH_LABEL}</h2>
        <MonthCalendar
          weeks={weeksFixture}
          monthLabel={MONTH_LABEL}
          labelledById="month-title"
          onDayJump={onDayJump}
        />
      </>
    );

  it('미배선으로 렌더하면 아젠다 이동 버튼이 생기지 않는다(칩 툴팁 버튼은 별개다)', () => {
    renderIsolated();

    expect(screen.queryByRole('button', { name: /아래 지급 일정 목록에서 보기/ })).toBeNull();
    // 그래도 칸의 내용은 그대로다 — 칩(툴팁 트리거 버튼)은 이동 배선과 무관하게 존재한다.
    expect(within(dayCell('2026-07-04')).getByRole('button', { name: 'AAA' })).toBeInTheDocument();
  });

  it('배선하면 지급이 있는 칸에서 그 날짜(ISO)를 돌려준다', async () => {
    const user = userEvent.setup();
    const onDayJump = vi.fn();
    renderIsolated(onDayJump);

    await user.click(screen.getByRole('button', { name: /아래 지급 일정 목록에서 보기/ }));

    expect(onDayJump).toHaveBeenCalledTimes(1);
    expect(onDayJump).toHaveBeenCalledWith('2026-07-04');
  });

  it('칸의 티커 글자는 어느 폭에서도 DOM 에 남는다(좁으면 ellipsis 로 줄 뿐이다)', () => {
    renderIsolated();

    // 어느 폭에서든 칩의 티커 텍스트는 마크업에 존재한다(사용자 결정 2026-07-26: 점·개수 배지 폐기,
    // 전 폭 티커 ellipsis). jsdom 은 폭을 모르므로 여기서 확인하는 것은 "글자가 존재한다"는 계약이다.
    const cell = dayCell('2026-07-04');
    expect(within(cell).getByText('AAA')).toBeInTheDocument();
  });
});
