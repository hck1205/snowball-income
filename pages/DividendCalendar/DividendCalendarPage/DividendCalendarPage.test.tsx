import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DividendCalendarPage from './DividendCalendarPage';

/**
 * 저장소 읽기만 갈아끼운다(**부분 목** — 조인·필터·파싱은 실물 그대로여야 회귀가 잡힌다).
 * 기본값은 `null`(저장 이력 없음)이라 목을 지정하지 않은 케이스는 jsdom 실제 동작과 같다.
 */
const { storageMock } = vi.hoisted(() => ({
  storageMock: { read: null as null | (() => Promise<string[] | null>) }
}));

vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>();
  return {
    ...actual,
    readCalendarSelection: () => (storageMock.read ? storageMock.read() : Promise.resolve(null))
  };
});

afterEach(() => {
  storageMock.read = null;
});

/** 주소 동기화(공유 링크 성립)를 눈으로 확인할 수 있게 현재 쿼리스트링을 노출한다. */
function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location-search">{location.search}</p>;
}

/**
 * 2026-07-25(토). **오늘을 주입**하지 않으면 "오늘" 배지·과거 표시 단정이 실제 날짜에 매여
 * 이 스위트가 매일 다른 결과를 낸다. 2026년 7월 실데이터: JEPI 4일, KO 2일, O·SCHD 일자 미정.
 */
const TODAY = new Date(2026, 6, 25);

/**
 * jsdom에는 indexedDB가 없어 `readCalendarSelection()`이 곧바로 null(=저장 이력 없음)로 수렴한다 —
 * 목 없이도 "저장 이력 없는 첫 방문"이 정상 경로다.
 */
const renderCalendar = async (initialEntry = '/dividend/calendar', today: Date = TODAY) => {
  const view = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DividendCalendarPage today={today} />
      <LocationProbe />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 2, name: /년 \d+월$/ });
  return view;
};

/**
 * 결과 목록의 항목 버튼. 접근명은 "티커 + 한글명 + 근거 배지"라 배지 어휘로 끝나는 것을 앵커로 쓴다 —
 * 선택 칩의 제거 버튼(`SCHD 선택 해제`)과 티커 접두가 같아 접두만으로는 두 개가 잡힌다.
 */
const findOptionButton = (ticker: string) =>
  screen.getByRole('button', { name: new RegExp(`^${ticker} .*(실측|추정|데이터 준비 중)$`) });

/**
 * 종목 선택은 **우측 드로어** 안에 있다(2026-07-25 개편) — 닫혀 있으면 `visibility: hidden` 이라
 * 접근성 트리에 없다. 검색·목록·선택 칩을 만지는 시나리오는 먼저 이 문을 연다.
 */
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /종목 선택 열기/ }));
};

/** 상세는 탭이라 한 번에 하나만 그려진다 — "날짜 미정"은 눌러야 나온다(기본 탭은 지급 일정 목록). */
const openUndatedTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^날짜 미정/ }));
};

/** 달력 표. 종목별 12개월 표(범례)도 `<table>`이라 월 제목으로 이름을 앵커링한다. */
const getCalendarTable = (label: string) => screen.getByRole('table', { name: label });

const getAgenda = () => screen.getByRole('region', { name: '지급 일정 목록' });

/**
 * 날짜 칸을 `<time datetime>` 으로 집는다 — 숫자 텍스트("4")는 이월 칸(8월 4일)과 겹쳐 두 개가 잡힌다.
 * datetime 은 스펙이 요구한 마크업 계약이라 구현 세부가 아니다.
 */
