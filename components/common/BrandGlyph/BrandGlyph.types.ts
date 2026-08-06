export type BrandGlyphProps = {
  /** 한 변의 px. 헤더 워드마크 옆은 20, 파비콘 대체는 16, PDF 표지는 28. 기본 20. */
  size?: number;
  /**
   * 금화를 함께 그린다.
   * 🔴 **네이비 패널 위에서만 켜라** — 밝은 면 위 금색은 1.83:1 로 대비가 나오지 않는다(2026-08-03 실측).
   */
  accent?: boolean;
  /**
   * 넘기면 `role="img"` + `<title>` 이 붙어 **이름을 이 그림이 진다**.
   * 생략하면 장식(`aria-hidden`)이다 — 옆에 워드마크 텍스트가 있는 자리에서는 생략이 맞다.
   */
  title?: string;
};
