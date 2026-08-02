import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { Sprout } from 'lucide-react';
import { PageHero } from '@/components/common';
import { heroIconOpticalAlign } from '@/shared/styles';
import { LANDING_COPY } from '@/pages/Landing/copy';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * ── 랜딩 히어로 override 의 **결합 잠금** ──────────────────────────────────────
 *
 * 🔴 **이 파일은 일부러 DOM 구조를 단정한다. "구현 세부에 결합된 나쁜 테스트"로 오해하고 지우지 마라.**
 *
 * 왜 존재하나: `pages/Landing/LandingPage/LandingPage.styled.ts` 의 `HeroBlock` 은
 * `components/common/PageHero` 의 **내부 DOM 을 바깥에서 자손 선택자로 겨냥해** 랜딩 히어로만
 * 제목 30→44px · CTA 아랫줄 배치로 바꾼다. 그 결합은 **타입도 렌더도 잡아 주지 않는다** —
 * 히어로가 슬롯을 하나 더 렌더하거나 요소 타입을 바꾸면 선택자가 그냥 **아무것도 고르지 않고**,
 * 랜딩 히어로는 에러 0건 · 실패 테스트 0건으로 조용히 옛 모습(30px · 우측 CTA)으로 되돌아간다.
 * 그 무음을 **소음으로 바꾸는 것**이 이 파일의 유일한 목적이다.
 *
 * 그래서 여기서는 예외적으로 "요소 타입 · 위치 · aria 속성"을 본다. 단,
 * ⚠ **Emotion 이 생성한 클래스명은 절대 쓰지 않는다** — 그건 진짜로 내부 구현이고 리네임에 취약하다.
 * 여기서 보는 것은 히어로가 **시맨틱하게 약속한 모양**(header → 제목 줄 → 제목 그룹 · 액션)뿐이다.
 *
 * 영구 해법은 히어로 자신이 크기 변형을 소유해 랜딩이 선택자를 버리는 것이다(스펙 §G-1).
 * **그날 이 파일은 통째로 지우는 게 맞다.** 그 전까지는 남는다.
 */

const REPO_ROOT = process.cwd();
const LANDING_STYLED_PATH = join(REPO_ROOT, 'pages', 'Landing', 'LandingPage', 'LandingPage.styled.ts');

/** 이 레포는 주석이 길다 — 주석 안의 선택자 예시(`HeroBlock` 설명문)를 실제 룰로 오인하지 않게 걷어낸다. */
const stripComments = (raw: string): string =>
  raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const landingStyledSource = stripComments(readFileSync(LANDING_STYLED_PATH, 'utf8'));

/**
 * `HeroBlock` 이 실제로 쓰는 선택자들. **아래 DOM 단정이 이 문자열들을 그대로 실행한다** —
 * 그래서 랜딩이 선택자를 바꾸면 첫 테스트가 먼저 빨개져 "DOM 단정도 같이 갱신하라"고 알린다.
 */
const HERO_OVERRIDE_SELECTORS = [
  '> header > div:first-of-type',
  '> header h1',
  '> header > div:first-of-type > div:first-of-type > span[aria-hidden]',
  '> header > div:first-of-type > div + div',
  '> header > div:first-of-type > div + div > *'
] as const;

/** 소스에 적힌 `> header …{` 룰을 등장 순서대로 뽑는다. */
const readHeroOverrideSelectors = (): string[] =>
  [...landingStyledSource.matchAll(/^\s*(>\s*header[^{}]*?)\s*\{/gm)].map((match) =>
    match[1].replace(/\s+/g, ' ').trim()
  );

/**
 * `HeroBlock` 이 아이콘 배지에 다시 거는 잉크 보정 계수(예: `* -0.1` → 0.1).
 *
 * ⚠ 룰 본문을 `{ … }` 로 잘라내지 않는다 — 본문 안 템플릿 보간(`${…}`)의 닫는 중괄호가 먼저 잡혀
 * 값이 통째로 잘린다(실제로 그렇게 짰다가 NaN 을 봤다). 배지 선택자 **뒤쪽 구간**에서 첫 식만 읽는다.
 */
const readLandingInkShift = (): number => {
  const at = landingStyledSource.indexOf('span[aria-hidden]');
  if (at < 0) return Number.NaN;

  const raw = /translateY\(calc\([^*]*\*\s*(-?[\d.]+)\s*\)\)/.exec(
    landingStyledSource.slice(at, at + 300)
  )?.[1];

  return raw === undefined ? Number.NaN : -Number(raw);
};

/** 정본(`shared/styles/heroTitleRow.ts`)이 내보내는 보정 계수 — 상수는 비공개라 산출물에서 읽는다. */
const readCanonicalInkShift = (): number => {
  const raw = /\*\s*(-?[\d.]+)\s*\)/.exec(heroIconOpticalAlign)?.[1];

  return raw === undefined ? Number.NaN : -Number(raw);
};

