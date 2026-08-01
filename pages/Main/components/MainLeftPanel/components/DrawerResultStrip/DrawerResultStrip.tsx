import { memo, useMemo } from 'react';
import {
  useAtomValue,
  useDisplayCurrencyViewAtomValue,
  useIncludedProfilesAtomValue,
  useIsConfigDrawerOpenAtomValue,
  useIsResultCompactAtomValue,
  useNormalizedAllocationAtomValue,
  useShowQuickEstimateAtomValue,
  useYieldFormAtomValue,
  validationAtom
} from '@/jotai';
import { buildSimulation, createResultAmountFormatter } from '@/pages/Main/utils';
import { buildDrawerResultStripItems } from './DrawerResultStrip.utils';
import { StripEmpty, StripItem, StripLabel, StripList, StripRoot, StripValue } from './DrawerResultStrip.styled';

/**
 * 설정 드로어 **최상단**의 결과 요약 스트립 — 최종 자산 · 월배당 · 목표 도달.
 *
 * 왜 있나(실측). 드로어는 폭 400px 이고 데스크톱에서는 딤이 없다(≥961) — "설정을 바꾸며 결과가
 * 변하는 걸 같이 본다"는 것이 그 결정의 목적이었다. 그런데 본문이 가운데 정렬이라 **결과 요약 카드의
 * hero 숫자가 1280·1024·961 세 폭 모두에서 100% 드로어 뒤에 들어간다**. 목적과 정반대다.
 * 그래서 가려지는 그 값들을 드로어 안에 얇게 복제한다.
 *
 * 왜 밀어내지(push) 않나. 콘텐츠를 오른쪽으로 미는 안은 기각됐다 — 레이아웃 시프트와 스크롤 위치가
 * 따라오고, 961–1280 대역에는 물리적으로 밀 공간이 없다.
 *
 * 폭 조건을 두지 않는다(좁은 폭에서도 그린다). ≤960 에서는 딤이 켜져 결과가 **100%** 가려지므로
 * 필요가 더 크고, 폭 분기를 두면 `SideDrawer` 가 이미 소유한 `drawer` 경계가 두 벌이 된다.
 *
 * 🔴 새 계산·새 포맷터를 만들지 않는다 — 값은 결과 카드와 **같은 빌더**(`buildSimulation`)와
 *   **같은 포맷터**(`createResultAmountFormatter` + `isResultCompact`)에서 나온다. 표기가 갈리면
 *   같은 값이 두 자리에서 다르게 보인다.
 * 🔴 숫자에 색을 넣지 않는다. 카드로 감싸지도 않는다(주역 카드는 화면당 하나다).
 */
function DrawerResultStripComponent() {
  /* 열림 상태는 prop 으로 내려받지 않는다 — 사이에 낀 `MainLeftPanel` 이 이 값과 아무 관계가 없다. */
  const isOpen = useIsConfigDrawerOpenAtomValue();
  const values = useYieldFormAtomValue();
  const validation = useAtomValue(validationAtom);
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const display = useDisplayCurrencyViewAtomValue();

  /*
   * 닫혀 있으면 계산 자체를 건너뛴다 — 드로어는 첫 방문 기본값이 닫힘이고, 열지 않는 세션에서
   * 시뮬레이션을 한 벌 더 돌릴 이유가 없다.
   */
  const simulation = useMemo(
    () =>
      isOpen
        ? buildSimulation({ isValid: validation.isValid, includedProfiles, normalizedAllocation, values })
        : null,
    [includedProfiles, isOpen, normalizedAllocation, validation.isValid, values]
  );

  const items = useMemo(() => {
    if (!simulation) return [];
    return buildDrawerResultStripItems({
      simulation,
      showQuickEstimate,
      targetMonthlyDividend: values.targetMonthlyDividend,
      formatAmount: createResultAmountFormatter(display.currency, display.rate),
      isCompact: isResultCompact
    });
  }, [display.currency, display.rate, isResultCompact, showQuickEstimate, simulation, values.targetMonthlyDividend]);

  if (!isOpen) return null;

  return (
    <StripRoot aria-label="현재 결과 요약">
      {items.length === 0 ? (
        <StripEmpty>종목을 담으면 여기에서 결과가 바로 따라옵니다.</StripEmpty>
      ) : (
        <StripList>
          {items.map((item) => (
            <StripItem key={item.label}>
              <StripLabel>{item.label}</StripLabel>
              <StripValue>{item.value}</StripValue>
            </StripItem>
          ))}
        </StripList>
      )}
    </StripRoot>
  );
}

const DrawerResultStrip = memo(DrawerResultStripComponent);

export default DrawerResultStrip;
