import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { PickerDrawer } from '@/pages/DividendCalendar/components';
import { EMPTY_FILTER_STATE, PresetFilterDrawer } from '@/pages/Main/components/PresetFilterPanel';
import { SideDrawer } from '@/components/common';
import { useDrawerBackClose } from '@/shared/hooks';
import { restoreMatchMedia, stubViewportWidth } from '@/test';

/**
 * 드로어 하나. 실제 드로어들(설정·종목 선택·프리셋 필터)이 공유하는 계약만 남긴 최소 하네스 —
 * "열기 버튼 / 열려 있으면 닫기 버튼"이라는 사용자 행동만 노출한다.
 *
 * `onCloseSpy` 는 **닫기 호출 횟수**를 세는 용도다. "닫혔다"는 화면으로 볼 수 있지만 "두 번
 * 닫으라고 불렸다"(되감기 popstate 가 리스너를 다시 때리는 버그)는 화면에 흔적이 남지 않는다 —
 * 실제 드로어의 `onClose` 는 상태 리셋·계측 같은 부수효과를 갖는 콜백이라 횟수가 계약이다.
 */
function Drawer({
  name,
  enabled = true,
  onCloseSpy
}: {
  name: string;
  enabled?: boolean;
  onCloseSpy?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    onCloseSpy?.();
    setIsOpen(false);
  };

  useDrawerBackClose(isOpen, close, enabled);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        {name} 열기
      </button>
      {isOpen ? (
        <button type="button" onClick={close}>
          {name} 닫기
        </button>
      ) : null}
    </>
  );
}

/**
 * 열림 상태를 **밖에서** 쥐는 변형. "되감기가 도착하기 전에 닫았다 다시 열리는" 경합을
 * 타이밍 운에 맡기지 않고 재현하기 위해 쓴다 — rerender 두 번을 붙이면 같은 태스크 안의
 * 닫힘→열림(되감기 실행 전)이고, 사이에 태스크를 하나 흘려보내면 되감기가 이미 날아간 국면이다.
 */
function ControlledDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useDrawerBackClose(isOpen, onClose);
  return <p>{isOpen ? '드로어 열림' : '드로어 닫힘'}</p>;
}

/** jsdom 의 `history.back()` 은 비동기 태스크라 popstate 가 다음 틱에 온다. */
async function goBack() {
  window.history.back();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * 드로어가 심어 둔 마커가 **현재 엔트리에 남아 있는지**.
 *
 * jsdom 의 `history.length` 로는 "되감았다"를 증명할 수 없다 — 뒤로가기는 인덱스만 옮기고
 * 엔트리 수를 줄이지 않으며, 다음 push 가 앞쪽 엔트리를 잘라내 길이가 우연히 같아진다.
 * 그래서 "현재 엔트리가 드로어 엔트리인가"로 소비 여부를 본다.
 */
function hasDrawerEntry(): boolean {
  const state = window.history.state as Record<string, unknown> | null;
  return state?.sbDrawer !== undefined;
}

/**
 * 이펙트 정리에서 비동기로 날아오는 `history.back()`·popstate 까지 가라앉힌다.
 *
 * ## 🔴 이 값은 부하에 민감하다 (2026-08-09)
 *
 * 30ms 였을 때 이 파일의 "되감기가 이미 날아간 뒤에…" 케이스가 **전체 스위트에서만** 간헐 실패했다
 * (단독 실행은 3/3 통과). jsdom 의 `history.back()` 은 매크로태스크로 popstate 를 흘리는데,
 * 403개 파일이 동시에 도는 동안 그 태스크가 30ms 안에 못 도착하는 일이 생긴다.
 *
 * ⚠ 실패가 **파일 순서·머신 부하에 따라 나타났다 사라진다.** 그래서 "재실행하니 통과"로 넘기기
 *   쉬운데, 그러면 게이트가 신뢰를 잃는다 — 실제로 어느 테스트인지 특정하는 데 두 번의 전체
 *   실행이 들었다.
 * ⚠ 이 파일이 `pool: 'threads'`(vitest.config.ts) 전환 뒤 더 자주 드러났다. 스레드는 한 프로세스를
 *   공유해 타이머 경합이 늘기 때문이다. 되돌리는 것도 방법이지만 그건 스위트 전체를 24초 느리게
 *   만든다 — **고정 대기에 기대는 이 테스트 쪽이 근본 원인**이라 여기를 고쳤다.
 * ⚠ 더 줄이지 마라. 늘리는 것은 안전하다(9곳 × 여유분이므로 스위트에 1초 미만으로 붙는다).
 */
const SETTLE_MS = 150;

async function settle(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, SETTLE_MS);
  });
}

