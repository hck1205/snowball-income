import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 한눈에 보기 — 차트 판.
 *
 * ## 🔴 구획에 면을 깔지 않는다 (2026-08-09 사용자 지적)
 *
 * 처음에는 차트마다 `surfaceSunken` 회색 상자를 깔았다. 카드 안에 회색 덩어리가 여덟 개 서니
 * 화면이 격자무늬가 됐고, 정작 봐야 할 **차트가 배경 소음에 묻혔다.**
 *
 * 구획은 **여백과 제목**이 나눈다. 선 하나도 최소한으로만 쓴다(구획 사이 얇은 경계 한 줄).
 * 면을 쓰는 자리는 **숫자 타일** 하나뿐이다 — 거기는 값이 주인공이라 담을 그릇이 필요하다.
 */

export const ReportBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  min-width: 0;
`;

/* ── 요약 타일 ───────────────────────────────────────────────────────────────── */

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space[3]};
  min-width: 0;

  ${media.down('tablet')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/** 🔴 여기만 면을 갖는다 — 숫자가 주인공인 자리라 담을 그릇이 필요하다. */
export const KpiTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 0;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
`;

export const KpiLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

export const KpiValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size.xl}, 3vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

export const KpiNote = styled.span`
  font-size: ${font.size['2xs']};
  line-height: 1.5;
  color: ${color.textMuted};
`;

/* ── 구획 ────────────────────────────────────────────────────────────────────── */

/**
 * 큰 묶음(현금흐름 · 지출 · 자산 · 투자).
 *
 * 🔴 면이 아니라 **경계선 한 줄**로 나눈다. 첫 구획에는 선이 없다 — 카드 제목 바로 아래라
 *    선을 그으면 제목이 잘린 것처럼 보인다.
 */
export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
  min-width: 0;
  padding-top: ${space[5]};
  border-top: 1px solid ${color.border};

  &:first-of-type {
    padding-top: 0;
    border-top: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const ReportRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[5]};
  min-width: 0;
  align-items: start;

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** 차트 하나. 🔴 면이 없다 — 제목·설명·그림만 있다. */
export const ChartBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

export const ChartTitle = styled.h4`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/** 🔴 차트마다 "이게 무슨 숫자인가"를 한 줄로 말한다 — 그림만으로는 기준이 안 보인다. */
export const ChartNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.55;
  color: ${color.textMuted};
`;

/**
 * 차트가 그려질 자리.
 *
 * 🔴 높이를 고정해 레이아웃 시프트를 막는다(ECharts 가 늦게 붙는다).
 * ⚠ `$tall` 은 시계열처럼 가로로 긴 그림 — 낮으면 선이 눌려 변화가 안 보인다.
 */
export const ChartArea = styled.div<{ $tall?: boolean }>`
  width: 100%;
  height: ${(props) => (props.$tall ? '320px' : '260px')};
  min-width: 0;
`;

/* ── 인사이트 ────────────────────────────────────────────────────────────────── */

export const InsightList = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 인사이트 한 줄.
 *
 * 🔴 조언이 아니라 **관측**이다("고정비가 62%입니다"까지). 무엇을 줄일지는 그 사람의 사정이고,
 *    우리가 정할 자리가 아니다.
 */
export const InsightItem = styled.li`
  position: relative;
  padding-left: ${space[4]};
  font-size: ${font.size.sm};
  line-height: 1.65;
  color: ${color.textSecondary};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.65em;
    width: 6px;
    height: 6px;
    border-radius: ${radius.pill};
    background: ${color.border};
  }
`;

/* ── 빈 상태 ─────────────────────────────────────────────────────────────────── */

/**
 * 🔴 **아무것도 안 그리는 대신 왜 없는지 말한다**(2026-08-09 사용자 지적).
 *
 * 자산·투자를 안 적었을 때 그 구획을 통째로 감췄더니 "그래프가 안 보인다"로 읽혔다 —
 * 없는 것과 안 그리는 것을 사용자가 구분할 방법이 없었다. 무엇을 적으면 무엇이 나타나는지 적는다.
 */
export const EmptyBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  padding: ${space[5]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  text-align: center;
`;

export const EmptyTitle = styled.strong`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const EmptyBody = styled.span`
  font-size: ${font.size.sm};
  line-height: 1.6;
  color: ${color.textMuted};
`;

/** 자산 도넛 옆의 부채 한 줄. 🔴 파이에 섞지 않는다 — 섞으면 "부채도 내 자산"으로 읽힌다. */
export const DebtNote = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;
