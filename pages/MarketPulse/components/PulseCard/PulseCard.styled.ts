import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';
import type { ZoneVisual } from '../../utils';

/**
 * 지표 카드.
 *
 * 🔴 `Card` 안에 `Card` 를 넣지 않는다(레포 규칙). 이 카드는 축 묶음 안에 직접 서고, 묶음은
 *    카드가 아니라 섹션이다.
 * ⚠ 하드코딩 hex 0개 — 색은 토큰만 쓴다.
 */

const toneBorder = (tone: ZoneVisual['tone']) =>
  tone === 'accent'
    ? color.accentBorder
    : tone === 'warning'
      ? color.warning
      : tone === 'danger'
        ? color.danger
        : color.border;

const toneSurface = (tone: ZoneVisual['tone']) =>
  tone === 'accent'
    ? color.accentSubtle
    : tone === 'warning'
      ? color.warningSurface
      : tone === 'danger'
        ? color.dangerSurface
        : color.surface;

/** 카드 + 그 밖의 아코디언을 묶는 자리. 아코디언이 상자 밖이라 이 래퍼가 필요하다. */
export const PulseItem = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const CardRoot = styled.article<{ $tone: ZoneVisual['tone']; $weight: number }>`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border: ${(props) => props.$weight}px solid ${(props) => toneBorder(props.$tone)};
  border-radius: ${radius.lg};
  background: ${color.surface};
  min-width: 0;
`;

export const CardHead = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const CardLabel = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/** 🔴 구간을 **글자로** 말한다 — 색은 거들 뿐이다(색 단독 채널 금지). */
export const ZoneTag = styled.span<{ $tone: ZoneVisual['tone'] }>`
  flex: none;
  padding: 2px ${space[2]};
  border: 1px solid ${(props) => toneBorder(props.$tone)};
  border-radius: ${radius.pill};
  background: ${(props) => toneSurface(props.$tone)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  white-space: nowrap;
`;

/** 값과 그 옆 사실 문구가 같은 줄에서 밑선을 맞춘다. */
export const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
`;

export const CardValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['2xl']}, 4.4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

export const CardNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const CardMeaning = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: 1.6;
`;

/** 기준일·출처. 🔴 갱신 주기가 제각각이라 이 줄이 빠지면 화면이 거짓말을 한다. */
export const CardFoot = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

/**
 * 그래프 자리.
 *
 * ⚠ 높이를 지표가 정한다 — 게이지는 반원이라 꺾은선보다 더 필요하다. 그래도 **한 축 안에서는
 *   같은 높이**라 카드 바닥선이 어긋나지 않는다(게이지는 심리 축에 혼자 있다).
 */
export const ChartSlot = styled.div<{ $height: number }>`
  height: ${(props) => props.$height}px;
  min-width: 0;
`;

/**
 * 접히는 설명.
 *
 * 🔴 네이티브 `<details>` 다 — 키보드·스크린리더·브라우저 검색이 전부 공짜로 따라온다.
 * ⚠ `summary` 의 기본 삼각형(marker)을 지우고 우리 글리프를 쓰지 않는다. 브라우저가 그리는
 *   그 삼각형이 "펼칠 수 있다"를 말하는 가장 익숙한 신호이고, 열림/닫힘에 따라 자동으로 돈다.
 */
export const ExplainDetails = styled.details`
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

/**
 * 출처가 함께 준 **과거 시점 값들**(전일·1주 전·1개월 전·1년 전).
 *
 * CNN 화면이 다이얼 아래에 이 줄을 두는 이유가 있다 — 63 이라는 숫자는 혼자서는 아무 말도
 * 못 하고, 한 달 전 40 이었다는 사실이 붙어야 비로소 이야기가 된다.
 */
export const CompareRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[5]};
  padding: ${space[3]} 0;
  border-block: 1px solid ${color.border};
`;

export const CompareItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CompareLabel = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const CompareValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

export const ExplainSummary = styled.summary`
  cursor: pointer;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.accentText};
  list-style-position: inside;

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
    border-radius: ${radius.sm};
  }
`;

export const ExplainBody = styled.dl`
  display: grid;
  gap: ${space[3]};
  margin: ${space[3]} 0 0;
`;

export const ExplainRow = styled.div`
  display: grid;
  gap: 2px;

  p {
    margin: 0;
    font-size: ${font.size.xs};
    line-height: 1.7;
    color: ${color.textSecondary};
  }
`;

export const ExplainTerm = styled.dt`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
  color: ${color.textMuted};
`;

export const MissingBox = styled.p`
  margin: 0;
  padding: ${space[3]} 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;
