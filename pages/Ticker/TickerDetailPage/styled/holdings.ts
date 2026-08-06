import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';

/* ── 상위 보유 종목 (신설) ──────────────────────────────────────────────────── */

/**
 * 상위 보유 종목 표 — **서버 렌더 HTML 에는 있었는데 화면에는 없던 블록**이다
 * (`server/handlers/TickerHtml` 의 renderTopHoldings). 크롤러만 보던 정보를 사람도 보게 한다.
 *
 * 막대는 최대 비중을 100 으로 정규화한 **상대 길이**다(뷰모델이 계산한다). 칸 폭이 좁아
 * 180px 를 넘지 않으므로 tintscan 의 면 판정에 걸리지 않는다.
 */
export const HoldingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.base};

  caption {
    caption-side: top;
    text-align: left;
    padding-bottom: ${space[2]};
    font-size: ${font.size.xs};
    color: ${color.textMuted};
  }

  th,
  td {
    padding: ${space[3]} ${space[2]};
    border-bottom: 1px solid ${color.border};
    text-align: left;
    vertical-align: middle;
  }

  thead th {
    padding-top: 0;
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.bold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${color.textMuted};
    border-bottom: 1px solid ${color.borderStrong};
  }

  tfoot td {
    border-bottom: none;
    border-top: 1px solid ${color.borderStrong};
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }

  /*
   * 🔴 좁은 폭에서는 **고정 칸을 줄여 종목명에 폭을 돌려준다.**
   * 실측(390px, DGRO): 순위 36 + 티커 88 + 비중 148 = 272px 이 고정이라 종목명에 94px 만 남아
   * 행 높이가 88px(세 줄)까지 부풀었다 — 20행이면 표 하나가 1,760px 다.
   * 좌우 패딩과 고정 칸을 줄이면 같은 20행이 눈에 띄게 짧아진다(값·막대는 그대로 남는다).
   */
  ${media.down('mobileWide')} {
    font-size: ${font.size.sm};

    th,
    td {
      padding: ${space[2]} ${space[1]};
    }
  }
`;

export const HoldingRank = styled.td`
  width: 36px;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  ${font.numeric};

  ${media.down('mobileWide')} {
    width: 24px;
  }
`;

export const HoldingSymbol = styled.td`
  width: 88px;
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};

  ${media.down('mobileWide')} {
    width: 62px;
  }
`;

export const HoldingName = styled.td`
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/** 비중 칸 — 숫자와 막대가 한 칸 안에 함께 선다(막대만 있으면 값을 못 읽는다). */
export const HoldingWeight = styled.td`
  width: 148px;
  text-align: right;

  ${media.down('mobileWide')} {
    width: 88px;
  }
`;

export const HoldingWeightValue = styled.span`
  display: block;
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 비중 막대 트랙. 높이 6px 이라 면이 아니라 선으로 남는다(radiusShape §② — 반경 없음).
 *
 * 🔴 막대는 **오른쪽에 앵커**된다. 위 숫자가 우측정렬(tabular)이므로 막대가 왼쪽에서 자라면
 * 한 칸 안에 축이 둘이 생겨 눈이 두 번 움직인다. 오른쪽 끝을 공유하면 숫자와 막대가 같은 세로선
 * 위에 서고, 길이 차이만 남는다.
 */
export const HoldingBar = styled.span`
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  height: 6px;
  background: ${color.progressTrack};
  overflow: hidden;
`;

export const HoldingBarFill = styled.span<{ $percent: number }>`
  display: block;
  height: 100%;
  flex: 0 0 auto;
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  background: var(--tk-solid);
`;

export const SourceLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};

  a {
    color: var(--tk-text);
    font-weight: ${font.weight.semibold};
  }
`;
