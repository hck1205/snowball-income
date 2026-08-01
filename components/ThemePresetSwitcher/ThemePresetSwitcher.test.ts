import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// ⚠ 'jotai' 루트가 아니라 서브패스로 — baseUrl 때문에 루트는 레포의 `jotai/` 배럴로 섀도잉된다.
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { PALETTE_STORAGE_KEY } from '@/jotai';
import { DEFAULT_PALETTE_PRESET_ID, VISIBLE_PALETTE_PRESET_IDS } from '@/shared/constants';
import { THEME_PRESETS } from '@/shared/styles';
import ThemePresetSwitcher from './ThemePresetSwitcher';
import type { ThemePresetSwitcherVariant } from './ThemePresetSwitcher.types';

/**
 * 프리셋 개수/이름을 하드코딩하지 않는다 — 계약은 "**노출 목록** 순회"이므로 목록이
 * 1종이든 8종이든 이 테스트는 그대로 유효해야 한다.
 * (순회 인덱스는 전부 기본 프리셋 위치 기준의 모듈러 연산으로 계산한다.)
 *
 * 🔒 2026-08-01 현재 노출 목록은 1종(기본 팔레트)이다 — 사용자가 "라이트·다크 둘만"을 요청해
 * 색 프리셋 선택을 화면에서 감췄기 때문이다. 여러 항목이 있어야만 의미가 있는 케이스(선택 이동·
 * 화살표 순회)는 `itMulti` 로 묶어 **목록이 1종인 동안만 건너뛴다** — 감추기를 되돌려
 * `VISIBLE_PALETTE_PRESET_IDS` 가 다시 8종이 되면 그 케이스들이 자동으로 되살아난다.
 * (테스트를 지우면 되살릴 때 방어선이 없다.)
 */
const IDS = VISIBLE_PALETTE_PRESET_IDS;
const COUNT = IDS.length;
const DEFAULT_INDEX = IDS.indexOf(DEFAULT_PALETTE_PRESET_ID);
const idAt = (index: number) => IDS[((index % COUNT) + COUNT) % COUNT];
const labelAt = (index: number) => THEME_PRESETS[idAt(index)].label;
const DEFAULT_LABEL = labelAt(DEFAULT_INDEX);

/** 노출 프리셋이 2종 이상일 때만 의미가 있는 케이스. */
const itMulti = it.skipIf(COUNT < 2);

/**
 * 팔레트 atom은 localStorage 연동 전역 atom이라, 테스트마다 새 store + 빈 localStorage로
 * 격리한다 — 앞 테스트의 선택이 다음 테스트의 기본값을 오염시키지 않는다.
 */
const renderSwitcher = (variant?: ThemePresetSwitcherVariant) =>
  render(
    createElement(
      Provider,
      { store: createStore() },
      createElement(ThemePresetSwitcher, variant ? { variant } : {})
    )
  );

beforeEach(() => {
  window.localStorage.clear();
});

