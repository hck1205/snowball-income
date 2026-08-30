import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';
import type { LandingGoalKind } from '@/shared/constants/landingGoals';

/* --------------------------------------------------------------------------
 * 첫 화면(/)의 **목표 여섯** — 이 지면의 전부다.
 *
 * 🔴 성패 기준은 하나다: **여섯 칸이 전부 접힘 위에 있는가.** 390×664(iOS Safari 의 100svh 최소)에서
 * 헤더 56 + 제목 + 리드 + 두 묶음(라벨 + 3칸)이 그 예산 안이어야 한다. 카드에 줄을 더하거나
 * 위쪽에 배지·리본을 넣기 전에 **그 폭에서 재라** — 하나만 들어와도 배당 세 칸이 아래로 내려가고,
 * 그러면 "배당 계산기"가 첫 화면에서 배당을 못 보여 주는 상태가 된다.
 *
 * 🔴 **3열을 유지한다**(좁은 폭 포함). 1열로 떨어뜨리면 여섯 칸이 세로로 늘어서 접힘 예산이 즉시
 * 깨진다. 한 줄에 셋이라 라벨은 짧아야 하고(1억 만들기·월 50만원), 그 제약이 카드 문구가
 * 길어지는 것을 막아 준다 — 데이터 파일의 "숫자를 늘리지 마라"와 같은 계약이다.
 *
 * ## 색을 쓴다 — 다만 **묶음 단위로만** (2026-08-27 사용자 지시)
 * 처음엔 전부 중립 면에 테두리만 두었다가 "너무 허접하다"는 지적을 받았다. 그래서 색을 넣되
 * 규율을 정했다: **틴트는 묶음이 소유하고 카드 여섯 장은 그 안에서 균일하다.**
 *  · 자산 → accent(틸) — 토큰 정의상 **성장·복리**의 축이다.
 *  · 배당 → accentAlt(그린) — 토큰 정의상 **목표·현금흐름**의 축이다.
 * 🔴 카드마다 다른 색을 주지 마라. 여섯 색이 서면 위계가 아니라 소음이고, **어느 목표를 권하는
 *   것처럼** 보인다(투자 권유 금지). 자산 셋과 배당 셋의 시각 무게는 서로 같아야 한다 — 그래야
 *   어느 쪽이 실제로 눌리는지 읽을 수 있다(goal_selected 가 재려는 값이다).
 *
 * ⚠ 진입 애니메이션 금지 — 랜딩 모션 0 규율을 이 화면도 그대로 잇는다. 호버·누름만 기존 토큰 안에서.
 * -------------------------------------------------------------------------- */

/** 묶음의 색 축. 🔴 카드가 아니라 **묶음**이 고른다(위 머리말). */
type Toned = { tone: LandingGoalKind };

const toneRamp = (tone: LandingGoalKind) =>
  tone === 'asset'
    ? { fill: color.accent, text: color.accentText, subtle: color.accentSubtle, border: color.accentBorder }
    : {
        fill: color.accentAlt,
        text: color.accentAltText,
        subtle: color.accentAltSubtle,
        border: color.accentAltBorder
      };

/**
 * 🔴 **폭을 가둔다**(2026-08-27 실측). 넓은 화면에서 여섯 칸이 전폭으로 늘어나자 카드 한 장이
 * 390px 짜리 빈 사각형이 되고 내용은 가운데 손톱만큼 남았다 — 카드가 커진 게 아니라 **여백이**
 * 커진 것이라, 정확히 "허접해 보인다"는 상태다. 폭을 묶고 내용을 키우는 편이 둘 다 해결한다.
 * ⚠ 좁은 폭에서는 가두지 않는다(가둘 폭이 애초에 없다).
 */
export const PickerRoot = styled.div`
  display: grid;
  gap: ${space[4]};
  margin-top: ${space[5]};

  ${media.up('tablet')} {
    width: 100%;
    max-width: 1040px;
    margin-inline: auto;
    gap: ${space[5]};
  }
`;

export const GoalGroup = styled.section`
  display: grid;
  gap: ${space[2]};
`;

/**
 * 묶음 머리. 라벨과 힌트가 **한 줄**에 앉는다 — 두 줄이 되면 접힘 예산을 먹는다.
 * 라벨 앞의 색 막대가 이 묶음의 축을 말한다(글자에 색을 칠하지 않는 이유: 대비를 잃는다).
 */
export const GroupHead = styled.h2<Toned>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  &::before {
    content: '';
    align-self: center;
    width: 3px;
    height: 0.95em;
    border-radius: ${radius.pill};
    background: ${({ tone }) => toneRamp(tone).fill};
  }
`;

export const GroupHint = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  color: ${color.textMuted};
`;

/** 🔴 세 칸 고정. 위 머리말의 접힘 예산이 이 값에 걸려 있다. */
export const GoalGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    gap: ${space[3]};
  }
`;

export const GoalItem = styled.li`
  min-width: 0;
