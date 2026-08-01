import { useEffect, useRef } from 'react';
import { useScenarioPrefillAtomValue, useSetScenarioPrefillWrite } from '@/jotai';
import { PORTFOLIO_PRESET_PLACEHOLDERS, type PortfolioPresetPlaceholder } from '../components';

type PortfolioPrefillDeps = {
  /** 지금 워크스페이스에 티커가 하나라도 있는가. 있으면 프리필하지 않는다(사용자 데이터가 우선). */
  hasTickerProfiles: boolean;
  /** 프리셋 카드 클릭과 **같은 적용 경로**. 확인 모달을 거치지 않고 곧바로 커밋한다. */
  applyPreset: (preset: PortfolioPresetPlaceholder) => void;
};

/**
 * 첫 방문 기본 시나리오를 **화면에 적용**한다.
 *
 * 역할 분담: *언제 켤지*는 영속 계층이 정해 `scenarioPrefillAtom` 에 `requested` 로 발행하고
 * (저장된 워크스페이스가 없고 공유 링크도 아닐 때 — `shouldRequestScenarioPrefill`),
 * *어떻게 적용할지*는 여기서 한다. 저장 정지도 그 atom 하나가 맡으므로 이 훅은 저장을 몰라도 된다.
 *
 * 🔴 **커밋과 `applied` 전이는 같은 배치여야 한다.** 영속 계층은 `applied` 가 된 뒤의 워크스페이스를
 *    "프리필 원본"으로 기억해 두고 그것과 달라지는 순간을 사용자 편집으로 본다 — 순서가 어긋나면
 *    프리필 자신이 사용자 편집으로 오인돼 그대로 저장된다.
 * 🔴 **적용은 세션당 한 번뿐이다.** 사용자가 프리필된 종목을 전부 지워 다시 빈 워크스페이스가 돼도
 *    되살리지 않는다 — 되살리면 "지우기"가 동작하지 않는 화면이 된다.
 * ⚠ 적용할 수 없으면(이미 티커가 있음·id 를 못 찾음) 반드시 **atom 을 내린다**. 안 내리면 저장이
 *   `requested` 상태로 영원히 잠긴다(무음 데이터 유실).
 * ⚠ 계측은 일부러 발화하지 않는다 — 이유는 `usePortfolioPresetApply.applyPreset` 주석 참고.
 */
export function usePortfolioPrefill({ hasTickerProfiles, applyPreset }: PortfolioPrefillDeps): void {
  const prefill = useScenarioPrefillAtomValue();
  const setPrefill = useSetScenarioPrefillWrite();
  const hasAppliedRef = useRef(false);
  // 적용 함수·티커 유무는 매 렌더 바뀔 수 있어 effect 의존성에서 뺀다(넣으면 매 렌더 재실행 후보가 된다).
  const applyRef = useRef(applyPreset);
  applyRef.current = applyPreset;
  const hasTickerProfilesRef = useRef(hasTickerProfiles);
  hasTickerProfilesRef.current = hasTickerProfiles;

  const status = prefill?.status ?? null;
  const presetId = prefill?.presetId ?? null;

  useEffect(() => {
    if (status !== 'requested' || presetId === null) return;

    const preset = hasAppliedRef.current
      ? undefined
      : PORTFOLIO_PRESET_PLACEHOLDERS.find((candidate) => candidate.id === presetId);

    if (hasTickerProfilesRef.current || !preset) {
      setPrefill(null);
      return;
    }

    hasAppliedRef.current = true;
    applyRef.current(preset);
    setPrefill({ presetId, status: 'applied' });
  }, [presetId, setPrefill, status]);
}