const getDayCell = (table: HTMLElement, isoDate: string): HTMLElement => {
  const time = within(table).getByText(
    (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === isoDate
  );
  const cell = time.closest('td');
  if (!cell) throw new Error(`${isoDate} 칸을 찾지 못했습니다.`);
  return cell;
};

describe('DividendCalendarPage — v2 월간 달력', () => {
  it('첫 방문에는 빈 선택 안내와 라이브 리전을 함께 렌더한다', async () => {
    await renderCalendar();

    expect(await screen.findByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    // 라이브 리전은 빈 선택 상태에서도 접근성 트리에 남아 있어야 이후 변경이 낭독된다.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '배당 지급 캘린더' })).toBeInTheDocument();
    // 달력 표는 선택이 없어도 항상 그린다(사용자 결정 2026-07-25) — 화면의 뼈대다.
    // "지급이 없다"는 주장은 표가 아니라 빈 상태 안내가 하고, 칸에는 아무것도 놓이지 않는다.
    const table = screen.getByRole('table', { name: '2026년 7월' });
    expect(table).toBeInTheDocument();
    expect(within(table).queryByText('JEPI')).not.toBeInTheDocument();
  });

  it('검색어로 결과 목록을 좁힌다', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    await openPicker(user);
    await user.type(screen.getByLabelText('종목 검색'), 'SCHD');

    expect(findOptionButton('SCHD')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^JEPI\s/ })).not.toBeInTheDocument();
  });

  it('예상 지급일이 있는 종목은 날짜 칸에, 없는 종목은 "날짜 미정"에 놓인다', async () => {
    const user = userEvent.setup();
    // JEPI = 2026-07-04 예상, O = 7월 지급이지만 일자 데이터 없음.
    await renderCalendar('/dividend/calendar?tickers=JEPI,O');

    const table = getCalendarTable('2026년 7월');
    expect(within(getDayCell(table, '2026-07-04')).getByText('JEPI')).toBeInTheDocument();

    // 날짜를 모르는 종목은 어느 칸에도 놓이지 않는다(임의 날짜로 채우지 않는다).
    expect(within(table).queryByText('O')).not.toBeInTheDocument();

    // 잘린 정보의 원본은 항상 아젠다 목록에 있다(기본 탭).
    expect(within(getAgenda()).getByText(/7월 4일/)).toBeInTheDocument();

    await openUndatedTab(user);
    const undated = screen.getByRole('region', { name: /날짜 미정/ });
    expect(within(undated).getByText('O')).toBeInTheDocument();
  });

  it('오늘 칸은 aria-current="date" 와 "오늘" 배지를 정확히 하나씩만 갖는다', async () => {
    await renderCalendar('/dividend/calendar?tickers=JEPI');

    const table = getCalendarTable('2026년 7월');
    const todayCells = within(table)
      .getAllByRole('cell')
      .filter((cell) => cell.getAttribute('aria-current') === 'date');

    expect(todayCells).toHaveLength(1);
    expect(within(todayCells[0]).getByText('25')).toBeInTheDocument();
    expect(screen.getAllByText('오늘')).toHaveLength(1);
  });

  it('달력은 table 이고 role="grid" 를 선언하지 않는다', async () => {
    await renderCalendar('/dividend/calendar?tickers=JEPI');

    expect(getCalendarTable('2026년 7월')).toBeInTheDocument();
    // grid 롤은 화살표 키 이동 계약을 동반한다 — 구현하지 않을 계약은 선언하지 않는다.
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
  });

  it('이전/다음으로 달을 옮기고 "이번 달"로 돌아온다', async () => {
    const user = userEvent.setup();
    await renderCalendar('/dividend/calendar?tickers=ABBV');

    const todayButton = screen.getByRole('button', { name: /이번 달로 돌아가기/ });
    expect(todayButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));

    expect(await screen.findByRole('heading', { name: '2026년 8월', level: 2 })).toBeInTheDocument();
    expect(todayButton).toBeEnabled();
    // ABBV = 8월 14일 예상.
    expect(within(getAgenda()).getByText(/8월 14일/)).toBeInTheDocument();
    // 다른 달을 보고 있으면 "오늘" 배지는 사라진다.
    expect(screen.queryByText('오늘')).not.toBeInTheDocument();

    await user.click(todayButton);
    expect(await screen.findByRole('heading', { name: '2026년 7월', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /이번 달로 돌아가기/ })).toBeDisabled();
  });

  it('12월에서 다음 달을 누르면 연도를 넘긴다', async () => {
    const user = userEvent.setup();
    await renderCalendar('/dividend/calendar?tickers=JEPI', new Date(2026, 11, 15));

    await screen.findByRole('heading', { name: '2026년 12월', level: 2 });
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2027년 1월' }));

    expect(await screen.findByRole('heading', { name: '2027년 1월', level: 2 })).toBeInTheDocument();
    expect(within(getAgenda()).getByText(/1월 3일/)).toBeInTheDocument();
  });

  it('지급월 데이터가 없는 종목은 선택되지 않고 "데이터 준비 중"으로 남는다', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    await openPicker(user);
    const unavailable = findOptionButton('QQQ');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    expect(unavailable).toHaveTextContent('데이터 준비 중');

    await user.click(unavailable);

    expect(screen.getByRole('button', { name: '종목 선택 열기' })).toBeInTheDocument();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
  });

  it('선택이 바뀌면 주소의 ?tickers= 가 따라 바뀐다 (주소 복사 = 공유)', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    await openPicker(user);
    await user.click(findOptionButton('SCHD'));
    expect(screen.getByTestId('location-search')).toHaveTextContent('tickers=SCHD');

    await user.click(screen.getByRole('button', { name: '선택 비우기' }));
    expect(screen.getByTestId('location-search').textContent).toBe('');
  });

  it('저장값이 늦게 도착해도 로딩 중에 고른 종목을 덮지 않는다', async () => {
    const user = userEvent.setup();
    // 클로저 대입 변수를 옵셔널 호출하면 tsc가 never로 좁힌다 — 속성 홀더로 감싼다.
    const deferred: { resolve: (value: string[] | null) => void } = { resolve: () => undefined };
    const pending = new Promise<string[] | null>((resolve) => {
      deferred.resolve = resolve;
    });
    storageMock.read = () => pending;

    await renderCalendar();

    // 로딩 중에도 목록은 조작 가능하다(유니버스는 정적 상수라 IndexedDB를 기다릴 이유가 없다).
    await openPicker(user);
    await user.click(findOptionButton('SCHD'));
    expect(findOptionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');

    // 뒤늦게 도착한 저장값(JEPI)이 방금 누른 선택을 되돌리면 안 된다.
    await act(async () => {
      deferred.resolve(['JEPI']);
      await pending;
    });

    expect(await screen.findByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();
    expect(findOptionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');
    expect(findOptionButton('JEPI')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('아직 선택한 종목이 없습니다')).not.toBeInTheDocument();
  });

  it('선택을 모두 비운 뒤에도 월 이동이 라이브 리전에 낭독된다', async () => {
    const user = userEvent.setup();
    await renderCalendar('/dividend/calendar?tickers=JEPI');

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: '선택 비우기' }));
    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');

    await user.click(screen.getByRole('button', { name: '종목 선택 닫기' }));
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));

    // 비우기 안내가 눌러앉으면 그 뒤의 월 이동이 영영 낭독되지 않는다 — 화면은 바뀌었는데 소리는 안 바뀐다.
    expect(screen.getByRole('status')).toHaveTextContent('2026년 8월. 지급 예정 0건, 날짜 미정 0종.');
  });

  it('주소에 모르는 심볼이 있으면 제외 사실을 화면에 알린다', async () => {
    await renderCalendar('/dividend/calendar?tickers=JEPI,NOTREAL');

    expect(await screen.findByText(/목록에 없어 제외했습니다: NOTREAL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();
  });
});
