import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import TickerModalView from './TickerModal.view';
import type { TickerModalViewProps } from './TickerModal.types';

const makeDraft = (draft: Partial<TickerDraft> & { ticker: string }): TickerDraft => ({
  name: draft.ticker,
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 3,
  expectedTotalReturn: 6,
  frequency: 'monthly',
  ...draft
});

// 필터 조작이 결과 카운트에 결정적으로 반영되도록 배당률·주기가 뚜렷이 다른 4종.
const PRESET_TICKERS = {
  A: makeDraft({ ticker: 'A', initialPrice: 10, dividendYield: 2, dividendGrowth: 3, frequency: 'monthly' }),
  B: makeDraft({ ticker: 'B', initialPrice: 50, dividendYield: 4, dividendGrowth: 6, frequency: 'quarterly' }),
  C: makeDraft({ ticker: 'C', initialPrice: 100, dividendYield: 10, dividendGrowth: -2, frequency: 'monthly' }),
  D: makeDraft({ ticker: 'D', initialPrice: 40, dividendYield: 8, dividendGrowth: 1, frequency: 'monthly' })
} as unknown as Record<PresetTickerKey, TickerDraft>;

const makeProps = (overrides: Partial<TickerModalViewProps> = {}): TickerModalViewProps => ({
  isOpen: true,
  mode: 'create',
  selectedPreset: 'custom',
  presetTickers: PRESET_TICKERS,
  tickerDraft: makeDraft({ ticker: '', name: '' }),
  onBackdropClick: vi.fn(),
  onSelectPreset: vi.fn(),
  onChangeDraft: vi.fn(),
  onHelpExpectedTotalReturn: vi.fn(),
  onDelete: vi.fn(),
  onClose: vi.fn(),
  onSave: vi.fn(),
  ...overrides
});

const renderModal = (overrides: Partial<TickerModalViewProps> = {}) => {
  const props = makeProps(overrides);
  render(<TickerModalView {...props} />);
  return props;
};

/** 오직 필터 토글만 aria-expanded 를 가진다 — 상태로 안전히 지목. */
const toggle = (expanded: boolean) => screen.getByRole('button', { expanded });

describe('TickerModal 프리셋 필터 흐름', () => {
  it('모달은 document.body 에 포털로 마운트된다', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // 초기: 필터 접힘, 전량 표시.
    expect(toggle(false)).toBeInTheDocument();
    expect(screen.getByText('표시: 4 / 전체: 4')).toBeInTheDocument();
  });

  it('필터 토글을 열면 수치 필터 드로어(dialog)가 슬라이드된다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(toggle(false));

    expect(toggle(true)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '프리셋 필터' })).toBeInTheDocument();
    expect(screen.getByText('결과 4개')).toBeInTheDocument();
  });

  it('배당률 상한을 낮추면 결과 카운트가 라이브로 줄고, 초기화하면 복귀한다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // 배당률 최대값 5 → yield 2(A)·4(B) 만 통과(10·8 탈락).
    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '5' } });

    expect(screen.getByText('결과 2개')).toBeInTheDocument();
    expect(screen.getByText('표시: 2 / 전체: 4')).toBeInTheDocument();

    // 필터 초기화(패널/토글행 두 곳 중 하나) → 전량 복귀.
    await user.click(screen.getAllByRole('button', { name: '필터 초기화' })[0]);

    expect(screen.getByText('표시: 4 / 전체: 4')).toBeInTheDocument();
  });

  it('지급 주기 칩을 누르면 해당 주기만 남는다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // '월' 칩 → 월배당 A·C·D 만(분기 B 탈락).
    await user.click(screen.getByRole('button', { name: '월', pressed: false }));

    expect(screen.getByText('결과 3개')).toBeInTheDocument();
    expect(screen.getByText('표시: 3 / 전체: 4')).toBeInTheDocument();
  });

  it('결과가 0개면 빈 결과 안내를 보여준다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // 배당률 하한 20 → 어떤 종목도 만족 못 함.
    fireEvent.change(screen.getByLabelText('배당률 최소값 입력'), { target: { value: '20' } });

    expect(screen.getByText('표시: 0 / 전체: 4')).toBeInTheDocument();
    expect(screen.getByText(/조건에 맞는 티커가 없습니다/)).toBeInTheDocument();
    expect(screen.getByText(/일치하는 프리셋 티커가 없습니다/)).toBeInTheDocument();
  });

  it('접힌 상태의 제거칩(✕)을 누르면 그 필터만 해제된다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '5' } });
    expect(screen.getByText('표시: 2 / 전체: 4')).toBeInTheDocument();

    // 드로어 닫기 → 제거칩은 닫힌 상태에서도 노출.
    await user.click(toggle(true));
    expect(screen.queryByRole('dialog', { name: '프리셋 필터' })).not.toBeInTheDocument();

    // 활성 배당률 필터 제거칩 클릭 → 전량 복귀.
    await user.click(screen.getByRole('button', { name: '배당률 0% ~ 5% 필터 제거' }));

    expect(screen.getByText('표시: 4 / 전체: 4')).toBeInTheDocument();
  });

  it('활성 필터가 있으면 토글에 활성 개수 배지가 뜬다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '5' } });

    expect(screen.getByLabelText('활성 필터 1개')).toHaveTextContent('1');
  });
});

