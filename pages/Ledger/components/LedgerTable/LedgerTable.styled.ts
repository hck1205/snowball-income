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
 * 거래 내역 표 — **≥821px 는 `<table>`, ≤820px 는 영수증 카드**. DOM 은 한 벌이고 CSS 만 갈린다
 * (조건부 렌더로 두 벌을 만들면 테스트도 두 벌이 되고, jsdom 은 `@media` 를 평가하지 않아 어느 쪽이
 * 진짜인지 검증할 수도 없다).
 *
 * ## 2026-08-03 재설계
 * **열을 6개에서 5개로 줄였다.** 예전 열은 날짜·구분·분류·금액·메모·작업이었는데, 분류와 메모가
 * 각자 한 열을 차지해 (a)두 열 모두 좁아 말줄임이 잦았고 (b)한 기록의 "내용"이 표에서 두 곳으로
 * 갈렸다. 지금은 **날짜 · 내역(분류 + 메모 두 줄) · 구분 · 금액 · 작업**이고, 금액이 가져간 폭으로
 * 이 표의 결론(숫자)이 가장 크게 선다.
 *
 * 카드 모드도 라벨-값 나열에서 **영수증 배치**로 바꿨다.
 * ```
 *  8월 3일 (월)                 [✎][🗑]
 *  식비                        ₩12,000
 *  점심                        [지출]
 * ```
 * 라벨(`data-label`)은 지우지 않고 **시각적으로만 숨긴다** — 카드 모드에서는 `display: grid` 때문에
 * 표 의미가 접근성 트리에서 사라지므로, 그 라벨이 스크린리더의 유일한 열 이름이다.
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
 * 카드(영수증) 모드.
 *
 * ⚠ **한 기록 = 한 `<tbody>`** 다(데이터 행 + 선택적 실패 행). 실패 줄을 같은 `<tr>` 안에 넣으면
 * 표 모드에서 6번째 열이 생기고, 별개 `<tr>` 로 두면 카드 모드에서 **카드가 둘로 쪼개진다**.
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
     긴 분류·메모 하나가 카드 폭을 래퍼 밖으로 밀어낸다. 근거 전문은 shared/styles/stackedTable.ts.
     ⚠ 이 표는 카드 외형이 달라(grid-template-areas) 공용 골격을 일부러 쓰지 않는다 — 이 규칙만 공유한다. */
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

  /* 영수증 배치 — 날짜 줄 / 내역·금액 줄 / 메모·구분 줄. */
  tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'date   date'
      'detail amount'
      'kind   kind';
    align-items: end;
    column-gap: ${space[3]};
    row-gap: ${space[2]};
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

/**
 * 열 머리.
 *
 * ⚠ **`position: sticky` 를 붙이지 마라 — 여기서는 절대 동작하지 않는다**(2026-08-03 실측).
 * 위 `TableWrap` 이 `overflow-x: auto` 라서 CSS 규칙상 `overflow-y` 도 `visible → auto` 로 계산되고
 * (브라우저에서 `getComputedStyle` 로 확인함), 그 순간 `TableWrap` 이 **가장 가까운 스크롤포트**가
 * 된다. 즉 sticky 의 기준이 페이지가 아니라 이 래퍼이고, 래퍼에는 높이 제한이 없어 세로로 한 번도
 * 스크롤되지 않으므로 열 머리는 **평생 붙을 일이 없다**(선언만 남고 아무 일도 안 하는 죽은 CSS).
 * 스크롤 중에도 맥락을 남기는 일은 왼쪽 `ScopeRail`(sticky) 이 맡는다. 정말로 열 머리를 붙이려면
 * `TableWrap` 에 `max-height` 를 주어 **표 안에 두 번째 스크롤을 만드는** 결정이 먼저다.
 * (카드 모드에서는 `thead { display: none }` 이라 이 선언 자체가 닿지도 않는다.)
 */
export const TH = styled.th<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  border-bottom: 1px solid ${color.borderStrong};
  padding: ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  letter-spacing: 0.04em;
`;

/** 시각적으로만 숨긴 텍스트(작업 열 머리·표 캡션·메모 라벨). 접근성 트리에는 남는다. */
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

/**
 * 카드 모드의 셀 공통.
 *
 * 🔴 `data-label` 의 `::before` 를 **지우지 않고 시각적으로만 숨긴다.** 카드 모드에서는 `display: grid`
 * 가 표 의미를 접근성 트리에서 지우므로, 이 라벨이 열 이름을 대신하는 유일한 수단이다. 눈으로는
 * 영수증 배치가 이미 말하고 있어 다시 적을 필요가 없다.
 */
const stackedCell = `
  padding: 0;
  border-bottom: 0;

  &::before {
    content: attr(data-label);
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
`;

/**
 * 행 이름 셀(`<th scope="row">`) = 날짜. 카드 모드에서는 카드의 첫 줄(작은 회색 글씨)이 된다 —
 * 영수증에서 날짜는 머리말이지 결론이 아니다.
 */
export const RowHeader = styled.th`
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[3]} ${space[2]};
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}

  ${container.down('tablet')} {
    grid-area: date;
    padding: 0 ${space[8]} 0 0;
    border-bottom: 0;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
  }

  ${media.down('tablet')} {
    grid-area: date;
    padding: 0 ${space[8]} 0 0;
    border-bottom: 0;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
  }
