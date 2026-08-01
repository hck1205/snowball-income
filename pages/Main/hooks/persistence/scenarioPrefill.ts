import type { PersistedAppStatePayload } from '@/jotai';
import { readDbShareKeyFromHref, readShareCodeFromHref } from './shareUrl';

/**
 * 첫 방문 기본 시나리오(프리필)를 켤 자격이 있는가 — **순수 판정**.
 *
 * 참이 되는 경우는 하나뿐이다: 하이드레이션이 성공했는데 **저장된 포트폴리오가 한 탭에도 없고**,
 * 지금 주소가 공유 링크가 아닐 때.
 *
 * - 저장된 것이 있으면 무조건 복원이 우선이다(프리필이 사용자 데이터를 가릴 수 없다).
 * - 공유 링크(`?s=` DB key / `?share=` lz-string)로 들어온 방문은 곧 그 시나리오가 적용된다.
 *   프리필을 먼저 얹으면 화면이 두 번 바뀌고, 그 사이 배너가 잘못된 안내를 한다.
 * - 하이드레이션 **실패**(`ok:false`)는 애초에 이 함수까지 오지 않는다 — 그때는 저장이 잠긴 상태라
 *   "저장된 게 없다"고 단정할 수 없다(호출부 참고).
 */
export const shouldRequestScenarioPrefill = (payload: PersistedAppStatePayload, href: string): boolean => {
  const hasStoredPortfolio = payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);
  if (hasStoredPortfolio) return false;

  try {
    return readDbShareKeyFromHref(href) === null && readShareCodeFromHref(href) === null;
  } catch {
    // 파싱 불가한 주소(테스트 하네스 등)는 공유 링크가 아닌 것으로 본다.
    return true;
  }
};
