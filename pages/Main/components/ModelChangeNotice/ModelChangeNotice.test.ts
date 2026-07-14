import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelChangeNotice from './ModelChangeNotice';
import { MODEL_CHANGE_NOTICE_STORAGE_KEY } from './ModelChangeNotice.utils';

describe('ModelChangeNotice', () => {
  beforeEach(() => {
    // 테스트 간 격리: 닫힘 플래그가 넘어오면 다음 테스트에서 배너가 아예 렌더되지 않는다.
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('renders the notice on a first visit', () => {
    render(createElement(ModelChangeNotice));

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('계산 방식이 업데이트되었습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공지 닫기' })).toBeInTheDocument();
  });

  it('hides the notice and records the dismissal when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(createElement(ModelChangeNotice));

    await user.click(screen.getByRole('button', { name: '공지 닫기' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(MODEL_CHANGE_NOTICE_STORAGE_KEY)).toBe('dismissed');
  });

  it('can be dismissed with the keyboard', async () => {
    const user = userEvent.setup();
    render(createElement(ModelChangeNotice));

    await user.tab();
    expect(screen.getByRole('button', { name: '공지 닫기' })).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(MODEL_CHANGE_NOTICE_STORAGE_KEY)).toBe('dismissed');
  });

  it('does not render when the notice was already dismissed', () => {
    window.localStorage.setItem(MODEL_CHANGE_NOTICE_STORAGE_KEY, 'dismissed');

    render(createElement(ModelChangeNotice));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('계산 방식이 업데이트되었습니다')).not.toBeInTheDocument();
  });

  it('stays dismissed across remounts (a page reload does not bring it back)', async () => {
    const user = userEvent.setup();
    const first = render(createElement(ModelChangeNotice));
    await user.click(screen.getByRole('button', { name: '공지 닫기' }));
    first.unmount();

    render(createElement(ModelChangeNotice));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keys the dismissal by storage key so a future notice can be shown independently', async () => {
    const user = userEvent.setup();
    const first = render(createElement(ModelChangeNotice, { storageKey: 'snowball:notice:coherent-model:v1' }));
    await user.click(screen.getByRole('button', { name: '공지 닫기' }));
    first.unmount();

    render(createElement(ModelChangeNotice, { storageKey: 'snowball:notice:next-thing:v1' }));

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
