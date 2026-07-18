import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import PrecisionSearch from '@/components/community/PrecisionSearch';
import type { PrecisionSearchLayout } from '@/components/community/PrecisionSearch';

const g = COMMUNITY_COPY.gallery;

/** 현재 URL 검색 문자열을 노출하는 프로브 — 커밋(적용/초기화)이 URL을 어떻게 바꾸는지 관찰한다. */
function LocationEcho() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

const renderMenu = (initialEntry = '/community', layout: PrecisionSearchLayout = 'popover') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PrecisionSearch layout={layout} />
      <LocationEcho />
    </MemoryRouter>
  );

const params = () => new URLSearchParams(screen.getByTestId('search').textContent ?? '');
const trigger = () => screen.getByRole('button', { name: new RegExp(g.filterTriggerAria) });

describe('PrecisionSearch — 열기/닫기 (비모달 팝오버)', () => {
  it('트리거로 패널을 토글한다(aria-expanded)', async () => {
    renderMenu();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Esc로 닫고 트리거로 포커스를 되돌린다', async () => {
    renderMenu();
    await userEvent.click(trigger());

    await userEvent.keyboard('{Escape}');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();
  });

  it('바깥을 클릭하면 닫힌다', async () => {
    renderMenu();
    await userEvent.click(trigger());
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('search'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('PrecisionSearch — 2단계 커밋 (적용 전 URL 무변경)', () => {
  it('입력만으로는 URL이 바뀌지 않고, "적용"이 만원→원으로 커밋한다', async () => {
    renderMenu();
    await userEvent.click(trigger());

    await userEvent.type(screen.getByLabelText(g.filterMonthlyMinAria), '100');
    // 아직 커밋 전 — URL은 그대로다
    expect(params().has('mdmin')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: g.filterApply }));
    // 100만원 → 1,000,000원 (canonical 원)
    expect(params().get('mdmin')).toBe('1000000');
    // 적용하면 패널이 닫힌다
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('다시 열면 커밋된 값을 만원 표기로 되살린다(왕복)', async () => {
    renderMenu('/community?mdmin=1000000');
    await userEvent.click(trigger());
    expect(screen.getByLabelText(g.filterMonthlyMinAria)).toHaveValue('100');
  });
});

describe('PrecisionSearch — 초기화(정렬·검색 보존)', () => {
  it('필터 파라미터만 지우고 sort·q는 보존한다, 패널은 열린 채', async () => {
    renderMenu('/community?q=배당&sort=popular&mdmin=1000000');
    await userEvent.click(trigger());

    await userEvent.click(screen.getByRole('button', { name: g.filterReset }));

    const p = params();
    expect(p.has('mdmin')).toBe(false);
    expect(p.get('q')).toBe('배당');
    expect(p.get('sort')).toBe('popular');
    // 초기화 후에도 패널은 열려 있고 입력은 비워진다
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(g.filterMonthlyMinAria)).toHaveValue('');
  });
});

describe('PrecisionSearch — 검증/배지', () => {
  it('최솟값 > 최댓값이면 오류를 보이고 "적용"이 비활성화된다', async () => {
    renderMenu();
    await userEvent.click(trigger());

    await userEvent.type(screen.getByLabelText(g.filterMonthlyMinAria), '1000');
    await userEvent.type(screen.getByLabelText(g.filterMonthlyMaxAria), '100');

    expect(screen.getByRole('alert')).toHaveTextContent(g.filterRangeError);
    expect(screen.getByRole('button', { name: g.filterApply })).toBeDisabled();
  });

  it('활성 필터 그룹 수를 트리거 aria/배지로 알린다(월배당+기간=2)', () => {
    renderMenu('/community?mdmin=1000000&durmin=5');
    expect(trigger()).toHaveAttribute(
      'aria-label',
      expect.stringContaining(g.filterActiveCountAria(2))
    );
  });
});

describe('PrecisionSearch — 반응형 layout prop 구조 분기', () => {
  it('inline(모바일)은 트리거에 라벨 텍스트를 노출하고, popover(데스크톱)는 아이콘 전용이다', () => {
    const { unmount } = renderMenu('/community', 'inline');
    expect(trigger()).toHaveTextContent(g.filterTitle);
    unmount();

    renderMenu('/community', 'popover');
    expect(trigger()).not.toHaveTextContent(g.filterTitle);
  });
});
