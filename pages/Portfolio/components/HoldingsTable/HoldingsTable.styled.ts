import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 보유 표 — **데스크톱은 `<table>`, ≤820px 는 행 카드**. DOM 은 한 벌이고 CSS 만 갈린다
 * (조건부 렌더로 두 벌을 만들면 테스트도 두 벌이 되고, jsdom 은 `@media` 를 평가하지 않아
 * 어느 쪽이 진짜인지 검증할 수도 없다).
 *
 * 카드 전환 CSS 는 공용 `DataTable.styled` 의 관례를 그대로 복제했다(`data-label` + `::before`).
 * 공용 `DataTable` 컴포넌트를 쓰지 않는 이유는 ①첫 열이 행 이름이라 `<th scope="row">` 여야 하고
 * (DataTable 은 모든 셀을 `TD` 로 그린다) ②수량 입력·삭제 버튼 같은 상호작용 셀이 필요하며
 * ③삭제 열 머리는 시각 라벨이 없어야 하기 때문이다.
 */

export const TableWrap = styled.div`
  display: block;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  width: 100%;
`;

const stackedTable = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  tbody {
    display: grid;
    gap: ${space[2]};
  }

  tbody tr {
    display: grid;
    gap: ${space[2]};
    position: relative;
    padding: ${space[4]};
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    background: ${color.surface};
  }

  tbody tr:hover {
    background: ${color.surface};
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};

  caption {
    /* 표의 사용법은 스크린리더에게만 필요하다 — 화면에는 카드 제목이 이미 있다. */
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  tbody tr {
    transition: background-color ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  ${container.down('tablet')} {
    ${stackedTable};
  }

  ${media.down('tablet')} {
    ${stackedTable};
  }
`;

export const TH = styled.th<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  border-bottom: 1px solid ${color.borderStrong};
  padding: ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  letter-spacing: 0.02em;
`;

/** 시각적으로만 숨긴 텍스트(삭제 열 머리). 접근성 트리에는 남는다. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

const stackedCell = `
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  text-align: right;
  padding: ${space[2]} 0;
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &::before {
    content: attr(data-label);
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.medium};
  }
`;

/** 행 이름 셀(`<th scope="row">`) — 심볼 + 이름 + 배지. 카드 모드에서는 전 폭을 차지한다. */
export const RowHeader = styled.th`
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  font-weight: ${font.weight.regular};

  ${container.down('tablet')} {
    padding: 0 ${space[6]} ${space[2]} 0;
    border-bottom: 1px solid ${color.border};
  }

  ${media.down('tablet')} {
    padding: 0 ${space[6]} ${space[2]} 0;
    border-bottom: 1px solid ${color.border};
  }
`;

export const TickerLine = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

export const TickerSymbol = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const TickerName = styled.span`
  min-width: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TD = styled.td<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};
  white-space: nowrap;
  ${font.numeric}

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;

/** 수량 셀은 입력이 들어가므로 숫자 셀보다 여유가 필요하다(카드 모드에서 입력이 오른쪽에 붙는다). */
export const QuantityCell = styled(TD)`
  ${container.down('tablet')} {
    justify-items: end;
  }

  ${media.down('tablet')} {
    justify-items: end;
  }
`;

/**
 * 행 사유 한 줄. **에러가 아니다** — 색은 중립(textMuted)이고 문장이 상태를 말한다.
 * 표 모드에서는 행 이름 아래, 카드 모드에서는 전 폭이다.
 */
export const RowNote = styled.span`
  display: block;
  margin-top: ${space[1]};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  white-space: normal;
  line-height: ${font.leading.snug};
`;

/** 삭제 셀. 카드 모드에서는 카드 우상단에 절대 배치한다(라벨 없이도 위치로 읽힌다). */
export const DeleteCell = styled.td`
  text-align: right;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  width: 1%;

  ${container.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    padding: 0;
    border-bottom: 0;
  }

  ${media.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    padding: 0;
    border-bottom: 0;
  }
`;
