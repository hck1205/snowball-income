import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  it('is a dialog named by its title', () => {
    render(createElement(Modal, { title: '도움말', children: '내용' }));

    expect(screen.getByRole('dialog', { name: '도움말' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders children and actions', () => {
    render(
      createElement(Modal, {
        title: '도움말',
        children: '본문',
        actions: createElement('button', { type: 'button' }, '닫기')
      })
    );

    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('reports backdrop clicks', () => {
    const onBackdropClick = vi.fn();
    render(createElement(Modal, { title: '도움말', children: '내용', onBackdropClick }));

    fireEvent.click(screen.getByRole('dialog'));

    expect(onBackdropClick).toHaveBeenCalledTimes(1);
  });
});
