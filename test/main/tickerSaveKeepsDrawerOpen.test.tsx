import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { SIMULATOR_COPY } from '@/shared/constants';
import { openSettingsDrawer } from '@/test';

/**
 * **결정(2026-07-31): 티커를 저장하거나 지워도 설정 드로어는 열린 채로 둔다.**
 *
 * 종전에는 `useTickerActions` 가 저장·삭제 뒤 `setIsConfigDrawerOpen(false)` 를 불렀다. 그건
 * "드로어 = 화면을 덮는 모달"이던 시절의 전제였고, 드로어가 **전 해상도 상시**가 된 뒤로는
 * 넓은 화면에서 "종목 3개 추가 = 드로어 3번 열기"라는 마찰이 됐다(이 파일의 옛 두 번째 케이스가
 * 그 비용을 그대로 기록하고 있었다).
 *
 * 닫아서 얻으려던 것("만든 결과를 바로 보여준다")은 드로어 최상단 **결과 스트립**이 대신 받는다 —
 * 최종 자산·월배당·목표 도달이 드로어 안에서 즉시 갱신되므로 닫을 이유가 없다.
 *
 * ⚠ 이 파일은 그 결정을 잠근다. 다시 자동으로 닫게 만들면 여기가 빨개진다.
 */

type User = ReturnType<typeof userEvent.setup>;

const LAZY_MODAL_TIMEOUT = { timeout: 3000 };

beforeAll(async () => {
  // 티커 모달은 대형 티커 JSON 을 끌고 오는 lazy 청크다 — 클릭 대기 창 밖에서 미리 데워 둔다.
  await import('@/pages/Main/components/TickerModal');
});

const renderApp = (): User => {
  render(
    <Provider store={createStore()}>
      <MainPage />
    </Provider>
  );
  return userEvent.setup();
};

const settingsTrigger = () => screen.getByRole('button', { name: SIMULATOR_COPY.settingsTitle });
const isDrawerOpen = () => settingsTrigger().getAttribute('aria-expanded') === 'true';

const openTickerModal = async (user: User): Promise<HTMLElement> => {
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  return screen.findByRole('complementary', { name: '티커 생성' }, LAZY_MODAL_TIMEOUT);
};

const createFromPreset = async (user: User, ticker: string): Promise<void> => {
  const dialog = await openTickerModal(user);
  /*
   * ⚠ "열린 채로 남는다"는 **열려 있었다는 전제** 위에서만 의미가 있다. 이 한 줄이 없으면
   *   `aria-expanded` 가 통째로 사라져도(항상 false 로 읽혀) 판정이 무의미해진다.
   */
  expect(isDrawerOpen()).toBe(true);
  await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), ticker);
  await user.click(within(dialog).getByRole('option', { name: `${ticker} 선택` }));
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
};

describe('티커 저장 → 설정 드로어는 열린 채로 남는다 (2026-07-31 결정)', () => {
  it('프리셋으로 티커를 만들어도 드로어가 닫히지 않는다', async () => {
    const user = renderApp();

    await openSettingsDrawer(user);
    await createFromPreset(user, 'SCHD');

    // 티커 모달만 닫히고 드로어는 그대로다.
    expect(screen.queryByRole('complementary', { name: '티커 생성' })).not.toBeInTheDocument();
    expect(isDrawerOpen()).toBe(true);
    expect(screen.getByRole('button', { name: '티커 생성 열기' })).toBeInTheDocument();
  });

  it('종목을 연달아 담을 때 드로어를 다시 열지 않아도 된다', async () => {
    const user = renderApp();

    await openSettingsDrawer(user);
    await createFromPreset(user, 'SCHD');
    // 두 번째 종목: **드로어를 다시 열지 않고** 바로 이어서 만든다.
    await createFromPreset(user, 'JEPI');
    expect(isDrawerOpen()).toBe(true);

    const composition = screen.getByRole('heading', { name: '포트폴리오 구성' }).closest('section') as HTMLElement;
    expect(within(composition).getByRole('button', { name: '티커 SCHD 삭제' })).toBeInTheDocument();
    expect(within(composition).getByRole('button', { name: '티커 JEPI 삭제' })).toBeInTheDocument();
  });
});
