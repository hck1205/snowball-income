import { useEffect, useRef, useState } from 'react';
import { useScenarioPrefillAtomValue } from '@/jotai';

/** 진입 연출 총 길이(지연 160ms + 지속 100ms). 이 시간이 지나면 선언 자체를 내린다. */
const REVEAL_TOTAL_MS = 260;
/** 표식을 내리기 전 여유 — 마지막 프레임이 끝난 뒤에 지운다. */
const REVEAL_CLEAR_MS = REVEAL_TOTAL_MS + 60;

/**
 * **"결과가 지금 처음 나타났는가"** — 한 세션에 한 번만 참이 되는 판정.
 *
 * | 상황 | 결과 | 이유 |
 * |---|---|---|
 * | 첫 렌더부터 결과가 있음(복원·새로고침·공유 링크) | `false` | 전이가 아니다. 새로고침마다 도는 연출은 금지 사항이다 |
 * | 빈 화면 → 사용자가 프리셋을 고름 | **`true`** | 사용자가 방금 만든 변화 |
 * | 빈 화면 → 첫 방문 **프리필**이 채움 | `false` | 프리필은 "사용자가 한 일"이 아니다 — 앱이 대신 채운 화면을 |
 * | | | 축하하면 사용자는 자기가 뭘 했는지 모른 채 연출만 본다 |
 * | 그 뒤의 모든 리렌더·재계산 | `false` | 슬라이더 한 칸마다 다시 돌면 연출이 아니라 소음이다 |
 *
 * 🔴 **프리필은 "건너뛰기"이지 "잠금"이 아니다**(2026-07-31 실측으로 뒤집은 판단). 프리필에서
 *   잠가 버리면 이 연출은 사실상 죽는다 — 첫 방문자는 **항상** 프리필을 받으므로, 그 뒤 종목을
 *   전부 지우고 프리셋을 고르는 진짜 "내가 만든 첫 결과"까지 함께 막힌다. 실브라우저에서
 *   그 경로를 따라가 보니 연출이 한 번도 뜨지 않았다. 잠금은 **실제로 연출한 순간**에만 건다.
 *
 * ⚠ 프리필 판정은 `scenarioPrefillAtom` 을 읽는다. 프리필이 적용되는 그 순간 이 값은
 *   `{status:'applied'}`(non-null)이고, 사용자가 무엇이든 바꾸면 영속 계층이 null 로 되돌린다.
 *   사용자가 직접 고른 프리셋 적용 경로는 이 atom 을 건드리지 않는다 — 그래서 둘이 구분된다.
 *
 * 🔴 판정이 **effect 가 아니라 렌더 중**에 일어나야 한다(2026-07-31 실브라우저 실측). effect 로
 *   켜면 카드가 **한 번 제 모습으로 그려진 뒤** 다음 커밋에서 opacity 0 부터 다시 들어온다 —
 *   연출이 아니라 깜빡임이다. 실측에서 결과가 붙는 첫 프레임의 `animation-name` 이 `none` 으로
 *   나왔던 것이 그 증거다. 렌더 중 `setState` 는 React 가 커밋 전에 다시 그려 주므로 첫 프레임부터
 *   애니메이션이 붙는다(공식 권장 패턴 "렌더 중 상태 조정").
 */
export const useFirstResultReveal = (hasResults: boolean): boolean => {
  const prefill = useScenarioPrefillAtomValue();
  const isPrefilling = prefill !== null;

  /**
   * 직전 렌더의 결과 유무. **상태**로 들고 있어야 한다(ref 아님) —
   * ①StrictMode 는 렌더를 두 번 돌리는데 ref 를 렌더 중에 덮으면 두 번째 패스에서 전이가 사라진다
   * ②초기값이 `hasResults` 라 "첫 렌더부터 결과가 있음"은 전이가 아니게 되어 저절로 걸러진다.
   */
  const [hadResults, setHadResults] = useState(hasResults);
  const hasRevealedRef = useRef(false);
  const [isRevealing, setIsRevealing] = useState(false);

  /*
   * 🔴 **상태가 아니라 전이를 본다.** 조건을 "결과가 있다"로 두면 프리필이 채운 뒤 사용자가 첫 편집을
   *   하는 순간(프리필 표식이 내려가는 순간) 결과는 그대로인데 조건만 참이 되어 **아무 일도 없었는데
   *   연출이 돈다.** 실브라우저에서 정확히 그렇게 났다(2026-07-31 실측).
   */
  if (hadResults !== hasResults) {
    setHadResults(hasResults);

    if (hasResults && !hasRevealedRef.current && !isPrefilling) {
      hasRevealedRef.current = true;
      setIsRevealing(true);
    }
  }

  useEffect(() => {
    if (!isRevealing) return undefined;
    /*
     * 끝나면 표식을 내려 애니메이션 선언 자체를 DOM 에서 없앤다.
     * 결과 이미지 저장이 이 그리드를 **살아 있는 그대로** 찍기 때문이다 — 연출 도중에 찍히면
     * 반투명·어긋난 그림이 나온다. 선언이 남아 있지 않으면 그 창이 애초에 닫힌다.
     */
    const timer = window.setTimeout(() => setIsRevealing(false), REVEAL_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [isRevealing]);

  return isRevealing;
};
