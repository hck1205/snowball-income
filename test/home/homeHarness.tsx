import { render } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '@/pages/Home/HomePage';
import { storageKey } from '@/shared/lib/storage';

/**
 * 첫 화면(`/`) 렌더 **공용 하네스**.
 *
 * 준비물은 라우터 하나뿐이다 — 이 화면은 저장소도 네트워크도 읽지 않는다(지수 조회 드라이버가
 * 없는 것이 의도다. `pages/Landing` 은 그 드라이버를 걷어 내는 데 별도 가드가 필요했다).
 *
 * ⚠ `hungryhippo:has-workspace` 마커는 `localStorage` 한 개다. 테스트가 심으면 "이어서 계산하기"가
 * 보이고 지우면 안 보인다 — 값을 **테스트가 명시적으로** 정하게 한다(전역 상태 누수 방지).
 */

export const HAS_WORKSPACE_KEY = storageKey('has-workspace');

export const setWorkspaceMarker = (present: boolean): void => {
  if (present) window.localStorage.setItem(HAS_WORKSPACE_KEY, '1');
  else window.localStorage.removeItem(HAS_WORKSPACE_KEY);
};

export const renderHomePage = (initialEntry = '/') =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <HomePage />
      </MemoryRouter>
    </Provider>
  );
