import { useEffect, useRef } from 'react';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { PRESET_QUERY_PARAM } from '@/shared/constants/routes';
import type { PortfolioPresetPlaceholder } from '../components';

/**
 * 주소 형식은 **라우트 계약**이라 `shared/constants/routes` 가 소유한다(2026-08-23 이동).
 * 영속 계층도 같은 값을 읽는데, 그쪽이 이 파일을 import 하면 저장 코드에 화면 코드가 딸려 온다.
 * 기존 import 경로를 깨지 않기 위해 여기서 다시 내보낸다.
 */
export { PRESET_QUERY_PARAM };

type PresetQueryApplyDeps = {
  /** `usePortfolioPresetApply.requestApply` — **확인 모달을 띄우는** 쪽이다(아래 이유). */
  requestApply: (preset: PortfolioPresetPlaceholder) => void;
  /**
   * 지금 워크스페이스에 덮어쓸 것이 있는가.
   *
   * 🔴 **없으면 이 훅은 아무것도 하지 않는다**(2026-08-23). 빈 워크스페이스로 `?preset=` 진입하는 것은
   * 영속 계층이 이미 프리필로 처리하기 때문이다(`resolveScenarioPrefillPresetId`). 그걸 모르고 둘 다
   * 돌면 **조용히 적용된 화면 위에 확인 모달까지 뜬다** — 사용자는 이미 적용된 것을 다시 확인당한다.
   * 이 훅이 맡는 것은 **덮어쓰기 경고**뿐이고, 덮을 게 없으면 경고할 일도 없다.
   */
  hasTickerProfiles: boolean;
};

/**
 * 주소에 실려 온 프리셋을 계산기에서 연다.
 *
 * ## 왜 생겼나 (2026-08-17)
 * 성향 테스트 결과가 "이 성향에는 이 구성이 결이 맞습니다"까지 말해 놓고 거기서 끝나면, 사용자는
 * 계산기로 건너가 종목 6개를 손으로 다시 찾아 넣어야 한다. 그 단절이 이 흐름의 착지를 막고 있었다 —
 * 테스트가 "재미로 해 봤다"로 끝나느냐 "실제로 계산까지 했다"로 이어지느냐가 여기서 갈린다.
 *
 * ## 🔴 조용히 적용하지 않는다 — 확인 모달을 거친다
 * `applyPresetSilently` 가 있지만 쓰지 않는다. 그쪽은 **프리필 전용**이고, 이 경로는
 * 이미 자기 포트폴리오를 만들어 둔 사용자도 탄다. 링크 한 번에 그것이 통째로 덮이면
 * `usePortfolioPresetApply` 가 확인 모달로 막으려던 바로 그 사고다(모바일 오터치와 같은 결과).
 *
 * ## 🔴 기존 `scenarioPrefill` atom 을 재사용하지 않는 이유
 * 그 atom 은 "저장된 포트폴리오가 없는 첫 방문"이라는 조건을 이미 의미로 갖고 있다
 * (`shouldRequestScenarioPrefill`). 여기에 사용자가 지목한 프리셋을 실으면 그 조건이 무너지고,
 * "프리필 배너"가 첫 방문이 아닌 상황에서 뜬다.
 *
 * ## 🔴 덮어쓰기 경고 전용이다
 * 빈 워크스페이스로 `?preset=` 진입하면 **영속 계층**이 프리필로 처리한다
 * (`resolveScenarioPrefillPresetId` → `usePresetPrefill`, 배너로 출처까지 안내한다).
 * 이 훅은 **이미 자기 포트폴리오가 있는 사용자**가 그 링크를 눌렀을 때만 끼어들어 확인을 받는다.
 *
 * ## 한 번만 연다
 * ⚠ 주소는 그대로 남는다(뒤로 가기·새로고침으로 다시 오면 다시 물어야 자연스럽다). 다만 **같은
 *   마운트 안에서** 재실행되어 모달이 다시 뜨는 일은 ref 로 막는다.
 *
 * ## 🔴 `useSearchParams` 를 쓰지 않는다 — 라우터에 매이지 않기 위해서다
 * 이 훅은 **마운트 시 한 번** 주소를 읽으면 끝이라 라우터 훅이 과하다. 실제로 처음엔
 * `useSearchParams` 로 썼다가 `MainRightPanel` 을 렌더하는 테스트 **12파일 55건**이 통째로 깨졌다 —
 * 그 테스트들은 라우터 없이 패널만 세운다(패널이 라우팅과 무관한 부품이라 그게 맞는 설계다).
 * 부품 하나에 라우터 의존을 심으면 그 부품을 쓰는 **모든** 테스트가 라우터를 둘러야 한다.
 * ⚠ 그래서 쿼리 변화에 반응하지 않는다. 반응이 필요해지면 그때는 이 훅이 아니라 화면 쪽 문제다.
 */
/** SSR·노드 테스트(`window` 없음)에서 조용히 없는 것으로 본다. */
const readPresetIdFromLocation = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(PRESET_QUERY_PARAM);
  } catch {
    return null;
  }
};

export function usePresetQueryApply({ requestApply, hasTickerProfiles }: PresetQueryApplyDeps): void {
  const requestedRef = useRef(false);

  // 적용 함수는 매 렌더 새로 만들어질 수 있어 의존성에서 뺀다(넣으면 매 렌더 재실행 후보가 된다).
  const requestApplyRef = useRef(requestApply);
  requestApplyRef.current = requestApply;
  // 하이드레이션이 끝나기 전에는 비어 보인다 — 이펙트가 볼 값은 ref 로 최신을 유지한다.
  const hasTickerProfilesRef = useRef(hasTickerProfiles);
  hasTickerProfilesRef.current = hasTickerProfiles;

  useEffect(() => {
    const presetId = readPresetIdFromLocation();
    if (presetId === null || requestedRef.current) return;

    // 덮을 것이 없으면 영속 계층의 프리필이 맡는다(위 dep 주석). 여기서 손대면 이중 처리다.
    if (!hasTickerProfilesRef.current) return;

    const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find((candidate) => candidate.id === presetId);
    // 모르는 id(오타·구버전 링크)는 **조용히 무시**한다. 에러 화면을 띄울 일이 아니다 —
    // 사용자는 그냥 계산기를 열게 되고, 그 편이 링크가 죽는 것보다 낫다.
    if (!preset) return;

    requestedRef.current = true;
    requestApplyRef.current(preset);
    // 마운트 시 한 번만 — 의존성이 비어 있는 것이 의도다(위 머리말).
  }, []);
}
