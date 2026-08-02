import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  LedgerBlendModel,
  LedgerBlendRow,
  LedgerBlendSubtotal,
  LedgerBlendViewModel
} from '@/pages/Ledger/types';
import { baseViewModel, ledgerRow, renderLedgerView } from './ledgerFixtures';

/**
 * B-3 블렌딩 **화면** 계약(AC3-1 · AC3-3 · AC3-4 · AC3-5 · AC3-6).
 *
 * 🔴 기대값은 전부 **리터럴**이다 — `LEDGER_COPY` 를 재사용하면 동어반복이라 회귀를 못 잡는다.
 * 🔴 className·Emotion 내부 구현을 보지 않는다. 사용자가 보는 텍스트와 역할로만 단정한다.
 */

const rowOf = (over: Partial<LedgerBlendRow>): LedgerBlendRow => ({
  ...ledgerRow(),
  source: 'a',
  sourceLabel: '민수',
  blendId: 'a:snap-1:2',
  ...over
});

const MINE = rowOf({});
const PARTNER = rowOf({
  id: 'snap-2:4',
  blendId: 'b:snap-2:4',
  source: 'b',
  sourceLabel: '지연',
  dateISO: '2026-08-05',
  dateText: '8월 5일 (수)',
  category: '교통비',
  amount: 5000,
  amountText: '₩5,000',
  memo: ''
});

const subtotal = (over: Partial<LedgerBlendSubtotal>): LedgerBlendSubtotal => ({
  source: 'a',
  label: '민수',
  income: 0,
  expense: 12000,
  incomeText: '₩0',
  expenseText: '₩12,000',
  incomeCount: 0,
  expenseCount: 1,
  ...over
});

const READY: LedgerBlendModel = {
  labels: { a: '민수', b: '지연' },
  body: {
    kind: 'ready',
    rows: [MINE, PARTNER],
    summary: {
      incomeText: '₩0',
      expenseText: '₩17,000',
      netText: '-₩17,000',
      incomeCount: 0,
      expenseCount: 2
    },
    subtotals: [
      subtotal({}),
      subtotal({ source: 'b', label: '지연', expense: 5000, expenseText: '₩5,000' })
    ],
    unreadable: []
  }
};

const blendOf = (over: Partial<LedgerBlendViewModel> = {}): LedgerBlendViewModel => ({
  isAvailable: true,
  isOn: true,
  hasConfig: true,
  setup: null,
  model: READY,
  openableSources: ['a', 'b'],
  openBlockedReason: null,
  ...over
});

describe('AC3-1 — 블렌딩 진입점', () => {
  it('저장된 링크가 1개 이하면 진입점이 화면에 없다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf({ isAvailable: false, isOn: false, model: null }) }));
    expect(screen.queryByRole('button', { name: '두 가계부 합쳐 보기' })).toBeNull();
  });

  it('링크가 2개 이상이면 진입점이 보이고, 구성이 없으면 무엇을 하는 기능인지 함께 말한다', () => {
    renderLedgerView(
      baseViewModel({ blend: blendOf({ isOn: false, hasConfig: false, model: null }) })
    );
    expect(screen.getByRole('button', { name: '두 가계부 합쳐 보기' })).toBeInTheDocument();
    expect(
      screen.getByText('이 브라우저에 연결해 둔 가계부 두 개를 한 화면에서 합쳐 봅니다.')
    ).toBeInTheDocument();
  });

  it('구성이 없으면 진입점이 설정 화면을 먼저 연다 (빈 화면을 보여 주지 않는다)', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({ blend: blendOf({ isOn: false, hasConfig: false, model: null }) })
    );

    await user.click(screen.getByRole('button', { name: '두 가계부 합쳐 보기' }));
    expect(handlers.onToggleBlendSetup).toHaveBeenCalledWith(true);
    expect(handlers.onToggleBlend).not.toHaveBeenCalled();
  });

  it('구성이 있으면 진입점이 곧바로 블렌딩을 켠다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({ blend: blendOf({ isOn: false, model: null }) })
    );

    await user.click(screen.getByRole('button', { name: '두 가계부 합쳐 보기' }));
    expect(handlers.onToggleBlend).toHaveBeenCalledWith(true);
  });
});

