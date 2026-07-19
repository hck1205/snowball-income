import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOUR_STEPS, TOUR_STORAGE_KEY, type TourStep } from '@/shared/constants';
import { useTourLaunchRequestAtomValue } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { Button } from '@/components/common';
import type { TourGuideProps, TourPopoverPosition, TourRect } from './TourGuide.types';
import {
  centerPopoverPosition,
  clampSpotlight,
  formatStepProgress,
  isRectFullyVisible,
  isVisibleRect,
  markTourSeen,
  resolvePopoverPosition,
  resolveVisibleSteps
} from './TourGuide.utils';
import {
  TourActions,
  TourBody,
  TourDim,
  TourFooter,
  TourOverlay,
  TourPopover,
  TourProgress,
  TourSpotlight,
  TourTitle
} from './TourGuide.styled';

/** 스포트라이트가 대상 둘레에 남기는 숨 쉴 틈. */
const SPOTLIGHT_PADDING = 8;
/** 말풍선과 스포트라이트 사이 간격. */
const POPOVER_GAP = 12;
/** 말풍선이 뷰포트 가장자리에 닿지 않게 두는 여백. */
const VIEWPORT_MARGIN = 16;

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const findTargetElement = (target: string): HTMLElement | null =>
  typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(`[data-tour="${target}"]`);

const toRect = (rect: DOMRect): TourRect => ({
  top: rect.top,
  left: rect.left,
  width: rect.width,
  height: rect.height
});

const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

