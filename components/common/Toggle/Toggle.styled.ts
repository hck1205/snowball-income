import styled from '@emotion/styled';
import { color, motion, radius } from '@/shared/styles';
import type { ToggleSize } from './Toggle.types';

/**
 * 진짜 스위치.
 *
 * 기존 구현의 문제: 트랙 안에 "OFF" 글자를 박아 넣고, 썸(thumb)이 회색이었다.
 * 그래서 "지금 꺼져 있다"인지 "누르면 꺼진다"인지 읽히지 않았고, 무엇보다 스위치처럼 안 보였다.
 *
 * 고친 방식(iOS/Material이 수렴한 관례):
 *  - 썸은 **항상 흰색**이고 위치로 상태를 말한다(왼쪽=꺼짐, 오른쪽=켜짐).
 *  - 상태는 **트랙 색**이 말한다(중립 회색 → 브랜드).
 *  - 트랙 안에는 **글자를 넣지 않는다**. 두 모드 중 하나를 고르는 스위치라면
 *    그 의미는 `ToggleField`의 **보이는 라벨**이 말한다(트랙에 박힌 글자는 폭도 크기도 제각각이라
 *    화면마다 스위치가 달라 보였다 — 그래서 API에서 아예 없앴다).
 */

/**
 * 크기 단계별 치수. `inset`은 `(height - thumb) / 2` 라 썸이 세로 중앙에 온다.
 * 단계 추가 기준은 `Toggle.types.ts`의 `ToggleSize` 주석에 있다.
 *
 * 치수를 24→20px 로 줄인 이유: 모바일 결과 화면의 컨트롤 줄이 가로로 모자랐다.
 * 스위치는 **크기가 아니라 트랙 색과 썸 위치**로 상태를 말하므로, 비율(track:height ≈ 1.9)만
 * 유지하면 작아져도 읽힌다. 히트 영역은 치수와 무관하게 항상 44x44다(아래 `::after`).
 */
const TOGGLE_SIZE: Record<ToggleSize, { track: number; height: number; thumb: number; inset: number }> = {
  md: { track: 38, height: 20, thumb: 14, inset: 3 }
};

/*
 * ⚠ styled로 내리는 prop 이름이 `sizeVariant`인 이유: `size`는 **유효한 HTML 어트리뷰트**라
 * @emotion/is-prop-valid를 통과해 DOM으로 새어 나간다(Select.styled.ts와 같은 처리).
 */
export const ToggleTrack = styled.span<{ checked: boolean; disabled?: boolean; sizeVariant: ToggleSize }>`
  position: relative;
  flex: 0 0 auto;
  display: inline-block;
  width: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].track}px;
  height: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].height}px;
  border-radius: ${radius.pill};
  border: 1px solid ${({ checked, disabled }) => (disabled ? color.border : checked ? color.brand : color.borderStrong)};
  background: ${({ checked, disabled }) =>
    disabled ? color.surfaceSunken : checked ? color.brand : color.surfaceSunken};
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  /* 스위치는 작다. 히트 영역만 44x44로 넓힌다(WCAG 2.5.5) — 크기 단계와 무관하게 항상. */
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

export const ToggleThumb = styled.span<{ checked: boolean; disabled?: boolean; sizeVariant: ToggleSize }>`
  position: absolute;
  top: 50%;
  left: ${({ checked, sizeVariant }) => {
    const { thumb, inset } = TOGGLE_SIZE[sizeVariant];
    return checked ? `calc(100% - ${thumb + inset}px)` : `${inset - 1}px`;
  }};
  width: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].thumb}px;
  height: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].thumb}px;
  border-radius: ${radius.pill};
  /* 썸은 정적 흰색. onBrand는 프리셋별로 어두울 수 있어(velog 다크 #121212 → 트랙과 1.07:1로 소실)
     비브랜드 트랙 위에 놓이는 썸에는 부적합하다. 켜짐은 위치와 트랙 색이 말한다. */
  background: ${({ disabled }) => (disabled ? color.surfaceMuted : '#ffffff')};
  box-shadow: 0 1px 2px rgba(15, 25, 35, 0.32);
  transform: translateY(-50%);
  pointer-events: none;
  transition: left ${motion.fast} ${motion.ease};
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
