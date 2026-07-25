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
import { describe, expect, it } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';
import { MAX_DAY_CHIPS } from '@/pages/DividendCalendar/components';
import { routes } from '@/router/routes';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * `/dividend/calendar` (v2 월간 주×일 달력) 사용자 행동 교차 검증.
 *
 * 페이지 colocated 테스트가 기본 루프를 확인한다면, 여기서는 **깨지면 사용자 자산이 상하거나
 * 화면이 거짓말을 하는 계약**을 사용자 조작으로 재현한다: 주소 동기화(replace·다른 파라미터 보존),
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

/** 2026-07-25(토). 실데이터: JEPI 7월 4일, KO 7월 2일, O·SCHD 는 일자 미정. */
const TODAY = new Date(2026, 6, 25);

/** 주소·히스토리 관찰용 프로브. 화면 밖 계약(주소가 곧 공유 링크)을 눈에 보이게 만든다. */
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
 * 결과 목록의 항목 버튼. 접근명이 "티커 + 한글명 + 근거 배지"라 배지 어휘로 끝나는 것을 앵커로 쓴다
 * (선택 칩의 제거 버튼과 티커 접두가 겹치기 때문).
 */
const optionButton = (ticker: string) =>
  screen.getByRole('button', { name: new RegExp(`^${ticker} .*(실측|추정|데이터 준비 중)$`) });

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
 * 날짜 칸. 숫자 텍스트("4")는 이월 칸(8월 4일)과 겹치므로 `<time datetime>` 으로 집는다 —
 * datetime 은 스펙이 요구한 마크업 계약이라 구현 세부가 아니다.
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

  return within(day)
    .getAllByRole('listitem')
    .map((item) => (item.textContent ?? '').replace(/(실측|추정).*$/, '').trim());
};

const undatedRegion = () => screen.getByRole('region', { name: /날짜 미정/ });

const searchParamsOf = (): URLSearchParams =>
  new URLSearchParams(screen.getByTestId('probe-search').textContent ?? '');

const payoutDayOf = (ticker: string, month: number): number | null =>
  MARKET_DATA.entries[ticker]?.estimatedPayDayByMonth?.[String(month) as '1'] ?? null;

