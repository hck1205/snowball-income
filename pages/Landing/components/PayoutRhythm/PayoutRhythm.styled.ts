import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { cardElevation, color, font, media, radius, space } from '@/shared/styles';

/**
 * S5 "배당이 들어오는 달은 종목마다 다릅니다" — 12칸 리듬.
 *
 * 🔴 **색만으로 말하지 않는다.** 지급 달 칸은 네 가지가 함께 바뀐다 —
 * 면색 · 글자색 · **사방 1px 링** · 굵기(700 대 400). 그 위에 행마다 텍스트 요약(연 몇 회 지급인지)과
 * 행 접근명(몇 월에 지급인지), 그리고 범례 한 문장이 붙는다.
 *
 * ⚠ **면색은 신호로 치지 마라.** accent-alt-subtle 대 surface-sunken 은 8프리셋 x 라이트/다크
 * 16조합에서 대비비 **1.01~1.18:1** 이다 — 명도가 같고 색상만 다르다. 회색조로 보면 두 칸은 같은 칸이고,
 * 라이트 8종에서는 글자 명도까지 거의 같다(velog 5.17 대 5.02). 실제로 가르는 것은 **링과 굵기**다.
 * ink 프리셋은 accentAlt 가 무채라 링과 굵기가 **유일한** 신호다 — 그 프리셋에서 눈으로 확인하라.
 *
 * 칸 폭은 25~67px 라 tintscan 의 면 하한(180px, tools/dev/tintscan.mjs:63,363)에 걸리지 않고,
 * 트랙(RhythmMonths)은 배경이 없어 스캐너의 대상 자체가 아니다(같은 파일 365-367).
 * 테두리는 backgroundColor/backgroundImage 만 보는 스캐너에 **애초에 안 잡힌다** — 이 섹션은 랜딩의
 * 틴트 면 2개(히어로 그라디언트 · 시작 준비 wash)에 세 번째를 더하지 않는다.
 */

export const RhythmCard = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  padding: clamp(16px, 2.4vw, 28px);
  border-radius: ${radius.xl};
  ${cardElevation('base')}
`;

/**
 * 🔴 **12칸 트랙은 이 목록이 소유한다 — 행이 각자 나누면 열이 어긋난다.**
 *
 * 행이 flex 이던 시절 라벨(`RhythmSummary`)이 `nowrap` 이라 "연 4회 지급"과 "매월 지급(연 12회)"의
 * 폭 차이가 그대로 트랙 시작점을 밀었다(실측 @1280: left 272·272·**305**, 3월 칸 414 vs **441**).
 * 이 표의 유일한 존재 이유가 "종목마다 지급 달이 다르다"를 **세로로** 비교시키는 것이라, 열이
 * 어긋나면 섹션이 목적을 잃는다. ⚠ @390 은 라벨이 윗줄로 올라가 정렬이 맞다 —
 * **모바일만 보면 못 잡는 데스크톱 전용 결함**이다.
 *
 * 1열을 `max-content` 로 둔 이유: `RhythmSymbol` 이 데이터 서체의 `6ch` 를 쓰는데 이 목록은 본문
 * 서체라 같은 `6ch` 가 다른 px 가 된다(고정 트랙이 좁으면 티커가 트랙을 넘는다). 트랙이 실제 심볼
 * 박스에 맞으면 그 어긋남이 원천적으로 없다.
 */
export const RhythmList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: max-content max-content minmax(0, 1fr);
  }
`;

/**
 * 한 종목 줄. 넓은 폭에서는 [티커 6ch][요약][12칸] 한 줄이고,
 * 좁은 폭에서는 라벨이 윗줄로 올라가고 12칸이 전폭을 쓴다.
 *
 * ⚠ 넓은 폭에서 목록의 트랙을 `subgrid` 로 물려받는다. **`display: contents` 로 대체하지 마라** —
 * `li` 가 접근성 트리에서 사라지는 브라우저가 있다(행 `aria-label` 이 통째로 증발한다).
 */
export const RhythmRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;

  ${media.up('tabletSm')} {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
  }

  ${media.down('tabletSm')} {
    flex-wrap: wrap;
    gap: ${space[2]};
  }
`;

export const RhythmSymbol = styled.span`
  flex: 0 0 auto;
  width: 6ch;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const RhythmSummary = styled.span`
  flex: 0 0 auto;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  white-space: nowrap;
`;

export const RhythmMonths = styled.span`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;

  ${media.down('tabletSm')} {
    flex: 1 1 100%;
    width: 100%;
  }
`;

/** 한 칸. 지급 달이면 면·글자색·링·굵기가 함께 바뀐다(색 단독 신호 금지). */
export const RhythmCell = styled.span<{ $paid: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 26px;
  border-radius: ${radius.xs};
  /*
   * 🔴 링이 이 표의 **모양 채널**이다. 면색만으로는 못 가른다 - 실측상 지급 면(accent-alt-subtle)과
   * 미지급 면(surface-sunken)의 대비비가 16테마 전부에서 1.01~1.18:1 이다(같은 명도, 색상만 다름).
   * 미지급 칸도 같은 두께의 투명 테두리를 갖는다: box-sizing 이 border-box 라 크기는 어차피 같지만,
   * 선언을 맞춰 두어야 다음 사람이 한쪽만 고쳐 12칸 열을 어긋내지 않는다.
   * accent-alt-border(1.19~2.08:1)나 accent-alt(2.69~3.00:1, grape/light 3:1 미달)로 낮추지 마라.
   */
  border: 1px solid ${({ $paid }) => ($paid ? color.accentAltText : 'transparent')};
  background: ${({ $paid }) => ($paid ? color.accentAltSubtle : color.surfaceSunken)};
  color: ${({ $paid }) => ($paid ? color.accentAltText : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  /* 굵기를 신호로 쓸 수 있는 이유: Snowball Numeric 은 400→700 에서 잉크 +54.9%, 자릿폭 -0.2% 다(실측). */
  font-weight: ${({ $paid }) => ($paid ? font.weight.bold : font.weight.regular)};
  ${font.numeric}
`;

export const RhythmFootnote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

export const RhythmHonesty = styled.p`
  margin: 0;
  max-width: 60ch;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;
`;

export const RhythmLinkLine = styled.p`
  margin: 0;
`;

export const RhythmLink = styled(Link)`
  font-size: ${font.size.sm};
  color: ${color.brand};
`;
