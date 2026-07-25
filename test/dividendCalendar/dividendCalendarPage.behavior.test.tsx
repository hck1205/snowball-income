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
import { routes } from '@/router/routes';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * `/dividend/calendar` 사용자 행동 교차 검증.
 *
 * 페이지 colocated 테스트(`pages/DividendCalendar/.../DividendCalendarPage.test.tsx`)가 기본 루프를
 * 확인한다면, 여기서는 **깨지면 사용자 자산이 상하는 계약**을 사용자 조작으로 재현한다:
 * 주소 동기화(replace·다른 파라미터 보존), 포커스 이동, 데이터 없는 종목, 라이브 리전,
 * 그리고 화면의 지급월이 실제 스냅샷과 같은지.
 *
 * jsdom 에는 `indexedDB` 가 없어 이 파일의 모든 렌더는 "저장 이력 없는 첫 방문"이다(실경로).
 * 저장 우선순위·저장 호출 여부는 `dividendCalendarStorage.behavior.test.tsx` 가 목으로 다룬다.
 */

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
  currentMonth?: number;
};

const renderCalendar = async ({ entries = ['/dividend/calendar'], initialIndex, currentMonth }: RenderOptions = {}) => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex ?? entries.length - 1}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage currentMonth={currentMonth} />} />
        <Route path="/before" element={<p>이전 화면</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 2, name: '연간 지급 월' });
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

/** 달력 한 칸. 월 라벨이 `h3` 라 월 이름으로 셀을 특정할 수 있다. */
const monthCell = (month: number) => {
  const label = screen.getByRole('heading', { level: 3, name: `${month}월` });
  const cell = label.closest('li');
  if (cell === null) throw new Error(`${month}월 셀을 찾지 못했습니다.`);
  return cell;
};

/** 그 달 셀에 놓인 티커들(근거 배지 텍스트는 떼어낸다). */
const cellTickers = (month: number): string[] =>
  within(monthCell(month))
    .queryAllByRole('listitem')
    .map((item) => (item.textContent ?? '').replace(/(실측|추정)$/, '').trim());

const searchParamsOf = (): URLSearchParams =>
  new URLSearchParams(screen.getByTestId('probe-search').textContent ?? '');

const payoutMonthsOf = (ticker: string): number[] => MARKET_DATA.entries[ticker]?.payoutMonths ?? [];

describe('배당 지급 월 캘린더 — 기본 루프', () => {
  it('검색해서 고르면 달력·요약·라이브 리전이 함께 갱신되고, 고른 항목은 목록에 남는다', async () => {
    const { user } = await renderCalendar();

    // 소문자로 쳐도 찾아진다(대소문자 무시 계약).
    await user.type(screen.getByLabelText('종목 검색'), 'schd');
    expect(screen.getByText('1종목')).toBeInTheDocument();

    await user.click(optionButton('SCHD'));

    // 선택해도 결과 목록에서 사라지지 않는다 — 사라지면 실수한 선택을 되돌릴 수 없다.
    expect(optionButton('SCHD')).toHaveAttribute('aria-pressed', 'true');
    expect(cellTickers(3)).toEqual(['SCHD']);
    expect(cellTickers(12)).toEqual(['SCHD']);
    expect(within(monthCell(1)).getByText('지급 없음')).toBeInTheDocument();
    expect(screen.getByText('선택 1종 · 지급 있는 달 4개월')).toBeInTheDocument();
    expect(screen.getByText('지급이 없는 달: 1월, 2월, 4월, 5월, 7월, 8월, 10월, 11월')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('선택 1종, 지급 있는 달 4개월.');
  });

  it('검색 결과가 없으면 이유를 말하고, Escape 로 검색어만 지운다(선택·포커스는 그대로)', async () => {
    const { user } = await renderCalendar();
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
    await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD'] });

    expect(screen.getAllByRole('heading', { level: 1, name: '배당 지급 월 캘린더' })).toHaveLength(1);
    expect(screen.getAllByLabelText('종목 검색')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 3, name: '1월' })).toHaveLength(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});

describe('배당 지급 월 캘린더 — 이번 달 표시', () => {
  it('주입한 이번 달에만 배지가 붙는다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI'], currentMonth: 7 });

    expect(screen.getAllByText('이번 달')).toHaveLength(1);
    expect(within(monthCell(7)).getByText('이번 달')).toBeInTheDocument();
  });

  it('주입하지 않으면 로컬 시간의 현재 달을 쓴다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=JEPI'] });

    const currentMonth = new Date().getMonth() + 1;
    expect(screen.getAllByText('이번 달')).toHaveLength(1);
    expect(within(monthCell(currentMonth)).getByText('이번 달')).toBeInTheDocument();
  });
});

describe('배당 지급 월 캘린더 — 주소 동기화(공유 링크)', () => {
  it('선택을 바꿔도 다른 쿼리 파라미터를 보존하고 히스토리를 쌓지 않는다(replace)', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

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

    expect(screen.getByText('선택 2종')).toBeInTheDocument();
    await waitFor(() => {
      expect(searchParamsOf().get('tickers')).toBe('SCHD,JEPI');
    });
  });

  it('선택을 비우면 주소에서 tickers 파라미터가 사라진다', async () => {
    const { user } = await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD&foo=bar'] });

    await user.click(screen.getByRole('button', { name: '선택 비우기' }));

    await waitFor(() => {
      expect(searchParamsOf().has('tickers')).toBe(false);
    });
    expect(searchParamsOf().get('foo')).toBe('bar');
    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');
  });
});

