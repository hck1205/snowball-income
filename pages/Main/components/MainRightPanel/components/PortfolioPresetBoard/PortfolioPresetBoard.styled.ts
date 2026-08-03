import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, media, motion, PICK, radius, space } from '@/shared/styles';

/**
 * 포트폴리오 프리셋 보드 스타일.
 *
 * 구조가 바뀌었다(2026-07-31 리워크 V1): 13장을 같은 높이·같은 배경으로 한 줄씩 쌓아 두던
 * 세로 목록 → **성향 4묶음 × 그룹당 2장 + 더 보기**. 예전 카드가 갖고 있던
 * "월 투자금 제안 / 목표 투자금 / 투자 기간 / 목표 월배당" **4행 스펙표는 삭제**했다 —
 * 행마다 밑줄이 깔린 스펙 시트는 훑어보기를 돕는 게 아니라 13장을 전부 같은 모양으로 만든다.
 * 카드에 남은 숫자는 2개뿐이고, 나머지 조건은 **적용한 뒤 결과가** 말한다.
 */

/* -------------------------------------------------------------------------- */
/* 온보딩 머리 — 이 앱의 첫인상                                                   */
/* -------------------------------------------------------------------------- */

/**
 * 첫 진입(결과 0개)에서만 서는 머리. 2026-08-03 2차 리워크로 생겼다.
 *
 * 그전의 빈 상태는 `Card` 의 제목 한 줄 + 부제 한 줄이 전부였다 — 즉 **첫 화면의 위계가
 * 카드 제목 크기(16~18px)에서 끝났다.** 이 앱을 처음 여는 사람이 보는 유일한 화면인데
 * "무엇을 하는 곳인지"를 말할 자리가 없었다.
 *
 * 지금은 마스코트 · 큰 제목 · 리드 · **3단계 설명**이 선다. 마스코트(`BrandGlyph`)가 합법인
 * 이유는 여기가 brand 면(고르는 면)이기 때문이다 — data 면(표·차트)에는 두지 않는다.
 */
export const PortfolioPresetIntro = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  column-gap: clamp(${space[3]}, 1.6vw, ${space[5]});
  row-gap: ${space[4]};
  margin-bottom: clamp(${space[5]}, 2.4vw, ${space[8]});

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 마스코트 자리. 면이 아니라 **글리프**다 — 배경을 깔면 워시 카드 위에 색면이 하나 더 생겨
 * 한 화면 틴트 예산을 먹는다. 색은 페이지 얼굴색(identity)을 그대로 받는다.
 */
export const PortfolioPresetIntroGlyph = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${color.identityText};

  /* 크기는 호출부의 size prop 이 정한다(브랜드 마크 계단 96) — 여기서 다시 적으면 계단 감사가
     보는 값과 화면의 값이 갈린다. 좁은 폭에서 카드 폭을 넘지 않게 상한만 건다. */
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }
`;

export const PortfolioPresetIntroCopy = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const PortfolioPresetIntroEyebrow = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.12em;
  line-height: ${font.leading.snug};
  color: ${color.identityText};
`;

/**
 * 첫 화면의 제목. 카드 제목(16~18px)과 **명확히 다른 조**여야 한다 — 여기가 이 화면의 주역이다.
 * `0.9rem + 1.5vw` → 355px 이하 20px(`2xl`), 780px 이상 26px 근처에서 상한 30px(`4xl`) 로 포화.
 * `vw` 단독을 피하고 `rem` 을 섞는 이유는 히어로 제목과 같다(WCAG 1.4.4 확대 대응).
 */
export const PortfolioPresetIntroTitle = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, calc(0.9rem + 1.5vw), ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const PortfolioPresetIntroLede = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

/**
 * 3단계 설명. 순서가 있는 절차라 `ol` 이다 — 목록 표식은 지우고 **번호 배지**로 대신한다.
 * 좁은 폭에서는 세로로 쌓인다(가로 3칸을 억지로 유지하면 한 칸이 한 글자 폭이 된다).
 */
