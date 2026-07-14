import type { TourPlacement, TourStep } from '@/shared/constants';
import type { TourRect, TourViewport, TourPopoverPosition, TourSize } from './TourGuide.types';

/* -------------------------------------------------------------------------- */
/* "이미 봤음" 플래그                                                            */
/* -------------------------------------------------------------------------- */

const SEEN_VALUE = 'seen';

/**
 * localStorage 접근은 예외를 던질 수 있다(사파리 프라이빗 모드, 스토리지 차단, SSR).
 * 실패하면 "아직 안 봤다"로 간주한다 — 유도 뱃지를 한 번 더 보는 쪽이 앱이 죽는 것보다 낫다.
 *
 * 이 플래그는 **기기 로컬 사실**이다. 저장 상태(IndexedDB)나 공유 링크 페이로드에 절대 넣지 않는다.
 * 넣으면 공유 링크를 여는 사람의 튜토리얼 상태까지 덮어쓰게 된다.
 */
export const isTourSeen = (storageKey: string): boolean => {
  try {
    return window.localStorage.getItem(storageKey) === SEEN_VALUE;
  } catch {
    return false;
  }
};

/** 저장에 실패해도 조용히 넘어간다 — 다음 방문에 유도 뱃지가 다시 뜰 뿐이다. */
export const markTourSeen = (storageKey: string): void => {
  try {
    window.localStorage.setItem(storageKey, SEEN_VALUE);
  } catch {
    /* 스토리지를 못 쓰는 환경: 본 기록을 기억하지 못할 뿐, 투어 동작은 그대로다. */
  }
};

/* -------------------------------------------------------------------------- */
/* 단계 해석                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 지금 화면에 **실제로 보이는** 대상만 남긴다.
 *
 * 이 한 줄이 모바일 대응과 빈 상태 대응을 동시에 처리한다:
 * 드로어가 닫힌 모바일에서 좌측 패널은 `display:none`이라 rect가 0이고, 결과가 없으면 결과 카드는
 * 아예 렌더되지 않는다. 둘 다 "안 보이는 대상" → 자동으로 빠진다. 투어가 앱 상태를 건드리지 않고도
 * 깨지지 않는 이유다.
 */
export const resolveVisibleSteps = (
  steps: readonly TourStep[],
  isTargetVisible: (target: string) => boolean
): TourStep[] => steps.filter((step) => isTargetVisible(step.target));

/** rect가 0×0이면 `display:none`이거나 접힌 요소다 → 가리킬 수 없다. */
export const isVisibleRect = (rect: TourRect | null): boolean =>
  rect !== null && rect.width > 0 && rect.height > 0;

/** "2/5" — 진행률 표시. */
export const formatStepProgress = (stepIndex: number, stepCount: number): string =>
  `${stepIndex + 1}/${stepCount}`;

/* -------------------------------------------------------------------------- */
/* 스포트라이트                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 대상 rect에 여백을 두르고 뷰포트 안으로 가둔다.
 *
 * 가두지 않으면 화면 밖으로 삐져나간 하이라이트 때문에 `box-shadow` 구멍이 엉뚱한 곳에 생긴다.
 * 대상이 뷰포트보다 큰 경우(긴 카드)에도 최소 크기를 유지해 구멍이 사라지지 않게 한다.
 */
export const clampSpotlight = (rect: TourRect, padding: number, viewport: TourViewport): TourRect => {
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(viewport.width, rect.left + rect.width + padding);
  const bottom = Math.min(viewport.height, rect.top + rect.height + padding);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
};

/** 대상이 뷰포트 안에 온전히 들어와 있는가. 아니면 스크롤해서 보여줘야 한다. */
export const isRectFullyVisible = (rect: TourRect, viewport: TourViewport, margin: number): boolean =>
  rect.top >= margin &&
  rect.left >= margin &&
  rect.top + rect.height <= viewport.height - margin &&
  rect.left + rect.width <= viewport.width - margin;