describe('AC3-3 · AC3-4 — 합친 목록과 합산·소계', () => {
  it('두 가계부의 기록이 한 목록에 서고 각 행이 출처 이름을 텍스트로 말한다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    const table = screen.getByRole('table', { name: '2026년 8월 두 가계부를 합친 수입·지출 기록' });
    const rows = within(table).getAllByRole('row');
    // 머리글 1 + 기록 2
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('민수')).toBeInTheDocument();
    expect(within(rows[2]).getByText('지연')).toBeInTheDocument();
    expect(within(rows[1]).getByText('식비')).toBeInTheDocument();
    expect(within(rows[2]).getByText('교통비')).toBeInTheDocument();
  });

  it('합산 3숫자와 출처별 소계 2줄이 함께 선다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    expect(screen.getByText('2026년 8월 두 가계부 순액')).toBeInTheDocument();
    expect(screen.getByText('-₩17,000')).toBeInTheDocument();

    /* 같은 금액이 목록에도 있으므로 "소계 자리의 숫자"를 그 묶음 안에서 본다. */
    const subtotals = within(screen.getByRole('region', { name: '가계부별 소계' }));
    expect(subtotals.getByText('민수')).toBeInTheDocument();
    expect(subtotals.getByText('지연')).toBeInTheDocument();
    expect(subtotals.getByText('₩12,000')).toBeInTheDocument();
    expect(subtotals.getByText('₩5,000')).toBeInTheDocument();
  });

  it('통화 전제를 문장으로 말한다 (앱은 두 시트의 통화 차이를 감지할 수 없다)', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));
    expect(
      screen.getByText('두 가계부는 같은 통화를 전제합니다. 통화가 서로 다르면 합계가 의미를 갖지 못합니다.')
    ).toBeInTheDocument();
  });
});

describe('AC3-6 — 블렌딩 뷰는 읽기 전용이다', () => {
  /**
   * 🔴 이 케이스가 "블렌딩 화면에 쓰기 버튼을 넣으면 빨개지는가"의 감시자다. 수정·삭제·추가 중
   * 하나라도 되살아나면 여기서 죽는다.
   */
  it('추가·수정·삭제 버튼이 하나도 없다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    expect(screen.queryByRole('button', { name: '항목 추가' })).toBeNull();
    expect(screen.queryByRole('button', { name: /기록 수정$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /기록 삭제$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /다시 저장$/ })).toBeNull();
  });

  it('단일 가계부의 목록·배당 카드가 블렌딩 화면에는 없다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    expect(screen.queryByText('거래 내역')).toBeNull();
    // D4-5 — "우리 가계" 지출에 "내 포트폴리오" 배당을 겹치지 않는다.
    expect(screen.queryByText('배당 겹쳐 보기')).toBeNull();
    expect(screen.getByText('합친 거래 내역')).toBeInTheDocument();
  });

  it('행에서 그 가계부의 단일 뷰로 가는 길이 있다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(baseViewModel({ blend: blendOf() }));

    await user.click(screen.getByRole('button', { name: '8월 5일 (수) 교통비 ₩5,000 기록을 지연 가계부에서 열기' }));
    expect(handlers.onOpenBlendSource).toHaveBeenCalledWith('b');
  });

  /**
   * 🔴 **블렌딩이 탭 전환 차단의 우회로가 되지 않는다.**
   *
   * "이 가계부에서 열기"가 하는 일은 결국 `switchTab` 이다. 저장 실패 대기열이 남아 있을 때 탭이
   * 바뀌면, 대기열 재시도가 **다른 탭에 행을 추가**한다(추가에는 행 참조가 없어 옛 스냅샷 가드가
   * 걸리지 않는다). 그래서 탭 피커와 **같은 조건**에서 이 버튼도 막힌다.
   */
  it('열기가 막히면 버튼이 비활성이고 사유와 나가는 길이 함께 선다 (무음 비활성 금지)', () => {
    renderLedgerView(
      baseViewModel({
        blend: blendOf({
          openBlockedReason:
            '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요.'
        })
      })
    );

    const open = screen.getByRole('button', { name: '8월 5일 (수) 교통비 ₩5,000 기록을 지연 가계부에서 열기' });
    expect(open).toBeDisabled();
    expect(open).toHaveAccessibleDescription(
      '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요. 한 가계부만 보기로 돌아가면 저장하지 못한 기록을 다시 저장할 수 있습니다.'
    );
  });

  it('막힌 채로 눌러도 그 가계부로 나가지 않는다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({ blend: blendOf({ openBlockedReason: '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다.' }) })
    );

    await user.click(screen.getByRole('button', { name: '8월 5일 (수) 교통비 ₩5,000 기록을 지연 가계부에서 열기' }));
    expect(handlers.onOpenBlendSource).not.toHaveBeenCalled();
  });

  it('열 수 있는 출처가 하나도 없으면 차단 사유를 만들지 않는다 (막을 버튼이 없다)', () => {
    renderLedgerView(
      baseViewModel({
        blend: blendOf({ openableSources: [], openBlockedReason: '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다.' })
      })
    );

    expect(screen.queryByText(/한 가계부만 보기로 돌아가면/)).toBeNull();
  });

  it('다른 시트의 가계부는 열기 버튼 대신 이유를 말한다 (되지 않는 버튼을 그리지 않는다)', () => {
    renderLedgerView(baseViewModel({ blend: blendOf({ openableSources: ['a'] }) }));

    expect(screen.queryByRole('button', { name: /지연 가계부에서 열기$/ })).toBeNull();
    expect(
      screen.getByText('다른 시트에 있는 가계부는 이 화면에서 바로 열 수 없습니다. 시트를 다시 골라 연결하면 볼 수 있습니다.')
    ).toBeInTheDocument();
  });
});

