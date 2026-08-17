import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { Sprout } from 'lucide-react';
import { PageHero } from '@/components/common';
import { LANDING_COPY } from '@/pages/Landing/copy';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * ── 랜딩 히어로 override 의 **결합 잠금** ──────────────────────────────────────
 *
 * 🔴 **이 파일은 일부러 DOM 구조를 단정한다. "구현 세부에 결합된 나쁜 테스트"로 오해하고 지우지 마라.**
 *
 * 왜 존재하나: `pages/Landing/LandingPage/LandingPage.styled.ts` 의 `HeroBlock` 은
 * `components/common/PageHero` 의 **내부 DOM 을 바깥에서 자손 선택자로 겨냥해** 랜딩 히어로만
 * 제목 30→44px · CTA 아랫줄 배치 · **오른쪽 그림 lane 확보**(2026-08-04)로 바꾼다.
 * 그 결합은 **타입도 렌더도 잡아 주지 않는다** —
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
  '> header',
  '> header > div:first-of-type',
  '> header h1'
  /**
   * 🔴 CTA 줄 오버라이드 두 개(`> div + div`, `> div + div > *`)를 걷었다(2026-08-17).
   * 히어로 `actions` 슬롯이 비면서 겨냥할 대상이 사라졌다 — 남겨 두면 히어로가 나중에 div 를
   * 하나 더 늘리는 순간 엉뚱한 요소를 잡는다. 수준 4갈래는 히어로 밖 형제라 이 보정이 필요 없다.
   */
] as const;

/**
 * 같은 목록을 **이름으로** 꺼내 쓴다. 순서 비교(위 배열)와 DOM 단정(아래)이 같은 문자열을 쓰되,
 * 단정 쪽은 인덱스에 매이지 않게 하기 위해서다 — 2026-08-04 에 맨 앞 룰(`> header`)이 하나 늘면서
 * 인덱스가 통째로 밀렸고, 단정 세 개가 **엉뚱한 선택자를 실행하며** 빨개졌다.
 */
const SELECTOR = {
  card: HERO_OVERRIDE_SELECTORS[0],
  titleRow: HERO_OVERRIDE_SELECTORS[1],
  title: HERO_OVERRIDE_SELECTORS[2],
} as const;

/** 소스에 적힌 `> header …{` 룰을 등장 순서대로 뽑는다. */
const readHeroOverrideSelectors = (): string[] =>
  [...landingStyledSource.matchAll(/^\s*(>\s*header[^{}]*?)\s*\{/gm)].map((match) =>
    match[1].replace(/\s+/g, ' ').trim()
  );


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
   * 🔴 **2026-08-04 신설.** 히어로 카드는 이제 그림(`HeroArt`)과 **같은 그리드 셀**을 나눠 쓴다 —
   * `> header` 룰이 카드에 `grid-area: hero` 와 오른쪽 lane 패딩을 준다(그림이 앉을 자리를 비운다).
   *
   * 이 룰이 죽는 방식이 특히 조용하다: 히어로를 한 겹 감싸면 `> header` 가 매칭을 잃고,
   * ① 카드가 area 를 못 받아 **세 번째 행**으로 밀려 그림과 겹치지 않게 되고
   * ② padding-right 가 사라져 제목·리드가 그림 밑으로 흐른다.
   * 둘 다 에러 0건이다. 그래서 "header 가 HeroBlock 의 **직계** 자식"을 여기서 단정한다.
   */
  it('히어로 카드(header)는 HeroBlock 의 직계 자식이다 — 그림 lane 규칙이 이 사실에 걸려 있다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const headers = scoped(block, SELECTOR.card);
    expect(headers).toHaveLength(1);
    expect(headers[0].querySelector('h1')).not.toBeNull();

    // 그림은 카드의 **형제**여야 한다 — 카드 자손이면 카드의 overflow:hidden 이 금화를 잘라
    // "실수로 넘친 그림"이 된다(HippoCoinScene.styled.ts 의 무대 주석).
    const artImages = [...block.querySelectorAll('img')];
    expect(artImages.length).toBeGreaterThan(0);
    expect(artImages.every((img) => img.closest('header') === null)).toBe(true);
  });

  /**
   * 🔴 `> header > div:first-of-type` 은 "**제목 줄이 header 의 첫 div**"를 전제한다.
   * 히어로 앞쪽에 div 슬롯이 하나만 끼면(예: 배너·브레드크럼) 이 전제가 깨지고 랜딩 히어로가
   * 통째로 원래 크기로 되돌아간다 — 화면은 멀쩡해 보이고 아무도 모른다.
   */
  it('header 의 첫 div 는 제목 줄이다 — 그 안에 h1 이 있다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const titleRows = scoped(block, SELECTOR.titleRow);
    expect(titleRows).toHaveLength(1);
    expect(titleRows[0].querySelector('h1')).not.toBeNull();

    const titles = scoped(block, SELECTOR.title);
    expect(titles).toHaveLength(1);
    expect(titles[0]).toHaveAccessibleName(LANDING_COPY.hero.title);
  });

  it('제목 줄의 직계 div 는 하나다 — CTA 컨테이너가 사라졌다', () => {
    /**
     * 🔴 2026-08-17: 히어로 `actions` 를 비웠다(수준 4갈래가 그 역할을 히어로 밖에서 한다).
     * 그래서 제목 줄의 직계 div 는 **제목 그룹 하나**이고, 이 파일이 지키던 `> div + div` 룰도
     * 함께 걷혔다. 둘로 돌아가면 히어로에 액션이 다시 생겼다는 뜻이니 그때 룰도 같이 되살려라.
     */
    renderLandingPage();
    const block = getHeroBlock();

    const titleRow = scoped(block, SELECTOR.titleRow)[0];
    const directDivs = [...titleRow.children].filter((child) => child.tagName === 'DIV');
    expect(directDivs).toHaveLength(1);
  });

  /**
   * 🔴 2026-08-03 로 계약이 뒤집혔다 — 랜딩 히어로에는 **아이콘 배지가 없다.**
   * 사용자 지시로 로고가 서는 자리를 헤더 하나로 모으면서 히어로 제목 옆 심볼을 걷었다.
   * 그와 함께 배지의 잉크 보정 룰(구 3번)도 걷었다 — 대상이 없는 룰은 조용히 썩는다.
   * ⚠ 배지를 되살리려면 그 보정 룰도 함께 되살려라. 없으면 배지가 제목보다 약 1.4px 낮게 앉는다
   *   (한글 라인박스 중심과 아이콘 시각 중심이 어긋나는 이 레포 단골 결함).
   */
  it('제목 그룹에 아이콘 배지가 없다 — 로고는 헤더 하나뿐이다', () => {
    renderLandingPage();
    const block = getHeroBlock();

    const titleGroup = scoped(block, '> header > div:first-of-type > div:first-of-type')[0];
    expect(titleGroup).toBeDefined();
    expect(titleGroup.querySelectorAll('span[aria-hidden]')).toHaveLength(0);
    expect(titleGroup.querySelector('h1')).not.toBeNull();
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

/*
 * 🔴 "잉크 보정 계수" 묶음을 걷었다(2026-08-03). 그 계수는 히어로 제목 옆 **아이콘 배지**를
 * 제목 중심에 맞추려던 값인데, 사용자 지시로 배지 자체가 사라졌다(로고는 헤더 하나뿐).
 * 대상이 없는 값을 계속 검사하면 테스트가 사실이 아닌 것을 지킨다.
 * ⚠ 배지를 되살리면 `LandingPage.styled.ts` 의 보정 룰과 이 검사를 **함께** 되살려라.
 */
