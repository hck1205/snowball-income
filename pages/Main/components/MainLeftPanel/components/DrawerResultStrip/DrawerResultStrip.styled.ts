import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 드로어 최상단 결과 스트립.
 *
 * 🔴 **카드가 아니다.** `Card` 로 감싸면 이 드로어 안에서 카드 안의 카드가 되고, 화면당 하나뿐인
 *   주역 카드(`ResultSummaryCard`)와 격이 겹친다. 그래서 그림자도 액센트도 없는 **가라앉은 면**
 *   (`surfaceSunken`) + 아래 경계선 하나로만 자기 자리를 표시한다.
 *
 * 🔴 숫자에 색을 넣지 않는다(중립 토큰만). 이 스트립은 결과의 **사본**이지 새로운 강조가 아니다.
 *
 * ⚠ `position: sticky` 를 일부러 쓰지 않았다 — `SideDrawerBody` 는 `display: grid` 이고 grid item 의
 *   sticky 는 자기 행(grid area) 안에 갇혀 아무 일도 일어나지 않는다(이 레포 실측 함정).
 *   붙이려면 본문 레이아웃 자체를 바꿔야 하는데 그건 공용 `SideDrawer` 의 계약이다.
 */
export const StripRoot = styled.section`
  /* 드로어 본문 좌우 패딩을 상쇄해 위쪽에 꽉 찬 띠로 앉는다(본문 패딩 = space[4]). */
  margin: calc(-1 * ${space[4]}) calc(-1 * ${space[4]}) 0;
  padding: ${space[3]} ${space[4]};
  background: ${color.surfaceSunken};
  border-bottom: 1px solid ${color.border};
  border-radius: 0;
`;

export const StripList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[1]} ${space[3]};
`;

export const StripItem = styled.div`
  min-width: 0;
  display: grid;
  gap: 2px;
`;

export const StripLabel = styled.dt`
  margin: 0;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StripValue = styled.dd`
  margin: 0;
  min-width: 0;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  ${font.numeric}
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 결과가 아직 없을 때(종목 0개·입력 오류) 대신 서는 한 줄. "—" 를 단독으로 세우지 않는다. */
export const StripEmpty = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  border-radius: ${radius.sm};
`;
