import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { TickerDraft } from '@/shared/types/snowball';
import { TickerDraftForm } from '@/pages/Main/components/TickerModal/components/TickerDraftForm';
import { buildFrequencyMismatchHint } from '@/pages/Main/components/TickerModal';

/**
 * "배당률은 넣었는데 지급 주기가 `배당 없음`" 모순 고지.
 *
 * 🔴 **선택지를 막지 않는다** — 무배당 종목(성장주)을 정직하게 담는 것이 그 옵션의 존재 이유다.
 * 계산도 이미 안전하다(주기 `none` 이면 엔진이 배당을 만들지 않는다). 남은 것은 "사용자가 배당률만
 * 보고 배당을 기대한다"는 오해뿐이라 **금지가 아니라 한 줄 고지**로 푼다.
 */

const HINT = "배당률이 입력돼 있지만 지급 주기가 '배당 없음'이라 배당이 계산되지 않습니다.";

const makeDraft = (draft: Partial<TickerDraft>): TickerDraft => ({
  ticker: 'TEST',
  name: 'TEST',
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 3,
  expectedTotalReturn: 6,
  frequency: 'monthly',
  ...draft
});

/** "직접 입력" 탭의 편집 가능한 폼 — 모순 조합을 실제로 만들 수 있는 유일한 화면이다. */
const renderDraftForm = (draft: TickerDraft) => {
  render(
    <TickerDraftForm
      tickerDraft={draft}
      isCreateCustomInput
      derivedTotalReturn={draft.expectedTotalReturn}
      totalReturnCaption={null}
      onChangeDraft={vi.fn()}
      onHelpExpectedTotalReturn={vi.fn()}
    />
  );
};

describe('배당 주기 모순 고지 — 순수 규칙', () => {
  it('배당률 > 0 이고 주기가 none 이면 고지한다', () => {
    expect(buildFrequencyMismatchHint({ dividendYield: 3, frequency: 'none' })).toBe(HINT);
  });

  it('주기가 none 이 아니면 고지하지 않는다', () => {
    expect(buildFrequencyMismatchHint({ dividendYield: 3, frequency: 'monthly' })).toBeUndefined();
    expect(buildFrequencyMismatchHint({ dividendYield: 3, frequency: 'quarterly' })).toBeUndefined();
  });

  it('배당률이 0 이거나 아직 안 친 상태(NaN)면 고지하지 않는다 — 무배당 종목은 정상 입력이다', () => {
    expect(buildFrequencyMismatchHint({ dividendYield: 0, frequency: 'none' })).toBeUndefined();
    expect(buildFrequencyMismatchHint({ dividendYield: Number.NaN, frequency: 'none' })).toBeUndefined();
  });
});

describe('배당 주기 모순 고지 — 직접 입력 폼', () => {
  it('배당률 3% + 배당 없음 조합에서 고지가 뜨고, 셀렉트가 그 문장을 함께 읽는다', () => {
    renderDraftForm(makeDraft({ dividendYield: 3, frequency: 'none' }));

    const hint = screen.getByText(HINT);
    expect(hint).toBeInTheDocument();

    // 스크린리더도 함께 읽어야 한다 — 눈으로만 보이는 경고는 절반짜리다.
    const select = screen.getByRole('combobox', { name: '배당 지급 주기' });
    expect(select.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('정상 조합(배당률 3% + 월)에서는 고지가 없다', () => {
    renderDraftForm(makeDraft({ dividendYield: 3, frequency: 'monthly' }));

    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('무배당 종목(배당률 0 + 배당 없음)은 막지도 나무라지도 않는다', () => {
    renderDraftForm(makeDraft({ dividendYield: 0, frequency: 'none' }));

    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    // 선택지 자체는 살아 있다.
    expect(screen.getByRole('option', { name: '배당 없음' })).toBeInTheDocument();
  });
});
