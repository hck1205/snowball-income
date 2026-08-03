import styled from '@emotion/styled';
import {
  appHeaderHeight,
  cardElevation,
  color,
  font,
  media,
  radius,
  space,
  subtleScrollbar
} from '@/shared/styles';

/**
 * 조항 한 개의 모양 — **카드가 아니라 문서다.**
 *
 * 예전에는 절마다 테두리 카드였다. 열네 장이 세로로 쌓이면 어느 것도 다른 것보다 중요해 보이지 않고
 * (모두 같은 무게), 카드 패딩이 줄마다 리듬을 끊어 긴 글을 읽는 눈이 매번 다시 출발했다. 카드는
 * "고르는 것"의 형태이고 여기서는 고를 것이 없다. 그래서 형태 언어를 바꿨다:
 *
 *  - 절 사이는 **테두리가 아니라 헤어라인 한 줄 + 큰 여백**으로 가른다.
 *  - 조항 번호는 제목 안에 묻지 않고 **왼쪽 기둥**(`CLAUSE_GUTTER`)에 세운다. 본문도 같은 기둥만큼
 *    들여써서, 스크롤 중 어느 위치에서도 "번호 열"이 하나의 세로선으로 읽힌다.
 *  - 부속(표·정의 목록)만 **자기 상자**를 갖는다 — 본문이 아니라 부속이라는 뜻을 형태로 말한다.
 *
 * 타이포 대비도 다시 벌렸다. 이전에는 제목 14px / 본문 13px 로 **거의 같은 크기**여서 위계가 없었다.
 * 지금은 제목 18~24px(display) / 본문 15px / 캡션 12px 이고, 본문 행간은 1.6 → 1.8 이다.
 *
 * ## 🔴 2026-08-03 — 부속의 상자를 "면"에서 "경계"로 옮겼다 (흰 캔버스 전환)
 * 종전에는 표와 정의 목록이 둘 다 `cardElevation('sunken')`(= `surface-sunken` 통면)이었다.
 * 라이트 캔버스가 순백이 되면서 그 처방이 **표 안에서 무너졌다**(2026-08-03 브라우저 실측,
 * `/privacy` velog 라이트):
 *
 * ```
 *   상자(scroller)  surface-sunken  #f1f3f5
 *   열 머리(th)     surface-muted   #f8f9fa   ← 상자보다 **밝다**. 위계가 뒤집혔다
 *   얼룩 줄(even)   surface-hover   #f1f3f5   ← 상자와 **같은 값**. 대비 1.000:1 = 얼룩 소멸
 * ```
 *
 * 원인은 하나다 — **상자가 면 사다리의 한 칸을 먹어 버린다.** 흰 캔버스의 중립 사다리는
 * `surface`(흰) → `surface-muted` → `surface-sunken` 세 칸뿐인데 표는 세 칸을 다 쓴다
 * (본문 줄 · 얼룩 줄 · 열 머리). 상자까지 면으로 세우면 남는 칸이 없다.
 *
 * 그래서 상자는 **1px 헤어라인**으로 서고(`cardElevation('base')`), 면은 상자 **안쪽**에만 쓴다.
 * 이 앱의 흰 캔버스 원칙("격을 말하는 채널을 면색 → 경계·여백으로 옮긴다",
 * `shared/styles/surfaces.ts` 머리말)을 부속에 그대로 적용한 것이다.
 *
 * 정의 목록도 같은 처방으로 맞췄다 — 같은 문서에서 나란히 서는 두 부속이 서로 다른 언어로
 * 말하면 사용자는 그 차이를 "성격이 다른 블록"으로 잘못 읽는다.
 *
 * 🔴 상자를 다시 `sunken` 으로 되돌리지 마라. 되돌리는 순간 위 표의 세 값이 다시 두 칸으로
 *    눌리고, 그때 잃는 것은 색이 아니라 **열 머리와 얼룩 줄이라는 두 개의 읽기 장치**다.
 */

/** 번호 기둥의 폭. 본문 들여쓰기와 **같은 값**이어야 번호 열이 세로선으로 읽힌다. */
const CLAUSE_GUTTER = 'clamp(56px, 6vw, 76px)';

/** 조문은 한 줄이 길어질수록 줄을 놓친다. 15px 기준 한 줄 45자 안팎이 되는 폭. */
const PROSE_WIDTH = '780px';

/**
 * 장문 행간. `font.leading.relaxed`(1.6)는 카드 안 짧은 문장 기준이라 이 길이의 글에는 촘촘하다.
 * 토큰을 늘리지 않고 이 파일에서만 쓰는 이유 — 이 값이 맞는 자리가 앱에 여기뿐이다.
 */
