
/*
 * 🔴 이 파일만 타임아웃을 올린다(기본 15s → 40s).
 *
 * 이 스위트는 레포에서 **가장 무거운 렌더**다 — 배당 캘린더 한 화면이 월 격자 + 일정 목록 +
 * 종목 선택 + 범례를 한 번에 그리고, 각 테스트가 그걸 처음부터 다시 마운트한다.
 * 단독 실행은 한 건당 약 5초로 여유가 있는데, 전체 스위트(341파일)를 병렬로 돌리면 CPU 를
 * 나눠 쓰느라 같은 테스트가 15초를 넘긴다 — 실측: 단독 5.1s vs 전체 실행 중 파일 139s.
 *
 * 🔴 전역 testTimeout 을 올리지 마라. 그러면 **다른 테스트가 느려지는 것을 못 보게 된다** —
 * 타임아웃은 이 레포에서 성능 회귀를 알려 주는 유일한 신호다. 무거운 파일만 국소적으로 푼다.
 * ⚠ 이 값을 또 올려야 한다면 그건 타임아웃 문제가 아니라 **렌더가 더 무거워진 것**이다.
 *   그때는 값을 올리지 말고 무엇이 무거워졌는지 먼저 재라.
 */
vi.setConfig({ testTimeout: 40_000 });
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  RouterProvider,
  createMemoryRouter,
  useLocation,
  useNavigate,
  useNavigationType
} from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';
import { MAX_DAY_CHIPS } from '@/pages/DividendCalendar/components';
import { routes } from '@/router/routes';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * `/dividend/calendar` (v2 월간 주×일 달력) 사용자 행동 교차 검증.
 *
 * 페이지 colocated 테스트가 기본 루프를 확인한다면, 여기서는 **깨지면 사용자 자산이 상하거나
 * 화면이 거짓말을 하는 계약**을 사용자 조작으로 재현한다: 주소 읽기(진입 링크 복원·1회 정리),
 * 포커스, '오늘'의 결정성(자정 경계 포함), 날짜 미정 분리, 셀 오버플로, 그리고 화면의 예상 지급일이
 * 실제 스냅샷과 같은지.
 *
 * **행동 단정은 아젠다 목록 텍스트를 기준으로 한다.** 표 셀의 칩·카운트 배지는 폭에 따라 CSS 로만
 * 감춰지는데 jsdom 은 `@media` 를 평가하지 않아 둘 다 DOM 에 있다 — 셀만 보고 단정하면 "좁은 화면에서
 * 보이는 것"을 잘못 주장하게 된다. 셀은 '어느 날짜 칸에 놓였나'만 확인한다.
 *
 * jsdom 에는 `indexedDB` 가 없어 이 파일의 모든 렌더는 "저장 이력 없는 첫 방문"이다(실경로).
 * 저장 우선순위·저장 호출 여부는 `dividendCalendarStorage.behavior.test.tsx` 가 목으로 다룬다.
 */

/**
 * 2026-07-25(토).
 *
 * ⚠ **지급'일'을 리터럴로 적지 않는다.** 예상일은 paydates 크론이 스냅샷을 갱신할 때마다 움직이는
 * 관측치라, `2026-07-04` 같은 값을 테스트에 박으면 데이터가 갱신되는 날 아침에 화면 버그가 아닌
 * 이유로 빨개진다. 대신 아래 파생 헬퍼들이 **스냅샷(`MARKET_DATA.entries[*].estimatedPayDayByMonth`)
 * 에서 기대값을 읽어** ISO 날짜·요일 라벨·건수를 만든다 — 단정의 의도("그 지급이 올바른 칸/달/목록에
 * 놓이는가")는 그대로 두고 값만 데이터를 따라가게 하는 것이다.
 *
 * 기대값을 프로덕션 해석기(`getExpectedPayoutDay`)가 아니라 **원본 스냅샷 필드**에서 뽑는 이유:
 * 해석기를 쓰면 "화면이 계산기와 같다"만 증명돼 배치 오류(off-by-one, 이월 칸 오배치)를 못 잡는다.
 */
const TODAY = new Date(2026, 6, 25);

/** 주소·히스토리 관찰용 프로브. 화면 밖 계약(주소는 읽기 전용)을 눈에 보이게 만든다. */
function LocationProbe() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();

  return (
    <div>
      <p data-testid="probe-search">{location.search}</p>
      <p data-testid="probe-pathname">{location.pathname}</p>
      <p data-testid="probe-nav-type">{navigationType}</p>
      <button type="button" onClick={() => navigate(-1)}>
        테스트 뒤로 가기
      </button>
    </div>
  );
}

type RenderOptions = {
  entries?: string[];
  initialIndex?: number;
  today?: Date;
};

const renderCalendar = async ({
  entries = ['/dividend/calendar'],
  initialIndex,
  today = TODAY
}: RenderOptions = {}) => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex ?? entries.length - 1}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage today={today} />} />
        <Route path="/before" element={<p>이전 화면</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 2, name: /^\d{4}년 \d{1,2}월$/ });
  // 저장 로드가 끝나야(status='ready') 선택 상태가 확정된다 — 로딩 문구가 사라지는 것으로 잡는다.
  await waitFor(() => {
    expect(screen.queryByText('저장된 종목 선택을 불러오는 중입니다.')).not.toBeInTheDocument();
  });

  return { user };
};

