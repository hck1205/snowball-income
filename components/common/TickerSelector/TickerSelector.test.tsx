import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TickerSelectorBar, TickerSelectorCheckbox } from './TickerSelector';

/**
 * 종목 선택 부품 — 행 체크박스 + 하단 바.
 *
 * 🔴 이 컴포넌트는 유니버스를 모른다(호출부가 `checked`·`disabled`·`href` 를 다 넘긴다). 그래서 여기서
 * 잡을 것은 **넘겨받은 상태를 화면·상호작용으로 옳게 옮기는가**뿐이다 — 무엇이 비교 가능한지,
 * 주소를 어떻게 만드는지는 `pages/Ticker` 의 순수 함수 테스트가 따로 잠근다.
 */

const renderBar = (props: Partial<Parameters<typeof TickerSelectorBar>[0]> = {}) =>
  render(
    <MemoryRouter>
      <TickerSelectorBar
        selected={['SCHD', 'JEPI']}
        max={4}
        min={2}
        href="/ticker/compare?t=SCHD,JEPI&from=nps"
        onRemove={() => {}}
        onClear={() => {}}
        {...props}
      />
    </MemoryRouter>
  );

describe('TickerSelectorCheckbox', () => {
  it('티커를 담은 접근성 이름을 주고, 켜짐 상태를 반영한다', () => {
    render(<TickerSelectorCheckbox ticker="SCHD" checked onToggle={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'SCHD 비교에 담기' })).toBeChecked();
  });

  it('토글하면 티커를 그대로 돌려준다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TickerSelectorCheckbox ticker="SCHD" checked={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('checkbox', { name: 'SCHD 비교에 담기' }));
    expect(onToggle).toHaveBeenCalledWith('SCHD');
  });

  it('비교할 수 없으면 끄고 사유를 title 로 붙인다 — 숨기지 않는다', () => {
    render(
      <TickerSelectorCheckbox
        ticker="ZZZZ"
        checked={false}
        disabled
        disabledReason="비교 표에 없는 종목입니다."
        onToggle={() => {}}
      />
    );

    expect(screen.getByRole('checkbox', { name: 'ZZZZ 비교에 담기' })).toBeDisabled();
    expect(screen.getByTitle('비교 표에 없는 종목입니다.')).toBeInTheDocument();
  });
});

describe('TickerSelectorBar', () => {
  it('선택이 비면 아무것도 그리지 않는다 (조건 없이 렌더해도 되는 계약)', () => {
    const { container } = renderBar({ selected: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('최소 개수를 채우면 개수·칩·비교 링크를 그 주소로 그린다', () => {
    renderBar();

    expect(screen.getByText('2개 선택됨 · 최대 4개')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: '비교하기 →' });
    expect(link).toHaveAttribute('href', '/ticker/compare?t=SCHD,JEPI&from=nps');
  });

  it('최소 개수 미달이면 링크 대신 몇 개가 더 필요한지 말한다', () => {
    renderBar({ selected: ['SCHD'] });

    expect(screen.queryByRole('link', { name: '비교하기 →' })).not.toBeInTheDocument();
    expect(screen.getByText('1개 더 고르면 비교할 수 있습니다')).toBeInTheDocument();
  });

  it('칩의 해제·전체 해제가 각각 콜백을 부른다', async () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    renderBar({ onRemove, onClear });

    await user.click(screen.getByRole('button', { name: 'SCHD 선택 해제' }));
    expect(onRemove).toHaveBeenCalledWith('SCHD');

    await user.click(screen.getByRole('button', { name: '전체 해제' }));
    expect(onClear).toHaveBeenCalled();
  });
});
