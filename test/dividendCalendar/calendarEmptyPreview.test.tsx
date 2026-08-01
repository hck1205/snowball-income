import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';
import {
  CALENDAR_QUICK_PICK_TICKERS,
  buildDividendCalendarViewModel
} from '@/pages/DividendCalendar/DividendCalendarPage';
import { getCalendarUniverse } from '@/pages/DividendCalendar/utils';
import { MARKET_DATA } from '@/shared/constants/marketData';

/**
 * **빈 상태의 예시 미리보기 계약**(리모델 §4.A-3, 2안 — 2026-07-31).
 *
 * 종목을 하나도 안 고른 화면에서 격자 42칸은 회색 빈 상자였다(1280에서 문서의 43%·뷰포트의 76%).
 * 이제 그 자리에 대표 종목의 **실제** 예상 지급일을 흐리게 깔아 "고르면 이런 게 보인다"를 보여준다.
 *
 * 여기서 잠그는 것은 두 가지고, 둘 다 **깨져도 화면은 멀쩡해 보인다** — 그래서 테스트가 필요하다:
 *
 * ① **예시는 표현 전용이다.** 선택 상태·저장소·주소 어디에도 새면 안 된다. 새면 사용자가 고르지도
 *    않은 4종목이 "내 선택"으로 저장되고, 다음 방문에 그대로 복원된다(사용자 자산 오염).
 * ② **예시임이 색이 아니라 텍스트로 전달돼야 한다.** 흐림(opacity·saturate)은 고대비 모드에서
 *    사라지고 스크린리더에는 애초에 도달하지 않는다 — 라벨을 지우면 예시가 실제 지급 예정으로 읽힌다.
 *
 * ⚠ 지급'일'은 리터럴로 적지 않는다(이 폴더 공통 규칙) — 크론이 스냅샷을 갱신하면 값이 움직인다.
 */

/** 2026-07-25(토). 오늘을 주입하지 않으면 '오늘' 칸 단정이 실제 날짜에 매인다. */
const TODAY = new Date(2026, 6, 25);

const pad2 = (value: number): string => String(value).padStart(2, '0');

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

/** 스냅샷이 기록한 "그 종목의 그 달 예상 지급일". 없으면 null. */
const snapshotPayDay = (ticker: string, year: number, month: number): number | null => {
  const entry = MARKET_DATA.entries[ticker];
  if (!entry?.payoutMonths?.includes(month)) return null;

  const raw = entry.estimatedPayDayByMonth?.[String(month) as '1'];
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return null;

  return Math.min(Math.trunc(raw), daysInMonth(year, month));
};

const renderCalendar = async () => {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={['/dividend/calendar']}>
      <DividendCalendarPage today={TODAY} />
    </MemoryRouter>
  );

  await screen.findByText('아직 선택한 종목이 없습니다');
  return { ...view, user };
};

const getPreviewTable = () => screen.getByRole('table', { name: /예시 달력, 실제 데이터가 아닙니다$/ });