/** 히어로를 감싼 `HeroBlock` — 선택자의 기준점이다. h1 에서 거슬러 올라가 잡는다(클래스명 사용 금지). */
const getHeroBlock = (): HTMLElement => {
  const heroRoot = screen.getByRole('heading', { level: 1 }).closest('header');
  expect(heroRoot).not.toBeNull();

  const block = heroRoot?.parentElement ?? null;
  expect(block).not.toBeNull();

  return block as HTMLElement;
};

const scoped = (root: Element, selector: string): Element[] => [
  ...root.querySelectorAll(`:scope ${selector}`)
];

let restoreFetch: () => void;

describe('랜딩 히어로 override — 선택자가 겨냥하는 DOM 이 그대로인가', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
  });

  afterEach(() => {
    restoreFetch();
    setWorkspaceMarker(false);
  });

  /**
   * 🔴 이 테스트가 빨개졌다면 **랜딩 쪽이 바뀐 것**이다. 아래 DOM 단정들은 이 문자열을 그대로
   * 실행하므로, 선택자를 고쳤으면 여기 목록도 같이 고쳐야 "무엇을 겨냥하는지"가 계속 검증된다.
   */
  it('HeroBlock 의 override 선택자 목록이 이 테스트가 검증하는 것과 같다', () => {
    expect(readHeroOverrideSelectors()).toEqual([...HERO_OVERRIDE_SELECTORS]);
  });

  /**
   * 🔴 `> header > div:first-of-type` 은 "**제목 줄이 header 의 첫 div**"를 전제한다.
   * 히어로 앞쪽에 div 슬롯이 하나만 끼면(예: 배너·브레드크럼) 이 전제가 깨지고 랜딩 히어로가
   * 통째로 원래 크기로 되돌아간다 — 화면은 멀쩡해 보이고 아무도 모른다.
   */
  it('header 의 첫 div 는 제목 줄이다 — 그 안에 h1 이 있다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const titleRows = scoped(block, HERO_OVERRIDE_SELECTORS[0]);
    expect(titleRows).toHaveLength(1);
    expect(titleRows[0].querySelector('h1')).not.toBeNull();

    const titles = scoped(block, HERO_OVERRIDE_SELECTORS[1]);
    expect(titles).toHaveLength(1);
    expect(titles[0]).toHaveAccessibleName(LANDING_COPY.hero.title);
  });

  /**
   * 🔴 `> div + div` 은 "제목 줄의 직계 div 가 **정확히 둘**(제목 그룹 · 액션)"을 전제한다.
   * 셋이 되면 매칭이 2건이 되어 엉뚱한 요소까지 왼쪽 정렬·transform 해제를 먹고,
   * 하나가 되면 CTA 가 제목 줄에 남는다. 매칭된 것이 **CTA 컨테이너가 맞는지**까지 확인한다 —
   * 개수만 세면 "다른 div 가 우연히 두 번째"인 상황을 통과시킨다.
   */
  it('제목 줄의 직계 div 는 정확히 둘이고, 두 번째는 CTA 컨테이너다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const titleRow = scoped(block, HERO_OVERRIDE_SELECTORS[0])[0];
    const directDivs = [...titleRow.children].filter((child) => child.tagName === 'DIV');
    expect(directDivs).toHaveLength(2);

    const actions = scoped(block, HERO_OVERRIDE_SELECTORS[3]);
    expect(actions).toHaveLength(1);
    // 랜딩 히어로 CTA 2개가 전부 이 컨테이너 안에 있어야 "CTA 를 아랫줄로 내린다"는 룰이 유효하다.
    expect(actions[0].querySelectorAll('[data-landing-cta]')).toHaveLength(2);

    // 마지막 룰(`> *`)은 CTA 하나하나의 잉크 보정을 되돌린다 — 대상이 곧 CTA 개수다.
    expect(scoped(block, HERO_OVERRIDE_SELECTORS[4])).toHaveLength(2);
  });

  /**
   * 🔴 아이콘 배지는 `span[aria-hidden]` **하나**여야 한다. 배지가 다른 요소(div·i)로 바뀌거나
   * `aria-hidden` 이 빠지면 보정 룰이 죽어 배지가 제목보다 약 4px 낮게 앉는다(무음).
   * `aria-hidden` 은 장식 배지라는 접근성 계약이기도 하다.
   */
  it('제목 그룹의 아이콘 배지는 span[aria-hidden] 정확히 하나다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const badges = scoped(block, HERO_OVERRIDE_SELECTORS[2]);
    expect(badges).toHaveLength(1);
    expect(badges[0].tagName).toBe('SPAN');
    // 배지는 제목과 같은 그룹 안에 있어야 한다 — 그래야 `align-items: center` 보정이 의미를 갖는다.
    expect(badges[0].parentElement?.querySelector('h1')).not.toBeNull();
  });
});

