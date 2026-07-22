import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import RangeSlider from './RangeSlider';
import type { RangeSliderProps } from './RangeSlider.types';

/**
 * 듀얼 썸 슬라이더는 role/aria 계약과 onChange 로만 단정한다.
 * Emotion className / 내부 구조 기반 단정 금지(.cursor/rules).
 */
const setup = (overrides: Partial<RangeSliderProps> = {}) => {
  const onChange = vi.fn();
  const props: RangeSliderProps = {
    label: '배당률',
    min: 0,
    max: 20,
    step: 0.5,
    valueMin: 5,
    valueMax: 15,
    unit: '%',
    onChange,
    ...overrides
  };
  render(createElement(RangeSlider, props));
  return { onChange };
};

const minThumb = () => screen.getByRole('slider', { name: '배당률 최소값' });
const maxThumb = () => screen.getByRole('slider', { name: '배당률 최대값' });

describe('RangeSlider', () => {
  it('두 썸을 role=slider + aria 값 계약으로 노출한다', () => {
    setup();

    const low = minThumb();
    expect(low).toHaveAttribute('aria-valuemin', '0');
    // 하단 썸의 상한은 트랙 최대가 아니라 현재 상단 썸 값이다(교차 방지).
    expect(low).toHaveAttribute('aria-valuemax', '15');
    expect(low).toHaveAttribute('aria-valuenow', '5');
    expect(low).toHaveAttribute('aria-valuetext', '5%');
    expect(low).toHaveAttribute('tabindex', '0');

    const high = maxThumb();
    // 상단 썸의 하한은 트랙 최소가 아니라 현재 하단 썸 값이다.
    expect(high).toHaveAttribute('aria-valuemin', '5');
    expect(high).toHaveAttribute('aria-valuemax', '20');
    expect(high).toHaveAttribute('aria-valuenow', '15');
  });

  it('ArrowRight 는 하단 썸을 +step 으로 올려 onChange 한다', () => {
    const { onChange } = setup();

    fireEvent.keyDown(minThumb(), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenLastCalledWith(5.5, 15);
  });

  it('ArrowLeft / ArrowDown 은 -step 으로 내린다', () => {
    const { onChange } = setup();

    fireEvent.keyDown(minThumb(), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(4.5, 15);

    fireEvent.keyDown(maxThumb(), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(5, 14.5);
  });

  it('PageUp / PageDown 은 ±step*10 으로 크게 움직인다', () => {
    const { onChange } = setup();

    fireEvent.keyDown(minThumb(), { key: 'PageUp' });
    // step 0.5 * 10 = 5 → 5 + 5 = 10
    expect(onChange).toHaveBeenLastCalledWith(10, 15);

    fireEvent.keyDown(maxThumb(), { key: 'PageDown' });
    // 15 - 5 = 10
    expect(onChange).toHaveBeenLastCalledWith(5, 10);
  });

  it('Home 은 하단 썸을 트랙 최소로, End 는 상단 썸을 트랙 최대로 보낸다', () => {
    const { onChange } = setup();

    fireEvent.keyDown(minThumb(), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(0, 15);

    fireEvent.keyDown(maxThumb(), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(5, 20);
  });

  it('Home/End 는 상대 썸을 넘지 않게 서로의 값으로 클램프한다', () => {
    // 하단 End → 상단 값(valueMax)에서 멈춘다. 상단 Home → 하단 값(valueMin)에서 멈춘다.
    const { onChange } = setup({ valueMin: 4, valueMax: 12 });

    fireEvent.keyDown(minThumb(), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(12, 12);

    fireEvent.keyDown(maxThumb(), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(4, 4);
  });

  it('두 썸은 교차하지 못한다 — 상단을 하단 아래로 못 내린다', () => {
    const { onChange } = setup({ valueMin: 5, valueMax: 5 });

    // 상단 썸 왼쪽으로: 4.5 로 내려가려 하지만 하단(5)에서 클램프.
    fireEvent.keyDown(maxThumb(), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(5, 5);

    // 하단 썸 오른쪽으로: 5.5 로 올라가려 하지만 상단(5)에서 클램프.
    fireEvent.keyDown(minThumb(), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(5, 5);
  });

  it('숫자 입력(최소값)에 change 하면 슬라이더와 동기해 onChange 한다', () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText('배당률 최소값 입력'), { target: { value: '3' } });

    expect(onChange).toHaveBeenLastCalledWith(3, 15);
  });

  it('숫자 입력(최대값)에 change 하면 상단 썸을 갱신한다', () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '9' } });

    expect(onChange).toHaveBeenLastCalledWith(5, 9);
  });

  it('숫자 입력값은 트랙 범위로 클램프된다', () => {
    const { onChange } = setup();

    // 최대(20) 를 넘는 입력 → 20 으로 클램프.
    fireEvent.change(screen.getByLabelText('배당률 최대값 입력'), { target: { value: '99' } });

    expect(onChange).toHaveBeenLastCalledWith(5, 20);
  });

  it('formatValue 가 있으면 aria-valuetext 를 그 포맷으로 표기한다(캡 표현)', () => {
    setup({ valueMax: 20, formatValue: (value) => (value >= 20 ? '20%+' : `${value}%`) });

    expect(maxThumb()).toHaveAttribute('aria-valuetext', '20%+');
  });

  it('빈 입력은 커밋하지 않는다(다음 blur 에 정규화)', () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText('배당률 최소값 입력'), { target: { value: '' } });

    expect(onChange).not.toHaveBeenCalled();
  });
});
