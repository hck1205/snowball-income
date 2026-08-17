import { render } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '@/pages/Landing/LandingPage';
import { storageKey } from '@/shared/lib/storage';

/**
 * 랜딩 렌더 **공용 하네스**.
 *
 * 이 화면은 저장소를 읽지 않는다(IndexedDB 시딩이 필요 없다). 준비물은 둘뿐이다:
 *  ① 라우터 — 히어로 CTA·인라인 링크·검색의 `useSearchParams` 가 요구한다.
 *  ② `fetch` 목 — 지수 조회 드라이버(`useMarketIndicesSync`)가 마운트 즉시 한 번 부른다.
 *     **영원히 대기하는 프로미스**로 끊어 스트립을 로딩 상태로 고정한다(테스트마다 시세가 다르면
 *     구조 단정이 흔들린다).
 *
 * ⚠ `hungryhippo:has-workspace` 마커는 `localStorage` 한 개다. 테스트가 심으면 "이어서 계산하기"가
 * 보이고, 지우면 안 보인다 — 값을 **테스트가 명시적으로** 정하게 한다(전역 상태 누수 방지).
 */

export const HAS_WORKSPACE_KEY = storageKey('has-workspace');

export const setWorkspaceMarker = (present: boolean): void => {
  if (present) window.localStorage.setItem(HAS_WORKSPACE_KEY, '1');
  else window.localStorage.removeItem(HAS_WORKSPACE_KEY);
};

/** 네트워크를 끊는다. 반환한 복원 함수를 `afterEach` 에서 부른다. */
export const stubMarketIndicesFetch = (): (() => void) => {
  const original = globalThis.fetch;
  globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

export const renderLandingPage = (initialEntry = '/') =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LandingPage />
      </MemoryRouter>
    </Provider>
  );
