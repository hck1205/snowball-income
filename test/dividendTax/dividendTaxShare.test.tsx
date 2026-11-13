import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DIVIDEND_TAX_FORM,
  formFromSearch,
  formToSearch,
  type DividendTaxForm
} from '@/pages/DividendTax/DividendTaxPage/DividendTaxPage.utils';

// 페이지 껍데기(헤더·로그인 Provider)는 이 테스트의 관심사가 아니다 — 본문만 그린다.
vi.mock('@/pages/Ticker/components', () => ({ TickerPageShell: ({ children }: { children: ReactNode }) => <>{children}</> }));

const { default: DividendTaxPage } = await import('@/pages/DividendTax/DividendTaxPage/DividendTaxPage');

/**
 * 세금 계산기 결과 공유(2026-11-13). 잠그는 것:
 * ① 🔴 공유 링크는 사용자 자산이다 — 키 이름이 바뀌면 이미 나간 링크가 기본값으로 열린다(왕복 + 고정 문자열)
 * ② 잘못된 값·모르는 키는 기본값(열리지 않는 링크 0)
 * ③ 링크로 들어오면 그 조건의 결과가 보이고, 공유 창의 주소에 지금 조건이 실린다
 */
describe('계산 조건 ↔ 주소', () => {
  it('왕복한다', () => {
    const form: DividendTaxForm = {
      monthlyUs: '300',
      otherFinancial: '500',
      otherTaxBase: '4000',
      health: 'dependent',
      otherIncomeForDependent: '800',
      isaSeomin: true
    };
    expect(formFromSearch(formToSearch(form))).toEqual(form);
    expect(formFromSearch(formToSearch(DEFAULT_DIVIDEND_TAX_FORM))).toEqual(DEFAULT_DIVIDEND_TAX_FORM);
  });

  it('🔴 이미 나간 링크의 모양 — 키 이름을 고정한다', () => {
    expect(formFromSearch('?m=300&h=dependent&of=500&ot=4000&od=800&isa=1')).toEqual({
      monthlyUs: '300',
      otherFinancial: '500',
      otherTaxBase: '4000',
      health: 'dependent',
      otherIncomeForDependent: '800',
      isaSeomin: true
    });
    expect(formToSearch({ ...DEFAULT_DIVIDEND_TAX_FORM, monthlyUs: '200' })).toBe('?m=200&h=regional');
  });

  it('잘못된 값·모르는 키는 기본값이다', () => {
    expect(formFromSearch('?m=-5&h=boss&of=abc&ot=1e9&isa=yes&x=1')).toEqual(DEFAULT_DIVIDEND_TAX_FORM);
  });

  it('피부양자가 아니면 피부양자 전용 값은 싣지 않는다', () => {
    expect(formToSearch({ ...DEFAULT_DIVIDEND_TAX_FORM, otherIncomeForDependent: '900' })).not.toContain('od=');
  });
});

describe('세금 계산기 공유', () => {
  const renderAt = (entry: string) =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <DividendTaxPage />
      </MemoryRouter>
    );

  it('공유 링크로 들어오면 그 조건으로 시작한다', () => {
    renderAt('/dividend/tax?m=300&h=dependent');
    expect(screen.getByLabelText(/미국 주식·ETF 월 배당/)).toHaveValue('300');
    expect(screen.getByRole('radio', { name: '피부양자' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('탈락 가능')).toBeInTheDocument(); // 월 300만원 = 연 3,600만원 → 피부양자 소득요건 초과
  });

  it('공유 창의 주소에 지금 입력한 조건이 실린다', async () => {
    const user = userEvent.setup();
    renderAt('/dividend/tax');
    const monthly = screen.getByLabelText(/미국 주식·ETF 월 배당/);
    await user.clear(monthly);
    await user.type(monthly, '250');
    await user.click(screen.getByRole('radio', { name: '직장가입자' }));
    await user.click(screen.getByRole('button', { name: '이 결과 공유하기' }));

    const dialog = await screen.findByRole('dialog');
    const address = within(dialog).getByRole('textbox') as HTMLInputElement;
    expect(address.value).toMatch(/\/dividend\/tax\?m=250&h=employee$/);
  });
});
