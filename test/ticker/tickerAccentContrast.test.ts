// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import { THEME_PRESETS } from '@/shared/styles/presets';
import { contrastRatio, hexToRgb, roundRatio } from '@/shared/styles/contrast';
import type { ThemeTokens } from '@/shared/styles/semantic';

/**
 * **티커 고유색(`--tk-*`)이 실제로 앉는 면들 위에서 읽히는가.**
 *
 * `shared/styles/contrast.test.ts` 는 **토큰끼리**의 쌍을 잰다. 그런데 세 티커 지면
 * (`/ticker/all` · `/ticker/:name` · `/ticker/compare`)의 잉크는 토큰이 아니라 **티커 데이터**다
 * (`shared/constants/tickers/*.ts` 의 `accent.textLight/textDark`). 그래서 그 색들은 지금까지
 * **어느 게이트도 받지 않고** 있었다 — 티커가 하나 늘 때마다 검증되지 않은 색이 하나 늘었다.
 *
 * 2026-08-03 흰 캔버스 전환에서 그 공백이 실제 위험이 됐다. 라이트 `bg` 가 순백이 되면서
 * 카드·캡·표의 면색 사다리를 전부 다시 골랐고, **그 위에 앉는 것이 이 티커 잉크들**이기 때문이다.
 *
 * ## 재는 세 자리 (전부 소스에 실재하는 조합만)
 *  1. `surface`        — 허브 카드 심볼 · 표의 티커 링크 · 상세 히어로 심볼 · 관련 티커 심볼
 *  2. `surface-sunken` — 허브 카드의 **중립 캡 판**(`--tk-cap-fill`, `TickerHubPage/styled/`)
 *  3. `--tk-active-bg` — 상세 히어로 캡 · 목차 활성 항목. `color-mix(--tk-text 16%, surface)` 라
 *     **잉크를 자기 면에 섞어 만든다** → 잉크가 진할수록 면도 진해져 대비가 같이 깎인다.
 *     이 앱에서 AA 여유가 가장 얇은 지점이고, 그래서 이 파일이 존재하는 가장 큰 이유다.
 *
 * ⚠ 순회는 **전 프리셋(8) × light/dark = 16테마 × 티커 전종**이다. 티커를 추가하면 순회가
 *   자동으로 늘어난다 — 새 액센트를 감으로 고르면 여기서 빨개진다.
 * ⚠ 값을 못 맞추겠다고 기준(4.5)을 내리지 마라. 내려야 할 것은 **그 티커의 잉크**다(더 어둡게 /
 *   다크에서는 더 밝게). 색상은 자유롭고, 명도만 제약이다.
 */

const AA_TEXT = 4.5;

/**
 * `--tk-soft` · `--tk-active-bg` 의 파생 비율(`TickerDetailPage/styled/accent.ts` 의 `INK_WASH`).
 * 아래 소스 대조 단정이 두 값이 갈리는 순간을 잡는다 — 갈리면 이 테스트가 **실제와 다른 색**을 잰다.
 */
const INK_WASH_PERCENT = 12;

const THEMES: ReadonlyArray<[string, ThemeTokens, 'light' | 'dark']> = Object.entries(THEME_PRESETS).flatMap(
  ([id, preset]) =>
    [
      [`${id}/light`, preset.light, 'light'],
      [`${id}/dark`, preset.dark, 'dark']
    ] as const
);

/** 액센트가 **있는** 티커만 잰다(없는 티커는 검증 완료된 브랜드 팔레트로 폴백한다). */
const ACCENTS = TICKER_CONTENT_LIST.filter((entry) => entry.accent).map((entry) => ({
  ticker: entry.ticker,
  light: entry.accent!.textLight,
  dark: entry.accent!.textDark
}));

