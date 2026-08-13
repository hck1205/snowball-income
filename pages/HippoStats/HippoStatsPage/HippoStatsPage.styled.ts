import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const PageBody = styled.div`
  display: grid;
  gap: clamp(28px, 4vw, 44px);
  padding-block: ${space[6]} ${space[10]};
`;

/** 🔴 화면 성격을 규정하는 고지. 어떤 그림보다 먼저 읽힌다. */
export const Disclaimer = styled.p`
  margin: 0;
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textSecondary};
`;

export const Section = styled.section`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 절 머리 — 제목과 **그 절의 동작 버튼**이 한 줄에 선다.
 *
 * 🔴 버튼이 제목 옆인 이유(2026-08-14 사용자 지시): 종전에는 "담을 수 있는 배당 종목" 목록이
 * 도넛 아래 본문에 그대로 펼쳐져 있어, 파이 둘을 모아 보려고 스크롤할 때마다 목록이 시선을 갈랐다.
 * 목록을 드로어로 옮기면 절의 본문에는 **그림만** 남고 고르는 동선은 이 버튼 하나로 모인다
 * (대가들 포폴 카드가 보유 표를 드로어로 여는 것과 같은 처방).
 *
 * ⚠ 좁은 폭에서는 줄바꿈한다 — 한 줄에 우겨 넣으면 제목이 잘린다.
 */
export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const SectionLede = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textSecondary};
`;

export const ChartBox = styled.div<{ $height: number }>`
  height: ${(props) => props.$height}px;
  min-width: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

/**
 * 파이 둘.
 *
 * ⚠ 좁은 폭에서는 한 줄에 하나씩 — 도넛 두 개를 나란히 욱여넣으면 조각 라벨이 서로 겹친다.
 */
export const PieRow = styled.div`
  display: grid;
  gap: ${space[4]};
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
`;

export const PieBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const PieTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/**
 * 대가 보유 종목 중 **비교 담을 수 있는 것**의 목록(연결①).
 *
 * 🔴 도넛과 달리 **고르는 표면**이라 카드 격자가 아니라 줄이다 — 체크박스가 왼쪽 첫 칸에 서고
 *    티커·종목명·보유 대가 수가 한 줄에 이어진다(표의 행과 같은 읽기 방향).
 */
export const CompareBlock = styled.div`
  display: grid;
  gap: ${space[3]};
`;

export const CompareList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const CompareItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

export const CompareTickerLabel = styled.span`
  flex: none;
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const CompareIssuer = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const CompareCount = styled.span`
  flex: none;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const Caveats = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding-left: ${space[4]};
  font-size: ${font.size.xs};
  line-height: 1.7;
  color: ${color.textMuted};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.7;
  color: ${color.textMuted};
`;

export const StatusBox = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: center;
  padding: ${space[10]} ${space[4]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.lg};
  text-align: center;
  color: ${color.textSecondary};
`;

/** 요약 줄 — 종합 단계 배지와 세어 본 문장이 한 줄에 선다. */
export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

/**
 * 종합 단계 배지.
 *
 * 🔴 지표 카드의 배지와 **같은 어휘·같은 색 규칙**이다(안정·보통·주의·경계). 종합에만 다른
 *    척도를 쓰면 카드의 '주의'와 여기의 값이 같은 뜻인지 알 수 없게 된다.
 * ⚠ 색 하나에 기대지 않는다 — 단계 이름이 글자로 함께 선다.
 */
export const StatusChip = styled.strong<{ $tone: 'accent' | 'neutral' | 'warning' | 'danger' }>`
  flex: none;
  padding: ${space[2]} ${space[4]};
  border: 1px solid
    ${(props) =>
      props.$tone === 'accent'
        ? color.accentBorder
        : props.$tone === 'warning'
          ? color.warning
          : props.$tone === 'danger'
            ? color.danger
            : color.border};
  border-radius: ${radius.pill};
  background: ${(props) =>
    props.$tone === 'accent'
      ? color.accentSubtle
      : props.$tone === 'warning'
        ? color.warningSurface
        : props.$tone === 'danger'
          ? color.dangerSurface
          : color.surface};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  white-space: nowrap;
`;

/** 종합 긴장도 숫자 — 단계만으로는 "경계에 가까운 보통"이 안 보인다. */
export const StatusScore = styled.span`
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  font-variant-numeric: tabular-nums;
`;

export const SummaryText = styled.p`
  flex: 1 1 240px;
  margin: 0;
  font-size: ${font.size.sm};
  line-height: 1.7;
  color: ${color.textSecondary};
`;