const PROSE_LEADING = '1.8';

export const ClauseRoot = styled.section<{ $first: boolean }>`
  display: grid;
  gap: clamp(14px, 2vw, 20px);
  min-width: 0;
  padding-top: ${({ $first }) => ($first ? '0' : 'clamp(32px, 5vw, 56px)')};
  border-top: ${({ $first }) => ($first ? 'none' : `1px solid ${color.border}`)};
`;

/**
 * 조항 제목.
 *
 * 🔴 이 요소의 **텍스트가 곧 그 절의 접근성 이름**이다(`ClauseRoot` 의 `aria-labelledby` 가 가리킨다).
 *    번호와 제목을 자식 span 으로 나눠도 원문 공백을 그대로 두면 이름은 변하지 않는다 —
 *    `pages/Legal/utils/legalHeading.ts` 가 그 공백까지 돌려주는 이유다.
 *
 * `tabIndex={-1}` 을 받으므로 초점 링이 제목에 바짝 붙지 않게 offset 을 준다(목차에서 넘어온 직후).
 */
export const ClauseHeading = styled.h2`
  margin: 0;
  min-width: 0;
  /* 목차에서 넘어왔을 때 sticky 헤더가 제목을 먹지 않게. */
  scroll-margin-top: calc(${appHeaderHeight} + 24px);
  outline-offset: 6px;
  font-family: ${font.display};
  /* 하한이 2xl(20px)인 이유 — 390px 에서 본문이 15px 이라 xl(18px)로 두면 대비가 1.2배뿐이다(위계가 안 선다). */
  font-size: clamp(${font.size['2xl']}, 2.4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;

  /*
   * 🔴 번호가 없는 절(개요·부칙)에도 **같은 격자를 건다.** 번호가 있을 때만 격자를 켜면 그 절의
   * 제목만 기둥 폭만큼 왼쪽으로 튀어나와, 열다섯 개 제목 중 하나가 열에서 벗어난다(실측 확인).
   * 번호가 없으면 제목이 둘째 열로 들어간다 — 아래 ClauseLabel 의 $inset.
   */
  ${media.up('tabletSm')} {
    display: grid;
    grid-template-columns: ${CLAUSE_GUTTER} minmax(0, 1fr);
    align-items: baseline;
  }
`;

/**
 * 조항 번호. 좁은 폭에서는 제목 **위 줄**에 서고, 기둥이 생기는 폭부터 왼쪽 열로 들어간다.
 * 숫자 서체 + tabular 라 1~14 가 세로로 정렬된다.
 */
export const ClauseOrdinal = styled.span`
  display: block;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
  color: ${color.accentText};
  ${font.numeric}

  ${media.up('tabletSm')} {
    font-size: ${font.size.base};
  }
`;

/** `$inset` = 번호가 없어 첫 열이 비는 경우. 제목을 둘째 열로 밀어 번호 있는 절과 열을 맞춘다. */
export const ClauseLabel = styled.span<{ $inset: boolean }>`
  display: block;
  min-width: 0;

  ${media.up('tabletSm')} {
    grid-column: ${({ $inset }) => ($inset ? '2 / -1' : 'auto')};
  }
`;

export const ClauseBody = styled.div`
  display: grid;
  gap: clamp(14px, 2vw, 20px);
  min-width: 0;

  ${media.up('tabletSm')} {
    padding-left: ${CLAUSE_GUTTER};
  }
`;

export const Paragraph = styled.p`
  margin: 0;
  max-width: ${PROSE_WIDTH};
  font-size: ${font.size.md};
  line-height: ${PROSE_LEADING};
  color: ${color.textSecondary};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 목록. 기본 `disc` 를 쓰지 않는다 — 브라우저 기본 불릿은 들여쓰기가 서체마다 달라 두 번째 줄이
 * 첫 줄 아래로 되돌아온다(행잉 인덴트가 깨진다). 표식을 직접 그리고 padding 으로 걸어 둔다.
 */
export const List = styled.ul`
  display: grid;
  gap: clamp(10px, 1.4vw, 14px);
  margin: 0;
  padding: 0;
  max-width: ${PROSE_WIDTH};
  list-style: none;
`;

export const ListItem = styled.li`
  position: relative;
  padding-left: 26px;
  font-size: ${font.size.md};
  line-height: ${PROSE_LEADING};
  color: ${color.textSecondary};
  word-break: keep-all;
  overflow-wrap: anywhere;

  &::before {
    content: '';
    position: absolute;
    left: 6px;
    /* 첫 줄 글자의 세로 중앙 — 행간 1.8 의 절반에서 표식 반지름을 뺀 값. */
    top: calc(0.9em - 3px);
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: ${color.accent};
    opacity: 0.5;
  }
