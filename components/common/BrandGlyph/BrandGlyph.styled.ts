import styled from '@emotion/styled';

/**
 * 브랜드 심볼의 배치.
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱을 쓰지 마라 — 템플릿이 끊겨 앱이 부팅하지 않는다.
 * 🔴 색을 정하지 않는다 — 자산이 자기 색을 갖고 온다(BrandGlyph 주석의 근거 참조).
 */

/** 정사각 무대. 금화가 우상단 밖으로 살짝 나가야 하므로 overflow 를 자르지 않는다. */
export const GlyphRoot = styled.span<{ $size: number }>`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
`;

export const Mark = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

/**
 * 금화 — 하마 시선 끝.
 * 🔴 네이비 패널 위에서만 켠다(accent prop). 밝은 면 위 금색은 1.83:1 이다.
 */
export const Coin = styled.img`
  position: absolute;
  top: -14%;
  right: -18%;
  width: 46%;
  height: auto;
  object-fit: contain;
`;
