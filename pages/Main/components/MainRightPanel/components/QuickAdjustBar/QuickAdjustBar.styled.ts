import styled from '@emotion/styled';
import { color, font, radius, shadow, space } from '@/shared/styles';

/**
 * 결과 카드 바로 아래의 **1차 조정 줄**. 드로어를 열지 않고 가장 자주 바꾸는 세 값만 만진다.
 *
 * 색 규율: 값(숫자)은 **중립 토큰만**(`color.text`). 슬라이더 트랙의 채움만 브랜드 축을 쓴다 —
 * 그건 조작 어포던스(누르는 것)이지 데이터가 아니다.
 */
export const QuickAdjustGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: ${space[3]} ${space[5]};
`;

export const QuickAdjustItem = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const QuickAdjustHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const QuickAdjustLabel = styled.label`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/**
 * 값 표시는 **시각 전용**이다 — `span` 이고 호출부가 `aria-hidden` 을 건다.
 *
 * 🔴 한때 `output` 이었다. 그 태그는 브라우저 기본 role 이 `status`(= `aria-live="polite"`)라
 * 슬라이더를 한 칸 움직일 때마다 라이브 리전이 발화한다. 값은 슬라이더 자신의 `aria-valuetext`
 * 가 이미 정확히 읽으므로, 스크린리더 사용자는 한 번의 조정에 **같은 값을 두 번씩** 듣는다
 * (키보드로 5년→20년 = 15회 이동에 30발, 마우스 드래그면 수십~수백 배).
 * 되돌리지 마라 — 가드 `QuickAdjustBar.test.tsx`.
 */
export const QuickAdjustValue = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  line-height: ${font.leading.tight};
  ${font.numeric};
`;

/** 트랙 채움은 `--quick-progress`(0~100%)로 들어온다. 스타일 규칙은 비중 슬라이더와 같은 언어. */
export const QuickAdjustSlider = styled.input`
  width: 100%;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  --quick-progress: 0%;
  background: linear-gradient(
    to right,
    ${color.brand} 0%,
    ${color.brand} var(--quick-progress),
    ${color.surfaceSunken} var(--quick-progress),
    ${color.surfaceSunken} 100%
  );
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  margin: 0;
  padding: 0;
  cursor: pointer;

  /* 활성 슬라이더만 가로 제스처를 소유한다(세로 스크롤은 브라우저에 남긴다). */
  touch-action: pan-y;

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: ${shadow.e1};
  }

  &::-moz-range-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-progress {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: ${shadow.e1};
  }
`;
