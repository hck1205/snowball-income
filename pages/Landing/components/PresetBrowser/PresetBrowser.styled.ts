import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  cardElevation,
  color,
  font,
  iconOpticalAlign,
  media,
  motion,
  pressTransition,
  pressable,
  radius,
  space
} from '@/shared/styles';
import type { PresetGroupTone } from './PresetBrowser.types';

/**
 * S6 "사람들이 많이 쓰는 구성" — 4묶음 × 카드.
 *
 * 🔴 **카드는 링크가 아니다.** 프리셋 딥링크(카드 클릭 → 시뮬레이터 프리필)는 새 프리필 계약과
 * 하이드레이션 순서 검증이 필요한 별건이라, v1 은 섹션 끝 CTA 하나로 시뮬레이터에 보낸다.
 * 빈 포트폴리오로 도착하면 시뮬레이터가 자기 온보딩 프리셋 보드를 그대로 띄운다 — 착지가 정확하다.
 */

/** 그룹 배지 톤. 시뮬레이터 프리셋 보드와 같은 매핑이다(새로 만들 것이 없다). */
const TONE = {
  identity: { bg: color.identitySubtle, fg: color.identityText },
  accent: { bg: color.accentSubtle, fg: color.accentText },
  accentAlt: { bg: color.accentAltSubtle, fg: color.accentAltText },
  neutral: { bg: color.surfaceSunken, fg: color.textSecondary }
} as const satisfies Record<PresetGroupTone, { bg: string; fg: string }>;

/**
 * 묶음 머리 아래 1px 룰의 색. 색이 유일한 신호가 아니다 - 같은 줄에 묶음 이름(인컴·성장·균형·특화)과
 * 배지 아이콘이 함께 선다. '특화'는 톤이 neutral 이라 회색 선을 갖는데, 톤 자체는
 * shared/constants/portfolioPresets 소유이고 시뮬레이터 보드와 공유하므로 여기서 바꾸지 않는다.
 */
const RULE = {
  identity: color.identity,
  accent: color.accent,
  accentAlt: color.accentAlt,
  neutral: color.borderStrong
} as const satisfies Record<PresetGroupTone, string>;

/**
 * 묶음 **사이**의 간격. before 는 28px 이었고 카드 사이(20px)와의 비율이 1.4배뿐이라 네 묶음이
 * "카드 8장 한 덩어리"로 읽혔다(피치 191·192·191px 로 균일). 41px 로 벌리고 묶음 머리를 자기
 * 격자에 붙이면(GroupSection gap 8px) 비율이 **5.1배**가 된다 - 근접성이 컨테이너를 대신한다.
 */
export const BrowserRoot = styled.div`
  display: grid;
  gap: clamp(28px, 3.2vw, 44px);
  min-width: 0;
`;

export const GroupSection = styled.section`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const GroupHead = styled.div<{ $tone: PresetGroupTone }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
  padding-bottom: ${space[2]};
  border-bottom: 1px solid ${({ $tone }) => RULE[$tone]};
`;

