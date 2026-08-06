import { color } from '@/shared/styles';

/**
 * 원시 액센트(`--tk-from/to/text-light/text-dark`) → **테마 인지 파생 변수**.
 *
 * 🔴 카드(`CardScope`)와 표 행(`TableRow`)이 **같은 블록을 공유해야 한다.** 종전에 카드에만
 * 두었더니, 표 보기의 행은 원시 변수만 받고 파생이 없어 티커 색 귀가 통째로 그려지지 않았다
 * (실측 2026-08-03: `--tk-ribbon-from` 미정의 → linear-gradient 무효 → 귀 0px).
 * 파생 이름은 상세 페이지의 `AccentScope` 와 같다 — 같은 티커가 세 지면에서 같은 색으로 읽힌다.
 *
 * ⚠ 이 블록이 `card.ts`·`table.ts` 어느 한쪽에 살면 그 "공유"가 다시 끊긴다 — 그래서 별 파일이다.
 */
export const ACCENT_DERIVATION = `
  --tk-ink: var(--tk-fallback, ${color.brandText});
  --tk-text: var(--tk-text-light, var(--tk-ink));
  --tk-ribbon-from: var(--tk-from, var(--tk-ink));
  --tk-ribbon-to: var(--tk-to, var(--tk-ink));

  @media (prefers-color-scheme: dark) {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }

  /*
   * 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다.
   *
   * 🔴 조상 선택자는 반드시 'html[...]' 로 쓴다 — ':root[...] &' 는 **동작하지 않는다.**
   * stylis 는 콜론으로 시작하는 중첩 선택자를 "부모에 붙는 의사선택자"로 보고 부모를 앞에
   * 덧붙이는데, 그 결과가 '.css-x:root[data-theme="dark"] .css-x' 라 **영원히 매치되지 않는다**
   * (2026-07-30 실측: 강제 다크에서 액센트 텍스트가 라이트 값으로 남는다).
   */
  html[data-theme='light'] & {
    --tk-text: var(--tk-text-light, var(--tk-ink));
  }
  html[data-theme='dark'] & {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }
`;
