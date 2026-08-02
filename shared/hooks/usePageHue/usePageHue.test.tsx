import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PAGE_HUE_TOKEN, PAGE_HUE_VAR, THEME_PRESETS } from '@/shared/styles';
import type { PageHueName, ThemeTokens } from '@/shared/styles';
import { usePageHue } from './usePageHue';
import { resolvePageHue } from './usePageHue.utils';

/**
 * 이 화면들의 **얼굴색이 실제로 갈리는가**를 재는 가드.
 *
 * 왜 필요한가: 이 앱의 히어로 3벌은 오래도록 같은 배경·같은 테두리를 썼고, 어떤 테스트도
 * 그것을 문제 삼지 않았다(색은 렌더 테스트가 보지 않는다). "전 라우트를 같은 hue 로 되돌리는"
 * 뮤턴트에서 반드시 빨개져야 한다 — 그래서 **값이 맞는지**가 아니라 **서로 다른지**를 단정한다.
 */

const HueProbe = () => {
  usePageHue();
  return null;
};

const readHue = () => document.documentElement.style.getPropertyValue(PAGE_HUE_VAR);

const renderAt = (pathname: string) =>
  render(
    createElement(
      MemoryRouter,
      { initialEntries: [pathname] },
      createElement(Routes, null, createElement(Route, { path: '*', element: createElement(HueProbe) }))
    )
  );

