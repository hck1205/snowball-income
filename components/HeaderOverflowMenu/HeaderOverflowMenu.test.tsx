import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('테마 항목을 누르면 radiogroup이 메뉴 안에서 펼쳐지고, 선택해도 메뉴가 유지된다', () => {
    render(<HeaderOverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));

    const themeItem = screen.getByRole('menuitem', { name: '테마' });
    expect(themeItem).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('radiogroup', { name: '테마 프리셋' })).not.toBeInTheDocument();

    fireEvent.click(themeItem);

    expect(themeItem).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('radiogroup', { name: '테마 프리셋' });
    expect(group).toBeInTheDocument();

    // 프리셋(radio)을 선택해도 메뉴는 닫히지 않는다(비교/전환 편의).
    const radios = within(group).getAllByRole('radio');
    fireEvent.click(radios[radios.length - 1]);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: '테마 프리셋' })).toBeInTheDocument();
  });

  it('이미 튜토리얼을 본 사용자에게는 유도 점을 보여주지 않는다', () => {
    markTourSeen(TOUR_STORAGE_KEY);
    const { container } = render(<HeaderOverflowMenu />);

    expect(container.querySelector('[data-first-visit="true"]')).toBeNull();
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
