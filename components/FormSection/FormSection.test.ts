import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import FormSection from './FormSection';

describe('FormSection', () => {
  it('renders heading and content', () => {
    render(createElement(FormSection, { title: '입력', children: createElement('span', null, '필드') }));

    expect(screen.getByText('입력')).toBeInTheDocument();
    expect(screen.getByText('필드')).toBeInTheDocument();
  });
});
