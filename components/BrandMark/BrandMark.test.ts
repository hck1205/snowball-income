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
});
