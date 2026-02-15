import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders title and children', () => {
    render(createElement(Card, { title: '제목', children: createElement('div', null, '내용') }));

    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
  });
});
