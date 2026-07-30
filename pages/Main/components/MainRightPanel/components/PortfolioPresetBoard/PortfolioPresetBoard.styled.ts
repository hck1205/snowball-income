import styled from '@emotion/styled';
import { color, font, media, motion, pressableSubtle, pressTransition, radius, shadow, space } from '@/shared/styles';

/**
 * 포트폴리오 프리셋 카드 스타일. `pages/Main/Main.shared.styled.ts`(카드 조각)와
 * 구 `MainRightPanel.styled.ts`(아이콘 배지 — 결과 배치가 `MainResultGrid`로 옮겨가며 삭제됐다)에서
 * 이관했다 (스타일 값 동일, 마크업/동작 변화 없음).
 */

export const PortfolioPresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

/**
 * 프리셋 카드(빈 상태의 온보딩).
 *
 * 빈 상태는 이 앱의 **첫인상**이다. 예전엔 회색 테두리 상자가 세 개 있을 뿐이라
 * "고를 수 있는 것"으로 보이지 않았다. 고친 것:
 *  - 좌측 브랜드 액센트 바가 hover 시 나타난다 → 선택 가능한 카드임을 말한다
 *  - hover 시 살짝 떠오른다(그림자 + 1px) → 누를 수 있는 물건
 *  - 카드 전체가 버튼이므로 커서/포커스 링이 카드 전체에 걸린다
 */
export const PortfolioPresetCardButton = styled.button`
  position: relative;
  display: grid;
  gap: ${space[2]};
  width: 100%;
  text-align: left;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[4]};
  padding-left: ${space[5]};
  color: ${color.text};
  font-family: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease}, background-color ${motion.fast} ${motion.ease},
    ${pressTransition};

  /* 좌측 액센트 바 — 평소엔 투명, hover/focus 시 오로라 리본(표시용). */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    opacity: 0;
    transition: opacity ${motion.fast} ${motion.ease};
  }

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
    box-shadow: ${shadow.e2};
  }

  /* 들어올림은 진짜 포인터에서만 — 터치는 탭 뒤 :hover 가 남아 카드가 들린 채로 굳는다. */
  @media (hover: hover) and (pointer: fine) {
    &:hover,
    &:focus-visible {
      transform: translateY(-1px);
    }
  }

  &:hover::before,
  &:focus-visible::before {
    background: ${color.gradientAurora};
    opacity: 1;
  }

  /*
   * 누름은 "제자리로 되돌리기"가 아니라 **축소**여야 한다 — 되돌리기는 피드백을 주는 게 아니라
   * 피드백을 **없애는** 것처럼 읽힌다. 게다가 터치에는 hover 자체가 없어서 종전 구현은
   * 모바일에서 아무 반응도 없었다. 전체 폭 카드라 약한 배율(0.99)을 쓴다 — 큰 면에 0.96 을
   * 주면 화면이 출렁인다.
   */
  ${pressableSubtle}
`;

export const PortfolioPresetContentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: ${space[4]};
  align-items: start;

  ${media.down('tabletSm')} {
    grid-template-columns: 1fr;
  }
`;

export const PortfolioPresetMain = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const PortfolioPresetTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

export const PortfolioPresetDesc = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetCore = styled.span`
  font-size: ${font.size.xs};
  color: ${color.brandText};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetMeta = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetPlan = styled.div`
  display: grid;
  gap: ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  padding: ${space[3]};
`;

export const PortfolioPresetPlanItem = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  display: flex;
  justify-content: space-between;
  gap: ${space[2]};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    ${font.numeric};
  }
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
 * 틴트는 오로라 로테이션(brand → teal → green) — 카드마다 다른 결을 줘 훑어보기 쉽게 한다.
 * ⚠ forest·velog 처럼 brand 자체가 그린/틸인 프리셋에서는 세 톤이 같은 색 계열로 보일 수 있다
 * (실측 ΔE(accent, accent-alt) velog 22.1 / forest 44.9 — 구분은 되지만 결은 비슷하다).
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
