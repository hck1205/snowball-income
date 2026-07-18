import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Banner from './Banner';

describe('Banner', () => {
  it('renders title and body', () => {
    render(createElement(Banner, { title: '공지', children: '내용입니다' }));

    expect(screen.getByRole('heading', { name: '공지' })).toBeInTheDocument();
    expect(screen.getByText('내용입니다')).toBeInTheDocument();
  });

  it('defaults to the polite status role', () => {
    render(createElement(Banner, { children: '내용' }));

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('can be an assertive alert for real errors', () => {
    render(createElement(Banner, { tone: 'danger', role: 'alert', children: '입력이 잘못되었습니다' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders a dismiss button only when onDismiss is given', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(createElement(Banner, { children: '내용' }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(createElement(Banner, { children: '내용', onDismiss, dismissAriaLabel: '공지 닫기' }));
    fireEvent.click(screen.getByRole('button', { name: '공지 닫기' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
