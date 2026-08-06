import styled from '@emotion/styled';
import { color, font, media, radius, shadow, space } from '@/shared/styles';

/**
 * 결과 카드 바로 아래의 **1차 조정 줄**. 드로어를 열지 않고 가장 자주 바꾸는 세 값만 만진다.
 *
 * 🔴 **카드가 아니다**(2026-08-03 2차 리워크). 예전에는 공용 `Card` 를 써서 제목·부제·20px 패딩·
 * 24~28px 라운드를 전부 갖고 있었고, 그래서 "최종 자산 가치"를 말하는 요약 카드와 **같은 무게**로
 * 화면에 섰다. 이건 데이터가 아니라 **조작 장치**다 — 읽는 것과 만지는 것이 같은 껍데기를 쓰면
 * 화면에 위계가 생기지 않는다. 지금은:
 *
 *  - 라운드 16px(카드 24~28px 보다 한 단계 아래) · 패딩 얇게 → 카드 조(組)에서 빠진다.
 *  - 제목이 **왼쪽 이름표 칸**으로 옮겨가 세로 공간을 먹지 않는다(카드 헤더 = 28px + 16px 여백).
 *  - 결과 이미지 저장에서는 통째로 제외된다(`data-capture-exclude`) — 그림 속에서 누를 수 없는
 *    슬라이더는 미끼다. 전 폭(12칸)이라 캡처에서 빠져도 격자에 구멍이 아니라 **행 하나**가 사라진다.
 *
 * 색 규율: 값(숫자)은 **중립 토큰만**(`color.text`). 슬라이더 트랙의 채움만 브랜드 축을 쓴다 —
 * 그건 조작 어포던스(누르는 것)이지 데이터가 아니다.
 */
export const QuickAdjustRail = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 200px) minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]} clamp(${space[4]}, 2.4vw, ${space[8]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  padding: clamp(${space[3]}, 1.4vw, ${space[4]}) clamp(${space[4]}, 1.8vw, ${space[5]});
  min-width: 0;

  /* 좁은 폭에서는 이름표가 위, 슬라이더가 아래. 이름표 칸을 억지로 남기면 슬라이더가 눌린다. */
  ${media.down('drawer')} {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
`;

export const QuickAdjustLegend = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

/**
 * 이름표. 카드 제목(16~18px 헤딩 서체)이 아니라 **라벨**(12px 본문 서체 · 자간 확장)이다 —
 * 이 줄이 카드 조에서 빠졌다는 것을 글자 크기 하나로 말한다.
 */
export const QuickAdjustEyebrow = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
  line-height: ${font.leading.snug};
  color: ${color.text};
`;

export const QuickAdjustNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

export const QuickAdjustGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: ${space[3]} ${space[5]};
  min-width: 0;
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