describe('TickerModal 드로어 ↔ 모달 격리·포커스·닫기 경로', () => {
  // 모달과 드로어 둘 다 role=dialog 라 이름으로 구분한다.
  const modal = () => screen.getByRole('dialog', { name: '티커 생성' });
  const drawer = () => screen.getByRole('dialog', { name: /프리셋 필터/ });
  const queryDrawer = () => screen.queryByRole('dialog', { name: /프리셋 필터/ });

  it('드로어 내부 ESC 는 드로어만 닫고 모달 onClose 로 전파되지 않는다', async () => {
    // 최상위 위험: ESC 한 번에 드로어와 모달이 함께 닫히면 안 된다.
    const user = userEvent.setup();
    const props = renderModal();
    await user.click(toggle(false));
    expect(drawer()).toBeInTheDocument();

    // 드로어 요소에서 ESC keydown — nativeEvent.stopPropagation 으로 window(모달) 핸들러를 끊는다.
    fireEvent.keyDown(drawer(), { key: 'Escape' });

    // 드로어는 사라지고, 모달은 잔존(controlled prop 이라) + 모달 onClose 스파이 미호출이 진짜 격리 증거.
    expect(queryDrawer()).not.toBeInTheDocument();
    expect(modal()).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
    // 드로어만 닫혔으므로 트리거는 다시 접힘 상태.
    expect(toggle(false)).toBeInTheDocument();
  });

  it('모달 배경에서의 ESC 는 모달 onClose 를 호출한다(격리가 모달 자체 ESC 를 막지 않음)', async () => {
    // 대조군: 드로어가 없을 때 ESC 는 정상적으로 모달 onClose 로 이어진다.
    const props = renderModal();
    // 포커스가 어디에도 없을 때 실제 브라우저가 이벤트를 쏘는 자리(= body)에서 발화시킨다.
    // window 에 직접 쏘면 전파 경로가 window 하나뿐이라 중간 노드의 리스너에 닿지 않는다.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('드로어를 열면 닫기 버튼으로 포커스가 이동하고, 닫으면 트리거로 복귀한다', async () => {
    const user = userEvent.setup();
    renderModal();
    const trigger = toggle(false);

    await user.click(trigger);
    // 첫 포커서블(닫기 버튼)로 포커스 이동.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '필터 닫기' }));

    await user.click(screen.getByRole('button', { name: '필터 닫기' }));
    // 드로어 언마운트 후 트리거로 포커스 복귀.
    expect(queryDrawer()).not.toBeInTheDocument();
    expect(document.activeElement).toBe(toggle(false));
  });

  it('닫기 버튼(X) 클릭으로 드로어가 닫히고 트리거가 접힌다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    await user.click(screen.getByRole('button', { name: '필터 닫기' }));

    expect(queryDrawer()).not.toBeInTheDocument();
    expect(toggle(false)).toHaveAttribute('aria-expanded', 'false');
  });

  it('Scrim(배경 막) 클릭으로 드로어가 닫히고 트리거가 접힌다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // Scrim 은 역할이 없는 오버레이 — 접근 가능한 드로어의 직전 형제로 지목(className 비의존).
    const scrim = drawer().previousElementSibling;
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim as Element);

    expect(queryDrawer()).not.toBeInTheDocument();
    expect(toggle(false)).toHaveAttribute('aria-expanded', 'false');
  });

  it('푸터 기본 버튼("결과 N개 보기") 클릭으로 드로어가 닫히고 트리거가 접힌다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // 초기 결과 4개 → 푸터 기본 버튼 라벨은 "결과 4개 보기".
    await user.click(screen.getByRole('button', { name: '결과 4개 보기' }));

    expect(queryDrawer()).not.toBeInTheDocument();
    expect(toggle(false)).toHaveAttribute('aria-expanded', 'false');
  });

  it('결과 0개면 푸터 기본 버튼이 "닫기"로 바뀌고, 클릭 시 드로어가 닫힌다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    // 배당률 하한 20 → 결과 0개.
    fireEvent.change(screen.getByLabelText('배당률 최소값 입력'), { target: { value: '20' } });
    expect(screen.getByText(/조건에 맞는 티커가 없습니다/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(queryDrawer()).not.toBeInTheDocument();
  });
});

