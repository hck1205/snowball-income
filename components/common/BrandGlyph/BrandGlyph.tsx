import type { BrandGlyphProps } from './BrandGlyph.types';

/**
 * 브랜드 심볼 — **입을 벌린 아기 하마**(단색 라인아트).
 *
 * ## 왜 3D 렌더가 아니라 이것인가
 * 브랜드 키트의 마스코트는 부드러운 음영이 들어간 3D 렌더다. 그건 **240px 히어로·공유 카드용**이고,
 * 헤더 워드마크 옆(20px)이나 파비콘(16px)으로 줄이면 음영이 뭉개져 보라색 얼룩이 된다.
 * 그래서 작은 자리에는 **같은 캐릭터의 평면 실루엣**을 따로 둔다 — 두 그림이 한 캐릭터로 읽히도록
 * 실루엣(위로 벌린 입 · 둥근 주둥이 · 작은 귀 · 물결)을 공유한다.
 *
 * ## 색
 * 🔴 색을 **스스로 정하지 않는다** — 전부 `currentColor` 다. 호출부가 `color.identity`(헤더)나
 * `color.onPanel`(네이비 패널) 을 주면 그 색으로 그려진다. 하드코딩 hex 금지 규칙을 부품 안에서 지키는 방법이다.
 * ⚠ 금색은 여기서 쓰지 마라 — 밝은 면 위 금색은 1.83:1 이다(2026-08-03 실측). 금화는 네이비 패널 위에서만
 *   `accent` prop 으로 켠다.
 *
 * ## 접근성
 * 기본은 **장식**(`aria-hidden`)이다. 워드마크 텍스트가 바로 옆에서 이름을 말하므로 두 번 읽히면 소음이다.
 * 이름을 이 그림이 져야 하는 자리(파비콘 대체·아이콘 단독 버튼)에서만 `title` 을 넘겨라.
 *
 * ⚠ 이건 **임시 마크**다. 정식 일러스트 자산이 들어오면 이 파일을 교체하되, `currentColor` 계약과
 *   24 viewBox 는 유지하라 — 호출부가 그 둘에 기대고 있다.
 */
export default function BrandGlyph({ size = 20, accent = false, title }: BrandGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* 아래턱 — 위턱과 벌어져 있어 '먹는 중'이 실루엣만으로 읽힌다. */}
      <path
        d="M7.4 15.1c0-1.2 1.5-2.1 3.4-2.1h4.9c1.6 0 2.9.8 2.9 1.8 0 1.5-2.1 2.7-5.2 2.7-3.4 0-6-1-6-2.4Z"
        fill="currentColor"
      />

      {/* 머리 + 위로 들린 주둥이. 하마의 특징인 눈·귀가 정수리에 붙어 있다. */}
      <path
        d="M3.2 12.6c0-3.1 2.3-5.4 5.6-5.4 2.2 0 3.7.9 4.6 2.2l3.6-2.1c.9-.5 2 .1 2 1.1v2.5c0 1-.6 1.7-1.5 1.9l-3.4.7c-.9.9-2.4 1.4-4.3 1.4-3.7 0-6.6-1.3-6.6-2.3Z"
        fill="currentColor"
      />

      {/* 귀 — 실루엣에서 하마임을 가르는 가장 작은 단서라 지우지 마라. */}
      <circle cx="6.5" cy="6.4" r="1.6" fill="currentColor" />

      {/* 눈. 몸통과 같은 색이면 사라지므로 배경색으로 뚫는다(면이 아니라 구멍이다). */}
      <circle cx="8.1" cy="10.4" r="1.05" fill="var(--sb-surface, #fff)" />

      {/* 물결 — 물에 반쯤 잠긴 자세를 두 줄로 압축한다. 16px 에서도 살아남는 최소 표현이다. */}
      <path
        d="M2.6 19.2h6.2M11.4 19.2h9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* 금화 — 네이비 패널 위에서만 켠다(밝은 면 위 금색은 1.83:1 로 불가). */}
      {accent ? <circle cx="19.6" cy="4.6" r="2.6" fill="currentColor" opacity="0.9" /> : null}
    </svg>
  );
}
