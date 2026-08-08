import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LEDGER_COPY } from '@/pages/Ledger/copy';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * 고정비 이어가기 — **화면 쪽 계약**.
 *
 * 규칙 계산은 `ledgerCarryOver.test.ts` 가 본다. 여기서 지키는 것은 하나다:
 * 🔴 **버튼 한 번으로 시트에 쓰이지 않는다.** 여러 줄을 남의 시트에 넣는 일이라, 무엇이 들어갈지
 *    보이고 확인해야 실행된다. 되돌리려면 넣은 줄을 하나씩 지워야 하기 때문이다.
 */

const copy = LEDGER_COPY.carryOver;

const CARRY_OVER = {
  count: 2,
  isOpen: false,
  isSaving: false,
  rows: [
    { id: 'a', label: '주거 · 월세', amountText: '₩700,000', dateText: '8월 5일 (수)' },
    { id: 'b', label: '생활 · 통신/인터넷', amountText: '₩43,890', dateText: '8월 5일 (수)' }
  ]
};

describe('이어갈 것이 없으면 자리도 없다', () => {
  it('🔴 눌러도 아무 일 없는 컨트롤을 두지 않는다', () => {
    renderLedgerView(baseViewModel({ state: 'connected', carryOver: null }));

    expect(screen.queryByRole('button', { name: /고정비/ })).not.toBeInTheDocument();
  });
});

describe('두 단계 — 열기 → 확인', () => {
  it('처음에는 건수를 말하는 버튼만 있다', () => {
    renderLedgerView(baseViewModel({ state: 'connected', carryOver: CARRY_OVER }));

    expect(screen.getByRole('button', { name: copy.open(2) })).toBeInTheDocument();
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });

  it('⭐ 버튼을 눌러도 아직 시트에 쓰지 않는다 — 목록을 여는 것뿐이다', async () => {
    const { handlers } = renderLedgerView(baseViewModel({ state: 'connected', carryOver: CARRY_OVER }));

    await userEvent.click(screen.getByRole('button', { name: copy.open(2) }));

    expect(handlers.onOpenCarryOver).toHaveBeenCalledTimes(1);
    expect(handlers.onConfirmCarryOver).not.toHaveBeenCalled();
  });

  it('열리면 무엇이 들어갈지 한 줄씩 보인다', () => {
    renderLedgerView(baseViewModel({ state: 'connected', carryOver: { ...CARRY_OVER, isOpen: true } }));

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText('주거 · 월세')).toBeInTheDocument();
    expect(screen.getByText('₩700,000')).toBeInTheDocument();
    expect(screen.getByText('생활 · 통신/인터넷')).toBeInTheDocument();
  });

  it('⭐ 확인을 눌러야 실행된다', async () => {
    const { handlers } = renderLedgerView(
      baseViewModel({ state: 'connected', carryOver: { ...CARRY_OVER, isOpen: true } })
    );

    await userEvent.click(screen.getByRole('button', { name: copy.confirm }));

    expect(handlers.onConfirmCarryOver).toHaveBeenCalledTimes(1);
  });

  it('취소하면 닫히고 아무것도 쓰지 않는다', async () => {
    const { handlers } = renderLedgerView(
      baseViewModel({ state: 'connected', carryOver: { ...CARRY_OVER, isOpen: true } })
    );

    await userEvent.click(screen.getByRole('button', { name: copy.cancel }));

    expect(handlers.onCloseCarryOver).toHaveBeenCalledTimes(1);
    expect(handlers.onConfirmCarryOver).not.toHaveBeenCalled();
  });
});

describe('만료 중에는 잠근다', () => {
  it('🔴 다른 쓰기 컨트롤과 같은 규율 — 사유 줄을 가리킨다', () => {
    renderLedgerView(baseViewModel({ state: 'connected', isExpired: true, carryOver: CARRY_OVER }));

    const button = screen.getByRole('button', { name: copy.open(2) });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-describedby');
  });
});
