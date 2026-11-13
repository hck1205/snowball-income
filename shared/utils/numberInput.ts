/**
 * 숫자 입력창 문자열 ↔ 계산값(2026-11-13 추출) — 계산기 지면(세금·은퇴 소득)이 각자 들고 있던 것을 모았다.
 */

/** 입력창 문자열 → 양수. 쉼표는 지우고, 빈 칸·음수·숫자 아님은 0. */
export const parsePositiveInput = (value: string): number => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const WON_PER_MAN = 10_000;

/** 만원 단위 입력창 문자열 → 원. */
export const manInputToWon = (value: string): number => parsePositiveInput(value) * WON_PER_MAN;

/** 비율(소수) → 사람이 읽는 퍼센트. 소수 첫째 자리까지, 끝의 0은 지운다 — 0.055 → "5.5%", 0.15 → "15%". */
export const formatRatePercent = (rate: number): string => `${Number((rate * 100).toFixed(1))}%`;
