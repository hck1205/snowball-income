import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { hasPortfolioSimulationPrefillRequest, readPortfolioSimulationPrefillRequest } from '@/shared/constants';
import type { PortfolioPrefillRequestProps } from './PortfolioPrefillRequest.types';

/**
 * "내 포트폴리오" 화면에서 넘어온 **프리필 요청**(초기 투자금 + 종목 비중)을 한 번 처리하고 지운다.
 * 화면에는 아무것도 그리지 않는다(`null`). 구조·수명은 형제 `TargetFocusRequest`와 같다.
 *
 * ## ⚠ 이 컴포넌트를 MainRightPanel 밖(상위)으로 올리지 말 것
 * 커밋(`onApplyPrefill`)은 **하이드레이션이 끝난 뒤**여야 한다. `MainRightPanel`은
 * `isPortfolioHydrated === true`일 때만 마운트되므로(pages/Main/Main.view.tsx) 여기서의 커밋은 저장
 * payload 적용 **이후**로 보장된다. 상위로 올리면 하이드레이션이 방금 커밋한 포트폴리오를 매번
 * 저장값으로 덮어써 "버튼을 눌렀는데 아무 일도 안 일어난다"가 된다.
 *
 * 순서도 고정이다: **①커밋 → ②state 소거**. state를 비우는 이유는 뒤로가기·새로고침으로 같은
 * history 엔트리가 되살아나면 같은 프리필이 **또 커밋되기** 때문이다(새 탭이 계속 늘어난다).
 * `replace`라 히스토리 항목이 늘지도 않는다.
 *
 * 커밋이 실제로 일어나지 않는 경우(로그인 게이트·탭 상한)에도 state는 지운다 — 아무것도 파괴하지
 * 않았고, 남겨두면 그 사용자는 화면을 이동할 때마다 같은 프롬프트를 다시 만난다.
 */
export default function PortfolioPrefillRequest({ onApplyPrefill }: PortfolioPrefillRequestProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // 같은 요청을 두 번 처리하지 않는다(state 소거 전에 effect가 다시 돌아도 안전 — StrictMode 이중 마운트 포함).
  const handledRef = useRef(false);

  useEffect(() => {
    if (!hasPortfolioSimulationPrefillRequest(location.state)) {
      // 요청이 사라졌으면(=소거 완료·다른 이동) 다음 요청을 다시 받을 수 있게 되돌린다.
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;

    handledRef.current = true;

    /*
     * `location.state`는 사용자가 히스토리를 조작하면 아무 값이나 될 수 있는 **신뢰 불가 입력**이다.
     * 검증(유한값·범위·비중 합)은 보내는 쪽과 **같은 함수**가 하고, 통과 못 하면 아무것도 커밋하지
     * 않는다 — 이상한 값을 조용히 저장하는 것보다 아무 일도 안 하는 편이 안전하다(setField는
     * 클램프하지 않아, 비정상 값이 영속되면 정규화가 나중에 기본값으로 바꿔치기한다).
     */
    const prefill = readPortfolioSimulationPrefillRequest(location.state);
    if (prefill !== null) onApplyPrefill(prefill);

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate, onApplyPrefill]);

  return null;
}
