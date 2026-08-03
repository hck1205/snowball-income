import styled from '@emotion/styled';
import { color } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 액센트 스코프 — 티커별 색을 CSS 변수로 주입                                     */
/* -------------------------------------------------------------------------- */

/**
 * 잉크를 자기 면에 섞는 비율. `--tk-soft`(아웃라인 버튼 hover)와 `--tk-active-bg`(히어로 캡 ·
 * 목차 활성)가 **같은 값을 쓴다** — 두 자리 모두 그 면 위에 `--tk-text` 를 그대로 얹기 때문이다.
 *
 * 🔴 **이 숫자를 올리지 마라.** 자기 잉크를 섞은 면은 잉크가 진할수록 면도 진해져 **대비가 같이
 * 깎인다.** 16% 였을 때 sunset 다크에서 VYM 잉크(#e0808f)가 **4.47:1** 로 AA(4.5)를 미달했다
 * (2026-08-03, `test/ticker/tickerAccentContrast.test.ts` 를 새로 세우자마자 잡힌 실측 결함).
 * 12% 로 내려 최악값이 **4.81:1** 이 됐고, 면 자체는 여전히 서피스 대비 1.18~1.25:1 로 판이 보인다
 * (허브 카드의 중립 캡 `surface-sunken` 1.11~1.25 와 같은 대역이다 — 두 지면의 캡이 같은 무게로 앉는다).
 * 실측 곡선: 8% → AA 5.15 / 면 1.11 · 12% → 4.81 / 1.18 · 14% → 4.65 / 1.22 · 16% → **4.47** / 1.25.
 */
export const INK_WASH = '12%';

/**
 * 티커별 액센트를 페이지 루트에 주입하는 스코프.
 *
 * 인라인 style 로 원시 값(`--tk-from/to/text-light/text-dark`)만 받고, 여기서 테마-인지 파생 변수
 * (`--tk-text/gradient/soft/border/active-bg/solid`)를 만든다. 장식 컴포넌트는 이 파생 변수만 참조하므로
 * **액센트 미지정 티커는 기본 브랜드 팔레트로 자동 폴백**한다(아래 기본값). soft/border 는 `--tk-text` 를
 * 서피스와 color-mix 해 파생해 라이트/다크 전환을 리렌더 없이 따라간다.
 */
export const AccentScope = styled.div`
  /* 기본(액센트 미지정) = 앱 브랜드 팔레트 */
  --tk-gradient: ${color.gradientAurora};
  --tk-text: ${color.brandText};
  --tk-soft: ${color.brandSubtle};
  --tk-border: ${color.brandBorder};
  --tk-active-bg: ${color.brandSubtle};
  --tk-solid: ${color.brand};

  &[data-accent='true'] {
    --tk-text: var(--tk-text-light);
    --tk-gradient: linear-gradient(120deg, var(--tk-from), var(--tk-to));
    --tk-solid: var(--tk-from);
    --tk-soft: color-mix(in srgb, var(--tk-text) ${INK_WASH}, ${color.surface});
    --tk-border: color-mix(in srgb, var(--tk-text) 40%, transparent);
    /* 🔴 두 워시는 같은 비율을 쓴다 — 위 INK_WASH 주석의 실측(16% 는 AA 미달)이 그 이유다. */
    --tk-active-bg: color-mix(in srgb, var(--tk-text) ${INK_WASH}, ${color.surface});

    /* 다크 서피스에서는 액센트 기준색을 밝은 쪽으로 — soft/border 는 --tk-text 참조라 자동 반영. */
    @media (prefers-color-scheme: dark) {
      --tk-text: var(--tk-text-dark);
    }
    /*
     * 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다.
     *
     * 🔴 조상 선택자는 반드시 html[...] 로 쓴다 — :root[...] & 는 **동작하지 않는다.**
     * stylis 는 콜론으로 시작하는 중첩 선택자를 "부모에 붙는 의사선택자"로 보고 부모를 앞에
     * 덧붙이는데, 그 결과가 .css-x[data-accent]:root[data-theme='dark'] .css-x[data-accent] 라
     * **영원히 매치되지 않는다**(2026-07-30 실측: 앱 토글로 강제 다크를 켜면 액센트 텍스트가
     * 라이트 값으로 남아 대비가 약 2.0:1 까지 떨어졌다). html 은 콜론으로 시작하지 않아
     * 그대로 조상 선택자로 나간다. 허브 카드(TickerHubPage/styled/)가 같은 처방을 쓴다.
     */
    html[data-theme='light'] & {
      --tk-text: var(--tk-text-light);
    }
    html[data-theme='dark'] & {
      --tk-text: var(--tk-text-dark);
    }
  }
`;
