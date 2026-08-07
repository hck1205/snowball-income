import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 월간 리캡 — **한 해의 배당 리듬과 이번 달의 자리**.
 *
 * 🔴 이 앱은 한 번 계산하면 볼 일이 끝난다. 배당은 매달 들어오는데 앱이 그 사실을 말해 주지
 * 않았다("돌아올 계기가 0개" — docs/site-assessment-2026-08-06.md P1-⑤). 이 블록이 그 자리다.
 *
 * ⚠ 여기 서는 숫자는 전부 **예상**이다(연 배당 ÷ 지급월 수). 카피가 그 사실을 말하고,
 *   이 스타일은 어디서도 "확정"으로 읽힐 만한 무게를 주지 않는다 — 값은 크지만 색은 중립이다.
 * -------------------------------------------------------------------------- */

export const RecapRoot = styled.section`
  display: grid;
  gap: ${space[2]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const RecapLabel = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

/** 변화 한 줄 — "지난달보다 +8.2%". 방향색은 여기서만 쓴다(막대는 중립이다). */
export const RecapChange = styled.p<{ $direction: 'up' | 'down' | 'flat' }>`
  margin: 0;
  color: ${({ $direction }) =>
    $direction === 'up' ? color.dataPositive : $direction === 'down' ? color.dataNegative : color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  ${font.numeric};
`;

/**
 * 열두 칸 띠.
 *
 * 🔴 배당이 없는 달도 **자리를 지킨다**. 빈 달을 빼면 "3·6·9·12월에 들어온다"는 리듬이 사라지고,
 * 그 리듬이야말로 이 블록이 말하려는 것이다.
 */
export const RecapMonths = styled.ol`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: end;
  gap: 3px;
  margin: ${space[1]} 0 0;
  padding: 0;
  list-style: none;
  height: 56px;
`;

export const RecapMonth = styled.li`
  display: grid;
  align-content: end;
  gap: 3px;
  min-width: 0;
  height: 100%;
`;

/**
 * 한 달 막대.
 *
 * ⚠ 값이 0 이 아닌데 막대가 안 보이면 "그 달에 배당이 없다"로 읽힌다 — 그래서 **최소 높이**를 준다.
 * ⚠ 0 인 달은 바닥선만 남긴다(2px). 아예 비우면 칸이 있는지도 모른다.
 */
export const RecapBar = styled.span<{ $ratio: number; $current: boolean }>`
  display: block;
  align-self: end;
  width: 100%;
  height: ${({ $ratio }) => ($ratio <= 0 ? '2px' : `max(4px, ${Math.round($ratio * 100)}%)`)};
  border-radius: ${radius.sm};
  background: ${({ $ratio, $current }) =>
    $ratio <= 0 ? color.border : $current ? color.brand : color.borderStrong};
  transition: background-color ${motion.fast} ${motion.ease};
`;

/**
 * 달 번호.
 *
 * 🔴 이번 달만 진하다 — 열두 개가 같은 무게면 "지금 어디인가"를 눈이 못 찾는다.
 * ⚠ 좁은 칸이라 숫자만 쓴다("8" — "8월"은 두 글자라 12칸에서 겹친다). 단위는 위 라벨이 말한다.
 */
export const RecapMonthLabel = styled.span<{ $current: boolean }>`
  color: ${({ $current }) => ($current ? color.text : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${({ $current }) => ($current ? font.weight.bold : font.weight.regular)};
  text-align: center;
  ${font.numeric};
`;

/** 🔴 지우지 마라 — 이 블록의 숫자가 확정이 아니라는 유일한 표시다. */
export const RecapNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;
