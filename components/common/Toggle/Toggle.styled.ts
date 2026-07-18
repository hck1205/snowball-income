import styled from '@emotion/styled';
import { color, font, motion, radius } from '@/shared/styles';

/**
 * 진짜 스위치.
 *
 * 기존 구현의 문제: 트랙 안에 "OFF" 글자를 박아 넣고, 썸(thumb)이 회색이었다.
 * 그래서 "지금 꺼져 있다"인지 "누르면 꺼진다"인지 읽히지 않았고, 무엇보다 스위치처럼 안 보였다.
 *
 * 고친 방식(iOS/Material이 수렴한 관례):
 *  - 썸은 **항상 흰색**이고 위치로 상태를 말한다(왼쪽=꺼짐, 오른쪽=켜짐).
 *  - 상태는 **트랙 색**이 말한다(중립 회색 → 브랜드).
 *  - 텍스트는 기본적으로 없다. 모드 선택 스위치(간략/상세)일 때만 넣는다.
 */

const TRACK_HEIGHT = 24;
const THUMB = 18;
const INSET = 3;

export const ToggleTrack = styled.span<{ checked: boolean; disabled?: boolean; controlWidth?: string }>`
  position: relative;
  flex: 0 0 auto;
  display: inline-block;
  width: ${({ controlWidth }) => controlWidth ?? '44px'};
  height: ${TRACK_HEIGHT}px;
  border-radius: ${radius.pill};
  border: 1px solid ${({ checked, disabled }) => (disabled ? color.border : checked ? color.brand : color.borderStrong)};
  background: ${({ checked, disabled }) =>
    disabled ? color.surfaceSunken : checked ? color.brand : color.surfaceSunken};
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  /* 스위치는 작다. 히트 영역만 44x44로 넓힌다(WCAG 2.5.5). */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 44px;
    height: 44px;
    width: 100%;
    transform: translate(-50%, -50%);
  }
`;

export const ToggleThumb = styled.span<{ checked: boolean; disabled?: boolean }>`
  position: absolute;
  top: 50%;
  left: ${({ checked }) => (checked ? `calc(100% - ${THUMB + INSET}px)` : `${INSET - 1}px`)};
  width: ${THUMB}px;
  height: ${THUMB}px;
  border-radius: ${radius.pill};
  /* 썸은 정적 흰색. onBrand는 프리셋별로 어두울 수 있어(velog 다크 #121212 → 트랙과 1.07:1로 소실)
     비브랜드 트랙 위에 놓이는 썸에는 부적합하다. 켜짐은 위치와 트랙 색이 말한다. */
  background: ${({ disabled }) => (disabled ? color.surfaceMuted : '#ffffff')};
  box-shadow: 0 1px 2px rgba(15, 25, 35, 0.32);
  transform: translateY(-50%);
  pointer-events: none;
  transition: left ${motion.fast} ${motion.ease};
`;

/** 모드 스위치(간략/상세)의 트랙 내부 텍스트. 썸 반대편에 붙는다. */
export const ToggleStateText = styled.span<{ checked: boolean; disabled?: boolean; stateTextColor?: string }>`
  position: absolute;
  top: 50%;
  left: ${({ checked }) => (checked ? '8px' : 'auto')};
  right: ${({ checked }) => (checked ? 'auto' : '8px')};
  transform: translateY(-50%);
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  line-height: 1;
  letter-spacing: 0.02em;
  color: ${({ checked, disabled, stateTextColor }) =>
    stateTextColor ?? (disabled ? color.textMuted : checked ? color.onBrand : color.textSecondary)};
  user-select: none;
  pointer-events: none;
`;

/**
 * 트랙과 정확히 같은 박스를 차지하는 투명 체크박스.
 *
 * `opacity: 0`을 쓰지 않는 이유: opacity가 0이면 포커스 아웃라인까지 투명해져서
 * 키보드 포커스 링이 사실상 사라진다. `appearance: none` + 투명 배경이면
 * 요소는 안 보이면서 전역 `:focus-visible` 링은 트랙 위에 정확히 그려진다.
 * (`:has()`는 jsdom(nwsapi)이 파싱하지 못해 테스트가 깨지므로 쓰지 않는다.)
 */
export const HiddenCheckbox = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  border-radius: ${radius.pill};
  cursor: inherit;
  z-index: 1;

  &:disabled {
    cursor: not-allowed;
  }
`;
