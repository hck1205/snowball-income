import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';
import { readCalendarSelection, writeCalendarSelection } from '@/pages/DividendCalendar/utils';

/**
 * 초기 선택의 **우선순위**와 **저장 시점** 계약.
 *
 * jsdom 에는 `indexedDB` 가 없어 실경로에서는 `readCalendarSelection()` 이 항상 null 로 수렴한다 —
 * "저장값 복원"을 재현하려면 저장 함수만 목으로 바꿔야 한다. 배럴을 통째로 대체하면 목에 없는
 * export(`getCalendarUniverse` 등)가 undefined 가 되어 화면이 조용히 깨지므로 **부분 목**을 쓴다.
 */
vi.mock('@/pages/DividendCalendar/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/DividendCalendar/utils')>();

  return {
    ...actual,
    readCalendarSelection: vi.fn(),
    writeCalendarSelection: vi.fn()
  };
});

const mockedRead = vi.mocked(readCalendarSelection);
const mockedWrite = vi.mocked(writeCalendarSelection);

/** 2026-07-25(토). '오늘'을 주입하지 않으면 달력 단정이 실제 날짜에 매여 매일 다른 결과를 낸다. */
const TODAY = new Date(2026, 6, 25);

const renderCalendar = (entry = '/dividend/calendar') => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage today={TODAY} />} />
      </Routes>
    </MemoryRouter>
  );

  return { user };
};

const optionButton = (ticker: string) =>
  screen.getByRole('button', { name: new RegExp(`^${ticker} .*(실측|추정|데이터 준비 중)$`) });

/**
 * 종목 선택은 **우측 드로어** 안에 있다(2026-07-25 개편). 닫혀 있으면 `visibility: hidden` 이라
 * 접근성 트리에서 빠지므로, 목록·선택 칩을 만지려면 먼저 연다.
 */
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /종목 선택 열기/ }));
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedRead.mockResolvedValue(null);
  mockedWrite.mockResolvedValue(undefined);
});

