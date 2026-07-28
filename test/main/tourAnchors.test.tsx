import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { TOUR_TARGET } from '@/shared/constants';
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

  it('앵커는 상태마다 정확히 한 벌씩만 존재한다(중복 렌더 금지)', () => {
    renderApp();

    const found = anchors();
    expect(new Set(found).size).toBe(found.length);
  });
});
