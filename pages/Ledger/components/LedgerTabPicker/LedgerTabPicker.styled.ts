import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 🔴 **월 이동 알약(LedgerMonthNav)과 다른 모양이어야 한다.** 탭은 "어느 장부"고 월은 "어느 기간"이라
 * 축이 다른데 생김새가 같으면 "탭을 넘기면 달이 넘어가나?"라는 오해를 만든다. 그래서 알약·중앙정렬이
 * 아니라 **왼쪽 정렬 띠**다.
 */
export const PickerBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const PickerRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  min-width: 0;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

export const PickerLabel = styled.label`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
`;

/** 탭이 하나뿐일 때의 문장. 고를 것이 없으므로 컨트롤을 만들지 않는다. */
export const PickerName = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

/**
 * 전환 중 표시.
 * ⚠ 라이브 리전(role="status")을 붙이지 않는다 — 이 화면의 라이브 리전은 페이지에 하나뿐이고,
 * 전환 결과는 그쪽이 낭독한다(여기에 또 두면 같은 사건을 두 번 말한다).
 */
export const PickerStatus = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;