describe('초기 선택 우선순위 — 저장값', () => {
  it('주소에 티커가 없으면 저장된 선택을 복원한다', async () => {
    mockedRead.mockResolvedValue(['JEPI', 'KO']);
    const { user } = renderCalendar();

    expect(await screen.findByRole('button', { name: /현재 2종 선택됨/ })).toBeInTheDocument();

    await openPicker(user);
    expect(screen.getByRole('button', { name: 'JEPI 선택 해제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'KO 선택 해제' })).toBeInTheDocument();
    // 복원은 사용자의 조작이 아니다 — 되쓰기를 하면 updatedAt 만 흔들린다.
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('저장값에 목록에서 사라진 티커가 있으면 조용히 걸러 낸다', async () => {
    mockedRead.mockResolvedValue(['SCHD', 'GHOSTTICKER']);
    const { user } = renderCalendar();

    expect(await screen.findByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();

    await openPicker(user);
    expect(screen.getByRole('button', { name: 'SCHD 선택 해제' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /GHOSTTICKER/ })).not.toBeInTheDocument();
  });

  it('저장 이력이 없으면 빈 선택으로 시작한다', async () => {
    renderCalendar();

    expect(await screen.findByText('아직 선택한 종목이 없습니다')).toBeInTheDocument();
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('불러오는 동안에는 골격만 보이고(접근성 트리에서는 감춰짐) 라이브 리전이 상태를 말한다', async () => {
    let resolveRead: (value: string[] | null) => void = () => undefined;
    mockedRead.mockImplementation(
      () =>
        new Promise<string[] | null>((resolve) => {
          resolveRead = resolve;
        })
    );

    renderCalendar();

    expect(await screen.findByRole('status')).toHaveTextContent('저장된 종목 선택을 불러오는 중입니다.');
    expect(screen.queryByText('아직 선택한 종목이 없습니다')).not.toBeInTheDocument();
    // 툴바는 로딩 중에도 진짜 값이라 월 제목이 보인다.
    expect(screen.getByRole('heading', { level: 2, name: '2026년 7월' })).toBeInTheDocument();
    // 골격 표는 aria-hidden 이라 스크린리더가 빈 42칸을 훑지 않는다(DOM 에는 있다).
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByText('일').length).toBeGreaterThan(0);

    await act(async () => {
      resolveRead(['KO']);
    });

    expect(await screen.findByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();
    // 로딩이 끝나면 진짜 달력 표가 접근성 트리에 등장한다.
    expect(screen.getByRole('table', { name: '2026년 7월' })).toBeInTheDocument();
  });

  /**
   * 회귀 테스트 — 실제로 났던 경합이다.
   *
   * 로딩 중에도 선택 패널은 조작 가능한데(스펙 §7), 초기 구현은 뒤늦게 도착한 저장값으로
   * 사용자가 방금 고른 선택을 덮어썼다(화면은 저장값, IndexedDB 에는 사용자가 고른 값이 남아
   * 둘이 어긋났다). 지금은 `userInteractedRef` 가드가 막는다 —
   * `pages/DividendCalendar/hooks/useCalendarSelection.ts:88`.
   */
  it('저장값이 늦게 도착해도 로딩 중 사용자가 고른 선택을 덮지 않는다', async () => {
    let resolveRead: (value: string[] | null) => void = () => undefined;
    mockedRead.mockImplementation(
      () =>
        new Promise<string[] | null>((resolve) => {
          resolveRead = resolve;
        })
    );

    const { user } = renderCalendar();
    await screen.findByRole('status');

    await openPicker(user);
    await user.click(optionButton('SCHD'));
    expect(screen.getByRole('button', { name: 'SCHD 선택 해제' })).toBeInTheDocument();

    await act(async () => {
      resolveRead(['KO']);
    });

    // 지금 누른 선택이 과거의 저장값을 이긴다. 로딩 표시만 걷힌다.
    expect(screen.getByRole('button', { name: 'SCHD 선택 해제' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'KO 선택 해제' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent('불러오는 중');
    // 저장에는 사용자가 고른 값만 기록됐다(화면과 저장이 어긋나지 않는다).
    expect(mockedWrite.mock.calls).toEqual([[['SCHD']]]);
  });
});

describe('초기 선택 우선순위 — 주소가 저장값을 이긴다', () => {
  it('주소의 선택을 그대로 보여주면서 방문자의 저장값을 덮어쓰지 않는다', async () => {
    mockedRead.mockResolvedValue(['JEPI']);
    const { user } = renderCalendar('/dividend/calendar?tickers=SCHD');

    expect(await screen.findByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();

    await openPicker(user);
    expect(screen.getByRole('button', { name: 'SCHD 선택 해제' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'JEPI 선택 해제' })).not.toBeInTheDocument();

    // 핵심 계약: 남의 공유 링크를 한 번 열었다고 내 저장이 바뀌면 안 된다.
    await waitFor(() => {
      expect(mockedWrite).not.toHaveBeenCalled();
    });
  });

  it('주소로 들어온 뒤 사용자가 직접 고치면 그때 저장한다', async () => {
    mockedRead.mockResolvedValue(['JEPI']);
    const { user } = renderCalendar('/dividend/calendar?tickers=SCHD');
    await screen.findByRole('button', { name: /현재 1종 선택됨/ });

    await openPicker(user);
    await user.click(optionButton('KO'));

    // 부분이 아니라 "지금 화면의 선택 전체"가 기록된다.
    expect(mockedWrite).toHaveBeenCalledTimes(1);
    expect(mockedWrite).toHaveBeenLastCalledWith(['SCHD', 'KO']);
  });

  it('선택 비우기는 빈 배열을 저장한다(다음 방문에 유령 선택이 되살아나지 않는다)', async () => {
    const { user } = renderCalendar('/dividend/calendar?tickers=SCHD,JEPI');
    await screen.findByRole('button', { name: /현재 2종 선택됨/ });

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: '선택 비우기' }));

    expect(mockedWrite).toHaveBeenCalledTimes(1);
    expect(mockedWrite).toHaveBeenLastCalledWith([]);
  });

  it('주소에 쓸 수 있는 티커가 하나도 없으면 저장값으로 돌아가고 제외 사실을 알린다', async () => {
    mockedRead.mockResolvedValue(['KO']);
    const { user } = renderCalendar('/dividend/calendar?tickers=GHOSTTICKER');

    expect(await screen.findByText(/목록에 없어 제외했습니다: GHOSTTICKER/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();

    await openPicker(user);
    expect(screen.getByRole('button', { name: 'KO 선택 해제' })).toBeInTheDocument();
    expect(mockedWrite).not.toHaveBeenCalled();
  });
});
