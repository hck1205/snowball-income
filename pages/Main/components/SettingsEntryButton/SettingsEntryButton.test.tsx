import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SIMULATOR_COPY } from '@/shared/constants';
import SettingsEntryButton from './SettingsEntryButton';
import type { SettingsEntryVariant } from './SettingsEntryButton.types';

/**
 * 설정 드로어를 여는 자리는 둘(히어로·조건 스트립)이고, **이 컴포넌트가 존재하는 이유는
 * 그 둘이 같은 접근성 계약을 잃지 않게 하는 것**이다. 계약이 깨지면:
 *  - `aria-controls` 없음 → 보조기술이 "이 버튼이 무엇을 여는지" 모른다.
 *  - `aria-expanded` 없음 → 지금 열려 있는지 낭독되지 않고, 드로어가 열린 채 같은 버튼을 또 누른다.
 *
 * 두 자리를 **한 테이블로 돌려** 한 곳만 계약을 잃는 회귀를 막는다(손으로 복제하던 시절의 실패 모드).
 * (구 `header` 변형은 2026-07-29 에 삭제됐다 — 히어로 버튼과 역할이 겹쳤다.)
 */

const VARIANTS: { variant: SettingsEntryVariant; accessibleName: string }[] = [
  { variant: 'hero', accessibleName: SIMULATOR_COPY.settingsTitle },
  { variant: 'inline', accessibleName: SIMULATOR_COPY.editCondition }
];

const renderEntry = (variant: SettingsEntryVariant, isOpen = false, onOpen = vi.fn()) => {
  render(<SettingsEntryButton variant={variant} drawerId="config-drawer" isOpen={isOpen} onOpen={onOpen} />);
  return { onOpen, user: userEvent.setup() };
};

describe.each(VARIANTS)('SettingsEntryButton — $variant', ({ variant, accessibleName }) => {
  it('접근명이 자리마다 확정 카피 그대로다', () => {
    renderEntry(variant);

    expect(screen.getByRole('button', { name: accessibleName })).toBeInTheDocument();
  });

  it('여는 대상(aria-controls)을 드로어 id 로 가리킨다', () => {
    renderEntry(variant);

    expect(screen.getByRole('button', { name: accessibleName })).toHaveAttribute('aria-controls', 'config-drawer');
  });

  it('닫혀 있으면 aria-expanded=false', () => {
    renderEntry(variant, false);

    expect(screen.getByRole('button', { name: accessibleName })).toHaveAttribute('aria-expanded', 'false');
  });

  it('열려 있으면 aria-expanded=true — 그리고 버튼은 사라지지 않는다', () => {
    renderEntry(variant, true);

    const button = screen.getByRole('button', { name: accessibleName });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    /*
     * 🔴 구 `DrawerToggleButton` 은 `&[aria-expanded='true'] { display: none; }` 이었다.
     * 열린 동안 버튼이 사라지면 드로어가 닫힐 때 포커스를 돌려줄 대상이 없어진다(키보드 사용자가 위치를 잃는다).
     */
    expect(button).toBeVisible();
  });

  it('누르면 드로어 열기 핸들러가 정확히 한 번 불린다', async () => {
    const { onOpen, user } = renderEntry(variant);

    await user.click(screen.getByRole('button', { name: accessibleName }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsEntryButton — 자리별 차이', () => {
  it('히어로 버튼만 가이드 투어 앵커를 갖는다', () => {
    const { rerender } = render(
      <SettingsEntryButton
        variant="hero"
        drawerId="config-drawer"
        isOpen={false}
        onOpen={vi.fn()}
        dataTour="open-settings"
      />
    );

    expect(screen.getByRole('button', { name: SIMULATOR_COPY.settingsTitle })).toHaveAttribute(
      'data-tour',
      'open-settings'
    );

    rerender(<SettingsEntryButton variant="inline" drawerId="config-drawer" isOpen={false} onOpen={vi.fn()} />);
    expect(screen.getByRole('button', { name: SIMULATOR_COPY.editCondition })).not.toHaveAttribute('data-tour');
  });

  it('두 자리의 카피는 서로 다르다 — 같은 문구면 자리 구분이 사라진다', () => {
    const names = VARIANTS.map((entry) => entry.accessibleName);

    expect(new Set(names).size).toBe(2);
  });
});
