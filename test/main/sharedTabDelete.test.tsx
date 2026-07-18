import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import { useScenarioTabs } from '@/pages/Main/hooks';
import {
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  activeScenarioIdAtom,
  scenarioTabsAtom
} from '@/jotai/snowball/atoms/portfolio';
import type { PersistedScenarioState } from '@/jotai/snowball/types';

/**
 * 공유 링크로 열린 "공유된 탭"(id='shared-tab')의 삭제 회귀.
 *
 * 버그: 삭제는 [탭 더블클릭 → 이름변경 입력 + X] → [X 클릭 → 확인 모달] → [모달 '삭제' 클릭] 순서다.
 * 이름변경 입력은 onBlur=commitRenameMode 인데, 확인 모달의 '삭제' 버튼을 누르면 (포커스가 입력에서
 * 버튼으로 이동해) blur가 rename을 커밋한다. 공유 탭은 rename 커밋 시 새 id로 승격되므로
 * (useScenarioTabs.renameScenarioTab), 옛 'shared-tab' id를 겨눈 삭제가 어긋나 한 번엔 안 지워졌다.
 * 일반 탭은 rename 커밋에도 id가 그대로라 한 번에 지워진다.
 *
 * 수정: 모달 버튼에도 X와 같은 onMouseDown preventDefault를 걸어 blur 커밋(=id 승격)을 차단한다.
 */

const SHARED_TAB_NAME = '공유된 탭';

const makeSeedTabs = (): PersistedScenarioState[] => [
  {
    id: 'default-tab',
    name: '기본 탭',
    portfolio: { ...EMPTY_PORTFOLIO_STATE },
    investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries } }
  },
  {
    id: 'shared-tab',
    name: SHARED_TAB_NAME,
    portfolio: { ...EMPTY_PORTFOLIO_STATE },
    investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries } }
  }
];

const seedStore = (activeScenarioId: string) => {
  const store = createStore();
  store.set(scenarioTabsAtom, makeSeedTabs());
  store.set(activeScenarioIdAtom, activeScenarioId);
  return store;
};

describe('공유 탭 삭제 — UI 한 번의 확인으로 삭제된다', () => {
  it('활성 공유 탭을 더블클릭→X→삭제 한 번으로 지운다(rename 승격이 삭제 대상을 어긋나게 하지 않는다)', async () => {
    const user = userEvent.setup();
    const store = seedStore('shared-tab');

    render(
      <Provider store={store}>
        <MainRightPanel />
      </Provider>
    );

    // 더블클릭 → 이름변경 모드(입력 + X 닫기 버튼).
    await user.dblClick(screen.getByRole('button', { name: SHARED_TAB_NAME }));

    // X 닫기 → 삭제 확인 모달.
    await user.click(screen.getByRole('button', { name: `${SHARED_TAB_NAME} 삭제` }));

    const dialog = screen.getByRole('dialog', { name: '탭 삭제 확인' });
    // 모달의 '삭제'를 딱 한 번 누른다.
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    // 공유 탭이 사라지고(입력/버튼 모두), 모달도 닫히고, 기본 탭만 남는다.
    expect(screen.queryByRole('button', { name: SHARED_TAB_NAME })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: `${SHARED_TAB_NAME} 이름 변경` })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '탭 삭제 확인' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기본 탭' })).toBeInTheDocument();

    // atom 상태로도 확인: 공유 탭 제거 + 활성은 왼쪽 이웃(기본 탭)으로.
    expect(store.get(scenarioTabsAtom).map((tab) => tab.id)).toEqual(['default-tab']);
    expect(store.get(activeScenarioIdAtom)).toBe('default-tab');
  });
});

describe('deleteScenarioTab — 공유 탭(id="shared-tab")을 1회 호출로 삭제', () => {
  const renderScenarioTabs = (activeScenarioId: string) => {
    const store = seedStore(activeScenarioId);
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useScenarioTabs(), { wrapper });
    return { store, result };
  };

  it('공유 탭이 활성일 때 한 번에 삭제되고 왼쪽 이웃이 활성화된다', () => {
    const { store, result } = renderScenarioTabs('shared-tab');

    let removed = false;
    act(() => {
      removed = result.current.deleteScenarioTab('shared-tab');
    });

    expect(removed).toBe(true);
    expect(store.get(scenarioTabsAtom).map((tab) => tab.id)).toEqual(['default-tab']);
    expect(store.get(activeScenarioIdAtom)).toBe('default-tab');
  });

  it('공유 탭이 비활성일 때 한 번에 삭제되고 활성 탭은 유지된다', () => {
    const { store, result } = renderScenarioTabs('default-tab');

    let removed = false;
    act(() => {
      removed = result.current.deleteScenarioTab('shared-tab');
    });

    expect(removed).toBe(true);
    expect(store.get(scenarioTabsAtom).map((tab) => tab.id)).toEqual(['default-tab']);
    expect(store.get(activeScenarioIdAtom)).toBe('default-tab');
  });
});