/* -------------------------------------------------------------------------- */
/* 말풍선 위치                                                                   */
/* -------------------------------------------------------------------------- */

const OPPOSITE: Record<TourPlacement, TourPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
};

const ALL_PLACEMENTS: readonly TourPlacement[] = ['bottom', 'top', 'right', 'left'];

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * 주축(main axis)에 말풍선이 들어갈 자리가 있는가.
 *
 * 교차축(cross axis)은 검사하지 않는다. 어차피 뷰포트 안으로 clamp 되기 때문에, 교차축까지 따지면
 * "화면 중앙에 가깝지 않다"는 이유로 멀쩡한 배치를 버리게 된다.
 */
const fitsOnMainAxis = (
  placement: TourPlacement,
  spotlight: TourRect,
  popover: TourSize,
  viewport: TourViewport,
  gap: number,
  margin: number
): boolean => {
  if (placement === 'bottom') {
    return spotlight.top + spotlight.height + gap + popover.height <= viewport.height - margin;
  }
  if (placement === 'top') {
    return spotlight.top - gap - popover.height >= margin;
  }
  if (placement === 'right') {
    return spotlight.left + spotlight.width + gap + popover.width <= viewport.width - margin;
  }
  return spotlight.left - gap - popover.width >= margin;
};

const positionFor = (
  placement: TourPlacement,
  spotlight: TourRect,
  popover: TourSize,
  gap: number
): { top: number; left: number } => {
  const centerX = spotlight.left + spotlight.width / 2 - popover.width / 2;
  const centerY = spotlight.top + spotlight.height / 2 - popover.height / 2;

  if (placement === 'bottom') return { top: spotlight.top + spotlight.height + gap, left: centerX };
  if (placement === 'top') return { top: spotlight.top - popover.height - gap, left: centerX };
  if (placement === 'right') return { top: centerY, left: spotlight.left + spotlight.width + gap };
  return { top: centerY, left: spotlight.left - popover.width - gap };
};

/**
 * 선호 배치 → 반대편 → 나머지 순으로 자리를 찾고, 마지막에 무조건 뷰포트 안으로 clamp 한다.
 *
 * 어떤 배치도 안 들어가면(작은 화면에서 큰 말풍선) 선호 배치를 그대로 쓰고 clamp에 맡긴다.
 * 말풍선이 대상을 조금 덮더라도, 화면 밖으로 나가 읽을 수 없게 되는 것보다 낫다.
 */
export const resolvePopoverPosition = ({
  spotlight,
  popover,
  viewport,
  placement,
  gap,
  margin
}: {
  spotlight: TourRect;
  popover: TourSize;
  viewport: TourViewport;
  placement: TourPlacement;
  gap: number;
  margin: number;
}): TourPopoverPosition => {
  const candidates: TourPlacement[] = [
    placement,
    OPPOSITE[placement],
    ...ALL_PLACEMENTS.filter((item) => item !== placement && item !== OPPOSITE[placement])
  ];

  const resolved =
    candidates.find((candidate) => fitsOnMainAxis(candidate, spotlight, popover, viewport, gap, margin)) ?? placement;

  const raw = positionFor(resolved, spotlight, popover, gap);

  return {
    top: clamp(raw.top, margin, Math.max(margin, viewport.height - popover.height - margin)),
    left: clamp(raw.left, margin, Math.max(margin, viewport.width - popover.width - margin)),
    placement: resolved
  };
};

/** 대상을 못 찾았을 때의 안전한 자리 — 화면 정중앙. */
export const centerPopoverPosition = (
  popover: TourSize,
  viewport: TourViewport,
  margin: number
): TourPopoverPosition => ({
  top: clamp((viewport.height - popover.height) / 2, margin, Math.max(margin, viewport.height - popover.height - margin)),
  left: clamp((viewport.width - popover.width) / 2, margin, Math.max(margin, viewport.width - popover.width - margin)),
  placement: 'bottom'
});
