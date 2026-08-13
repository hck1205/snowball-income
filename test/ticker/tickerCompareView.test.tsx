import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TickerCompareView from '@/pages/Ticker/TickerComparePage/TickerComparePage.view';
import { buildPresetPreviews } from '@/pages/Ticker/TickerComparePage/TickerComparePage.utils';
import type { TickerCompareViewModel } from '@/pages/Ticker/TickerComparePage';
import {
  COMPARE_PRESETS,
  MAX_COMPARE_TICKERS,
  buildTickerCompareModel,
  getCompareCandidates
} from '@/pages/Ticker/utils';

/**
 * `/ticker/compare` 화면의 **진입점 계약**.
 *
 * 🔴 이 스위트가 존재하는 이유는 하나다 — 2026-08-03 레이아웃 전면 개편에서 표·선택 UI·빈 상태의
 * DOM 을 통째로 다시 짰다. 그때 잃기 가장 쉬운 것이 **누를 수 있는 자리**다(칩의 × 가 슬롯의 × 로,
 * 버튼 목록이 카드 격자로 옮겨 갔다). 그래서 여기서는 모양이 아니라 **행동**만 잠근다.
 *
 * ⚠ className·Emotion 내부 구현을 단정하지 않는다(.cursor/rules). 접근名·역할·보이는 글자만 본다.
 */

const buildViewModel = (tickers: readonly string[]): TickerCompareViewModel => {
  const model = buildTickerCompareModel(tickers);
  return {
    model,
    candidates: getCompareCandidates(),
    isAtLimit: model.columns.length >= MAX_COMPARE_TICKERS,
    hasEnough: model.columns.length >= 2,
    suggestions: buildPresetPreviews(COMPARE_PRESETS)
  };
};

const renderView = (tickers: readonly string[]) => {
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  const onApplySuggestion = vi.fn();
  const onSimulate = vi.fn();
  render(
    <MemoryRouter>
      <TickerCompareView
        viewModel={buildViewModel(tickers)}
        onAdd={onAdd}
        onRemove={onRemove}
        onApplySuggestion={onApplySuggestion}
        onSimulate={onSimulate}
      />
    </MemoryRouter>
  );
  return { onAdd, onRemove, onApplySuggestion, onSimulate };
};

describe('선택 진입점', () => {
  it('고른 종목마다 빼기 버튼이 있고 그 종목을 돌려준다', async () => {
    const { onRemove } = renderView(['SCHD', 'JEPI']);

    const removeSchd = screen.getByRole('button', { name: 'SCHD 비교에서 빼기' });
    expect(screen.getByRole('button', { name: 'JEPI 비교에서 빼기' })).toBeInTheDocument();

    await userEvent.click(removeSchd);
    expect(onRemove).toHaveBeenCalledWith('SCHD');
  });

  /**
   * 🔴 2026-08-09 — 네이티브 `<select>` 에서 **검색되는 콤보박스**로 바뀌었다(사용자 요청).
   *    후보가 수백 개면 스크롤로만 찾아야 했는데, 티커를 아는 사람에게 그건 가장 느린 길이다.
   *
   * ⚠ 그래서 `selectOptions`(네이티브 전용)를 쓸 수 없다. 사용자가 실제로 하는 대로 —
   *   **치고 고른다** — 조작한다.
   */
  it('검색해서 종목을 더할 수 있고, 이미 고른 종목은 후보에서 빠진다', async () => {
    const { onAdd } = renderView(['SCHD', 'JEPI']);

    const combo = screen.getByRole('combobox', { name: '종목 추가' });
    await userEvent.click(combo);

    /* 이미 고른 것은 후보에 없다. */
    expect(screen.queryByRole('option', { name: /^SCHD ·/ })).toBeNull();

    await userEvent.type(combo, 'O');
    const option = await screen.findByRole('option', { name: /^O ·/ });
    await userEvent.click(option);

    expect(onAdd).toHaveBeenCalledWith('O');
  });

  it(`상한(${MAX_COMPARE_TICKERS}종)에서는 추가 컨트롤을 잠그고 **사유를 문장으로** 말한다`, () => {
    renderView(['SCHD', 'JEPI', 'O', 'VOO']);
    expect(screen.getByRole('combobox', { name: '종목 추가' })).toBeDisabled();
    expect(screen.getByText(/모두 골랐습니다/)).toBeInTheDocument();
  });
});

