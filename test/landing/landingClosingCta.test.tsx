import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * 마무리 CTA(D-8)의 **계약**.
 *
 * before 의 마지막 인터랙티브 요소는 FAQ 8번째 `summary` 였고 그 뒤는 곧바로 면책 푸터였다 —
 * 끝까지 읽은 사람에게 다음 행동이 없었다. 이 줄이 그 자리를 메운다.
 *
 * 🔴 **문장은 부분일치로 잠그지 않는다.** 이 레포에는 부분일치 계약이 축약 회귀를 무음 통과시킨
 * 이력이 있다(카피 한 글자가 빠져도 `toHaveTextContent` 는 통과한다). 그래서 여기 기대값은
 * **소스 상수를 다시 읽지 않고 문자열 리터럴을 직접 적는다** — 상수를 읽으면 카피가 바뀔 때
 * 테스트가 함께 바뀌어 아무것도 잡지 못한다.
 *
 * 🔴 앵커는 `data-landing-closing-cta` 다. `data-landing-cta`(히어로 접힘 프로브 전용, 정확히 2개)를
 * 여기에 붙이면 프로브가 접힘 아래 요소를 접힘 위 CTA 로 세게 된다.
 */

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

/** 🔴 소스에서 읽지 않는다 — 확정 카피 원문(spec D-8 "확정 카피"). */
const CLOSING_NOTE = '지금까지 본 내용을 직접 계산해 보실 수 있습니다.';
/** 히어로 1순위 CTA 와 **같은 문자열**이어야 한다(한 의도에 한 라벨). */
const SIMULATOR_LABEL = '배당 계산 시작하기';

let restoreFetch: () => void;

const closingAnchor = (container: HTMLElement): HTMLAnchorElement => {
  const anchor = container.querySelector<HTMLAnchorElement>('[data-landing-closing-cta="simulator"]');
  if (!anchor) throw new Error('마무리 CTA 앵커(data-landing-closing-cta="simulator")가 없다');
  return anchor;
};

describe('랜딩 — 마무리 CTA', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  it('🔴 닫는 문장이 한 글자도 다르지 않다 — 정확일치', () => {
    const { container } = renderLandingPage();
    const row = closingAnchor(container).parentElement as HTMLElement;

    const note = row.querySelector('p');
    expect(note).not.toBeNull();
    expect(note?.textContent).toBe(CLOSING_NOTE);
  });

  it('🔴 앵커는 정확히 하나이고, 시뮬레이터로 가며, 라벨은 히어로 1순위 CTA 와 같은 문자열이다', () => {
    const { container } = renderLandingPage();

    expect(container.querySelectorAll('[data-landing-closing-cta]')).toHaveLength(1);

    const anchor = closingAnchor(container);
    expect(anchor.tagName).toBe('A');
    expect(anchor.getAttribute('href')).toBe('/simulator');
    expect(anchor.textContent?.trim()).toBe(SIMULATOR_LABEL);
  });

  it('🔴 마무리 CTA 에는 `data-landing-cta` 를 붙이지 않는다 — 접힘 프로브의 2개 계약을 오염시킨다', () => {
    const { container } = renderLandingPage();

    expect(closingAnchor(container).hasAttribute('data-landing-cta')).toBe(false);

    const heroAnchors = [...container.querySelectorAll('[data-landing-cta]')];
    expect(heroAnchors).toHaveLength(2);
    // 접힘 위 CTA 는 전부 마무리 CTA 보다 **앞**에 있다(2 = PRECEDING).
    for (const hero of heroAnchors) {
      expect(
        closingAnchor(container).compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_PRECEDING
      ).toBeTruthy();
    }
  });

  it('FAQ **뒤**, 푸터 **앞**에 온다 — 페이지를 닫는 자리', () => {
    const { container } = renderLandingPage();
    const anchor = closingAnchor(container);

    const faq = screen.getByRole('heading', { level: 2, name: '자주 묻는 질문' });
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();

    expect(faq.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(anchor.compareDocumentPosition(footer as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 🔴 지수 스트립은 더 이상 이 페이지에 없다(2026-08-02) — 시세가 쓰이는 세 화면으로 옮겼다. 여기서 찾지 마라.
    expect(screen.queryByRole('heading', { level: 2, name: '주요 지수' })).not.toBeInTheDocument();
  });

  it('🔴 닫는 줄은 챕터가 아니다 — 헤딩을 갖지 않는다', () => {
    const { container } = renderLandingPage();
    const row = closingAnchor(container).parentElement as HTMLElement;

    expect(within(row).queryAllByRole('heading')).toHaveLength(0);
  });

  it('누르면 히어로 CTA 와 구분되는 이름으로 계측된다', async () => {
    const user = userEvent.setup();
    const { container } = renderLandingPage();

    await user.click(closingAnchor(container));

    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'landing_closing_simulator'
    });
  });
});
