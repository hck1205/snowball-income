import { useEffect, useId, useRef } from 'react';

/**
 * 지금 열려 있는 오버레이 층의 스택 — **여는 순서 = 쌓이는 순서**이고 맨 뒤가 최상위다.
 *
 * 모듈 스코프인 이유: 층끼리 서로를 모르기 때문이다(드로어는 자기 위에 무엇이 열리는지 모르고,
 * 모달은 자기 밑에 무엇이 있는지 모른다). 컨텍스트로 잇는 방법도 있지만 그러면 층마다 Provider
 * 배선이 필요하고, 포털로 `document.body` 에 나가는 층은 그 Provider 밖에 서기 쉽다.
 */
const openOverlayLayers: string[] = [];

/**
 * **중첩 오버레이에서 Escape 한 번 = 맨 위 한 겹만 닫는다.**
 *
 * `useDrawerBackClose` 가 뒤로가기에 대해 하는 일("맨 위 한 겹만" 닫기)의 **키보드 쌍둥이**다.
 * 두 제스처 모두 "전역에서 한 번 발생하는데 닫혀야 할 것은 하나"라는 같은 문제를 풀기 때문에 같은
 * 폴더에 나란히 둔다 — 그쪽도 2026-07-30부터 **같은 모양의 모듈 스코프 스택**을 쓴다(히스토리
 * 마커는 슬롯이 1개라 "내 엔트리가 소비됐다"와 "내 위층이 소비됐다"를 구별하지 못했다).
 *
 * ### 왜 각 층의 `preventDefault()` 만으로는 안 되는가
 * DOM 전파 순서는 `document` **버블 → `window` 버블**로 고정돼 있다. 아래층(드로어)이 `document`
 * 에, 위층(모달)이 `window` 에 리스너를 달면 **아래층이 먼저** 돈다 — 위층이 아무리 성실하게
 * `preventDefault()` 를 불러도 그때는 이미 드로어가 닫힌 뒤다(2026-07-29 실측). 순서를 맞추려면
 * "어느 EventTarget 에 다느냐"로 z-순서를 인코딩해야 하는데, 그건 다음 사람이 볼 수 없는 규약이고
 * 같은 노드에 두 층이 서면(공유 창 위 모달 등) 다시 깨진다. 그래서 순서를 **DOM 이 아니라 스택**이
 * 정한다.
 *
 * ### 지키는 계약
 * - **최상위만 반응**한다. 아래층은 자기 차례(위층이 닫힌 뒤)까지 조용히 기다린다.
 * - **이미 처리된 Escape 는 가로채지 않는다**(`defaultPrevented`). 안쪽 입력의 "Escape = 검색어만
 *   지우기"가 먼저고, 지울 게 없을 때만 층이 닫힌다 — 리스너를 `document` **버블**에 다는 이유가
 *   이것이다(React 는 루트 컨테이너에 위임하므로 컴포넌트 핸들러가 항상 먼저 돈다).
 * - 반응할 때는 `preventDefault()` 를 부른다. 이 스택에 참여하지 않는 다른 Escape 핸들러
 *   (페이지 로컬 드로어들)가 `defaultPrevented` 를 보고 비켜설 수 있게 하는 신호다.
 * - `onEscape` 는 **ref 로 잡는다**. 인라인 화살표를 넘기는 호출부에서 렌더마다 리스너를
 *   다시 달면 그 층이 스택 맨 위로 올라와 **위층을 제치고** 닫히기 때문이다.
 *
 * ### 알려진 제약 — 스택 순서는 "여는 순서"가 아니라 **이펙트 실행 순서**다
 * React 는 마운트 시 **자식 이펙트를 부모보다 먼저** 실행한다. 그래서 부모 오버레이와 그 위에
 * 뜰 오버레이가 **같은 커밋에서 함께 마운트되면**(예: URL 파라미터를 읽어 모달과 그 안 필터를
 * 동시에 열린 상태로 첫 렌더) 안쪽이 먼저 push 되어 **바깥이 최상위**가 된다 — Escape 한 번이
 * 위층이 아니라 아래층을 닫는다. 지금 앱의 모든 층은 이미 뜬 화면에서 **클릭으로 하나씩** 열리고
 * 초기 상태가 전부 닫힘이라 도달 불가다. "열린 채로 시작하는 중첩 오버레이"를 만들면 그때
 * 순서를 이펙트가 아니라 명시적 depth 로 받아야 한다(같은 제약이 `useDrawerBackClose` 에도 있다).
 *
 * @param isOpen 이 층이 열려 있는가. `false` 면 스택에서 빠진다.
 * @param onEscape 이 층을 닫는다 — 참조가 매 렌더 바뀌어도 스택 순서는 흔들리지 않는다.
 */
export function useOverlayEscape(isOpen: boolean, onEscape: () => void): void {
  // 인스턴스별 고유 토큰. 같은 컴포넌트가 여러 벌 떠 있어도 서로를 최상위로 오인하지 않는다.
  const layerId = useId();

  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    openOverlayLayers.push(layerId);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (openOverlayLayers[openOverlayLayers.length - 1] !== layerId) return;

      event.preventDefault();
      onEscapeRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openOverlayLayers.lastIndexOf(layerId);
      if (index >= 0) openOverlayLayers.splice(index, 1);
    };
  }, [isOpen, layerId]);
}