/**
 * 결과 목록의 항목 버튼. 실측(pay)은 배지를 달지 않아 접근명이 배지로 끝난다는 보장이 없다 —
 * 티커 접두로 집되, 같은 접두를 가진 선택 칩의 제거 버튼("X 선택 해제")만 걸러낸다.
 */
const optionButton = (ticker: string) =>
  screen.getByRole('button', { name: new RegExp(`^${ticker} (?!선택 해제)`) });

/**
 * 종목 선택은 **우측 드로어** 안에 산다(2026-07-25 개편) — 닫혀 있으면 `visibility: hidden` 이라
 * 접근성 트리에서 빠진다(화면 밖으로 밀기만 하면 탭이 들어가는 유령 패널이 된다).
 * 검색·목록·선택 칩을 만지는 시나리오는 사용자와 똑같이 먼저 문을 연다.
 */
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /종목 선택 열기/ }));
};

/** 달력 아래 상세는 탭이라 한 번에 하나만 그려진다. 기본 탭은 "지급 일정 목록". */
const openUndatedTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^날짜 미정/ }));
};

const calendarTable = (monthLabel: string) => screen.getByRole('table', { name: monthLabel });

/**
 * 날짜 칸. 숫자 텍스트("4")는 같은 숫자의 이월 칸(다음 달 4일)과 겹치므로 `<time datetime>` 으로
 * 집는다 — datetime 은 스펙이 요구한 마크업 계약이라 구현 세부가 아니다.
 */