const INITIAL_HREF = window.location.href;

/**
 * URL·state 를 초기값으로 되돌린다. 아래 테스트 중 일부는 실제 경로/쿼리를 바꿔 가며 도는데
 * jsdom 히스토리는 **파일 안에서 공유**라 다음 테스트가 남의 경로 위에서 돌면 안 된다.
 */
afterEach(() => {
  window.history.replaceState(null, '', INITIAL_HREF);
});

describe('useDrawerBackClose', () => {
  it('뒤로가기로 드로어가 닫히고, 그때 URL 은 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    render(<Drawer name="설정" />);

    const urlBeforeOpen = window.location.href;
    await user.click(screen.getByRole('button', { name: '설정 열기' }));

    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
    // 열려도 URL 은 그대로다 — 공유 링크(?share=/?s=)·경로 라우팅을 건드리지 않는다.
    expect(window.location.href).toBe(urlBeforeOpen);

    await goBack();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '설정 닫기' })).not.toBeInTheDocument();
    });
    expect(window.location.href).toBe(urlBeforeOpen);
  });

  it('닫기 버튼으로 닫으면 심어둔 엔트리를 되감아 히스토리가 쌓이지 않는다', async () => {
    const user = userEvent.setup();
    render(<Drawer name="필터" />);

    await user.click(screen.getByRole('button', { name: '필터 열기' }));
    expect(hasDrawerEntry()).toBe(true);

    await user.click(screen.getByRole('button', { name: '필터 닫기' }));

    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
    // 되감기로 생긴 popstate 가 드로어를 "또" 닫으려 들지 않는다(닫힌 상태 유지).
    expect(screen.getByRole('button', { name: '필터 열기' })).toBeInTheDocument();
  });

  it('열고 닫기를 반복해도 엔트리가 쌓이지 않는다', async () => {
    const user = userEvent.setup();
    render(<Drawer name="종목" />);

    let lengthWhileOpen = 0;

    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: '종목 열기' }));
      // 매번 "직전 닫기에서 되감은 자리"에 1개만 얹히므로 열려 있을 때의 총 길이가 늘지 않는다.
      if (i === 0) lengthWhileOpen = window.history.length;
      expect(window.history.length).toBe(lengthWhileOpen);

      await user.click(screen.getByRole('button', { name: '종목 닫기' }));
      await waitFor(() => {
        expect(hasDrawerEntry()).toBe(false);
      });
    }
  });

  it('중첩된 드로어에서 뒤로가기 1회는 가장 안쪽만 닫는다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Drawer name="바깥" />
        <Drawer name="안쪽" />
      </>
    );

    await user.click(screen.getByRole('button', { name: '바깥 열기' }));
    await user.click(screen.getByRole('button', { name: '안쪽 열기' }));

    await goBack();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '안쪽 닫기' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '바깥 닫기' })).toBeInTheDocument();

    // 한 번 더 뒤로가면 바깥도 닫힌다.
    await goBack();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '바깥 닫기' })).not.toBeInTheDocument();
    });
  });

  it('중첩된 안쪽 드로어를 닫기 버튼으로 닫아도 바깥 드로어는 유지된다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Drawer name="바깥" />
        <Drawer name="안쪽" />
      </>
    );

    await user.click(screen.getByRole('button', { name: '바깥 열기' }));
    await user.click(screen.getByRole('button', { name: '안쪽 열기' }));
    await user.click(screen.getByRole('button', { name: '안쪽 닫기' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '안쪽 열기' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '바깥 닫기' })).toBeInTheDocument();
  });

  it('비활성(enabled=false)이면 히스토리를 건드리지 않는다', async () => {
    const user = userEvent.setup();
    render(<Drawer name="데스크톱" enabled={false} />);

    await user.click(screen.getByRole('button', { name: '데스크톱 열기' }));

    expect(hasDrawerEntry()).toBe(false);
    expect(screen.getByRole('button', { name: '데스크톱 닫기' })).toBeInTheDocument();
  });

  /**
   * 되감기(`history.back()`)가 만든 popstate 는 **내 리스너에 닿으면 안 된다** — 닿으면 이미 닫은
   * 드로어에 `onClose` 가 한 번 더 불린다. 화면상으론 똑같이 "닫힘"이라 눈으로는 못 잡고,
   * 정리 순서(리스너 해제 → back)를 뒤집는 리팩터가 조용히 통과해 버린다.
   */
  it('닫기 버튼으로 닫을 때 onClose 는 정확히 한 번만 불린다', async () => {
    const user = userEvent.setup();
    let closeCalls = 0;

    render(
      <Drawer
        name="필터"
        onCloseSpy={() => {
          closeCalls += 1;
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: '필터 열기' }));
    await user.click(screen.getByRole('button', { name: '필터 닫기' }));

    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
    await settle();

    expect(closeCalls).toBe(1);
  });

  /**
   * 뒤로가기 **한 번**은 드로어만 닫는다. 닫은 뒤 정리가 엔트리를 또 되감으면 사용자는 한 번의
   * 뒤로가기로 페이지까지 떠나 버린다(= 두 칸 뒤로). 그리고 닫힌 뒤의 뒤로가기는 정상적으로
   * 이전 화면으로 가야 한다 — 드로어가 남의 내비게이션을 삼키지 않는다는 뜻이다.
   */
  it('뒤로가기 1회는 드로어만 닫고 페이지를 떠나지 않으며, 그다음 뒤로가기는 이전 화면으로 간다', async () => {
    const user = userEvent.setup();
    window.history.pushState(null, '', '/first-page');
    window.history.pushState(null, '', '/second-page');

    render(<Drawer name="설정" />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    expect(window.location.pathname).toBe('/second-page');

    await goBack();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '설정 닫기' })).not.toBeInTheDocument();
    });
    await settle();

    // 드로어만 닫혔다 — 화면(=주소)은 그대로다.
    expect(window.location.pathname).toBe('/second-page');

    await goBack();
    await waitFor(() => {
      expect(window.location.pathname).toBe('/first-page');
    });
  });

  /**
   * React Router v6 는 자기 히스토리 인덱스(`idx`)를 `history.state` 에 넣고 popstate 때 그 값으로
   * 이동 방향을 판단한다. 마커를 얹으면서 기존 state 를 통째로 덮으면 RR 의 내비게이션 상태가
   * 날아간다 — 화면에는 한참 뒤에야(스크롤 복원·뒤로가기 방향) 증상이 나온다.
   */
  it('기존 history.state(React Router 의 idx 등)를 덮지 않고 보존한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({ idx: 7, usr: { scroll: 120 } }, '');

    render(<Drawer name="설정" />);
    await user.click(screen.getByRole('button', { name: '설정 열기' }));

    const openState = window.history.state as Record<string, unknown>;
    expect(openState.idx).toBe(7);
    expect(openState.usr).toEqual({ scroll: 120 });

    await user.click(screen.getByRole('button', { name: '설정 닫기' }));
    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });

    const closedState = window.history.state as Record<string, unknown>;
    expect(closedState.idx).toBe(7);
    expect(closedState.usr).toEqual({ scroll: 120 });
  });

  /**
   * 공유 링크(`?share=` lz-string / `?s=` 스냅샷 키)는 **사용자 자산**이다. 드로어를 열고 닫는
   * 어떤 경로에서도 경로·쿼리가 한 글자도 달라지면 안 된다(달라지면 그 상태로 복사된 링크가 깨진다).
   */
  it('공유 링크(?share=) 위에서 열고 닫아도 경로·쿼리가 한 글자도 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    window.history.pushState(null, '', '/?share=N4IgxgTghgLiBcIDaBGA7AJgAwF0C-QA&s=abc123');
    const shareHref = window.location.href;

    render(<Drawer name="설정" />);

    // 1) 열기 → 닫기 버튼
    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    expect(window.location.href).toBe(shareHref);
    await user.click(screen.getByRole('button', { name: '설정 닫기' }));
    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
    expect(window.location.href).toBe(shareHref);

    // 2) 열기 → 뒤로가기
    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    await goBack();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '설정 닫기' })).not.toBeInTheDocument();
    });
    await settle();
    expect(window.location.href).toBe(shareHref);
  });

  /** 라우트 이동 등으로 **열린 채 사라져도** 심어둔 엔트리를 반납하고 리스너를 남기지 않는다. */
  it('열린 채 언마운트되면 엔트리를 반납하고 리스너도 남기지 않는다', async () => {
    const user = userEvent.setup();
    let closeCalls = 0;

    const { unmount } = render(
      <Drawer
        name="설정"
        onCloseSpy={() => {
          closeCalls += 1;
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    expect(hasDrawerEntry()).toBe(true);

    unmount();

    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
    await settle();

    // 사라진 컴포넌트의 리스너가 남아 있으면 이후 popstate 마다 죽은 onClose 가 불린다.
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    await settle();

    expect(closeCalls).toBe(0);
  });

  /**
   * 열려 있는 동안 폭이 데스크톱으로 바뀌어(`enabled` 가 뒤집혀) 드로어가 정적 컬럼이 되는 경우.
   * 엔트리는 반납하되 **닫지는 않아야** 하고, 다시 모바일로 돌아와도 엔트리가 2개로 늘면 안 된다
   * (늘면 뒤로가기 한 번이 먹히지 않는다).
   */
  it('열린 채 enabled 가 뒤집혀도 엔트리가 새거나 드로어가 멋대로 닫히지 않는다', async () => {
    const user = userEvent.setup();
    let closeCalls = 0;
    const spy = () => {
      closeCalls += 1;
    };

    const { rerender } = render(<Drawer name="설정" onCloseSpy={spy} />);

    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    expect(hasDrawerEntry()).toBe(true);

    // 모바일 → 데스크톱
    rerender(<Drawer name="설정" enabled={false} onCloseSpy={spy} />);
    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
    await settle();
    expect(screen.getByRole('button', { name: '설정 닫기' })).toBeInTheDocument();
    expect(closeCalls).toBe(0);

    // 데스크톱 → 모바일: 엔트리를 다시 정확히 1개만 심는다.
    rerender(<Drawer name="설정" enabled onCloseSpy={spy} />);
    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(true);
    });

    // 엔트리가 2개 쌓였다면 뒤로가기 1회로는 닫히지 않는다.
    await goBack();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '설정 닫기' })).not.toBeInTheDocument();
    });
    expect(closeCalls).toBe(1);
  });

  /**
   * 드로어가 **열린 채 화면이 바뀌면**(라우터가 위에 새 엔트리를 쌓은 뒤 언마운트) 정리는
   * 되감기를 포기한다. 되감으면 남의 엔트리를 소비해 사용자를 방금 떠나온 화면으로 되돌려버린다 —
   * 히스토리에 죽은 엔트리 하나가 남는 쪽이 훨씬 덜 나쁘다(의도된 트레이드오프).
   */
  it('열린 채 다른 화면으로 이동하면 남의 엔트리를 되감지 않는다', async () => {
    const user = userEvent.setup();
    window.history.pushState(null, '', '/page-one');

    const { unmount } = render(<Drawer name="설정" />);
    await user.click(screen.getByRole('button', { name: '설정 열기' }));

    // 라우터가 드로어 위에 새 엔트리를 쌓는다(= 드로어가 열린 채 화면 이동).
    window.history.pushState({ idx: 9 }, '', '/page-two');

    unmount();
    await settle();

    expect(window.location.pathname).toBe('/page-two');
  });

  /**
   * 닫기가 부르는 `history.back()` 은 **동기 호출이 아니라 예약**이다(popstate 는 다음 태스크에
   * 온다). 그 사이에 드로어가 다시 열릴 때 무조건 마커를 또 심으면 엔트리가 2개가 되고, 뒤늦은
   * 되감기가 그중 하나를 조용히 소비해 **사용자의 첫 뒤로가기가 먹통**이 된다.
   *
   * 실사용 트리거: 메인스레드가 밀린 모바일에서 X 를 누른 직후 다시 여는 경우. 아래 두 테스트는
   * 그 경합의 두 국면(되감기 **실행 전** / 이미 **날아간 뒤**)을 각각 결정적으로 재현한다.
   * 두 국면 모두 계약은 같다 — 마커 엔트리는 항상 정확히 1개, 뒤로가기 1회로 닫힘, 주소 불변.
   */
  it('되감기가 실행되기 전에 다시 열려도 뒤로가기 1회로 닫힌다', async () => {
    let closeCalls = 0;
    const onClose = () => {
      closeCalls += 1;
    };

    window.history.pushState(null, '', '/race-first');
    window.history.pushState(null, '', '/race-second');

    const { rerender } = render(<ControlledDrawer isOpen onClose={onClose} />);
    const hrefWhileOpen = window.location.href;

    // 같은 태스크 안에서 닫힘 → 열림. 되감기는 아직 실행 전이라 취소되고 엔트리는 재사용된다.
    rerender(<ControlledDrawer isOpen={false} onClose={onClose} />);
    rerender(<ControlledDrawer isOpen onClose={onClose} />);
    await settle();

    // 다시 열린 드로어는 자기 엔트리를 갖고 있고, 스스로 닫히지도 않았다.
    expect(hasDrawerEntry()).toBe(true);
    expect(closeCalls).toBe(0);

    await goBack();
    await waitFor(() => {
      expect(closeCalls).toBe(1);
    });
    expect(window.location.href).toBe(hrefWhileOpen);

    // 엔트리 수지(오염 0): 드로어가 먹은 엔트리는 1개뿐이라 다음 뒤로가기는 곧장 이전 화면이다.
    await goBack();
    await waitFor(() => {
      expect(window.location.pathname).toBe('/race-first');
    });
  });

  it('되감기가 이미 날아간 뒤에 다시 열려도 뒤로가기 1회로 닫힌다', async () => {
    let closeCalls = 0;
    const onClose = () => {
      closeCalls += 1;
    };

    window.history.pushState(null, '', '/inflight-first');
    window.history.pushState(null, '', '/inflight-second');

    const { rerender } = render(<ControlledDrawer isOpen onClose={onClose} />);
    const hrefWhileOpen = window.location.href;

    rerender(<ControlledDrawer isOpen={false} onClose={onClose} />);
    // 되감기 예약만 한 태스크를 흘려보낸다 = `history.back()` 은 이미 불렸고 popstate 는 아직 안 온
    // 구간(취소 불가). 이때 다시 열린다.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    rerender(<ControlledDrawer isOpen onClose={onClose} />);
    await settle();

    // 되감기가 도착한 **뒤에** 마커를 다시 심는다 — 도착 popstate 가 드로어를 닫아서도 안 된다.
    expect(hasDrawerEntry()).toBe(true);
    expect(closeCalls).toBe(0);

    await goBack();
    await waitFor(() => {
      expect(closeCalls).toBe(1);
    });
    expect(window.location.href).toBe(hrefWhileOpen);

    await goBack();
    await waitFor(() => {
      expect(window.location.pathname).toBe('/inflight-first');
    });
  });
});

