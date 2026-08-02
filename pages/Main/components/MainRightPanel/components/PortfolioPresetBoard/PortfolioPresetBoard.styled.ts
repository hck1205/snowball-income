import styled from '@emotion/styled';
import {
  color,
  font,
  iconOpticalAlign,
  media,
  motion,
  pressableSubtle,
  pressTransition,
  radius,
  shadow,
  space
} from '@/shared/styles';

/**
 * 포트폴리오 프리셋 보드 스타일.
 *
 * 구조가 바뀌었다(2026-07-31 리워크 V1): 13장을 같은 높이·같은 배경으로 한 줄씩 쌓아 두던
 * 세로 목록 → **성향 4묶음 × 그룹당 2장 + 더 보기**. 예전 카드가 갖고 있던
 * "월 투자금 제안 / 목표 투자금 / 투자 기간 / 목표 월배당" **4행 스펙표는 삭제**했다 —
 * 행마다 밑줄이 깔린 스펙 시트는 훑어보기를 돕는 게 아니라 13장을 전부 같은 모양으로 만든다.
 * 카드에 남은 숫자는 2개뿐이고, 나머지 조건은 **적용한 뒤 결과가** 말한다.
 */

/** 그룹 섹션들의 세로 스택. `data-tour` 앵커가 붙는 요소이기도 하다. */
export const PortfolioPresetGroups = styled.div`
  display: grid;
  gap: ${space[5]};
`;

export const PortfolioPresetGroupSection = styled.section`
  display: grid;
  gap: ${space[3]};
`;

/** 그룹 머리 — 톤 배지 + 이름 + 한 줄 설명. 설명은 좁은 폭에서 아랫줄로 접힌다. */
export const PortfolioPresetGroupHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const PortfolioPresetGroupTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

export const PortfolioPresetGroupHint = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/**
 * 카드 그리드. `align-items: start` 가 중요하다 — stretch 로 두면 한 행의 카드가 전부 같은
 * 높이로 늘어나 "같은 크기 카드가 페이지 구조가 되는" 그 모양으로 돌아간다.
 */
export const PortfolioPresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  align-items: start;
  gap: ${space[3]};
`;

/**
 * 프리셋 카드(버튼). hover/focus 에서 좌측 오로라 리본이 켜지고 살짝 떠오른다.
 * 카드 전체가 버튼이라 커서·포커스 링이 카드 전체에 걸린다.
 */
export const PortfolioPresetCardButton = styled.button`
  position: relative;
  display: grid;
  gap: ${space[2]};
  align-content: start;
  width: 100%;
  min-width: 0;
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

  ${pressableSubtle}
`;

export const PortfolioPresetTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
`;

export const PortfolioPresetTitle = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  letter-spacing: -0.01em;
  min-width: 0;
`;

/** 지금 화면에 적용돼 있는 프리셋 표식(프리필 포함). 중립 면 + 중립 글자 — 숫자가 아니라 상태다. */
export const PortfolioPresetAppliedTag = styled.span`
  flex: 0 0 auto;
  margin-left: auto;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: 1;
  padding: 4px ${space[2]};
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
  overflow-wrap: anywhere;
`;

/**
 * 지표 2개. **표가 아니다** — 밑줄도 테두리도 배경도 없이 라벨 위 값 두 쌍만 가로로 놓는다.
 * 숫자에는 색을 넣지 않는다(중립 `color.text` 만).
 */
export const PortfolioPresetMetrics = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[4]};
  margin: ${space[1]} 0 0;
`;

export const PortfolioPresetMetric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PortfolioPresetMetricLabel = styled.dt`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetMetricValue = styled.dd`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  line-height: ${font.leading.snug};
  ${font.numeric};
`;

/**
 * "더 보기 / 접기" — 그룹 머리 **오른쪽 끝**에 서는 조용한 버튼(장식 없음).
 * 별도 줄을 쓰지 않는 이유: 그룹이 4개라 줄 하나가 곧 화면 네 줄이 된다.
 *
 * 세로 정렬은 **같은 줄의 톤 배지와 한 몸**이다 — 둘 다 그룹 이름(`h3`, 헤딩 서체)의 잉크 중심에
 * 맞춰야 하고, 기준은 버튼 자신의 글자 크기(`xs`)가 아니라 **이름 크기**(`font.size.base`)다.
 * 배지만 보정하고 이 버튼을 빼두면 한 줄 안에서 좌우 끝이 서로 다른 높이에 앉는다
 * (실측 2026-08-01: 배지 보정 후에도 이 버튼만 **+2.13~2.23px** 낮게, 1280·390·320 전 폭).
 */
export const PortfolioPresetMoreButton = styled.button`
  margin-left: auto;
  ${iconOpticalAlign('display', font.size.base)}
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textSecondary};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 6px ${space[3]};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;

export const PortfolioPresetFallbackText = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  ${media.down('mobileWide')} {
    font-size: ${font.size.xs};
  }
`;

/**
 * 그룹 배지·카드 아이콘의 톤. 그룹마다 하나씩 배정되고(`PORTFOLIO_PRESET_GROUPS.tone`),
 * **면 위에 글리프**만 얹는다(채움 위 텍스트 금지 규칙 준수). 값은 전부 검증된 토큰 쌍이라
 * `color-mix` 파생 면처럼 대비 테스트의 사각지대가 생기지 않는다.
 */
export const PRESET_TONE_STYLE = {
  identity: { bg: color.identitySubtle, fg: color.identityText },
  accent: { bg: color.accentSubtle, fg: color.accentText },
  accentAlt: { bg: color.accentAltSubtle, fg: color.accentAltText },
  neutral: { bg: color.surfaceSunken, fg: color.textSecondary }
} as const;

export type PresetTone = keyof typeof PRESET_TONE_STYLE;

/**
 * 그룹 머리의 톤 배지(24px) — 카드 배지보다 한 단계 작다.
 *
 * 바로 오른쪽에 서는 그룹 이름은 `h3` = **헤딩 서체**(`font.display`)라 잉크 중심이 라인박스
 * 중심보다 위에 있다. `align-items: center` 만으로는 배지가 이름보다 낮게 앉는다(실측 2026-08-01,
 * 1280·1024·768·390·320 전 폭에서 **+2.13~2.23px**). 정본 유틸로 이름 크기(`font.size.base`)
 * 기준 보정을 건다 — 배지 자신의 em 으로 계산하면 안 된다.
 */
export const PortfolioPresetGroupBadge = styled.span<{ tone: PresetTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${iconOpticalAlign('display', font.size.base)}
  width: 24px;
  height: 24px;
  border-radius: ${radius.sm};
  background: ${({ tone }) => PRESET_TONE_STYLE[tone].bg};
  color: ${({ tone }) => PRESET_TONE_STYLE[tone].fg};

  svg {
    width: 14px;
    height: 14px;
    display: block;
  }
`;

/** 카드 아이콘 배지 — 그룹 톤을 그대로 물려받아 "이 카드가 어느 묶음인지"를 색으로도 말한다. */
export const PortfolioPresetIcon = styled.span<{ tone: PresetTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: ${radius.sm};
  background: ${({ tone }) => PRESET_TONE_STYLE[tone].bg};
  color: ${({ tone }) => PRESET_TONE_STYLE[tone].fg};

  svg {
    width: 18px;
    height: 18px;
    display: block;
  }
`;
