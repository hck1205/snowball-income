import { storageKey } from '@/shared/lib/storage';
import type { InvestorAnswers } from '@/shared/lib/investorType';

/**
 * 투자 성향 테스트의 **곁다리 순수 함수** — 진행 중 답안 보관과 이니셜.
 *
 * 🔴 화면(`InvestorTypePage.tsx`)에서 갈라 낸 이유(2026-08-27): 그 파일이 435줄로 상태·계측·
 * 라우팅·문항 화면·결과 화면·저장까지 전부 들고 있었다. 저장은 화면과 무관하게 혼자 검증되는
 * 관심사라 가장 먼저 떨어져 나온다.
 */

/** 진행 중 답안. 🔴 접두사는 `storageKey` 가 소유한다 — 문자열을 직접 적지 마라. */
export const ANSWERS_KEY = storageKey('investor-type:answers:v1');

export const readSavedAnswers = (): InvestorAnswers => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // 손상된 저장값은 조용히 빈 답안으로 — throw 하지 않는다(하위 호환 규율).
    return parsed && typeof parsed === 'object' ? (parsed as InvestorAnswers) : {};
  } catch {
    return {};
  }
};

export const writeSavedAnswers = (answers: InvestorAnswers): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    // 쿼터·차단 → 이어하기만 못 한다. 테스트 자체는 계속 된다.
  }
};

export const clearSavedAnswers = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ANSWERS_KEY);
  } catch {
    // no-op
  }
};

/**
 * 이름의 **낱말 첫 글자들**. "워런 버핏" → "워버". 한글은 성 한 글자만 떼면 구별이 안 된다
 * (`pages/Investors/utils` 가 같은 규칙을 쓴다 — 두 화면의 이니셜이 갈리면 같은 사람으로 안 읽힌다).
 */
export const toInitials = (person: string): string =>
  person
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3);
