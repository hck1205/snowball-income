import type { LandingLevelId } from '../copy';
/** 뷰가 필요로 하는 전부. 랜딩은 계산이 없는 화면이라 상태가 이 한 줄뿐이다. */
export type LandingViewModel = {
  /**
   * 이 브라우저에서 시뮬레이터를 써 본 적이 있는가(`hungryhippo:has-workspace` 마커).
   * 🔴 "데이터가 있다"의 증거가 아니다 — 링크 하나를 보일지에만 쓴다.
   */
  hasStoredWorkspace: boolean;
};

export type LandingPageViewProps = {
  viewModel: LandingViewModel;
  /** 히어로 CTA 클릭. 컨테이너가 계측 + 라우팅을 함께 처리한다. */
  onSelectLevel: (levelId: LandingLevelId) => void;
  /** 직행로("바로 계산기로") 계측. 이동은 Link 가 한다. */
  onDirect: () => void;
  /** "이어서 계산하기" — 시뮬레이터로 간다(값을 복원하지 않는다. 시뮬레이터가 자기 저장소를 읽는다). */
  onResume: () => void;
};
