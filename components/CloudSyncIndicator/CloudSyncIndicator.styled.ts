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

export const SpinAnim = styled.span`
  display: inline-flex;

  @media (prefers-reduced-motion: no-preference) {
    animation: cloud-sync-spin 0.9s linear infinite;
  }

  @keyframes cloud-sync-spin {
    to {
      transform: rotate(360deg);
    }
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
 * 헤더 표시의 **줄 소유권 래퍼**. 헤더 1열(`SimulatorHeader`의 LeadingSlot)은 drawer↓에서
 * `flex-wrap: wrap`이라, 이 래퍼가 `flex: 1 0 100%`를 켜면 그 자식이 **자기 줄을 통째로 차지**한다
 * (= "설정 열기" 아이콘 바로 **아래 줄**로 내려간다).
 *
 * ⚠ 켜는 기준은 "지속 상태냐"다. 충돌·저장 실패처럼 **사용자가 처리할 때까지 남는** 표시만 줄을
 * 가져가고, 4초 디바운스마다 스쳐 지나가는 '저장 중' 스피너는 같은 줄에 둔다 — 전이 상태가 줄을
 * 차지하면 저장이 돌 때마다 헤더 높이가 오르내려(레이아웃 시프트) 화면 전체가 출렁인다.
 */
export const HeaderSlot = styled.div<{ $ownLine: boolean }>`
  display: inline-flex;
  align-items: center;
  min-width: 0;

  ${media.down('drawer')} {
    ${({ $ownLine }) => ($ownLine ? 'flex: 1 0 100%;' : '')}
  }
`;

/**
 * 앱 헤더 액션 줄에 얹는 컴팩트 표시. 다른 헤더 아이콘 버튼과 높이를 맞춘다.
 * 평상시(저장 중/저장됨/오프라인)엔 아이콘만, 실패 상태에서만 라벨(HeaderText)+재시도(RetryButton)를 편다.
 *
 * drawer↓에선 자기 줄(HeaderSlot)에 놓이므로 좌측 패딩을 버리고 헤더 끝선에 맞추며,
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
