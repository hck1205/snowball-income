import { createElement, type MouseEvent, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TourStep } from '@/shared/constants';
import { useSetTourLaunchRequestWrite } from '@/jotai';
import TourGuide from './TourGuide';
import {
  centerPopoverPosition,
  clampSpotlight,
  formatStepProgress,
  isRectFullyVisible,
  isTourSeen,
  isVisibleRect,
  markTourSeen,
  resolvePopoverPosition,
  resolveVisibleSteps
} from './TourGuide.utils';

/* -------------------------------------------------------------------------- */
/* 순수 로직                                                                     */
/* -------------------------------------------------------------------------- */

const VIEWPORT = { width: 1000, height: 800 };

describe('TourGuide.utils - 진행 표시', () => {
  it('1-based 진행률로 표시한다', () => {
    expect(formatStepProgress(0, 5)).toBe('1/5');
    expect(formatStepProgress(4, 5)).toBe('5/5');
  });
});

describe('TourGuide.utils - 가시성', () => {
  it('크기가 0인 rect는 보이지 않는 것으로 본다 (display:none)', () => {
    expect(isVisibleRect({ top: 0, left: 0, width: 0, height: 0 })).toBe(false);
    expect(isVisibleRect({ top: 0, left: 0, width: 100, height: 0 })).toBe(false);
    expect(isVisibleRect(null)).toBe(false);
    expect(isVisibleRect({ top: 0, left: 0, width: 100, height: 40 })).toBe(true);
  });

  it('보이는 대상의 단계만 남긴다', () => {
    const steps = [
      { id: 'a', target: 'ticker-create', title: 'A', body: 'a', placement: 'right' },
      { id: 'b', target: 'simulation-result', title: 'B', body: 'b', placement: 'left' },
      { id: 'c', target: 'scenario-tabs', title: 'C', body: 'c', placement: 'bottom' }
    ] as unknown as TourStep[];

    const visible = resolveVisibleSteps(steps, (target) => target !== 'simulation-result');

    expect(visible.map((step) => step.id)).toEqual(['a', 'c']);
  });

  it('보이는 대상이 하나도 없으면 빈 목록을 준다', () => {
    const steps = [{ id: 'a', target: 'ticker-create', title: 'A', body: 'a', placement: 'right' }] as unknown as TourStep[];

    expect(resolveVisibleSteps(steps, () => false)).toEqual([]);
  });
});

describe('TourGuide.utils - 스포트라이트', () => {
  it('대상 둘레에 여백을 두른다', () => {
    const spotlight = clampSpotlight({ top: 100, left: 200, width: 300, height: 50 }, 8, VIEWPORT);

    expect(spotlight).toEqual({ top: 92, left: 192, width: 316, height: 66 });
  });

  it('뷰포트 밖으로 삐져나가지 않게 가둔다', () => {
    const spotlight = clampSpotlight({ top: -20, left: -30, width: 100, height: 60 }, 8, VIEWPORT);

    expect(spotlight.top).toBe(0);
    expect(spotlight.left).toBe(0);
    // 위/왼쪽이 잘려도 오른쪽·아래 경계는 여백만큼 늘어난 상태로 유지된다.
    expect(spotlight.width).toBe(78);
    expect(spotlight.height).toBe(48);
  });

  it('대상이 뷰포트보다 커도 음수 크기를 만들지 않는다', () => {
    const spotlight = clampSpotlight({ top: -500, left: -500, width: 5000, height: 5000 }, 8, VIEWPORT);

    expect(spotlight.width).toBe(VIEWPORT.width);
    expect(spotlight.height).toBe(VIEWPORT.height);
  });

  it('뷰포트 안에 온전히 들어왔는지 판정한다', () => {
    expect(isRectFullyVisible({ top: 100, left: 100, width: 200, height: 100 }, VIEWPORT, 16)).toBe(true);
    // 아래로 잘림 → 스크롤이 필요하다.
    expect(isRectFullyVisible({ top: 700, left: 100, width: 200, height: 200 }, VIEWPORT, 16)).toBe(false);
    // 위로 잘림.
    expect(isRectFullyVisible({ top: -10, left: 100, width: 200, height: 100 }, VIEWPORT, 16)).toBe(false);
  });
});

