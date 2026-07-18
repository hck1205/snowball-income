import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { CloudSyncTone } from './CloudSyncIndicator.utils';

const toneColor = (tone: CloudSyncTone): string => {
  switch (tone) {
    case 'success':
      return color.success;
    case 'progress':
      return color.brandText;
    case 'danger':
      return color.danger;
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
 * 앱 헤더 액션 줄에 얹는 컴팩트 표시. 다른 헤더 아이콘 버튼과 높이를 맞춘다.
 * 평상시(저장 중/저장됨/오프라인)엔 아이콘만, 실패 상태에서만 라벨(HeaderText)+재시도(RetryButton)를 편다.
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
`;

export const HeaderText = styled.span`
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;