export const GroupBadge = styled.span<{ $tone: PresetGroupTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${radius.sm};
  background: ${({ $tone }) => TONE[$tone].bg};
  color: ${({ $tone }) => TONE[$tone].fg};
  /* 오른쪽 그룹 이름이 헤딩 서체라 잉크 중심 보정을 받는다(이름 크기 기준). */
  ${iconOpticalAlign('display', font.size.base)}

  svg {
    display: block;
    width: 14px;
    height: 14px;
  }
`;

export const GroupTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const GroupHint = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

/** 디스클로저 트리거. 펼침에 높이 애니메이션을 걸지 않는다 — 랜딩은 즉시 표시다. */
export const MoreButton = styled.button`
  flex: 0 0 auto;
  padding: ${space[1]} ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-family: inherit;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  cursor: pointer;
  /* 🔴 pressTransition 을 자기 목록에 끼운다 — 누름 믹스인은 transition 을 선언하지 않는다
     (선언하면 단축 속성이라 소비처의 색 전환을 통째로 덮는다). */
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, ${pressTransition};
  ${pressable}

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;

/**
 * 묶음 안 카드 격자.
 *
 * 🔴 **열 수는 데이터가 정한다 — 3열로 두지 마라**(2026-08-01 교정). 묶음마다 처음 펼치는 카드는
 * `PORTFOLIO_PRESET_VISIBLE_PER_GROUP`(2)장인데 3열이면 **네 묶음 전부** 오른쪽 한 칸이 비었고
 * (실측 @1280: income·growth·balanced·special 4/4 그룹 emptyInLastRow=1), 특화 묶음은 숨은 카드가
 * 0이라 "더 보기"조차 없어 그 빈 칸이 **영구**였다. 첫인상 지면에서 구멍 뚫린 격자 4줄은
 * "미완성"으로 읽힌다.
 *
 * 2열로 내리면 초기 상태가 네 묶음 모두 꽉 찬다(2장 = 정확히 한 줄). 펼친 상태도 4장(성장·균형)이
 * 두 줄로 딱 떨어지고, 3장(인컴)만 마지막 줄에 한 칸이 남는다 — 사용자가 **직접 누른 뒤**의
 * 상태이고 그 줄 위에 이미 두 장이 차 있어 "빠진 카드"로 읽히지 않는다.
 *
 * ⚠ 시뮬레이터 보드의 초기 노출 2장은 다른 화면의 확정 동작이라 건드리지 않는다 — 여기서 고치는
 * 것은 **열 수**뿐이다(같은 데이터를 다른 열 수로 그린다).
 * ⚠ `auto-fit`(빈 트랙 접기)은 쓰지 않았다: "더 보기"를 누를 때마다 카드 폭이 510→333px 로
 * 뛰어(3열 복귀) 펼침이 리플로 점프로 보인다. 열 수가 고정이면 그 점프가 없다.
 */
export const PresetGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 2vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const PresetCard = styled.li`
  display: grid;
  gap: ${space[2]};
  align-content: start;
  min-width: 0;
  padding: clamp(14px, 2vw, 20px);
  border-radius: ${radius.lg};
  ${cardElevation('base')}
`;

export const PresetTitle = styled.h4`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  word-break: keep-all;
`;

export const PresetHook = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

/**
 * 🔴 **비중 막대의 폭 상한 — 장식 취향이 아니라 계약이다. 값을 올리지 마라.**
 *
 * `tintscan` 은 «폭 ≥180px **그리고** 높이 ≥8px» 인 유채 요소를 "틴트 면"으로 세고, 랜딩의 면 예산은
 * 2개(히어로 그라디언트 · S7 시작 준비 카드)로 확정돼 있다. 이 막대는 높이가 **정확히 8px** 이라
 * **폭만 넘으면** 세 번째 면이 된다. 실제로 2026-08-01 프리셋 격자가 3열→2열이 되며 카드가
 * 333→510px 로 넓어지자 `SCHD 40%` 조각이 117→**187px** 가 되어 `/ @1280` 이 3면으로 실패했다.
 *
 * 상한을 **조각이 아니라 막대(컨테이너)** 에 거는 이유: 조각은 컨테이너 밖으로 나갈 수 없으므로
 * 어떤 비중·어떤 뷰포트·어떤 열 수에서도 180px 을 넘지 못한다(기하로 끊긴다). 조각 쪽에 걸면
 * "최대 비중이 40%" 라는 **데이터 가정**에 의존하게 되고, 프리셋이 50% 를 갖는 순간 되터진다.
 *
 * 176 인 이유: 임계(180) 아래로 확실히 두면서, 3열 시절 카드에서 색이 차지하던 비율
 * (117/333 ≈ 35%)을 2열 카드에서 재현한다(176/510 ≈ 35%).
 */
const ALLOCATION_BAR_MAX_WIDTH = '176px';

/**
 * 비중 누적 막대 — **장식이다**(aria-hidden).
 * 🔴 이 위에 텍스트를 얹지 마라: 시리즈 색은 8프리셋 x 라이트/다크 16조합에서 명암이 갈린다.
 * 정보는 바로 아래 비중 텍스트가 전부 말한다.
 */
export const AllocationBar = styled.span`
  display: flex;
  overflow: hidden;
  width: 100%;
  max-width: ${ALLOCATION_BAR_MAX_WIDTH};
  height: 8px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
`;

export const AllocationSegment = styled.span<{ $weight: number; $color: string }>`
  flex: ${({ $weight }) => `${$weight} 0 0`};
  background: ${({ $color }) => $color};
`;

export const AllocationText = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const BrowserCtaLine = styled.p`
  margin: 0;
`;

export const BrowserCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background: ${color.surface};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  text-decoration: none;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    ${pressTransition};
  ${pressable}

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
  }
`;
