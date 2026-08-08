import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildLedgerViewTabs } from '@/pages/Ledger/utils';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * 화면 탭바 · 주체 범위 — **사용자 행동**으로 검증한다.
 *
 * 🔴 className·Emotion 내부 구현을 보지 않는다(`.cursor/rules`). 보이는 것과 누르는 것만 본다.
 */

describe('화면 탭바', () => {
  it('⭐ 네 탭이 보이고 가계부가 골라져 있다', async () => {
    renderLedgerView(baseViewModel());

    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['가계부', '자산', '투자', '분류 규칙']);
    expect(screen.getByRole('tab', { name: '가계부' })).toHaveAttribute('aria-selected', 'true');
  });

  it('⭐ 탭을 누르면 그 탭을 고른다', async () => {
    const onSelectViewTab = vi.fn();
    renderLedgerView(baseViewModel(), { onSelectViewTab });

    await userEvent.click(await screen.findByRole('tab', { name: '자산' }));

    expect(onSelectViewTab).toHaveBeenCalledWith('holdings');
  });

  it('🔴 앱이 만든 시트가 아니면 세 탭이 막히고 **사유가 함께 선다** — 무음 비활성 금지', async () => {
    renderLedgerView(baseViewModel({ viewTabs: buildLedgerViewTabs(false) }));

    const holdings = await screen.findByRole('tab', { name: '자산' });
    expect(holdings).toBeDisabled();

    /* 사유가 화면에 있고, 막힌 탭이 그것을 가리킨다. */
    const describedBy = holdings.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const reason = document.getElementById(describedBy as string);
    expect(reason?.textContent).toContain('히포가 만든 시트');
    /* 🔴 권한 문제로 말하지 않는다 — 사용자가 엉뚱한 곳(공유 설정)을 고치려 든다. */
    expect(reason?.textContent).not.toContain('권한');
  });

  it('⭐ 자산 탭을 보고 있으면 기록 목록 대신 자산 패널이 보인다', async () => {
    renderLedgerView(baseViewModel({
        selectedViewTab: 'holdings',
        sideTab: {
          status: 'ready',
          holdings: {
            rows: [
              {
                id: 'h1',
                date: '2026-08-31',
                kindLabel: '예금',
                name: '주거래통장',
                amountText: '10,000,000원',
                isDebt: false,
                memo: ''
              }
            ],
            trend: [
              {
                month: '2026-08',
                monthLabel: '2026년 8월',
                valueText: '10,000,000원',
                ratio: 1,
                isNegative: false
              }
            ],
            latestNetWorthText: '10,000,000원',
            latestMonthLabel: '2026년 8월',
            skipped: 0
          }
        }
      }));

    /* 같은 금액이 순자산·추이·표 세 곳에 나오는 것이 정상이다 — 하나만 있기를 기대하지 않는다. */
    expect(await screen.findByText('2026년 8월 기준 순자산')).toBeInTheDocument();
    expect(screen.getAllByText('10,000,000원').length).toBeGreaterThan(0);
    expect(screen.getByText('주거래통장')).toBeInTheDocument();
    /* 🔴 기록 목록 대신 자산 패널이다 — 기록 표의 항목이 보이지 않아야 한다. */
    expect(screen.queryByText('식비')).not.toBeInTheDocument();
  });

  it('🔴 부채가 더 많은 달을 글자로 말한다 — 색 단독 채널 금지', async () => {
    renderLedgerView(baseViewModel({
        selectedViewTab: 'holdings',
        sideTab: {
          status: 'ready',
          holdings: {
            rows: [],
            trend: [
              {
                month: '2026-08',
                monthLabel: '2026년 8월',
                valueText: '-3,000,000원',
                ratio: 1,
                isNegative: true
              }
            ],
            latestNetWorthText: '-3,000,000원',
            latestMonthLabel: '2026년 8월',
            skipped: 0
          }
        }
      }));

    expect(await screen.findByText('부채가 더 많습니다')).toBeInTheDocument();
  });

  it('🔴 알아보지 못한 줄이 있으면 몇 줄인지 말한다 — 조용히 버리지 않는다', async () => {
    renderLedgerView(baseViewModel({
        selectedViewTab: 'rules',
        sideTab: { status: 'ready', rules: { rows: [], skipped: 3 } }
      }));

    expect(await screen.findByText(/3줄은 알아보지 못해/)).toBeInTheDocument();
  });

  it('옆탭 읽기가 실패하면 다시 읽기를 준다', async () => {
    const onRetrySideTab = vi.fn();
    renderLedgerView(baseViewModel({
        selectedViewTab: 'investments',
        sideTab: { status: 'error', message: '잠시 뒤에 다시 시도해 주세요.' }
      }), { onRetrySideTab });

    await userEvent.click(await screen.findByRole('button', { name: '다시 읽기' }));
    expect(onRetrySideTab).toHaveBeenCalled();
  });
});

describe('주체 범위 — 부부·연인이 나눠 볼 때', () => {
  it('🔴 혼자 쓰면 컨트롤을 그리지 않는다 — 선택지 하나인 필터는 화면의 거짓말이다', () => {
    renderLedgerView(baseViewModel());

    expect(screen.queryByLabelText('누구의 것을 볼지')).not.toBeInTheDocument();
  });

  it('⭐ 둘 이상이면 컨트롤이 서고 전체 + 각 사람 + 공동을 고를 수 있다', async () => {
    renderLedgerView(baseViewModel({
        payers: ['남편', '아내', LEDGER_PAYER_SHARED],
        offerPayerScope: true
      }));

    const select = await screen.findByLabelText('누구의 것을 볼지');
    const options = Array.from(select.querySelectorAll('option')).map((option) => option.textContent);

    /* 🔴 `공동` 이 하나의 선택지다 — 사람별 합의 총합이 전체와 같아야 하므로 겹치지 않게 나눈다. */
    expect(options).toEqual(['전체', '남편', '아내', LEDGER_PAYER_SHARED]);
  });

  it('⭐ 사람을 고르면 그 사람으로 좁힌다', async () => {
    const onSelectPayerScope = vi.fn();
    renderLedgerView(baseViewModel({ payers: ['남편', '아내'], offerPayerScope: true }), { onSelectPayerScope });

    await userEvent.selectOptions(await screen.findByLabelText('누구의 것을 볼지'), '아내');

    expect(onSelectPayerScope).toHaveBeenCalledWith('아내');
  });

  it('전체를 고르면 좁히지 않는다(null)', async () => {
    const onSelectPayerScope = vi.fn();
    renderLedgerView(baseViewModel({ payers: ['남편', '아내'], payerScope: '아내', offerPayerScope: true }), { onSelectPayerScope });

    await userEvent.selectOptions(await screen.findByLabelText('누구의 것을 볼지'), '전체');

    expect(onSelectPayerScope).toHaveBeenCalledWith(null);
  });
});
