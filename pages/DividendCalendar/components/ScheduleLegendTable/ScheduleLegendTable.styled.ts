import styled from '@emotion/styled';
import { color, font, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/** 브랜드 틴트 래퍼(DetailCard) 위에 놓이는 밝은 패널 — 아젠다·미정과 같은 표면 규칙. */
export const LegendDetails = styled.details`
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceRaised};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const LegendSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform ${motion.fast} ${motion.ease};
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 좁은 폭에서는 표 자체가 가로 스크롤한다(칸을 줄여 숫자를 겹치게 만들지 않는다). */
export const LegendScroll = styled.div`
  margin-top: ${space[3]};
  overflow-x: auto;
  ${subtleScrollbar}
`;

export const LegendTable = styled.table`
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: ${font.size.xs};
  ${font.numeric}

  th,
  td {
    padding: ${space[1]} ${space[1]};
    text-align: center;
    color: ${color.textSecondary};
    font-weight: ${font.weight.regular};
  }

  thead th {
    color: ${color.textMuted};
    font-weight: ${font.weight.medium};
    border-bottom: 1px solid ${color.border};
  }

  tbody tr + tr td,
  tbody tr + tr th {
    border-top: 1px solid ${color.border};
  }
`;

export const LegendTickerCell = styled.th`
  text-align: left;
  white-space: nowrap;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  padding-right: ${space[3]};
`;

export const LegendTickerLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/**
 * 티커 열 고정폭(아젠다·미정과 같은 6ch 규격) — 글자 수가 달라도 실측/추정 배지가 같은 선에서
 * 시작한다. 표를 세로로 훑을 때 배지가 좌우로 흔들리면 비교가 안 된다.
 */
export const LegendTickerText = styled.span`
  flex: 0 0 6ch;
  ${font.numeric}
`;

/** 지급 달 점. 미지급도 자리를 지켜 줄마다 12칸이 유지된다(세로 스캔이 가능해진다). */
export const ScheduleDot = styled.span<{ $paying: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $paying }) => ($paying ? color.brand : color.border)};
`;