describe('ThemePresetSwitcher (inline)', () => {
  it('노출 목록의 프리셋만 그 순서로 렌더하고 기본 프리셋이 선택돼 있다', () => {
    renderSwitcher('inline');

    const group = screen.getByRole('radiogroup', { name: '테마 프리셋' });
    expect(group).toBeInTheDocument();

    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(COUNT);
    expect(options.map((el) => el.textContent)).toEqual(IDS.map((id) => THEME_PRESETS[id].label));

    expect(screen.getByRole('radio', { name: DEFAULT_LABEL })).toHaveAttribute('aria-checked', 'true');
  });

  itMulti('선택되지 않은 프리셋은 aria-checked=false 로 구분된다', () => {
    renderSwitcher('inline');

    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) })).toHaveAttribute('aria-checked', 'false');
  });

  it('선택 항목만 탭 순서에 들어간다 (roving tabindex)', () => {
    renderSwitcher('inline');

    for (const id of IDS) {
      expect(screen.getByRole('radio', { name: THEME_PRESETS[id].label })).toHaveAttribute(
        'tabindex',
        id === DEFAULT_PALETTE_PRESET_ID ? '0' : '-1'
      );
    }
  });

  itMulti('옵션을 클릭하면 즉시 선택이 이동하고 localStorage에 저장된다', async () => {
    const user = userEvent.setup();
    renderSwitcher('inline');

    await user.click(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) }));

    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: DEFAULT_LABEL })).toHaveAttribute('aria-checked', 'false');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(idAt(DEFAULT_INDEX + 1));
  });

  itMulti('화살표 키는 포커스만 옮기고(순환), Space/Enter가 선택한다', async () => {
    const user = userEvent.setup();
    renderSwitcher('inline');

    const current = screen.getByRole('radio', { name: DEFAULT_LABEL });
    current.focus();

    // ↓ 포커스는 다음 항목으로 — 선택은 아직 그대로.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) })).toHaveFocus();
    expect(current).toHaveAttribute('aria-checked', 'true');

    // Enter로 확정.
    await user.keyboard('{Enter}');
    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) })).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(idAt(DEFAULT_INDEX + 1));

    // ↑↑는 위로 두 칸(경계에선 순환), Space로 확정.
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX - 1) })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX - 1) })).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(idAt(DEFAULT_INDEX - 1));
  });

  it('끝에서 화살표를 누르면 반대쪽 끝으로 순환한다', async () => {
    const user = userEvent.setup();
    renderSwitcher('inline');

    screen.getByRole('radio', { name: labelAt(0) }).focus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: labelAt(-1) })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: labelAt(0) })).toHaveFocus();
  });

  it('2열 그리드(시각 배치)에서도 화살표 순회는 DOM 순서 1차원 선형이다', async () => {
    const user = userEvent.setup();
    renderSwitcher('inline'); // inline = 2열 그리드 변형

    screen.getByRole('radio', { name: labelAt(0) }).focus();

    // ↓를 프리셋 개수만큼 누르면 모든 항목을 DOM 순서대로 정확히 한 번씩 지나 제자리로 돌아온다.
    for (let step = 1; step <= COUNT; step += 1) {
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('radio', { name: labelAt(step) })).toHaveFocus();
    }
    expect(screen.getByRole('radio', { name: labelAt(0) })).toHaveFocus();
  });
});

describe('ThemePresetSwitcher (popover)', () => {
  it('트리거는 현재 프리셋 이름을 읽어주고, 누르면 radiogroup 팝오버가 열린다', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    const trigger = screen.getByRole('button', { name: `테마 프리셋 선택 (현재: ${DEFAULT_LABEL})` });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('radiogroup', { name: '테마 프리셋' })).toBeInTheDocument();
    // 열리면 선택된 라디오로 포커스 이동 → 화살표 키가 즉시 동작한다.
    expect(screen.getByRole('radio', { name: DEFAULT_LABEL })).toHaveFocus();
  });

  itMulti('팝오버에서 선택하면 즉시 적용되고 트리거 라벨(현재 프리셋)도 갱신된다', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole('button', { name: /테마 프리셋 선택/ }));
    await user.click(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) }));

    expect(screen.getByRole('radio', { name: labelAt(DEFAULT_INDEX + 1) })).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe(idAt(DEFAULT_INDEX + 1));
    expect(
      screen.getByRole('button', { name: `테마 프리셋 선택 (현재: ${labelAt(DEFAULT_INDEX + 1)})` })
    ).toBeInTheDocument();
  });

  it('Esc로 닫히고 포커스는 트리거로 복귀한다', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    const trigger = screen.getByRole('button', { name: /테마 프리셋 선택/ });
    await user.click(trigger);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('바깥을 클릭하면 닫힌다', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole('button', { name: /테마 프리셋 선택/ }));
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
});
