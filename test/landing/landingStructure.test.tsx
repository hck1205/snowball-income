import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { LANDING_COPY } from '@/pages/Landing/copy';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * 랜딩의 **문서 구조 계약**.
 *
 * 왜 렌더 테스트가 필요한가: 이 화면의 결정 대부분은 "무엇이 어디에 있는가"이고, 그것들은 타입으로
 * 잡히지 않는다. 특히 아래 셋은 어겨도 **화면이 멀쩡해 보이는** 종류다.
 *  ① `h1` 이 두 개가 된다(헤더 워드마크가 실수로 h1 로 돌아오는 경우) — 눈으로는 티가 안 난다.
 *  ② 랜딩에 모달이 생긴다 — 사용자가 명시적으로 거부한 형태다.
 *  ③ CTA 프로브 앵커(`data-landing-cta`)가 사라진다 — 프로브가 "0건이라 통과"로 조용히 죽는다.
 */

let restoreFetch: () => void;

describe('랜딩 — 문서 구조', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  it('h1 은 정확히 하나이고, 그것은 히어로 제목이다', () => {
    renderLandingPage();

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName(LANDING_COPY.hero.title);
  });

  it('8섹션이 전부 서고, 순서가 서사 순서와 같다', () => {
    renderLandingPage();

    // 🔴 **주요 지수는 이제 이 페이지에 없다**(2026-08-02). 앱 헤더로 옮기는 안이 먼저 시도됐다가
    //    되돌려졌고, 최종 자리는 시세가 실제로 쓰이는 **세 화면의 본문 맨 위**다(시뮬레이터·내 포트폴리오·
    //    배당 캘린더). 랜딩 본문은 서사에만 집중한다. 경위·실측은 `MarketIndexStrip.tsx` 상단 주석,
    //    자리 계약은 `test/shared/marketIndexStripPlacement.test.ts`.
    const expected = [
      LANDING_COPY.concept.title,
      LANDING_COPY.compound.title,
      LANDING_COPY.payout.title,
      LANDING_COPY.presets.title(PORTFOLIO_PRESET_PLACEHOLDERS.length),
      LANDING_COPY.checklist.title,
      LANDING_COPY.faq.title
    ];

    const actual = screen
      .getAllByRole('heading', { level: 2 })
      .map((node) => node.textContent?.trim() ?? '');

    expect(actual).toEqual(expected);
  });

  it('헤딩 레벨을 건너뛰지 않는다 — h1 → h2 → h3 → h4', () => {
    renderLandingPage();

    const levels = screen
      .getAllByRole('heading')
      .map((node) => Number(node.tagName.slice(1)))
      .filter((level) => Number.isFinite(level));

    let previous = 0;
    for (const level of levels) {
      if (level > previous) expect(level - previous).toBeLessThanOrEqual(1);
      previous = level;
    }
  });

  it('🔴 모달·오버레이가 하나도 없다', () => {
    renderLandingPage();

    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    expect(screen.queryAllByRole('alertdialog')).toHaveLength(0);
  });

  it('🔴 접힘 위 CTA 프로브 앵커가 존재한다 — 시뮬레이터로 가는 버튼', () => {
    const { container } = renderLandingPage();

    // 이 속성이 사라지면 headerprobe 의 랜딩 전용 검사가 "요소 0건"으로 조용히 통과한다.
    expect(container.querySelector('[data-landing-cta="simulator"]')).not.toBeNull();
  });

  it('히어로 CTA 는 두 개뿐이고, 접힘 예산 때문에 리드보다 **위**에 온다', () => {
    const { container } = renderLandingPage();

    const anchors = [...container.querySelectorAll('[data-landing-cta]')];
    expect(anchors).toHaveLength(2);

    const lede = screen.getByText(LANDING_COPY.hero.lede);
    // compareDocumentPosition: 4 = FOLLOWING(리드가 CTA 뒤에 온다).
    for (const anchor of anchors) {
      expect(anchor.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('재방문 마커가 없으면 "이어서 계산하기"를 보여 주지 않는다', () => {
    renderLandingPage();

    expect(screen.queryByRole('button', { name: LANDING_COPY.hero.resumeAction })).toBeNull();
  });

  it('재방문 마커가 있으면 "이어서 계산하기"가 보인다', () => {
    setWorkspaceMarker(true);
    renderLandingPage();

    expect(screen.getByRole('button', { name: LANDING_COPY.hero.resumeAction })).toBeInTheDocument();
  });

  it('FAQ 8문항은 전부 접힌 채로 시작한다 — 첫 항목 자동 펼침은 오케스트레이션이다', () => {
    const { container } = renderLandingPage();

    const items = [...container.querySelectorAll('details')];
    /*
     * 🔴 개수는 **리터럴 8** 이다. `LANDING_COPY.faq.items.length` 로 쓰면 문항을 하나 지웠을 때
     * 기대값이 함께 줄어 테스트가 통과한다(2026-08-01 뮤테이션 M7 로 실증 — 이 단정은 문항 삭제를
     * 무음 통과시켰고, 문장까지 리터럴로 적은 landingHierarchy.test.tsx 만 빨개졌다).
     * 문항이 진짜로 늘고 줄면 이 숫자와 JSON-LD 계약을 **함께** 손대는 것이 맞다.
     */
    expect(items).toHaveLength(8);
    expect(items.filter((item) => item.open)).toHaveLength(0);
  });

  it('푸터 법무 링크가 그대로 있다', () => {
    renderLandingPage();

    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
  });
});
