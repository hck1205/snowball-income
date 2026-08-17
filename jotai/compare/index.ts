import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';
import { storageKey } from '@/shared/lib/storage';

/**
 * 종목 비교 선택 상태 — 유입 화면(의원거래·13F·국민연금·배당목록·검색)에서 고른 티커를
 * `/ticker/compare` 로 넘기기 위한 **화면 간 임시 보관소**.
 *
 * ## 왜 sessionStorage 인가
 * 선택은 "지금 이 탐색 중"에만 뜻이 있다. localStorage 에 두면 어제 고른 넷이 오늘 처음 들어온
 * 화면의 하단 바에 떠 있게 되고(사용자에겐 유령), 탭을 두 개 띄우면 서로의 선택을 덮어쓴다.
 * 반대로 컴포넌트 state 로만 두면 "의원거래에서 둘 고르고 13F 로 넘어가 하나 더" 가 불가능하다 —
 * 유입 화면이 여섯인 이 퍼널에서 그건 기능의 절반을 버리는 것이다.
 *
 * ⚠ 이 폴더는 기존 배럴(`@/jotai`)에 **연결하지 않는다** — `@/jotai/community` 와 같은 이유로,
 *   선택 상태를 쓰지 않는 화면(시뮬레이터·가계부)까지 이 원자를 끌고 가지 않게 한다.
 *   소비처는 `@/jotai/compare` 폴더 경로로 직접 import 한다.
 *
 * ⚠ **유효성은 여기서 검사하지 않는다.** 비교 유니버스에 있는 티커인지는
 *   `pages/Ticker/utils` 의 `isComparableTicker` 가 판정한다(그 판정에 프리셋 유니버스 218종이
 *   필요한데, 상태 원자가 그걸 물면 이 원자를 쓰는 모든 청크가 유니버스를 함께 싣는다).
 */

/** localStorage 의 `hungryhippo:` 접두사 규약을 sessionStorage 에도 그대로 쓴다(키 충돌 방지). */
const STORAGE_KEY = storageKey('compare-selection');

/**
 * 🔴 `sessionStorage` 접근을 **getter 안**에, 그리고 **`typeof` 가드 뒤**에 둔다.
 *
 * getter 안에 두는 것만으로는 부족하다 — `getOnInit: true`(아래)가 이 getter 를 **원자 초기화 시점**에
 * 부르는데, `sessionStorage` 가 전역에 없는 환경(서버 핸들러 번들·비-DOM 테스트)에서는 맨몸 참조가
 * 그 자리에서 `ReferenceError` 로 죽어 import 하는 파일 전체의 로드가 무너진다(테스트가 한 개도 못 돈다).
 * 그런 환경엔 화면이 없어 선택값이 쓰일 일도 없으므로 **메모리 보관소**로 조용히 물러선다. 브라우저·
 * jsdom 에서는 `sessionStorage` 가 있으니 종전과 똑같이 진짜 세션 저장소를 쓴다.
 */
const createMemoryStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    }
  };
};

const memoryStorage = createMemoryStorage();

const storage = createJSONStorage<string[]>(() =>
  typeof sessionStorage !== 'undefined' ? sessionStorage : memoryStorage
);

/**
 * 선택된 티커. 순서 = 고른 순서다(먼저 고른 것이 앞). 상한 초과 시 **앞(가장 오래된 것)을 버린다** —
 * 그 판정은 `addTickerWithEviction` 이 하고 여기는 결과만 담는다.
 *
 * `getOnInit: true` 인 이유: 기본값이면 첫 렌더가 항상 빈 배열이라, 화면을 옮기는 순간 하단 바가
 * 한 프레임 사라졌다 돌아온다(선택이 날아간 것처럼 보인다).
 */
export const compareSelectionAtom = atomWithStorage<string[]>(STORAGE_KEY, [], storage, { getOnInit: true });

/** 선택 구독. 하단 바와 각 행의 체크박스가 같은 값을 본다. */
export const useCompareSelectionAtomValue = () => useAtomValue(compareSelectionAtom);

/** 선택 쓰기. 항상 **다음 배열 전체**를 넘긴다(부분 갱신을 만들지 않는다). */
export const useSetCompareSelectionWrite = () => useAtomWrite(compareSelectionAtom);
