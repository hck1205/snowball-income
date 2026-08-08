import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 한눈에 보기 — 차트 판.
 *
 * 🔴 `Card` 안에 `Card` 를 두지 않는다. 차트 구획은 카드가 아니라 **가라앉은 면**으로 나눈다.
 */

export const ReportBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  min-width: 0;
`;

/** 차트 두 개가 나란히 서는 줄. 좁아지면 한 줄씩으로 내려간다. */
export const ReportRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[4]};
  min-width: 0;
  align-items: start;

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ChartBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const ChartTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/** 🔴 차트마다 "이게 무슨 숫자인가"를 한 줄로 말한다 — 그림만으로는 기준이 안 보인다. */
export const ChartNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
`;

/** 차트가 그려질 자리. 🔴 높이를 고정해 레이아웃 시프트를 막는다. */
export const ChartArea = styled.div`
  width: 100%;
  height: 260px;
  min-width: 0;
`;

export const InsightList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 인사이트 한 줄.
 *
 * 🔴 조언이 아니라 **관측**이다("고정비가 62%입니다"까지). 무엇을 줄일지는 그 사람의 사정이고,
 *    우리가 정할 자리가 아니다.
 */
export const InsightItem = styled.li`
  padding: ${space[3]};
  border-radius: ${radius.sm};
  background: ${color.surface};
  border: 1px solid ${color.border};
  font-size: ${font.size.sm};
  line-height: 1.6;
  color: ${color.text};
`;

export const EmptyNote = styled.p`
  margin: 0;
  padding: ${space[5]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textMuted};
  text-align: center;
`;

/** 자산 도넛 옆의 부채 한 줄. 🔴 파이에 섞지 않는다 — 섞으면 "부채도 내 자산"으로 읽힌다. */
export const DebtNote = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;
