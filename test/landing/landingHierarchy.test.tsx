import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * 랜딩의 **서사 묶음 구조**(D-2) · **히어로 CTA 순서**(확정 결정) · **FAQ 의 형태**(D-6).
 *
 * `landingStructure.test.tsx` 가 "무엇이 있는가"(h1 하나 · h2 순서 · details 8개)를 본다면, 여기는
 * **"무엇이 무엇 안에 있는가"** 를 본다. 그룹은 순수 div 라 랜드마크도 헤딩도 없어서 — 즉 접근성
 * 트리에 흔적을 남기지 않아서 — 잘못 묶여도 화면이 멀쩡해 보인다. 깨지면 여백 리듬(그룹 경계 76px ↔
 * 그룹 안 38px)이 엉뚱한 곳에 붙는다.
 *
 * 🔴 기대값은 **소스 상수를 다시 읽지 않고 문자열 리터럴로 적는다.** 상수를 읽으면 카피·순서가
 * 바뀔 때 기대값이 함께 움직여 아무것도 잡지 못한다(동어반복).
 *
 * ⚠ jsdom 은 좌표·색·의사요소를 보지 못한다. 여기서 잠그는 것은 **존재·순서·소속·접근명**뿐이고,
 * 간격·룰선·마커 색은 uiprobe 실측의 몫이다.
 */

let restoreFetch: () => void;

/**
 * 스택은 클래스가 아니라 **`<main>` 의 첫 자식**으로 찾는다(Emotion 내부 구현에 기대지 않는다).
 *
 * 🔴 2026-08-03 로 기준이 바뀌었다. 종전에는 "푸터의 부모"로 찾았는데, 푸터가 셸의 슬롯으로
 * 옮겨가면서(`components/common/PageFooter/PageFooterSlot.tsx`) **더 이상 스택 안에 없다** —
 * `<footer>` 가 `<main>` 의 자손이면 contentinfo 랜드마크가 죽고 전폭 띠도 될 수 없어서다.
 * 그 상태로 옛 헬퍼를 두면 슬롯 div(자식 1개)를 스택으로 착각해 **엉뚱한 곳에서 실패**한다.
 */
const landingStack = (container: HTMLElement): HTMLElement => {
  const stack = container.querySelector('main')?.firstElementChild;
  if (!(stack instanceof HTMLElement)) throw new Error('랜딩 스택을 찾지 못했다');
  return stack;
};

const sectionTitlesOf = (node: Element): string[] =>
  [...node.querySelectorAll('h1, h2')].map((heading) => heading.textContent?.trim() ?? '');

describe('랜딩 — 서사 묶음 구조', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  it('🔴 스택의 직계 자식은 섹션이 아니라 **묶음 4개**다', () => {
    const { container } = renderLandingPage();
    const children = [...landingStack(container).children];

    expect(children).toHaveLength(4);
  });

  /**
   * 🔴 푸터는 스택 **밖**, `<main>` 밖이다. `<footer>` 가 main/section/article 의 자손이면
   * `contentinfo` 랜드마크가 되지 않는다(HTML 명세) — 종전에는 8개 화면 전부 그 상태였다.
   * 전폭 띠라는 모양도 여기서 나온다(셸의 main 은 max-width 1200 이다).
   */
  it('🔴 푸터는 main 밖에 선다 — contentinfo 랜드마크가 살아 있어야 한다', () => {
    const { container } = renderLandingPage();
    const footer = container.querySelector('footer');

    expect(footer).not.toBeNull();
    expect(footer?.closest('main')).toBeNull();
  });

  it('🔴 각 묶음의 구성원이 서사 순서 그대로다 — 히어로 / 배우기 4 / 고르기 2 / 참조와 마무리 2', () => {
    const { container } = renderLandingPage();
    const [hero, learn, choose, reference] = [...landingStack(container).children];

    // 🔴 주요 지수는 **이 페이지에 없다**(2026-08-02 — 시세가 쓰이는 세 화면 본문 맨 위로 옮겼다).
    //    히어로에는 제목만 남는다.
    expect(sectionTitlesOf(hero)).toEqual(['배당으로 배당을 키우는 복리, 여기서 계산합니다']);

    /* 🔴 2026-08-06: '처음이라면 여기부터'가 배우기 묶음의 **첫 장**으로 합류했다. 아래 세 장은
       전부 "배당을 안다"를 전제로 서 있었는데, 그 전제를 만드는 자리가 없었다(사용자 지적).
       순서가 곧 학습 경로라, 이 장이 맨 앞이 아니면 그 지적이 그대로 되살아난다. */
    expect(sectionTitlesOf(learn)).toEqual([
      '처음이라면 여기부터',
      '배당을 알기 전에, 세 단어',
      '배당을 다시 넣으면 무엇이 달라지나',
      '배당이 들어오는 달은 종목마다 다릅니다'
    ]);

    // 프리셋 제목의 개수는 데이터에서 센다 — 13→14 가 되어도 참이어야 하는 유일한 자리다.
    expect(sectionTitlesOf(choose)).toEqual([
      expect.stringMatching(/^사람들이 많이 쓰는 구성 \d+가지$/),
      '시작하기 전에'
    ]);

    // 🔴 참조 구역에는 **FAQ 만** 남는다. 여기 있던 '주요 지수'(S2)는 랜딩에서 통째로 빠졌다
    //    (2026-08-02 — 히어로 묶음으로 올라간 것이 아니다. 위 히어로 단정이 그 사실을 함께 잠근다).
    expect(sectionTitlesOf(reference)).toEqual(['자주 묻는 질문']);
  });

  it('🔴 마무리 CTA 는 마지막 묶음 **안**에 있고, 앞 묶음에는 없다', () => {
    const { container } = renderLandingPage();
    const [, learn, choose, reference] = [...landingStack(container).children];

    expect(reference.querySelectorAll('[data-landing-closing-cta]')).toHaveLength(1);
    expect(learn.querySelectorAll('[data-landing-closing-cta]')).toHaveLength(0);
    expect(choose.querySelectorAll('[data-landing-closing-cta]')).toHaveLength(0);
  });

  it('🔴 묶음은 랜드마크가 아니다 — 순수 div 라 role·접근명을 갖지 않는다', () => {
    const { container } = renderLandingPage();
    const [, ...groups] = [...landingStack(container).children].slice(0, 4);

    for (const group of groups) {
      expect(group.tagName).toBe('DIV');
      expect(group.hasAttribute('role')).toBe(false);
      expect(group.hasAttribute('aria-label')).toBe(false);
      expect(group.hasAttribute('aria-labelledby')).toBe(false);
    }
  });
});

