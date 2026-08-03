import styled from '@emotion/styled';
import { appHeaderHeight, color, font, radius, space } from '@/shared/styles';
import { METRIC_COLUMN_WIDTH } from '../constants';

/* ── 비교표 — 열 머리와 행 묶음 머리 ────────────────────────────────────────── */

/**
 * 항목 열의 머리(좌상단 모서리). 가로 스크롤 중에도 항목 이름이 남도록 **고정**된다 —
 * 4종을 비교하면 표가 반드시 넘치는데, 그때 항목 이름이 밀려 나가면 숫자만 남아 읽을 수 없다.
 */
export const HeadCorner = styled.th`
  position: sticky;
  left: 0;
  top: ${appHeaderHeight};
  /* 양축 고정이라 표에서 가장 위층이다: 모서리(3) > 열 머리(2) > 항목 열(1). */
  z-index: 3;
  width: ${METRIC_COLUMN_WIDTH};
  min-width: ${METRIC_COLUMN_WIDTH};
  padding: ${space[2]} ${space[3]} ${space[3]};
  border-bottom: 2px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.1em;
  text-align: left;
  vertical-align: bottom;
  white-space: nowrap;
`;

/**
 * 종목 열의 머리 = **그 종목의 얼굴**.
 *
 * 상단 4px 귀가 덱 슬롯의 3px 귀와 같은 색이다(같은 `assignSeries` 배정). 종전 열 머리는
 * 15px 세미볼드 검정이라 카드 제목보다도 약했다 — 비교의 주어가 화면에서 가장 조용했던 셈이다.
 */
export const HeadCell = styled.th<{ $series: string }>`
  /*
   * 🔴 **relative 가 아니라 sticky 다** — 스크롤을 내려도 지금 무엇끼리 비교 중인지가 화면에
   * 남아야 한다(사용자 요청 2026-08-03). 이 표는 행이 20줄 넘어서, 종전에는 아래로 내려가는 순간
   * 열이 익명의 숫자 기둥이 됐다. top 은 앱 헤더 높이 변수를 그대로 쓴다 — 헤더가 sticky 라
   * 상수로 적으면 헤더가 커지는 순간(모바일 2줄 등) 머리가 그 밑으로 파고든다.
   * ⚠ sticky 도 positioned 라 아래 ::before 귀의 기준은 그대로다.
   * ⚠ 배경(surface)을 지우지 마라 — 고정된 머리 밑으로 행이 비쳐 지나간다.
   */
  position: sticky;
  top: ${appHeaderHeight};
  z-index: 2;
  padding: ${space[4]} ${space[3]} ${space[3]};
  border-bottom: 2px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  text-align: right;
  vertical-align: bottom;

  /* 🔴 4px 짜리 귀에는 **균일 반경**만 준다 — 한쪽만 둥글게 적으면 브라우저가 비례 축소해
     선언과 다르게 그린다(test/shared/radiusShape.test.ts 가 원리와 실측 2건을 적어 뒀다). */
  &::before {
    content: '';
    position: absolute;
    inset: 0 ${space[2]} auto ${space[2]};
    height: 4px;
    border-radius: ${radius.pill};
    background: ${({ $series }) => $series};
  }
`;

export const HeadTicker = styled.span`
  display: block;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  white-space: nowrap;
  ${font.numeric}
`;

export const HeadName = styled.span`
  display: block;
  margin-left: auto;
  max-width: 16ch;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.tight};
  white-space: normal;
`;

/**
 * 행 묶음 머리(실측 / 참고 / 계산 가정).
 *
 * 🔴 이것이 배지를 **대체하지 않는다.** 배지는 행마다 그대로 남는다 — 묶음 머리는 블록 단위 선언이고
 * 배지는 행 단위 사실이라, 하나가 잘려 인용돼도 다른 하나가 남는다. 정직성 장치는 겹치는 편이 낫다.
 */
export const GroupHead = styled.th`
  padding: ${space[5]} ${space[3]} ${space[2]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};
  text-align: left;
  vertical-align: bottom;
`;

export const GroupTitle = styled.span`
  display: inline-block;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const GroupDesc = styled.span`
  display: block;
  margin-top: 2px;
  max-width: 60ch;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.snug};
`;
