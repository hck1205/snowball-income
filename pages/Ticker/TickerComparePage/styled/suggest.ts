import styled from '@emotion/styled';
import { color, font, radius, sectionTitleFontSize, space } from '@/shared/styles';

/* ── 예시 조합 격자 ────────────────────────────────────────────────────────── */

export const SuggestSection = styled.section`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SectionHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]} ${space[3]};
  min-width: 0;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const SectionHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/** 카드 안 커버리지 배지. 조합을 고르는 실제 근거라 제목 오른쪽에 앉힌다. */
export const CoverBadge = styled.span`
  display: inline-block;
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const MiniPreview = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 12칸 미니 트랙. 높이 6px 이라 선이다 — 카드가 열 장이어도 면 예산에 걸리지 않는다. */
export const MiniTrack = styled.span`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2px;
  min-width: 0;
`;

/**
 * 한 달 한 칸.
 *
 * 🔴 **안 주는 달의 칸이 보여야 이 트랙이 트랙이다.** 이 미리보기가 답하는 질문은 "몇 달이
 * 비었나"인데, 빈 칸이 안 보이면 색칠된 칸만 떠 있는 점선이 되어 셀 수가 없다.
 * 종전 `surfaceMuted` 는 흰 카드 면 위에서 1.02~1.08:1 이라(vivid 1.02 · grape 1.03 · sunset 1.04)
 * 절반의 프리셋에서 칸이 통째로 사라졌다 — 실측 스크린샷에서 눈으로도 그랬다.
 * `surfaceSunken` 은 1.11~1.22:1 로 8프리셋 전부에서 칸이 남는다(면 판정 하한 8px 밑의 6px 이라
 * 예산과는 무관하고, 중립 토큰이라 tintscan 이 애초에 세지도 않는다).
 */
export const MiniCell = styled.span<{ $paid: boolean; $series: string }>`
  display: block;
  height: 6px;
  border-radius: ${radius.xs};
  background: ${({ $paid, $series }) => ($paid ? $series : color.surfaceSunken)};
`;

export const MiniCaption = styled.span`
  display: block;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;
