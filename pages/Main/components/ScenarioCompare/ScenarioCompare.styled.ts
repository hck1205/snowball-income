import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 진입 버튼 자리 — 탭 줄과 결과 사이(ResultBoard 의 notices 슬롯), 오른쪽 정렬.
 * 🔴 탭 줄 **옆**에 두지 않는다: 그 줄은 좁은 폭에서 가장 먼저 눌리는 자리라 컨트롤을 옮겨 낸 이력이 있다
 *   (ScenarioTabsRow 주석, 2026-07-29).
 */
export const CompareEntry = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/** 펼쳐지는 비교 패널 — data 면(채도 면 없음). 결과 바로 위에 결과와 같은 폭으로 선다. */
export const ComparePanel = styled.section`
  display: grid;
  gap: ${space[5]};
  margin-top: ${space[2]};
  padding: clamp(${space[4]}, 2.4vw, ${space[6]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

export const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/* ── 탭 범례(조건) ─────────────────────────────────────────────────────────── */

export const Legend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${space[3]};
`;

export const LegendItem = styled.li<{ $active: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: ${space[2]};
  row-gap: ${space[1]};
  padding: ${space[3]};
  border: 1px solid ${(props) => (props.$active ? color.brandBorder : color.border)};
  border-radius: ${radius.md};
`;

/** 탭 색 점. 색은 차트 시리즈 토큰(--sb-chart-series-N) — 막대와 같은 색이라 이것이 범례다. */
export const Swatch = styled.span`
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--swatch);
`;

export const LegendName = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  overflow-wrap: anywhere;
`;

export const ActiveTag = styled.span`
  margin-left: ${space[1]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.brandText};
`;

export const LegendMeta = styled.span`
  grid-column: 2 / -1;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};
  ${font.numeric};
`;

/* ── 지표 막대 ─────────────────────────────────────────────────────────────── */

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[5]} ${space[6]};

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const MetricBlock = styled.div`
  display: grid;
  align-content: start;
  gap: ${space[2]};
  min-width: 0;
`;

export const MetricTitle = styled.h4`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

export const BarList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
`;

/** 한 줄 = [탭 이름] [막대] [값]. 좁으면 막대가 이름·값 아래 한 줄을 다 쓴다. */
export const BarRow = styled.li`
  display: grid;
  grid-template-columns: minmax(64px, 96px) minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  ${font.numeric};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: ${space[1]};

    & > :nth-of-type(2) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

export const BarName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${color.text};
`;

export const BarTrack = styled.span`
  display: block;
  height: 10px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

/** 너비는 인라인 --bar(0~100%), 색은 --swatch. 애니메이션은 넣지 않는다 — 편집할 때마다 출렁인다. */
export const BarFill = styled.span`
  display: block;
  height: 100%;
  width: var(--bar);
  border-radius: inherit;
  background: var(--swatch);
`;

export const BarValue = styled.span<{ $best: boolean }>`
  white-space: nowrap;
  text-align: right;
  font-weight: ${(props) => (props.$best ? font.weight.extrabold : font.weight.medium)};
  color: ${(props) => (props.$best ? color.text : color.textMuted)};
`;

/* 가장 좋은 값 — 색만으로 말하지 않는다(굵기 + 글자). */
export const BestTag = styled.span`
  display: inline-block;
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.brandText};
  background: ${color.brandSubtle};
`;

export const MutedValue = styled.span`
  color: ${color.textMuted};
`;

export const CompareNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.6;
  color: ${color.textMuted};
`;

/* 화면에는 안 보이고 화면 낭독기에만 읽히는 글자. */
export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;