const dayCell = (table: HTMLElement, isoDate: string): HTMLElement => {
  const time = within(table).getByText(
    (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === isoDate
  );
  const cell = time.closest('td');
  if (cell === null) throw new Error(`${isoDate} 칸을 찾지 못했습니다.`);
  return cell;
};

/** 오늘 표시가 붙은 칸들. 정확히 하나여야 한다. */
const todayCells = (table: HTMLElement): HTMLElement[] =>
  within(table)
    .getAllByRole('cell')
    .filter((cell) => cell.getAttribute('aria-current') === 'date');

const agenda = () => screen.getByRole('region', { name: '지급 일정 목록' });

/** 아젠다의 한 날짜 블록(`<li>`). 표에서 밀도 때문에 잘린 정보의 **원본**이 여기 있다. */
const agendaDay = (isoDate: string): HTMLElement | null => {
  const time = within(agenda()).queryByText(
    (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === isoDate
  );
  return time?.closest('li') ?? null;
};

const agendaDayTickers = (isoDate: string): string[] => {
  const day = agendaDay(isoDate);
  if (day === null) return [];

  // 티커는 <strong>으로 감싸인다(핵심어 시맨틱) — 배지가 사라진 뒤로 텍스트 이어붙기로는
  // 한글명과 분리할 수 없어 태그 계약으로 집는다(TIME 을 집는 dayCell 과 같은 방식).
  return within(day)
    .getAllByRole('listitem')
    .map((item) => item.querySelector('strong')?.textContent?.trim() ?? '');
};

const undatedRegion = () => screen.getByRole('region', { name: /날짜 미정/ });

const searchParamsOf = (): URLSearchParams =>
  new URLSearchParams(screen.getByTestId('probe-search').textContent ?? '');

const payoutDayOf = (ticker: string, month: number): number | null =>
  MARKET_DATA.entries[ticker]?.estimatedPayDayByMonth?.[String(month) as '1'] ?? null;

const paysIn = (ticker: string, month: number): boolean =>
  MARKET_DATA.entries[ticker]?.payoutMonths?.includes(month) ?? false;

/* ---------------------------------------------------------------------------
 * 스냅샷 파생 헬퍼 — 기대값의 유일한 출처
 * ------------------------------------------------------------------------- */

/** 이 파일의 모든 시나리오가 보는 해(TODAY 와 같은 해). 연 경계 시나리오만 따로 넘긴다. */
const YEAR = 2026;

/** 요일 라벨. 카피 모듈이 아니라 여기 두는 이유: 화면이 읽는 어휘를 테스트가 독립적으로 고정한다. */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const pad2 = (value: number): string => String(value).padStart(2, '0');

const isoOf = (year: number, month: number, day: number): string => `${year}-${pad2(month)}-${pad2(day)}`;

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

/**
 * 스냅샷이 기록한 "그 종목의 그 달 예상 지급일". 그 달에 지급하지 않거나 일자 이력이 없으면 null.
 * 말일 클램프(2월 30일 같은 값)까지 포함해 화면과 같은 의미를 갖되, 계산은 스냅샷 원본에서만 한다.
 */
const snapshotPayDay = (ticker: string, month: number, year: number = YEAR): number | null => {
  if (!paysIn(ticker, month)) return null;

  const raw = payoutDayOf(ticker, month);
  if (raw === null || !Number.isFinite(raw) || raw < 1) return null;

  return Math.min(Math.trunc(raw), daysInMonth(year, month));
};

type SnapshotPayDate = {
  day: number;
  /** `<time datetime>` 과 같은 형식 — 날짜 칸·아젠다 조회의 앵커. */
  iso: string;
  /** 아젠다의 날짜 머리("7월 4일 (토)"). 요일은 달력 산술로 계산한다. */
  agendaLabel: string;
};

/**
 * 시나리오의 **전제**를 명시적으로 세운다: "이 종목은 그 달에 지급하고, 스냅샷에 예상일이 있다."
 *
 * 크론이 날짜를 옮기면 iso·요일 라벨이 함께 움직여 단정은 그대로 통과한다. 전제 자체가 사라지면
 * (그 종목이 그 달 지급을 멈추거나 일자 이력이 빠지면) "요소를 찾지 못했습니다" 같은 애매한 실패가
 * 아니라 이 메시지로 죽는다 — 화면 회귀와 데이터 변화를 실패 로그만 보고 구분하기 위해서다.
 */
const requirePayDate = (ticker: string, month: number, year: number = YEAR): SnapshotPayDate => {
  const day = snapshotPayDay(ticker, month, year);
  if (day === null) {
    throw new Error(
      `시나리오 전제 불성립: 스냅샷(${MARKET_DATA.asOf})에 ${ticker} 의 ${year}년 ${month}월 예상 지급일이 없습니다.`
    );
  }

  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];

  return { day, iso: isoOf(year, month, day), agendaLabel: `${month}월 ${day}일 (${weekday})` };
};

/** 선택 종목 중 그 날짜에 놓여야 하는 것들(티커순) — 아젠다 한 날 블록의 정확한 기대값. */
const tickersOnDay = (tickers: string[], month: number, day: number, year: number = YEAR): string[] =>
  tickers.filter((ticker) => snapshotPayDay(ticker, month, year) === day).sort();

/** 선택 종목들의 그 달 집계 — 요약 줄·라이브 리전의 숫자 기대값. */
const monthTotals = (tickers: string[], month: number, year: number = YEAR) =>
  tickers.reduce(
    (totals, ticker) => {
      if (!paysIn(ticker, month)) return totals;

      return snapshotPayDay(ticker, month, year) === null
        ? { ...totals, undated: totals.undated + 1 }
        : { ...totals, dated: totals.dated + 1 };
    },
    { dated: 0, undated: 0 }
  );

/** 요약 문구는 **문장 자체를 리터럴로** 고정하고 숫자만 스냅샷에서 파생한다. */
const monthSummaryText = (label: string, tickers: string[], month: number, year: number = YEAR): string => {
  const { dated, undated } = monthTotals(tickers, month, year);
  return `${label} 지급 예정 ${dated}건 · 날짜 미정 ${undated}종`;
};

/**
 * 6주 고정 그리드가 **다음 달에서 빌려오는 이월 날짜들**(주 시작 = 일요일). 스냅샷이 아니라 순수
 * 달력 산술이라 데이터 갱신과 무관하다.
 */
const carriedOverDaysOf = (year: number, month: number): number[] => {
  const leading = new Date(year, month - 1, 1).getDay();
  const trailing = 6 * 7 - leading - daysInMonth(year, month);

  return Array.from({ length: Math.max(trailing, 0) }, (_, index) => index + 1);
};

/**
 * 그 달 예상 지급일이 **가장 많이 겹치는 날**과 그 종목들(티커순).
 *
 * 셀 오버플로는 특정 종목("DES·DGRW·DHS·DLN 은 7월 28일")의 계약이 아니라 "한 칸에 상한을 넘게
 * 몰렸을 때 접는가"의 계약이다. 그래서 밀집 자체를 스냅샷에서 찾아 쓴다 — 크론이 날짜를 옮겨도
 * 몰리는 날이 따라 옮겨갈 뿐 시나리오는 성립한다.
 */
const busiestDayOf = (month: number, year: number = YEAR): { day: number; tickers: string[] } => {
  const byDay = new Map<number, string[]>();

  for (const ticker of Object.keys(DIVIDEND_UNIVERSE)) {
    const day = snapshotPayDay(ticker, month, year);
    if (day === null) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), ticker]);
  }

  const busiest = [...byDay.entries()].sort(
    ([leftDay, leftTickers], [rightDay, rightTickers]) =>
      rightTickers.length - leftTickers.length || leftDay - rightDay
  )[0];

  if (busiest === undefined) {
    throw new Error(`시나리오 전제 불성립: 스냅샷(${MARKET_DATA.asOf})에 ${month}월 예상 지급일이 하나도 없습니다.`);
  }

  return { day: busiest[0], tickers: [...busiest[1]].sort() };
};

