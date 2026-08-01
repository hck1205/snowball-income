import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LedgerFormModel, LedgerRemoveTarget } from '@/pages/Ledger/types';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * `/ledger` 의 두 오버레이(항목 폼 · 삭제 확인) 계약.
 *
 * ⚠ Escape 는 **`document.body` 에** 쏜다. `fireEvent.keyDown(window, …)` 는 전파 경로가
 * `[window]` 하나뿐이라 `document` 버블에 달린 `useOverlayEscape` 에 닿지 않는다(그러면
 * "Escape 가 안 먹는다"는 회귀를 그대로 통과시킨다).
 *
 * 🔴 아래 "모달의 접근명" 두 건은 **의도적으로 red** 다 — `LedgerFormModal.styled.ts` 의
 * `:has()` 가 jsdom 에서 접근명 계산을 터뜨린다. 결함 리포트는 `ledgerSourceRules.test.ts` 의
 * `:has()` 가드와 짝이다. 이 페이지의 구현은 QA 가 고치지 않는다.
 */

const formModel = (overrides: Partial<LedgerFormModel> = {}): LedgerFormModel => ({
  mode: 'create',
  draft: { date: '2026-08-03', kind: 'expense', amount: '12000', category: '식비', memo: '점심 김밥' },
  errors: {},
  categoryOptions: ['식비', '교통'],
  isSaving: false,
  writeError: null,
  ...overrides
});

const removeTarget: LedgerRemoveTarget = {
  id: 'snap-1:2',
  dateText: '8월 3일 (월)',
  kindText: '지출',
  category: '식비',
  amountText: '₩12,000'
};

describe('/ledger — 항목 폼 모달(§4.5)', () => {
  it('추가 모드의 제목·필드·액션이 확정 카피 그대로다', () => {
    renderLedgerView(baseViewModel({ form: formModel() }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('항목 추가')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('날짜')).toHaveValue('2026-08-03');
    expect(within(dialog).getByText('구분')).toBeInTheDocument();
    /* ⚠ role 질의는 쓸 수 없다 — `<form id={useId()}>` 의 콜론 id 가 `:has()` 규칙과 만나 jsdom 에서
       터진다(아래 [red] 항목과 같은 원인). 라벨 질의는 계산 스타일을 읽지 않아 살아남는다. */
    expect(within(dialog).getByLabelText('지출')).toBeChecked();
    expect(within(dialog).getByLabelText('수입')).not.toBeChecked();
    expect(within(dialog).getByLabelText('금액')).toHaveValue('12000');
    expect(within(dialog).getByLabelText('분류')).toHaveValue('식비');
    expect(within(dialog).getByLabelText('메모 (선택)')).toHaveValue('점심 김밥');
    expect(within(dialog).getByText('시트에 있는 분류에서 고르거나 새로 적을 수 있습니다.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '저장' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('수정 모드는 제목·제출 라벨이 다르다', () => {
    renderLedgerView(baseViewModel({ form: formModel({ mode: 'edit' }) }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('항목 수정')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '수정 저장' })).toBeInTheDocument();
  });

  it('🔴 [red] 모달이 제목을 접근명으로 갖는다 — jsdom 이 접근명을 계산할 수 있어야 한다', () => {
    renderLedgerView(baseViewModel({ form: formModel() }));

    /*
     * 🔴 현재 실패한다. `LedgerFormModal.styled.ts:169,176` 의 `&:has(...)` 규칙이 스타일시트에
     * 들어가면, React `useId` 가 만든 **콜론 id**(`:r4:`)를 가진 요소에 대해 nwsapi 가
     * `'h3,,:r4,,.css-… input:checked'` 라는 잘못된 셀렉터를 만들어 SyntaxError 를 던진다.
     * 이 레포는 그래서 `:has()` 를 쓰지 않기로 이미 못박아 두었다(`components/common/Toggle/
     * Toggle.styled.ts:134`). 그 규칙으로 되돌리면 이 단정이 그대로 통과한다.
     */
    expect(screen.getByRole('dialog')).toHaveAccessibleName('항목 추가');
  });

  it('🔴 저장에 실패해도 모달이 닫히지 않고 입력값이 그대로 남는다 — 다시 타이핑하지 않는다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({
        form: formModel({
          writeError: {
            title: '저장하지 못했습니다',
            body: '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
            reason: 'network'
          }
        })
      })
    );

    const dialog = screen.getByRole('dialog');
    // 실패는 폼 안에 남는다(토스트가 아니다).
    const banner = within(dialog).getByRole('alert');
    expect(within(banner).getByText('저장하지 못했습니다')).toBeInTheDocument();
    expect(
      within(banner).getByText('네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
    ).toBeInTheDocument();

    // 🔴 사용자가 친 값이 살아 있다.
    expect(within(dialog).getByLabelText('금액')).toHaveValue('12000');
    expect(within(dialog).getByLabelText('분류')).toHaveValue('식비');
    expect(within(dialog).getByLabelText('메모 (선택)')).toHaveValue('점심 김밥');

    await user.click(within(banner).getByRole('button', { name: '다시 시도' }));
    expect(handlers.onSubmitForm).toHaveBeenCalledTimes(1);
  });

  it('제출 시도 후 오류는 aria-invalid + 오류 전용 서술로 접근성 트리에 오른다', () => {
    renderLedgerView(
      baseViewModel({
        form: formModel({
          draft: { date: '2026-08-03', kind: 'expense', amount: '', category: '', memo: '' },
          errors: { amount: '금액을 입력해 주세요.', category: '분류를 입력해 주세요.' }
        })
      })
    );

    const amount = screen.getByLabelText('금액');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    const amountDescribedBy = amount.getAttribute('aria-describedby');
    expect(amountDescribedBy).not.toBeNull();
    expect(document.getElementById(amountDescribedBy as string)).toHaveTextContent('금액을 입력해 주세요.');

    const category = screen.getByLabelText('분류');
    expect(category).toHaveAttribute('aria-invalid', 'true');
    expect(within(screen.getByRole('dialog')).getByText('분류를 입력해 주세요.')).toBeInTheDocument();

    // 오류가 없는 필드에는 붙지 않는다(입력 중 빨간 줄 금지의 뒷면).
    expect(screen.getByLabelText('날짜')).not.toHaveAttribute('aria-invalid');
  });

  it('만료 중에는 저장이 비활성 + 사유를 가리키고, 모달 안에서 재연결·이어서 저장을 제안한다', () => {
    renderLedgerView(baseViewModel({ isExpired: true, form: formModel() }));

    const dialog = screen.getByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: '저장' });
    expect(submit).toBeDisabled();

    const hint = screen.getByText(
      '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.'
    );
    expect(submit.getAttribute('aria-describedby')).toBe(hint.id);

    expect(
      within(dialog).getByText('연결이 만료되었습니다. 다시 연결하면 지금 입력한 내용을 그대로 저장합니다.')
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '다시 연결하고 저장' })).toBeEnabled();
  });

  it('Escape 로 닫힌다 (document 버블에 닿는 경로로 쏜다)', async () => {
    const { handlers } = renderLedgerView(baseViewModel({ form: formModel() }));

    await waitFor(() => expect(screen.getByLabelText('날짜')).toHaveFocus());
    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(handlers.onCloseForm).toHaveBeenCalledTimes(1);
  });
});

