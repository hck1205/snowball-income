import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * §4.8 저장하지 못한 기록.
 *
 * ## 2026-08-03 재설계
 * 예전에는 한 건이 **가로 flex 한 줄**(라벨 · 요약 · 사유 · 버튼)이었다. 사유 문장이 길어지면
 * 네 조각이 제각각 줄바꿈해 어디까지가 한 건인지 읽히지 않았고, `dangerSurface` 면이 건마다
 * 하나씩 늘어 화면의 색면 예산을 건수만큼 먹었다.
 *
 * 지금은 **글리프 / 본문 / 액션 3열 격자**이고 본문 안에서 라벨 → 요약 → 사유가 세로로 선다.
 * 면색은 걷어내고 **1px danger 테두리 + ⚠ 글리프**만 남겼다 — 회색조에서도 읽히고,
 * 실패가 열 건이어도 색면은 0개다.
 */

export const FailureItems = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
`;

/**
 * 실패 1건. 🔴 **색이 아니라 "저장 실패" 텍스트와 글리프가 1차 채널**이고 왼쪽 레일은 보조다.
 * 개별 항목에는 `role` 을 주지 않는다 — 10건 실패에서 10번 끼어든다(낭독은 위 요약 배너 1회).
 */
export const FailureItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]} ${space[3]};
  padding: ${space[3]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  svg {
    color: ${color.danger};
  }

  ${media.down('mobileWide')} {
    grid-template-columns: auto minmax(0, 1fr);

    button {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
`;

/** 한 건의 본문. 세 줄이 한 덩어리로 붙어 있어야 "이건 한 건"이 읽힌다. */
export const FailureBody = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const FailureLabel = styled.span`
  color: ${color.danger};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
`;

/** 무엇이 실패했는지 — 날짜·분류·금액. 🔴 금액에 색은 없다. */
export const FailureSummary = styled.span`
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  overflow-wrap: anywhere;
`;

/** 🔴 사유 본문은 중립색이다 — 읽기 위한 글이다. */
export const FailureReason = styled.span`
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const RetryAllRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  margin-top: ${space[4]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
`;

/** 🔴 무음 비활성 금지 — "모두 다시 시도"가 잠기면 언제나 사유가 함께 있다. */
export const RetryAllHint = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;
