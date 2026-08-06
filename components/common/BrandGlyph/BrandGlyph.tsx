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
 * ## 🔴 그리고 같은 사고를 한 번 더 냈다 — 알파를 다시 뽑았다 (2026-08-04)
 * 위 교훈을 적어 두고도 **자산의 알파는 아무도 눈으로 안 봤다.** 다크 모드 44px 헤더에서
 * 하마의 **눈이 검은 구멍이고 이빨이 없었다.** 원인은 색상 키가 아니라 원본이다 —
 * `assets/brand/app_icon.png` 은 투명 원본이 아니라 **투명 체커보드가 구워진 합성물**이라
 * "흰 배경을 지운다"가 곧 "밝기 245~255 대역을 지운다"였고, 같은 대역에 있는 이빨·눈 흰자·
 * 물 하이라이트가 함께 뚫렸다. 실측(2px 침식한 안쪽에서 lum>230 인 픽셀 중 알파 255 의 비율):
 * ```
 *   hippo-mark.png   16.7% → 100.0%   (안쪽 밝은 픽셀 자체가   6px →  133px)
 *   hippo.png        41.1% →  99.9%   (                     209px → 1740px)
 * ```
 * 픽셀 **수**를 함께 보라 — 비율보다 이쪽이 사태를 말한다. 흰 그림의 대부분은 흐려진 게 아니라
 * 아예 지워져서 세어지지도 않았다. 그 자산이 15개 호출부에 실려 있었다.
 * 재생성 `npm run brand:assets` · 가드 `npm run brand:check`(이 지표가 90% 아래로 내려가면 실패).
 * 알고리즘(색상 키가 아니라 **연결성**을 쓰는 이유)과 그 근거 수치는
 * `tools/brand/rebuild-brand-assets.py` 머리말에 있다.
 * ⚠ 자산을 다시 만들 때 **타이트 크롭을 빠뜨리지 마라** — 파일 크기는 256×256 그대로인데
 *   그림만 18% 작아진다. 그 회귀도 `brand:check` 의 bbox 항목이 잡는다.
 *
 * ## 그래서 색을 정할 수 없다
 * 래스터라 `currentColor` 를 따르지 않는다. 하마는 언제나 브랜드 보라다.
 * 🔴 그 대신 **어떤 면 위에도 얹히도록** 배경을 알파로 뚫어 두었다(네이비 패널·흰 면 양쪽 확인).
 * ⚠ 색을 바꿔야 하는 자리(예: 단색 실루엣이 필요한 인쇄)가 생기면 그때는 이 부품이 아니라
 *   **별도 실루엣 자산**을 만들어라. `filter` 로 억지로 물들이지 마라 — 3D 음영이 뭉개진다.
 *
 * ## 🔴 다크에서 흰 판(wrapper)을 깔지 마라 — 알파를 고치면 필요 없다
 * "다크에서 하마가 안 보인다"는 증상의 원인은 **알파 파손**이었지 대비가 아니었다. 수리 후 실측 —
 * 하마 몸통 중앙값 #8670b3 과 다크 surface 의 ΔE: grape 43.1 · vivid 45.3 · navyGold 48.9 ·
 * velog 56.7 · sunset 57.9 · ink 58.2 · forest 61.3 · 브랜드 패널 44.4. 최악(grape 43.1)조차
 * 이 레포 자체 하한(identity-subtle↔surface ΔE≥5, 차트 시리즈 ≥20)의 두 배가 넘는다.
 * 반대로 흰 판은 세 가지를 부순다: ①다크 서피스 대비 16.05~17.85:1 로 **헤더에서 가장 밝은 것이
 * 제품 이름이 아니라 아이콘 받침**이 된다 ②라이트 프리셋 8개 중 7개의 surface 가 #ffffff 라
 * ΔE 0 으로 사라져 **모드마다 로고 실루엣이 달라진다** ③16px 인라인 자리에서는 흰 박스가
 * "깨진 이미지"로 읽힌다. 같은 판을 2026-08-03 에 이미 걷어낸 기록이 `ClosingCta.styled.ts` 에 있다.
 *
 * ## 🔴 숨은 설명 span 을 걷었다 (2026-08-03)
 * `hidden` 텍스트는 검색엔진이 신뢰하지 않으면서 `textContent` 는 오염시킨다 — 장식이 자기를
 * 품은 요소의 텍스트에 끼어들면 계약 테스트가 그 요소를 이름으로 집을 수 없게 된다.
 * 자세한 경위는 `HippoCoinScene.tsx` 의 같은 항목.
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
    </GlyphRoot>
  );
}