describe('배당 지급 캘린더 — 기본 루프', () => {
  it('검색해서 고르면 달력·요약·아젠다·라이브 리전이 함께 갱신되고, 고른 항목은 목록에 남는다', async () => {
    const { user } = await renderCalendar();

    await openPicker(user);
    // 소문자로 쳐도 찾아진다(대소문자 무시 계약).
    await user.type(screen.getByLabelText('종목 검색'), 'jepi');
    expect(screen.getByText('1종목')).toBeInTheDocument();

    await user.click(optionButton('JEPI'));

    // 선택해도 결과 목록에서 사라지지 않는다 — 사라지면 실수한 선택을 되돌릴 수 없다.
    expect(optionButton('JEPI')).toHaveAttribute('aria-pressed', 'true');

    // 날짜는 스냅샷에서 파생한다: "JEPI 의 7월 예상일 칸"에 놓였는가를 묻는 것이지 4일을 묻는 게 아니다.
    const jepiJuly = requirePayDate('JEPI', 7);
    expect(within(dayCell(calendarTable('2026년 7월'), jepiJuly.iso)).getByText('JEPI')).toBeInTheDocument();
    expect(agendaDayTickers(jepiJuly.iso)).toEqual(['JEPI']);
    expect(within(agenda()).getByText(jepiJuly.agendaLabel)).toBeInTheDocument();
    expect(screen.getByText(monthSummaryText('2026년 7월', ['JEPI'], 7))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      `선택 1종, 이 달 지급 예정 ${monthTotals(['JEPI'], 7).dated}건.`
    );
  });

  it('검색 결과가 없으면 이유를 말하고, Escape 로 검색어만 지운다(선택·포커스는 그대로)', async () => {
    const { user } = await renderCalendar();
    await openPicker(user);
    const search = screen.getByLabelText('종목 검색');

    await user.type(search, 'ZZZZ');

    expect(screen.getByText(/검색어와 일치하는 종목이 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('검색 결과가 없습니다.');

    await user.keyboard('{Escape}');

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(screen.getByText(`${Object.keys(DIVIDEND_UNIVERSE).length}종목`)).toBeInTheDocument();
  });

  it('화면 폭과 무관하게 핵심 요소는 하나씩만 존재한다(중복 렌더 회귀 방지)', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI'] });

    expect(screen.getAllByRole('heading', { level: 1, name: '배당 지급 캘린더' })).toHaveLength(1);
    expect(screen.getAllByLabelText('종목 검색')).toHaveLength(1);
    expect(screen.getAllByRole('table', { name: '2026년 7월' })).toHaveLength(1);
    expect(screen.getAllByRole('region', { name: '지급 일정 목록' })).toHaveLength(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    // 표는 달력이지 날짜 피커가 아니다 — 지키지 않을 키보드 계약(grid)을 선언하지 않는다.
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
  });
});

describe('배당 지급 캘린더 — 오늘의 결정성', () => {
  it('주입한 날짜 칸에만 오늘 표시가 붙고, 다른 달로 옮기면 사라진다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI'] });

    const july = calendarTable('2026년 7월');
    expect(todayCells(july)).toHaveLength(1);
    expect(within(todayCells(july)[0]).getByText('25')).toBeInTheDocument();
    expect(screen.getAllByText('오늘')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));

    expect(todayCells(calendarTable('2026년 8월'))).toHaveLength(0);
    expect(screen.queryByText('오늘')).not.toBeInTheDocument();
  });

  it('자정 직후 시각을 줘도 오늘이 하루 밀리지 않는다 (UTC 변환 금지 계약)', async () => {
    // KST 로컬 00:30 은 UTC 로 전날 15:30 이다 — 구현이 toISOString/UTC 게터를 쓰면 24일에 찍힌다.
    await renderCalendar({
      entries: ['/dividend/calendar?tickers=JEPI'],
      today: new Date(2026, 6, 25, 0, 30)
    });

    const july = calendarTable('2026년 7월');
    const marked = todayCells(july);

    expect(marked).toHaveLength(1);
    expect(marked[0]).toBe(dayCell(july, '2026-07-25'));
    expect(within(marked[0]).getByText('25')).toBeInTheDocument();
    expect(dayCell(july, '2026-07-24')).not.toHaveAttribute('aria-current');
  });
});

