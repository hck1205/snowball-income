import { useEffect, useId, useRef } from 'react';

/**
 * `history.state`에 심는 마커 키. **URL은 절대 건드리지 않는다** — 경로 라우팅과 공유 링크
 * (`?share=` lz-string / `?s=` 스냅샷 키)가 사용자 자산이라 한 글자도 바뀌면 안 되고,
 * 해시 라우팅은 팀 확정 결정으로 금지돼 있다. 그래서 `pushState`에 url 인자를 **주지 않아**
 * (현재 URL 유지) 상태 객체에만 마커를 남긴다.
 */
const DRAWER_HISTORY_MARKER = 'sbDrawer';

type HistoryState = Record<string, unknown> | null;

function readMarker(): unknown {
  const state = window.history.state as HistoryState;
  return state?.[DRAWER_HISTORY_MARKER];
}

/**
 * 마커 엔트리 1개를 심는다. url 인자 생략 = 현재 URL 유지, 기존 state는 보존(RR v6의 idx 등).
 * 실패(샌드박스 iframe 등 history 조작이 막힌 환경)하면 `false` — 그 경우 뒤로가기 닫기만 포기한다.
 */
function pushMarkerEntry(markerId: string): boolean {
  try {
    const previousState = (window.history.state as HistoryState) ?? {};
    window.history.pushState({ ...previousState, [DRAWER_HISTORY_MARKER]: markerId }, '');
    return true;
  } catch {
    return false;
  }
}

/**
 * 이 인스턴스의 되감기 진행 상태. **닫힘 → 되감기 도착 사이에 다시 열리는 경합**에서 마커
 * 엔트리가 2개로 늘어나지 않게 하는 유일한 근거다 — `history.back()`은 동기 호출이 아니라
 * 예약이라(popstate는 다음 태스크에 온다) 그 사이에 push하면 뒤늦은 되감기가 엔트리 하나를
 * 조용히 삼키고, 사용자의 첫 뒤로가기가 먹통이 된다.
 */
type RewindState = {
  /** 정리에서 **예약만** 하고 아직 실행 전인 되감기. 재오픈이 이걸 취소한다(엔트리 재사용). */
  timerId: number | null;
  /** `history.back()`을 이미 불렀고 popstate가 아직 안 온 구간. 취소가 불가능해 도착을 기다린다. */
  isInFlight: boolean;
  /** 그 구간에 다시 열렸는가 — 되감기가 도착한 **뒤에** 마커를 정확히 1개 다시 심는다. */
  needsRepush: boolean;
};

/**
 * **모바일 뒤로가기로 드로어를 닫는다.**
 *
 * 드로어가 열려 있는 동안 히스토리 엔트리를 **정확히 1개** 심어 두고, 뒤로가기(popstate)가
 * 그 엔트리를 소비하면 페이지를 떠나는 대신 `onClose()`만 부른다. X/백드롭/ESC로 닫을 때는
 * 심어둔 엔트리를 `history.back()`으로 되감아 히스토리 오염을 0으로 유지한다.
 *
 * 계약
 * - 열림 → 마커 엔트리 1개 push (URL 불변, 기존 state를 스프레드해 보존).
 * - 뒤로가기 → `onClose()`. 페이지 이탈 없음.
 * - X/백드롭/ESC → 언마운트·닫힘 이펙트 정리에서 `history.back()`으로 마커 소비.
 *   이때 리스너를 **먼저 해제**하므로 그 popstate가 `onClose`를 다시 부르지 않는다(이중 호출 없음).
 * - 닫힌 뒤 뒤로가기 → 원래대로 이전 페이지로 이동.
 * - 중첩(예: 티커 모달 안 필터 드로어)에서도 뒤로가기 1회 = 가장 안쪽 드로어 1개만 닫힌다 —
 *   마커가 boolean이 아니라 **인스턴스별 고유 id**라, 다른 드로어가 만든 popstate에서는
 *   "내 마커가 아직 현재 엔트리"임을 보고 조용히 무시한다.
 * - **되감기 경합**: 닫기가 부른 `history.back()`은 예약이라 popstate가 다음 태스크에 온다.
 *   그 전에 다시 열려도 마커 엔트리는 항상 1개다 — 아직 실행 전이면 되감기를 **취소**하고
 *   살아 있는 엔트리를 재사용하고, 이미 날아갔으면 **도착한 뒤에** 다시 심는다(`RewindState`).
 *   둘 다 안 하면(=닫히자마자 무조건 다시 push) 뒤늦은 되감기가 엔트리 하나를 삼켜
 *   사용자의 첫 뒤로가기가 먹통이 된다.
 *
 * 알려진 제약: 되감기 경합 방어는 **인스턴스 안에서만** 성립한다(상태가 인스턴스 ref다).
 * 서로 다른 드로어 A가 닫히는 같은 틱에 드로어 B가 열리면 B는 A의 되감기를 모른 채 push해
 * 같은 증상이 날 수 있다. 현재 앱에는 그런 동선이 없다 — 중첩 드로어는 바깥이 열린 채로
 * 안쪽만 여닫히고(둘 다 자기 엔트리를 따로 소유), 화면 전환은 드로어를 서로 교체하지 않는다.
 * 그런 동선이 생기면 이 상태를 인스턴스 ref가 아니라 모듈 단위로 올려야 한다.
 *
 * React Router v6(데이터 라우터)와의 간섭: RR은 popstate를 듣지만 우리는 URL을 안 바꾸고
 * 기존 state(RR의 `idx` 포함)를 스프레드로 보존하므로 **pathname/search/hash가 동일**하다 —
 * 라우트 전환도, 컴포넌트 리마운트도 없다. `AnalyticsLayout`의 page_view 이펙트도 의존성이
 * `location.{pathname,search,hash}` 원시값이라 재발화하지 않는다(router/routes.tsx:34).
 * 남는 비용은 라우트 트리 1회 리렌더뿐이고, 이는 드로어 열림/닫힘 리렌더와 같은 급이다.
 *
 * 새로고침: 드로어 상태는 비영속이라 항상 닫힌 채 시작한다. 마커 state가 남아 있어도
 * URL이 같은 엔트리라 무해하다(뒤로가기 한 번이 화면 변화 없이 소비될 수 있는 정도).
 *
 * @param isOpen 드로어 열림 여부
 * @param onClose 닫기(드로어 상태를 false로) — 참조가 매 렌더 바뀌어도 엔트리를 다시 push하지 않는다
 * @param enabled 훅 활성 여부. 오버레이일 때만 히스토리를 건드려야 하는 드로어(예: 데스크톱에서
 *   정적 컬럼이 되는 메인 설정 드로어)가 `matchMedia` 결과를 넘긴다. 기본값 `true`.
 */
