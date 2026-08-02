import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DividendCalendarPage } from '@/pages/DividendCalendar';

/**
 * "종목별 지급 월" 표를 **좁은 화면에서 실제로 읽을 수 있는가**에 대한 계약.
 *
 * 이 표는 12개월 격자라 모바일 폭에 절대 다 들어가지 않는다 — 320px 에서 상자는 표의 절반 남짓만
 * 보여 준다(실측 220 / 344). 그러면 사용자는 옆으로 밀어야 하고, 그때 두 가지가 무너지면 표가
 * 있으나 마나가 된다:
 *
 *   1. 밀고 있는 그 상자가 **무엇인지** 모른다 → 이름 있는 영역(`role="region"` + 이름)으로 잡는다.
 *   2. 밀고 나면 지금 보는 점이 **어느 종목 줄인지** 모른다 → 종목 칸이 그 줄의 **행 머리글**이어야
 *      한다. 시각적으로는 그 열이 왼쪽에 고정(sticky)돼 같은 일을 하고, 스크린리더에서는 행 머리글이
 *      각 칸을 종목에 묶어 준다. **두 경로가 같은 계약을 만족해야** 표가 읽힌다.
 *
 * ⚠ jsdom 은 레이아웃도 `@media` 도 계산하지 않으므로 "몇 개월이 보이나"·"고정 열이 실제로 붙어
 * 있나"는 여기서 증명할 수 없다(그건 `npm run overflowprobe` 와 uiprobe 스크린샷의 몫이다).
 * 여기서 잠그는 것은 그 시각 처방이 기대는 **구조**다.
 */

const TODAY = new Date(2026, 6, 25);

const renderLegend = async (tickers: string[]) => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={[`/dividend/calendar?tickers=${tickers.join(',')}`]}>
      <Routes>
        <Route path="/dividend/calendar" element={<DividendCalendarPage today={TODAY} />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByRole('heading', { level: 2, name: /^\d{4}년 \d{1,2}월$/ });
  await waitFor(() => {
    expect(screen.queryByText('저장된 종목 선택을 불러오는 중입니다.')).not.toBeInTheDocument();
  });

  // 표는 기본으로 접혀 있다 — 사용자와 같은 경로로 편다.
  await user.click(screen.getByText('종목별 지급 월 표로 보기'));

  return { user };
};

describe('종목별 지급 월 표 — 좁은 화면에서 읽히는 구조', () => {
  it('표를 감싼 가로 스크롤 상자에 이름이 있다', async () => {
    await renderLegend(['SCHD', 'JEPI']);

    const region = screen.getByRole('region', { name: '종목별 지급 월 표' });

    expect(within(region).getByRole('table')).toBeInTheDocument();
  });

  /**
   * 🔴 이름만으로는 부족하다 — **밀 수 있어야** 한다.
   *
   * 이 표 안에는 대화형 자손이 하나도 없다(`th`/`td` 와 점뿐). 스크롤 상자 자신이 포커스를 받지
   * 못하면 키보드 전용 사용자는 320px 에서 344px 표의 220px 만 본 채 나머지 달에 영영 닿지 못한다
   * (WCAG 2.1.1). Chrome 127+ 만 스크롤러를 기본 포커서블로 만들고 Safari·구 Chrome 은 아니다 —
   * `tabindex="0"` 이 그 차이를 메운다. 법무 고지문 표와 같은 처방이다
   * (test/legal/legalTableScroller.test.tsx).
   */
  it('🔴 스크롤 상자가 키보드 포커스를 받는다 — 탭 순서에 들어가 옆으로 밀 수 있다', async () => {
    await renderLegend(['SCHD', 'JEPI']);

    const region = screen.getByRole('region', { name: '종목별 지급 월 표' });

    expect(region).toHaveAttribute('tabindex', '0');
    // jsdom 은 브라우저의 "스크롤러 기본 포커서블"(Chrome 127+)을 흉내 내지 않으므로, 여기서 포커스가
    // 들어온다는 것은 곧 `tabindex` 가 그 일을 하고 있다는 뜻이다 — 구 브라우저에서와 같은 조건이다.
    region.focus();
    expect(region).toHaveFocus();
  });

  it('선택한 종목마다 그 줄의 행 머리글이 종목명이다', async () => {
    const selected = ['SCHD', 'JEPI'];
    await renderLegend(selected);

    const region = screen.getByRole('region', { name: '종목별 지급 월 표' });

    for (const ticker of selected) {
      expect(within(region).getByRole('rowheader', { name: new RegExp(`^${ticker}`) })).toBeInTheDocument();
    }
  });

  it('지급하는 달의 칸은 몇 월 지급인지 스스로 말한다', async () => {
    await renderLegend(['SCHD']);

    const region = screen.getByRole('region', { name: '종목별 지급 월 표' });
    const payingCells = within(region)
      .getAllByRole('cell')
      .filter((cell) => /^\d{1,2}월 지급$/.test(cell.getAttribute('aria-label') ?? ''));

    expect(payingCells.length).toBeGreaterThan(0);
  });
});
