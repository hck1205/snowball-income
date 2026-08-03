import { BRAND_GLYPH_COPY } from './BrandGlyph.utils';
import type { BrandGlyphProps } from './BrandGlyph.types';
import { Coin, GlyphRoot, Mark } from './BrandGlyph.styled';

/**
 * 브랜드 심볼 — **아기 하마**.
 *
 * ## 🔴 손으로 그린 SVG 에서 실제 자산으로 갈아탔다 (2026-08-03)
 * 처음에는 이 부품이 직접 그린 라인아트 SVG 였다. 정식 자산이 없던 시점의 임시방편이었는데,
 * **실제로 렌더해 보니 20~32px 에서 하마로 읽히지 않았다** — 파란 얼룩 하나였다. 그런데 그 상태로
 * 앱 16곳에 들어가 있었다. 3D 렌더를 축소한 `hippo-mark.png` 는 같은 크기에서 귀·눈·벌린 입이
 * 살아남는다(32px 실측 확인). **눈으로 확인하지 않은 그림을 부품에 넣지 마라 — 이게 그 사례다.**
 *
 * ## 그래서 색을 정할 수 없다
 * 래스터라 `currentColor` 를 따르지 않는다. 하마는 언제나 브랜드 보라다.
 * 🔴 그 대신 **어떤 면 위에도 얹히도록** 배경을 알파로 뚫어 두었다(네이비 패널·흰 면 양쪽 확인).
 * ⚠ 색을 바꿔야 하는 자리(예: 단색 실루엣이 필요한 인쇄)가 생기면 그때는 이 부품이 아니라
 *   **별도 실루엣 자산**을 만들어라. `filter` 로 억지로 물들이지 마라 — 3D 음영이 뭉개진다.
 *
 * ## 접근성
 * 기본은 **장식**(`alt=""`)이다. 옆에 워드마크나 제목이 이름을 말하므로 두 번 읽히면 소음이다.
 * 이 그림이 이름을 져야 하는 자리에서만 `title` 을 넘겨라.
 *
 * ## 성능
 * ⚠ 마크는 43KB 다. 한 화면에 여러 번 나와도 **같은 URL 이라 브라우저가 한 번만 받는다.**
 *   16px 자리에 256px 원본을 쓰는 셈이지만, 크기별 자산을 나누면 캐시가 쪼개져 오히려 손해다.
 */
export default function BrandGlyph({ size = 20, accent = false, title }: BrandGlyphProps) {
  return (
    <GlyphRoot $size={size} role={title ? 'img' : undefined} aria-label={title}>
      <Mark
        src="/hippo-mark.png"
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        aria-hidden={title ? undefined : true}
      />
      {/*
        금화. 🔴 **네이비 패널 위에서만 켜라** — 밝은 면 위 금색은 1.83:1 이다.
        하마 주둥이가 오른쪽 위로 열려 있어 금화는 반드시 그쪽이다(자산 방향이 배치를 정한다).
      */}
      {accent ? (
        <Coin
          src="/coin.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : null}
      {title ? null : <span hidden>{BRAND_GLYPH_COPY.decorative}</span>}
    </GlyphRoot>
  );
}
