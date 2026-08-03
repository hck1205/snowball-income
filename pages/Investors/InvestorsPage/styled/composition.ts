import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { PICK, color, font, nestedRadius, radius, space } from '@/shared/styles';

/* ── 구성 스택바 + 범례 (도넛을 대체한 자리) ───────────────────────────────── */
/* 이 조각들이 앉는 인물 카드 자체는 `personCard.ts` 에 있다. */

/**
 * 🔴 **도넛을 스택바로 바꾼 이유** — 정보가 아니라 형태의 문제다.
 *
 * 104px 도넛 + 세로 범례는 카드 폭의 3분의 1을 차지하면서 카드 높이를 220px 밀어 올렸다.
 * 그래서 3열 격자가 불가능했고, 열세 장이 일곱 줄로 늘어져 **모든 카드가 똑같아 보였다.**
 * 전폭 스택바는 같은 값(상위 N종 + 그 밖)을 폭으로 말하고 높이를 6px 만 쓴다 — 카드가 낮아지고,
 * 나란히 선 세 장의 띠를 **가로로 비교**할 수 있게 된다(도넛 세 개는 비교가 안 된다).
 *
 * 🔴 정보는 하나도 줄지 않았다: 종목명과 퍼센트는 아래 범례가 그대로 글자로 말하고,
 *    풋·콜 배지도 범례에 그대로 선다. 띠는 그걸 거들 뿐이라 `aria-hidden` 이다.
 */
export const Composition = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[3]};
  padding: ${space[3]};
  border-radius: ${nestedRadius(radius.md)};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

/**
 * 스택바. 🔴 높이 6px 은 협상 대상이 아니다 — 8px 이 되는 순간 큰 조각(버리의 팔란티어 66%)이
 * 폭 180px 을 넘어 **면으로 세어진다**. 조각마다 색이 달라 클러스터로 접히지도 않는다.
 */
export const CompositionTrack = styled.div`
  display: flex;
  gap: 1px;
  height: ${PICK.railHeight};
  border-radius: ${radius.pill};
  background: ${color.surface};
  overflow: hidden;
`;

export const CompositionSegment = styled.span<{ $percent: number; $color: string }>`
  flex: 0 0 auto;
  width: ${({ $percent }) => `${Math.max(0.6, $percent)}%`};
  background: ${({ $color }) => $color};
`;

/**
 * 범례 — **2열**. 세로 한 줄이면 7항목이 카드 높이를 지배한다.
 * 🔴 색이 유일한 채널이 아니다: 이름과 퍼센트를 글자가 말하고 점은 띠와 이어 주기만 한다.
 */
export const CompositionLegend = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
  gap: 2px ${space[3]};
  margin: 0;
  padding: 0;
  min-width: 0;
  list-style: none;
`;

export const CompositionLegendItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

export const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${radius.xs};
  background: ${({ $color }) => $color};
`;

export const LegendName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LegendValue = styled.span`
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/** 비중을 몰라 띠를 못 그릴 때. 🔴 빈 띠를 그리지 않는다 — 0% 로 읽힌다. */
export const CompositionNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 🔴 **포지션 종류 배지(풋·콜) — 이 화면의 정정 장치.**
 *
 * 풋은 보유가 아니라 하락 베팅이다. 배지가 없으면 버리의 팔란티어 66% 가 "최대 보유 종목"으로
 * 읽힌다(실제로는 정반대). 장식이 아니라 **틀린 읽기를 막는 최소 장치**다.
 *
 * 🔴 색이 유일한 채널이 아니다 — 안의 글자("풋"·"콜")가 정보를 진다.
 * ⚠ 손익색을 쓰지 않는다. 풋이 "손실"이 아니고 콜이 "이익"도 아니다 — 둘 다 포지션의 종류다.
 * ⚠ 두 색 쌍 모두 contrast.test.ts 가 이미 검증하는 것만 쓴다.
 */
export const KindBadge = styled.span<{ $kind: 'put' | 'call' }>`
  /*
   * 🔴 이 배지는 카드 범례와 보유 표(드로어) 양쪽에 선다. 카드 안쪽은 PickCard 의 스트레치 컨트롤
   * 의사요소가 덮고 있어, 한 단 올리지 않으면 범례에서 title 설명에 마우스가 닿지 않는다.
   */
  position: relative;
  z-index: 1;
  display: inline-block;
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border-radius: ${radius.xs};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;

  ${({ $kind }) =>
    $kind === 'put'
      ? `
  border: 1px solid ${color.warning};
  background: ${color.warningSurface};
  color: ${color.warning};`
      : `
  border: 1px dashed ${color.accentAltText};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};`}
`;

/**
 * 비교 화면으로 넘기는 링크.
 * ⚠ 공용 `Button` 에 `as={Link}` 를 쓸 수 없다 — 버튼처럼 보이되 실제로는 링크라서
 *   새 탭 열기·주소 복사가 그대로 된다(버튼으로 만들면 그 둘을 잃는다).
 */
export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    background: ${color.brandSubtle};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
