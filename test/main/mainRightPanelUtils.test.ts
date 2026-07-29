import { afterEach, describe, expect, it, vi } from 'vitest';
import { TARGET_MONTHLY_DIVIDEND_INPUT_ID } from '@/shared/constants';
import { focusTargetMonthlyDividendInput } from '@/pages/Main/components/MainRightPanel/MainRightPanel.utils';

/**
 * 목표 포커스 요청이 기대는 순수 헬퍼.
 *
 * 구 `isConfigDrawerLayout`(폭 판정)은 설정 패널이 **전 해상도 드로어**가 되면서 사라졌다 —
 * 호출부는 이제 폭과 무관하게 드로어를 먼저 연다.
 * 포커스 쪽은 jsdom에서 그대로 관측된다 — 단 `scrollIntoView`가 **없는** 환경이라
 * 옵셔널 가드가 빠지면 요청 처리 전체가 TypeError로 죽는다(이 파일이 그 회귀 가드다).
 */

const realMatchMedia = window.matchMedia;

/** 주어진 질의만 참으로 답하는 matchMedia 스텁. `null`이면 matchMedia 자체가 없는 환경을 만든다. */
const stubMatchMedia = (matching: string | null) => {
  if (matching === null) {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === matching,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

const mountTargetInput = (): HTMLInputElement => {
  const input = document.createElement('input');
  input.id = TARGET_MONTHLY_DIVIDEND_INPUT_ID;
  document.body.append(input);
  return input;
};

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: realMatchMedia });
  document.body.innerHTML = '';
});

describe('focusTargetMonthlyDividendInput', () => {
  it('목표 월배당 입력으로 키보드 포커스를 옮긴다', () => {
    const input = mountTargetInput();

    focusTargetMonthlyDividendInput();

    expect(document.activeElement).toBe(input);
  });

  it('scrollIntoView가 없는 환경(jsdom 기본)에서도 던지지 않고 포커스까지 간다', () => {
    const input = mountTargetInput();
    // jsdom에는 scrollIntoView 구현이 없다 — 옵셔널 가드가 빠지면 여기서 TypeError가 난다.
    expect((input as Partial<HTMLElement>).scrollIntoView).toBeUndefined();

    expect(() => focusTargetMonthlyDividendInput()).not.toThrow();
    expect(document.activeElement).toBe(input);
  });

  it('scrollIntoView가 있으면 필드를 화면 가운데로 부드럽게 옮긴다', () => {
    const input = mountTargetInput();
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    focusTargetMonthlyDividendInput();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('모션 최소화 선호를 켜 두면 스크롤을 애니메이션하지 않는다', () => {
    stubMatchMedia('(prefers-reduced-motion: reduce)');
    const input = mountTargetInput();
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    focusTargetMonthlyDividendInput();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('필드를 못 찾으면 조용히 아무것도 하지 않는다 (포커스를 빼앗지 않는다)', () => {
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();

    expect(() => focusTargetMonthlyDividendInput()).not.toThrow();
    // 엉뚱한 곳으로 포커스가 튀거나 body로 떨어지지 않는다.
    expect(document.activeElement).toBe(other);
  });
});