describe('배당 지급 캘린더 — 월 이동', () => {
  it('12월에서 다음 달을 누르면 연도를 넘기고 라이브 리전이 그 달을 알린다', async () => {
    const { user } = await renderCalendar({
      entries: ['/dividend/calendar?tickers=JEPI'],
      today: new Date(2026, 11, 25)
    });

    expect(screen.getByRole('heading', { level: 2, name: '2026년 12월' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2027년 1월' }));

    expect(await screen.findByRole('heading', { level: 2, name: '2027년 1월' })).toBeInTheDocument();
    // 되돌아갈 방향의 접근명도 연 경계를 넘어 갱신돼야 한다.
    expect(screen.getByRole('button', { name: '이전 달로 이동, 2026년 12월' })).toBeInTheDocument();

    // 연도를 넘긴 뒤에도 이듬해 1월의 예상일이 그 달 아젠다에 놓인다(요일도 2027년 기준으로 계산된다).
    const jepiNextJanuary = requirePayDate('JEPI', 1, 2027);
    expect(within(agenda()).getByText(jepiNextJanuary.agendaLabel)).toBeInTheDocument();

    const januaryTotals = monthTotals(['JEPI'], 1, 2027);
    expect(screen.getByRole('status')).toHaveTextContent(
      `2027년 1월. 지급 예정 ${januaryTotals.dated}건, 날짜 미정 ${januaryTotals.undated}종.`
    );
  });

  it('"이번 달" 버튼은 이번 달에서 비활성이고, 이동한 뒤 눌러 돌아올 수 있다(포커스 유지)', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI'] });

    const todayButton = screen.getByRole('button', { name: '이번 달로 돌아가기, 2026년 7월' });
    expect(todayButton).toBeDisabled();

    const nextButton = screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' });
    await user.click(nextButton);

    // 표만 교체되고 툴바는 리마운트되지 않는다 — 연타할 수 있어야 한다.
    expect(nextButton).toHaveFocus();
    expect(screen.getByRole('heading', { level: 2, name: '2026년 8월' })).toBeInTheDocument();
    expect(todayButton).toBeEnabled();

    await user.click(todayButton);

    expect(screen.getByRole('heading', { level: 2, name: '2026년 7월' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이번 달로 돌아가기, 2026년 7월' })).toBeDisabled();
  });
});

describe('배당 지급 캘린더 — 날짜 미정 분리', () => {
  it('예상일이 있는 종목만 날짜 칸에 놓고, 없는 종목은 미정 섹션에만 둔다', async () => {
    const selected = ['JEPI', 'KO', 'O', 'SCHD'];
    const { user } = await renderCalendar({ entries: [`/dividend/calendar?tickers=${selected.join(',')}`] });

    const july = calendarTable('2026년 7월');

    // 예상일이 있는 종목: 스냅샷이 말하는 그 날짜 칸 + 아젠다.
    const jepiJuly = requirePayDate('JEPI', 7);
    const koJuly = requirePayDate('KO', 7);
    expect(within(dayCell(july, jepiJuly.iso)).getByText('JEPI')).toBeInTheDocument();
    expect(within(dayCell(july, koJuly.iso)).getByText('KO')).toBeInTheDocument();
    // 같은 날에 다른 선택 종목이 겹치면 그것까지 정확히 나열돼야 한다(기대 목록도 스냅샷에서 만든다).
    expect(agendaDayTickers(koJuly.iso)).toEqual(tickersOnDay(selected, 7, koJuly.day));
    expect(within(agenda()).getByText(koJuly.agendaLabel)).toBeInTheDocument();

    // O 는 7월에 주지만 날짜를 모른다 → 어느 칸에도 놓지 않는다(임의 날짜로 채우지 않는다).
    expect(paysIn('O', 7)).toBe(true);
    expect(snapshotPayDay('O', 7)).toBeNull();
    expect(within(july).queryByText('O')).not.toBeInTheDocument();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('O')).toBeInTheDocument();

    // SCHD 는 7월 지급 자체가 없는 분기 종목이라 어디에도 등장하지 않는다 — "미정"은 날짜를 모르는
    // 것이지 지급 여부를 모르는 게 아니다.
    expect(paysIn('SCHD', 7)).toBe(false);
    expect(within(july).queryByText('SCHD')).not.toBeInTheDocument();
    expect(within(undatedRegion()).queryByText('SCHD')).not.toBeInTheDocument();

    // 6주 그리드에 딸려 온 이월 칸(8월 앞부분)에는 칩을 놓지 않는다 — 8월 지급이 7월 화면에서
    // 한 번, 8월 화면에서 또 한 번 세어지면 달력이 같은 지급을 두 번 말하게 된다.
    // 단정이 공허해지지 않도록 "이월 칸 중 실제로 선택 종목의 8월 예상 지급일인 날"이 있음을 먼저 세운다.
    const carriedDays = carriedOverDaysOf(2026, 7);
    const carriedPayDays = selected
      .map((ticker) => snapshotPayDay(ticker, 8))
      .filter((day): day is number => day !== null && carriedDays.includes(day));
    expect(carriedPayDays.length).toBeGreaterThan(0);

    for (const day of carriedDays) {
      const carriedOver = dayCell(july, isoOf(2026, 8, day));
      expect(within(carriedOver).queryAllByRole('listitem')).toHaveLength(0);
      // 대신 어느 달의 며칠인지는 낭독된다(숫자만 읽히면 위치를 잃는다).
      expect(within(carriedOver).getByText('8월')).toBeInTheDocument();
    }

    expect(screen.getByText(monthSummaryText('2026년 7월', selected, 7))).toBeInTheDocument();
  });

  it('달을 옮기면 미정 목록도 그 달 기준으로 다시 계산된다', async () => {
    const selected = ['SCHD', 'DGRO'];
    const { user } = await renderCalendar({ entries: [`/dividend/calendar?tickers=${selected.join(',')}`] });

    // 7월: 둘 다 분기(3·6·9·12월) 종목이라 이 달엔 지급 자체가 없다.
    expect(monthTotals(selected, 7)).toEqual({ dated: 0, undated: 0 });
    expect(screen.getByText('2026년 7월에는 선택한 종목의 지급 예정이 없습니다.')).toBeInTheDocument();
    expect(
      within(agenda()).getByText('이 달에는 지급 예정이 없습니다. 다른 달로 이동하거나 종목을 추가해 보세요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /날짜 미정/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 9월' }));

    // 9월: DGRO 는 스냅샷의 예상일 칸에, SCHD 는 날짜를 몰라 미정으로.
    const dgroSeptember = requirePayDate('DGRO', 9);
    expect(within(dayCell(calendarTable('2026년 9월'), dgroSeptember.iso)).getByText('DGRO')).toBeInTheDocument();
    expect(within(agenda()).getByText(dgroSeptember.agendaLabel)).toBeInTheDocument();

    await openUndatedTab(user);
    expect(paysIn('SCHD', 9)).toBe(true);
    expect(snapshotPayDay('SCHD', 9)).toBeNull();
    expect(within(undatedRegion()).getByText('SCHD')).toBeInTheDocument();
    expect(screen.getByText(monthSummaryText('2026년 9월', selected, 9))).toBeInTheDocument();
  });

  it('날짜 있는 지급이 0건이고 미정만 있으면 "지급이 없다"고 말하지 않는다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=O'] });

    // 이 시나리오의 전제: O 는 7월에 주지만 일자 이력이 없다(스냅샷이 그렇게 말한다).
    expect(monthTotals(['O'], 7)).toEqual({ dated: 0, undated: 1 });
    expect(
      within(agenda()).getByText('날짜를 추정할 수 있는 지급이 없습니다. "날짜 미정" 탭을 확인하세요.')
    ).toBeInTheDocument();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('O')).toBeInTheDocument();
    expect(screen.getByText(monthSummaryText('2026년 7월', ['O'], 7))).toBeInTheDocument();
    expect(screen.queryByText('2026년 7월에는 선택한 종목의 지급 예정이 없습니다.')).not.toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 셀 오버플로', () => {
  it('한 날짜에 표시 상한을 넘게 몰리면 나머지는 +N 으로 접고 원본은 아젠다에 남긴다', async () => {
    // 종목·날짜를 박지 않고 **스냅샷에서 가장 붐비는 날**을 찾아 그 종목들을 고른다
    // (크론이 날짜를 옮기면 붐비는 날도 함께 옮겨갈 뿐, "상한 초과 = 접는다" 계약은 그대로다).
    const { day, tickers: crowded } = busiestDayOf(7);
    expect(crowded.length).toBeGreaterThan(MAX_DAY_CHIPS);

    await renderCalendar({ entries: [`/dividend/calendar?tickers=${crowded.join(',')}`] });

    const cell = dayCell(calendarTable('2026년 7월'), isoOf(2026, 7, day));

    expect(within(cell).getAllByRole('listitem')).toHaveLength(MAX_DAY_CHIPS);
    expect(within(cell).getByText(`+${crowded.length - MAX_DAY_CHIPS}`)).toBeInTheDocument();

    // 표에서 잘린 정보의 완전한 원본은 항상 아젠다에 있다.
    expect(agendaDayTickers(isoOf(2026, 7, day))).toEqual(crowded);
    expect(screen.getByText(monthSummaryText('2026년 7월', crowded, 7))).toBeInTheDocument();
  });
});