describe('TourGuide.utils - 말풍선 위치', () => {
  const popover = { width: 340, height: 200 };

  it('자리가 있으면 선호 배치를 그대로 쓴다', () => {
    const spotlight = { top: 100, left: 100, width: 200, height: 100 };

    const position = resolvePopoverPosition({
      spotlight,
      popover,
      viewport: VIEWPORT,
      placement: 'bottom',
      gap: 12,
      margin: 16
    });

    expect(position.placement).toBe('bottom');
    expect(position.top).toBe(212); // 100 + 100 + 12
  });

  it('선호 배치에 자리가 없으면 반대편으로 뒤집는다', () => {
    // 대상이 화면 아래쪽에 붙어 있어 아래로는 말풍선이 못 들어간다.
    const spotlight = { top: 700, left: 100, width: 200, height: 80 };

    const position = resolvePopoverPosition({
      spotlight,
      popover,
      viewport: VIEWPORT,
      placement: 'bottom',
      gap: 12,
      margin: 16
    });

    expect(position.placement).toBe('top');
    expect(position.top).toBe(488); // 700 - 200 - 12
  });

  it('좌측에 자리가 없으면 우측으로 뒤집는다', () => {
    const spotlight = { top: 300, left: 10, width: 120, height: 80 };

    const position = resolvePopoverPosition({
      spotlight,
      popover,
      viewport: VIEWPORT,
      placement: 'left',
      gap: 12,
      margin: 16
    });

    expect(position.placement).toBe('right');
    expect(position.left).toBe(142); // 10 + 120 + 12
  });

  it('교차축이 화면을 벗어나면 뷰포트 안으로 clamp 한다', () => {
    // 대상이 오른쪽 끝 → 가운데 정렬하면 말풍선이 화면 밖으로 나간다.
    const spotlight = { top: 100, left: 960, width: 40, height: 40 };

    const position = resolvePopoverPosition({
      spotlight,
      popover,
      viewport: VIEWPORT,
      placement: 'bottom',
      gap: 12,
      margin: 16
    });

    expect(position.left).toBe(VIEWPORT.width - popover.width - 16); // 644
    expect(position.left + popover.width).toBeLessThanOrEqual(VIEWPORT.width);
  });

  it('어느 배치에도 자리가 없으면 선호 배치를 유지하고 화면 안에 가둔다', () => {
    const tinyViewport = { width: 380, height: 300 };
    const spotlight = { top: 120, left: 100, width: 180, height: 60 };

    const position = resolvePopoverPosition({
      spotlight,
      popover,
      viewport: tinyViewport,
      placement: 'bottom',
      gap: 12,
      margin: 16
    });

    expect(position.placement).toBe('bottom');
    expect(position.top).toBeGreaterThanOrEqual(16);
    expect(position.left).toBeGreaterThanOrEqual(16);
  });

  it('대상이 없을 때는 화면 중앙에 놓는다', () => {
    const position = centerPopoverPosition(popover, VIEWPORT, 16);

    expect(position.left).toBe(330); // (1000 - 340) / 2
    expect(position.top).toBe(300); // (800 - 200) / 2
  });
});

describe('TourGuide.utils - 본 적 있음 플래그', () => {
  const KEY = 'snowball:tutorial:test';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('기본값은 "안 봤음"이다', () => {
    expect(isTourSeen(KEY)).toBe(false);
  });

  it('표시하면 본 것으로 기억한다', () => {
    markTourSeen(KEY);

    expect(isTourSeen(KEY)).toBe(true);
  });

  it('스토리지를 못 쓰는 환경에서도 던지지 않는다', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => markTourSeen(KEY)).not.toThrow();
    expect(isTourSeen(KEY)).toBe(false);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

/* -------------------------------------------------------------------------- */
/* 컴포넌트                                                                      */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'snowball:tutorial:test';

const TEST_STEPS = [
  {
    id: 'ticker-create',
    target: 'ticker-create',
    title: '먼저 종목을 추가하세요',
    body: '투자할 종목을 추가합니다.',
    placement: 'right'
  },
  {
    id: 'simulation-result',
    target: 'simulation-result',
    title: '결과 읽는 법',
    body: '최종 자산과 월 배당을 확인합니다.',
    placement: 'left'
  },
  {
    id: 'scenario-tabs',
    target: 'scenario-tabs',
    title: '여러 전략을 나란히 비교',
    body: '탭을 추가하면 비교할 수 있습니다.',
    placement: 'bottom'
  }
] as unknown as TourStep[];

/** `data-tour`가 붙은 요소에만 실제 크기를 준다. 나머지(0×0)는 "안 보이는 것"으로 취급된다. */
const mockRects = (visibleTargets: readonly string[]) => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(this: HTMLElement) {
    const target = this.getAttribute('data-tour');
    const isVisible = target !== null && visibleTargets.includes(target);
    const rect = isVisible
      ? { top: 100, left: 100, width: 200, height: 60 }
      : { top: 0, left: 0, width: 0, height: 0 };

    return { ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON: () => rect } as DOMRect;
  });
};

