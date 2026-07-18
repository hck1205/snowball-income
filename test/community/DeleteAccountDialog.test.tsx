import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountDialog } from '@/components/community';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * 파괴적 다이얼로그의 안전장치를 행동으로 확인한다:
 *  - 기본 포커스 = 취소 버튼(실수 실행 방지)
 *  - 재확인 '탈퇴' 입력 전에는 영구 삭제 비활성
 *  - 실패 시 다이얼로그 유지 + role="alert" 에러(성공 위장 금지)
 */

const p = COMMUNITY_COPY.profile;

const setup = (over: Partial<Parameters<typeof DeleteAccountDialog>[0]> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <DeleteAccountDialog
      loading={over.loading ?? false}
      error={over.error ?? null}
      onConfirm={over.onConfirm ?? onConfirm}
      onCancel={over.onCancel ?? onCancel}
    />
  );
  return { onConfirm: over.onConfirm ?? onConfirm, onCancel: over.onCancel ?? onCancel };
};

const executeButton = () => screen.getByRole('button', { name: p.deleteExecute });
const cancelButton = () => screen.getByRole('button', { name: p.deleteCancel });

describe('DeleteAccountDialog', () => {
  it('열리면 기본 포커스가 취소 버튼에 있다', () => {
    setup();
    expect(cancelButton()).toHaveFocus();
  });

  it("재확인 입력이 '탈퇴'가 아니면 영구 삭제가 비활성이다", async () => {
    const user = userEvent.setup();
    setup();

    expect(executeButton()).toBeDisabled();

    const input = screen.getByRole('textbox', { name: p.deleteConfirmLabel });
    await user.type(input, '탈퇴할래');
    expect(executeButton()).toBeDisabled();
  });

  it("정확히 '탈퇴'(앞뒤 공백 허용)를 입력하면 활성화되고 클릭 시 onConfirm 을 부른다", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    const input = screen.getByRole('textbox', { name: p.deleteConfirmLabel });
    await user.type(input, '  탈퇴  ');
    expect(executeButton()).toBeEnabled();

    await user.click(executeButton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('실패 에러가 오면 다이얼로그를 유지하고 role="alert"로 원인을 알린다', () => {
    setup({ error: p.deleteFailed });

    // 다이얼로그가 그대로 떠 있다
    expect(screen.getByRole('dialog', { name: p.deleteTitle })).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(p.deleteFailed);
  });

  it('처리 중에는 취소/입력이 잠긴다', () => {
    setup({ loading: true });
    expect(cancelButton()).toBeDisabled();
    expect(screen.getByRole('textbox', { name: p.deleteConfirmLabel })).toBeDisabled();
  });
});
