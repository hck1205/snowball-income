import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from './Tooltip';

const renderTooltip = () =>
  render(
    createElement(Tooltip, {
      content: 'SCHD — 7월 15일 예상 지급',
      children: createElement('button', { type: 'button' }, 'SCHD')
    })
  );

describe('Tooltip', () => {
  it('기본 상태에서는 말풍선이 없다', () => {
    renderTooltip();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hover로 열리고 벗어나면 닫힌다', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.hover(screen.getByRole('button', { name: 'SCHD' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('SCHD — 7월 15일 예상 지급');

    await user.unhover(screen.getByRole('button', { name: 'SCHD' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('클릭은 고정 토글이다 — 마우스가 떠나도 남고, 다시 클릭하면 닫힌다', async () => {
    const user = userEvent.setup();
    renderTooltip();
    const trigger = screen.getByRole('button', { name: 'SCHD' });

    await user.click(trigger);
    await user.unhover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.click(trigger);
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('키보드 포커스로 열리고 Escape로 닫힌다', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('열려 있는 동안 트리거가 말풍선을 aria-describedby로 가리킨다', async () => {
    const user = userEvent.setup();
    renderTooltip();
    const trigger = screen.getByRole('button', { name: 'SCHD' });

    expect(trigger).not.toHaveAttribute('aria-describedby');

    await user.hover(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });
});
