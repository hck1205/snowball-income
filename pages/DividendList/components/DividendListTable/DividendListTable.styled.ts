import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, container, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 정렬 가능한 목록 표.
 *
 * 🔴 공용 `DataTable` 을 쓰지 않은 이유: 그 부품의 열 헤더는 **문자열**이라 정렬 버튼을 얹을 자리가
 * 없다(`components/common/DataTable/DataTable.types.ts` 의 `header: string`). 공용 부품에 정렬을
 * 넣는 것은 15곳 넘는 소비처를 건드리는 별건이라, 이 화면 안에 두고 **조판 언어만** 맞춘다
 * (좁은 폭에서 행 카드로 접는 규칙·스크롤바·서체가 DataTable 과 같은 토큰이다).
 */
/**
 * ⚠ 이 상자는 `overflow-x: auto` 라 **스크롤포트**다. 여기 자식에 `position: sticky` 로 열 머리를
 * 붙이려 하지 마라 — CSS 는 한 축이 `auto` 면 다른 축의 `visible` 을 `auto` 로 계산해서, sticky 가
 * 페이지가 아니라 이 상자를 기준으로 잡고 **영영 안 붙는다**(비교표에서 실측한 함정:
 * `test/ticker/tickerCompareStickyHead.test.ts` 머리말, 스크롤 후 머리 top −191px).
 * 이 표는 좁은 폭에서 가로 스크롤이 남으므로 머리 고정을 아예 시도하지 않는다.
 */
export const TableWrap = styled.div`
  overflow-x: auto;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  overscroll-behavior-x: contain;
  /* 표는 넘칠 때 스크롤바가 보여야 한다 — 넘친다는 사실 자체가 정보다. */
  ${subtleScrollbar}
`;

/* 좁은 폭에서는 행을 카드로 접는다. DataTable 과 같은 규칙·같은 중단점. */
const stackedTable = `
  display: block;
  min-width: 0;

  /*
   * ⚠ 표가 block 이 되면 caption(display: table-caption)만 익명 표 상자에 남아 **shrink-to-fit**
   * 으로 줄어든다 — 390px 실측에서 "종목 목록 (기준일 2026-08-03)"이 폭 50px 남짓한 기둥으로 접혔다.
   * 🔴 그 caption 이 이 표의 **기준일**을 말하는 유일한 자리라 읽히지 않으면 목록이 "지금 기준"이 된다.
   */
  caption {
    display: block;
  }

  thead {
    display: none;
  }

  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr {
    display: block;
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    padding: ${space[1]} ${space[3]};
    background: ${color.surfaceMuted};
  }

  tbody tr:hover {
    background: ${color.surfaceMuted};
  }
`;

