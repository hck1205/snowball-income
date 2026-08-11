import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createElement, forwardRef } from 'react';
import type { TickerProfile } from '@/shared/types/snowball';

// 차트는 이 계약과 무관하다 — 캔버스 대신 자리표시자를 그린다(다른 메인 테스트와 같은 관례).
vi.mock('echarts-for-react', () => ({
  default: forwardRef<HTMLDivElement>((_props, ref) => createElement('div', { ref }))
}));

import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import {
  includedTickerIdsAtom,
  scenarioPrefillAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom
} from '@/jotai';
import { TOUR_TARGET } from '@/shared/constants';
import { DEFAULT_PREFILL_PRESET_ID } from '@/pages/Main/utils';

/**
 * **프리필로 열린 첫 화면**의 계약.
 *
 * 프리필 이전에는 프리셋 보드가 "결과가 없을 때만" 서는 화면이었고, 투어 앵커
 * `TOUR_TARGET.portfolioPresets` 도 거기 하나뿐이었다. 첫 방문이 곧바로 결과 화면이 되면서
 * 🔴 **그 앵커가 첫 화면에서 통째로 사라질 수 있는 상태**가 됐다 — 앵커가 없어도 화면은 멀쩡하고
 * 전 스위트가 그린이며 투어만 그 단계를 조용히 건너뛴다(이 레포의 실측 함정).
 *
 * 그래서 결과 아래에 서는 "다른 구성" 고르개가 그 앵커를 이어받는지 여기서 못 박는다.
 * 함께 잠그는 것: 프리필이 아닌 화면에는 그 보드가 **없다**(사용자 화면이 카탈로그가 되지 않는다).
 */

const PROFILE: TickerProfile = {
  id: 'prefill-schd',
  ticker: 'SCHD',
  name: '',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly'
};

const seedStore = ({ prefilled }: { prefilled: boolean }) => {
  const store = createStore();
  store.set(tickerProfilesAtom, [PROFILE]);
  store.set(includedTickerIdsAtom, [PROFILE.id]);
  store.set(weightByTickerIdAtom, { [PROFILE.id]: 100 });
  if (prefilled) {
    store.set(scenarioPrefillAtom, { presetId: DEFAULT_PREFILL_PRESET_ID, status: 'applied' });
  }
  return store;
};

const renderPanel = (prefilled: boolean) => {
  render(
    <Provider store={seedStore({ prefilled })}>
      <MainRightPanel configDrawerId="config-drawer" />
    </Provider>
  );
  return userEvent.setup();
};

const anchors = (): string[] =>
  Array.from(document.querySelectorAll('[data-tour]')).map((node) => node.getAttribute('data-tour') ?? '');

describe('프리필로 열린 결과 화면', () => {
  it('결과가 있어도 프리셋 보드가 함께 서고 투어 앵커가 살아 있다', () => {
    renderPanel(true);

    expect(anchors()).toEqual(
      expect.arrayContaining([TOUR_TARGET.simulationResult, TOUR_TARGET.portfolioPresets])
    );
  });

  it('앵커는 한 벌뿐이다(빈 상태 보드와 중복 렌더 금지)', () => {
    renderPanel(true);

    const found = anchors();
    expect(new Set(found).size).toBe(found.length);
  });

  it('"미리 계산해 두었다"는 안내가 결과보다 먼저 나온다', () => {
    renderPanel(true);

    expect(screen.getByRole('note')).toHaveTextContent('미리 계산해 두었습니다');
  });

  it('묶음은 접힌 채로 서고, 펼쳐야 카드가 나온다', async () => {
    const user = renderPanel(true);
    const board = screen.getByRole('group', { name: '포트폴리오 프리셋 목록' });

    expect(within(board).queryAllByRole('button', { name: /구성 적용$/ })).toHaveLength(0);

    await user.click(within(board).getByRole('button', { name: '2개 보기' }));

    expect(within(board).getAllByRole('button', { name: /구성 적용$/ }).length).toBeGreaterThan(0);
  });

  it('프리필이 아니면(사용자가 만든 워크스페이스) 결과 아래에 프리셋 보드를 붙이지 않는다', () => {
    renderPanel(false);

    expect(screen.queryByRole('group', { name: '포트폴리오 프리셋 목록' })).toBeNull();
    expect(screen.queryByRole('note')).toBeNull();
  });
});
