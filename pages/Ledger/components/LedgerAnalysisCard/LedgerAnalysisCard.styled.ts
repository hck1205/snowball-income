import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 분석 카드의 로컬 스타일.
 *
 * 🔴 **손익색 금지 · 색 단독 채널 금지**(이 화면의 규율 §3.4, 배당 카드와 같다). 막대는 길이로만
 * 크기를 말하고 **모든 막대가 같은 색**이다 — 색으로 항목을 구분하면 색맹 사용자에게 표가 사라지고,
 * "빨간 항목은 나쁜 것"이라는 없는 의미가 붙는다. 막대 옆에 **언제나 숫자가 함께 선다.**
 * 🔴 이 카드는 `Card tone="sunken"`(부속)이다. 주역 카드는 화면당 하나이고 그것은 월 요약이다.
 *
 * ⚠ 차트 라이브러리를 쓰지 않았다. 여기서 말하는 것은 "무엇이 큰가" 하나뿐이라 축·범례·툴팁이
 *   필요 없고, ECharts 를 이 페이지에 끌어오면 가계부만 쓰는 사용자의 번들이 그만큼 무거워진다.
 *   축과 시계열이 필요해지는 날(예: 12개월 곡선)에 그때 도입한다.
 */

/** 구획 하나. 제목 → 도움말 → 내용 순으로 읽힌다. */
export const Section = styled.section`
  display: grid;
  gap: ${space[2]};

  & + & {
    margin-top: ${space[5]};
    padding-top: ${space[5]};
    border-top: 1px solid ${color.border};
  }
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const SectionHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.textMuted};
`;

/** 막대 줄 묶음. 목록이므로 `<ul>` 이다(개수가 스크린리더에 읽힌다). */
export const BarList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: ${space[1]} 0 0;
  padding: 0;
  list-style: none;
`;

export const BarRow = styled.li`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

/** 이름과 값이 양 끝으로. 값은 **언제나** 보인다(막대만 남는 상태를 만들지 않는다). */
export const BarHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const BarLabel = styled.span`
  overflow: hidden;
  font-size: ${font.size.sm};
  color: ${color.text};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BarValue = styled.span`
  flex: none;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

/**
 * 막대 트랙. `aria-hidden` 이다 — 뜻은 위 줄의 이름·값과 `srText` 가 이미 다 말했고,
 * 막대는 **한눈에 비교**만 돕는다. 접근성 트리에 두 번 읽힐 이유가 없다.
 */
export const BarTrack = styled.div`
  height: 6px;
  overflow: hidden;
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
`;

export const BarFill = styled.div`
  height: 100%;
  border-radius: ${radius.pill};
  background: ${color.textMuted};
`;

/** 고정비/변동비 두 숫자를 한 줄에. 좁은 폭에서는 아래로 접힌다. */
export const SplitRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[5]};
`;

export const SplitItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const SplitLabel = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const SplitValue = styled.span`
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

/** 최근 흐름의 한 달. 이름 · 수입/지출 · 저축률이 한 줄로 읽힌다. */
export const TrendList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: ${space[1]} 0 0;
  padding: 0;
  list-style: none;
`;

export const TrendRow = styled.li`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const TrendHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const TrendMonth = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const TrendRate = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/** 수입·지출 두 값. 🔴 **손익색을 쓰지 않는다** — 라벨이 방향을 말한다. */
export const TrendFlows = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[4]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};

  & span {
    font-family: ${font.dataNumeric};
    font-variant-numeric: tabular-nums;
  }
`;

export const EmptyNote = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textMuted};
`;

/**
 * 화면에서는 안 보이고 보조기기에는 읽히는 한 줄.
 *
 * ⚠ `components/community` 의 `VisuallyHidden` 을 끌어오지 않았다 — 커뮤니티 번들이 가계부
 *   화면에 딸려 온다(그 폴더는 supabase-js 계열을 물고 있다). 세 줄짜리 규칙이라 여기 둔다.
 */
export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
