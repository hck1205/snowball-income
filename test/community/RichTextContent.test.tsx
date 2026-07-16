import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RichTextContent } from '@/components/community/RichTextContent';

/** 렌더 시점의 XSS 경계 — 저장된 본문 HTML을 sanitize 후에만 DOM에 넣는다. */
describe('RichTextContent', () => {
  it('허용 서식은 실제 DOM 요소로 렌더한다', () => {
    const { container } = render(<RichTextContent html="<p>안녕 <strong>세상</strong></p>" />);

    expect(container.querySelector('strong')?.textContent).toBe('세상');
    expect(container.textContent).toContain('안녕 세상');
  });

  it('<script>는 DOM에 들어가지 않는다', () => {
    const { container } = render(
      <RichTextContent html={'<p>본문</p><script>window.__pwned = true;</script>'} />
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('본문');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('허용되지 않은 이미지의 onerror는 렌더되지 않는다', () => {
    const { container } = render(<RichTextContent html={'<img src="x" onerror="alert(1)">글'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('글');
  });

  it('빈/공백 본문은 아무것도 렌더하지 않는다 (null)', () => {
    const { container } = render(<RichTextContent html="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
