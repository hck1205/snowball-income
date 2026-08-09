import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const PageBody = styled.div`
  display: grid;
  gap: clamp(28px, 4vw, 44px);
  padding-block: ${space[6]} ${space[10]};
`;

/** 🔴 화면 성격을 규정하는 고지. 히어로 바로 아래, 어느 지표보다 먼저 읽힌다. */
export const Disclaimer = styled.p`
  margin: 0;
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textSecondary};
`;

export const AxisSection = styled.section`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const AxisHead = styled.header`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
`;

export const AxisTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const AxisNote = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/**
 * 카드 목록.
 *
 * 🔴 **한 줄에 하나씩**이다(2026-08-09 사용자 지시). 종전에는 폭에 따라 2~3열로 깔렸는데,
 *    그러면 그래프가 손톱만 해져서 축 눈금도 기준선 라벨도 넣을 자리가 없었다 — 결국 어느
 *    카드도 제대로 읽히지 않았다. 전폭을 주면 축과 기준선이 들어가고, 그것이 이 화면의
 *    핵심 정보다(설명에서 말한 숫자를 그림에서 눈으로 대조할 수 있다).
 * ⚠ 대가는 세로 길이다. 그래서 축 묶음 머리에 축 이름이 서고, 카드마다 설명은 접혀 있다.
 */
export const CardGrid = styled.div`
  display: grid;
  gap: ${space[5]};
  grid-template-columns: 1fr;
`;

export const LegendBox = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

export const LegendTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const LegendBody = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textSecondary};
`;

export const StatusBox = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: center;
  padding: ${space[10]} ${space[4]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.lg};
  text-align: center;
  color: ${color.textSecondary};
`;

/** 네 단계 범례 — 색 칩 + 이름 + 한 줄 풀이. */
export const LegendLevels = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LegendLevel = styled.li`
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const LegendChip = styled.span<{ $tone: 'accent' | 'neutral' | 'warning' | 'danger' }>`
  flex: none;
  min-width: 44px;
  padding: 2px ${space[2]};
  border: 1px solid
    ${(props) =>
      props.$tone === 'accent'
        ? color.accentBorder
        : props.$tone === 'warning'
          ? color.warning
          : props.$tone === 'danger'
            ? color.danger
            : color.border};
  border-radius: ${radius.pill};
  background: ${(props) =>
    props.$tone === 'accent'
      ? color.accentSubtle
      : props.$tone === 'warning'
        ? color.warningSurface
        : props.$tone === 'danger'
          ? color.dangerSurface
          : color.surface};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  text-align: center;
`;

/** 🔴 지우지 마라 — 이 척도가 매매 신호가 아니라는 선을 긋는 문장이다. */
export const LegendCaution = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.7;
  color: ${color.textMuted};
`;
