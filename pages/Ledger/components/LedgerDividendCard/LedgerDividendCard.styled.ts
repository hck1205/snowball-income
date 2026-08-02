import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * B-4 배당 겹쳐 보기 카드의 로컬 스타일.
 *
 * 🔴 **손익색을 쓰지 않는다.** 배당은 P&L 이 아니고, 이 화면의 수입·지출이 이미 중립색이라
 * 배당만 색을 가지면 "이건 이익"이라는 없는 의미가 생긴다. 커버율도 색으로 말하지 않는다 —
 * 숫자와 문장이 채널이다.
 * 🔴 이 카드는 `Card tone="sunken"`(부속)이다. 주역 카드는 화면당 하나이고 그것은 월 요약이다.
 */

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: ${space[3]};
  min-width: 0;
`;

/** 지표 아래 설명 줄 묶음. 문장이 여러 개여도 간격이 한 곳에서 정해진다. */
export const NoteList = styled.div`
  display: grid;
  gap: ${space[1]};
  margin-top: ${space[3]};
  min-width: 0;
`;

/**
 * 지표 아래 문장 한 줄. 전제·한계("예상"·"포함되지 않음")도 이 톤으로 **접지 않고** 편다 —
 * 접힌 뒤에 있으면 사용자는 실수령으로 읽는다.
 */
export const Note = styled.p`
  margin: 0;
  max-width: 60ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;
