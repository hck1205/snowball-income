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

export const RankTable = styled.table`
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;

  /*
   * 🔴 좁은 폭에서는 하한을 **풀고 여백도 조인다.** 막대 열을 숨겨 놓고 min-width 460px 을 그대로
   * 두면 표가 여전히 460px 을 요구해 390px 화면에서 금액 열이 가로 스크롤 뒤로 숨었다
   * (2026-08-03 실측: 스크롤러 366px < 표 460px). 열을 버리는 목적은 **스크롤을 없애는 것**이지
   * 줄이는 것이 아니다. 지금은 390px 에서 네 열이 그대로 보인다(320px 은 여전히 스크롤한다 —
   * 그 폭에서는 이 레포의 다른 표도 같은 처지라 표를 더 깎지 않는다).
   */
  ${media.down('mobileWide')} {
    min-width: 0;

    th,
    td {
      padding-left: ${space[2]};
      padding-right: ${space[2]};
    }
  }
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

/** 좁은 폭에서는 막대 열을 접는다 — 표를 가로로 밀게 만드느니 장식을 먼저 버린다. */
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