const paysIn = (ticker: string, month: number): boolean =>
  MARKET_DATA.entries[ticker]?.payoutMonths?.includes(month) ?? false;

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
    expect(within(dayCell(calendarTable('2026년 7월'), '2026-07-04')).getByText('JEPI')).toBeInTheDocument();
    expect(agendaDayTickers('2026-07-04')).toEqual(['JEPI']);
    expect(within(agenda()).getByText('7월 4일 (토)')).toBeInTheDocument();
    expect(screen.getByText('2026년 7월 지급 예정 1건 · 날짜 미정 0종')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('선택 1종, 이 달 지급 예정 1건.');
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
    // JEPI 2027년 1월 = 3일 예상.
    expect(within(agenda()).getByText('1월 3일 (일)')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2027년 1월. 지급 예정 1건, 날짜 미정 0종.');
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
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI,KO,O,SCHD'] });

    const july = calendarTable('2026년 7월');

    // 예상일이 있는 종목: 날짜 칸 + 아젠다.
    expect(within(dayCell(july, '2026-07-04')).getByText('JEPI')).toBeInTheDocument();
    expect(within(dayCell(july, '2026-07-02')).getByText('KO')).toBeInTheDocument();
    expect(agendaDayTickers('2026-07-02')).toEqual(['KO']);
    expect(within(agenda()).getByText('7월 2일 (목)')).toBeInTheDocument();

    // O 는 7월에 주지만 날짜를 모른다 → 어느 칸에도 놓지 않는다(임의 날짜로 채우지 않는다).
    expect(within(july).queryByText('O')).not.toBeInTheDocument();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('O')).toBeInTheDocument();

    // SCHD 는 3·6·9·12월 종목이라 7월엔 아예 등장하지 않는다 — "미정"은 날짜를 모르는 것이지
    // 지급 여부를 모르는 게 아니다.
    expect(within(july).queryByText('SCHD')).not.toBeInTheDocument();
    expect(within(undatedRegion()).queryByText('SCHD')).not.toBeInTheDocument();

    // 6주 그리드에 딸려 온 이월 칸(8월 4일)에는 칩을 놓지 않는다 — 8월 지급이 7월 화면에서
    // 한 번, 8월 화면에서 또 한 번 세어지면 달력이 같은 지급을 두 번 말하게 된다.
    const carriedOver = dayCell(july, '2026-08-04');
    expect(within(carriedOver).queryByText('JEPI')).not.toBeInTheDocument();
    // 대신 어느 달의 4일인지는 낭독된다(숫자만 읽히면 위치를 잃는다).
    expect(within(carriedOver).getByText('8월')).toBeInTheDocument();

    expect(screen.getByText('2026년 7월 지급 예정 2건 · 날짜 미정 1종')).toBeInTheDocument();
  });

  it('달을 옮기면 미정 목록도 그 달 기준으로 다시 계산된다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD,DGRO'] });

    // 7월: 둘 다 3·6·9·12월 종목이라 이 달엔 지급 자체가 없다.
    expect(screen.getByText('2026년 7월에는 선택한 종목의 지급 예정이 없습니다.')).toBeInTheDocument();
    expect(
      within(agenda()).getByText('이 달에는 지급 예정이 없습니다. 다른 달로 이동하거나 종목을 추가해 보세요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /날짜 미정/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 9월' }));

    // 9월: DGRO 는 28일에, SCHD 는 날짜를 몰라 미정으로.
    expect(within(dayCell(calendarTable('2026년 9월'), '2026-09-28')).getByText('DGRO')).toBeInTheDocument();
    expect(within(agenda()).getByText('9월 28일 (월)')).toBeInTheDocument();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('SCHD')).toBeInTheDocument();
    expect(screen.getByText('2026년 9월 지급 예정 1건 · 날짜 미정 1종')).toBeInTheDocument();
  });

  it('날짜 있는 지급이 0건이고 미정만 있으면 "지급이 없다"고 말하지 않는다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=O'] });

    expect(
      within(agenda()).getByText('날짜를 추정할 수 있는 지급이 없습니다. "날짜 미정" 탭을 확인하세요.')
    ).toBeInTheDocument();

    await openUndatedTab(user);
    expect(within(undatedRegion()).getByText('O')).toBeInTheDocument();
    expect(screen.getByText('2026년 7월 지급 예정 0건 · 날짜 미정 1종')).toBeInTheDocument();
    expect(screen.queryByText('2026년 7월에는 선택한 종목의 지급 예정이 없습니다.')).not.toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 셀 오버플로', () => {
  it('한 날짜에 표시 상한을 넘게 몰리면 나머지는 +N 으로 접고 원본은 아젠다에 남긴다', async () => {
    // DES·DGRW·DHS·DLN 은 2026년 7월 28일로 예상일이 같다(실데이터).
    const crowded = ['DES', 'DGRW', 'DHS', 'DLN'];
    await renderCalendar({ entries: [`/dividend/calendar?tickers=${crowded.join(',')}`] });

    const cell = dayCell(calendarTable('2026년 7월'), '2026-07-28');

    expect(within(cell).getAllByRole('listitem')).toHaveLength(MAX_DAY_CHIPS);
    expect(within(cell).getByText(`+${crowded.length - MAX_DAY_CHIPS}`)).toBeInTheDocument();
    expect(within(cell).getByLabelText(`지급 예정 ${crowded.length}종`)).toBeInTheDocument();

    // 표에서 잘린 정보의 완전한 원본은 항상 아젠다에 있다.
    expect(agendaDayTickers('2026-07-28')).toEqual([...crowded].sort());
    expect(screen.getByText('2026년 7월 지급 예정 4건 · 날짜 미정 0종')).toBeInTheDocument();
  });
});