`;

export const TD = styled.td<{ $align?: 'left' | 'right'; $area: 'detail' | 'kind' | 'amount' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  vertical-align: top;
  border-bottom: 1px solid ${color.border};
  padding: ${space[3]} ${space[2]};
  color: ${color.text};
  min-width: 0;

  ${container.down('tablet')} {
    ${stackedCell};
    grid-area: ${({ $area }) => $area};
    text-align: ${({ $area }) => ($area === 'amount' ? 'right' : 'left')};
  }

  ${media.down('tablet')} {
    ${stackedCell};
    grid-area: ${({ $area }) => $area};
    text-align: ${({ $area }) => ($area === 'amount' ? 'right' : 'left')};
  }
`;

/**
 * 내역 칸 — 분류(1차)와 메모(2차)를 **한 칸에 두 줄**로 쌓는다.
 * 예전에는 두 열이었고, 그래서 한 기록의 "내용"이 표에서 두 곳으로 갈렸다.
 */
export const DetailCell = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

/** 분류 = 이 행의 이름. 표에서 두 번째로 굵은 글자다(가장 굵은 것은 금액). */
export const CategoryText = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/** 메모. 비었으면 요소 자체를 만들지 않는다 — 🔴 "—" 를 넣지 마라. */
export const MemoText = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/**
 * 🔴 금액은 중립색이다. 위계는 **크기 + 데이터 서체 + tabular** 로만 만든다(손익색·accent 금지).
 * 이 표에서 가장 굵고 큰 글자이고, 그게 "이 화면을 켠 이유"에 대한 답이다.
 */
export const AmountText = styled.span`
  display: inline-block;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.text};
  ${font.numeric}
`;

/**
 * 구분 칸의 내용(아이콘 + 글자 + 색).
 *
 * ## 🔴 색은 **덧붙인** 채널이다 (2026-08-09 사용자 요청)
 *
 * 종전 규칙은 "수입/지출은 색이 아니라 아이콘 + 텍스트로 구별한다" 였다. 사용자가 색으로도
 * 구별되기를 요청했고, 그 요청은 규칙과 부딪히지 않는다 — 규칙이 막는 것은 **색 하나에 기대는
 * 것**이지 색을 쓰는 것 자체가 아니다. 아이콘과 글자를 그대로 두고 색을 더했으므로,
 * 색을 못 보는 사람에게도 정보가 그대로 남는다.
 *
 * ⚠ **금액은 여전히 중립색이다.** 그 규칙은 별개이고(`AmountText`), 금액까지 물들이면 화면이
 *   손익표처럼 읽힌다 — 월세를 냈다고 손해를 본 것이 아니다.
 *
 * ⚠ 인라인 span 이라 SVG 가 베이스라인에 앉는다 — inline-flex 로 감싸 글자 중심에 맞춘다.
 */
export const KindChipInner = styled.span<{ 'data-kind'?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  white-space: nowrap;
  font-weight: ${font.weight.semibold};
  /*
   * 🔴 **지출이 빨강, 수입이 파랑**이다(2026-08-09 사용자 결정) — 통장 표기의 관습이다.
   *
   * ⚠ 토큰 이름에 속지 마라. 이 레포의 dataPositive 는 **상승 적색**이고 dataNegative 는
   *   **하락 청색**이다(한국 시장 관습 — shared/styles/presets/sharedTokens.ts).
   *   그래서 지출이 dataPositive, 수입이 dataNegative 를 쓴다. 이름만 보고 뒤집으면 색이 정반대가 된다.
   */
  color: ${(props) =>
    props['data-kind'] === 'expense'
      ? color.dataPositive
      : props['data-kind'] === 'income'
        ? color.dataNegative
        : color.textSecondary};

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
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  width: 1%;

  ${container.down('tablet')} {
    position: absolute;
    top: ${space[3]};
    right: ${space[3]};
    width: auto;
    padding: 0;
    border-bottom: 0;
  }

  ${media.down('tablet')} {
    position: absolute;
    top: ${space[3]};
    right: ${space[3]};
    width: auto;
    padding: 0;
    border-bottom: 0;
  }
`;

/** 실패 줄이 차지하는 행. 표 모드는 전폭 `colSpan`, 카드 모드는 `display: block` 이라 자연히 전폭이다. */
export const RowErrorCell = styled.td`
  padding: 0 ${space[2]} ${space[3]};
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
 * 행 실패 한 줄.
 *
 * 🔴 **색이 아니라 텍스트("저장 실패")와 글리프가 1차 채널**이다.
 * 🔴 2026-08-03 — **면색(`dangerSurface`)을 걷어냈다.** 이 줄은 표 안(data 면)에 있고 폭이 표 전체라
 * 그대로 두면 실패 한 건마다 화면에 채도면이 하나씩 늘었다(10건이면 10면). 지금은
 * **1px danger 테두리 + ⚠ 글리프 + 문장**이라 면 예산과 무관하고, 회색조에서도 읽힌다.
 */
export const RowError = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]} ${space[3]};
  padding: ${space[3]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  text-align: left;

  svg {
    color: ${color.danger};
  }

  ${media.down('mobileWide')} {
    grid-template-columns: auto minmax(0, 1fr);

    button {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
`;

export const RowErrorText = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const RowErrorLabel = styled.span`
  color: ${color.danger};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
`;

/** 🔴 사유 본문은 중립색이다 — 읽기 위한 글이지 경고 글리프가 아니다. */
export const RowErrorReason = styled.span`
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