describe('빈 상태 예시 미리보기 — ① 예시는 실제 선택을 오염시키지 않는다', () => {
  it('예시 종목이 격자에 깔려 있어도 선택은 0종 그대로다', async () => {
    const { user } = await renderCalendar();

    // 예시가 실제로 깔려 있다(이 전제가 깨지면 아래 단정들이 공허해진다).
    const previewTable = getPreviewTable();
    expect(within(previewTable).getAllByText(/^[A-Z]{1,5}$/).length).toBeGreaterThan(0);

    /*
     * 선택 개수를 말하는 곳은 두 군데다(2026-07-25 결정) — 필터 버튼 접근명과 라이브 리전.
     * 예시가 선택으로 샜다면 여기가 "현재 4종 선택됨"이 된다.
     */
    expect(screen.getByRole('button', { name: '종목 선택 열기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /현재 \d+종 선택됨/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('');

    // 드로어 안에서도 아무것도 눌려 있지 않고, 해제할 칩도 없다.
    await user.click(screen.getByRole('button', { name: '종목 선택 열기' }));
    for (const ticker of CALENDAR_QUICK_PICK_TICKERS) {
      expect(screen.getByRole('button', { name: new RegExp(`^${ticker} (?!선택 해제)`) })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    }
    expect(screen.queryByRole('button', { name: /선택 해제$/ })).not.toBeInTheDocument();
  });

  it('예시는 상세 목록(아젠다·범례)을 만들지 않는다', async () => {
    await renderCalendar();

    // 아젠다가 서면 "이 날 지급됩니다"라는 확정 서술이 된다 — 예시로 그 말을 하면 거짓말이다.
    expect(screen.queryByRole('region', { name: '지급 일정 목록' })).not.toBeInTheDocument();
    expect(screen.queryByText(/지급 예정 \d+건/)).not.toBeInTheDocument();
  });

  it('월을 옮겨도 라이브 리전은 예시 건수를 실제 건수로 낭독하지 않는다', async () => {
    const { user } = await renderCalendar();

    /*
     * 🔴 예시가 **실제 달(`month`)에 섞이면** 화면은 멀쩡한데 소리만 거짓말을 한다 — 월 이동 안내는
     * `month.datedCount` 를 그대로 읽기 때문이다("2026년 8월. 지급 예정 2건"). 고른 것이 없는데
     * 건수가 낭독되면 스크린리더 사용자는 자기 선택이 있다고 믿는다. 눈으로는 절대 안 보이는 회귀다.
     */
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 8월' }));

    expect(screen.getByRole('status')).toHaveTextContent('2026년 8월. 지급 예정 0건, 날짜 미정 0종.');
  });

  it('뷰모델: 예시 달은 실제 달과 완전히 분리된 필드다', () => {
    const universe = getCalendarUniverse();
    const empty = buildDividendCalendarViewModel({
      universe,
      keyword: '',
      selected: [],
      asOf: MARKET_DATA.asOf,
      year: 2026,
      month: 7,
      today: TODAY
    });

    // 실제 달은 비어 있다 — 예시가 여기 섞이면 요약 줄·아젠다·라이브 리전이 전부 거짓이 된다.
    expect(empty.selected).toEqual([]);
    expect(empty.selectedWithData).toBe(0);
    expect(empty.legendRows).toEqual([]);
    expect(empty.month.datedCount).toBe(0);
    // 예시 달에는 실제 스냅샷에서 파생한 지급일이 들어 있다.
    expect(empty.previewMonth?.datedCount ?? 0).toBeGreaterThan(0);

    // 선택이 하나라도 있으면 예시는 사라진다(실제 데이터를 밀어내지 않는다).
    const picked = buildDividendCalendarViewModel({
      universe,
      keyword: '',
      selected: ['JEPI'],
      asOf: MARKET_DATA.asOf,
      year: 2026,
      month: 7,
      today: TODAY
    });
    expect(picked.previewMonth).toBeNull();
  });

  it('예시 지급일은 지어낸 값이 아니라 스냅샷 그대로다', () => {
    const preview = buildDividendCalendarViewModel({
      universe: getCalendarUniverse(),
      keyword: '',
      selected: [],
      asOf: MARKET_DATA.asOf,
      year: 2026,
      month: 7,
      today: TODAY
    }).previewMonth;

    const placed = (preview?.weeks ?? [])
      .flat()
      .flatMap((cell) => cell.items.map((item) => ({ ticker: item.ticker, day: cell.day })));

    expect(placed.length).toBeGreaterThan(0);
    for (const { ticker, day } of placed) {
      expect(CALENDAR_QUICK_PICK_TICKERS).toContain(ticker);
      expect(day).toBe(snapshotPayDay(ticker, 2026, 7));
    }
    // 날짜를 모르는 종목을 예시로 쓰면 격자가 텅 비고 미리보기가 아무것도 못 보여준다.
    expect(preview?.undated).toEqual([]);
  });
});

describe('빈 상태 예시 미리보기 — ② 예시임은 색이 아니라 텍스트가 말한다', () => {
  it('보이는 라벨과 표의 접근명이 각각 예시임을 밝힌다', async () => {
    await renderCalendar();

    // (a) 눈으로: 안내 카드 위 라벨.
    expect(screen.getByText('예시 · 실제 데이터가 아닙니다')).toBeInTheDocument();
    // (b) 스크린리더로: 표 자체의 이름 + 캡션(흐림은 접근성 트리에 도달하지 않는다).
    const previewTable = getPreviewTable();
    expect(previewTable).toHaveAccessibleName(expect.stringContaining('예시'));
    expect(within(previewTable).getByText(/실제 데이터가 아니며/)).toBeInTheDocument();
  });

  it('예시 칩은 누를 수 있는 컨트롤이 아니다', async () => {
    await renderCalendar();

    // 누를 실체(툴팁·아젠다 점프)가 없는 버튼을 42칸에 깔면 키보드 이동만 늘어난다.
    expect(within(getPreviewTable()).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('빈 상태 예시 미리보기 — ③ 칩을 누르면 그 종목이 실제로 적용된다', () => {
  it('칩 클릭 = 그 종목 선택 → 예시가 실데이터로 바뀐다', async () => {
    const { user } = await renderCalendar();

    const jepiDay = snapshotPayDay('JEPI', 2026, 7);
    expect(jepiDay, '시나리오 전제 불성립: 스냅샷에 JEPI 의 2026년 7월 예상일이 없습니다').not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'JEPI' }));

    // 선택이 실제로 1종이 됐다.
    expect(await screen.findByRole('button', { name: /현재 1종 선택됨/ })).toBeInTheDocument();

    // 예시 표와 안내 카드는 사라지고, 그 자리에 실제 달(월 제목으로 이름 붙는 표)이 선다.
    expect(screen.queryByRole('table', { name: /예시 달력/ })).not.toBeInTheDocument();
    expect(screen.queryByText('예시 · 실제 데이터가 아닙니다')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 선택한 종목이 없습니다')).not.toBeInTheDocument();

    const realTable = screen.getByRole('table', { name: '2026년 7월' });
    const iso = `2026-07-${pad2(jepiDay as number)}`;
    const time = within(realTable).getByText(
      (_, element) => element?.tagName === 'TIME' && element.getAttribute('datetime') === iso
    );
    expect(within(time.closest('td') as HTMLElement).getByText('JEPI')).toBeInTheDocument();

    // 잘린 정보의 원본(아젠다)도 이제 실재한다.
    expect(screen.getByRole('region', { name: '지급 일정 목록' })).toBeInTheDocument();
  });
});