/*
 * 🔴 `min-width` 이력: 열 넷 640 → 일곱 900 → **여섯 720**(2026-08-04, "확인한 자료" 열 제거).
 *
 * 실측 근거 (Chrome · uiprobe @1280, `max-content` 로 재 본 표의 **자연 폭**):
 * ```
 *   배당킹 611 · 배당귀족 617 · 배당챔피언 702      ← 열이 일곱일 때는 각각 881 · 808 · 868 이었다
 * ```
 * 720 은 최댓값 702 를 덮는 가장 가까운 값이다.
 *
 * ⚠ 이 값은 이제 **거의 발동하지 않는 바닥 가드**다. 표 모드는 컨테이너가 820 을 넘을 때만 존재하고
 *   (그 이하는 아래 `stackedTable` 이 행 카드로 접으며 `min-width: 0` 으로 되돌린다), 자연 폭
 *   최댓값 702 는 820 보다 작기 때문이다. 900 이던 시절에는 그 사이 구간이 통째로 가로 스크롤이었다 —
 *   실측: 뷰포트 880(표 상자 830)에서 **70px** 이 옆으로 밀렸다. 열을 하나 걷어 그 구간이 사라졌다.
 * ⚠ 열을 더하면 자연 폭이 다시 820 을 넘을 수 있다. 그때는 `npm run uiprobe -- --url
 *   http://localhost:5173/dividend/champions --width 1280,880,390 --overflow` 로 다시 재라.
 */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  /* 720 은 여섯 열(자연 폭 최댓값 702)의 바닥 가드였다. 비교 체크박스 열(≈40px)이 앞에 붙어
     760 으로 올린다 — 여전히 stackedTable 발동선(container 820)보다 낮아 표 모드에서 스크롤을
     새로 만들지 않는다. 열을 더 더하면 위 stackedTable 주석의 uiprobe 로 자연 폭을 다시 재라. */
  min-width: 760px;
  font-size: ${font.size.sm};

  caption {
    caption-side: top;
    text-align: left;
    padding: 0 0 ${space[2]};
    color: ${color.textMuted};
    font-size: ${font.size.xs};
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

export const TH = styled.th`
  text-align: left;
  border-bottom: 1px solid ${color.borderStrong};
  padding: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  letter-spacing: 0.02em;

  ${container.down('tablet')} {
    display: none;
  }

  ${media.down('tablet')} {
    display: none;
  }
`;

/**
 * 정렬 버튼 = 헤더 셀 전체. 작은 화살표만 누르게 하면 손가락으로 못 맞춘다.
 * ⚠ 활성 표시는 색만으로 하지 않는다 — 화살표 글리프가 방향을 함께 말하고,
 *   `aria-sort` 가 스크린리더에 같은 사실을 전달한다(`DividendListTable.tsx`).
 */
export const SortButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  width: 100%;
  padding: ${space[2]};
  border: 0;
  background: none;
  cursor: pointer;
  color: ${(props) => (props.$active ? color.text : color.textMuted)};
  font: inherit;
  font-weight: ${font.weight.semibold};
  letter-spacing: inherit;
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

/** 정렬 방향 글리프. 비활성 열에서도 자리를 차지해 헤더 폭이 클릭할 때마다 흔들리지 않게 한다. */
export const SortGlyph = styled.span<{ $active: boolean }>`
  width: 10px;
  text-align: center;
  font-size: ${font.size.xs};
  opacity: ${(props) => (props.$active ? 1 : 0.35)};
`;

/*
 * 🔴 라벨 칸이 `auto`(제 폭)이고 값 칸이 나머지를 먹는다. 반대로(라벨 1fr · 값 auto) 두면 값이
 * 제 최대폭을 먼저 가져가 라벨이 눌리고, 라벨을 nowrap 으로 지키면 이번엔 둘이 **겹쳐** 그려진다
 * (390px 실측: 지금은 없어진 "확인한 자료" 칸에서 "stockanalysis.com" 이 라벨 위로 올라탔다).
 * ⚠ 그 열이 사라졌다고 이 규칙을 되돌리지 마라 — 종목명("West Pharmaceutical Services, I")이
 *   같은 자리에서 같은 일을 한다. 접혀야 하는 쪽은 언제나 값이다.
 */
const stackedCell = `
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  /*
   * 값은 제 폭만큼만 차지하고 오른쪽에 붙는다. 기본값(stretch)이면 섹터 태그 같은 알약이
   * 칸 전체로 늘어나 태그가 아니라 입력창처럼 보인다(390px 실측에서 실제로 그랬다).
   */
  justify-items: end;
  gap: ${space[3]};
  text-align: right;
  padding: ${space[2]} ${space[1]};
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &::before {
    content: attr(data-label);
    justify-self: start;
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
    /*
     * 🔴 라벨은 절대 접지 않는다. 값 칸이 길면(옛 "확인한 자료" = "stockanalysis.com · DRiP
     * Investing Resource Center") 1fr 라벨 칸이 먼저 눌려 390px 실측에서 "확인 / 한 자 / 료"
     * 세 줄이 됐다. 접혀야 하는 건 라벨이 아니라 값이다 — 라벨은 그 줄이 무엇인지 말하는 유일한 단서다.
     */
    white-space: nowrap;
  }
`;

export const TD = styled.td`
  text-align: left;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;

/**
 * 비교 담기 열(기획서 연결①).
 *
 * 🔴 정렬 축이 아니라 `TH`(버튼 없음)로 세운다 — `TH` 는 padding 0 이라(정렬 버튼이 자기 padding 을
 * 대던 자리) 라벨이 셀 벽에 붙는다. 그래서 여기만 padding 을 직접 준다.
 * `width: 1%` + `nowrap` 은 표에서 "내용만큼만" 차지하게 하는 관례다 — 체크박스 한 칸이 열을 넓히지 않는다.
 */
export const CompareTH = styled(TH)`
  width: 1%;
  padding: ${space[2]};
  white-space: nowrap;
`;

/** 비교 담기 칸. 넓은 폭에선 가운데, 좁은 폭(stackedCell)에선 `data-label` "비교" + 체크박스 우측 정렬. */
export const CompareCell = styled(TD)`
  width: 1%;
  white-space: nowrap;
  text-align: center;
`;

/** 티커 셀 — 숫자·기호가 섞인 짧은 문자열이라 데이터 서체로 세운다. */
export const TickerCell = styled(TD)`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const TickerLink = styled(Link)`
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

/**
 * 숫자 열(배당률·연속 증배·5년 배당성장). 넓은 폭에서만 오른쪽 정렬한다 —
 * 좁은 폭의 행 카드에서는 `stackedCell` 이 이미 라벨/값 2단으로 값을 오른쪽에 세운다.
 * (자릿수 정렬(tabular-nums)은 전역 스타일이 모든 `td` 에 이미 걸어 둔다.)
 */
export const NumberCell = styled(TD)`
  text-align: right;
  white-space: nowrap;
`;

/** 열 머리도 숫자 열은 오른쪽으로 — 머리와 값의 축이 어긋나면 표가 흔들려 보인다. */
export const NumberTH = styled(TH)`
  text-align: right;

  button,
  span {
    justify-content: flex-end;
  }
`;

/**
 * 성장률 값.
 *
 * 🔴 **색은 보조 채널이다.** 부호(`+`/`-`)가 텍스트로 먼저 말하고 색은 그 위에 얹힐 뿐이다 —
 * 색각 이상·흑백 인쇄·고대비 모드 어디서도 부호가 사라지지 않아야 한다(이 레포 공통 규율).
 * 그래서 `formatChangePercent` 가 만든 문자열을 그대로 쓰고, 여기서 부호를 떼지 않는다.
 */
export const GrowthValue = styled.span<{ $direction: 'up' | 'down' | 'flat' }>`
  color: ${(props) =>
    props.$direction === 'up'
      ? color.dataPositive
      : props.$direction === 'down'
        ? color.dataNegative
        : color.text};
  font-weight: ${font.weight.medium};
`;

/**
 * 연속 증배 값. 🔴 **정확값과 하한을 눈으로 구분한다** — 하한은 점선 밑줄 + "이상" 한정어를 달고,
 * 정확값은 아무 장식 없이 선다. 같은 모양으로 그리면 "50년"이 우리가 센 값으로 읽힌다.
 */
export const StreakValue = styled.span<{ $exact: boolean }>`
  color: ${(props) => (props.$exact ? color.text : color.textSecondary)};
  font-weight: ${(props) => (props.$exact ? font.weight.semibold : font.weight.regular)};
  border-bottom: ${(props) => (props.$exact ? '0' : `1px dotted ${color.border}`)};
`;

/** "이상" 한정어. 숫자보다 작고 흐리게 — 값의 일부지만 값 자체는 아니다. */
export const StreakQualifier = styled.span`
  margin-left: 2px;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 값이 없는 칸.
 *
 * 🔴 "0" 이나 "없음"으로 읽히면 안 된다. 그래서 세 가지를 동시에 한다:
 *  ① 기호는 숫자가 아닌 em dash 하나, ② 이유를 `title` 로 달아 마우스가 읽게, ③ 같은 이유를
 *  화면에 안 보이는 텍스트로 남겨 스크린리더가 읽게. `aria-label` 만 쓰면 역할 없는 span 에서는
 *  보조기술이 무시할 수 있어 실제 텍스트로 둔다.
 */
export const UnknownMark = styled.span`
  color: ${color.textMuted};
  /* 점선 밑줄이 "값이 없다"가 우연이 아니라 표시라는 신호다. 커서도 물음표로 바꾼다. */
  border-bottom: 1px dotted ${color.border};
  cursor: help;
`;

/** 화면에서만 감춘다(보조기술은 읽는다). `display: none` 이면 스크린리더도 못 읽는다. */
export const ScreenReaderOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
`;

export const SectorTag = styled.span`
  display: inline-block;
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  white-space: nowrap;
`;

export const EmptyRowCell = styled.td`
  padding: ${space[6]} ${space[2]};
  text-align: center;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
