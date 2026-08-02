import styled from '@emotion/styled';
import { cardElevation, color, font, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 법무 고지문의 모양.
 *
 * 이 화면은 **읽히는 것이 유일한 목적**이라 장식을 넣지 않는다. 카드 위계는 앱의 3단 규칙 그대로
 * (절 = 본문 카드 base, 표 = 부속 sunken)이고, 페이지 hue 는 발행하지 않는다 — 404 와 같은 이유로
 * 법무 문서는 어느 섹션에도 속하지 않는다(shared/hooks/usePageHue 의 미배정 라우트 → 폴백 brand).
 *
 * 본문 폭은 셸(TickerPageShell)의 1120px 를 그대로 쓰지 않고 여기서 한 번 더 좁힌다. 조문은 한 줄이
 * 길어질수록 읽는 사람이 줄을 놓친다.
 */

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
  max-width: 860px;
`;

/**
 * 시행일 등 문서 메타 줄. 히어로의 meta 슬롯(`<p>`)에 그대로 들어가므로 **구문 콘텐츠만** 쓴다
 * (`ul`/`li` 로 바꾸면 `<p>` 안에 블록이 들어가 브라우저가 문단을 끊는다).
 */
export const MetaList = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
`;

/**
 * 메타 한 항목. 🔴 텍스트 노드(`<Fragment>{line}</Fragment>`)로 두면 안 된다 — flexbox 는 연속된
 * 텍스트 런을 **하나의 익명 flex 아이템**으로 묶으므로 위 `gap` 이 적용될 경계 자체가 없다.
 * 항목이 하나뿐인 지금은 증상이 없고, 시행일이 확정되어 두 줄이 되는 순간
 * `시행일: …최종 개정: …` 로 붙어 나온다(타입도 테스트도 잡지 못하는 잠복 결함이었다).
 * 가드: test/legal/legalDocumentMeta.test.tsx.
 */
export const MetaItem = styled.span`
  overflow-wrap: anywhere;
`;

export const Section = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: clamp(16px, 3vw, 24px);
  border-radius: ${radius.xl};
  ${cardElevation('base')}
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Paragraph = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

export const List = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding-left: ${space[4]};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const ListItem = styled.li`
  overflow-wrap: anywhere;
`;

export const DefinitionList = styled.dl`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
`;

export const DefinitionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const DefinitionTerm = styled.dt`
  min-width: 96px;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const DefinitionDescription = styled.dd`
  margin: 0;
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/**
 * 표는 좁은 화면에서 줄바꿈만으로는 읽히지 않는다(국외 이전 표는 열이 일곱이고 값이 길다).
 * 그래서 가로 스크롤 컨테이너로 감싸되, 키보드로도 스크롤할 수 있도록 tabIndex 를 준다
 * (스크롤 가능한 영역에 포커스가 없으면 키보드 사용자는 잘린 열을 볼 방법이 없다).
 *
 * 포커스 링은 전역 `:focus-visible`(globalStyles 의 `[tabindex]:not([tabindex='-1'])`)이 그린다 —
 * 여기서 재정의하지 않는다.
 */
export const TableScroller = styled.div`
  overflow-x: auto;
  border-radius: ${radius.lg};
  ${cardElevation('sunken')}
  ${subtleScrollbar}
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

export const TableCaption = styled.caption`
  padding: ${space[2]} ${space[3]} 0;
  text-align: left;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const TableHeaderCell = styled.th`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  text-align: left;
  white-space: nowrap;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const TableCell = styled.td`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  vertical-align: top;
  overflow-wrap: anywhere;
`;