describe('배당 지급 월 캘린더 — 포커스 계약', () => {
  it('선택 칩의 ×로 해제하면 포커스가 검색 입력으로 돌아온다', async () => {
    const { user } = await renderCalendar();

    await user.click(optionButton('SCHD'));
    await user.click(screen.getByRole('button', { name: 'SCHD 선택 해제' }));

    // 사라진 버튼에 포커스가 남으면 키보드 사용자는 body 로 떨어져 위치를 잃는다.
    expect(screen.getByLabelText('종목 검색')).toHaveFocus();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
  });
});

describe('배당 지급 월 캘린더 — 지급월 데이터가 없는 종목', () => {
  it('클릭도 Enter 도 선택으로 이어지지 않고 이유를 텍스트로 남긴다', async () => {
    const { user } = await renderCalendar();

    const unavailable = optionButton('QQQ');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    expect(unavailable).toHaveTextContent('데이터 준비 중');
    expect(screen.getAllByText('지급 이력 데이터가 아직 없어 캘린더에 넣을 수 없습니다.').length).toBeGreaterThan(0);

    await user.click(unavailable);
    unavailable.focus();
    await user.keyboard('{Enter}');

    expect(optionButton('QQQ')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('선택 0종')).toBeInTheDocument();
    expect(screen.getByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    expect(searchParamsOf().has('tickers')).toBe(false);
  });

  it('데이터 없는 종목만 선택되면 빈 12칸 대신 경고를 보여준다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=QQQ,ANET'] });

    expect(
      screen.getByText('선택한 종목은 아직 지급월 데이터가 없습니다. 데이터가 있는 종목을 추가하면 캘린더가 채워집니다.')
    ).toBeInTheDocument();
    // 12칸을 그려 놓고 전부 "지급 없음"이라 쓰면 "이 종목들은 배당을 안 준다"는 거짓말이 된다.
    expect(screen.queryByRole('heading', { level: 3, name: '1월' })).not.toBeInTheDocument();
    expect(screen.queryByText('지급 없음')).not.toBeInTheDocument();
    expect(screen.queryByText('종목별 지급 월 표로 보기')).not.toBeInTheDocument();
    expect(screen.getByText('선택 2종 · 지급 있는 달 0개월')).toBeInTheDocument();
  });
});

describe('배당 지급 월 캘린더 — 라이브 리전', () => {
  it('빈 선택에서도 마운트돼 있고 선택 변화에 따라 텍스트만 바뀐다', async () => {
    const { user } = await renderCalendar();

    const live = screen.getByRole('status');
    expect(live).toBeInTheDocument();
    expect(live).toHaveTextContent('');

    await user.click(optionButton('SCHD'));
    expect(screen.getByRole('status')).toHaveTextContent('선택 1종, 지급 있는 달 4개월.');

    await user.click(optionButton('JEPI'));
    expect(screen.getByRole('status')).toHaveTextContent('선택 2종, 지급 있는 달 12개월.');

    await user.click(screen.getByRole('button', { name: '선택 비우기' }));
    expect(screen.getByRole('status')).toHaveTextContent('선택을 모두 해제했습니다.');
  });
});

describe('배당 지급 월 캘린더 — 데이터 사실성', () => {
  const SPOT_CHECK = ['SCHD', 'ABBV', 'JEPI', 'KO'];

  it('셀에 놓인 종목이 스냅샷의 payoutMonths 와 정확히 일치한다', async () => {
    await renderCalendar({ entries: [`/dividend/calendar?tickers=${SPOT_CHECK.join(',')}`] });

    for (let month = 1; month <= 12; month += 1) {
      const expected = SPOT_CHECK.filter((ticker) => payoutMonthsOf(ticker).includes(month)).sort();

      expect(cellTickers(month)).toEqual(expected);
      expect(within(monthCell(month)).getByText(`${expected.length}종목 지급`)).toBeInTheDocument();
    }
  });

  it('입금 이력이 있는 종목만 "실측"이고 배당락 기반은 "추정"으로 남는다', async () => {
    await renderCalendar({ entries: ['/dividend/calendar?tickers=SCHD,ABBV'] });

    // ABBV 는 payoutMonthsSource: 'pay'(입금 이력 관측), SCHD 는 필드 자체가 없어 배당락 기반이다.
    expect(MARKET_DATA.entries.ABBV?.payoutMonthsSource).toBe('pay');
    expect(MARKET_DATA.entries.SCHD?.payoutMonthsSource).toBeUndefined();

    expect(within(monthCell(2)).getByText('ABBV')).toBeInTheDocument();
    expect(within(monthCell(2)).getByText('실측')).toBeInTheDocument();
    expect(within(monthCell(3)).getByText('SCHD')).toBeInTheDocument();
    expect(within(monthCell(3)).getByText('추정')).toBeInTheDocument();
  });
});

describe('배당 지급 월 캘린더 — 라우터 배선', () => {
  it('/dividend/calendar 로 들어오면 캘린더 화면이 뜬다', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/dividend/calendar'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: '배당 지급 월 캘린더' })).toBeInTheDocument();
  });
});
