import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

/**
 * 위계 3단(`tone`)의 **렌더 절반**. 소스 계약(테두리·그림자를 동시에 선언하지 않는다)은
 * `test/shared/cardElevationHierarchy.test.ts` 가 잡는다 — jsdom 은 `border: 1px solid var(...)`
 * 처럼 var() 가 든 단축 속성을 계산값에서 통째로 버려서 테두리를 관측할 수 없다.
 * box-shadow 는 문자열 그대로 계산되므로 **tone → 그림자 배선**은 여기서 실제 렌더로 확인한다.
 */
const boxShadowOf = (tone: 'default' | 'raised' | 'sunken' | 'wash'): string => {
  const { container } = render(
    createElement(Card, { tone, title: '제목', children: createElement('div', null, '내용') })
  );
  return getComputedStyle(container.firstElementChild as HTMLElement).boxShadow;
};

describe('Card', () => {
  it('renders title and children', () => {
    render(createElement(Card, { title: '제목', children: createElement('div', null, '내용') }));

    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('주역 카드(raised)만 그림자로 뜬다 — 그림자를 쓰는 층은 하나뿐이다', () => {
    expect(boxShadowOf('raised')).toBe('var(--sb-shadow-2)');
  });

  it('본문·부속·장식 카드는 그림자가 없다 (테두리/면색이 위계를 말한다)', () => {
    // 예전에는 셋 다 e1 을 갖고 있었고, 그 그림자가 보이지 않아 카드들이 전부 같은 무게로 보였다.
    expect(boxShadowOf('default')).toBe('none');
    expect(boxShadowOf('sunken')).toBe('none');
    expect(boxShadowOf('wash')).toBe('none');
  });

  it('부속 카드(sunken)는 가라앉은 면색을 쓴다 — 곁가지 가정을 본문 결과로 오해하지 않게', () => {
    const { container } = render(
      createElement(Card, { tone: 'sunken', title: '전량 매도한다면', children: createElement('div', null, '세금') })
    );

    expect(container.firstElementChild).toHaveStyle({ background: 'var(--sb-surface-sunken)' });
    expect(screen.getByText('전량 매도한다면')).toBeInTheDocument();
  });

  it('주역 카드의 면은 surface-raised — 다크에서 위계를 만드는 유일한 수단이다', () => {
    const { container } = render(
      createElement(Card, { tone: 'raised', title: '결과', children: createElement('div', null, '내용') })
    );

    expect(container.firstElementChild).toHaveStyle({ background: 'var(--sb-surface-raised)' });
  });
});
