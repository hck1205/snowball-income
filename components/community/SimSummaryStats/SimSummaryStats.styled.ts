import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 숫자 규율(스펙 §F): 방향성 없는 요약 숫자라 데이터색·accent 채색 금지 —
 * 값은 `color.text`, hero 라벨만 `color.brandText`, 보조 라벨은 `color.textMuted`.
 * accent 계열은 "목표 달성" 배지 한 곳에만 쓴다. 모든 숫자는 tabular-nums.
 */

/** card variant 세로 스택 — 배경(surfaceSunken)·패딩·min-height는 카드(PreviewBlock) 책임, 여기는 내용 위계만. */
export const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 배지 행 — "n년차 목표 달성" 배지를 **금액(HeroValue/RowHero) 밑**에 왼쪽 정렬로 놓는다.
 * 세로 스택(CardStack/RowCluster)의 직접 자식이면 stretch로 pill이 폭 전체로 늘어나므로,
 * flex 행으로 감싸 내용 폭만 차지하게 한다(카드·행 공용).
 */
export const BadgeRow = styled.div`
  display: flex;
`;

/** hero 라벨 — "월 배당(세후)"처럼 조건이 드러나는 표기. brandText는 라벨까지만(값 채색 금지). */
export const HeroLabel = styled.span`
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/**
 * hero 값 — 방향 없는 결과치라 무채색으로 선다(§F1). 초고액("1,234.5억") 방어로 한 줄 유지 +
 * 넘치면 말줄임(§5) — block이어야 max-width/ellipsis가 먹는다.
 */
export const HeroValue = styled.strong`
  display: block;
  max-width: 100%;
  color: ${color.text};
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

/** "n년차 목표 달성" — 성장·달성 배지 규율(SimBadge와 같은 accent 계열 pill). accent는 여기까지만. */
export const TargetBadge = styled.span`
  flex: 0 0 auto;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.accentSubtle};
  border: 1px solid ${color.accentBorder};
  color: ${color.accentText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

/** 라벨·값·구분자 체인 — attach/row 한 줄과 card 보조 행이 같은 구조·같은 토큰을 공유한다(§G). */
export const StatChain = styled.span`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: ${space[1]};
  row-gap: 2px;
  min-width: 0;
`;

export const StatLabel = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const StatValue = styled.span`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

export const StatDot = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 조건 컨텍스트 줄(card 전용, 스펙 §5) — 결과의 **전제**를 가장 약한 위계로 압축한 한 줄.
 * hero/보조와 위계를 가르기 위해 **전체를 `color.textMuted`로 눌렀다**(값도 강조 안 함, accent 금지).
 * 1줄로 두되 좁으면 자연 wrap → 2줄 초과분은 `-webkit-line-clamp: 2`로 잘라 카드 높이를 고정한다.
 * (flex-wrap 대신 -webkit-box를 쓰는 이유: 줄 수 클램프는 box 레이아웃에서만 동작한다.)
 */
export const ContextLine = styled.p`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 2px 0 0;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  ${font.numeric}
`;

/* ── row variant (리스트 행 숫자 클러스터, B안 §3-4) ──────────────────────────
 * 카드의 세로 3층(라벨+배지 / hero / 보조 체인)을 리스트 밀도에 맞춰 hero만 축소해 옮긴다.
 * 배경(surfaceSunken 칩)·패딩은 ScenarioRow의 RowStats가 책임진다 — 여기는 내용 위계만. */

/** row 클러스터 세로 스택 — CardStack의 리스트 축약판(gap만 좁힘). */
export const RowCluster = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * hero 값(월배당) — HeroValue(3xl)의 리스트 축소판. xl(18)로 밀도 유지, 채색 규율은 동일:
 * 방향 없는 결과치라 무채색(color.text), accent·데이터색 금지(§F1). 초고액은 한 줄 말줄임.
 */
export const RowHero = styled.strong`
  display: block;
  max-width: 100%;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;
