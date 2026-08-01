import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { markTourSeen } from '@/components/TourGuide';
import { TOUR_STORAGE_KEY } from '@/shared/constants';
import { useTourLaunchRequestAtomValue } from '@/jotai';
import HeaderOverflowMenu from './HeaderOverflowMenu';

/** 투어 실행 요청 카운터를 화면에 노출해 bump 여부를 관찰한다. */
function TourRequestProbe() {
  const value = useTourLaunchRequestAtomValue();
  return <output data-testid="tour-req">{value}</output>;
}

describe('HeaderOverflowMenu', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('더보기 버튼을 누르면 메뉴가 열리고 튜토리얼·앱 설치 항목이 보인다', () => {
    render(<HeaderOverflowMenu />);
    const trigger = screen.getByRole('button', { name: '더보기' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: '튜토리얼 보기' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '앱 설치' })).toBeInTheDocument();
  });

  it('바깥을 클릭하면 메뉴가 닫힌다', () => {
    render(<HeaderOverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Esc로 메뉴가 닫힌다', () => {
    render(<HeaderOverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('첫 방문 사용자에게 유도 점을 보이고, 튜토리얼 보기를 누르면 투어를 요청하며 점이 사라진다', () => {
    const { container } = render(
      <>
        <HeaderOverflowMenu />
        <TourRequestProbe />
      </>
    );

    const before = Number(screen.getByTestId('tour-req').textContent);
    expect(container.querySelector('[data-first-visit="true"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '튜토리얼 보기' }));

    // 투어 실행 신호를 한 번 올린다 → TourGuide가 이 변화를 감지해 오버레이를 연다.
    expect(Number(screen.getByTestId('tour-req').textContent)).toBe(before + 1);
    // 발견했으니 유도 점은 감춘다.
    expect(container.querySelector('[data-first-visit="true"]')).toBeNull();
    // 메뉴도 닫힌다.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  /**
   * 🔴 테마는 이 서랍에 없다(2026-07-31). 예전에는 `⋯` → "테마" → 패널로 **두 단계 아래**였고,
   * 진입점이 라벨 없는 아이콘 하나뿐이라 8종 프리셋을 비교하려는 사용자가 도달하지 못했다.
   * 지금 헤더 오른쪽에 상시 있는 것은 **화면 밝기 토글** 하나이고(AppHeader.test 가 잠근다),
   * 색 프리셋 선택 자체가 2026-08-01 에 화면에서 감춰졌다.
   * 여기로 되돌리면 같은 기능의 진입점이 둘이 된다.
   */
  it('테마 항목은 더 이상 이 메뉴에 없다 — 헤더 상시 노출로 승격됐다', () => {
    render(<HeaderOverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));

    expect(screen.queryByRole('menuitem', { name: '테마' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: '테마 프리셋' })).not.toBeInTheDocument();
  });

  it('이미 튜토리얼을 본 사용자에게는 유도 점을 보여주지 않는다', () => {
    markTourSeen(TOUR_STORAGE_KEY);
    const { container } = render(<HeaderOverflowMenu />);

    expect(container.querySelector('[data-first-visit="true"]')).toBeNull();
  });

  it('showTutorial={false}면 튜토리얼 항목·첫 방문 유도 점을 렌더하지 않는다 (앱 설치만)', () => {
    // localStorage는 beforeEach가 비워 tour-seen=false다 — 그럼에도 유도 점이 없어야 한다(튜토리얼 자체 스킵).
    const { container } = render(<HeaderOverflowMenu showTutorial={false} />);

    expect(container.querySelector('[data-first-visit="true"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    // 튜토리얼 항목은 없고, 앱 설치는 그대로 있다(커뮤니티 헤더 = 튜토리얼 제외 ⋯ 메뉴).
    expect(screen.queryByRole('menuitem', { name: '튜토리얼 보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '앱 설치' })).toBeInTheDocument();
  });

  it('설치 프롬프트가 없으면 앱 설치가 수동 설치 가이드 모달을 연다', () => {
    render(<HeaderOverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '앱 설치' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const close = screen.getByRole('button', { name: '닫기' });

    fireEvent.click(close);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('설치 가능한 브라우저에서는 앱 설치가 네이티브 프롬프트를 띄운다', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    render(<HeaderOverflowMenu />);

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), {
          prompt,
          userChoice: Promise.resolve({ outcome: 'accepted', platform: '' })
        })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '앱 설치' }));

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    // 네이티브 경로를 탔으니 수동 가이드 모달은 뜨지 않는다.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
