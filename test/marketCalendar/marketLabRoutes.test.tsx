import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { CONGRESS_COPY } from '@/pages/Congress/copy';
import { NPS_COPY } from '@/pages/Nps/copy';
import { MARKET_CALENDAR_COPY } from '@/pages/MarketCalendar/copy';
import { KOREA_ASSEMBLY_COPY } from '@/pages/KoreaAssembly/copy';

/**
 * 2026-08-04 에 붙은 자료형 화면 셋의 **라우트 계약**.
 *
 * 잠그는 것 셋:
 *  ① 세 주소가 실제로 열린다(404 로 가지 않는다).
 *  ② 🔴 **"읽기 전에 알아야 할 것"이 표보다 먼저 있다.** 세 화면 모두 자료의 한계가 본문만큼
 *     중요한데, 그 판을 표 뒤로 밀거나 지우면 화면이 조용히 거짓말을 시작한다. 문서 순서로 잠근다.
 *  ③ 출처 링크가 살아 있다 — 사용자가 원문을 확인할 수 있어야 한다.
 *
 * ⚠ 라우트는 `React.lazy` 라 `findBy*` 로 기다린다.
 */
const renderAt = (path: string) => {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
};

const CASES = [
  {
    path: '/portfolio/congress',
    title: CONGRESS_COPY.hero.title,
    limitsHeading: CONGRESS_COPY.limits.heading,
    firstTableHeading: CONGRESS_COPY.tickers.heading
  },
  {
    path: '/portfolio/nps',
    title: NPS_COPY.hero.title,
    limitsHeading: NPS_COPY.limits.heading,
    firstTableHeading: NPS_COPY.holdings.heading
  },
  {
    path: '/market/us-calendar',
    title: MARKET_CALENDAR_COPY.hero.title,
    limitsHeading: MARKET_CALENDAR_COPY.limits.heading,
    firstTableHeading: MARKET_CALENDAR_COPY.month.heading
  },
  {
    /* 2026-08-05 합류. 같은 세 계약을 그대로 받는다 — 자료의 한계가 본문만큼 중요한 화면이라서다. */
    path: '/portfolio/korea-assembly',
    title: KOREA_ASSEMBLY_COPY.hero.title,
    limitsHeading: KOREA_ASSEMBLY_COPY.limits.heading,
    firstTableHeading: KOREA_ASSEMBLY_COPY.issuers.heading
  }
] as const;

describe('자료형 화면 라우트', () => {
  it.each(CASES)('$path 가 열린다', async ({ path, title }) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  /**
   * 🔴 이 계약이 이 파일에서 가장 중요하다. 한계 문구를 표 뒤로 미루면 아무도 읽지 않고,
   * 읽지 않는 한계는 없는 것과 같다.
   */
  it.each(CASES)('$path — 한계 안내가 첫 표보다 앞에 있다', async ({ path, limitsHeading, firstTableHeading }) => {
    renderAt(path);

    const limits = await screen.findByRole('heading', { name: limitsHeading });
    const firstTable = await screen.findByRole('heading', { name: firstTableHeading });

    /* Node.compareDocumentPosition: 4 = FOLLOWING(limits 뒤에 firstTable 이 온다). */
    expect(limits.compareDocumentPosition(firstTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('국회의원 화면이 원문 공시로 나가는 링크를 준다', async () => {
    renderAt('/portfolio/congress');
    const link = await screen.findByRole('link', { name: CONGRESS_COPY.source.linkLabel });
    expect(link).toHaveAttribute('href', expect.stringContaining('disclosures-clerk.house.gov'));
  });

  /**
   * 🔴 두 자료의 성격이 다르다는 사실 자체가 이 화면의 내용이다.
   * 2026-08-05 에 한국 화면이 생기면서 "자료가 없다"에서 "따로 있다"로 바뀌었고, 이 테스트는
   * 미국 화면이 **그 사실을 말하고 실제로 건너갈 수 있는지**를 잠근다.
   */
  it('국회의원 화면이 대한민국 국회 자료로 건너가는 길을 준다', async () => {
    renderAt('/portfolio/congress');
    expect(await screen.findByRole('heading', { name: CONGRESS_COPY.korea.heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONGRESS_COPY.korea.linkLabel })).toHaveAttribute(
      'href',
      CONGRESS_COPY.korea.linkTo
    );
  });

  it('국민연금 화면이 SEC 공시로 나가는 링크를 준다', async () => {
    renderAt('/portfolio/nps');
    const link = await screen.findByRole('link', { name: NPS_COPY.source.linkLabel });
    expect(link).toHaveAttribute('href', expect.stringContaining('sec.gov'));
  });

  it('증시 캘린더가 거래소·연준 공시로 나가는 링크를 준다', async () => {
    renderAt('/market/us-calendar');
    expect(await screen.findByRole('link', { name: MARKET_CALENDAR_COPY.source.holidaysName })).toHaveAttribute(
      'href',
      MARKET_CALENDAR_COPY.source.holidaysUrl
    );
    expect(screen.getByRole('link', { name: MARKET_CALENDAR_COPY.source.fomcName })).toHaveAttribute(
      'href',
      MARKET_CALENDAR_COPY.source.fomcUrl
    );
  });

  /** 달력은 달을 옮길 수 있어야 한다 — 못 옮기면 "이번 달 전용" 화면이 된다. */
  it('증시 캘린더에서 달을 앞뒤로 옮길 수 있다', async () => {
    renderAt('/market/us-calendar');
    expect(await screen.findByRole('button', { name: MARKET_CALENDAR_COPY.month.previous })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: MARKET_CALENDAR_COPY.month.next })).toBeInTheDocument();
  });
});
