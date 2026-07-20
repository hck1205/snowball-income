import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * PDF 리포트 문서 스타일.
 *
 * 화면이 아니라 **A4 종이**를 그린다 — 그래서 반응형이 없고 픽셀이 고정이다.
 * 폭 794px / 높이 1123px = A4(210×297mm)를 96dpi로 환산한 값이고, 캡처는 이 div 단위로 한다.
 *
 * 색은 전부 `--sb-*` 토큰이지만, 이 서브트리의 변수는 **리포트 루트가 인라인으로 덮어쓴다**
 * (현재 프리셋의 **라이트** 토큰 고정 — 다크 사용자도 종이는 라이트로 나간다).
 * 그래서 하드코딩 색이 한 개도 없어야 하고, `data-theme` 같은 전역 어트리뷰트를 건드리지 않는다.
 */

export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

/**
 * 오프스크린 마운트 지점. **`display:none`을 쓰면 안 된다** — 크기가 0이 되어
 * html2canvas가 빈 캔버스를 만든다. 화면 밖으로 밀어내되 레이아웃은 살려 둔다.
 */
export const OffscreenRoot = styled.div`
  position: fixed;
  left: -99999px;
  top: 0;
  width: ${PAGE_WIDTH_PX}px;
  background: ${color.surface};
  color: ${color.text};
  font-family: ${font.sans};
  z-index: -1;
  pointer-events: none;
`;

export const Page = styled.section`
  position: relative;
  box-sizing: border-box;
  width: ${PAGE_WIDTH_PX}px;
  height: ${PAGE_HEIGHT_PX}px;
  padding: 56px 52px 44px;
  background: ${color.surface};
  color: ${color.text};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
`;

/** 표지 상단 리본 — 장식 전용이라 `gradient-aurora`(CTA 채움용 gradient-cta와 교차 금지). */
export const CoverRibbon = styled.div`
  position: absolute;
  inset: 0 0 auto 0;
  height: 10px;
  background: ${color.gradientAurora};
`;

export const BrandRow = styled.header`
  display: flex;
  align-items: center;
  gap: ${space[3]};
`;

export const BrandIcon = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 50%;
`;

export const BrandWordmark = styled.span`
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${color.brandText};
`;

export const CoverTitle = styled.h1`
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const CoverSubtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${color.textSecondary};
`;

export const CoverTimestamp = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${color.textMuted};
`;

export const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${space[4]};
`;

export const HeroTile = styled.div<{ wide?: boolean }>`
  grid-column: ${({ wide }) => (wide ? '1 / -1' : 'auto')};
  box-sizing: border-box;
  padding: ${space[5]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

export const HeroLabel = styled.p`
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${color.textMuted};
`;

export const HeroValue = styled.p<{ hero?: boolean }>`
  margin: 0;
  font-size: ${({ hero }) => (hero ? '36px' : '20px')};
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: ${color.text};
`;

/** 목표 배지 — 달성/미달성 두 톤. 색만으로 말하지 않도록 문구가 상태를 그대로 담는다. */
export const TargetBadge = styled.span<{ reached?: boolean }>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: ${({ reached }) => (reached ? color.dataPositive : color.textSecondary)};
  background: ${({ reached }) => (reached ? color.dataPositiveSurface : color.surfaceMuted)};
  border: 1px solid ${({ reached }) => (reached ? color.dataPositive : color.border)};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${color.text};
  padding-bottom: 8px;
  border-bottom: 2px solid ${color.brandBorder};
`;

/** 해설 문단 — 리포트에서 "숫자의 의미"를 말하는 유일한 자리다. */
export const Narrative = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: ${color.textSecondary};
`;

export const NoteText = styled.p`
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: ${color.textMuted};
`;

export const Caption = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${color.textSecondary};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  thead {
    display: table-header-group;
  }

  th,
  td {
    padding: 7px 10px;
    text-align: left;
    border-bottom: 1px solid ${color.border};
  }

  th {
    font-size: 11px;
    font-weight: 700;
    color: ${color.textMuted};
    background: ${color.surfaceMuted};
  }

  td[data-numeric='true'],
  th[data-numeric='true'] {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  tbody tr:nth-of-type(even) td {
    background: ${color.surfaceSunken};
  }

  /* 목표 달성 연차 행 — 좌측 레일 + 행 끝 텍스트 라벨(색만으로 표시하지 않는다). */
  tbody tr[data-target-reached='true'] td:first-of-type {
    box-shadow: inset 3px 0 0 0 ${color.dataPositive};
  }
`;

export const TargetCellLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: ${color.dataPositive};
`;

export const SplitRow = styled.div`
  display: grid;
  grid-template-columns: 265px 1fr;
  gap: ${space[5]};
  align-items: start;
`;

export const StackRow = styled.div`
  display: grid;
  gap: ${space[5]};
`;

export const ChartImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
`;

export const PieImage = styled.img`
  display: block;
  width: 265px;
  height: 265px;
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${space[4]};
`;

export const StatTile = styled.div`
  box-sizing: border-box;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

export const StatLabel = styled.p`
  margin: 0 0 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: ${color.textMuted};
`;

export const StatValue = styled.p<{ tone?: 'positive' | 'negative' }>`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ tone }) =>
    tone === 'positive' ? color.dataPositive : tone === 'negative' ? color.dataNegative : color.text};
`;

export const WarningBox = styled.div`
  padding: ${space[4]};
  border: 1px solid ${color.warning};
  border-radius: ${radius.lg};
  background: ${color.warningSurface};
  font-size: 12px;
  line-height: 1.7;
  color: ${color.text};
`;

export const DisclaimerBox = styled.div`
  margin-top: auto;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
  font-size: 11px;
  line-height: 1.75;
  color: ${color.textSecondary};
  white-space: pre-line;
`;

export const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: ${color.textMuted};
`;
