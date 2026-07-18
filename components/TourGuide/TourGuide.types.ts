import type { TourPlacement, TourStep } from '@/shared/constants';

export type TourGuideProps = {
  /** 기본값은 `TOUR_STEPS`. 테스트에서 갈아끼운다. */
  steps?: readonly TourStep[];
  /** 기본값은 `TOUR_STORAGE_KEY`. 테스트에서 갈아끼운다. */
  storageKey?: string;
};

/** `getBoundingClientRect`의 결과 중 우리가 쓰는 부분만. 뷰포트 기준 좌표계다. */
export type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type TourSize = {
  width: number;
  height: number;
};

export type TourViewport = {
  width: number;
  height: number;
};

export type TourPopoverPosition = {
  top: number;
  left: number;
  placement: TourPlacement;
};
