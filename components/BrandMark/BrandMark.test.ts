import { createElement } from 'react';
import { render } from '@testing-library/react';
import BrandMark from './BrandMark';

describe('BrandMark', () => {
  it('renders at the requested size', () => {
    const { container } = render(createElement(BrandMark, { size: 40 }));
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });

  /**
   * 마크 옆에 워드마크가 텍스트로 존재한다. 마크까지 접근성 트리에 노출하면
   * 스크린리더가 로고를 두 번 읽는다.
   */
  it('is decorative and hidden from the accessibility tree', () => {
    const { container } = render(createElement(BrandMark, {}));

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * 한 화면에 마크가 두 번 렌더될 수 있다(헤더 + 드로어). SVG gradient id가 충돌하면
   * 뒤에 렌더된 마크의 색이 앞의 defs를 참조해 테마 전환·언마운트 시 깨진다.
   */
  it('keeps gradient ids unique across instances', () => {
    const { container } = render(
      createElement('div', null, createElement(BrandMark, {}), createElement(BrandMark, {}))
    );

    const ids = Array.from(container.querySelectorAll('linearGradient')).map((node) => node.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
