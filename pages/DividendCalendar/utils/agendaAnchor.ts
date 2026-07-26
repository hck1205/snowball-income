import { scrollIntoViewSafely } from '@/shared/utils';

/**
 * 달력 날짜 칸 → 아젠다(지급 일정 목록)의 같은 날짜로 보내는 앵커.
 *
 * 표와 목록은 같은 데이터의 두 표현이라 "칸을 눌렀다"가 목록의 그 날로 이어져야 한다.
 * id 규칙을 한 곳에 두는 이유: 만드는 쪽(AgendaList)과 찾는 쪽(페이지)이 문자열을 각자 조립하면
 * 조용히 어긋나 아무 일도 안 일어난다(무음 실패).
 */
export const agendaDayElementId = (isoDate: string): string => `dividend-agenda-day-${isoDate}`;

/**
 * 그 날짜 블록으로 포커스를 옮기고 화면 가운데로 스크롤한다. 대상이 없으면 조용히 아무것도 안 한다
 * (다른 달의 날짜, 아직 안 그려진 탭 — 호출부에서 rAF로 한 프레임 미룬 뒤에 부른다).
 *
 * 순서가 중요하다: **포커스 먼저(preventScroll) → 스크롤 나중**. 반대로 하면 브라우저가
 * 스크롤을 두 번(부드럽게 한 번, 포커스가 즉시 한 번) 하게 돼 화면이 튄다.
 */
export const focusAgendaDay = (isoDate: string): void => {
  const element = typeof document === 'undefined' ? null : document.getElementById(agendaDayElementId(isoDate));
  if (!element) return;

  element.focus?.({ preventScroll: true });
  scrollIntoViewSafely(element, { block: 'center' });
};