/**
 * 🔴 2026-07-30 계약 변경 — **주소는 읽기 전용이다.**
 *
 * 구 계약은 "선택이 바뀌면 주소도 바뀐다(주소 복사 = 공유)"였는데 **캘린더에는 공유 버튼도
 * 공유 안내도 없었다** — 도달 가능한 기능이 아니었고, 대가로 종목을 누를 때마다 주소가 흔들렸다.
 * 남긴 것은 **읽기**다: 이미 밖에 나간 링크와 앱 안의 생산자(`pages/Portfolio/utils/portfolioShareUrl`)
 * 가 계속 `/dividend/calendar?tickers=…` 를 만든다. 아래 케이스는 **읽기 유지 ↔ 쓰기 제거**의
 * 대조군 한 짝이다 — 읽기 케이스가 없으면 "쓰지 않는다"가 "파람을 아예 안 본다"와 구분되지 않는다.
 */
describe('배당 지급 캘린더 — 주소(읽기 전용)', () => {
  it('?tickers= 로 들어오면 그 선택으로 열린다 — 대문자·중복 제거한 표준형으로 읽는다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=schd,jepi,SCHD'] });

    expect(screen.getByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();
  });

  it('읽고 난 tickers 파라미터는 한 번 정리하고, 남의 파라미터는 보존한다(replace — 히스토리 불변)', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

    await waitFor(() => {
      expect(searchParamsOf().has('tickers')).toBe(false);
    });
    // 캘린더가 남의 파라미터를 지우면 유입 추적이 조용히 깨진다.
    expect(searchParamsOf().get('foo')).toBe('bar');
    expect(screen.getByTestId('probe-nav-type')).toHaveTextContent('REPLACE');
    // 정리했다고 화면의 선택까지 지워지면 안 된다.
    expect(screen.getByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();
  });

  it('선택을 바꿔도 주소는 그대로다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?foo=bar'] });

    await openPicker(user);
    await user.click(optionButton('SCHD'));
    await user.click(optionButton('KO'));

    expect(screen.getByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();
    expect(searchParamsOf().has('tickers')).toBe(false);
    expect(searchParamsOf().get('foo')).toBe('bar');
  });

  it('선택을 비워도 주소는 그대로다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: '선택 비우기' }));

    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');
    expect(searchParamsOf().has('tickers')).toBe(false);
    expect(searchParamsOf().get('foo')).toBe('bar');
  });

  it('선택 후 뒤로 가면 캘린더의 이전 상태가 아니라 직전 화면으로 돌아간다', async () => {
    const { user } = await renderCalendar({ entries: ['/before', '/dividend/calendar'], initialIndex: 1 });

    await openPicker(user);
    await user.click(optionButton('SCHD'));
    await user.click(optionButton('KO'));
    expect(screen.getByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '테스트 뒤로 가기' }));

    expect(screen.getByTestId('probe-pathname')).toHaveTextContent('/before');
    expect(screen.getByText('이전 화면')).toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 포커스 계약', () => {
  it('선택 칩의 ×로 해제하면 포커스가 검색 입력으로 돌아온다', async () => {
    const { user } = await renderCalendar();

    await openPicker(user);
    await user.click(optionButton('SCHD'));
    await user.click(screen.getByRole('button', { name: 'SCHD 선택 해제' }));

    // 사라진 버튼에 포커스가 남으면 키보드 사용자는 body 로 떨어져 위치를 잃는다.
    expect(screen.getByLabelText('종목 검색')).toHaveFocus();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 캘린더에 놓을 수 없는 종목', () => {
  /**
   * 🔴 **"아직 없음"과 "해당 없음"은 다른 부류다.**
   *
   * - 배당 없음 = 배당을 지급하지 않는 종목(`frequency: 'none'`). 기다려도 데이터가 생기지 않는다.
   * - 데이터 준비 중 = 배당은 지급하는데 지급월 스냅샷이 아직 없는 종목. 갱신되면 사라진다.
   *
   * 리터럴(19)을 박지 않는 이유는 이 파일 머리의 규칙과 같다 — 크론이 스냅샷을 채우는 날
   * 화면 버그가 아닌 이유로 빨개진다.
   */
  const nonDividendTickers = Object.entries(DIVIDEND_UNIVERSE)
    .filter(([, preset]) => preset.frequency === 'none')
    .map(([ticker]) => ticker);

  const unavailableTickers = Object.keys(DIVIDEND_UNIVERSE).filter(
    (ticker) =>
      (MARKET_DATA.entries[ticker]?.payoutMonths ?? []).length === 0 && !nonDividendTickers.includes(ticker)
  );

  it('총 개수 옆에 "준비 중 N종"·"배당 없음 N종"을 나눠 적고, 그 수는 목록 배지와 같은 기준에서 나온다', async () => {
    const { user } = await renderCalendar();
    await openPicker(user);

    expect(screen.getByText(`${Object.keys(DIVIDEND_UNIVERSE).length}종목`)).toBeInTheDocument();
    expect(screen.getByText(`배당 없음 ${nonDividendTickers.length}종`)).toBeInTheDocument();
    // 숫자의 근거 = 화면에 실제로 그 배지가 달린 항목 수. 둘이 어긋나면 둘 다 못 믿는다.
    expect(screen.getAllByText('배당 없음')).toHaveLength(nonDividendTickers.length);

    /*
     * "준비 중"은 스냅샷이 채워지면 0 이 되는 부류다(2026-07-29 갱신으로 실제 0 이 됐다).
     * 0 일 때 토큰을 아예 렌더하지 않는 것도 계약이라, 개수에 따라 양쪽을 모두 단정한다.
     */
    if (unavailableTickers.length > 0) {
      expect(screen.getByText(`준비 중 ${unavailableTickers.length}종`)).toBeInTheDocument();
      expect(screen.getAllByText('데이터 준비 중')).toHaveLength(unavailableTickers.length);
    } else {
      expect(screen.queryByText(/^준비 중/)).not.toBeInTheDocument();
      expect(screen.queryByText('데이터 준비 중')).not.toBeInTheDocument();
    }
  });

  it('검색으로 목록을 좁히면 개수도 함께 좁혀지고, 0이면 아예 사라진다', async () => {
    const { user } = await renderCalendar();
    await openPicker(user);
    const search = screen.getByLabelText('종목 검색');

    /*
     * ANET 은 배당을 지급하지 않는다 — 시세 갱신으로 바뀌지 않는 유일하게 안전한 예시다.
     * ⚠ 예전에는 QQQ 를 "데이터 없는 예시"로 썼는데 2026-07-29 시세 갱신으로 데이터가 생겨 깨졌다.
     *   갱신으로 바뀔 수 있는 티커를 고정 예시로 쓰지 마라.
     */
    await user.type(search, 'ANET');
    expect(screen.getByText('1종목')).toBeInTheDocument();
    expect(screen.getByText('배당 없음 1종')).toBeInTheDocument();
    // ANET 은 준비 중이 아니다 — 이 단정이 이 미션의 핵심(사용자 신고: "ANET 은 준비 중으로 나와").
    expect(screen.queryByText(/^준비 중/)).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'JEPI');
    expect(screen.getByText('1종목')).toBeInTheDocument();
    expect(screen.queryByText(/^준비 중/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^배당 없음/)).not.toBeInTheDocument();
  });

  it('클릭도 Enter 도 선택으로 이어지지 않고 이유를 배지로 남긴다', async () => {
    const { user } = await renderCalendar();

    await openPicker(user);
    // 배당을 지급하지 않는 ANET — 고를 수 없는 건 준비 중과 같지만 **사유 표기가 달라야** 한다.
    const unavailable = optionButton('ANET');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    // 사유는 항목 안 배지가 말한다(별도 안내문은 삭제 — 사용자 결정 2026-07-25).
    expect(unavailable).toHaveTextContent('배당 없음');
    expect(unavailable).not.toHaveTextContent('데이터 준비 중');

    await user.click(unavailable);
    unavailable.focus();
    await user.keyboard('{Enter}');

    expect(optionButton('ANET')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '종목 선택 열기' })).toBeInTheDocument();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    expect(searchParamsOf().has('tickers')).toBe(false);
  });

  it('일정을 놓을 수 없는 종목만 선택되면 빈 달력과 함께 경고를 보여준다', async () => {
    // 목록에서는 고를 수 없지만 공유 주소로는 들어올 수 있는 상태(`?tickers=`).
    await renderCalendar({ entries: ['/dividend/calendar?tickers=ANET'] });

    /*
     * 경고문은 "아직 지급월 데이터가 없습니다"라고 쓰지 않는다 — ANET 처럼 배당을 지급하지 않는
     * 종목에는 거짓이 되기 때문이다(기다려도 데이터가 생기지 않는다). 두 부류를 모두 참으로
     * 덮는 한 문장이면 분기 없이 정직할 수 있다.
     */
    expect(
      screen.getByText(
        '선택한 종목은 캘린더에 표시할 지급 일정이 없습니다. 지급 일정이 있는 종목을 추가하면 캘린더가 채워집니다.'
      )
    ).toBeInTheDocument();
    // 달력 표는 화면의 뼈대라 항상 남는다(사용자 결정 2026-07-25). 다만 표는 아무 주장도 하지 않는다 —
    // "이 종목들은 이 달에 안 준다"가 아니라 "데이터가 없다"를 경고가 말하고, 요약·상세 목록은 붙지 않는다.
    const july = screen.getByRole('table', { name: '2026년 7월' });
    expect(july).toBeInTheDocument();
    expect(within(july).queryByText('ANET')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '지급 일정 목록' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 라이브 리전', () => {
  it('빈 선택에서도 마운트돼 있고 선택·월 이동·비우기에 따라 텍스트만 바뀐다', async () => {
    const { user } = await renderCalendar();

    const live = screen.getByRole('status');
    expect(live).toBeInTheDocument();
    expect(live).toHaveTextContent('');

    await openPicker(user);
    await user.click(optionButton('JEPI'));
    expect(screen.getByRole('status')).toHaveTextContent(
      `선택 1종, 이 달 지급 예정 ${monthTotals(['JEPI'], 7).dated}건.`
    );

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));
    const augustTotals = monthTotals(['JEPI'], 8);
    expect(screen.getByRole('status')).toHaveTextContent(
      `2026년 8월. 지급 예정 ${augustTotals.dated}건, 날짜 미정 ${augustTotals.undated}종.`
    );

    await user.click(screen.getByRole('button', { name: '선택 비우기' }));
    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');
  });
});

