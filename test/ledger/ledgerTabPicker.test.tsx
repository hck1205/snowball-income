import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tabSwitchBlockedReason } from '@/pages/Ledger/components';
import type { LedgerTabPickerModel } from '@/pages/Ledger/types';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * B-1 탭별 조회 — **화면 계약**(AC1-1 · AC1-5).
 *
 * 🔴 여기서 검증하는 것은 "사용자가 무엇을 보고 무엇을 누를 수 있는가"뿐이다. 실제 전환(연결 재수립·
 * 매핑 세션·저장)은 훅 계약이라 `ledgerTabSwitch.test.tsx` 가 본다.
 */

const tabPicker = (overrides: Partial<LedgerTabPickerModel> = {}): LedgerTabPickerModel => ({
  options: [
    { sheetId: 0, title: '2026년' },
    { sheetId: 7, title: '2025년' }
  ],
  currentSheetId: 0,
  currentTitle: '2026년',
  blockedReason: null,
  isSwitching: false,
  ...overrides
});

const connectedWithTabs = (model: LedgerTabPickerModel) => baseViewModel({ tabPicker: model });

describe('AC1-1 탭이 2개 이상이면 고를 수 있고, 1개면 이름만 말한다', () => {
  it('탭이 둘이면 지금 탭이 선택된 드롭다운이 선다', () => {
    renderLedgerView(connectedWithTabs(tabPicker()));

    const select = screen.getByRole('combobox', { name: '탭' });
    expect(select).toHaveValue('0');
    expect(select).toBeEnabled();
    expect(screen.getByRole('option', { name: '2026년' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2025년' })).toBeInTheDocument();
  });

  it('🔴 탭이 하나면 드롭다운을 만들지 않는다 — 선택지가 없는 select 는 거짓말이다', () => {
    renderLedgerView(
      connectedWithTabs(tabPicker({ options: [{ sheetId: 0, title: '가계부' }], currentTitle: '가계부' }))
    );

    expect(screen.queryByRole('combobox', { name: '탭' })).not.toBeInTheDocument();
    /*
     * 🔴 2026-08-08 — 탭이 하나면 **시트로 가는 링크**가 그 자리에 선다.
     *    종전에는 "가계부 탭을 보고 있습니다"라고 적었는데, 앱 시트에서 기록 탭이 아닌 것을
     *    걸러 내면서 이 자리는 거의 언제나 그 문장 하나가 됐다 — 아는 사실을 다시 말하는 것은
     *    정보가 아니라 자리만 차지하는 줄이다.
     */
    expect(screen.getByRole('link', { name: '구글 시트에서 열기' })).toBeInTheDocument();
  });

  it('고른 탭 id 를 그대로 올려 보낸다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(connectedWithTabs(tabPicker()));

    await user.selectOptions(screen.getByRole('combobox', { name: '탭' }), '7');

    expect(handlers.onSelectTab).toHaveBeenCalledWith(7);
  });
});

describe('AC1-5 사고 방지 — 막을 때는 반드시 사유를 말한다', () => {
  it('폼이 열려 있으면 비활성이고, 사유가 화면에 있고, 컨트롤이 그것을 가리킨다', () => {
    const reason = '기록을 추가하거나 고치는 중에는 탭을 바꿀 수 없습니다. 저장하거나 취소한 뒤에 이동해 주세요.';
    renderLedgerView(connectedWithTabs(tabPicker({ blockedReason: reason })));

    const select = screen.getByRole('combobox', { name: '탭' });
    expect(select).toBeDisabled();
    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(select).toHaveAccessibleDescription(reason);
  });

  it('저장하지 못한 기록이 남아 있으면 비활성이고, 그 사유가 다른 탭에 기록될 위험을 말한다', () => {
    const reason =
      '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요.';
    renderLedgerView(connectedWithTabs(tabPicker({ blockedReason: reason })));

    expect(screen.getByRole('combobox', { name: '탭' })).toBeDisabled();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('🔴 사유 없는 회색 컨트롤을 만들지 않는다 — 막히지 않았으면 사유 문장도 없다', () => {
    renderLedgerView(connectedWithTabs(tabPicker()));

    const select = screen.getByRole('combobox', { name: '탭' });
    expect(select).toBeEnabled();
    expect(select).not.toHaveAccessibleDescription();
  });

  it('전환 중에는 연타를 막고 진행 중임을 텍스트로 말한다', () => {
    renderLedgerView(connectedWithTabs(tabPicker({ isSwitching: true })));

    expect(screen.getByRole('combobox', { name: '탭' })).toBeDisabled();
    expect(screen.getByText('탭을 여는 중입니다')).toBeInTheDocument();
  });
});

describe('AC1-5 막는 조건 자체 — 무엇이 탭 전환을 잠그는가', () => {
  it('아무것도 대기 중이 아니면 바꿀 수 있다', () => {
    expect(tabSwitchBlockedReason({ isFormOpen: false, hasUnsavedQueue: false })).toBeNull();
  });

  it('폼이 열려 있으면 막고, 저장하거나 취소하라고 말한다', () => {
    expect(tabSwitchBlockedReason({ isFormOpen: true, hasUnsavedQueue: false })).toBe(
      '기록을 추가하거나 고치는 중에는 탭을 바꿀 수 없습니다. 저장하거나 취소한 뒤에 이동해 주세요.'
    );
  });

  it('🔴 저장하지 못한 기록이 남아 있으면 막는다 — 재시도가 다른 탭에 행을 추가하기 때문이다', () => {
    expect(tabSwitchBlockedReason({ isFormOpen: false, hasUnsavedQueue: true })).toBe(
      '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요.'
    );
  });

  it('둘 다면 지금 손대고 있는 폼 쪽을 먼저 말한다 (사유는 화면에 하나다)', () => {
    expect(tabSwitchBlockedReason({ isFormOpen: true, hasUnsavedQueue: true })).toBe(
      '기록을 추가하거나 고치는 중에는 탭을 바꿀 수 없습니다. 저장하거나 취소한 뒤에 이동해 주세요.'
    );
  });
});

describe('탭 선택의 자리', () => {
  it('연결 전에는 탭을 고를 자리 자체가 없다', () => {
    renderLedgerView(baseViewModel({ state: 'disconnected', tabPicker: null }));

    expect(screen.queryByRole('combobox', { name: '탭' })).not.toBeInTheDocument();
  });

  it('🔴 탭 선택은 월 이동 알약과 **다른 묶음**이다 — 같은 group 안에 들어가지 않는다', () => {
    renderLedgerView(connectedWithTabs(tabPicker()));

    const monthGroup = screen.getByRole('group', { name: '월 이동' });
    expect(monthGroup).not.toContainElement(screen.getByRole('combobox', { name: '탭' }));
  });
});