export const PortfolioPresetSteps = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[3]};
  margin: ${space[2]} 0 0;
  padding: 0;
  list-style: none;
  counter-reset: sb-preset-step;

  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

/**
 * 한 단계. 번호는 `::before` 카운터라 마크업이 숫자를 갖지 않는다(낭독은 `ol` 순서가 이미 한다).
 * 배지는 **테두리 원**이다 — 채우면 그것만으로 색면 셋이 새로 생긴다.
 */
export const PortfolioPresetStep = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[2]};
  counter-increment: sb-preset-step;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;

  &::before {
    content: counter(sb-preset-step);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1px solid ${color.identityBorder};
    border-radius: ${radius.pill};
    font-family: ${font.dataNumeric};
    ${font.numeric};
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.bold};
    color: ${color.identityText};
  }
`;

/** 그룹 섹션들의 세로 스택. `data-tour` 앵커가 붙는 요소이기도 하다. */
export const PortfolioPresetGroups = styled.div`
  display: grid;
  gap: ${space[5]};
`;

/**
 * 묶음 목록 위의 작은 구분 라벨 — "여기부터가 고르는 자리"를 한 줄로 말한다.
 * 머리(제목·3단계)와 카드 격자 사이에 아무 표식이 없으면 두 덩어리가 한 문단으로 붙어 읽힌다.
 */
export const PortfolioPresetGroupsLead = styled.p`
  margin: 0 0 ${space[4]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.1em;
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
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
  /* 🔴 간격은 PICK.gap 이다(clamp 12~16px) — 고르는 카드의 hover 부상 그림자(e2)는 blur 12px 라
     그보다 좁으면 그림자가 이웃 카드를 침범한다. 값을 손으로 적지 마라(shared/styles/tokens.ts 소유). */
  gap: ${PICK.gap};
`;

/**
 * 카드 **본문**의 세로 스택 — 훅 · coreType · 지표 2개.
 *
 * 🔴 카드 껍데기(면·라운드·6px 레일 캡·40px 글리프 배지·제목 크기·hover 부상·스트레치 버튼)는
 * 이제 공용 `components/common/PickCard` 가 소유한다. 여기서 다시 그리지 마라 — 같은 모양의
 * "고르는 카드"를 각자 복제해 온 것이 그 부품이 생긴 이유다(랜딩 PresetBrowser 가 같은 길을 갔다).
 * 구 `PortfolioPresetCardButton`(테두리 + 좌측 3px 오로라 리본 + 누름 믹스인)은 그래서 사라졌다.
 */
export const PortfolioPresetFacts = styled.div`
  display: grid;
  gap: ${space[2]};
  align-content: start;
  min-width: 0;
`;

/**
 * 지금 화면에 적용돼 있는 프리셋 표식(프리필 포함). 중립 면 + 중립 글자 — 숫자가 아니라 상태다.
 *
 * `inline-flex` 인 이유: 이 태그는 `PickCard` 의 `titleRight` 슬롯(블록 컨테이너) 안에 산다.
 * 기본 `inline` 으로 두면 세로 패딩이 라인박스를 늘리지 못해 태그가 슬롯 위로 2px 삐져나온다
 * (실측 2026-08-03: 태그 22px / 슬롯 24px, 위쪽만 2px 어긋남). 구 배치의 잔재였던
 * `flex: 0 0 auto` · `margin-left: auto` 는 지웠다 — 지금 부모는 flex 컨테이너가 아니라
 * 두 선언 모두 아무 일도 하지 않았다(정렬은 `PickCardHead` 의 space-between 이 이미 한다).
 */
export const PortfolioPresetAppliedTag = styled.span`
  display: inline-flex;
  align-items: center;
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

/*
 * 구 `PortfolioPresetIcon`(카드 안 30px 톤 배지)은 없다 — 그 역할을 `PickCard` 의 캡 글리프
 * 배지(40px)가 맡고, 색은 톤이 아니라 **캡 축**(PortfolioPresetBoard.utils.ts 의 PRESET_CAP_AXIS)이
 * 정한다. 두 곳이 같은 색을 각자 계산하면 언젠가 갈린다.
 */
