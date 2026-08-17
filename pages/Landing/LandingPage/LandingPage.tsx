import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { hasStoredWorkspace } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { LANDING_HERO_CTAS } from '../copy';
import LandingPageView from './LandingPage.view';
import type { LandingViewModel } from './LandingPage.types';

/**
 * 랜딩 컨테이너.
 *
 * 이 화면은 **계산을 하지 않는다** — 시뮬레이션 엔진도, 폼 atom 도 건드리지 않는다.
 * 컨테이너가 소유하는 것은 둘뿐이다: ①재방문 마커 ②CTA 라우팅·계측.
 * (2026-08-02 이전에는 지수 조회 드라이버도 여기 있었다 — 아래 주석 참고.)
 *
 * ## 문서 메타를 쓰지 않는다
 * 다른 페이지와 달리 `useDocumentMeta` 를 부르지 않는다 — 이 화면이 `/` 를 가져갔으므로
 * `index.html` 의 **정적 메타가 곧 이 페이지의 메타**다(그 메타 본문 교체는 SEO 트랙 소관).
 *
 * ## 재방문 마커
 * `hungryhippo:has-workspace` 는 동기 localStorage 한 개다(`jotai/snowball/persistence/workspaceMarker`).
 * 🔴 렌더 **전에** 값이 나와야 하므로 `useEffect` 가 아니라 `useState` 초기화로 읽는다 —
 * 이펙트로 읽으면 첫 프레임 뒤에 줄이 하나 생겨 히어로가 흔들린다.
 * 마커가 틀려도 사고가 없다: 목적지가 어차피 시뮬레이터이고, 항상 보이는 CTA 가 안전망이다.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  /* 🔴 **지수 조회 드라이버가 없다**(2026-08-02). 이 화면은 `MarketIndexStrip` 을 더 이상 그리지 않는다 —
     배당을 처음 접하는 방문자에게 S&P 500 수치는 서사가 아니라 소음이라, 시세는 그것이 실제로 쓰이는
     세 화면(시뮬레이터·내 포트폴리오·배당 캘린더)만 갖는다. 부품 없이 드라이버만 부르면 아무도 구독하지
     않는 fetch 가 랜딩 진입마다 도는 것이라 **되살리지 마라**(가드: test/landing/landingStructure.test.tsx). */

  const [storedWorkspace] = useState<boolean>(() => hasStoredWorkspace());
  const viewModel = useMemo<LandingViewModel>(
    () => ({ hasStoredWorkspace: storedWorkspace }),
    [storedWorkspace]
  );

  /**
   * 히어로 CTA. **목적지와 계측 이름을 카피 배열이 소유한다** — 순서가 뒤집혀도(D1 A안↔B안)
   * 여기 코드는 한 글자도 바뀌지 않는다.
   */
  const handleHeroCta = useCallback(
    (ctaId: string) => {
      const cta = LANDING_HERO_CTAS.find((candidate) => candidate.id === ctaId);
      if (!cta) return;

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: cta.ctaName });
      navigate(cta.to);
    },
    [navigate]
  );

  const handleResume = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_resume' });
    navigate(SIMULATOR_PATH);
  }, [navigate]);

  return (
    <TickerPageShell>
      <LandingPageView viewModel={viewModel} onHeroCta={handleHeroCta} onResume={handleResume} />
    </TickerPageShell>
  );
}
