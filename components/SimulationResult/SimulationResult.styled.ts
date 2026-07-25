import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 결과 카드의 지표 그리드.
 *
 * hero 타일(최종 자산 가치)은 **한 줄을 통째로 차지**한다(`grid-column: 1 / -1`).
 * 나머지 지표는 그 아래에 작게 깔린다. 이렇게 해야 "이 앱을 켠 이유"가 첫눈에 들어온다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** hero 지표는 그리드 한 줄 전체를 쓴다. */
export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;

/**
 * "전량 매도한다면" — 가정이 다른 별도 세계다(계속 보유하면 내지 않는 세금).
 * 그래서 위쪽 지표들과 **같은 평면에 두면 안 된다**. sunken 서피스로 한 단계 내려서
 * "이건 조건부 시나리오"라는 걸 형태로 말한다.
 */
export const TaxSection = styled.section`
  margin-top: ${space[4]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const TaxSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

export const TaxSectionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

/** "전량 매도 가정" 같은 전제 조건을 작게 명시한다. */
export const TaxAssumptionNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
`;

/** 금융소득종합과세 경고 배너의 위쪽 간격. */
export const WarningSlot = styled.div`
  margin-top: ${space[3]};
`;

/* -------------------------------------------------------------------------- */
/* 목표 월배당 도달 — 서사 하이라이트 블록                                        */
/* -------------------------------------------------------------------------- */

/** 서사 블록의 상태 톤. 미설정=중립, 미도달=warning, 도달=success. */
export type NarrativeTone = 'muted' | 'warning' | 'success';

const NARRATIVE_TONE: Record<NarrativeTone, { bg: string; fg: string }> = {
  muted: { bg: color.surfaceMuted, fg: color.textMuted },
  warning: { bg: color.warningSurface, fg: color.warning },
  success: { bg: color.successSurface, fg: color.success }
};

/**
 * 목표 도달 상태를 한 문장으로 말하는 하이라이트 블록.
 *
 * hero(최종 자산) 바로 아래에 그리드 한 줄 전체(`grid-column: 1 / -1`)를 차지한다.
 * 상태별 surface 토큰으로 톤을 말한다(Banner와 달리 success 톤이 필요해 전용 블록으로 뒀다).
 * 뷰 토글이 우측 상단에 절대배치되므로 `position: relative`.
 */
export const NarrativeBlock = styled.div<{ tone: NarrativeTone }>`
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${({ tone }) => NARRATIVE_TONE[tone].bg};
`;

/** 좌측 lucide 아이콘 래퍼 — 톤 색을 입힌다. */
export const NarrativeIcon = styled.span<{ tone: NarrativeTone }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ tone }) => NARRATIVE_TONE[tone].fg};
`;

export const NarrativeBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

/** 서사 문장. 우측 상단 뷰 토글과 겹치지 않도록 오른쪽 여백을 둔다. */
export const NarrativeText = styled.p<{ tone: NarrativeTone }>`
  margin: 0;
  padding-right: 78px;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${({ tone }) => NARRATIVE_TONE[tone].fg};
`;

/** 뷰 스위치(바 ↔ 게이지)의 우측 상단 고정 슬롯. */
export const NarrativeToggleSlot = styled.div`
  position: absolute;
  top: ${space[3]};
  right: ${space[3]};
`;

/**
 * 원형 게이지 래퍼.
 *
 * 정사각으로 축소되며 가운데 정렬한다. ECharts 캔버스는 부모 크기를 채우므로
 * 여기서 크기를 확정한다. target≤0/좁은 화면(≤360px)에선 렌더 자체가 생략된다.
 * `role="img"` + `aria-label`은 컴포넌트에서 부여한다(색만으로 전달 금지).
 */
export const GaugeWrapper = styled.div`
  width: 100%;
  max-width: 220px;
  min-height: 160px;
  aspect-ratio: 1;
  margin: 0 auto;
`;