`;

/**
 * 카드. 틴트 면 + 같은 축의 1px 경계다.
 * ⚠ 호버에서 **위로 뜬다**(2px). 크기·색이 아니라 높이로 반응해야 여섯 장의 무게가 유지된다.
 */
export const GoalCard = styled(Link)<Toned>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${space[1]};
  height: 100%;
  padding: ${space[3]} ${space[2]};
  border: 1px solid ${({ tone }) => toneRamp(tone).border};
  border-radius: ${radius.md};
  background: ${({ tone }) => toneRamp(tone).subtle};
  color: ${color.text};
  text-align: center;
  text-decoration: none;
  transition: transform ${motion.ease}, box-shadow ${motion.ease}, border-color ${motion.ease};

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ tone }) => toneRamp(tone).fill};
    box-shadow: ${shadow.e2};
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  ${media.up('mobileWide')} {
    padding: ${space[4]} ${space[3]};
    gap: ${space[2]};
    border-radius: ${radius.lg};
  }

  /* 넓은 폭에서는 **내용이 자란다.** 여백만 자라면 카드가 빈 사각형이 된다(PickerRoot 주석). */
  ${media.up('tablet')} {
    padding: ${space[6]} ${space[4]};
    gap: ${space[3]};
  }
`;

/**
 * 아이콘 배지.
 *
 * 🔴 **축 색을 채움으로 쓰지 않는다.** 채움 위 글리프는 프리셋 16종 × 라이트/다크에서 대비를
 * 일일이 보증해야 하는데, 그 보증이 있는 조합은 panel/brand 뿐이다(토큰 주석). 여기서는
 * 반대로 뒤집었다 — 카드가 이미 틴트 면이므로 배지를 **떠 있는 중립 면**으로 두고 글리프에만
 * 축 색(text 램프, 본문 대비가 보증된 값)을 준다. 대비가 안전하고 카드에 깊이도 생긴다.
 */
export const GoalBadge = styled.span<Toned>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ tone }) => toneRamp(tone).border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${({ tone }) => toneRamp(tone).text};

  /* 글리프가 배지와 **함께 자란다.** 크기를 TSX 의 size prop 으로 주면 폭마다 다르게 줄 수 없다. */
  & > svg {
    width: 55%;
    height: 55%;
  }

  ${media.up('mobileWide')} {
    width: 38px;
    height: 38px;
  }

  ${media.up('tablet')} {
    width: 48px;
    height: 48px;
  }
`;

/** 목표 그 자체. 카드에서 **가장 큰 글자**다 — 훑는 눈이 여기서 멈춘다. */
export const GoalLabel = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  line-height: 1.25;
  word-break: keep-all;

  ${media.up('mobileWide')} {
    font-size: ${font.size.lg};
  }

  ${media.up('tablet')} {
    font-size: ${font.size['2xl']};
  }
`;

/** 라벨과 답 사이의 실선. 카드가 "이름"과 "답" 두 칸임을 눈으로 말한다. */
export const GoalRule = styled.span<Toned>`
  width: 20px;
  height: 2px;
  border-radius: ${radius.pill};
  /* ⚠ border 램프는 이 크기에서 보이지 않는다(1280 실측). 축 색 자체를 쓰되 길이를 짧게 둔다. */
  background: ${({ tone }) => toneRamp(tone).fill};
  opacity: 0.5;

  ${media.up('tablet')} {
    width: 28px;
  }
`;

export const GoalPreviewBlock = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
`;

/** 조건절. 답보다 반드시 작고 흐리다 — 같은 무게면 숫자가 문장에 묻힌다. */
export const GoalPreviewLead = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  word-break: keep-all;

  ${media.up('tablet')} {
    font-size: ${font.size.sm};
  }
`;

/** 답. 🔴 **이 화면의 후킹**이라 카드에서 두 번째로 크고, 색은 그 묶음의 축이다. */
export const GoalPreviewValue = styled.span<Toned>`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${({ tone }) => toneRamp(tone).text};
  word-break: keep-all;

  ${media.up('mobileWide')} {
    font-size: ${font.size.lg};
  }

  /* 🔴 넓은 폭에서 **라벨과 같은 급**이 된다. 이 화면의 후킹이 그 숫자이기 때문이다. */
  ${media.up('tablet')} {
    font-size: ${font.size['2xl']};
  }
`;

/** 목표의 뜻("첫 목돈"·"생활비의 절반"). 셋 중 가장 약하다. */
export const GoalCaption = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  word-break: keep-all;

  ${media.up('tablet')} {
    font-size: ${font.size.sm};
  }
`;

/* --------------------------------------------------------------------------
 * 🔴 가정 공개 — **접거나 숨기지 마라.** 위 카드의 숫자가 전부 여기서 나온다.
 * 근거를 함께 적지 않은 숫자는 투자 권유로 읽힌다(전 표면 공통 규율).
 *
 * ⚠ 한 문장으로 흘려 두었더니 "하나도 안 읽힌다"는 지적을 받았다(2026-08-27). 그래서 카드로
 *   세우고 값 셋을 **각각 칩**으로 끊었다 — 셋이 서로 다른 가정임이 형태로 보여야 읽힌다.
 * -------------------------------------------------------------------------- */

export const AssumptionCard = styled.aside`
  justify-self: center;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const AssumptionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const AssumptionChips = styled.ul`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const AssumptionChip = styled.li`
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-size: ${font.size['2xs']};
  color: ${color.textSecondary};
  white-space: nowrap;

  /* 값만 진하게 — 이름("연 수익률")과 값("7%")이 같은 무게면 칩이 읽히지 않는다. */
  & > b {
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }
`;
