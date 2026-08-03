import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 보유 종목 표 — **이 화면의 본체**.
 *
 * 데스크톱은 `<table>`, ≤820px 는 행 카드다. DOM 은 한 벌이고 CSS 만 갈린다
 * (조건부 렌더로 두 벌을 만들면 테스트도 두 벌이 되고, jsdom 은 `@media` 를 평가하지 않아
 * 어느 쪽이 진짜인지 검증할 수도 없다).
 *
 * ## 2026-08-03 2차 리워크 — 행 구조와 밀도를 다시 잡았다
 * 종전 표의 문제는 색이 아니라 **줄이 안 보인다**는 것이었다:
 *  - 머리글이 본문과 같은 면 위 12px 회색 글자라 "여기부터 데이터"라는 경계가 없었다.
 *  - 행 높이가 내용에 따라 제각각(비중 줄이 있는 행 vs 없는 행)이라 눈이 세로로 미끄러지지 못했다.
 *  - 네 열이 전부 같은 굵기·같은 색이라 **무엇이 중요한 숫자인지** 표가 말하지 않았다.
 *
 * 지금:
 *  - 머리글이 **중립 침강 면 띠**(surfaceSunken)로 앉는다 — 색이 아니라 면으로 경계를 만든다.
 *  - 행에 최소 높이를 주고 셀 여백을 키워 세로 리듬을 고정한다.
 *  - 값의 무게를 갈랐다: **연 배당(세후)이 이 앱의 주제**라 가장 진하고, 평가 금액은 한 단 물러난다.
 *  - 종목 열의 비중 막대를 넓혀(88 → 120px) 행 안에서 두 번째 정보 축으로 읽히게 했다.
 *
 * 🔴 막대 폭 120px 은 `tintscan` 의 면 판정(폭 ≥180 AND 높이 ≥8)을 **두 축 모두** 못 넘는다.
 *    180px 이상으로 키우지 마라 — 종목 수만큼 면이 늘어나 예산이 즉시 터진다.
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
    min-height: 0;
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
  border-collapse: separate;
  border-spacing: 0;
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
   * 🔴 열 폭과 행 높이는 **표 모드에서만** 건다.
   *
   * 이 규칙들은 Table 에 붙으므로 선택자 특이도가 셀 자신의 카드 모드 선언보다 높다 —
   * 미디어 게이트 없이 두면 ≤820px 카드 모드에서도 살아남아 수량 셀이 132px 로 굳고
   * 라벨(보유 수량)이 그 안에서 줄바꿈되며, 행 높이 64px 이 카드 안 모든 줄에 걸린다.
   * DeleteCell 의 width 1% 가 카드 모드에서 6.5px 이 되어 가로 스크롤을 만들었던 것과
   * **같은 부류의 사고**다(그 주석 참고). 게이트는 협상 대상이 아니다.
   */
  ${media.up('tablet')} {
    /*
     * 2열 레이아웃에서 표가 서는 열은 1280px 기준 약 800px 다 — 자동 폭에 맡기면 종목 열이
     * 남는 폭을 전부 먹고 숫자 셋이 오른쪽 끝에 몰려 붙는다(리워크 전 화면의 증상).
     * 종목 열만 유동이고 나머지는 내용 폭에 맞춘 고정 대역이다.
     */
    th:nth-of-type(2),
    td:nth-of-type(1) {
      width: 132px;
    }

    th:nth-of-type(3),
    th:nth-of-type(4),
    td:nth-of-type(2),
    td:nth-of-type(3) {
      width: 140px;
    }

    /* 세로 리듬을 고정한다 — 비중 줄이 있는 행과 없는 행의 높이가 갈리면 눈이 미끄러지지 못한다. */
    tbody tr > * {
      height: 64px;
    }
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

/**
 * 머리글.
 *
 * 🔴 **중립 침강 면 띠**(`surfaceSunken`)다 — 종전에는 본문과 같은 면 위 회색 글자 한 줄이라
 * "여기부터 데이터"라는 경계가 없었다. 면 토큰이 중립이라 `tintscan` 이 세지 않는다.
 * 대문자 트래킹 대신 자간만 벌린다(한글이 섞이므로 `text-transform` 은 쓸 수 없다).
 */
export const TH = styled.th<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  background: ${color.surfaceSunken};
  padding: ${space[2]} ${space[3]};
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
  letter-spacing: 0.04em;

  &:first-of-type {
    border-radius: ${radius.sm} 0 0 ${radius.sm};
    padding-left: ${space[3]};
  }

  &:last-of-type {
    border-radius: 0 ${radius.sm} ${radius.sm} 0;
  }
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
  height: auto;
  width: auto;
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

/** 행 이름 셀(`<th scope="row">`) — 심볼 + 이름 + 배지 + 비중. 카드 모드에서는 전 폭을 차지한다. */
export const RowHeader = styled.th`
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[3]};
  font-weight: ${font.weight.regular};

  ${container.down('tablet')} {
    height: auto;
    padding: 0 ${space[6]} ${space[2]} 0;
    border-bottom: 1px solid ${color.border};
  }

  ${media.down('tablet')} {
    height: auto;
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
 * 🔴 **종목의 색 귀.** `assignSeries` 가 배정한 값이 이 세로 막대 · 아래 비중 막대 · 요약 카드의
 * 도넛 조각 **셋 모두**에 들어간다 — 같은 종목이 화면 어디서나 같은 색이라는 것이 이번 개편의 약속이다.
 *
 * 폭 4px · 높이 20px 이라 `tintscan` 의 면 판정(폭 ≥180px)에 걸리지 않는다(L1 파생 — 개수 제한 없음).
 * ⚠ 색은 결코 단독 채널이 아니다: 바로 오른쪽에 심볼 글자가 같은 종목을 말하고, 비중은 숫자로도 적힌다.
 */
export const TickerEar = styled.span`
  flex: 0 0 auto;
  width: 4px;
  height: 20px;
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
  flex: 0 1 auto;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TD = styled.td<{ $align?: 'left' | 'right' }>`
  text-align: ${({ $align }) => $align ?? 'right'};
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[3]};
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric}

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;

/**
 * 연 배당(세후) 셀 — 표에서 **가장 진한 숫자**다.
 *
 * 이 앱의 주제가 배당이라 표도 그렇게 읽혀야 한다. 종전에는 네 열이 전부 같은 무게였고,
 * 그 결과 표가 "무엇이 중요한가"를 아무 것도 말하지 않았다. 색이 아니라 **굵기와 잉크 농도**로만
 * 가른다(숫자에 색 금지 규칙은 그대로다).
 */
export const IncomeCell = styled(TD)`
  color: ${color.text};
  font-weight: ${font.weight.bold};
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
 * 행의 비중 한 줄 — **막대 + 숫자**. 막대는 장식(`aria-hidden`)이고 숫자가 사실을 말한다.
 *
 * 높이 6px · 폭 120px 라 `tintscan` 의 면 판정(폭 ≥180 **AND** 높이 ≥8)을 두 축 모두에서 못 넘는다.
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
  width: 120px;
  height: 6px;
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
  vertical-align: middle;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  width: 1%;

  ${container.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    height: auto;
    width: auto;
    padding: 0;
    border-bottom: 0;
  }

  ${media.down('tablet')} {
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    height: auto;
    width: auto;
    padding: 0;
    border-bottom: 0;
  }
`;
