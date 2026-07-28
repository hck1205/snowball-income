import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders title and children', () => {
    render(createElement(Card, { title: '제목', children: createElement('div', null, '내용') }));

    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('부속 카드(sunken)는 떠 보이지 않는다 — 곁가지 가정을 본문 결과로 오해하지 않게', () => {
    const { container } = render(
      createElement(Card, { tone: 'sunken', title: '전량 매도한다면', children: createElement('div', null, '세금') })
    );

    expect(container.firstElementChild).toHaveStyle({ boxShadow: 'none' });
    expect(screen.getByText('전량 매도한다면')).toBeInTheDocument();
  });

  it('기본 카드는 그림자를 유지한다', () => {
    const { container } = render(createElement(Card, { title: '결과', children: createElement('div', null, '내용') }));

    expect(container.firstElementChild).not.toHaveStyle({ boxShadow: 'none' });
  });
});