/**
 * 🔴 **모바일 카드 모드의 구조 전제** — jsdom 은 레이아웃이 없어 "버튼이 포개졌다"를 직접 볼 수
 * 없다. 대신 그 사고를 만드는 **구조**를 잠근다: 카드 모드에서 카드가 되는 것도, `ActionCell` 의
 * 절대 위치가 기준으로 삼는 유일한 positioned ancestor 도 `tbody` 다. 모든 행이 한 `tbody` 안에
 * 있으면 행마다 하나여야 할 "열기" 버튼이 전부 같은 자리에 겹친다(마지막 하나만 눌린다).
 * `LedgerTable` 의 정본 관용구가 "한 기록 = 한 tbody" 인 이유가 그것이다.
 */
describe('블렌딩 표의 구조 — 한 기록 = 한 tbody', () => {
  it('기록 수만큼 행 묶음이 생긴다 (머리글 1 + 기록 2)', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    const table = screen.getByRole('table', { name: '2026년 8월 두 가계부를 합친 수입·지출 기록' });
    /* thead 1개 + 기록마다 tbody 1개 = 3. 전부 한 tbody 로 합치면 2가 되어 여기서 죽는다. */
    expect(within(table).getAllByRole('rowgroup')).toHaveLength(3);
  });

  it('각 행 묶음은 자기 기록의 열기 버튼을 정확히 하나 갖는다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf() }));

    const table = screen.getByRole('table', { name: '2026년 8월 두 가계부를 합친 수입·지출 기록' });
    const groups = within(table).getAllByRole('rowgroup');
    // 첫 묶음은 머리글이라 버튼이 없다.
    expect(within(groups[0]).queryAllByRole('button')).toHaveLength(0);
    expect(within(groups[1]).getAllByRole('button')).toHaveLength(1);
    expect(within(groups[2]).getAllByRole('button')).toHaveLength(1);
    expect(
      within(groups[2]).getByRole('button', { name: '8월 5일 (수) 교통비 ₩5,000 기록을 지연 가계부에서 열기' })
    ).toBeInTheDocument();
  });
});

