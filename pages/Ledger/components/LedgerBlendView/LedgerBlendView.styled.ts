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
 * B-3 블렌딩 뷰의 로컬 스타일.
 *
 * 🔴 **출처는 색 단독 채널이 아니다**(D3-4). 배지는 ①사용자가 붙인 **이름 텍스트** ②**테두리 모양**
 *    (a=실선 알약 / b=파선 사각) ③틴트, 이 셋을 겹친다 — 색만 지워도 어느 가계부인지 읽힌다.
 * 🔴 **손익색 금지.** 금액은 전부 `color.text` 중립이고, 소계도 마찬가지다(수입·지출은 P&L 이 아니다).
 * 🔴 이 화면은 **읽기 전용**이라 표에 수정·삭제·재시도 셀이 없다. 행에서 나가는 길은 "그 가계부에서
 *    열기" 하나뿐이다.
 *
 * 표는 `LedgerTable.styled.ts` 의 관용구를 그대로 따른다 — **≥821px 는 table, ≤820px 는 행 카드**.
 * DOM 은 한 벌이고 CSS 만 갈린다(조건부 렌더로 두 벌을 만들면 jsdom 이 어느 쪽도 검증하지 못한다).
 *
 * 🔴 **이 파일은 tsx 가 "한 기록 = 한 tbody" 로 그린다는 전제 위에 서 있다.** 카드가 되는 것도,
 *    유일한 positioned ancestor 도 `tbody` 이기 때문이다 — 모든 행을 한 `tbody` 에 몰아 넣으면
 *    아래 `ActionCell` 의 절대 위치가 전부 같은 자리를 가리켜 버튼이 포개지고 카드 경계도 사라진다.
 *    (한때 tsx 가 실제로 그랬고 이 주석만 맞았다. 구조는 `LedgerBlendView.test`(rowgroup 수)가 잠근다.)
 */

/* ── 실패 · 안내 ─────────────────────────────────────────────────────────────── */

export const NoteList = styled.div`
  display: grid;
  gap: ${space[1]};
  margin-bottom: ${space[4]};
  min-width: 0;
`;

export const Note = styled.p`
  margin: 0;
  max-width: 64ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/**
 * 한쪽(또는 양쪽) 읽기 실패. 🔴 **색이 아니라 제목 텍스트가 1차 채널**이다 — 면색은 보조다.
 * `LedgerTable` 의 행 실패 줄과 같은 어휘(왼쪽 danger 레일 + dangerSurface)를 쓴다.
 */
export const FailureBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
  padding: ${space[3]} ${space[4]};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  background: ${color.dangerSurface};
  min-width: 0;
`;

export const FailureTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.danger};
`;

/** 🔴 사유 본문은 중립색이다 — 읽기 위한 글이지 경고 글리프가 아니다. */
export const FailureReason = styled.p`
  margin: 0;
  max-width: 64ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.text};
`;

export const FailureActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/* ── 출처 배지 ───────────────────────────────────────────────────────────────── */

/**
 * 출처 배지. 🔴 모양이 색과 **함께** 다르다 — a 는 실선 알약, b 는 파선 사각이다.
 * 라벨은 사용자가 붙인 이름이라 길 수 있다 — 넘치면 말줄임하고 원문은 `title` 이 갖는다.
 */
export const SourceBadge = styled.span<{ $source: 'a' | 'b' }>`
  display: inline-block;
  max-width: 16ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  padding: ${space[1]} ${space[2]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};

  ${({ $source }) =>
    $source === 'a'
      ? `
        border: 1px solid ${color.accentBorder};
        border-radius: 999px;
        background: ${color.accentSubtle};
        color: ${color.accentText};
      `
      : `
        border: 1px dashed ${color.accentAltBorder};
        border-radius: ${radius.sm};
        background: ${color.accentAltSubtle};
        color: ${color.accentAltText};
      `}
`;

/* ── 출처별 소계 ─────────────────────────────────────────────────────────────── */

export const SubtotalSection = styled.section`
  display: grid;
  gap: ${space[2]};
  margin-bottom: ${space[4]};
  min-width: 0;
`;

export const SubtotalHeading = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const SubtotalList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

export const SubtotalItem = styled.li`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[4]};
  min-width: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

/** 수입·지출 짝. `<dl>` 이라 "무엇의 값인지"가 접근성 트리에 남는다. */
export const SubtotalNumbers = styled.dl`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[4]};
  margin: 0;
  min-width: 0;

  dt {
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
  }

  dd {
    margin: 0 0 0 ${space[2]};
    /* 🔴 중립색 — 소계에도 손익색을 쓰지 않는다. */
    color: ${color.text};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const SubtotalCount = styled.span`
  margin-left: ${space[1]};
  color: ${color.textMuted};
  font-family: inherit;
  font-size: ${font.size.xs};
`;

/* ── 통합 목록 ───────────────────────────────────────────────────────────────── */

export const TableWrap = styled.div`
  display: block;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  width: 100%;
  ${subtleScrollbar}
`;

const stackedTable = `
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  min-width: 0;

  thead {
    display: none;
  }

  /* 🔴 minmax(0, 1fr) — 기본 auto 트랙은 최소 크기가 min-content 라 긴 분류·메모 하나가
     카드 폭을 래퍼 밖으로 밀어낸다(이 레포에서 반복된 가로 오버플로 원인). */
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

/**
 * 구분 칩의 내용(아이콘 + 텍스트). 🔴 수입/지출은 **색이 아니라 아이콘 + 텍스트**로 구별한다 —
 * 칩은 전부 `neutral` 이다. `ChipLabel` 이 인라인 span 이라 SVG 가 베이스라인에 앉으므로
 * 여기서 inline-flex 로 감싸 글자 중심에 맞춘다(`LedgerTable.styled.ts` 와 같은 처방).
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

export const EllipsisText = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 🔴 금액은 중립색이다. 위계는 데이터 서체 + tabular 로만 만든다. */
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
 * "그 가계부에서 열기" 셀. 표 모드에서는 `width: 1%`(내용만큼만) 이고,
 * 🔴 **카드 모드에서는 반드시 `width: auto`** 로 되돌린다 — `display: block` 이 되는 순간
 * 1% 가 문자 그대로 부모 폭의 1% 가 되어 버튼이 래퍼 밖으로 삐져나온다(실측 사고).
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

/** 값이 오기 전 자리. 🔴 셔머를 새로 만들지 않는다(모양이 정적 단서다). */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: block;
  height: 44px;
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

/** 이 달에 두 가계부 모두 기록이 없을 때. 실패가 아니므로 danger 가 아니다. */
export const EmptyBlock = styled.p`
  margin: 0;
  padding: clamp(16px, 3vw, 24px);
  border: 1px dashed ${color.accentBorder};
  border-radius: ${radius.lg};
  background: ${color.accentSubtle};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
