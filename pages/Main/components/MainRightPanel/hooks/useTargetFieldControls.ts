import { useCallback } from 'react';

type UseTargetFieldControlsInput = {
  setField: (field: 'targetMonthlyDividend', value: number) => void;
  setIsConfigDrawerOpen: (open: boolean) => void;
  /**
   * 목표 월배당 입력으로 스크롤+포커스를 옮기는 순수 DOM 유틸(`MainRightPanel.utils`). 이 훅(nested
   * `hooks/`)은 부모의 형제 파일을 직접 열어보지 않는다 — 컨테이너가 이미 갖고 있는 참조를 주입받는다.
   */
  focusTargetMonthlyDividendInput: () => void;
};

/**
 * 설정 드로어 열기 + 목표 월배당 필드로의 커밋·포커스 이동. 셋 다 "목표 입력 조작"이라는 같은
 * 관심사라 하나로 묶었다 — 커밋은 기존 `setField` 경로를 그대로 타므로 자동저장·계측이 그대로 따라온다.
 */
export function useTargetFieldControls({
  setField,
  setIsConfigDrawerOpen,
  focusTargetMonthlyDividendInput
}: UseTargetFieldControlsInput) {
  /**
   * 내 포트폴리오(`/dividend/portfolio`)의 **목표 달성 카드**에서 실려 온 목표 값의 **커밋 경로**.
   * 값 쓰기는 기존 `setField`를 그대로 탄다(계측·자동저장·클라우드 동기화가 이미 붙어 있다) —
   * 시뮬레이터 밖에서 직접 쓰지 않는 이유.
   */
  const commitTargetMonthlyDividend = useCallback(
    (won: number) => {
      setField('targetMonthlyDividend', won);
    },
    [setField]
  );

  /**
   * 목표 입력을 화면에 띄우고 포커스를 옮기는 **동작만** — 계측은 요청을 보내는 쪽
   * (내 포트폴리오(`/dividend/portfolio`)의 목표 달성 카드)이 한다.
   * "드로어 열기 → 한 프레임 뒤 포커스" 규칙은 여기 한 곳에만 둔다.
   */
  const focusTargetMonthlyDividendField = useCallback(() => {
    // 설정 패널은 이제 **전 해상도에서 드로어**라 폭 판정 없이 무조건 먼저 연다
    // (구 `isConfigDrawerLayout()` 게이트를 남겨두면 넓은 화면에서 입력이 화면에 없다).
    setIsConfigDrawerOpen(true);
    // 드로어 마운트/레이아웃 뒤에 좌표를 잡도록 한 프레임 미룬다.
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusTargetMonthlyDividendInput);
    else focusTargetMonthlyDividendInput();
  }, [focusTargetMonthlyDividendInput, setIsConfigDrawerOpen]);

  /** 설정 드로어를 여는 동작 — 조건 스트립의 "조건 수정" 진입점이 쓴다. */
  const openConfigDrawer = useCallback(() => setIsConfigDrawerOpen(true), [setIsConfigDrawerOpen]);

  return { commitTargetMonthlyDividend, focusTargetMonthlyDividendField, openConfigDrawer };
}
