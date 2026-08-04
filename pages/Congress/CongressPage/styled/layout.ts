import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 이 화면에만 있는 조판.
 *
 * 🔴 섹션 뼈대(제목 밑줄·부제·타일 줄·한계 판)는 여기 없다 — **`components/common/DataSection`** 이
 * 소유한다. 국민연금·증시 캘린더가 같은 조판을 쓰기 때문이다. 여기에 다시 만들지 마라.
 */

/** 대한민국 국회 안내 판의 본문 단락. 한 문단이 길어 읽는 폭을 따로 묶는다. */
export const KoreaBody = styled.p`
  margin: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.75;
`;

/** "확인한 것" 목록 — 왜 한국 자료가 없는지의 근거라 번호 없는 들여쓴 목록으로 둔다. */
export const CheckedList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding-left: ${space[5]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;
`;
