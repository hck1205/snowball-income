import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { hasStoredWorkspace } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import type { LandingGoal } from '@/shared/constants/landingGoals';
import HomePageView from './HomePage.view';
import type { HomeViewModel } from './HomePage.types';

/**
 * 첫 화면(`/`) 컨테이너.
 *
 * ## 이 화면이 소유하는 것은 둘뿐이다
 * ①재방문 마커 ②계측. 계산도, 라우팅도 하지 않는다 — 이동은 전부 `Link` 가 한다.
 *
 * ## 2026-08-27: 안내문에서 목표 여섯으로
 * 전에는 `/` 가 `pages/Landing` 의 여섯 장짜리 안내문이었다. 그 문서는 `/about` 으로 그대로 옮겼고
 * (`ABOUT_PATH`), 여기 남은 것은 목표 하나를 고르게 하는 화면이다. 사용자 피드백: *"시작할 때
 * 되게 직관적인 게 있었으면 좋겠다 — 직관적인 버튼 6개 만들고 그거 먼저 시작해야 재밌을 것 같다."*
 * 🔴 그 판단이 옳았는지는 `goal_selected` 분포로만 답할 수 있다. 여섯이 **전부 안 눌리는지**도
 *   그 이벤트의 부재로 읽힌다 — 되돌릴 근거를 만들려고 쏘는 것이다.
 *
 * ## 문서 메타를 쓰지 않는다
 * 이 화면이 `/` 를 가져갔으므로 **`index.html` 의 정적 메타가 곧 이 페이지의 메타**다
 * (`pages/Landing` 이 `/` 를 갖고 있던 동안 같은 이유로 같은 선택을 했다). 정본은 `HOME_COPY.meta`
 * 이고 `test/seo` 가 둘의 일치를 잠근다.
 *
 * ## 재방문 마커
 * 🔴 렌더 **전에** 값이 나와야 하므로 `useEffect` 가 아니라 `useState` 초기화로 읽는다 —
 * 이펙트로 읽으면 첫 프레임 뒤에 줄이 하나 생겨 화면이 흔들린다. 마커가 틀려도 사고는 없다
 * (목표 카드가 항상 보이는 안전망이다).
 */
export default function HomePage() {
  const navigate = useNavigate();

  const [storedWorkspace] = useState<boolean>(() => hasStoredWorkspace());
  const viewModel = useMemo<HomeViewModel>(
    () => ({ hasStoredWorkspace: storedWorkspace }),
    [storedWorkspace]
  );

  /**
   * 목표 선택. **계측만** 한다 — 이동은 카드의 `Link` 가 이미 했으므로 여기서 `navigate()` 를
   * 부르면 가운데 클릭·새 탭이 조용히 죽는다.
   *
   * ⚠ `goal_kind` 를 따로 보내는 이유: 자산이 먼저 눌리는지 배당이 먼저인지가 이 앱의 포지셔닝을
   *   되묻는 질문이다. `goal_id` 여섯을 사람이 다시 묶어 세지 않아도 되게 한다.
   */
  const handleSelectGoal = useCallback((goal: LandingGoal) => {
    trackEvent(ANALYTICS_EVENT.GOAL_SELECTED, { goal_id: goal.id, goal_kind: goal.kind });
  }, []);

  /**
   * 성향 테스트. 🔴 **이 수치가 내비에서 뺀 결정의 성적표다**(2026-08-27) — 내비 항목을 없앤 대신
   * 이 카드가 그 노출을 대신하기로 했으므로, 여기가 죽어 있으면 테스트로 가는 길이 사라진 것이다.
   */
  const handleQuiz = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'home_investor_type' });
  }, []);

  /** 출구. **여섯 중 자기 것이 없는 사람이 얼마나 되는지**가 이 수치다 — 목표 목록을 고칠 근거다. */
  const handleBrowse = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'home_browse_about' });
  }, []);

  const handleResume = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'home_resume' });
    navigate(SIMULATOR_PATH);
  }, [navigate]);

  return (
    <TickerPageShell>
      <HomePageView
        viewModel={viewModel}
        onSelectGoal={handleSelectGoal}
        onQuiz={handleQuiz}
        onBrowse={handleBrowse}
        onResume={handleResume}
      />
    </TickerPageShell>
  );
}