describe('AC3-5 — 반쪽 실패를 합계로 위장하지 않는다', () => {
  const PARTIAL: LedgerBlendModel = {
    labels: { a: '민수', b: '지연' },
    body: {
      kind: 'partial',
      failure: {
        source: 'b',
        label: '지연',
        error: { title: '저장하지 못했습니다', body: '무시된다', reason: 'network' }
      },
      available: subtotal({}),
      rows: [MINE],
      unreadable: []
    }
  };

  it('합산 3숫자가 없고, 왜 없는지 말한다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf({ model: PARTIAL }) }));

    expect(screen.queryByText('2026년 8월 두 가계부 순액')).toBeNull();
    expect(screen.queryByText('-₩17,000')).toBeNull();
    expect(screen.getByText('두 가계부의 합계를 표시할 수 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText('지연 가계부를 불러오지 못해 합계를 계산하지 않았습니다. 아래는 불러온 가계부 하나의 기록입니다.')
    ).toBeInTheDocument();
  });

  it('실패한 쪽을 이름으로 짚고 읽기 쪽 문장으로 사유를 말한다 (저장 실패 문구를 빌려 오지 않는다)', () => {
    renderLedgerView(baseViewModel({ blend: blendOf({ model: PARTIAL }) }));

    expect(screen.getByText('지연 가계부를 불러오지 못했습니다')).toBeInTheDocument();
    expect(
      screen.getByText('네트워크 문제로 시트를 읽지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
    ).toBeInTheDocument();
    expect(screen.queryByText('저장하지 못했습니다')).toBeNull();
  });

  it('성공한 쪽의 소계는 남는다 — 그것은 합산이 아니라 그 가계부 하나의 숫자다', () => {
    renderLedgerView(baseViewModel({ blend: blendOf({ model: PARTIAL }) }));

    const subtotals = within(screen.getByRole('region', { name: '가계부별 소계' }));
    expect(subtotals.getByText('민수')).toBeInTheDocument();
    expect(subtotals.getByText('₩12,000')).toBeInTheDocument();
    /* 실패한 쪽의 소계는 만들지 않는다 — 0 으로 채우면 "안 썼다"가 된다. */
    expect(subtotals.queryByText('지연')).toBeNull();
  });

  it('양쪽 실패면 숫자가 하나도 없다', () => {
    const UNAVAILABLE: LedgerBlendModel = {
      labels: { a: '민수', b: '지연' },
      body: {
        kind: 'unavailable',
        failures: [
          { source: 'a', label: '민수', error: { title: 'x', body: 'y', reason: 'network' } },
          { source: 'b', label: '지연', error: { title: 'x', body: 'y', reason: 'rateLimited' } }
        ]
      }
    };
    renderLedgerView(baseViewModel({ blend: blendOf({ model: UNAVAILABLE }) }));

    expect(screen.getByText('두 가계부를 모두 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.getByText('민수 가계부를 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.getByText('지연 가계부를 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.queryByText('가계부별 소계')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });
});

describe('블렌딩 설정 화면', () => {
  const setupModel = {
    options: [
      { value: 'sheet-1:0', name: '내탭' },
      { value: 'sheet-1:7', name: '배우자탭' }
    ],
    a: { value: 'sheet-1:0', label: '민수' },
    b: { value: 'sheet-1:0', label: '지연' },
    blockedReason: '서로 다른 가계부를 골라 주세요. 같은 가계부를 두 번 고르면 모든 금액이 두 배가 됩니다.',
    canClear: false,
    isLoadingNames: false
  };

  it('같은 가계부를 두 번 고르면 제출이 막히고 사유가 함께 선다 (무음 비활성 금지)', () => {
    renderLedgerView(
      baseViewModel({ blend: blendOf({ isOn: false, hasConfig: false, model: null, setup: setupModel }) })
    );

    const submit = screen.getByRole('button', { name: '합쳐 보기' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAccessibleDescription(
      '서로 다른 가계부를 골라 주세요. 같은 가계부를 두 번 고르면 모든 금액이 두 배가 됩니다.'
    );
  });

  it('두 구성 경로를 모두 안내하고, 이름 입력은 상한을 넘겨 받지 않는다', () => {
    renderLedgerView(
      baseViewModel({
        blend: blendOf({
          isOn: false,
          hasConfig: false,
          model: null,
          setup: { ...setupModel, b: { value: 'sheet-1:7', label: '지연' }, blockedReason: null }
        })
      })
    );

    expect(
      screen.getByText('같은 시트의 두 탭으로도, 서로 다른 시트로도 구성할 수 있습니다.')
    ).toBeInTheDocument();
    const nameInputs = screen.getAllByLabelText('이 가계부를 부를 이름');
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0]).toHaveAttribute('maxlength', '20');
  });

  it('가계부 선택을 바꾸면 그 자리의 값만 바뀐다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({
        blend: blendOf({
          isOn: false,
          hasConfig: false,
          model: null,
          setup: { ...setupModel, b: { value: null, label: '지연' }, blockedReason: null }
        })
      })
    );

    const picks = screen.getAllByLabelText('가계부');
    await user.selectOptions(picks[1], 'sheet-1:7');
    expect(handlers.onChangeBlendSource).toHaveBeenCalledWith('b', 'sheet-1:7');
  });
});
