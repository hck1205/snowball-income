import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Carousel } from './index';

/**
 * 캐러셀의 계약.
 *
 * 🔴 이 부품의 목적은 **한 번에 보이는 양을 줄이는 것**이다(장식이 아니다). 그래서 여기서 재는 것은
 * "예쁘게 넘어가는가"가 아니라 ①넘길 것이 없으면 조작 줄을 그리지 않는가 ②넘길 것이 있으면
 * 사용자가 그 사실을 알 수 있는가 ③키보드로도 되는가 셋이다.
 *
 * ⚠ jsdom 은 레이아웃을 계산하지 않는다 — `clientWidth`/`scrollWidth` 가 전부 0이라 칸 수는 항상
 *   1로 접힌다. 그래서 **칸 수 계산 자체는 여기서 못 잰다**(그건 uiprobe 로 실제 브라우저에서 봤다).
 *   여기서는 그 값들을 직접 세워 "여러 칸일 때의 행동"을 검증한다.
 */
const stubTrackSize = (scrollWidth: number, clientWidth: number) => {
  const track = screen.getByRole('list');
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: clientWidth });
  /* jsdom 에 scrollTo 가 없다 — 호출됐는지만 본다. */
  track.scrollTo = vi.fn() as unknown as typeof track.scrollTo;
  return track;
};

const renderCarousel = (count: number) =>
  render(
    <Carousel ariaLabel="구성 목록">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>카드 {index + 1}</li>
      ))}
    </Carousel>
  );

describe('목록으로 읽힌다', () => {
  it('궤도에 이름이 붙는다 — 이름 없는 덩어리를 만들지 않는다', () => {
    renderCarousel(3);
    expect(screen.getByRole('list', { name: '구성 목록' })).toBeInTheDocument();
  });

  it('넘긴 항목을 하나도 빠뜨리지 않고 그린다 — 접어 두는 것이 아니라 옆에 있는 것이다', () => {
    renderCarousel(6);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('카드 6')).toBeInTheDocument();
  });
});

describe('조작 줄', () => {
  /** 🔴 칸이 하나면 죽은 화살표와 점 하나만 남는 줄이 된다 — 조작할 것이 없으면 그리지 않는다. */
  it('한 칸에 다 들어가면 점·화살표를 그리지 않는다', () => {
    renderCarousel(3);
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });

  it('넘길 것이 있으면 점·화살표·번호가 함께 선다', async () => {
    const { rerender } = renderCarousel(9);
    stubTrackSize(900, 300); // 3칸

    /* 리사이즈 관찰자가 없는 환경이라 렌더를 한 번 더 돌려 측정을 태운다. */
    rerender(
      <Carousel ariaLabel="구성 목록">
        {Array.from({ length: 9 }, (_, index) => (
          <li key={index}>카드 {index + 1}</li>
        ))}
      </Carousel>
    );

    expect(await screen.findByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전' })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /번째$/ })).toHaveLength(3);
  });

  /** 🔴 끝에서 버튼이 **사라지면** 옆 버튼이 그 자리로 밀려와 연달아 누르던 손가락이 다른 것을 누른다. */
  it('시작 칸에서 "이전"은 사라지지 않고 비활성이다', async () => {
    const { rerender } = renderCarousel(9);
    stubTrackSize(900, 300);
    rerender(
      <Carousel ariaLabel="구성 목록">
        {Array.from({ length: 9 }, (_, index) => (
          <li key={index}>카드 {index + 1}</li>
        ))}
      </Carousel>
    );

    expect(await screen.findByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('점을 누르면 그 칸으로 스크롤한다 — 점은 장식이 아니라 버튼이다', async () => {
    const { rerender } = renderCarousel(9);
    const track = stubTrackSize(900, 300);
    rerender(
      <Carousel ariaLabel="구성 목록">
        {Array.from({ length: 9 }, (_, index) => (
          <li key={index}>카드 {index + 1}</li>
        ))}
      </Carousel>
    );

    await userEvent.click(await screen.findByRole('button', { name: '3번째' }));

    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 600 }));
  });
});
