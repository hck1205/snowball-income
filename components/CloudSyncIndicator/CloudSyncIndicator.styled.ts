import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';
import type { CloudSyncTone } from './CloudSyncIndicator.utils';

const toneColor = (tone: CloudSyncTone): string => {
  switch (tone) {
    case 'success':
      return color.success;
    case 'progress':
      return color.brandText;
    case 'danger':
      return color.danger;
    case 'warning':
      return color.warning;
    case 'muted':
      return color.textMuted;
    case 'neutral':
    default:
      return color.textSecondary;
  }
};

/** 버튼 모서리 배지 — 아이콘 형태가 상태를 나른다(색은 보조). 라벨은 시각적 숨김으로 병기. */
export const BadgeRoot = styled.span<{ tone: CloudSyncTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${({ tone }) => toneColor(tone)};

  svg {
    width: 13px;
    height: 13px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/**
 * '저장 중' 아이콘의 회전.
 *
 * 🔴 이 자리는 **모션이 유일한 시각 채널**이다 — 헤더 변형의 저장 중 상태는 라벨을 `SrOnly` 로
 * 감추고(위 `HeaderRoot` 주석: 전이 상태는 아이콘만) 배지 변형은 아예 16px 아이콘 하나다.
 * 그래서 reduced-motion 에서 회전이 죽으면 남는 것은 **멈춘 새로고침 아이콘 한 개**뿐이고,
 * 그건 "저장 중"이 아니라 "누를 수 있는 새로고침 버튼"으로 읽힌다.
 *
 * 그런데 구 코드는 회전을 `no-preference` 안에만 두어 reduced-motion 에서 **아무 것도 남기지
 * 않았다.** 전역 리셋(`globalStyles.ts`)이 `animation-duration`·`animation-iteration-count` 를
 * `!important` 로 죽이므로 여기 바깥에 옮겨 적어도 결과는 같다 — 되찾으려면 그 두 속성을
 * **`!important` 로 회수**해야 한다(`MainContentLoader.styled.ts` 가 확립한 패턴).
 *
 * 되찾되 **회전이 아니라 불투명도 펄스**로 바꾼다(선례 `Button.styled.ts` 의 `isStatic` 경로):
 * 움직임이 없어 전정계에 안전하면서 "아직 일하는 중"이라는 단서는 남는다.
 * 라벨을 펴는 대안은 쓸 수 없다 — 4초 디바운스마다 도는 '저장 중'이 폭을 차지하면 헤더가
 * 주기적으로 출렁인다(2026-07-29 확정 결정, 위 `HeaderSlot` 주석).
 */
export const SpinAnim = styled.span`
  display: inline-flex;
  animation: cloud-sync-spin 0.9s linear infinite;

  @keyframes cloud-sync-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes cloud-sync-busy-pulse {
    50% {
      opacity: 0.35;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation-name: cloud-sync-busy-pulse;
    animation-timing-function: ${motion.ease};
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
  }
`;

/** 패널 헤더 문장 줄. */
export const InlineRoot = styled.p<{ tone: CloudSyncTone }>`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0 0 ${space[3]};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};

  svg {
    flex: none;
    width: 16px;
    height: 16px;
    stroke: ${({ tone }) => toneColor(tone)};
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const InlineText = styled.span`
  flex: 1;
`;

export const RetryButton = styled.button`
  flex: none;
  border: 1px solid ${color.dangerBorder};
  background: ${color.dangerSurface};
  color: ${color.danger};
  border-radius: ${radius.sm};
  min-height: 32px;
  padding: 0 ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: filter ${motion.fast} ${motion.ease};

  &:hover {
    filter: brightness(0.97);
  }
`;

export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * 헤더 표시의 래퍼 — **워드마크 바로 오른쪽, 같은 줄**에 머문다(2026-07-29 사용자 결정).
 *
 * 🔴 구 `$ownLine`(drawer↓에서 `flex: 1 0 100%` 로 자기 줄을 차지하던 규칙)은 **삭제됐다.**
 * 그 규칙은 헤더 1열이 브랜드 + "설정 열기" 버튼 + 상태 칩 셋을 다투던 시절의 대처였는데,
 * 설정 버튼이 헤더에서 빠지며(→ 히어로 sticky 도크) 320px 에서도 폭 예산이 남는다.
 * 되살리지 마라 — 상태에 따라 헤더 높이가 달라지면 헤더 높이를 CSS 변수로 받아 쓰는
 * sticky 요소들(목차 바·설정 도크)이 상태 변화마다 함께 튄다.
 *
 * ⚠ 그래도 **지속 상태와 전이 상태의 차이는 유지**한다: 저장 중(전이)은 아이콘만 스치듯 뜨고,
 * 저장 실패·동기화 보류(지속)만 라벨과 액션을 편다. 4초 디바운스마다 도는 '저장 중'이 폭을
 * 차지하면 헤더가 주기적으로 출렁인다.
 */
export const HeaderSlot = styled.div`
  display: inline-flex;
  align-items: center;
  min-width: 0;
`;

/**
 * 앱 헤더 컨트롤 줄에 얹는 컴팩트 표시. 다른 헤더 아이콘 버튼과 높이를 맞춘다.
 * 평상시(저장 중/저장됨/오프라인)엔 아이콘만, 실패 상태에서만 라벨(HeaderText)+재시도(RetryButton)를 편다.
 *
 * drawer↓에선 좌측 패딩을 버려 워드마크와의 간격을 슬롯 gap 하나로 정리하고,
 * 라벨+재시도 버튼이 한 줄에 안 들어가면 접히게 둔다(잘림 방지).
 */
export const HeaderRoot = styled.div<{ tone: CloudSyncTone }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  min-height: 32px;
  padding: 0 ${space[1]};
  margin: 0;
  color: ${({ tone }) => toneColor(tone)};
  font-size: ${font.size.xs};

  svg {
    flex: none;
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  ${media.down('drawer')} {
    padding: 0;
    flex-wrap: wrap;
    row-gap: ${space[1]};
    max-width: 100%;
  }
`;

export const HeaderText = styled.span`
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  /* 최후 방어선 — 줄바꿈까지 실패해도 글자가 헤더 밖으로 삐져나가지 않고 말줄임된다. */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 라벨 뒤에 붙는 **보조 설명**(예: "— 확인 필요"). 좁은 화면에선 핵심 라벨만 남기고 감춘다 —
 * 상태 이름 자체는 HeaderText가 계속 말하고, 접근명(aria-label)은 폭과 무관하게 그대로다.
 */
export const HeaderTextDetail = styled.span`
  font-weight: ${font.weight.medium};
  white-space: nowrap;

  ${media.down('drawer')} {
    display: none;
  }
`;

/**
 * 충돌(동기화 보류) 상태의 헤더 표시 — **클릭 가능한 버튼**이라 화해 모달을 다시 연다(이연 후 재개봉 경로).
 * 저장 중/실패의 정적 표시와 달리 이건 사용자가 눌러 결정을 이어가야 하므로 버튼으로 만든다.
 *
 * 시각 높이는 32px·xs 글자로 **작게** 유지하되(헤더를 지배하면 안 된다), `::before` 의사요소로
 * 터치 히트 영역만 44×44로 넓힌다 — 보이는 크기와 누를 수 있는 크기를 분리하는 표준 수법이다.
 * 포커스 링은 전역 `:focus-visible`이 그리므로 여기서 `outline: none`을 하지 않는다.
 */
export const HeaderConflictButton = styled.button<{ tone: CloudSyncTone }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  min-height: 32px;
  max-width: 100%;
  padding: 0 ${space[2]};
  margin: 0;
  border: 1px solid ${color.warningSurface};
  border-radius: ${radius.sm};
  background: ${color.warningSurface};
  color: ${({ tone }) => toneColor(tone)};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  cursor: pointer;
  transition: filter ${motion.fast} ${motion.ease};

  /* 터치 히트 영역만 44×44로 확장(시각 크기는 그대로). */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 44px;
    min-height: 44px;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  &:hover {
    filter: brightness(0.97);
  }

  svg {
    flex: none;
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