/**
 * 실행 트리거 대역 — 실제로는 헤더 "더보기" 메뉴의 "튜토리얼 보기"가 `tourLaunchRequestAtom`을 bump 한다.
 * 여기서는 그 역할을 하는 버튼을 둔다: 클릭 시 자기 자신에 포커스를 준 뒤(투어 종료 후 포커스 복원 대상)
 * atom을 올려 TourGuide가 투어를 열게 한다. 접근명은 기존 계약("튜토리얼 시작")을 유지한다.
 */
const TourLauncher = () => {
  const bump = useSetTourLaunchRequestWrite();
  return createElement(
    'button',
    {
      type: 'button',
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        event.currentTarget.focus();
        bump((count) => count + 1);
      }
    },
    '튜토리얼 시작'
  );
};

/** 투어 대상들을 실제 DOM에 깔고, 그 옆에 실행 트리거와 TourGuide를 띄운다. */
const renderTour = (targets: readonly string[]): ReactNode[] => [
  ...targets.map((target) =>
    createElement('button', { key: target, type: 'button', 'data-tour': target }, `대상 ${target}`)
  ),
  createElement(TourLauncher, { key: 'launcher' }),
  createElement(TourGuide, { key: 'tour', steps: TEST_STEPS, storageKey: STORAGE_KEY })
];

const startTour = () => fireEvent.click(screen.getByRole('button', { name: '튜토리얼 시작' }));

describe('TourGuide', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('자동 실행하지 않는다 — 트리거가 있어도 저절로 열리지 않는다', () => {
    // 실행 트리거(유도 점 포함)는 이제 헤더 "더보기" 메뉴(HeaderOverflowMenu)가 소유한다.
    // 여기서는 TourGuide가 신호 없이는 오버레이를 열지 않는다는 계약만 지킨다.
    mockRects(['ticker-create']);
    render(createElement('div', null, renderTour(['ticker-create'])));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 신호를 받으면(트리거 클릭 → atom bump) 비로소 열린다.
    startTour();
    expect(screen.getByRole('dialog', { name: '먼저 종목을 추가하세요' })).toBeInTheDocument();
    expect(isTourSeen(STORAGE_KEY)).toBe(true);
  });

  it('아이콘을 누르면 첫 단계가 다이얼로그로 열린다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();

    const dialog = screen.getByRole('dialog', { name: '먼저 종목을 추가하세요' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('투자할 종목을 추가합니다.')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('화면에 없는 대상의 단계는 건너뛴다', () => {
    // 결과 카드가 없는 빈 상태.
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // 두 번째 단계는 '결과 읽는 법'이 아니라 '여러 전략을 나란히 비교'여야 한다.
    expect(screen.getByRole('dialog', { name: '여러 전략을 나란히 비교' })).toBeInTheDocument();
    expect(screen.queryByText('결과 읽는 법')).not.toBeInTheDocument();
  });

  it('가리킬 대상이 하나도 없으면 열지 않는다', () => {
    mockRects([]);
    render(createElement('div', null, renderTour([])));

    startTour();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('다음/이전으로 단계를 오간다', () => {
    mockRects(['ticker-create', 'simulation-result', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'simulation-result', 'scenario-tabs'])));

    startTour();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    // 첫 단계에는 '이전'이 없다.
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByRole('dialog', { name: '결과 읽는 법' })).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '이전' }));
    expect(screen.getByRole('dialog', { name: '먼저 종목을 추가하세요' })).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('마지막 단계에서는 완료 버튼으로 끝낸다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '완료' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('건너뛰기로 언제든 종료한다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Esc로 종료한다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('좌우 화살표 키로 단계를 이동한다', () => {
    mockRects(['ticker-create', 'simulation-result', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'simulation-result', 'scenario-tabs'])));

    startTour();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: '결과 읽는 법' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('dialog', { name: '먼저 종목을 추가하세요' })).toBeInTheDocument();
  });

  it('종료하면 시작 아이콘으로 포커스를 돌려준다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByRole('button', { name: '튜토리얼 시작' })).toHaveFocus();
  });

  it('열리면 말풍선으로 포커스를 옮긴다', () => {
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('다시 시작할 수 있다', () => {
    markTourSeen(STORAGE_KEY);
    mockRects(['ticker-create', 'scenario-tabs']);
    render(createElement('div', null, renderTour(['ticker-create', 'scenario-tabs'])));

    startTour();
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    startTour();
    expect(screen.getByRole('dialog', { name: '먼저 종목을 추가하세요' })).toBeInTheDocument();
  });
});
