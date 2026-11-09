import styled from '@emotion/styled';
import { ModalPanel } from '@/components/common';
import { color, font, media, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 진입 버튼 자리 — 탭 줄과 결과 사이(ResultBoard 의 notices 슬롯), 오른쪽 정렬.
 * 🔴 탭 줄 **옆**에 두지 않는다: 그 줄은 좁은 폭에서 가장 먼저 눌리는 자리라 컨트롤을 옮겨 낸 이력이 있다
 *   (ScenarioTabsRow 주석, 2026-07-29).
 */
export const CompareEntry = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/**
 * 비교 모달 패널 — 공용 모달의 lg(720px)보다 넓다. 차트 둘 + 탭 열 최대 10개의 표가 들어가야 해서다.
 * 🔴 공용 `ModalPanel` 의 폭 규칙("lg 는 칸 많은 폼 전용")을 바꾸지 않고 여기서만 넓힌다.
 */
export const WidePanel = styled(ModalPanel)`
  && {
    width: min(1120px, 100%);
    max-height: min(92vh, 1000px);
    overflow-y: auto;
    ${subtleScrollbar}
  }
`;

export const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const PanelSub = styled.p`
  margin: ${space[1]} 0 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const SectionTitle = styled.h3`
  margin: 0 0 ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/* ── 차트 ─────────────────────────────────────────────────────────────────── */

export const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[4]};
  margin-top: ${space[4]};

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ChartCard = styled.figure`
  margin: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
`;

export const ChartBox = styled.div`
  height: 260px;
`;

/* ── 표 ───────────────────────────────────────────────────────────────────── */

export const TableSection = styled.section`
  margin-top: ${space[5]};
`;

/* 탭이 많으면 표가 가로로 넘친다 — 이 틀이 스크롤한다(첫 열은 고정). */
export const CompareScroll = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

export const CompareTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${font.size.sm};
  ${font.numeric};

  /* 모든 칸이 같은 불투명 면 — 고정된 첫 열만 다른 색으로 떠 보이지 않게. */
  th,
  td {
    padding: ${space[2]} ${space[3]};
    /*
     * 🔴 줄 높이를 **정수 px** 로 고정한다. 행 높이가 소수(36.5px 등)면 다음 행의 고정 칸(불투명)이 윗행
     * 구분선 1px 을 덮어, 고정 첫 열에서만 선이 한 줄 걸러 사라졌다(390px 실측).
     */
    line-height: 20px;
    background: ${color.surface};
    border-bottom: 1px solid ${color.border};
    text-align: right;
    vertical-align: middle;
    min-width: 140px;
  }

  thead th {
    vertical-align: top;
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }

  /*
   * 고정 첫 열. 🔴 구분선을 border 가 아니라 **안쪽 그림자**로 그린다 — 고정(sticky) 칸의 border-bottom 은
   * 일부 행에서 그려지지 않았다(390px 실측, 한 줄 걸러 빠짐). 그림자는 칸 안에 그려져 빠지지 않는다.
   */
  tbody th,
  thead th:first-of-type {
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: 132px;
    text-align: left;
    font-weight: ${font.weight.medium};
    color: ${color.textMuted};
    border-bottom: 0;
    box-shadow:
      inset -1px 0 0 ${color.border},
      inset 0 -1px 0 ${color.border};
  }

  ${media.down('mobileWide')} {
    th,
    td {
      min-width: 112px;
    }

    tbody th,
    thead th:first-of-type {
      min-width: 96px;
      max-width: 96px;
    }
  }

  tbody tr:last-of-type td {
    border-bottom: 0;
  }

  tbody tr:last-of-type th {
    box-shadow: inset -1px 0 0 ${color.border};
  }
`;

/** 조건 / 결과 묶음 머리. */
export const GroupRow = styled.tr`
  th {
    padding-top: ${space[3]};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.bold};
    letter-spacing: 0.02em;
    color: ${color.text};
    background: ${color.surfaceSunken};
  }
`;

export const TabHead = styled.div`
  display: grid;
  justify-items: end;
  gap: ${space[1]};
`;

export const TabName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  overflow-wrap: anywhere;
`;

/** 탭 색 점. 색은 차트 시리즈 토큰 — 차트의 선과 같은 색이라 표 머리가 곧 범례다. */
export const Swatch = styled.span`
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--swatch);
`;

export const ActiveTag = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.brandText};
`;

export const HoldingsCell = styled.td`
  && {
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    line-height: 18px;
    min-width: 160px;
  }
`;

/** 결과 칸: 값(+최고) 위, 작은 막대 아래. */
export const MetricCell = styled.div`
  display: grid;
  gap: 4px;
  justify-items: end;
`;

export const MiniTrack = styled.span`
  display: block;
  width: 100%;
  max-width: 120px;
  height: 4px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

/** 너비는 인라인 --bar(0~100%), 색은 --swatch. */
export const MiniFill = styled.span`
  display: block;
  height: 100%;
  width: var(--bar);
  margin-left: auto;
  border-radius: inherit;
  background: var(--swatch);
`;

export const BestValue = styled.strong`
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
`;

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
  margin: ${space[3]} 0 0;
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
