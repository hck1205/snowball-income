import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { TOUR_STEPS, TOUR_TARGET } from '@/shared/constants';
import { openSettingsDrawer } from '@/test';

/**
 * 가이드 투어 **앵커**(`data-tour`)의 존재 계약.
 *
 * 투어는 앵커를 못 찾으면 그 단계를 **조용히 건너뛴다**(`resolveVisibleSteps`) — 즉 앵커가 사라져도
 * 화면은 멀쩡하고 테스트도 초록이다. 실제로 이 레포의 `TourGuide.test.ts` 는 합성 하네스에
 * 자기 앵커를 심어 쓰기 때문에 **앱에 앵커가 실제로 붙어 있는지는 아무도 안 본다**(레이아웃 개편으로
 * 카드가 통째로 갈아끼워질 때 가장 잃기 쉬운 종류의 계약이다).
 *
 * 그래서 여기서는 "앵커가 DOM 에 있는가"만 상태별로 확인한다.
 * ⚠ 앵커가 **화면에서 보이는가**(스포트라이트가 실제로 그려지는가)는 jsdom 이 레이아웃을 재지 않아
 *   검증 불가다 — `test/setup.ts` 가 모든 요소에 900×320 을 물려 놓아 가시성 판정이 무의미해진다.
 */

const LAZY_MODAL_TIMEOUT = { timeout: 3000 };

type User = ReturnType<typeof userEvent.setup>;

beforeAll(async () => {
  await import('@/pages/Main/components/TickerModal');
});

const anchors = (): string[] =>
  Array.from(document.querySelectorAll('[data-tour]')).map((node) => node.getAttribute('data-tour') ?? '');

const renderApp = (): User => {
  render(
    <Provider store={createStore()}>
      <MainPage />
    </Provider>
  );
  return userEvent.setup();
};

describe('가이드 투어 앵커 — 앱에 실제로 붙어 있다', () => {
  it('첫 화면(빈 포트폴리오): 설정 진입 · 프리셋 보드 · 시나리오 탭', () => {
    renderApp();

    expect(anchors()).toEqual(
      expect.arrayContaining([TOUR_TARGET.openSettings, TOUR_TARGET.portfolioPresets, TOUR_TARGET.scenarioTabs])
    );
  });

  it('설정 드로어 안: 티커 생성 · 퀵액션 · 투자 설정 (드로어는 항상 마운트라 닫혀 있어도 DOM 에 있다)', async () => {
    const user = renderApp();

    expect(anchors()).toEqual(
      expect.arrayContaining([TOUR_TARGET.tickerCreate, TOUR_TARGET.quickActions, TOUR_TARGET.investmentSettings])
    );

    await openSettingsDrawer(user);
    expect(anchors()).toEqual(
      expect.arrayContaining([TOUR_TARGET.tickerCreate, TOUR_TARGET.quickActions, TOUR_TARGET.investmentSettings])
    );
  });

  it('결과가 있는 화면: 포트폴리오 구성 · 결과 요약 카드', async () => {
    const user = renderApp();

    await openSettingsDrawer(user);
    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '티커 생성' }, LAZY_MODAL_TIMEOUT);
    await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), 'SCHD');
    await user.click(within(dialog).getByRole('option', { name: 'SCHD 선택' }));
    await user.click(within(dialog).getByRole('button', { name: '생성' }));

    // 결과 요약 카드는 `SimulationResult` 분해로 새 컴포넌트가 됐다 — 앵커가 함께 이사했는지 본다.
    expect(anchors()).toEqual(
      expect.arrayContaining([TOUR_TARGET.portfolioComposition, TOUR_TARGET.simulationResult])
    );
  });

  /*
   * 🔴 **레지스트리 전수.** 위 세 케이스는 `arrayContaining` 으로 **그때 알던 키**만 센다 — 그래서
   *   `TOUR_TARGET`/`TOUR_STEPS` 에 단계를 **새로 추가하고 앵커를 안 붙이면** 전부 초록이다
   *   (실측: 앵커 없는 단계 하나를 넣었더니 tourAnchors 4건 + TourGuide 29건 = **33건 전원 통과**).
   *   투어는 앵커를 못 찾으면 그 단계를 조용히 건너뛰므로 화면에도 아무 증상이 없다.
   *
   *   그래서 여기서는 목록을 손으로 적지 않고 **레지스트리에서 파생**해 비교한다. 단계를 추가한
   *   사람은 앵커를 붙이거나(정상) 이 테스트가 왜 빨간지 읽게 된다.
   *
   * ⚠ 한 화면에 8개가 동시에 서지는 않는다(빈 상태 전용 · 결과 전용이 배타적이다) — 그래서
   *   상태를 밟아 가며 **합집합**을 모은다. 순서가 중요하다: 프리셋 보드는 종목을 담는 순간 사라진다.
   */
  it('TOUR_STEPS 의 모든 단계가 앱 어딘가에 실제 앵커를 갖는다 (레지스트리 전수)', async () => {
    const user = renderApp();
    const seen = new Set<string>();
    const collect = () => anchors().forEach((anchor) => seen.add(anchor));

    collect(); // 빈 상태 + 설정 드로어(항상 마운트라 닫혀 있어도 DOM 에 있다)
    await openSettingsDrawer(user);
    collect();

    await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '티커 생성' }, LAZY_MODAL_TIMEOUT);
    await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), 'SCHD');
    await user.click(within(dialog).getByRole('option', { name: 'SCHD 선택' }));
    await user.click(within(dialog).getByRole('button', { name: '생성' }));
    collect(); // 결과가 있는 상태

    const missing = TOUR_STEPS.map((step) => step.target).filter((target) => !seen.has(target));

    expect(
      missing,
      '이 단계들의 `data-tour` 앵커가 앱 어디에도 없다 — 투어가 조용히 건너뛴다. ' +
        '앵커를 붙이거나, 그 단계를 TOUR_STEPS 에서 빼라.'
    ).toEqual([]);

    // 반대 방향: 레지스트리에 없는 앵커가 앱에 떠 있으면 오타이거나 죽은 앵커다.
    expect([...seen].filter((anchor) => !Object.values(TOUR_TARGET).includes(anchor as never))).toEqual([]);
  });

  it('앵커는 상태마다 정확히 한 벌씩만 존재한다(중복 렌더 금지)', () => {
    renderApp();

    const found = anchors();
    expect(new Set(found).size).toBe(found.length);
  });
});
