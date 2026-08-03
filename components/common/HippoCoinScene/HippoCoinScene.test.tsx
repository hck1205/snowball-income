import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HippoCoinScene } from './index';

/**
 * 브랜드 연출(하마 + 금화)의 계약.
 *
 * 잠그는 것은 **그림을 무엇으로 그리는가**가 아니라 **어디에 놓여도 깨지지 않는 성질**이다 —
 * 자산이 다시 교체되어도(래스터 → SVG 등) 이 단정들은 그대로 살아야 한다.
 * 그래서 파일명·좌표·애니메이션 같은 구현 세부는 검사하지 않는다.
 */
describe('HippoCoinScene', () => {
  /** 금화는 하마와 별개의 그림이라 src 로 가른다 — 개수를 세는 유일한 방법이다. */
  const coinsIn = (container: HTMLElement) =>
    [...container.querySelectorAll('img')].filter((img) => img.getAttribute('src')?.includes('coin'));

  /**
   * 🔴 기본은 **장식**이다 — 옆의 제목·리드가 같은 말을 이미 한다.
   * 이름이 붙으면 스크린리더 사용자는 정보가 아닌 것을 정보로 받는다.
   */
  it('기본은 장식이라 접근성 트리에 이름이 없다', () => {
    const { container } = render(<HippoCoinScene />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('label 을 주면 그때만 이름을 진다', () => {
    render(<HippoCoinScene label="Hungry Hippo" />);

    expect(screen.getByRole('img', { name: 'Hungry Hippo' })).toBeInTheDocument();
  });

  /**
   * 금화가 곧 연출이다 — 하마 혼자면 "배당을 먹고 자란다"는 관계가 사라진다.
   * 그리고 금화는 언제나 장식이다(하마가 이미 브랜드를 말한다).
   */
  it('금화는 항상 함께 나오고 언제나 장식이다', () => {
    const { container } = render(<HippoCoinScene />);

    expect(coinsIn(container)).toHaveLength(1);
    expect(coinsIn(container)[0]).toHaveAttribute('aria-hidden', 'true');
  });

  /** 무대가 정사각이라야 옆 글자·버튼과의 정렬이 흔들리지 않는다. */
  it('size 가 무대와 하마의 치수에 그대로 간다', () => {
    const { container } = render(<HippoCoinScene size={280} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.width || getComputedStyle(root).width).toContain('280');
    expect(container.querySelector('img')).toHaveAttribute('width', '280');
  });

  /**
   * ⚠ 두 이미지가 합쳐 800KB 대다. 히어로(첫 화면)는 eager 가 맞지만 **접힘 아래**는 lazy 여야
   * 첫 페인트를 늦추지 않는다. 그 선택권이 호출부에 실제로 있는지를 잠근다.
   */
  it('로딩 전략은 기본 eager 이고 호출부가 lazy 로 바꿀 수 있다', () => {
    const { container, rerender } = render(<HippoCoinScene />);
    const loadings = () => [...container.querySelectorAll('img')].map((img) => img.getAttribute('loading'));

    expect(loadings()).toEqual(['eager', 'eager']);

    rerender(<HippoCoinScene loading="lazy" />);
    expect(loadings()).toEqual(['lazy', 'lazy']);
  });
});
