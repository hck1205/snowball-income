import styled from '@emotion/styled';
import { color, font, media, space, subtleScrollbar } from '@/shared/styles';

/* ── ② 합의 보드 — 4위 이하 순위표 (data 면) ───────────────────────────────── */
/* 같은 섹션의 상위 3종 시상대는 `podium.ts` 에 있다. */

/**
 * 4위 이하 — **표**다. 시상대와 같은 카드로 열 줄을 세우면 스크롤만 길어지고, 순위 하위권에서
 * 사람들이 하는 일은 "훑어 읽기"라 행 높이가 낮은 표가 맞다.
 */
export const RankTableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  ${subtleScrollbar}
`;

/**
 * 좁은 폭에서 표가 요구하는 최소 폭.
 *
 * 🔴 **일부러 화면보다 넓다**(2026-08-07 사용자 지시: "모바일에선 스크롤이 생겨서 잘 보여줬으면").
 * 종전에는 여기가 `min-width: 0` 이었다 — 표를 390px 안에 우겨넣어 스크롤을 없애는 처방이었는데,
 * 그러면 담은 사람 칩 줄과 금액이 서로를 밀어 **어느 칸도 제대로 안 보인다**. 좁은 화면에서
 * 정보를 지키는 길은 눌러 담는 것이 아니라 **가로로 미는 것**이고, 그때 잃는 맥락("이게 어느
 * 종목 줄이지?")은 아래 고정 열이 되돌려준다.
 *
 * 값의 근거: 순위 44 + 종목 120 + 담은 사람 ~200(칩 4~6개) + 금액 90 ≈ 454 → 여유를 얹어 480.
 */
const MOBILE_MIN_WIDTH = '480px';

/** 고정되는 두 열(순위·종목)의 폭. 종목 열이 `left` 를 잡으려면 순위 열 폭이 **상수**여야 한다. */
const RANK_INDEX_WIDTH = '44px';
const RANK_TICKER_WIDTH = '116px';

export const RankTable = styled.table`
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;

  ${media.down('mobileWide')} {
    min-width: ${MOBILE_MIN_WIDTH};

    th,
    td {
      padding-left: ${space[2]};
      padding-right: ${space[2]};
    }
  }
`;

/**
 * 가로로 미는 동안 **제자리에 남는 열**의 공통 규칙(2026-08-07).
 *
 * 🔴 `background` 가 반드시 있어야 한다. 고정 칸은 다른 칸 **위로** 지나가는데, 배경이 없으면
 * 밀려오는 글자가 그 밑에서 그대로 비쳐 두 줄이 겹쳐 보인다.
 * 🔴 경계선을 `border-right` 가 아니라 `box-shadow: inset` 으로 그린다 — 이 표는
 * `border-collapse: collapse` 라 테두리의 주인이 표이고, 고정된 칸의 border 는 함께 밀려간다.
 * ⚠ 넓은 폭에서는 고정하지 않는다. 스크롤이 없으므로 붙일 이유가 없고, 그림자만 남아 없는
 *   경계선이 그려진다.
 */
const stickyColumn = `
  position: sticky;
  z-index: 1;
  background: ${color.surface};
`;

export const RankTh = styled.th`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-align: left;
  white-space: nowrap;
`;

export const RankThNumeric = styled(RankTh)`
  text-align: right;
`;

/** 순위 열 — 맨 왼쪽에 붙는다. 머리와 값이 **같은 폭·같은 left** 를 써야 열이 어긋나지 않는다. */
export const RankThIndex = styled(RankTh)`
  ${media.down('mobileWide')} {
    ${stickyColumn};
    left: 0;
    width: ${RANK_INDEX_WIDTH};
    min-width: ${RANK_INDEX_WIDTH};
    text-align: right;
  }
`;

/**
 * 종목 열 — 순위 열 **바로 오른쪽**에 붙는다.
 * 🔴 사용자가 고정을 요구한 칸이 여기다(2026-08-07): 가로로 밀었을 때 "지금 보는 금액이 어느
 *    종목 것인지"를 잃지 않게 하는 것이 이 열의 유일한 일이다.
 */
export const RankThTicker = styled(RankTh)`
  ${media.down('mobileWide')} {
    ${stickyColumn};
    left: ${RANK_INDEX_WIDTH};
    width: ${RANK_TICKER_WIDTH};
    min-width: ${RANK_TICKER_WIDTH};
    box-shadow: inset -1px 0 ${color.border};
  }
`;

/**
 * 좁은 폭에서는 막대 열을 접는다.
 *
 * ⚠ 근거가 2026-08-07 에 바뀌었다. 종전에는 "표를 가로로 밀게 만드느니 장식을 먼저 버린다" 였는데,
 * 이제 이 표는 좁은 폭에서 **일부러 가로로 민다**. 그래도 막대를 접는 이유는 남는다 — 막대는
 * 금액을 그림으로 다시 말하는 장식이고, 손가락으로 미는 거리를 그 장식에 쓰게 하지 않는다.
 * 같은 비율은 바로 위 시상대가 이미 막대로 보여 준다.
 */
export const RankThBar = styled(RankTh)`
  width: 26%;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

export const RankRow = styled.tr`
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: ${color.surfaceHover};
  }
`;

export const RankTd = styled.td`
  padding: ${space[3]};
  color: ${color.text};
  vertical-align: middle;
`;

/** 종목 값 칸. 위 `RankThTicker` 와 **같은 폭·같은 left** 를 쓴다 — 한쪽만 고치면 열이 어긋난다. */
export const RankTdTicker = styled(RankTd)`
  ${media.down('mobileWide')} {
    ${stickyColumn};
    left: ${RANK_INDEX_WIDTH};
    width: ${RANK_TICKER_WIDTH};
    min-width: ${RANK_TICKER_WIDTH};
    max-width: ${RANK_TICKER_WIDTH};
    box-shadow: inset -1px 0 ${color.border};
  }
`;

export const RankTdNumeric = styled(RankTd)`
  text-align: right;
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const RankTdBar = styled(RankTd)`
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 순위 칸. 표에서는 숫자만 두어도 열머리가 뜻을 말한다 — 원 배지를 겹치지 않는다. */
export const RankIndex = styled.td`
  padding: ${space[3]};
  width: 1%;
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  text-align: right;
  white-space: nowrap;
  ${font.numeric}

  ${media.down('mobileWide')} {
    ${stickyColumn};
    left: 0;
    width: ${RANK_INDEX_WIDTH};
    min-width: ${RANK_INDEX_WIDTH};
  }
`;

export const RankName = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-weight: ${font.weight.bold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RankKorean = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;
