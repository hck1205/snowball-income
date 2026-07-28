import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { openSettingsDrawer } from '@/test';

/**
 * **현행 동작 기록**: 티커를 저장하거나 지우면 설정 드로어가 **닫힌다**
 * (`pages/Main/hooks/business/useTickerActions.ts` — 만든 결과를 바로 보여주려는 동선).
 *
 * ⚠ 이것은 "옳다"는 단정이 아니라 **지금 그렇다**는 기록이다. 설정이 전 해상도 드로어가 되면서
 * 넓은 화면에서는 "종목 3개 추가 = 드로어 3번 열기"가 된다 — 좁은 화면에서 자연스럽던 동선이
 * 넓은 화면에서는 마찰이 된다. **제품 결정 대기 항목**이라 여기서는 고치지 않고, 대신 바뀌는 순간
 * 이 파일이 빨개져 "의도한 변경인가"를 묻게 한다.
 *
 * (드로어를 안 닫는 쪽으로 결정되면 이 파일의 단정을 뒤집고, `useTickerActions` 의
 *  `setIsConfigDrawerOpen(false)` 두 줄을 지우면 된다.)
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

const settingsTrigger = () => screen.getByRole('button', { name: '설정 열기' });
const isDrawerOpen = () => settingsTrigger().getAttribute('aria-expanded') === 'true';

const openTickerModal = async (user: User): Promise<HTMLElement> => {
  await openSettingsDrawer(user);
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  return screen.findByRole('dialog', { name: '티커 생성' }, LAZY_MODAL_TIMEOUT);
};

const createFromPreset = async (user: User, ticker: string): Promise<void> => {
  const dialog = await openTickerModal(user);
  /*
   * ⚠ "저장하면 닫힌다"는 **열려 있었다는 전제** 위에서만 의미가 있다. 이 한 줄이 없으면
   *   `aria-expanded` 가 통째로 사라져도(항상 false 로 읽혀) 이 파일이 초록으로 남는다(뮤테이션 실측).
   */
  expect(isDrawerOpen()).toBe(true);
  await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), ticker);
  await user.click(within(dialog).getByRole('option', { name: `${ticker} 선택` }));
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
};

describe('티커 저장 → 설정 드로어가 닫힌다 (현행 동작 기록 · 제품 결정 대기)', () => {
  it('프리셋으로 티커를 만들면 드로어가 닫히고 결과가 드러난다', async () => {
    const user = renderApp();

    await createFromPreset(user, 'SCHD');

    // 드로어가 닫혔다 — 결과를 가리지 않기 위한 현행 동선.
    expect(isDrawerOpen()).toBe(false);
    expect(screen.queryByRole('button', { name: '티커 생성 열기' })).not.toBeInTheDocument();
    // 그리고 결과가 실제로 나왔다(닫힘이 "아무 일도 없었다"가 아님을 못 박는다).
    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
  });

  it('종목을 더 담으려면 매번 다시 열어야 한다 — 넓은 화면의 마찰 지점', async () => {
    const user = renderApp();

    await createFromPreset(user, 'SCHD');
    expect(isDrawerOpen()).toBe(false);

    // 두 번째 종목: 설정 열기 → 티커 생성 → 저장 → 다시 닫힘.
    await createFromPreset(user, 'JEPI');
    expect(isDrawerOpen()).toBe(false);

    // 두 번 여닫는 대가로 두 종목이 실제로 담겼다.
    const composition = screen.getByRole('heading', { name: '포트폴리오 구성' }).closest('section') as HTMLElement;
    expect(within(composition).getByRole('button', { name: '티커 SCHD 삭제' })).toBeInTheDocument();
    expect(within(composition).getByRole('button', { name: '티커 JEPI 삭제' })).toBeInTheDocument();
  });
});
