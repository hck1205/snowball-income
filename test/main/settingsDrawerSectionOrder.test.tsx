import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import { openSettingsDrawer, settingsDrawerPanel } from '@/test';

/**
 * 설정 드로어의 **내부 우선순위** 계약 (2026-07-31 리워크 V3).
 *
 * 고친 문제(실측): 드로어를 열면 위에서부터 `공유`(전폭 고스트 — 빈 입력칸으로 오독) →
 * `티커 생성`(전폭 그라디언트 CTA) → 칩 → 환율 → 토글 → **그제서야** 월적립·기간·세율이었다.
 * 즉 시각적으로 가장 강한 두 요소가 **가장 드물게 쓰는 동작**이었다.
 *
 * 지금 계약: **결과 스트립 → ①종목 → ②투자 조건 → ③계산 방식 → ④도구**.
 *
 * ⚠ 순서는 className 이 아니라 **사용자가 실제로 누르는 컨트롤의 문서 순서**로 잰다
 * (`compareDocumentPosition`) — 카드를 갈아끼워도 계약이 살아남는다.
 */

type User = ReturnType<typeof userEvent.setup>;

const LAZY_MODAL_TIMEOUT = { timeout: 3000 };

beforeAll(async () => {
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

/** `nodes` 가 문서에 나타난 순서 그대로인가. 하나라도 뒤집히면 false. */
const isInDocumentOrder = (nodes: Element[]): boolean =>
  nodes.every(
    (node, index) =>
      index === 0 ||
      (nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  );

/** 섹션마다 "그 섹션이 아니면 존재할 수 없는" 컨트롤 하나씩. */
const sectionAnchors = () => {
  const panel = settingsDrawerPanel();
  return {
    strip: within(panel).getByRole('region', { name: '현재 결과 요약' }),
    tickers: within(panel).getByRole('button', { name: '티커 생성 열기' }),
    conditions: within(panel).getByLabelText('월 투자금 (원)'),
    calcMode: within(panel).getByRole('checkbox', { name: '빠른 추정 보기' }),
    tools: within(panel).getByRole('button', { name: '공유' })
  };
};

const createFromPreset = async (user: User, ticker: string): Promise<void> => {
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  const dialog = await screen.findByRole('dialog', { name: '티커 생성' }, LAZY_MODAL_TIMEOUT);
  await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), ticker);
  await user.click(within(dialog).getByRole('option', { name: `${ticker} 선택` }));
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
};

describe('설정 드로어 — 섹션 순서는 사용 빈도 순이다', () => {
  it('결과 스트립 → 종목 → 투자 조건 → 계산 방식 → 도구', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);

    const { strip, tickers, conditions, calcMode, tools } = sectionAnchors();

    expect(isInDocumentOrder([strip, tickers, conditions, calcMode, tools])).toBe(true);
  });

  it('투자 조건이 계산 방식 토글보다 위에 있다 (뒤집힘 방지 단독 단정)', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);

    const { conditions, calcMode } = sectionAnchors();

    // 종전 배치에서는 이 관계가 정확히 반대였다.
    expect(conditions.compareDocumentPosition(calcMode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('공유는 드로어의 마지막 섹션에 있다 — 첫 화면에서 제일 먼저 닿지 않는다', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);

    const { tickers, tools } = sectionAnchors();

    expect(tickers.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('설정 드로어 — 상단 결과 스트립 (드로어가 hero 숫자를 덮는 문제의 처방)', () => {
  it('종목이 없으면 값 대신 한 줄 안내를 세운다 ("—" 단독 금지)', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);

    const strip = within(settingsDrawerPanel()).getByRole('region', { name: '현재 결과 요약' });
    expect(within(strip).getByText('종목을 담으면 여기에서 결과가 바로 따라옵니다.')).toBeInTheDocument();
  });

  it('결과가 생기면 최종 자산 · 월배당 · 목표 도달 세 값을 보여준다', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);
    await createFromPreset(user, 'SCHD');

    const strip = within(settingsDrawerPanel()).getByRole('region', { name: '현재 결과 요약' });

    expect(within(strip).getByText('최종 자산')).toBeInTheDocument();
    expect(within(strip).getByText('월배당')).toBeInTheDocument();
    expect(within(strip).getByText('목표 도달')).toBeInTheDocument();

    const values = Array.from(strip.querySelectorAll('dd')).map((node) => node.textContent ?? '');
    expect(values).toHaveLength(3);
    // 라벨만 서 있고 값이 비어 있으면 스트립은 아무 일도 하지 않는 것이다.
    expect(values.every((text) => text.trim().length > 0)).toBe(true);
  });

  it('스트립의 최종 자산은 결과 카드 hero 숫자와 **같은 문자열**이다 (포맷터가 갈리지 않는다)', async () => {
    const user = renderApp();
    await openSettingsDrawer(user);
    await createFromPreset(user, 'SCHD');

    const strip = within(settingsDrawerPanel()).getByRole('region', { name: '현재 결과 요약' });
    const stripFinalAsset = within(strip).getByText('최종 자산').nextElementSibling?.textContent ?? '';

    /* 결과 카드 hero: 라벨(span) → 같은 타일(TileRoot) 안의 값(p). */
    const heroTile = screen.getByText('최종 자산 가치').closest('div')?.parentElement as HTMLElement;
    const heroValue = heroTile.querySelector('p')?.textContent ?? '';

    expect(stripFinalAsset).not.toBe('');
    expect(stripFinalAsset).toBe(heroValue);
  });

  it('드로어가 닫혀 있으면 스트립은 렌더되지 않는다 (결과 화면에 사본을 남기지 않는다)', () => {
    renderApp();

    expect(screen.queryByLabelText('현재 결과 요약')).not.toBeInTheDocument();
  });
});