/**
 * 배선 검증. 훅 자체가 맞아도 **호출부에 연결되지 않으면** 사용자에게는 아무 일도 안 일어난다.
 * 실제 드로어 컴포넌트를 그대로 렌더해 "기기 뒤로가기 → 이 드로어가 닫힌다"를 확인한다.
 */
describe('드로어 배선 — 실제 컴포넌트', () => {
  it('캘린더 종목 선택 드로어는 뒤로가기로 닫힌다', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button type="button" aria-controls="picker" onClick={() => setIsOpen(true)}>
            종목 선택 열기
          </button>
          <PickerDrawer
            id="picker"
            isOpen={isOpen}
            title="종목 선택"
            closeLabel="종목 선택 닫기"
            onClose={() => setIsOpen(false)}
          >
            <p>목록</p>
          </PickerDrawer>
        </>
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: '종목 선택 열기' }));
    // 이 드로어는 닫혀도 DOM 에 남고 `visibility: hidden` 으로 접근성 트리에서만 빠진다 —
    // 그래서 "열림/닫힘"은 역할 쿼리로 잡히는지(=사용자가 닿을 수 있는지)로 본다.
    expect(screen.getByRole('button', { name: '종목 선택 닫기' })).toBeVisible();

    await goBack();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '종목 선택 닫기' })).toBeNull();
    });
    expect(hasDrawerEntry()).toBe(false);
  });

  it('프리셋 필터 드로어는 뒤로가기 1회로 자기만 닫히고 뒤의 모달은 남는다', async () => {
    const user = userEvent.setup();

    /** 티커 모달(바깥) 안에 필터 드로어(안쪽)가 얹힌 실제 중첩 구조의 최소 재현. */
    function Harness() {
      const [modalOpen, setModalOpen] = useState(true);
      const [filterOpen, setFilterOpen] = useState(false);

      if (!modalOpen) return <p>모달 닫힘</p>;

      return (
        <div role="dialog" aria-label="종목 추가">
          <button type="button" onClick={() => setModalOpen(false)}>
            모달 닫기
          </button>
          <button type="button" aria-controls="preset-filter" onClick={() => setFilterOpen(true)}>
            필터 열기
          </button>
          <PresetFilterDrawer
            open={filterOpen}
            drawerId="preset-filter"
            filter={EMPTY_FILTER_STATE}
            ranges={{ dyMin: 0, dyMax: 20, priceMin: 0, priceMax: 500, etrMin: 0, etrMax: 30 }}
            onChange={() => undefined}
            resultCount={3}
            onClose={() => setFilterOpen(false)}
          />
        </div>
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: '필터 열기' }));
    expect(screen.getByRole('dialog', { name: '프리셋 필터' })).toBeInTheDocument();

    await goBack();

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '프리셋 필터' })).not.toBeInTheDocument();
    });
    // 뒤의 모달은 그대로 — 뒤로가기 한 번이 두 겹을 걷어내지 않는다.
    expect(screen.getByRole('button', { name: '모달 닫기' })).toBeInTheDocument();
  });

  it('메인 설정 드로어는 뒤로가기를 소비한다(전 해상도)', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button type="button" aria-controls="config" onClick={() => setIsOpen(true)}>
            설정 열기
          </button>
          <SideDrawer
            id="config"
            isOpen={isOpen}
            title="투자 설정"
            closeLabel="설정 닫기"
            onClose={() => setIsOpen(false)}
          >
            <p>설정 폼</p>
          </SideDrawer>
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '설정 열기' }));
    expect(hasDrawerEntry()).toBe(true);

    // 이 드로어의 열림/닫힘은 `@media` 안에서만 갈리는데 jsdom 은 미디어쿼리를 평가하지 않는다 —
    // 화면 대신 "심어둔 엔트리를 소비했는가"로 뒤로가기가 드로어에 닿았음을 본다.
    await goBack();
    await waitFor(() => {
      expect(hasDrawerEntry()).toBe(false);
    });
  });

  /**
   * 🔄 **뒤집힌 계약(2026-07-28)**: 설정 패널이 전 해상도 오버레이 드로어가 되면서, 넓은 폭에서도
   * 뒤로가기는 **페이지 이탈이 아니라 드로어 닫기**여야 한다(예전엔 데스크톱에서 히스토리를 건드리지
   * 않는 것이 계약이었다). 넓은 폭에서 달라지는 것은 딤·스크롤 잠금뿐이다.
   */
  it('메인 설정 드로어는 넓은 폭에서도 히스토리 엔트리를 심는다', async () => {
    const user = userEvent.setup();

    // 넓은 폭: `(max-width: 960px)` 가 매치되지 않는다 = 딤·스크롤 잠금 없음.
    stubViewportWidth(1440);

    try {
      function Harness() {
        const [isOpen, setIsOpen] = useState(false);

        return (
          <>
            <button type="button" aria-controls="config" onClick={() => setIsOpen(true)}>
              설정 열기
            </button>
            <SideDrawer
              id="config"
              isOpen={isOpen}
              title="투자 설정"
              closeLabel="설정 닫기"
              onClose={() => setIsOpen(false)}
            >
              <p>설정 폼</p>
            </SideDrawer>
          </>
        );
      }

      render(<Harness />);
      await user.click(screen.getByRole('button', { name: '설정 열기' }));

      expect(hasDrawerEntry()).toBe(true);

      await goBack();
      await waitFor(() => {
        expect(hasDrawerEntry()).toBe(false);
      });
    } finally {
      restoreMatchMedia();
    }
  });
});
