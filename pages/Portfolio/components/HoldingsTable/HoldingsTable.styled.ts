import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

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
  ${subtleScrollbar}
`;

const stackedTable = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  /* 🔴 minmax(0, 1fr) 은 장식이 아니다 — 기본 암시 트랙(auto)은 최소 크기가 min-content 라
     긴 종목명 하나가 카드 폭을 래퍼 밖으로 밀어낸다(이 레포에서 반복된 가로 오버플로 원인). */
  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
    position: relative;
    padding: ${space[4]};
    border: 1px solid ${color.border};
    border-radius: ${radius.lg};
    background: ${color.surface};
    /* 카드 모드에서는 왼쪽 귀가 카드 전체의 세로 변이 된다 — 표 모드의 짧은 귀와 같은 뜻이다. */
    overflow: hidden;
  }

  /*
   * 🔴 카드 왼쪽 변 전체가 그 종목의 색이다. 폭 3px 이라 tintscan 의 면 하한(180px)에 한참 못 미쳐
   * 예산을 먹지 않는다 — L1(선·점·귀) 파생이고, 같은 사실은 행 안의 심볼 글자가 말한다.
   */
  tbody tr::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--sb-row-series, ${color.border});
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

  /*
   * 호버 면도 **그 종목의 색**으로 물든다(6% 믹스). 색이 곧 그 종목이라는 약속을 상호작용까지
   * 끌고 오는 자리다 — 6% 라 글자 대비는 중립 면과 사실상 같고, 변수가 없으면 종전 중립 호버로 떨어진다.
   */
  tbody tr:hover {
    background: color-mix(in srgb, var(--sb-row-series, transparent) 6%, ${color.surfaceHover});
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

/**
 * 🔴 **종목의 색 귀.** `assignSeries` 가 배정한 값이 이 3px 세로 막대 · 아래 비중 막대 · 요약 카드의
 * 도넛 조각 **셋 모두**에 들어간다 — 같은 종목이 화면 어디서나 같은 색이라는 것이 이번 개편의 약속이다.
 *
 * 폭 3px 이라 `tintscan` 의 면 판정(폭 ≥180px)에 걸리지 않는다(L1 파생 — 개수 제한 없음).
 * ⚠ 색은 결코 단독 채널이 아니다: 바로 오른쪽에 심볼 글자가 같은 종목을 말하고, 비중은 숫자로도 적힌다.
 */
export const TickerEar = styled.span`
  flex: 0 0 auto;
  width: 3px;
  height: 18px;
  border-radius: ${radius.pill};
  background: var(--sb-row-series, ${color.border});
`;

export const TickerSymbol = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  font-family: ${font.dataNumeric};
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
/**
 * 행의 비중 한 줄 — **막대 + 숫자**. 막대는 장식(`aria-hidden`)이고 숫자가 사실을 말한다.
 *
 * 높이 5px · 폭 88px 라 `tintscan` 의 면 판정(폭 ≥180 **AND** 높이 ≥8)을 두 축 모두에서 못 넘는다.
 * 예산이 빠듯한 화면에서 색을 쓰는 유일한 합법 어법이 이것이다(레일 캡과 같은 원리).
 */
export const ShareLine = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-top: ${space[1]};
  min-width: 0;
`;

export const ShareTrack = styled.span`
  flex: 0 0 auto;
  display: block;
  width: 88px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
  overflow: hidden;
`;

export const ShareFill = styled.span`
  display: block;
  height: 100%;
  min-width: 2px;
  border-radius: ${radius.pill};
  background: var(--sb-row-series, ${color.borderStrong});
  transition: width ${motion.base} ${motion.ease};
`;

export const ShareValue = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
  white-space: nowrap;
  ${font.numeric}
`;

export const RowNote = styled.span`
  display: block;
  margin-top: ${space[1]};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  white-space: normal;
  line-height: ${font.leading.snug};
`;

/**
 * 삭제 셀. 표 모드에서는 `width: 1%`(표 레이아웃의 "내용만큼만" 관용구)로 열을 최소로 만들고,
 * 카드 모드에서는 카드 우상단에 절대 배치한다(라벨 없이도 위치로 읽힌다).
 *
 * 🔴 **카드 모드에서는 `width: auto` 로 되돌려야 한다.** `width: 1%` 는 표 레이아웃 알고리즘이
 * "가능한 한 좁게"로 해석해 주는 관용구일 뿐이고, `display: block` + `position: absolute` 가 되는
 * 순간 문자 그대로 **부모 폭의 1%**(768px 화면에서 6.5px)가 된다. 그 안의 28px 삭제 버튼이 21px
 * 삐져나와 표 래퍼(`overflow-x: auto`)에 **가로 스크롤바가 생긴다** — "래퍼는 충분히 큰데 스크롤이
 * 생긴다"던 사용자 신고의 원인이 이것이었다(≤820px 전 구간, 실측 20~41px).
 */
export const DeleteCell = styled.td`
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
