import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { RangeSliderProps } from './RangeSlider.types';
import {
  FieldShell,
  Fill,
  Header,
  InputsRow,
  Label,
  NumberInput,
  Prefix,
  RangeSep,
  Root,
  Suffix,
  Thumb,
  Track,
  TrackArea,
  ValueReadout
} from './RangeSlider.styled';

const clamp = (value: number, low: number, high: number): number => Math.min(Math.max(value, low), high);

type ThumbKey = 'min' | 'max';

/**
 * 듀얼 썸(min/max) 범위 슬라이더 + 짝지은 숫자 입력.
 *
 * - 각 썸은 role="slider" + Arrow/Home/End/PageUp/PageDown 키보드 조작을 지원한다.
 * - 두 썸은 교차하지 못한다(하단 썸 ≤ 상단 썸, 상단 썸 ≥ 하단 썸으로 클램프).
 * - 숫자 입력은 편집 중 슬라이더가 텍스트를 덮어쓰지 않도록 포커스 가드를 둔다.
 */
export default function RangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  label,
  unit,
  formatValue
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // 드래그 중 window 리스너 클로저가 낡은 값을 보지 않도록 최신 props 를 ref 로 노출.
  const latest = useRef({ valueMin, valueMax, onChange });
  latest.current = { valueMin, valueMax, onChange };
  // 진행 중인 드래그의 리스너 해제 함수. 드래그 도중 언마운트되면 pointerup 이 안 와도 정리한다.
  const teardownDragRef = useRef<(() => void) | null>(null);
  useEffect(() => () => teardownDragRef.current?.(), []);

  const span = max - min || 1;

  const snap = (value: number): number => {
    const snapped = min + Math.round((value - min) / step) * step;
    return Number(clamp(snapped, min, max).toFixed(6));
  };

  const commit = (which: ThumbKey, next: number): void => {
    const { valueMin: low, valueMax: high, onChange: emit } = latest.current;
    if (which === 'min') emit(clamp(next, min, high), high);
    else emit(low, clamp(next, low, max));
  };

  const valueFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return min;
    const rect = el.getBoundingClientRect();
    // 트랙 좌우 9px 패딩(썸 반경)을 뺀 유효 폭 기준으로 비율 계산.
    const usable = rect.width - 18;
    const ratio = clamp((clientX - rect.left - 9) / (usable || 1), 0, 1);
    return snap(min + ratio * span);
  };

  const startDrag =
    (which: ThumbKey) =>
    (event: ReactPointerEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      // 이전 드래그가 남아 있으면(비정상 종료) 먼저 정리.
      teardownDragRef.current?.();
      commit(which, valueFromClientX(event.clientX));
      const onMove = (moveEvent: PointerEvent) => commit(which, valueFromClientX(moveEvent.clientX));
      const teardown = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', teardown);
        teardownDragRef.current = null;
      };
      teardownDragRef.current = teardown;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', teardown);
    };

  const onThumbKeyDown =
    (which: ThumbKey) =>
    (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
      const current = which === 'min' ? valueMin : valueMax;
      let next = current;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          next = current - step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          next = current + step;
          break;
        case 'PageDown':
          next = current - step * 10;
          break;
        case 'PageUp':
          next = current + step * 10;
          break;
        case 'Home':
          next = which === 'min' ? min : valueMin;
          break;
        case 'End':
          next = which === 'min' ? valueMax : max;
          break;
        default:
          return;
      }
      event.preventDefault();
      commit(which, snap(next));
    };

  const ratioMin = clamp((valueMin - min) / span, 0, 1);
  const ratioMax = clamp((valueMax - min) / span, 0, 1);

  const format = (value: number): string => {
    if (formatValue) return formatValue(value);
    if (unit === '$') return `$${value}`;
    return `${value}${unit ?? ''}`;
  };

  // ---- 숫자 입력(포커스 가드 양방향 동기) ----
  const [minText, setMinText] = useState(String(valueMin));
  const [maxText, setMaxText] = useState(String(valueMax));
  const minFocused = useRef(false);
  const maxFocused = useRef(false);

  useEffect(() => {
    if (!minFocused.current) setMinText(String(valueMin));
  }, [valueMin]);
  useEffect(() => {
    if (!maxFocused.current) setMaxText(String(valueMax));
  }, [valueMax]);

  const handleText = (which: ThumbKey, raw: string): void => {
    if (which === 'min') setMinText(raw);
    else setMaxText(raw);
    if (raw.trim() === '') return; // 빈 입력은 커밋하지 않고 방어(다음 blur 에 정규화).
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    commit(which, snap(parsed));
  };

  const numberProps = { min, max, step, type: 'number' as const, inputMode: 'decimal' as const };

  return (
    <Root>
      <Header>
        <Label>{label}</Label>
        <ValueReadout aria-hidden="true">
          {format(valueMin)} ~ {format(valueMax)}
        </ValueReadout>
      </Header>

      <TrackArea ref={trackRef}>
        <Track />
        <Fill ratioLeft={ratioMin} ratioRight={ratioMax} />
        <Thumb
          type="button"
          ratio={ratioMin}
          upper={valueMin >= valueMax}
          role="slider"
          tabIndex={0}
          aria-label={`${label} 최소값`}
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-valuenow={valueMin}
          aria-valuetext={format(valueMin)}
          onPointerDown={startDrag('min')}
          onKeyDown={onThumbKeyDown('min')}
        />
        <Thumb
          type="button"
          ratio={ratioMax}
          upper
          role="slider"
          tabIndex={0}
          aria-label={`${label} 최대값`}
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={format(valueMax)}
          onPointerDown={startDrag('max')}
          onKeyDown={onThumbKeyDown('max')}
        />
      </TrackArea>

      <InputsRow>
        <FieldShell>
          {unit === '$' ? <Prefix aria-hidden="true">$</Prefix> : null}
          <NumberInput
            {...numberProps}
            value={minText}
            aria-label={`${label} 최소값 입력`}
            onFocus={() => {
              minFocused.current = true;
            }}
            onBlur={() => {
              minFocused.current = false;
              setMinText(String(valueMin));
            }}
            onChange={(event) => handleText('min', event.target.value)}
          />
          {unit === '%' ? <Suffix aria-hidden="true">%</Suffix> : null}
        </FieldShell>
        <RangeSep aria-hidden="true">~</RangeSep>
        <FieldShell>
          {unit === '$' ? <Prefix aria-hidden="true">$</Prefix> : null}
          <NumberInput
            {...numberProps}
            value={maxText}
            aria-label={`${label} 최대값 입력`}
            onFocus={() => {
              maxFocused.current = true;
            }}
            onBlur={() => {
              maxFocused.current = false;
              setMaxText(String(valueMax));
            }}
            onChange={(event) => handleText('max', event.target.value)}
          />
          {unit === '%' ? <Suffix aria-hidden="true">%</Suffix> : null}
        </FieldShell>
      </InputsRow>
    </Root>
  );
}
