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
 * 대상이 나타날 때까지 기다리는 **프레임 수**.
 *
 * 🔴 이 상수가 이 파일의 수리다(2026-08-07 모바일 사용자 신고: "날짜를 클릭해도 아무 일도 없다").
 * 종전에는 호출부가 rAF 로 **한 프레임만** 미룬 뒤 한 번 찾고, 없으면 조용히 끝냈다. 좁은 폭에서는
 * 아젠다가 탭 안에 있어 탭 전환 → 목록 마운트가 한 프레임 안에 끝나지 않는다 — 그래서 날짜를
 * 눌러도 아무 일이 없었다. **무음 실패라 아무도 모르고 지나갔다.**
 *
 * 12프레임(≈200ms)은 "탭이 열리는 시간"과 "없는 날짜에 매달리지 않는 시간" 사이의 값이다.
 */
const MAX_WAIT_FRAMES = 12;

/**
 * 그 날짜 블록으로 포커스를 옮기고 화면 가운데로 스크롤한다.
 *
 * 대상이 아직 없으면 **다음 프레임에 다시 찾는다**(최대 MAX_WAIT_FRAMES). 끝내 없으면 조용히
 * 끝낸다 — 다른 달의 날짜처럼 정말로 없는 경우가 있다.
 *
 * 순서가 중요하다: **포커스 먼저(preventScroll) → 스크롤 나중**. 반대로 하면 브라우저가
 * 스크롤을 두 번(부드럽게 한 번, 포커스가 즉시 한 번) 하게 돼 화면이 튄다.
 *
 * @returns 기다림을 중단하는 함수. 호출부(effect)가 정리에 쓴다 — 안 쓰면 날짜를 연달아 누를 때
 *          옛 기다림이 살아남아 나중에 엉뚱한 날로 스크롤한다.
 */
export const focusAgendaDay = (isoDate: string): (() => void) => {
  if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return () => undefined;

  let frame = 0;
  let handle = 0;
  let cancelled = false;

  const attempt = () => {
    if (cancelled) return;

    const element = document.getElementById(agendaDayElementId(isoDate));
    if (element) {
      element.focus?.({ preventScroll: true });
      scrollIntoViewSafely(element, { block: 'center' });
      return;
    }

    frame += 1;
    if (frame >= MAX_WAIT_FRAMES) return;
    handle = requestAnimationFrame(attempt);
  };

  handle = requestAnimationFrame(attempt);

  return () => {
    cancelled = true;
    cancelAnimationFrame(handle);
  };
};
