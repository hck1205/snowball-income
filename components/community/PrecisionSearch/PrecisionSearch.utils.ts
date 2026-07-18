import { COMMUNITY_COPY, type GalleryFilters } from '@/shared/constants/community';
import type { FilterDraft } from './PrecisionSearch.types';

/**
 * PrecisionSearch 순수 변환/검증 — IO·컴포넌트 없음, 테스트 대상.
 * (InputField.utils는 다른 폴더 내부라 cross-import 금지 → 여기 로컬 순수 함수로 둔다.)
 */

const WON_PER_MANWON = 10_000;

export const EMPTY_DRAFT: FilterDraft = { mdMin: '', mdMax: '', tgtMin: '', durMin: '', durMax: '' };

/** 숫자 외 문자를 전부 제거한다(콤마·공백·문자·부호 방어). */
export const normalizeDigits = (raw: string): string => raw.replace(/\D/g, '');

/** 숫자 문자열에 천단위 콤마를 넣는다. 빈 값·"0…"의 선행 0은 접는다. */
export const formatThousands = (raw: string): string => {
  const digits = normalizeDigits(raw).replace(/^0+(?=\d)/, '');
  if (digits === '') return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** 표시 문자열 → 양의 정수(경계). 빈 값·0·비수는 undefined(경계 없음). */
const toBound = (display: string): number | undefined => {
  const digits = normalizeDigits(display);
  if (digits === '') return undefined;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** 만원 표시 → 원. */
const manwonToWon = (display: string): number | undefined => {
  const manwon = toBound(display);
  return manwon == null ? undefined : manwon * WON_PER_MANWON;
};

/** 원 → 만원 표시(콤마). 정수 만원 가정 — 비정렬 값(외부/수기 URL)은 반올림 표기(값 자체는 URL이 정본). */
const wonToManwonDisplay = (won: number | undefined): string => {
  if (won == null || !Number.isFinite(won) || won <= 0) return '';
  return formatThousands(String(Math.round(won / WON_PER_MANWON)));
};

/** 드래프트(만원/년) → GalleryFilters(원/년). */
export const draftToFilters = (draft: FilterDraft): GalleryFilters => ({
  mdMin: manwonToWon(draft.mdMin),
  mdMax: manwonToWon(draft.mdMax),
  tgtMin: manwonToWon(draft.tgtMin),
  durMin: toBound(draft.durMin),
  durMax: toBound(draft.durMax)
});

/** GalleryFilters(원/년) → 드래프트(만원 콤마/년) — 패널을 열 때 커밋값으로 시딩한다. */
export const filtersToDraft = (filters: GalleryFilters): FilterDraft => ({
  mdMin: wonToManwonDisplay(filters.mdMin),
  mdMax: wonToManwonDisplay(filters.mdMax),
  tgtMin: wonToManwonDisplay(filters.tgtMin),
  durMin: filters.durMin != null ? String(filters.durMin) : '',
  durMax: filters.durMax != null ? String(filters.durMax) : ''
});

/**
 * min ≤ max 검증(경계는 원/년). 위반이면 카피 메시지, 정상이면 null.
 * (목표는 이상≥ 단일이라 range 없음 → 검증 대상 아님.)
 */
export const validateFilters = (filters: GalleryFilters): string | null => {
  const message = COMMUNITY_COPY.gallery.filterRangeError;
  if (filters.mdMin != null && filters.mdMax != null && filters.mdMin > filters.mdMax) return message;
  if (filters.durMin != null && filters.durMax != null && filters.durMin > filters.durMax) return message;
  return null;
};
