import type { PersistedAppStatePayload } from '@/jotai';
import { PRESET_QUERY_PARAM } from '@/shared/constants/routes';
import { readDbShareKeyFromHref, readShareCodeFromHref } from './shareUrl';

/**
 * 첫 방문에 **어떤 구성으로 열지** 정한다 — 순수 판정.
 *
 * 돌려주는 값이 곧 답이다.
 *   · 프리셋 id  → 그 구성으로 미리 계산해 연다(배너가 출처를 말한다)
 *   · `null`     → 아무것도 얹지 않는다 → 빈 워크스페이스 → "시작하기" 택일 화면이 뜬다
 *
 * ## 🔴 고정 프리셋 자동 적용을 걷었다 (2026-08-23 사용자 결정)
 * 종전에는 첫 방문이면 무조건 `stable-dividend-growth` 를 얹었다. 그래서 **누구에게나 같은
 * 포트폴리오**가 열렸고, 정작 만들어 둔 "시작하기 / 추천 포트폴리오로 시작해보세요" 화면은
 * 도달할 수 없었다(프리필이 워크스페이스를 채워 `isPortfolioEmpty` 가 거짓이 되므로).
 *
 * 지금은 **자기 성향을 아는 사람에게만** 미리 채워 준다:
 *   · 성향 테스트를 마치고 온 사람 → 결과가 지목한 구성으로 열린다(`?preset=`)
 *   · 그냥 들어온 사람            → 고르게 한다. 13개 중 자기 것이 없을 수 있으니
 *                                   강요하지 않고, 종목을 직접 넣는 길도 그 화면에 함께 있다
 *
 * ⚠ 이 함수는 **판정만** 한다. 실제 적용은 우패널(`usePresetPrefill`)이 하고, 그 순서가 중요하다 —
 *   표식이 먼저 켜져 있어야 프리필이 만든 상태 변화가 저장 경로에 닿지 않는다(호출부 주석).
 *
 * ## 언제 `null` 인가
 * - **저장된 포트폴리오가 있다** → 복원이 언제나 우선이다(프리필이 사용자 데이터를 가릴 수 없다)
 * - **공유 링크로 들어왔다**(`?s=` DB key / `?share=` lz-string) → 곧 그 시나리오가 적용된다.
 *   프리필을 먼저 얹으면 화면이 두 번 바뀌고 그 사이 배너가 잘못된 안내를 한다
 * - **`?preset=` 이 없다** → 고를 기회를 준다(위 결정)
 * ⚠ 모르는 id(오타·구버전 링크)는 **여기서 거르지 않는다** — 화면 계층이 목록에서 못 찾으면 프리필을
 *   내려 빈 워크스페이스를 남기므로 결과는 같고(택일 화면), 이 계층이 프리셋 목록을 몰라도 된다.
 *
 * ⚠ 하이드레이션 **실패**(`ok:false`)는 애초에 이 함수까지 오지 않는다 — 그때는 저장이 잠긴 상태라
 *   "저장된 게 없다"고 단정할 수 없다(호출부 참고).
 */
export const resolveScenarioPrefillPresetId = (
  payload: PersistedAppStatePayload,
  href: string
): string | null => {
  const hasStoredPortfolio = payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);
  if (hasStoredPortfolio) return null;

  try {
    if (readDbShareKeyFromHref(href) !== null || readShareCodeFromHref(href) !== null) return null;

    // 🔴 **id 가 실재하는지 여기서 보지 않는다.** 화면 계층(`usePresetPrefill`)이 목록에서 못 찾으면
    //    프리필 상태를 내려 빈 워크스페이스를 남기고, 그게 곧 택일 화면이다. 여기서 또 검증하면
    //    프리셋 목록(=아이콘 컴포넌트를 끌고 오는 모듈)이 저장 경로에 딸려 온다.
    return new URL(href).searchParams.get(PRESET_QUERY_PARAM);
  } catch {
    // 파싱 불가한 주소(테스트 하네스 등)는 지목이 없는 것으로 본다 → 택일 화면.
    return null;
  }
};