describe('랜딩 — 수준 4갈래 순서', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  /**
   * 🔴 확정 결정(사용자 승인으로 RP 5-2 를 뒤집음): **1순위는 시뮬레이터**다.
   * 랜딩의 대상은 SNS 로 처음 들어와 보유 종목이 0인 사람이라, 포트폴리오로 먼저 보내면 빈 화면을
   * 만난다. 다시 뒤집으려면 사용자 승인이 필요하다 — 그 승인 없이 배열 순서가 바뀌면 여기서 빨개진다.
   */
  it('🔴 문서 순서로 입문 → 초보 → 중급 → 고수이고, 직행로가 그 뒤에 하나 온다', () => {
    const { container } = renderLandingPage();

    /**
     * 🔴 순서가 곧 서사다. 모르는 사람이 먼저 오고 아는 사람이 뒤에 온다 — 뒤집으면 이 지면이
     * 다시 "아는 사람 먼저"가 되는데, 그것이 2026-08-17 에 고친 문제다.
     * 전 계약(시뮬레이터 → 포트폴리오 두 CTA)은 이 교체로 폐기됐다.
     */
    const levels = [...container.querySelectorAll('[data-landing-level]')];
    expect(levels.map((node) => node.getAttribute('data-landing-level'))).toEqual([
      'beginner',
      'novice',
      'intermediate',
      'advanced'
    ]);

    // 직행로는 네 칸 **뒤**다(4 = FOLLOWING). 앞에 두면 다섯 갈래가 되어 넷으로 좁힌 의미가 없다.
    const direct = container.querySelector('[data-landing-cta="simulator"]');
    expect(levels[3].compareDocumentPosition(direct!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  const faqSection = (container: HTMLElement): HTMLElement => {
    const heading = screen.getByRole('heading', { level: 2, name: '자주 묻는 질문' });
    const section = heading.closest('section');
    if (!section) throw new Error('FAQ 섹션을 찾지 못했다');
    expect(container.contains(section)).toBe(true);
    return section;
  };

  /**
   * 🔴 카드 8개를 구분선 목록으로 바꾼 것(D-6)은 **표현**의 변경이고, 부품은 여전히 네이티브
   * `<details>/<summary>` 여야 한다 — 키보드·`aria-expanded`·펼침 상태를 브라우저가 준다.
   * 커스텀 아코디언으로 갈아타면 그 셋을 우리가 직접 지켜야 하고, 지키지 않으면 아무도 신고하지 않는다.
   */
  it('🔴 8문항이 전부 네이티브 details/summary 이고, 문장이 정확히 일치한다', () => {
    const { container } = renderLandingPage();
    const section = faqSection(container);

    const items = [...section.querySelectorAll('details')];
    expect(items.map((item) => item.querySelector('summary')?.textContent?.trim())).toEqual([
      '이 사이트는 무료인가요?',
      '가입해야 쓸 수 있나요?',
      '입력한 내용은 어디에 저장되나요?',
      '계산은 어디에서 이루어지나요?',
      '배당률이나 주가 같은 숫자는 어디서 오나요?',
      '계산 결과대로 배당을 받게 되나요?',
      '투자 자문인가요?',
      '세금은 어떻게 계산되나요?'
    ]);
  });

  it('🔴 커스텀 아코디언이 아니다 — 손으로 관리하는 aria-expanded·버튼이 0개다', () => {
    const { container } = renderLandingPage();
    const section = faqSection(container);

    expect(section.querySelectorAll('[aria-expanded]')).toHaveLength(0);
    expect(within(section).queryAllByRole('button')).toHaveLength(0);
  });

  /** 문항은 `<summary>` 이지 헤딩이 아니다 — 8개를 h3 로 올리면 문서 개요에서 FAQ 가 본론보다 커진다. */
  it('문항은 헤딩이 아니다 — 섹션 안 헤딩은 h2 하나뿐이다', () => {
    const { container } = renderLandingPage();
    const section = faqSection(container);

    const headings = within(section).getAllByRole('heading');
    expect(headings).toHaveLength(1);
    expect(headings[0]?.tagName).toBe('H2');
  });
});
