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
 * jsdom에는 indexedDB가 없어 `readCalendarSelection()`이 곧바로 null(=저장 이력 없음)로 수렴한다 —
 * 그래서 목 없이도 "저장 이력 없는 첫 방문"이 정상 경로다. 로딩이 끝난 시점은 빈 상태 카드로 잡는다.
 */
const renderCalendar = async (initialEntry = '/dividend/calendar', currentMonth?: number) => {
  const view = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DividendCalendarPage currentMonth={currentMonth} />
      <LocationProbe />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { name: '연간 지급 월' });
  return view;
};

/**
 * 결과 목록의 항목 버튼. 접근명은 "티커 + 한글명 + 근거 배지"라 배지 어휘로 끝나는 것을 앵커로 쓴다 —
 * 선택 칩의 제거 버튼(`SCHD 선택 해제`)과 티커 접두가 같아 접두만으로는 두 개가 잡힌다.
 */
const findOptionButton = (ticker: string) =>
  screen.getByRole('button', { name: new RegExp(`^${ticker} .*(실측|추정|데이터 준비 중)$`) });

describe('DividendCalendarPage', () => {
  it('첫 방문에는 빈 선택 안내와 라이브 리전을 함께 렌더한다', async () => {
    await renderCalendar();

    expect(await screen.findByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    // 라이브 리전은 빈 선택 상태에서도 접근성 트리에 남아 있어야 이후 변경이 낭독된다.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '배당 지급 월 캘린더' })).toBeInTheDocument();
  });

  it('검색어로 결과 목록을 좁힌다', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    await user.type(screen.getByLabelText('종목 검색'), 'SCHD');

    expect(findOptionButton('SCHD')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^JEPI\s/ })).not.toBeInTheDocument();
  });

  it('종목을 고르면 달력에 지급 월이 채워지고 다시 누르면 해제된다', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    await user.click(findOptionButton('SCHD'));

    expect(findOptionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');
    // SCHD는 3·6·9·12월 지급 — 12칸 중 4칸에 칩이 놓인다.
    const cells = screen.getAllByRole('listitem').filter((item) => item.textContent?.includes('종목 지급'));
    expect(cells).toHaveLength(4);
    expect(within(cells[0]).getByText('3월')).toBeInTheDocument();

    await user.click(findOptionButton('SCHD'));
    expect(await screen.findByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
  });

  it('지급월 데이터가 없는 종목은 선택되지 않고 "데이터 준비 중"으로 남는다', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

    const unavailable = findOptionButton('QQQ');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    expect(unavailable).toHaveTextContent('데이터 준비 중');

    await user.click(unavailable);

    expect(screen.getByText('선택 0종')).toBeInTheDocument();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
  });

  it('주소의 ?tickers= 를 초기 선택으로 쓰고, 이번 달 배지는 정확히 하나만 붙는다', async () => {
    await renderCalendar('/dividend/calendar?tickers=SCHD,JEPI', 5);

    expect(await screen.findByText('선택 2종')).toBeInTheDocument();
    expect(screen.getAllByText('이번 달')).toHaveLength(1);
    // JEPI가 매달 지급이라 12개월 전부 커버된다.
    expect(screen.getByText('12개월 모두 지급되는 조합입니다.')).toBeInTheDocument();
  });

  it('선택이 바뀌면 주소의 ?tickers= 가 따라 바뀐다 (주소 복사 = 공유)', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await screen.findByText('아직 선택한 종목이 없습니다');

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
    await user.click(findOptionButton('SCHD'));
    expect(findOptionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');

    // 뒤늦게 도착한 저장값(JEPI)이 방금 누른 선택을 되돌리면 안 된다.
    await act(async () => {
      deferred.resolve(['JEPI']);
      await pending;
    });

    expect(await screen.findByText('선택 1종')).toBeInTheDocument();
    expect(findOptionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');
    expect(findOptionButton('JEPI')).toHaveAttribute('aria-pressed', 'false');
    // 로딩 해제 자체는 정상 진행돼 빈 상태 카드로 되돌아가지 않는다.
    expect(screen.queryByText('아직 선택한 종목이 없습니다')).not.toBeInTheDocument();
  });

  it('주소에 모르는 심볼이 있으면 제외 사실을 화면에 알린다', async () => {
    await renderCalendar('/dividend/calendar?tickers=SCHD,NOTREAL');

    expect(await screen.findByText(/목록에 없어 제외했습니다: NOTREAL/)).toBeInTheDocument();
    expect(screen.getByText('선택 1종')).toBeInTheDocument();
  });
});