describe('페이지 정체성 hue', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty(PAGE_HUE_VAR);
  });

  it('라우트마다 다른 hue 를 문서 루트에 발행한다', () => {
    const byRoute = new Map<string, string>();

    for (const pathname of ['/', '/dividend/portfolio', '/dividend/calendar', '/community/portfolio']) {
      const view = renderAt(pathname);
      byRoute.set(pathname, readHue());
      view.unmount();
    }

    expect(byRoute.get('/')).toBe(PAGE_HUE_TOKEN.identity);
    expect(byRoute.get('/dividend/portfolio')).toBe(PAGE_HUE_TOKEN.accentAlt);
    expect(byRoute.get('/dividend/calendar')).toBe(PAGE_HUE_TOKEN.accent);
    expect(byRoute.get('/community/portfolio')).toBe(PAGE_HUE_TOKEN.brand);

    // 🔴 핵심 단정 — 네 화면이 **서로 다른 색**이어야 한다. 값 자체가 바뀌는 것은 자유지만
    //    둘 이상이 같아지는 순간 "탭을 옮겨도 같은 화면"이 되돌아온다.
    const distinct = new Set(byRoute.values());
    expect(distinct.size).toBe(byRoute.size);
    // 빈 문자열(=미발행)이 섞여 있으면 위 size 비교가 우연히 통과할 수 있다.
    expect([...distinct].every((value) => value.length > 0)).toBe(true);
  });

  it('티커 랜딩에서는 hue 를 발행하지 않는다 — 그 화면은 티커별 액센트(--tk-*)가 색을 소유한다', () => {
    const first = renderAt('/dividend/calendar');
    expect(readHue()).toBe(PAGE_HUE_TOKEN.accent);
    first.unmount();

    const second = renderAt('/ticker/schd');
    // 앞 라우트의 값이 남으면 티커 화면이 남의 얼굴색을 쓰게 된다.
    expect(readHue()).toBe('');
    second.unmount();
  });

  it('같은 트리 안에서 라우트가 바뀌면 hue 도 따라 바뀐다', () => {
    const view = render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/', '/dividend/portfolio'], initialIndex: 0 },
        createElement(Routes, null, createElement(Route, { path: '*', element: createElement(HueProbe) }))
      )
    );
    expect(readHue()).toBe(PAGE_HUE_TOKEN.identity);
    view.unmount();
  });

  it('하위 경로도 같은 hue 를 받는다 — 상세로 들어갔다고 페이지 얼굴이 바뀌면 안 된다', () => {
    expect(resolvePageHue('/community/portfolio/123')).toBe('brand');
    expect(resolvePageHue('/community/board')).toBe('brand');
    expect(resolvePageHue('/dividend/portfolio')).toBe('accentAlt');
    expect(resolvePageHue('/ticker/all')).toBeNull();
  });

  /**
   * 🔴 `/ledger` 는 `/dividend/portfolio` 와 **같은 얼굴색이어야 한다** — 둘 다 "내가 직접 넣은 실측
   * 데이터"라는 한 축이다. 위쪽 가드들은 "라우트마다 색이 갈린다"를 단정하므로 이 쌍을 그 목록에
   * 넣으면 안 된다(갈리면 안 되는 쌍이다). 대신 **같음**을 여기서 명시적으로 잠근다.
   */
  it('가계부는 포트폴리오와 같은 hue 를 쓴다 — 같은 축이라 색이 갈리면 안 된다', () => {
    expect(resolvePageHue('/ledger')).toBe('accentAlt');
    expect(resolvePageHue('/ledger')).toBe(resolvePageHue('/dividend/portfolio'));
  });

  /**
   * 🔴 `/simulator` 와 `/` 는 **같은 화면**이다(2026-08-01 라우트 이전의 중간 상태). 위 "라우트마다
   * 색이 갈린다" 목록에 넣으면 안 되는 또 하나의 쌍이라 여기서 **같음**을 명시적으로 잠근다.
   *
   * 이 가드가 없으면 새 경로가 매핑 밖으로 떨어져 폴백이 되어도 **전 스위트가 그린**이다 —
   * 색은 렌더 테스트가 보지 않기 때문이다. 두 방향을 다 잠근다: 새 경로를 빠뜨려도, 이전이
   * 끝나기 전에 `/` 를 지워도 빨개진다.
   */
  it('시뮬레이터는 두 경로에서 같은 얼굴색이다 — `/simulator` 와 `/` 가 모두 identity', () => {
    expect(resolvePageHue('/simulator')).toBe('identity');
    expect(resolvePageHue('/')).toBe('identity');
    expect(resolvePageHue('/simulator')).toBe(resolvePageHue('/'));
  });

  it('시뮬레이터 hue 는 실제로 문서 루트에 발행된다 (`/simulator` 방문)', () => {
    const view = renderAt('/simulator');
    expect(readHue()).toBe(PAGE_HUE_TOKEN.identity);
    view.unmount();
  });

  /* ------------------------------------------------------------------------ */

  /**
   * 🔴 **토큰 이름이 다른 것과 실제 색이 다른 것은 별개다.**
   *
   * 위 단정들은 `var(--sb-identity)` ≠ `var(--sb-accent)` 라는 **문자열**만 본다. 그런데 프리셋이
   * 두 역할에 같은 hex 를 배정하면 이름은 갈려도 **화면은 같은 색**이다 — 이 레포가 반복해서 겪은
   * "소스는 맞는데 렌더가 틀린" 결함의 정확한 형태다. 그래서 8프리셋 × light/dark = 16조합의
   * **해석된 hex**로 다시 잰다.
   *
   * 아래 목록은 "현재 실제로 겹치는 곳"이다(2026-07-31 실측). **줄이는 방향의 변경은 환영**이고
   * 그때 이 목록을 지우면 된다. 늘어나면 그건 회귀다 — 어느 화면과 어느 화면이 같은 얼굴이
   * 되었는지 실패 메시지가 그대로 말한다.
   */
  it('16개 프리셋×모드에서 라우트 hue 가 실제로 같은 색이 되는 곳을 고정한다', () => {
    const ROUTES = ['/', '/dividend/portfolio', '/dividend/calendar', '/community/portfolio'] as const;

    /** `var(--sb-accent-alt)` → `accent-alt`. 발행되는 값 그대로에서 뽑아야 매핑 오류까지 잡힌다. */
    const tokenKeyOf = (hue: PageHueName) =>
      PAGE_HUE_TOKEN[hue].replace(/^var\(--sb-/, '').replace(/\)$/, '') as keyof ThemeTokens;

    const collisions: string[] = [];
    for (const [presetId, preset] of Object.entries(THEME_PRESETS)) {
      for (const mode of ['light', 'dark'] as const) {
        const tokens = preset[mode];
        for (let i = 0; i < ROUTES.length; i += 1) {
          for (let j = i + 1; j < ROUTES.length; j += 1) {
            const a = resolvePageHue(ROUTES[i]);
            const b = resolvePageHue(ROUTES[j]);
            if (a === null || b === null) continue;
            if (tokens[tokenKeyOf(a)] === tokens[tokenKeyOf(b)]) {
              collisions.push(`${presetId}/${mode}: ${ROUTES[i]} ≡ ${ROUTES[j]} (${tokens[tokenKeyOf(a)]})`);
            }
          }
        }
      }
    }

    /*
     * 🔴 **0 이다. 여기에 항목을 다시 추가하지 마라.**
     *
     * 2026-07-31 실측 당시에는 두 건이 있었다 — velog/light 와 aurora/light 에서 `identity` 가
     * `brand[600]` 이라 각각 accent·brand 와 **해석된 hex 가 같았다**(#0a6da3). 이름은 갈렸는데
     * 화면은 한 색이라, "페이지마다 얼굴색"이 기본 프리셋에서 통째로 no-op 이었다.
     *
     * 2026-08-01 랜딩 리워크에서 "색이 2가지뿐"의 구조적 원인으로 재확인돼
     * `sharedTokens.ts` 의 `identity` 를 `brand[600]` → **`brand[500]`** 으로 옮겨 해소했다
     * (`brand[700]` 은 `identity-text` 와 값이 붕괴해 기각 — 그 파일 주석 참고).
     *
     * 늘어나면 회귀다. 어느 화면과 어느 화면이 같은 얼굴이 됐는지 실패 메시지가 그대로 말한다.
     */
    expect(collisions).toEqual([]);
  });
});