describe('TickerModal "필터 적용 중" 표시(3중 표식)', () => {
  it('필터를 걸면 상태줄·트리거 배지·제거칩이 함께 노출된다', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(toggle(false));

    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '5' } });

    // (a) 검색행 아래 상태줄.
    expect(screen.getByText('필터 적용 중 1개')).toBeInTheDocument();
    // (b) 트리거 활성 개수 배지.
    expect(screen.getByLabelText('활성 필터 1개')).toHaveTextContent('1');
    // (c) 제거칩(닫힌 상태에서도 노출되는 태그).
    expect(screen.getByRole('button', { name: '배당률 0% ~ 5% 필터 제거' })).toBeInTheDocument();
  });

  it('활성 필터가 없으면 "필터 적용 중" 표시가 없다', () => {
    renderModal();
    expect(screen.queryByText(/필터 적용 중/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/활성 필터/)).not.toBeInTheDocument();
  });
});

describe('TickerModal 뒤로가기 닫기 · 배경 스크롤 잠금', () => {
  const modal = () => screen.getByRole('dialog', { name: '티커 생성' });
  const queryDrawer = () => screen.queryByRole('dialog', { name: /프리셋 필터/ });

  /** jsdom 의 `history.back()` 은 비동기 태스크라 popstate 가 다음 틱에 온다. */
  const goBack = async () => {
    window.history.back();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  };

  it('뒤로가기 1회는 필터 드로어만 닫고, 한 번 더 누르면 모달이 닫힌다', async () => {
    // 중첩 계약: 모달(마커1) 위에 필터 드로어(마커2). 한 번에 두 겹이 걷히면 안 된다.
    const user = userEvent.setup();
    const props = renderModal();
    await user.click(toggle(false));
    expect(queryDrawer()).toBeInTheDocument();

    await goBack();

    await waitFor(() => {
      expect(queryDrawer()).not.toBeInTheDocument();
    });
    // 모달은 controlled prop 이라 화면에 남는다 — "안 닫혔다"의 증거는 onClose 미호출이다.
    expect(props.onClose).not.toHaveBeenCalled();
    expect(modal()).toBeInTheDocument();

    await goBack();

    await waitFor(() => {
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('모달을 열어도 URL 은 한 글자도 바뀌지 않는다', () => {
    // 히스토리 마커는 state 에만 심는다(해시 라우팅 금지 · 공유 링크 보존).
    const before = window.location.href;
    renderModal();
    expect(window.location.href).toBe(before);
    /*
     * ⚠ 위 캡처-비교만으로는 부족하다 — 앞선 테스트가 이미 URL 을 오염시켰으면 before 가 그
     *   오염된 값이라 단정이 자기충족이 된다(마커에 '#drawer' 를 붙이는 뮤테이션이 이 테스트를
     *   통과했다). 해시 라우팅 금지는 절대 단정으로 못 박는다.
     */
    expect(window.location.hash).toBe('');
  });

  it('열려 있는 동안 배경 스크롤을 잠그고, 닫으면 원래 값으로 되돌린다', () => {
    const root = document.documentElement;
    /*
     * ⚠ 시작값을 캡처해 그 값과 비교하면(before = root.style.overflow → toBe(before)) 앞선 테스트가
     *   잠금을 흘렸을 때 단정이 **자기충족**이 된다 — 복원 로직을 통째로 지운 뮤테이션이 파일 전체
     *   실행에서 그대로 살아남았다(단독 실행에서만 빨개짐). 절대값 ''로 못 박아 누수까지 잡는다.
     */
    expect(root.style.overflow).toBe('');

    const { unmount } = render(<TickerModalView {...makeProps()} />);
    expect(root.style.overflow).toBe('hidden');

    unmount();
    expect(root.style.overflow).toBe('');
  });
});

describe('TickerModal 히스토리 수지(엔트리 과·부족)', () => {
  /** 훅이 `history.state`에만 심는 마커 키(useDrawerBackClose 내부 상수와 같은 값). */
  const readDrawerMarker = (): unknown => (window.history.state as Record<string, unknown> | null)?.sbDrawer;
  const readPageSentinel = (): unknown => (window.history.state as Record<string, unknown> | null)?.sbTestPage;

  /** 예약된 되감기(setTimeout 0) → history.back() → popstate 까지 이벤트 루프를 흘려보낸다. */
  const settleHistory = async () => {
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
    }
  };

  /** "이전 페이지" 역할의 기준면 엔트리. 되감기가 이걸 삼키면 = 실서비스에서 페이지 이탈이다. */
  const pushPageSentinel = (id: string) => {
    window.history.pushState({ sbTestPage: id }, '');
  };

  it('ESC 로 닫으면 심어둔 엔트리를 정확히 1개만 되감는다(죽은 엔트리도, 페이지 이탈도 없음)', async () => {
    pushPageSentinel('esc-page');
    const props = makeProps();
    const { rerender } = render(<TickerModalView {...props} />);
    // 열림 = 마커 엔트리 1개. 기준면 state 는 스프레드로 보존된다.
    expect(readDrawerMarker()).toBeDefined();
    expect(readPageSentinel()).toBe('esc-page');

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
    // 컨테이너가 닫는다(controlled) — 이 리렌더의 정리에서 되감기가 예약된다.
    rerender(<TickerModalView {...props} isOpen={false} />);
    await settleHistory();

    // 부족(죽은 엔트리) 아님: 마커가 사라졌다.
    await waitFor(() => {
      expect(readDrawerMarker()).toBeUndefined();
    });
    // 과다(페이지 이탈) 아님: 기준면 엔트리가 그대로 현재 엔트리다.
    expect(readPageSentinel()).toBe('esc-page');
    // 되감기 popstate 가 onClose 를 다시 부르지 않는다(리스너 선해제 계약).
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('?share= 쿼리가 붙은 URL 에서 모달을 열고 닫아도 URL 이 한 글자도 바뀌지 않는다', async () => {
    const originalHref = window.location.href;
    const originalState = window.history.state;
    window.history.replaceState({ sbTestPage: 'share-page' }, '', '/?share=NoBiIgbg9g');
    const shareHref = window.location.href;

    const props = makeProps();
    const { rerender } = render(<TickerModalView {...props} />);
    expect(window.location.href).toBe(shareHref);

    // 중첩 드로어까지 열었다 닫아도(엔트리 2개) 쿼리는 불변이어야 한다.
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(window.location.href).toBe(shareHref);

    rerender(<TickerModalView {...props} isOpen={false} />);
    await settleHistory();

    expect(window.location.href).toBe(shareHref);
    expect(window.location.search).toBe('?share=NoBiIgbg9g');

    window.history.replaceState(originalState, '', originalHref);
  });

  it('필터 드로어를 연 채 모달을 통째로 닫아도 기준면 엔트리를 삼키지 않는다', async () => {
    // 저장/취소 = 모달과 그 안의 필터 드로어가 **같은 커밋**에 언마운트되는 동선.
    pushPageSentinel('nested-page');
    const props = makeProps();
    const { rerender } = render(<TickerModalView {...props} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('dialog', { name: /프리셋 필터/ })).toBeInTheDocument();

    rerender(<TickerModalView {...props} isOpen={false} />);
    await settleHistory();

    // 핵심 안전선: 잘못 되감아 기준면(= 이전 페이지)까지 소비하면 실서비스에서 화면이 통째로 이탈한다.
    expect(readPageSentinel()).toBe('nested-page');
    expect(props.onClose).not.toHaveBeenCalled();

    /*
     * 관측된(그리고 훅 JSDoc 이 "의도된 트레이드오프"로 적어 둔) 결과: 바깥 모달의 마커 엔트리가
     * **1개 남는다**. 트리 순서상 모달 정리가 먼저 도는데 그때 현재 엔트리는 안쪽 드로어의 마커라
     * "남의 엔트리를 되감지 않는다" 규칙에 걸려 되감기를 포기하기 때문이다.
     * → 사용자 비용은 "뒤로가기 1회가 화면 변화 없이 소비됨"까지이고, 그 1회는 기준면으로
     *   정확히 복귀한다(두 칸 이탈 아님). 이 경계가 무너지면 여기서 빨개진다.
     */
    expect(readDrawerMarker()).toBeDefined();

    window.history.back();
    await settleHistory();

    await waitFor(() => {
      expect(readDrawerMarker()).toBeUndefined();
    });
    expect(readPageSentinel()).toBe('nested-page');
  });
});
