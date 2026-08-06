import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, media, pageHueMix, radius, space, surface } from '@/shared/styles';
import { VERDICT_PAD } from './constants';

/* ── 결론 블록 (지급월 커버리지) ───────────────────────────────────────────── */

/**
 * **이 화면의 초점.** 종전에는 같은 내용이 표 아래 세 번째 카드였다.
 *
 * 읽는 면(data)이라 채도 **면**을 깔지 않는다. 위계는 ①가라앉은 중립 면 ②상단 6px hue 리본
 * ③화면에서 가장 큰 숫자, 셋이 만든다. 리본은 높이 6px 이라 선이지 면이 아니다.
 */
export const Verdict = styled.section`
  position: relative;
  overflow: hidden;
  ${surface(DATA_RADIUS, VERDICT_PAD)}
  display: grid;
  gap: ${space[4]};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 6px;
    background: ${pageHueMix(70, 'transparent')};
  }
`;

export const VerdictHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${space[2]} ${space[4]};
  min-width: 0;
`;

export const VerdictLede = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

/**
 * 이 블록이 무엇인지. 작고 넓은 자간 — 아래 큰 숫자와 대비를 벌린다.
 *
 * 🔴 **작아 보여도 제목이라 `h2` 다.** 개편 전 이 내용은 `Card title` 을 단 세 번째 카드였고,
 * 그 제목이 문서 개요(heading outline)에 h2 로 들어가 있었다. 결론 블록으로 승격하면서 이것을
 * `p` 로 두면 **화면에서는 커지고 낭독 개요에서는 사라지는** 뒤집힌 결과가 난다 —
 * 제목 단위로 훑는 사용자에게는 커버리지 구획이 통째로 없어진 것과 같다.
 * 크기·굵기·자간은 아래에서 전부 다시 정하므로 태그를 바꿔도 보이는 모습은 그대로다.
 */
export const VerdictEyebrow = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

/**
 * 화면에서 가장 큰 숫자. `font.heroNumeric` 은 **화면당 한 곳**이라는 계약이 있는 서체이고,
 * 이 화면에서 그 한 곳은 여기다(표의 숫자는 전부 `dataNumeric`).
 */
export const VerdictValue = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: ${space[1]};
  color: ${color.text};
  font-family: ${font.heroNumeric};
  font-size: clamp(30px, 4.6vw, 44px);
  font-weight: ${font.weight.extrabold};
  line-height: 1.05;
  letter-spacing: -0.02em;
  ${font.numeric}
`;

export const VerdictUnit = styled.span`
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

/** 숫자가 못 하는 말(어느 달이 비었는가)을 문장이 진다. 숫자 옆에 붙어 한 호흡으로 읽힌다. */
export const VerdictSentence = styled.p`
  margin: 0;
  flex: 1 1 22ch;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  min-width: 0;
`;

/**
 * 12칸 트랙. 좁은 폭에서는 6칸씩 두 줄 —
 * 가로 스크롤로 두면 "빈 달이 어디인가"를 한눈에 볼 수 없어 이 트랙의 목적이 사라진다.
 */
export const MonthTrack = styled.ul`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
`;

/**
 * 한 달.
 *
 * 🔴 **면색으로 가르지 않는다.** 종전에는 지급 있는 달이 `accentAltSubtle` 면이었는데,
 * 읽는 면에 채도면을 까는 것이라 숫자의 신뢰감과 충돌했고 회색조에서는 거의 사라졌다.
 * 지금은 ①실선 대 점선 테두리 ②상단 마크의 유무 ③글자 굵기, 셋이 함께 말한다.
 */
export const MonthCol = styled.li<{ $paid: boolean }>`
  display: grid;
  gap: ${space[1]};
  justify-items: center;
  align-content: start;
  padding: ${space[2]} 2px;
  border: 1px ${({ $paid }) => ($paid ? 'solid' : 'dashed')} ${color.border};
  border-radius: ${radius.sm};
  background: ${({ $paid }) => ($paid ? color.surface : 'transparent')};
  min-width: 0;
`;

export const MonthNum = styled.span<{ $paid: boolean }>`
  color: ${({ $paid }) => ($paid ? color.text : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${({ $paid }) => ($paid ? font.weight.bold : font.weight.regular)};
  ${font.numeric}
`;

/** 그 달에 지급하는 종목 수만큼 마크가 선다 — 개수 자체가 "얼마나 겹치는가"를 말한다. */
export const MonthMarks = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  min-width: 0;
`;

/**
 * 종목 한 개의 마크. 높이 5px · 폭 12px — **선이지 면이 아니다**(면 하한은 폭 180 AND 높이 8).
 * 🔴 높이를 8px 이상으로 올리지 마라 — 그 순간 12칸 × 종목 수만큼의 면이 예산에 들어온다.
 */
export const MonthMark = styled.span<{ $series: string }>`
  display: block;
  width: 12px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${({ $series }) => $series};
`;

/** 마크가 못 하는 말을 글자가 한다 — 회색조·색각이상에서도 어느 종목인지 읽힌다. */
export const MonthTickers = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  text-align: center;
  overflow-wrap: anywhere;
`;

export const MonthGapMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
`;

export const VerdictNotes = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const CoverageNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
