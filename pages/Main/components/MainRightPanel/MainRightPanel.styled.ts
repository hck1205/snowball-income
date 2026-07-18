import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const ProjectionControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const ProjectionYearField = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

export const ProjectionYearSelect = styled.select`
  width: 64px;
  height: 32px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: 0 ${space[2]};
  font-size: ${font.size.xs};
  font-family: inherit;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: ${color.surface};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

export const ProjectionYearSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/** 추천 포트폴리오 카드의 제목 행 — 브랜드 톤 아이콘 배지 + 제목을 가로로 정렬한다. */
export const PortfolioPresetTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
`;

/** 프리셋 아이콘 배지의 오로라 틴트 로테이션 순서 — 카드 인덱스 % 3 으로 고른다. */
export const PRESET_ICON_TONES = ['brand', 'accent', 'accentAlt'] as const;

export type PresetIconTone = (typeof PRESET_ICON_TONES)[number];

const PRESET_ICON_TONE_STYLE: Record<PresetIconTone, { bg: string; fg: string }> = {
  brand: { bg: color.brandSubtle, fg: color.brand },
  accent: { bg: color.accentSubtle, fg: color.accentText },
  accentAlt: { bg: color.accentAltSubtle, fg: color.accentAltText }
};

/**
 * 프리셋 아이콘 배지. 기존의 이모지 대신 lucide 아이콘을 서브틀 틴트 배경 위에 얹어
 * 완성도 있는 룩을 준다. 아이콘은 `currentColor`로 그려진다.
 * 틴트는 오로라 로테이션(brand → teal → violet) — 카드마다 다른 결을 줘 훑어보기 쉽게 한다.
 */
export const PortfolioPresetIcon = styled.span<{ tone?: PresetIconTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: ${radius.sm};
  background: ${({ tone = 'brand' }) => PRESET_ICON_TONE_STYLE[tone].bg};
  color: ${({ tone = 'brand' }) => PRESET_ICON_TONE_STYLE[tone].fg};

  svg {
    width: 18px;
    height: 18px;
    display: block;
  }
`;