describe('이 종목으로 계산 (연결②)', () => {
  it('고른 종목마다 "이 종목으로 계산" 버튼이 있고 그 종목을 돌려준다', async () => {
    const { onSimulate } = renderView(['SCHD', 'JEPI']);

    // 버튼은 어느 종목인지 접근名으로 말한다(버튼만 훑는 사용자를 위해).
    const simulateSchd = screen.getByRole('button', { name: /SCHD.*시뮬레이터로 보내/ });
    expect(screen.getByRole('button', { name: /JEPI.*시뮬레이터로 보내/ })).toBeInTheDocument();

    await userEvent.click(simulateSchd);
    expect(onSimulate).toHaveBeenCalledWith('SCHD');
  });

  it('🔴 2종 미만(빈 상태·1종)에서는 계산 액션을 그리지 않는다 — 비교가 성립한 뒤에만 나온다', () => {
    renderView(['SCHD']);
    expect(screen.queryByRole('button', { name: /시뮬레이터로 보내/ })).toBeNull();
  });
});

describe('빈 상태의 예시 조합', () => {
  it('열 개 조합이 전부 눌러지고 그 티커 목록을 돌려준다', async () => {
    const { onApplySuggestion } = renderView([]);

    for (const preset of COMPARE_PRESETS) {
      expect(screen.getByRole('button', { name: new RegExp(preset.label.slice(0, 6)) })).toBeInTheDocument();
    }

    const first = COMPARE_PRESETS[0]!;
    await userEvent.click(screen.getByRole('button', { name: new RegExp(first.label.slice(0, 6)) }));
    expect(onApplySuggestion).toHaveBeenCalledWith(first.tickers);
  });

  it('🔴 1종만 골랐을 때 "고른 것이 없는" 문구를 쓰지 않는다 — 이미 고른 종목을 이름으로 부른다', () => {
    renderView(['SCHD']);
    expect(screen.getByText(/SCHD 한 종목을 골랐습니다/)).toBeInTheDocument();
    // 예시를 누르면 선택이 덮인다는 사실을 **누르기 전에** 알린다.
    expect(screen.getByText(/그 조합으로 바뀝니다/)).toBeInTheDocument();
  });
});

describe('🔴 표가 숨기지 않아야 하는 것', () => {
  it('출처 배지 3종이 모두 화면에 남는다 (정직성 장치)', () => {
    renderView(['SCHD', 'JEPI']);
    expect(screen.getAllByText('실측').length).toBeGreaterThan(0);
    expect(screen.getAllByText('계산 가정').length).toBeGreaterThan(0);
    expect(screen.getAllByText('참고').length).toBeGreaterThan(0);
  });

  it('모든 지표 행이 하나도 빠짐없이 표에 남는다 (묶음으로 갈라도 개수는 같다)', () => {
    const model = buildTickerCompareModel(['SCHD', 'JEPI']);
    renderView(['SCHD', 'JEPI']);
    for (const row of model.rows) {
      expect(screen.getByText(row.label), row.key).toBeInTheDocument();
    }
  });

  it('가정·참고 행의 설명 문장이 화면에 그대로 붙어 있다', () => {
    const model = buildTickerCompareModel(['SCHD', 'JEPI']);
    renderView(['SCHD', 'JEPI']);
    for (const row of model.rows) {
      if (!row.note) continue;
      expect(screen.getByText(row.note), row.key).toBeInTheDocument();
    }
  });

  it('"가장 높음/낮음"이 색이 아니라 **글자로** 붙는다', () => {
    renderView(['SCHD', 'JEPI', 'O']);
    expect(screen.getAllByText('가장 높음').length).toBeGreaterThan(0);
    expect(screen.getAllByText('가장 낮음').length).toBeGreaterThan(0);
  });

  it('값이 없는 칸은 "자료 없음"이라고 말한다 — 0 이나 대시로 채우지 않는다', () => {
    // JEPI 는 실측 CAGR 이 없다(2026-07-29 스냅샷).
    renderView(['SCHD', 'JEPI']);
    expect(screen.getAllByText('자료 없음').length).toBeGreaterThan(0);
  });
});

describe('지급월 커버리지', () => {
  it('12칸이 각각 그 달의 지급 종목을 낭독한다', () => {
    renderView(['SCHD', 'JEPI']);
    // 1월: JEPI 만 지급(SCHD 는 3·6·9·12월)
    expect(screen.getByLabelText('1월 지급: JEPI')).toBeInTheDocument();
    expect(screen.getByLabelText(/3월 지급: .*SCHD/)).toBeInTheDocument();
  });

  it('빈 달이 있으면 그 달을 정확히 말한다', () => {
    renderView(['SCHD', 'VYM']);
    expect(screen.getByText(/지급월이 있는 종목이 없습니다/)).toBeInTheDocument();
  });
});
