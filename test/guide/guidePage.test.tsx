import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GuidePage from '@/pages/Guide/GuidePage';
import { GUIDES, GUIDE_START_PATH } from '@/shared/constants/guides';
import { buildGuideViewModel, isNumericColumn, readingMinutes } from '@/pages/Guide/GuidePage/GuidePage.utils';

/**
 * `/guide/:slug` 조판의 계약(2026-08-06 리워크).
 *
 * 🔴 **무엇을 지키려는 테스트인가**: 이 지면은 검색으로 들어온 사람이 답을 얻고 도구로 넘어가는
 * 길이다. 그래서 재는 것은 "예쁜가"가 아니라 ①글이 다 있는가 ②길(목차·다음 글·계산기)이 다
 * 있는가 ③들어온 경로와 무관하게 **나갈 수 있는가**(뒤로 가기) 셋이다.
 *
 * ⚠ 스타일(Emotion 클래스)로 단정하지 않는다 — 이 레포의 확정 규율이다.
 */
const renderGuide = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/guide/${slug}`]}>
      <Routes>
        <Route path="/guide/:slug" element={<GuidePage />} />
        <Route path="/" element={<p>홈 화면</p>} />
        <Route path="/ticker/all" element={<p>티커 허브</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('가이드 상세 화면', () => {
  it('제목을 h1 으로 세운다 — 이 셸의 워드마크는 span 이라 문서에 h1 이 없으면 주제를 잃는다', () => {
    const guide = GUIDES[0]!;
    renderGuide(guide.slug);

    expect(screen.getByRole('heading', { level: 1, name: guide.title })).toBeInTheDocument();
  });

  /**
   * 🔴 이 계약이 이 파일에서 가장 중요하다.
   *
   * 2026-08-06 리워크 전까지 가이드 다섯 편만 **공통 셸 밖**에서 렌더돼 앱 헤더가 통째로 없었다 —
   * 워드마크도 메뉴도 로그인도 없었고, 검색으로 들어온 사람에게 사이트의 나머지로 가는 길이
   * 아예 없었다. 셸을 벗기는 순간 그 상태로 조용히 되돌아가므로 여기서 잠근다.
   */
  it('앱 공통 헤더(주요 메뉴) 안에서 렌더된다', () => {
    renderGuide(GUIDES[0]!.slug);

    // 헤더는 폭에 따라 가로 메뉴/드로어 두 벌을 같은 이름으로 낸다 — 존재만 단정한다.
    expect(screen.getAllByRole('navigation', { name: '주요 메뉴' }).length).toBeGreaterThan(0);
  });

  it('본문 장을 하나도 빠뜨리지 않고, 각 장이 제목과 첫 문단을 갖는다', () => {
    const guide = GUIDES[3]!;
    renderGuide(guide.slug);

    for (const section of guide.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
      expect(screen.getByText(section.paragraphs[0]!)).toBeInTheDocument();
    }
  });

  it('목차가 본문 장 + 부록 둘(FAQ·다음 걸음)을 담고, 누르면 그 장으로 포커스가 옮겨 간다', async () => {
    const guide = GUIDES[1]!;
    renderGuide(guide.slug);

    const toc = screen.getByRole('navigation', { name: '이 페이지 목차' });
    const entries = within(toc).getAllByRole('button');
    expect(entries).toHaveLength(guide.sections.length + 2);

    const target = guide.sections[1]!;
    await userEvent.click(within(toc).getByRole('button', { name: target.navLabel }));

    // jsdom 은 스크롤하지 않는다 — 계약은 "포커스가 그 장으로 간다"쪽이다.
    expect(document.getElementById(target.id)).toHaveFocus();
  });

  it('표를 캡션·전제와 함께 그린다', () => {
    const guide = GUIDES.find((entry) => entry.sections.some((section) => section.table))!;
    const section = guide.sections.find((entry) => entry.table)!;
    renderGuide(guide.slug);

    expect(screen.getByText(section.table!.caption)).toBeInTheDocument();
    if (section.table!.note) expect(screen.getByText(section.table!.note)).toBeInTheDocument();
    for (const cell of section.table!.rows[0]!) {
      expect(screen.getAllByText(cell).length).toBeGreaterThan(0);
    }
  });

  it('FAQ 를 질문·답 그대로 그린다 — JSON-LD 와 같은 문장이어야 한다', () => {
    const guide = GUIDES[2]!;
    renderGuide(guide.slug);

    for (const faq of guide.faqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it('시작 경로의 다음 글로 가는 링크를 세운다', () => {
    const [first, second] = GUIDE_START_PATH;
    renderGuide(first!.slug);

    const nextLink = screen.getByRole('link', { name: new RegExp(second!.title) });
    expect(nextLink).toHaveAttribute('href', `/guide/${second!.slug}`);
  });

  it('마지막 걸음에는 다음 글이 없고 나머지 가이드만 남는다', () => {
    const last = GUIDE_START_PATH[GUIDE_START_PATH.length - 1]!;
    renderGuide(last.slug);

    expect(screen.queryByText('다음 글')).not.toBeInTheDocument();
    for (const other of GUIDES.filter((entry) => entry.slug !== last.slug)) {
      expect(screen.getByRole('link', { name: new RegExp(other.title) })).toBeInTheDocument();
    }
  });

  it('계산기로 가는 문을 히어로와 마무리 양쪽에 둔다 — 긴 글 어디에서 멈춰도 나갈 곳이 있다', () => {
    const guide = GUIDES[4]!;
    renderGuide(guide.slug);

    const toSimulator = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === guide.cta.to);
    expect(toSimulator.length).toBeGreaterThanOrEqual(2);
  });

  it('검색으로 바로 들어와도 뒤로 가기가 사이트 밖이 아니라 홈으로 보낸다', async () => {
    // MemoryRouter 의 첫 항목 = 히스토리에 앞이 없는 상태(검색 결과에서 바로 착지한 경우).
    renderGuide(GUIDES[0]!.slug);

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(screen.getByText('홈 화면')).toBeInTheDocument();
  });

  it('모르는 슬러그는 티커 허브로 보낸다 — 404 를 새로 만들지 않는다', () => {
    renderGuide('there-is-no-such-guide');

    expect(screen.getByText('티커 허브')).toBeInTheDocument();
  });
});

describe('가이드 콘텐츠 규약', () => {
  /**
   * 🔴 접미사는 **표면이 붙인다**(크롤러 HTML 은 `server/handlers/GuideHtml`, SPA 는 `useDocumentMeta`).
   * 콘텐츠가 직접 적으면 SPA 로 들어온 사람의 탭 제목이 "… - Hungry Hippo - Hungry Hippo" 가 된다 —
   * 2026-08-06 에 실제로 그 상태였고, 티커 콘텐츠는 처음부터 접미사를 적지 않는다.
   */
  it('metaTitle 에 사이트명 접미사를 적지 않는다', () => {
    for (const guide of GUIDES) {
      expect(guide.metaTitle).not.toMatch(/Hungry Hippo/);
    }
  });

  it('모든 장이 목차에 쓸 짧은 이름을 갖는다 — 본문 제목을 그대로 넣으면 레일이 본문만큼 길어진다', () => {
    for (const guide of GUIDES) {
      for (const section of guide.sections) {
        expect(section.navLabel.length).toBeGreaterThan(0);
        expect(section.navLabel.length).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('가이드 파생값', () => {
  it('읽는 시간은 최소 1분이고 글이 길수록 커진다', () => {
    for (const guide of GUIDES) {
      expect(readingMinutes(guide)).toBeGreaterThanOrEqual(1);
    }

    const longest = [...GUIDES].sort(
      (a, b) => b.sections.flatMap((s) => s.paragraphs).join('').length - a.sections.flatMap((s) => s.paragraphs).join('').length
    )[0]!;
    const shortest = [...GUIDES].sort(
      (a, b) => a.sections.flatMap((s) => s.paragraphs).join('').length - b.sections.flatMap((s) => s.paragraphs).join('').length
    )[0]!;
    expect(readingMinutes(longest)).toBeGreaterThan(readingMinutes(shortest));
  });

  it('수치 열만 오른쪽 정렬로 판정한다 — 산문 열이 등폭 숫자로 렌더되던 결함의 가드', () => {
    // 실제 결함 사례: "항목 / 무엇을 보나"(설명이 문장) · "말 / 뜻 / 무엇을 알 수 있나"
    expect(
      isNumericColumn(
        [
          ['거래 수수료', '매수·매도할 때마다 붙는 비율. 소액을 자주 살수록 체감이 큽니다.'],
          ['환전 방식·환율 우대', '원화를 달러로 바꿀 때의 조건.']
        ],
        1
      )
    ).toBe(false);

    // 값 열은 그대로 수치로 읽힌다.
    expect(
      isNumericColumn(
        [
          ['3%', '4억 원'],
          ['4%', '3억 원']
        ],
        1
      )
    ).toBe(true);
    expect(
      isNumericColumn(
        [
          ['3%', '4억 원'],
          ['4%', '3억 원']
        ],
        0
      )
    ).toBe(true);
  });

  it('목차 번호는 본문 장 수만큼이고, 부록 둘에는 번호가 없다', () => {
    for (const guide of GUIDES) {
      const { toc } = buildGuideViewModel(guide);
      expect(toc.filter((item) => item.index)).toHaveLength(guide.sections.length);
      expect(toc.filter((item) => !item.index).map((item) => item.id)).toEqual(['faq', 'next']);
    }
  });

  it('시작 경로의 자리와 다음 글이 레지스트리 순서와 일치한다', () => {
    GUIDE_START_PATH.forEach((guide, order) => {
      const { step, next } = buildGuideViewModel(guide);
      expect(step).toEqual({ current: order + 1, total: GUIDE_START_PATH.length });
      expect(next?.slug).toBe(GUIDE_START_PATH[order + 1]?.slug);
    });
  });
});