describe('배당 지급 캘린더 — 주소 동기화(공유 링크)', () => {
  it('선택을 바꿔도 다른 쿼리 파라미터를 보존하고 히스토리를 쌓지 않는다(replace)', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

    await openPicker(user);
    await user.click(optionButton('KO'));

    await waitFor(() => {
      expect(searchParamsOf().get('tickers')).toBe('SCHD,KO');
    });
    // 캘린더가 남의 파라미터를 지우면 공유 링크·유입 추적이 조용히 깨진다.
    expect(searchParamsOf().get('foo')).toBe('bar');
    expect(screen.getByTestId('probe-nav-type')).toHaveTextContent('REPLACE');
  });

  it('선택 후 뒤로 가면 캘린더의 이전 상태가 아니라 직전 화면으로 돌아간다', async () => {
    const { user } = await renderCalendar({ entries: ['/before', '/dividend/calendar'], initialIndex: 1 });

    await openPicker(user);
    await user.click(optionButton('SCHD'));
    await waitFor(() => {
      expect(searchParamsOf().get('tickers')).toBe('SCHD');
    });
    await user.click(optionButton('KO'));
    await waitFor(() => {
      expect(searchParamsOf().get('tickers')).toBe('SCHD,KO');
    });

    await user.click(screen.getByRole('button', { name: '테스트 뒤로 가기' }));

    expect(screen.getByTestId('probe-pathname')).toHaveTextContent('/before');
    expect(screen.getByText('이전 화면')).toBeInTheDocument();
  });

  it('주소의 티커를 대문자·중복 제거한 표준형으로 되돌려 쓴다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=schd,jepi,SCHD'] });

    expect(screen.getByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(searchParamsOf().get('tickers')).toBe('SCHD,JEPI');
    });
  });

  it('선택을 비우면 주소에서 tickers 파라미터가 사라진다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: '선택 비우기' }));

    await waitFor(() => {
      expect(searchParamsOf().has('tickers')).toBe(false);
    });
    expect(searchParamsOf().get('foo')).toBe('bar');
    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');
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

describe('배당 지급 캘린더 — 지급월 데이터가 없는 종목', () => {
  it('클릭도 Enter 도 선택으로 이어지지 않고 이유를 배지로 남긴다', async () => {
    const { user } = await renderCalendar();

    await openPicker(user);
    const unavailable = optionButton('QQQ');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    // 사유는 항목 안 "데이터 준비 중" 배지가 말한다(별도 안내문은 삭제 — 사용자 결정 2026-07-25).
    expect(unavailable).toHaveTextContent('데이터 준비 중');

    await user.click(unavailable);
    unavailable.focus();
    await user.keyboard('{Enter}');

    expect(optionButton('QQQ')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '종목 선택 열기' })).toBeInTheDocument();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    expect(searchParamsOf().has('tickers')).toBe(false);
  });

  it('데이터 없는 종목만 선택되면 빈 달력과 함께 경고를 보여준다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=QQQ,ANET'] });

    expect(
      screen.getByText(
        '선택한 종목은 아직 지급월 데이터가 없습니다. 데이터가 있는 종목을 추가하면 캘린더가 채워집니다.'
      )
    ).toBeInTheDocument();
    // 달력 표는 화면의 뼈대라 항상 남는다(사용자 결정 2026-07-25). 다만 표는 아무 주장도 하지 않는다 —
    // "이 종목들은 이 달에 안 준다"가 아니라 "데이터가 없다"를 경고가 말하고, 요약·상세 목록은 붙지 않는다.
    const july = screen.getByRole('table', { name: '2026년 7월' });
    expect(july).toBeInTheDocument();
    expect(within(july).queryByText('QQQ')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '지급 일정 목록' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();
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
    expect(screen.getByRole('status')).toHaveTextContent('선택 1종, 이 달 지급 예정 1건.');

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));
    expect(screen.getByRole('status')).toHaveTextContent('2026년 8월. 지급 예정 1건, 날짜 미정 0종.');

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
        const day = paysIn(ticker, month) ? payoutDayOf(ticker, month) : null;
        if (day === null) continue;
        expectedByDay.set(day, [...(expectedByDay.get(day) ?? []), ticker].sort());
      }

      expect(expectedByDay.size).toBeGreaterThan(0);
      for (const [day, tickers] of expectedByDay) {
        const iso = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        expect(agendaDayTickers(iso)).toEqual(tickers);
      }

      // 스냅샷에 없는 날짜에는 아무것도 놓이지 않는다(달력이 날짜를 지어내지 않는다).
      const renderedDays = within(agenda())
        .getAllByRole('listitem')
        .filter((item) => item.querySelector('time') !== null);
      expect(renderedDays).toHaveLength(expectedByDay.size);
    }
  });

  it('입금 이력이 있는 종목만 "실측"이고 배당락 기반은 "추정"으로 남는다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI,O'] });

    // 데이터의 '형태'가 아니라 화면의 '어법'을 고정한다 — 스냅샷 재갱신으로 필드 표기가 바뀌어도
    // 배당락 기반(non-'pay')이 "실측"으로 승격되지만 않으면 계약은 지켜진 것이다.
    expect(MARKET_DATA.entries.JEPI?.payoutMonthsSource).toBe('pay');
    expect(MARKET_DATA.entries.O?.payoutMonthsSource).not.toBe('pay');

    const jepiDay = agendaDay('2026-07-04');
    expect(jepiDay).not.toBeNull();
    expect(within(jepiDay as HTMLElement).getByText('실측')).toBeInTheDocument();

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