describe('/ledger — 삭제 확인(§4.6)', () => {
  it('🔴 대상의 날짜·구분·분류·금액을 전부 보여 준다 ("정말 삭제하시겠습니까?" 단독 금지)', () => {
    renderLedgerView(baseViewModel({ removeTarget }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('이 기록을 삭제합니다')).toBeInTheDocument();
    expect(within(dialog).getByText('아래 기록을 시트에서 지웁니다. 되돌릴 수 없습니다.')).toBeInTheDocument();

    const terms = within(dialog)
      .getAllByRole('term')
      .map((node) => node.textContent);
    const definitions = within(dialog)
      .getAllByRole('definition')
      .map((node) => node.textContent);

    expect(terms).toEqual(['날짜', '구분', '분류', '금액']);
    expect(definitions).toEqual(['8월 3일 (월)', '지출', '식비', '₩12,000']);
  });

  it('🔴 [red] 삭제 확인 모달도 제목을 접근명으로 갖는다', () => {
    renderLedgerView(baseViewModel({ removeTarget }));

    // 위 폼 모달과 같은 원인(`:has()` × 콜론 id)으로 지금은 실패한다.
    expect(screen.getByRole('dialog')).toHaveAccessibleName('이 기록을 삭제합니다');
  });

  it('초기 포커스는 취소다 — 파괴적 동작을 기본 포커스로 두지 않는다', async () => {
    renderLedgerView(baseViewModel({ removeTarget }));

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
  });

  it('삭제 실패는 모달을 닫지 않고 배너 + 재시도로 남는다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({
        removeTarget,
        removeError: {
          title: '저장하지 못했습니다',
          body: '이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.',
          reason: 'permission'
        }
      })
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.')
    ).toBeInTheDocument();
    // 대상 정보는 실패 뒤에도 그대로다.
    expect(within(dialog).getByText('₩12,000')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '다시 시도' }));
    expect(handlers.onConfirmRemove).toHaveBeenCalledTimes(1);
  });

  it('만료 중에는 삭제가 비활성 + 같은 사유 줄을 가리키고, 재연결·이어서 삭제를 제안한다', () => {
    renderLedgerView(baseViewModel({ isExpired: true, removeTarget }));

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: '삭제' });
    // 🔴 누르면 실패하는 버튼을 남기지 않는다.
    expect(confirm).toBeDisabled();

    const hint = screen.getByText(
      '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.'
    );
    expect(confirm.getAttribute('aria-describedby')).toBe(hint.id);
    expect(within(dialog).getByRole('button', { name: '다시 연결하고 삭제' })).toBeEnabled();
    // 취소는 만료와 무관하게 언제나 열려 있다(빠져나갈 길을 막지 않는다).
    expect(within(dialog).getByRole('button', { name: '취소' })).toBeEnabled();
  });

  it('Escape 로 닫힌다', async () => {
    const { handlers } = renderLedgerView(baseViewModel({ removeTarget }));

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(handlers.onCloseRemove).toHaveBeenCalledTimes(1);
  });
});

describe('/ledger — 오버레이 중첩 0', () => {
  it('폼이 열려 있으면 삭제 확인은 렌더되지 않는다 (모달 위 모달 금지)', () => {
    renderLedgerView(baseViewModel({ form: formModel(), removeTarget }));

    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs.length).toBe(1);
    expect(within(dialogs[0]).getByText('항목 추가')).toBeInTheDocument();
    expect(screen.queryByText('이 기록을 삭제합니다')).not.toBeInTheDocument();
  });
});