export function useDrawerBackClose(isOpen: boolean, onClose: () => void, enabled = true): void {
  // 인스턴스별 고유 마커. 중첩 드로어끼리 서로의 popstate를 가로채지 않게 하는 유일한 근거다.
  const markerId = useId();

  // onClose 참조만 최신으로 유지한다 — 콜백 identity가 바뀔 때마다 엔트리를 다시 push하면
  // 히스토리가 쌓인다(PickerDrawer처럼 인라인 화살표 함수를 넘기는 호출부가 있다).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 열림/닫힘 사이클을 가로질러 살아야 하므로 ref다 — 경합의 양쪽(예약 취소·도착 대기)이
  // 서로 다른 이펙트 실행에서 일어난다.
  const rewindRef = useRef<RewindState>({ timerId: null, isInFlight: false, needsRepush: false });

  useEffect(() => {
    if (!isOpen || !enabled || typeof window === 'undefined') return undefined;

    const rewind = rewindRef.current;

    // ① 아직 실행 전인 되감기는 취소한다 — back()을 안 불렀으니 마커 엔트리가 그대로 살아 있다.
    if (rewind.timerId !== null) {
      window.clearTimeout(rewind.timerId);
      rewind.timerId = null;
    }

    if (readMarker() !== markerId) {
      // 되감기가 이미 도착했다(정상 경로) 또는 남의 히스토리 조작에 밀려 유실됐다 → 새로 1개 심는다.
      rewind.isInFlight = false;
      if (!pushMarkerEntry(markerId)) return undefined;
    } else if (rewind.isInFlight) {
      // ② back()이 날아간 채 다시 열렸다. 지금 심으면 마커가 2개가 되고 뒤늦은 되감기가 그중
      //    하나를 삼켜 첫 뒤로가기가 먹통이 된다 → 도착(popstate) 뒤에 정확히 1개를 다시 심는다.
      rewind.needsRepush = true;
    }
    // else: ①에서 되감기를 취소했다 = 내 엔트리가 아직 현재 엔트리 → 그대로 재사용한다(중복 push 금지).

    const handlePopState = () => {
      // 내 마커가 여전히 현재 엔트리면 = 다른(중첩) 드로어가 자기 엔트리를 되감아 생긴 popstate다.
      // ②의 재심기도 여기 걸린다 — 아래 handleRewindLanded가 **먼저** 등록돼 있어 이 리스너가
      // 도는 시점엔 마커가 이미 다시 심겨 있다(이중 onClose 없음).
      if (readMarker() === markerId) return;
      onCloseRef.current();
    };

    /** 예약한 되감기가 실제로 도착했을 때 1회만 돈다(도착 = 내 엔트리가 소비됐다). */
    const handleRewindLanded = () => {
      window.removeEventListener('popstate', handleRewindLanded);
      rewind.isInFlight = false;
      if (!rewind.needsRepush) return;
      rewind.needsRepush = false;
      pushMarkerEntry(markerId);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      // ⚠ 순서가 계약이다: 리스너를 먼저 떼고 back()을 예약해야 그 popstate가 onClose를 재호출하지 않는다.
      window.removeEventListener('popstate', handlePopState);

      // 되감기가 이미 날아간 채로 닫혔다 → 그게 내 엔트리를 소비한다. 대기 중이던 재심기만 취소하면
      // 수지가 맞는다(여기서 back()을 또 부르면 두 칸 뒤로 = 페이지 이탈이다).
      if (rewind.isInFlight) {
        rewind.needsRepush = false;
        return;
      }

      // 뒤로가기로 이미 소비된 엔트리를 또 되감으면 진짜 이전 페이지로 나가버린다 — 내 마커가
      // 현재 엔트리일 때만 되감는다. (내 엔트리 위에 다른 드로어 엔트리가 얹힌 채 내가 먼저
      // 닫히는 드문 경우엔 되감기를 포기한다 — 잘못 되감아 남의 엔트리를 소비하는 쪽이 더 나쁘다.)
      if (readMarker() !== markerId) return;

      // 되감기를 한 태스크 미룬다 = **취소 지점**을 만든다(①). 브라우저의 back()도 어차피 비동기라
      // 체감 지연은 없고, 대신 "닫자마자 다시 열림"이 엔트리를 2개로 늘리지 않는다.
      rewind.timerId = window.setTimeout(() => {
        rewind.timerId = null;
        // 예약과 실행 사이에 라우터 등이 히스토리를 밀었을 수 있다 — 다시 확인한다.
        if (readMarker() !== markerId) return;

        rewind.isInFlight = true;
        window.addEventListener('popstate', handleRewindLanded);
        window.history.back();
      }, 0);
    };
  }, [enabled, isOpen, markerId]);
}
