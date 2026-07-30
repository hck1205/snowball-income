import styled from '@emotion/styled';
import { color, hitAreaWithin, motion, radius, shadow, space } from '@/shared/styles';
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
 * 유지하면 작아져도 읽힌다.
 *
 * 히트 영역은 가로 44px · **세로 44px 이 아니다**(아래 `::before` 의 `hitAreaWithin`).
 * 세로를 44 로 두면 32px 라벨 줄을 넘어 이웃 행을 덮어 오탭이 났다 — 44 는 상한이 아니라
 * 희망값으로 다루고 이웃과 겹치지 않는 선까지만 뻗는다. 상세는 `shared/styles/surfaces.ts`.
 */
const TOGGLE_SIZE: Record<ToggleSize, { track: number; height: number; thumb: number; inset: number }> = {
  md: { track: 38, height: 20, thumb: 14, inset: 3 }
};

/** 트랙 테두리 두께. 썸 이동 거리 계산이 이 값에 의존하므로 상수로 묶는다(아래 ToggleThumb 참고). */
const TRACK_BORDER = 1;

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
  border: ${TRACK_BORDER}px solid ${({ checked, disabled }) => (disabled ? color.border : checked ? color.brand : color.borderStrong)};
  background: ${({ checked, disabled }) =>
    disabled ? color.surfaceSunken : checked ? color.brand : color.surfaceSunken};
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  /*
   * 스위치는 작다(38×20). 히트 영역만 넓힌다(WCAG 2.5.5) — 크기 단계와 무관하게 항상.
   *
   * 2026-07-30 까지 손코딩 44×44 였다. 세로 44px 은 이 스위치가 앉는 32px 라벨 줄
   * ('ToggleField' 의 'ToggleLabel')을 위아래로 6px 씩 넘겨 **이웃 폼 행을 덮었다.**
   * 헬퍼가 이웃 간격(줄 사이 'gap: space[3]')까지만 넓힌다 → 가로는 44px 확보, 세로는 32px.
   */
  ${hitAreaWithin(space[3])}
`;

export const ToggleThumb = styled.span<{ checked: boolean; disabled?: boolean; sizeVariant: ToggleSize }>`
  position: absolute;
  top: 50%;
  /*
   * 위치는 고정하고 **이동만** 애니메이션한다.
   *
   * 2026-07-30 까지 'left' 를 전환했다. 'left' 는 레이아웃 속성이라 프레임마다
   * 레이아웃 → 페인트 → 합성을 전부 다시 돈다. 이 앱에서 가장 많이 눌리는 컨트롤인데
   * 가장 비싼 방식으로 움직이고 있었다. 'translate' 는 합성 단계만 탄다.
   *
   * ⚠ 'transform: translateY(-50%)' 와 합치지 않고 **독립 'translate' 속성**을 쓴다 —
   * 그래야 세로 중앙 정렬(transform)과 가로 이동(translate)이 서로를 덮지 않는다.
   */
  left: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].inset - 1}px;
  translate: ${({ checked, sizeVariant }) => {
    if (!checked) return '0';
    const { track, thumb, inset } = TOGGLE_SIZE[sizeVariant];
    /*
     * 종전 켜짐 위치는 'left: calc(100% - (thumb + inset))' 이었다. 전역 'box-sizing: border-box'
     * 라 트랙 'width' 에 테두리가 포함되고, 절대배치 '100%' 는 **패딩 박스**(= track − 테두리 2px)를
     * 기준으로 푼다. 그 최종 위치를 그대로 재현한다:
     *   (track − 2) − (thumb + inset) − (꺼짐 위치 inset − 1)
     * ⚠ 'translate' 의 % 는 'left' 와 달리 **자기 크기** 기준이라 calc(100% − …) 로는 못 옮긴다.
     */
    return `${track - TRACK_BORDER * 2 - (thumb + inset) - (inset - 1)}px`;
  }};
  width: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].thumb}px;
  height: ${({ sizeVariant }) => TOGGLE_SIZE[sizeVariant].thumb}px;
  border-radius: ${radius.pill};
  /* 썸은 정적 흰색. onBrand는 프리셋별로 어두울 수 있어(velog 다크 #121212 → 트랙과 1.07:1로 소실)
     비브랜드 트랙 위에 놓이는 썸에는 부적합하다. 켜짐은 위치와 트랙 색이 말한다. */
  background: ${({ disabled }) => (disabled ? color.surfaceMuted : '#ffffff')};
  /*
   * 깊이는 토큰으로만 말한다(DESIGN.md §6). 종전 생 리터럴 '0 1px 2px rgba(15,25,35,0.32)' 는
   * **다크에서 어두운 면 위에 어두운 그림자**라 사실상 보이지 않았다 — 'shadow.e1' 은 프리셋마다
   * 라이트/다크 값을 따로 갖는다(다크는 검정 0.3~0.4, 라이트는 6~8%).
   * ⚠ 썸의 **채움**은 여전히 정적 '#ffffff' 다(위 주석) — 토큰화 대상은 그림자뿐이다.
   */
  box-shadow: ${shadow.e1};
  transform: translateY(-50%);
  pointer-events: none;
  transition: translate ${motion.fast} ${motion.ease};
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
