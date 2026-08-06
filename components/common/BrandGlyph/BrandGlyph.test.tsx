import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandGlyph } from './index';

/**
 * 브랜드 심볼의 계약.
 *
 * 🔴 이 파일은 한 번 통째로 다시 쓰였다(2026-08-03). 종전에는 손으로 그린 **인라인 SVG** 를
 * 검사했는데(viewBox 24 고정 · currentColor · circle 개수), 그 그림이 20~32px 에서 하마로
 * 읽히지 않아 실제 자산(래스터)으로 갈아탔다. 그때 SVG 내부를 단정하던 검사들은 **낡은 기대값**이라
 * 구현을 되돌리는 대신 계약을 다시 적었다 — 지금 잠그는 것은 "무엇으로 그리는가"가 아니라
 * **"어디에 놓여도 깨지지 않는 성질"** 이다.
 */
describe('BrandGlyph', () => {
  /**
   * 🔴 기본은 **장식**이다 — 옆에 워드마크나 제목이 이름을 말하므로 두 번 읽히면 소음이다.
   * 그래서 이름으로 찾을 수 없어야 한다.
   */
  it('기본은 장식이라 접근성 트리에 이름이 없다', () => {
    const { container } = render(<BrandGlyph />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('title 을 주면 그때만 이름을 진다', () => {
    render(<BrandGlyph title="Hungry Hippo" />);

    expect(screen.getByRole('img', { name: 'Hungry Hippo' })).toBeInTheDocument();
  });

  /** 무대가 정사각이라야 옆 글자와의 정렬이 흔들리지 않는다. */
  it('size 가 무대의 가로·세로에 그대로 간다', () => {
    const { container } = render(<BrandGlyph size={48} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.width || getComputedStyle(root).width).toContain('48');
    expect(container.querySelector('img')).toHaveAttribute('width', '48');
  });

  /**
   * 🔴 금화는 **네이비 패널 위에서만** 켠다(밝은 면 위 금색 1.83:1).
   * 기본이 꺼져 있어야 "모르고 켜는" 사고가 안 난다 — 켜려면 호출부가 명시적으로 결정해야 한다.
   */
  it('금화는 기본으로 꺼져 있고 accent 로만 켜진다', () => {
    const { container, rerender } = render(<BrandGlyph />);
    const coins = () => [...container.querySelectorAll('img')].filter((img) => img.getAttribute('src')?.includes('coin'));

    expect(coins()).toHaveLength(0);

    rerender(<BrandGlyph accent />);
    expect(coins()).toHaveLength(1);
    // 금화는 언제나 장식이다 — 하마가 이미 브랜드를 말한다.
    expect(coins()[0]).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * ⚠ 여러 자리에 동시에 나오므로 지연 로딩이 기본이어야 한다.
   * 첫 화면에서 즉시 필요한 자리는 호출부가 아니라 **브라우저 우선순위**가 처리한다.
   */
  it('마크는 지연 로딩한다', () => {
    const { container } = render(<BrandGlyph />);

    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });
});
