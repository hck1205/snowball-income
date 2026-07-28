import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { buildGoalPayload, renderPortfolioPage, resetGoalStorages, seedGoalStorages } from './portfolioGoalHarness';

/**
 * `/dividend/portfolio` **카드 순서 계약**(사용자 확정 2026-07-29):
 * 보유 종목 → 목표 달성 → 지금 받는 배당.
 *
 * 순서는 화면에서 가장 눈에 띄는 결정인데 **코드에서는 JSX 한 덩어리를 옮기면 끝**이라 회귀가 쉽다.
 * 그래서 렌더 결과의 **DOM 순서**로 잠근다(스타일이 아니라 문서 순서 — 스크린리더·탭 순서와 같은 순서다).
 */
const copy = PORTFOLIO_COPY;
const HOLDING = [{ ticker: 'SCHD', quantity: 10 }];

/** 화면에 그려진 카드 제목을 **문서 순서대로** 모은다. */
const cardTitlesInOrder = (): string[] => {
  const titles: string[] = [copy.holdings.title, copy.goal.title, copy.summary.title];
  return screen
    .getAllByRole('heading')
    .map((node) => node.textContent?.trim() ?? '')
    .filter((text) => titles.includes(text));
};

describe('내 포트폴리오 — 카드 순서', () => {
  beforeEach(async () => {
    await resetGoalStorages();
  });

  afterEach(async () => {
    await resetGoalStorages();
  });

  it('보유 종목 → 목표 달성 → 지금 받는 배당 순서로 그린다', async () => {
    await seedGoalStorages({ payload: buildGoalPayload(), holdings: HOLDING });
    renderPortfolioPage();

    // 목표 카드는 저장 payload 를 비동기로 읽은 뒤에 붙는다 — 그것까지 기다린 다음 순서를 본다.
    expect(await screen.findByRole('heading', { name: copy.goal.title })).toBeInTheDocument();

    expect(cardTitlesInOrder()).toEqual([copy.holdings.title, copy.goal.title, copy.summary.title]);
  });

  it('목표 카드가 없어도 나머지 순서는 그대로다 (보유 종목 → 지금 받는 배당)', async () => {
    // 시뮬레이터 저장 payload 가 없으면 목표 카드는 렌더되지 않는다.
    await seedGoalStorages({ holdings: HOLDING });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { name: copy.holdings.title })).toBeInTheDocument();

    expect(cardTitlesInOrder()).toEqual([copy.holdings.title, copy.summary.title]);
  });
});