const prefersReducedMotion = (): boolean => {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * 가이드 투어 — 스포트라이트 코치마크 오버레이.
 *
 * 설계 원칙 두 가지가 나머지를 전부 결정한다:
 *
 * 1. **투어는 앱 상태를 바꾸지 않는다.** 티커를 대신 만들거나 드로어를 대신 열지 않는다. 오버레이가
 *    클릭을 먹기 때문에 투어 도중 뒤쪽 UI가 실수로 눌리는 일도 없다. 그래서 "투어를 돌려봤더니
 *    내 포트폴리오가 바뀌어 있다" 같은 사고가 구조적으로 불가능하다.
 * 2. **보이는 것만 가리킨다.** 단계 목록은 투어를 시작하는 순간 DOM 가시성으로 걸러진다
 *    (`resolveVisibleSteps`). 빈 상태에서 없는 결과 카드, 모바일에서 드로어 뒤에 숨은 좌측 패널이
 *    전부 같은 규칙 하나로 조용히 빠진다. 특수 분기가 필요 없다.
 *
 * **실행 트리거는 이 컴포넌트 밖에 있다.** 헤더 "더보기(⋯)" 메뉴의 "튜토리얼 보기"가
 * `tourLaunchRequestAtom`을 bump 하면, 이 컴포넌트가 그 변화를 감지해 투어를 연다(자동 실행 없음).
 * 첫 방문 유도 점도 그 트리거(HeaderOverflowMenu) 쪽에 있다 — 여기서는 오버레이만 소유한다.
 */
function TourGuideComponent({ steps = TOUR_STEPS, storageKey = TOUR_STORAGE_KEY }: TourGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<TourRect | null>(null);
  const [position, setPosition] = useState<TourPopoverPosition | null>(null);

  // 투어를 연 외부 요소(헤더 "더보기" 트리거)를 기억해 두었다가, 종료 시 그리로 포커스를 되돌린다.
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const titleId = useId();
  const bodyId = useId();

  const currentStep = activeSteps[stepIndex] ?? null;
  const stepCount = activeSteps.length;

  const closeTour = useCallback(() => {
    setIsOpen(false);
    setSpotlight(null);
    setPosition(null);
    // 투어를 연 요소로 포커스를 돌려준다 — 키보드 사용자가 맥락을 잃지 않는다.
    restoreFocusRef.current?.focus();
  }, []);

  const startTour = useCallback(() => {
    const visibleSteps = resolveVisibleSteps(steps, (target) => {
      const element = findTargetElement(target);
      if (!element) return false;
      return isVisibleRect(toRect(element.getBoundingClientRect()));
    });

    // 가리킬 대상이 하나도 없으면 열지 않는다. 빈 오버레이로 화면을 덮는 것보다 아무 일도 안 하는 게 낫다.
    if (visibleSteps.length === 0) return;

    // 실행 순간 포커스를 잡고 있던 요소(트리거)를 기억 → 종료 시 복원.
    restoreFocusRef.current = (typeof document === 'undefined' ? null : (document.activeElement as HTMLElement)) ?? null;

    markTourSeen(storageKey);
    setActiveSteps(visibleSteps);
    setStepIndex(0);
    setIsOpen(true);

    trackEvent(ANALYTICS_EVENT.TUTORIAL_STARTED, {
      step_count: visibleSteps.length,
      first_step: visibleSteps[0]?.id ?? ''
    });
  }, [steps, storageKey]);

  // 외부 실행 신호. 헤더 "더보기 → 튜토리얼 보기"가 이 카운터를 bump 하면 투어를 연다.
  // 초기 마운트값은 기준선으로만 잡고 skip → 이후 변화(증가)에만 반응한다(값 자체는 무의미).
  const launchRequest = useTourLaunchRequestAtomValue();
  const lastLaunchRef = useRef(launchRequest);
  useEffect(() => {
    if (launchRequest === lastLaunchRef.current) return;
    lastLaunchRef.current = launchRequest;
    startTour();
  }, [launchRequest, startTour]);

  const dismissTour = useCallback(
    (reason: 'skip' | 'escape' | 'backdrop') => {
      trackEvent(ANALYTICS_EVENT.TUTORIAL_DISMISSED, {
        reason,
        step_id: currentStep?.id ?? '',
        step_index: stepIndex + 1,
        step_count: stepCount
      });
      closeTour();
    },
    [closeTour, currentStep, stepCount, stepIndex]
  );

  const completeTour = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.TUTORIAL_COMPLETED, { step_count: stepCount });
    closeTour();
  }, [closeTour, stepCount]);

  const goNext = useCallback(() => {
    if (stepIndex >= stepCount - 1) {
      completeTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  }, [completeTour, stepCount, stepIndex]);

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const updatePosition = useCallback(() => {
    const popoverElement = popoverRef.current;
    if (!currentStep || !popoverElement) return;

    const viewport = getViewport();
    const popoverSize = { width: popoverElement.offsetWidth, height: popoverElement.offsetHeight };
    const targetElement = findTargetElement(currentStep.target);
    const targetRect = targetElement ? toRect(targetElement.getBoundingClientRect()) : null;

    // 진행 도중 대상이 사라져도 깨지지 않는다 — 스포트라이트를 끄고 말풍선을 화면 중앙으로 옮긴다.
    if (!targetRect || !isVisibleRect(targetRect)) {
      setSpotlight(null);
      setPosition(centerPopoverPosition(popoverSize, viewport, VIEWPORT_MARGIN));
      return;
    }

    const nextSpotlight = clampSpotlight(targetRect, SPOTLIGHT_PADDING, viewport);
    setSpotlight(nextSpotlight);
    setPosition(
      resolvePopoverPosition({
        spotlight: nextSpotlight,
        popover: popoverSize,
        viewport,
        placement: currentStep.placement,
        gap: POPOVER_GAP,
        margin: VIEWPORT_MARGIN
      })
    );
  }, [currentStep]);

  // 단계가 바뀌면 대상을 화면 안으로 스크롤한 뒤 위치를 다시 잰다.
  useLayoutEffect(() => {
    if (!isOpen || !currentStep) return;

    const targetElement = findTargetElement(currentStep.target);
    if (targetElement && typeof targetElement.scrollIntoView === 'function') {
      const rect = toRect(targetElement.getBoundingClientRect());
      if (isVisibleRect(rect) && !isRectFullyVisible(rect, getViewport(), VIEWPORT_MARGIN)) {
        targetElement.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }

    updatePosition();
  }, [currentStep, isOpen, updatePosition]);

  // 스크롤/리사이즈 추적. 부드러운 스크롤이 진행되는 동안에도 스포트라이트가 대상에 붙어 따라간다.
  useEffect(() => {
    if (!isOpen) return undefined;

    const schedule = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updatePosition();
      });
    };

    // capture: 페이지 스크롤뿐 아니라 내부 스크롤 컨테이너의 스크롤도 잡는다.
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isOpen, updatePosition]);

  // 열릴 때/단계가 바뀔 때 말풍선으로 포커스를 옮긴다 → 스크린리더가 제목과 본문을 읽는다.
  useEffect(() => {
    if (!isOpen) return;
    popoverRef.current?.focus();
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen || !currentStep) return;
    trackEvent(ANALYTICS_EVENT.TUTORIAL_STEP_VIEW, {
      step_id: currentStep.id,
      step_index: stepIndex + 1,
      step_count: stepCount
    });
  }, [currentStep, isOpen, stepCount, stepIndex]);

  // 키보드: Esc 종료, ←/→ 이동, Tab은 말풍선 안에 가둔다(포커스 트랩).
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissTour('escape');
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key !== 'Tab') return;

      const popoverElement = popoverRef.current;
      if (!popoverElement) return;

      const focusables = Array.from(popoverElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!popoverElement.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && (active === first || active === popoverElement)) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dismissTour, goNext, goPrev, isOpen]);

  const overlayRoot = typeof document === 'undefined' ? null : document.body;
  const isLastStep = stepIndex === stepCount - 1;

  return (
    <>
      {isOpen && currentStep && overlayRoot
        ? createPortal(
            <TourOverlay onClick={() => dismissTour('backdrop')}>
              {spotlight ? (
                <TourSpotlight
                  aria-hidden="true"
                  style={{
                    top: `${spotlight.top}px`,
                    left: `${spotlight.left}px`,
                    width: `${spotlight.width}px`,
                    height: `${spotlight.height}px`
                  }}
                />
              ) : (
                <TourDim aria-hidden="true" />
              )}

              <TourPopover
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={bodyId}
                tabIndex={-1}
                // 말풍선 안의 클릭이 오버레이(닫기)로 새어나가지 않게 막는다.
                onClick={(event) => event.stopPropagation()}
                style={
                  position
                    ? { top: `${position.top}px`, left: `${position.left}px` }
                    : // 아직 크기를 재기 전 — 잘못된 자리에서 한 프레임 번쩍이지 않도록 숨겨둔다.
                      { top: '0px', left: '0px', visibility: 'hidden' }
                }
              >
                <TourTitle id={titleId}>{currentStep.title}</TourTitle>
                <TourBody id={bodyId}>{currentStep.body}</TourBody>
                <TourFooter>
                  <TourProgress aria-label={`전체 ${stepCount}단계 중 ${stepIndex + 1}단계`}>
                    {formatStepProgress(stepIndex, stepCount)}
                  </TourProgress>
                  <TourActions>
                    <Button variant="ghost" size="sm" onClick={() => dismissTour('skip')}>
                      건너뛰기
                    </Button>
                    {stepIndex > 0 ? (
                      <Button variant="secondary" size="sm" onClick={goPrev}>
                        이전
                      </Button>
                    ) : null}
                    <Button variant="primary" size="sm" onClick={goNext}>
                      {isLastStep ? '완료' : '다음'}
                    </Button>
                  </TourActions>
                </TourFooter>
              </TourPopover>
            </TourOverlay>,
            overlayRoot
          )
        : null}
    </>
  );
}

const TourGuide = memo(TourGuideComponent);

export default TourGuide;