describe('배당 지급 캘린더 — 데이터 사실성', () => {
  const SPOT_CHECK = ['JEPI', 'KO', 'ABBV', 'DGRO'];

  it('아젠다의 날짜가 스냅샷의 estimatedPayDayByMonth 와 정확히 일치한다', async () => {
    const { user } = await renderCalendar({ entries: [`/dividend/calendar?tickers=${SPOT_CHECK.join(',')}`] });

    for (const month of [7, 8, 9]) {
      if (month > 7) {
        await user.click(screen.getByRole('button', { name: `다음 달로 이동, 2026년 ${month}월` }));
      }

      const expectedByDay = new Map<number, string[]>();
      for (const ticker of SPOT_CHECK) {
        const day = snapshotPayDay(ticker, month);
        if (day === null) continue;
        expectedByDay.set(day, [...(expectedByDay.get(day) ?? []), ticker].sort());
      }

      expect(expectedByDay.size).toBeGreaterThan(0);
      for (const [day, tickers] of expectedByDay) {
        expect(agendaDayTickers(isoOf(2026, month, day))).toEqual(tickers);
      }

      // 스냅샷에 없는 날짜에는 아무것도 놓이지 않는다(달력이 날짜를 지어내지 않는다).
      const renderedDays = within(agenda())
        .getAllByRole('listitem')
        .filter((item) => item.querySelector('time') !== null);
      expect(renderedDays).toHaveLength(expectedByDay.size);
    }
  });

  it('실측(pay)은 무배지가 기본이고, 배당락 기반만 "추정" 배지를 단다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI,O'] });

    // 데이터의 '형태'가 아니라 화면의 '어법'을 고정한다 — 스냅샷 재갱신으로 필드 표기가 바뀌어도
    // 배당락 기반(non-'pay')이 무배지(=실측 취급)로 승격되지만 않으면 계약은 지켜진 것이다.
    expect(MARKET_DATA.entries.JEPI?.payoutMonthsSource).toBe('pay');
    expect(MARKET_DATA.entries.O?.payoutMonthsSource).not.toBe('pay');

    const jepiDay = agendaDay(requirePayDate('JEPI', 7).iso);
    expect(jepiDay).not.toBeNull();
    // 기본값(실측)에는 배지를 달지 않는다(사용자 결정 2026-07-26) — '실측'도 '추정'도 없어야 한다.
    expect(within(jepiDay as HTMLElement).queryByText('실측')).toBeNull();
    expect(within(jepiDay as HTMLElement).queryByText('추정')).toBeNull();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('추정')).toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 라우터 배선', () => {
  it('/dividend/calendar 로 들어오면 캘린더 화면이 뜬다', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/dividend/calendar'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: '배당 지급 캘린더' })).toBeInTheDocument();
  });
});
