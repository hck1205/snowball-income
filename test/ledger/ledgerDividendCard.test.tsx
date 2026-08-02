import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LedgerDividendBody } from '@/pages/Ledger/types';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * 🔴 AC4-3 의 스파이 — `vi.mock` 은 파일 최상단으로 끌어올려지므로 스파이도 `vi.hoisted` 로 만든다
 * (평범한 `const` 로 두면 모의 팩토리가 초기화 전에 그것을 읽어 죽는다).
 */
const { writeValues, deleteRow } = vi.hoisted(() => ({ writeValues: vi.fn(), deleteRow: vi.fn() }));

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/googleSheets')>()),
  writeValues,
  deleteRow
}));

/**
 * B-4 **배당 겹쳐 보기** 화면 계약.
 *
 * 🔴 이 기능의 핵심은 "무엇을 그리는가"가 아니라 **무엇을 건드리지 않는가**다 —
 * 월 요약 3숫자와 시트. 그래서 아래 두 검사(AC4-2·AC4-3)가 이 파일의 중심이다.
 *
 * ⚠ 기대 문구는 소스의 상수를 재사용하지 않고 **리터럴로 적는다**(픽스처 주석과 같은 규율) —
 * 상수를 참조하면 카피가 바뀌어도 테스트가 그대로 통과한다.
 */

const withDividend = (body: LedgerDividendBody | null, isOn = body !== null) =>
  baseViewModel({ dividend: { isOn, body } });

const METRICS: LedgerDividendBody = {
  kind: 'metrics',
  amountText: '₩120,000',
  coverageText: '17%',
  coveredCategories: ['통신비', '구독료'],
  unknownScheduleCount: 0
};

describe('B-4 토글 (AC4-1)', () => {
  it('기본은 꺼짐 — 켜는 자리는 남고 지표는 없다', () => {
    renderLedgerView(withDividend(null, false));

    expect(screen.getByRole('heading', { name: '배당 겹쳐 보기' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '배당 겹쳐 보기' })).not.toBeChecked();
    expect(screen.getByText('켜면 이 달 예상 배당이 지출의 어디까지를 덮는지 함께 보여 줍니다.')).toBeInTheDocument();
    expect(screen.queryByText('2026년 8월 예상 배당')).not.toBeInTheDocument();
  });

  it('켜면 지표가 나타난다', () => {
    renderLedgerView(withDividend(METRICS));

    expect(screen.getByRole('checkbox', { name: '배당 겹쳐 보기' })).toBeChecked();
    expect(screen.getByText('2026년 8월 예상 배당')).toBeInTheDocument();
    expect(screen.getByText('₩120,000')).toBeInTheDocument();
  });

  it('스위치를 누르면 켬 의도가 전달된다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(withDividend(null, false));

    await user.click(screen.getByRole('checkbox', { name: '배당 겹쳐 보기' }));

    expect(handlers.onToggleDividendOverlay).toHaveBeenCalledWith(true);
  });
});

/**
 * 🔴 **AC4-2 — 가계부 총합의 정의는 하나다.**
 *
 * 배당을 요약에 더하면 "시트 총합"과 "앱 총합"이 갈리고, 사용자가 배당 입금을 시트에 이미
 * 적어 뒀다면 이중 계상이 된다. 토글은 요약을 **한 글자도** 바꾸지 못한다.
 */
describe('B-4 월 요약 불변 (AC4-2)', () => {
  /** 월 요약 카드 = 월 제목으로 이름 붙은 region(`aria-labelledby`). */
  const readSummary = () => screen.getByRole('region', { name: '2026년 8월' }).textContent;

  it('토글 전후로 수입·지출·합계가 동일하다', () => {
    const off = renderLedgerView(withDividend(null, false));
    const before = readSummary();
    off.unmount();

    renderLedgerView(withDividend(METRICS));
    const after = readSummary();

    expect(after).toBe(before);
    // 픽스처의 요약 숫자가 그대로인지 못박는다(빈 문자열끼리 같아지는 무음 통과 방지).
    expect(before).toContain('₩3,188,000');
    expect(before).toContain('₩3,200,000');
    expect(before).toContain('₩12,000');
    // 배당 금액은 요약 카드 안에 없다 — 형제 카드에만 있다.
    expect(after).not.toContain('₩120,000');
    expect(screen.getByText('₩120,000')).toBeInTheDocument();
  });
});

/**
 * 🔴 **AC4-3 — 배당 경로에는 시트 쓰기가 없다.**
 *
 * 데이터 계층 전체를 모의로 갈아끼운 뒤 배당 카드의 모든 갈래를 그리고 토글까지 눌러 본다.
 * 이 기능이 시트를 만지는 순간 두 스파이 중 하나가 반드시 잡힌다(스파이는 파일 상단에서 만든다).
 */
