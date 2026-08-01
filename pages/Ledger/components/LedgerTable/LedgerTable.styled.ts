import styled from '@emotion/styled';
import {
  color,
  container,
  font,
  iconOpticalAlign,
  media,
  motion,
  radius,
  space,
  subtleScrollbar
} from '@/shared/styles';

/**
 * 거래 내역 표 — **≥821px 는 `<table>`, ≤820px 는 행 카드**. DOM 은 한 벌이고 CSS 만 갈린다
 * (조건부 렌더로 두 벌을 만들면 테스트도 두 벌이 되고, jsdom 은 `@media` 를 평가하지 않아 어느 쪽이
 * 진짜인지 검증할 수도 없다). 카드 전환 관용구는 `HoldingsTable.styled.ts` 를 복제했다.
 *
 * 공용 `DataTable` 을 쓰지 않는 이유: ①첫 열이 행 이름이라 `<th scope="row">` 여야 하고(DataTable 은
 * 모든 셀을 `TD` 로 그린다) ②수정·삭제 버튼 같은 상호작용 셀이 필요하며 ③작업 열 머리는 시각
 * 라벨이 없어야 하기 때문이다.
 */

export const TableWrap = styled.div`
  display: block;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  width: 100%;
  ${subtleScrollbar}
`;

/**
 * 카드 모드.
 *
 * ⚠ **한 기록 = 한 `<tbody>`** 다(데이터 행 + 선택적 실패 행). 실패 줄을 같은 `<tr>` 안에 넣으면
 * 표 모드에서 7번째 열이 생기고, 별개 `<tr>` 로 두면 카드 모드에서 **카드가 둘로 쪼개진다**.
 * `<tbody>` 를 카드 경계로 삼으면 두 모드가 같은 DOM 한 벌로 동시에 옳다(다중 tbody 는 유효한 HTML).
 */
const stackedTable = `
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  min-width: 0;

  thead {
    display: none;
  }

  /* 🔴 minmax(0, 1fr) 은 장식이 아니다 — 기본 암시 트랙(auto)은 최소 크기가 min-content 라
     긴 분류·메모 하나가 카드 폭을 래퍼 밖으로 밀어낸다(이 레포에서 반복된 가로 오버플로 원인). */
  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
    position: relative;
    padding: ${space[4]};
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    background: ${color.surface};
  }

  tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr:hover {
    background: transparent;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};

  caption {
    /* 표의 이름은 스크린리더에게만 필요하다 — 화면에는 카드 제목이 이미 있다. */
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

/** 시각적으로만 숨긴 텍스트(작업 열 머리·표 캡션). 접근성 트리에는 남는다. */
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

/** 행 이름 셀(`<th scope="row">`) = 날짜. 카드 모드에서는 카드 제목 줄이 된다. */
export const RowHeader = styled.th`
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;

  ${container.down('tablet')} {
    padding: 0 ${space[6]} ${space[2]} 0;
  }

  ${media.down('tablet')} {
    padding: 0 ${space[6]} ${space[2]} 0;
  }
`;

export const TD = styled.td<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};
  min-width: 0;

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;

/** 분류·메모는 길어질 수 있다 — 넘치면 말줄임하고 원문은 `title` 이 갖는다. */
export const EllipsisText = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 🔴 금액은 중립색이다. 위계는 데이터 서체 + tabular 로만 만든다(손익색·accent 금지). */
export const AmountText = styled.span`
  font-family: ${font.dataNumeric};
  color: ${color.text};
  ${font.numeric}
`;

export const MemoText = styled(EllipsisText)`
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/**
 * 구분 칩의 내용(아이콘 + 텍스트).
 *
 * 🔴 수입/지출은 **색이 아니라 아이콘 + 텍스트**로 구별한다(§3.4). 칩은 전부 `neutral` 이다.
 * `ChipLabel` 이 인라인 span 이라 SVG 가 베이스라인에 앉는다 — 여기서 inline-flex 로 감싸
 * 글자 중심에 맞춘다(본문 서체는 잉크 보정이 0 이라 `iconOpticalAlign('sans', …)` 은 flex 만 낸다).
 */
export const KindChipInner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  white-space: nowrap;

  svg {
    ${iconOpticalAlign('sans', font.size.xs)}
  }
`;

export const RowActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

/**
 * 작업 셀. 표 모드에서는 `width: 1%`(표 레이아웃의 "내용만큼만" 관용구)로 열을 최소로 만든다.
 *
 * 🔴 **카드 모드 두 블록에서 반드시 `width: auto` 로 되돌린다.** `width: 1%` 는 표 레이아웃
 * 알고리즘이 "가능한 한 좁게"로 해석해 주는 관용구일 뿐이고, `display: block` + `position: absolute`
 * 가 되는 순간 문자 그대로 **부모 폭의 1%**(768px 화면에서 6.5px)가 된다. 그 안의 버튼이 삐져나와
 * 표 래퍼(`overflow-x: auto`)에 가로 스크롤이 생긴다(실측 사고 — `HoldingsTable.styled.ts:221-244`).
 */
export const ActionCell = styled.td`
  text-align: right;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  width: 1%;

  ${container.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    width: auto;
    padding: 0;
    border-bottom: 0;
  }

  ${media.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    width: auto;
    padding: 0;
    border-bottom: 0;
  }
`;

/** 실패 줄이 차지하는 행. 표 모드는 전폭 `colSpan`, 카드 모드는 `display: block` 이라 자연히 전폭이다. */
export const RowErrorCell = styled.td`
  padding: 0 ${space[2]} ${space[2]};
  border-bottom: 1px solid ${color.border};

  ${container.down('tablet')} {
    padding: ${space[2]} 0 0;
    border-bottom: 0;
  }

  ${media.down('tablet')} {
    padding: ${space[2]} 0 0;
    border-bottom: 0;
  }
`;

/**
 * 행 실패 한 줄. 🔴 **색이 아니라 텍스트("저장 실패")가 1차 채널**이다 — 면색은 보조다.
 * `ErrorBox` 의 어휘(왼쪽 danger 레일 + dangerSurface)를 인라인으로 축소한 것.
 */
export const RowError = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  padding: ${space[2]} ${space[3]};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  background: ${color.dangerSurface};
  text-align: left;

  ${media.down('mobileWide')} {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const RowErrorLabel = styled.span`
  color: ${color.danger};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

/** 🔴 사유 본문은 중립색이다 — 읽기 위한 글이지 경고 글리프가 아니다. */
export const RowErrorReason = styled.span`
  min-width: 0;
  flex: 1 1 20ch;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