`;

/**
 * 정의 목록(보호책임자·용어). 본문과 달리 **자기 상자를 갖는다** — "읽어 내려가는 글"이 아니라
 * "찾아보는 값"이기 때문이다. 좁은 폭에서는 이름 위·값 아래 두 줄, 넓어지면 두 열이 된다.
 *
 * 상자는 면이 아니라 헤어라인이다(위 머리말의 2026-08-03 항 참고). 행 사이 구분선은 아래
 * `DefinitionRow` 가 이미 갖고 있어, 흰 면 위에서도 "묶여 있는 값들"로 읽힌다.
 */
export const DefinitionList = styled.dl`
  display: grid;
  margin: 0;
  max-width: ${PROSE_WIDTH};
  border-radius: ${radius.lg};
  overflow: hidden;
  ${cardElevation('base')}
`;

export const DefinitionRow = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
  padding: clamp(14px, 2vw, 18px) clamp(16px, 2vw, 20px);

  & + & {
    border-top: 1px solid ${color.border};
  }

  ${media.up('mobile')} {
    grid-template-columns: 132px minmax(0, 1fr);
    gap: ${space[4]};
    align-items: baseline;
  }
`;

export const DefinitionTerm = styled.dt`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.text};
`;

export const DefinitionDescription = styled.dd`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 표는 좁은 화면에서 줄바꿈만으로는 읽히지 않는다(국외 이전 표는 열이 일곱이고 값이 길다).
 * 그래서 가로 스크롤 컨테이너로 감싸되, 키보드로도 스크롤할 수 있도록 tabIndex 를 준다
 * (스크롤 가능한 영역에 포커스가 없으면 키보드 사용자는 잘린 열을 볼 방법이 없다).
 *
 * 포커스 링은 전역 focus-visible 규칙이 그린다 — 여기서 재정의하지 않는다.
 *
 * ⚠ 본문 `PROSE_WIDTH` 를 걸지 않는다. 표는 읽기 폭 규칙의 대상이 아니라 **가능한 넓게** 펴져야
 *   스크롤 거리가 줄어든다.
 */
export const TableScroller = styled.div`
  overflow-x: auto;
  border-radius: ${radius.lg};
  ${cardElevation('base')}
  ${subtleScrollbar}
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const TableCaption = styled.caption`
  padding: clamp(14px, 2vw, 18px) clamp(16px, 2vw, 20px);
  border-bottom: 1px solid ${color.border};
  text-align: left;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/**
 * 열 머리 — 표 안에서 **가장 가라앉은 칸**이다.
 *
 * 🔴 `surface-muted` 가 아니라 `surface-sunken` 이다(2026-08-03). 상자가 `sunken` 통면이던 시절에는
 * 머리가 상자보다 **밝은** `muted` 여서 "들어간 자리"가 거꾸로 튀어나와 보였다. 상자가 흰 면이 된
 * 지금은 사다리가 바로 선다: 본문 줄(흰) < 얼룩 줄(muted) < 열 머리(sunken).
 * 8프리셋 라이트 전부에서 이 순서가 단조다(muted 가 sunken 보다 항상 밝다 — presets/*.ts 실측).
 */
export const TableHeaderCell = styled.th`
  padding: ${space[3]} ${space[4]};
  border-bottom: 1px solid ${color.borderStrong};
  background: ${color.surfaceSunken};
  text-align: left;
  white-space: nowrap;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.text};
`;

/**
 * 얼룩 줄. 일곱 열짜리 표에서 가로로 눈이 미끄러지는 것을 막는 **두 번째** 장치다
 * (첫 번째는 `TableCell` 의 행마다 1px 구분선 — 흰 면 위 1.44~1.49:1 로 이제 확실히 보인다).
 *
 * 🔴 `surface-hover` 가 아니라 `surface-muted` 다(2026-08-03). velog 라이트에서
 * `surface-hover` 는 `surface-sunken` 과 **같은 값**(#f1f3f5)이라, 열 머리와 얼룩 줄이 한 색이 된다.
 * `muted` 는 8프리셋 전부에서 흰 본문 줄과 sunken 머리 **사이**에 있는 유일한 칸이다.
 */
export const TableRow = styled.tr`
  &:nth-of-type(even) {
    background: ${color.surfaceMuted};
  }
`;

export const TableCell = styled.td`
  padding: ${space[3]} ${space[4]};
  border-top: 1px solid ${color.border};
  vertical-align: top;
  min-width: 132px;
  word-break: keep-all;
  overflow-wrap: anywhere;

  &:first-of-type {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;
