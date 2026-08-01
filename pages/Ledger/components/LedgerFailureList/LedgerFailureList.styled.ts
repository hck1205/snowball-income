import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

export const FailureItems = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
`;

/**
 * 실패 1건. 🔴 **색이 아니라 "저장 실패" 텍스트가 1차 채널**이고 왼쪽 레일·면색은 보조다.
 * 개별 항목에는 `role` 을 주지 않는다 — 10건 실패에서 10번 끼어든다(낭독은 위 요약 배너 1회).
 */
export const FailureItem = styled.li`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  padding: ${space[2]} ${space[3]};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  background: ${color.dangerSurface};
  min-width: 0;

  ${media.down('mobileWide')} {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const FailureLabel = styled.span`
  color: ${color.danger};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

/** 무엇이 실패했는지 — 날짜·분류·금액. 🔴 금액에 색은 없다. */
export const FailureSummary = styled.span`
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  overflow-wrap: anywhere;
`;

/** 🔴 사유 본문은 중립색이다 — 읽기 위한 글이다. */
export const FailureReason = styled.span`
  min-width: 0;
  flex: 1 1 20ch;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const RetryAllRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  margin-top: ${space[3]};
`;

/** 🔴 무음 비활성 금지 — "모두 다시 시도"가 잠기면 언제나 사유가 함께 있다. */
export const RetryAllHint = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;
