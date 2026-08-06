/**
 * 목차에서 조항으로 **주소를 더럽히지 않고** 이동한다.
 *
 * 평범한 `<a href="#terms-liability">` 는 브라우저가 위치를 해시로 바꾼다. 이 앱은 해시를 상태
 * 전달에 쓰지 않기로 했고(확정 결정), 더 중요하게는 `/privacy` 가 **구글 OAuth 동의 화면 심사가
 * 여는 주소**다 — 목차를 한 번 누르면 그 뒤로 공유되는 주소가 `/privacy#privacy-overseas` 가 되고,
 * 라우트가 발행하는 canonical 과도 어긋난다. 그래서 `href` 는 남기되(키보드·미리보기·JS 꺼짐에서
 * 여전히 동작한다) 기본 동작을 막고 우리가 직접 옮긴다.
 *
 * 옮긴 뒤 **초점까지 옮긴다.** 스크롤만 하면 키보드 사용자는 화면만 움직이고 탭 순서는 목차에 남는다
 * — 다음 Tab 이 조항 본문이 아니라 목차의 다음 항목으로 간다. 대상 제목이 `tabIndex={-1}` 을 갖는
 * 이유가 이것이다(가리키는 쪽이 아니라 받는 쪽이 준비돼 있어야 한다).
 *
 * ⚠ jsdom 에는 `scrollIntoView` 가 없다. 실패를 예외로 던지지 않고 `false` 로 돌려주고, 소비처는
 *   그때 브라우저 기본 동작(해시 점프)을 막지 않는다 — 기능이 사라지는 것보다 낫다.
 */
export const scrollToClause = (id: string): boolean => {
  if (typeof document === 'undefined') return false;

  const target = document.getElementById(id);
  if (!(target instanceof HTMLElement)) return false;
  if (typeof target.scrollIntoView !== 'function') return false;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  // 스크롤은 위에서 이미 우리가 결정했다 — 초점 이동이 그 위치를 다시 흔들지 않게 한다.
  target.focus({ preventScroll: true });

  return true;
};