describe('B-4 시트 무변경 (AC4-3)', () => {
  it('모든 갈래를 그리고 토글을 눌러도 writeValues·deleteRow 가 한 번도 불리지 않는다', async () => {
    const user = userEvent.setup();
    const bodies: (LedgerDividendBody | null)[] = [
      null,
      { kind: 'loading' },
      { kind: 'unavailable' },
      { kind: 'no-holdings' },
      { kind: 'no-payout' },
      { kind: 'fx-unavailable', usdText: '$92.31', unknownScheduleCount: 2 },
      METRICS
    ];

    for (const body of bodies) {
      const view = renderLedgerView(withDividend(body));
      await user.click(screen.getByRole('checkbox', { name: '배당 겹쳐 보기' }));
      view.unmount();
    }

    expect(writeValues).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
  });
});

describe('B-4 값이 없는 갈래 — 0 으로 위장하지 않는다', () => {
  it('보유가 없으면 안내만 있고 금액이 없다 (AC4-4)', () => {
    renderLedgerView(withDividend({ kind: 'no-holdings' }));

    expect(
      screen.getByText('내 포트폴리오에 종목과 보유 수량을 입력하면 이 달 예상 배당을 계산합니다.')
    ).toBeInTheDocument();
    expect(screen.queryByText('2026년 8월 예상 배당')).not.toBeInTheDocument();
    expect(screen.queryByText('₩0')).not.toBeInTheDocument();
  });

  it('포트폴리오를 못 읽었으면 그렇게 말한다', () => {
    renderLedgerView(withDividend({ kind: 'unavailable' }));
    expect(
      screen.getByText('포트폴리오를 불러오지 못해 예상 배당을 계산할 수 없습니다.')
    ).toBeInTheDocument();
  });

  it('이 달 지급이 없으면 달 이름과 함께 말한다', () => {
    renderLedgerView(withDividend({ kind: 'no-payout' }));
    expect(screen.getByText('2026년 8월에 지급이 예정된 보유 종목이 없습니다.')).toBeInTheDocument();
  });
});

/** 🔴 AC4-5 — 환율이 없으면 원화도 커버율도 그리지 않는다(가짜 환산 금지). */
describe('B-4 환율 미가용 (AC4-5)', () => {
  it('달러 원값과 사유만 남고 원화·커버율은 없다', () => {
    renderLedgerView(withDividend({ kind: 'fx-unavailable', usdText: '$92.31', unknownScheduleCount: 0 }));

    expect(screen.getByText('$92.31')).toBeInTheDocument();
    expect(
      screen.getByText('환율을 불러오지 못해 원화 환산과 지출 커버율을 표시할 수 없습니다.')
    ).toBeInTheDocument();
    expect(screen.queryByText('지출 커버율')).not.toBeInTheDocument();

    // 공용 `Card` 의 루트는 `<section>` 이다 — 제목에서 가장 가까운 section 이 곧 이 카드다.
    const card = screen.getByRole('heading', { name: '배당 겹쳐 보기' }).closest('section');
    if (card === null) throw new Error('배당 카드를 찾지 못했다');
    expect(within(card).queryByText(/₩/)).not.toBeInTheDocument();
  });
});

describe('B-4 지표 (AC4-6·AC4-7)', () => {
  it('지출이 0 인 달에는 커버율 대신 사유가 선다 (AC4-6)', () => {
    renderLedgerView(
      withDividend({ ...METRICS, coverageText: null, coveredCategories: [] })
    );

    expect(screen.queryByText('지출 커버율')).not.toBeInTheDocument();
    expect(screen.getByText('이 달에는 지출 기록이 없어 커버율을 계산하지 않습니다.')).toBeInTheDocument();
  });

  it('덮는 분류를 이름으로 말하고, 하나도 못 덮으면 그렇게 말한다', () => {
    const covered = renderLedgerView(withDividend(METRICS));
    expect(screen.getByText('통신비 · 구독료 지출을 덮는 정도입니다.')).toBeInTheDocument();
    expect(screen.getByText('17%')).toBeInTheDocument();
    covered.unmount();

    renderLedgerView(withDividend({ ...METRICS, coveredCategories: [] }));
    expect(screen.getByText('이 달 지출에서 예상 배당만으로 덮이는 분류는 없습니다.')).toBeInTheDocument();
  });

  it('지급월 미상 종목이 있으면 빠졌다는 사실을 숫자로 말한다 (AC4-7)', () => {
    renderLedgerView(withDividend({ ...METRICS, unknownScheduleCount: 3 }));
    expect(
      screen.getByText('지급월을 알 수 없는 3종은 이 계산에 포함되지 않았습니다.')
    ).toBeInTheDocument();
  });
});

/** 🔴 AC4-8 — 전부 "예상"이라고 말하고, 손익색을 새 표면으로 넓히지 않는다. */
describe('B-4 표현 규율 (AC4-8)', () => {
  it('카드가 "예상"과 "합계에 더하지 않음"을 상시로 말한다', () => {
    renderLedgerView(withDividend(METRICS));

    expect(
      screen.getByText('내 포트폴리오 기준 예상 배당입니다. 위 수입·지출 합계에는 더하지 않습니다.')
    ).toBeInTheDocument();
    expect(screen.getByText('2026년 8월 예상 배당')).toBeInTheDocument();
  });

  it('손익색 어트리뷰트가 화면에 하나도 없다', () => {
    const { container } = renderLedgerView(withDividend(METRICS));
    expect(container.querySelectorAll('[data-positive], [data-negative]')).toHaveLength(0);
  });
});