describe('PageHero 구조 계약 — 랜딩이 이 모양에 결합돼 있다', () => {
  /**
   * 위 테스트는 랜딩 전체를 그려서 본다. 이 테스트는 **히어로만** 그려서 같은 사실을 본다 —
   * 둘이 함께 빨개지면 원인은 히어로, 랜딩만 빨개지면 원인은 랜딩 쪽 사용법이다(원인 분리용).
   */
  const renderHeroLikeLanding = () =>
    render(
      <PageHero
        icon={<Sprout size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title="제목"
        titleAs="h1"
        lede="리드"
        actions={<button type="button">시작</button>}
      />
    );

  it('icon + actions 로 렌더하면 header 의 첫 div 안 `div + div` 이 정확히 하나다', () => {
    const { container } = renderHeroLikeLanding();

    expect(container.querySelectorAll('header > div:first-of-type > div + div')).toHaveLength(1);
  });

  it('icon + actions 로 렌더하면 아이콘 배지 span[aria-hidden] 이 정확히 하나다', () => {
    const { container } = renderHeroLikeLanding();

    expect(
      container.querySelectorAll(
        'header > div:first-of-type > div:first-of-type > span[aria-hidden]'
      )
    ).toHaveLength(1);
  });

  /** `lede`(p) 뒤에 `meta`(div) 가 오므로, header 의 **두 번째 div** 는 제목 줄이 아니다 — 순서가 곧 계약이다. */
  it('제목 줄은 header 의 첫 div 이고, 그 뒤 div 슬롯이 앞으로 오지 않는다', () => {
    const { container } = renderHeroLikeLanding();

    const header = container.querySelector('header') as HTMLElement;
    const firstDiv = [...header.children].find((child) => child.tagName === 'DIV');
    expect(firstDiv?.querySelector('h1')).not.toBeNull();
  });
});

describe('잉크 보정 계수 — 랜딩의 손 복제본이 정본과 같은가', () => {
  /**
   * 🔴 `HeroBlock` 은 제목을 44px 로 키우면서 배지 보정을 **직접 다시 계산**한다. 그 식의 계수
   * `-0.1` 은 `shared/styles/heroTitleRow.ts` 의 `INK_ABOVE_LINE_BOX.display` 를 손으로 복제한 값이다.
   * 정본이 0.1 → 0.08 로 바뀌면 랜딩만 낡아 배지가 약 0.9px 어긋난다 — 역시 무음이다.
   *
   * 정본 값을 직접 읽지 않고 `heroIconOpticalAlign`(정본의 산출물)에서 파싱하는 이유:
   * `INK_ABOVE_LINE_BOX` 는 비공개 상수라 테스트를 위해 export 를 늘리지 않기 위해서다.
   */
  it('정본 계수는 0.1 이다 (2026-07-30 실측: font.display 평균 +0.100em)', () => {
    // 이 리터럴이 빨개졌다면 정본이 바뀐 것이다 — 랜딩 쪽 -0.1 과 이 숫자를 **함께** 고쳐라.
    expect(readCanonicalInkShift()).toBe(0.1);
  });

  it('랜딩이 쓰는 보정 계수가 정본과 같다', () => {
    expect(readLandingInkShift()).toBe(readCanonicalInkShift());
  });
});
