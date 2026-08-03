import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * B-1 탭 줄 — "어느 장부인가".
 *
 * 🔴 **월 이동(LedgerMonthNav)과 다른 모양이어야 한다.** 탭은 "어느 장부"고 월은 "어느 기간"이라
 * 축이 다른데 생김새가 같으면 "탭을 넘기면 달이 넘어가나?"라는 오해를 만든다. 두 컨트롤은
 * 2026-08-03 부터 같은 틀(`ScopePanel`)을 공유하므로 **모양의 차이가 더 중요해졌다** —
 * 여기는 왼쪽 정렬 라벨 줄(자기 면 없음)이고, 아래는 가운데 정렬 큰 제목이 앉은 가라앉은 면이다.
 *
 * ⚠ 자기 테두리·배경을 갖지 않는다. 틀은 부모(`ScopePanel`)가 그린다 — 예전처럼 여기서 또
 * 1px 테두리를 그리면 패널 안에 상자가 겹쳐 두 겹 테두리가 된다.
 */
export const PickerBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 축 이름 줄. 라벨과 컨트롤을 세로로 쌓아 좁은 레일(280px)에서도 셀렉트가 온전히 눕는다. */
export const PickerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  min-width: 0;
`;

/** 이 줄이 무슨 축인지. 🔴 화면에서 이 축을 말하는 자리는 여기 하나뿐이다. */
export const PickerAxis = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.textMuted};

  svg {
    flex: 0 0 auto;
  }
`;

export const PickerLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.textMuted};
`;

/**
 * 탭이 하나뿐일 때의 문장.
 *
 * 고를 것이 없으므로 컨트롤을 만들지 않는다. 예전에는 13px `textSecondary` 라 화면에서 거의
 * 사라졌는데, 이 문장은 **"어느 장부를 보고 있는가"의 단일 출처**다(히어로 메타를 없앤 뒤로는
 * 화면에서 유일하다). 그래서 본문 색·중간 굵기로 올린다.
 */
export const PickerName = styled.p`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  overflow-wrap: anywhere;
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
