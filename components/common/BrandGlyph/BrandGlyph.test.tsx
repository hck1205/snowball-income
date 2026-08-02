import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandGlyph } from './index';

/**
 * 브랜드 심볼의 계약을 잠근다. 그림이 예쁜지는 여기서 못 재지만(그건 눈으로 본다),
 * **어디에 놓여도 깨지지 않는 성질** 셋은 잴 수 있다.
 */
describe('BrandGlyph', () => {
  /**
   * 🔴 이 레포는 하드코딩 hex 를 금지한다. 부품이 색을 스스로 정하면 프리셋 8종·다크 전환을
   * 따라가지 못하고, 16테마 대비 검증 밖으로 나간다. 그래서 색은 전부 `currentColor` 다.
   * ⚠ 예외는 눈의 흰자 하나뿐이고, 그것도 `var(--sb-surface)` 라 테마를 따라간다.
   */
  it('색을 스스로 정하지 않는다 — 하드코딩 hex 가 없다', () => {
    const { container } = render(<BrandGlyph />);
    const svg = container.querySelector('svg')!;

    // 폴백 #fff 는 CSS 변수가 없을 때만 쓰이는 것이라 var() 안에 있어야 한다.
    const hexOutsideVar = svg.outerHTML.replace(/var\([^)]*\)/g, '').match(/#[0-9a-f]{3,8}/gi);
    expect(hexOutsideVar).toBeNull();
    expect(svg.outerHTML).toContain('currentColor');
  });

  /**
   * 기본은 **장식**이다 — 옆에 워드마크 텍스트가 이름을 말하므로 두 번 읽히면 소음이다.
   * 이름을 이 그림이 져야 하는 자리에서만 title 을 넘긴다.
   */
  it('기본은 장식이고, title 을 주면 이름을 진다', () => {
    const { container, rerender } = render(<BrandGlyph />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<BrandGlyph title="Hungry Hippo" />);
    expect(screen.getByRole('img', { name: 'Hungry Hippo' })).toBeInTheDocument();
  });

  /** viewBox 는 24 고정이다 — 호출부가 그 좌표계에 기대어 크기를 맞춘다. */
  it('size 를 바꿔도 viewBox 는 24 로 고정이다', () => {
    const { container } = render(<BrandGlyph size={48} />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '48');
  });

  /**
   * 🔴 금화는 **네이비 패널 위에서만** 켠다(밝은 면 위 금색 1.83:1). 기본이 꺼져 있어야
   * "모르고 켜는" 사고가 안 난다 — 켜려면 호출부가 명시적으로 결정해야 한다.
   */
  it('금화는 기본으로 꺼져 있다', () => {
    const { container, rerender } = render(<BrandGlyph />);
    const circles = () => container.querySelectorAll('circle').length;
    const withoutAccent = circles();

    rerender(<BrandGlyph accent />);
    expect(circles()).toBe(withoutAccent + 1);
  });
});