/** `color-mix(in srgb, ink {pct}%, surface)` 의 결과 색. CSS 와 같은 sRGB 채널 보간이다. */
const mixInto = (ink: string, surface: string, pct: number): string => {
  const a = hexToRgb(ink);
  const b = hexToRgb(surface);
  const channel = (x: number, y: number): string =>
    Math.round((x * pct + y * (100 - pct)) / 100)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`;
};

/** 한 자리의 최악값 한 줄. 실패 메시지가 "어느 티커·어느 테마"를 바로 말하게 한다. */
const worst = (
  place: string,
  backgroundOf: (tokens: ThemeTokens, ink: string) => string
): { place: string; theme: string; ticker: string; ink: string; background: string; ratio: number } => {
  let found = { place, theme: '', ticker: '', ink: '', background: '', ratio: Number.POSITIVE_INFINITY };

  for (const [theme, tokens, mode] of THEMES) {
    for (const accent of ACCENTS) {
      const ink = accent[mode];
      const background = backgroundOf(tokens, ink);
      const ratio = contrastRatio(ink, background);
      if (ratio < found.ratio) found = { place, theme, ticker: accent.ticker, ink, background, ratio };
    }
  }

  return found;
};

const PLACES = [
  /** 카드 심볼 · 표 링크 · 히어로 심볼 — 티커 색이 가장 자주 서는 자리. */
  { place: 'surface', backgroundOf: (tokens: ThemeTokens) => tokens.surface },
  /** 허브 카드의 중립 캡 판. 2026-08-03 이전에는 `brand-subtle` 이었다. */
  { place: 'surface-sunken (허브 카드 캡)', backgroundOf: (tokens: ThemeTokens) => tokens['surface-sunken'] },
  /** 상세 히어로 캡 · 목차 활성 — 잉크를 자기 면에 섞는 자리. */
  {
    place: '--tk-active-bg · --tk-soft (상세 히어로 캡 · 목차 활성 · 아웃라인 hover)',
    backgroundOf: (tokens: ThemeTokens, ink: string) => mixInto(ink, tokens.surface, INK_WASH_PERCENT)
  }
] as const;

describe('티커 액센트 잉크 — 실제로 앉는 면 위에서 AA 를 지킨다', () => {
  it('액센트를 가진 티커가 실제로 순회된다 (목록이 비면 아래 단정이 조용히 통과한다)', () => {
    expect(ACCENTS.length).toBeGreaterThanOrEqual(20);
    expect(THEMES.length).toBe(16);
  });

  /**
   * 🔴 이 테스트가 재는 면은 소스가 만드는 면과 **같은 비율**이어야 한다. 비율이 갈리면 여기는
   * 그린인데 화면은 AA 미달인 상태가 된다 — 가드가 거짓말하는 가장 흔한 방식이다.
   */
  it('워시 비율이 소스(INK_WASH)와 갈리지 않는다', () => {
    const source = readFileSync(
      resolve(__dirname, '../../pages/Ticker/TickerDetailPage/styled/accent.ts'),
      'utf-8'
    );

    expect(source).toContain(`const INK_WASH = '${INK_WASH_PERCENT}%'`);
    // 두 파생 변수 모두 그 상수를 통해서만 비율을 받는다(하드코딩한 %가 남아 있으면 잡는다).
    expect(source).toContain('--tk-soft: color-mix(in srgb, var(--tk-text) ${INK_WASH}');
    expect(source).toContain('--tk-active-bg: color-mix(in srgb, var(--tk-text) ${INK_WASH}');
  });

  for (const { place, backgroundOf } of PLACES) {
    it(`${place} 위에서 전 티커 × 16테마가 4.5:1 이상이다`, () => {
      const result = worst(place, backgroundOf);

      expect(
        roundRatio(result.ratio),
        `${result.theme} · ${result.ticker} 잉크 ${result.ink} on ${result.background} = ${roundRatio(result.ratio)}:1`
      ).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }

  /**
   * 🔴 **캡 면을 브랜드 축으로 되돌리지 못하게 하는 회귀 가드.**
   *
   * 구 캡(`brand-subtle`)은 브랜드 hue 면 위에 **티커 hue** 잉크를 얹는 조합이었고, 다크에서
   * 최악 4.88:1 로 이 자리에서 가장 빠듯했다. 중립 판으로 바꾼 뒤 다크 최악값이 6.2 대로 올라갔다 —
   * 그 이득이 조용히 사라지지 않게 **두 자리를 나란히** 재서 비교한다.
   */
  it('중립 캡이 구 brand-subtle 캡보다 다크에서 더 안전하다', () => {
    const darkWorst = (backgroundOf: (tokens: ThemeTokens) => string): number => {
      let min = Number.POSITIVE_INFINITY;
      for (const [, tokens, mode] of THEMES) {
        if (mode !== 'dark') continue;
        for (const accent of ACCENTS) min = Math.min(min, contrastRatio(accent.dark, backgroundOf(tokens)));
      }
      return min;
    };

    const neutralCap = darkWorst((tokens) => tokens['surface-sunken']);
    const brandCap = darkWorst((tokens) => tokens['brand-subtle']);

    expect(roundRatio(neutralCap)).toBeGreaterThan(roundRatio(brandCap));
    // 구 값이 AA 를 겨우 넘던 지점이었다는 사실도 함께 남긴다(기록이 아니라 단정으로).
    expect(roundRatio(brandCap)).toBeLessThan(5);
  });
});
