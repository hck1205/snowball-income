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

  /*
   * 🔴 퇴장 중인 껍데기는 다이얼로그가 아니다. 셸이 `phase` 를 받으면서도 이 처리를 안 하면,
   * 다음 사람이 `phase` 를 넘기는 순간 "닫았는데 열려 있는 대화상자"가 생긴다.
   */
  describe('퇴장 단계', () => {
    it('phase="exit" 이면 다이얼로그가 아니다(보조기기에서 사라진다)', () => {
      render(createElement(Modal, { title: '도움말', children: '내용', phase: 'exit' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByText('내용').closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('phase="exit" 이면 배경 클릭도 받지 않는다(이미 닫힌 것을 또 닫을 수 없다)', () => {
      const onBackdropClick = vi.fn();
      const { container } = render(
        createElement(Modal, { title: '도움말', children: '내용', onBackdropClick, phase: 'exit' })
      );

      fireEvent.click(container.firstElementChild as Element);

      expect(onBackdropClick).not.toHaveBeenCalled();
    });

    it('phase="enter" 은 평소와 같다(기존 호출부 무영향)', () => {
      render(createElement(Modal, { title: '도움말', children: '내용', phase: 'enter' }));

      expect(screen.getByRole('dialog', { name: '도움말' })).toBeInTheDocument();
    });
  });
});
