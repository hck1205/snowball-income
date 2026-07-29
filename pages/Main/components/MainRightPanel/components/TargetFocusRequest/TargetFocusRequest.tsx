import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { hasFocusTargetMonthlyDividendRequest, readTargetMonthlyDividendRequestValue } from '@/shared/constants';
import type { TargetFocusRequestProps } from './TargetFocusRequest.types';

/**
 * 내 포트폴리오(`/dividend/portfolio`) **목표 달성 카드**에서 넘어온 **목표 요청**을 한 번 처리하고
 * 지운다(보내는 쪽은 `pages/Portfolio/PortfolioPage`의 `navigate('/', { state })`).
 * 화면에는 아무것도 그리지 않는다(`null`).
 *
 * ## 왜 별도 컴포넌트인가
 * `useLocation`/`useNavigate`는 Router 컨텍스트가 없으면 throw하는데, `MainRightPanel`은 라우터 없이
 * 격리 렌더되는 테스트가 여럿 있다. 호출부가 `useInRouterContext()`로 게이트해 이 컴포넌트만
 * 렌더/미렌더하면 훅 순서를 흔들지 않고 두 경우를 모두 안전하게 만족한다.
 *
 * ## ⚠ 이 컴포넌트를 MainRightPanel 밖(상위)으로 올리지 말 것
 * 목표 값 커밋(`onApplyTarget` → `setField`)은 **하이드레이션이 끝난 뒤**여야 한다.
 * `MainRightPanel`은 `isPortfolioHydrated === true`일 때만 마운트되므로(pages/Main/Main.view.tsx)
 * 여기서의 커밋은 저장 payload 적용 **이후**로 보장된다. 상위(Main·앱 루트)로 올리면 하이드레이션이
 * 방금 커밋한 목표를 매번 저장값으로 덮어써 "칩을 눌렀는데 아무 일도 안 일어난다"가 된다.
 *
 * 순서도 고정이다: **①값 커밋 → ②포커스 → ③state 소거**.
 * state를 비우는 이유: 새로고침·뒤로가기로 같은 history 엔트리가 되살아나면 값이 다시 덮어써지고
 * 포커스가 튄다. `replace`라 히스토리 항목이 늘지도 않는다.
 */
export default function TargetFocusRequest({ onApplyTarget, onFocusTarget }: TargetFocusRequestProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // 같은 요청을 두 번 처리하지 않는다(state 소거 전에 effect가 다시 돌아도 안전).
  const handledRef = useRef(false);

  useEffect(() => {
    if (!hasFocusTargetMonthlyDividendRequest(location.state)) {
      // 요청이 사라졌으면(=소거 완료·다른 이동) 다음 요청을 다시 받을 수 있게 되돌린다.
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;

    handledRef.current = true;

    /*
     * `location.state`는 사용자가 히스토리를 조작하면 아무 값이나 될 수 있는 **신뢰 불가 입력**이다.
     * 검증(유한값·범위)은 보내는 쪽과 같은 함수가 하고, 통과 못 하면 값 없이 포커스만 준다 —
     * 이상한 값을 조용히 저장하는 것보다 아무것도 안 하는 편이 안전하다(정규화가 나중에 기본값으로
     * 바꿔치기하면 사용자는 "내가 넣은 값이 사라졌다"만 겪는다).
     */
    const requestedTarget = readTargetMonthlyDividendRequestValue(location.state);
    if (requestedTarget !== null) onApplyTarget(requestedTarget);

    onFocusTarget();
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate, onApplyTarget, onFocusTarget]);

  return null;
}
