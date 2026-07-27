import { createElement, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PORTFOLIO_QUANTITY_DECIMALS } from '@/shared/lib/portfolio';
import QuantityInput from './QuantityInput';
import type { QuantityInputProps } from './QuantityInput.types';
import {
  QUANTITY_INPUT_DECIMALS,
  clampQuantityDecimals,
  normalizeQuantityInput,
  toQuantityInputChange
} from './QuantityInput.utils';

/**
 * 라벨 없는 인라인 입력이라 **접근성 이름 + onChange 계약**이 이 컴포넌트의 전부다.
 * Emotion className·내부 구조 기반 단정은 하지 않는다(.cursor/rules).
 */
const ARIA_LABEL = 'SCHD 보유 수량';

const setup = (overrides: Partial<QuantityInputProps> = {}) => {
  const onChange = vi.fn();
  const props: QuantityInputProps = {
    value: '',
    ariaLabel: ARIA_LABEL,
    onChange,
    ...overrides
  };
  render(createElement(QuantityInput, props));
  return { onChange };
};

/**
 * 실제 호출부처럼 **값을 되돌려 주는** 하네스. 제어 입력이라 부모가 상태를 쥐지 않으면
 * 리렌더마다 DOM 값이 prop 으로 되돌아가 연속 타이핑을 검증할 수 없다.
 */
const StatefulHarness = () => {
  const [value, setValue] = useState('');

  return createElement(QuantityInput, { value, ariaLabel: ARIA_LABEL, onChange: setValue });
};

const field = () => screen.getByRole('textbox', { name: ARIA_LABEL });

describe('normalizeQuantityInput', () => {
  it('숫자와 점 1개만 남긴다 — 음수 부호·문자·공백은 버린다', () => {
    expect(normalizeQuantityInput('-12a b3')).toBe('123');
    expect(normalizeQuantityInput('1.2.3')).toBe('1.23');
    expect(normalizeQuantityInput('1e5')).toBe('15');
    expect(normalizeQuantityInput('')).toBe('');
  });

  it('소수점을 찍는 중간 상태를 보존한다', () => {
    expect(normalizeQuantityInput('1.')).toBe('1.');
    expect(normalizeQuantityInput('.5')).toBe('.5');
  });
});

describe('clampQuantityDecimals', () => {
  it('소수 자릿수를 넘는 입력은 반올림하지 않고 자른다', () => {
    expect(clampQuantityDecimals('1.23456')).toBe('1.2345');
    expect(clampQuantityDecimals('1.2')).toBe('1.2');
    expect(clampQuantityDecimals('120')).toBe('120');
  });

  it('정수만 허용해야 하는 자리에서는 점까지만 남긴다', () => {
    expect(clampQuantityDecimals('1.5', 0)).toBe('1.');
  });
});

describe('수량 소수 자릿수', () => {
  it('입력 위젯과 계산 엔진이 같은 자릿수를 쓴다', () => {
    // 두 값이 갈리면 "화면엔 4자리인데 합계는 다른 수량"이 되는데, 어느 쪽도 그 사실을 말하지 않는다.
    // (위젯은 계산 계층을 import 하지 않으려고 상수를 복제한다 — 그 복제를 여기서 못 박는다.)
    expect(QUANTITY_INPUT_DECIMALS).toBe(PORTFOLIO_QUANTITY_DECIMALS);
  });
});

describe('QuantityInput', () => {
  it('시각 라벨 없이 aria-label 로 접근명을 갖는다', () => {
    setup({ value: '12' });

    expect(field()).toHaveValue('12');
  });

  it('입력값을 정규화해서 돌려준다', () => {
    const { onChange } = setup();

    fireEvent.change(field(), { target: { value: '12.34567' } });

    // 정규화(숫자·점) → 소수 4자리 절단이 한 번에 적용된다.
    expect(onChange).toHaveBeenCalledWith('12.3456');
    expect(toQuantityInputChange('12.34567')).toBe('12.3456');
  });

  it('소수를 한 글자씩 쳐도 값이 사라지지 않는다', async () => {
    const user = userEvent.setup();
    render(createElement(StatefulHarness));

    await user.type(field(), '0.5');

    /*
     * `type="number"` 였을 때는 `"0."` 이 badInput 이라 브라우저가 빈 문자열을 넘겨
     * 소수점을 찍는 순간 값이 통째로 사라졌다(화면 `0.` / 상태 `''`). 텍스트 입력은 원문을 그대로 준다.
     */
    expect(field()).toHaveValue('0.5');
  });

  it('사유 문구를 aria-describedby 로 연결하고 blur 를 호출부에 넘긴다', () => {
    const onBlur = vi.fn();
    render(
      createElement(QuantityInput, {
        value: '',
        ariaLabel: ARIA_LABEL,
        describedById: 'row-note',
        onChange: vi.fn(),
        onBlur
      })
    );

    const input = field();
    expect(input).toHaveAttribute('aria-describedby', 'row-note');

    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('단위 표기는 값에 포함되지 않는다(장식)', () => {
    setup({ value: '3', suffix: '주' });

    // 단위가 값에 섞이면 접근명·값이 오염된다 — aria-hidden 장식이라 접근성 트리에 없다.
    expect(field()).toHaveValue('3');
    expect(screen.queryByText('주')).not.toBeNull();
  });
});

