import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  cardElevation,
  color,
  font,
  radius,
  sectionTitleFontSize,
  space
} from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 카드 공통                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 카드의 **기하**만 담는다 — 배경·테두리·그림자(위계)는 `cardElevation` 이 층별로 준다.
 * (`test/shared/cardElevationHierarchy.test.ts` 가 이 블록에 border/box-shadow/background 가
 * 적히지 않는지 소스로 검사한다.)
 */
const cardGeometry = `
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(16px, 2vw, 24px);
  border-radius: ${DATA_RADIUS};
`;

/**
 * 이 화면의 **주역 카드**(화면당 하나) — hero 타일(`emphasis="hero"`)을 가진 바로 그 카드다.
 * 2열 구간에서는 레일에 서고, 한 줄로 접히면 보유·목표 아래에 그대로 이어진다.
 */
export const SummaryCard = styled.section`
  ${cardGeometry}
  ${cardElevation('raised')}
`;

export const HoldingsCard = styled.section`
  ${cardGeometry}
  ${cardElevation('base')}
  gap: ${space[3]};
`;

/**
 * 카드 머리 = **툴바**. 제목 덩어리(배지 + 제목 + 카운트)와 액션을 양 끝으로 벌리고, 아래로
 * 얇은 구분선을 그어 "여기까지가 머리"를 형태로 말한다(종전에는 제목과 표가 그냥 붙어 있었다).
 */
export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/** 구분선 없는 머리(레일 카드처럼 바로 아래에 큰 숫자가 오는 경우). */
export const CardHeadPlain = styled(CardHead)`
  padding-bottom: 0;
  border-bottom: 0;
`;

/** 제목 + 부가 배지를 한 덩어리로 묶는다(우측 액션 버튼과 갈라놓는다). */
export const CardTitleGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 섹션 제목.
 *
 * 크기는 전 페이지 공통 규칙인 `sectionTitleFontSize`(clamp 16~18px)를 쓴다 — 카드마다 다른
 * 축소 곡선을 두지 않는다는 2026-07-29 결정이다. 종전 고정 `font.size.base` 는 그 규칙 밖에 있었다.
 * 위계는 여기서 끝나지 않는다: 그 아래 값(hero 44px · D-Day 48px)과의 **크기 대비**가 위계다.
 */
export const CardTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const CardTitleBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: ${radius.md};
  background: ${color.identitySubtle};
  color: ${color.identityText};
`;

/** 제목 옆 종수 배지("3종"). 숫자라 데이터 서체 + tabular 로 쓴다. */
export const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
  ${font.numeric}
`;

/** 카드 제목 아래 한 줄(로컬 저장 고지). 제목과 경쟁하지 않게 한 단계 작고 흐리다. */
export const CardSubtitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;
