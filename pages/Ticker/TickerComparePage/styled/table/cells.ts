import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';
import { METRIC_COLUMN_WIDTH } from '../constants';

/* ── 비교표 — 항목 칸과 값 칸 ───────────────────────────────────────────────── */

/** 항목 이름 칸. 가로 스크롤에서 고정된다(위 `HeadCorner` 와 같은 이유). */
export const MetricCell = styled.th`
  position: sticky;
  left: 0;
  z-index: 1;
  width: ${METRIC_COLUMN_WIDTH};
  min-width: ${METRIC_COLUMN_WIDTH};
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-weight: ${font.weight.medium};
  text-align: left;
  vertical-align: top;
`;

export const MetricLabelRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[1]};
  min-width: 0;
`;

export const MetricLabel = styled.span`
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const MetricNote = styled.span`
  display: block;
  margin-top: ${space[1]};
  max-width: 100%;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.snug};
  white-space: normal;
`;

/**
 * 숫자의 출처 배지(실측 · 참고 · 계산 가정).
 *
 * 🔴 **색은 거들 뿐, 정보는 글자가 진다**(색 단독 채널 금지). 회색조로 인쇄하거나 색을 못 보는
 * 사용자에게도 "실측"·"계산 가정"이라는 **글자**와 **테두리 모양**(실선 ↔ 점선)이 남는다.
 *
 * 색 배정은 **신뢰도 순서**를 따른다 — 자의적 배색이 아니라 의미의 사다리다:
 *  - `observed`(실측)     — 시장 데이터로 확인한 값. 실선 + accent 틴트로 **가장 또렷하게**.
 *  - `reference`(참고)    — 실제 이력이지만 계산에 안 쓰는 값. 점선 + 중립. 조용히 둔다.
 *  - `assumed`(계산 가정) — 우리가 정한 값. 점선 + **warning 틴트**로 "이건 관측이 아니다"를 색으로도 말한다.
 *
 * ⚠ 세 조합 모두 `shared/styles/contrast.test.ts` 가 **이미 검증하는 쌍**만 쓴다
 *   (accent-text/accent-subtle · text-secondary/surface-muted · warning/warning-surface).
 *   새 색을 만들지 마라 — 만들면 16테마(프리셋 8 × 라이트/다크) 대비를 전부 다시 재야 한다.
 * ⚠ 배지는 폭 60px 안팎이라 면 판정(180px) 밖이다 — 개수가 늘어도 예산에 걸리지 않는다.
 */
export const BasisBadge = styled.span<{ $basis: 'observed' | 'assumed' | 'reference' }>`
  display: inline-block;
  padding: 1px ${space[1]};
  border-radius: ${radius.xs};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;

  ${({ $basis }) => {
    if ($basis === 'observed') {
      return `
  border: 1px solid ${color.accentBorder};
  background: ${color.accentSubtle};
  color: ${color.accentText};`;
    }
    if ($basis === 'assumed') {
      return `
  border: 1px dashed ${color.warning};
  background: ${color.warningSurface};
  color: ${color.warning};`;
    }
    return `
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};`;
  }}
`;

/**
 * 값 칸. **우측 정렬 + tabular** 이라 자릿수가 열을 따라 줄을 맞춘다 —
 * 좌측 정렬이던 종전에는 $33.29 와 $679.14 의 소수점이 어긋나 크기 비교가 눈으로 안 됐다.
 */
export const ValueCell = styled.td`
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  text-align: right;
  vertical-align: top;
`;

export const ValueText = styled.span`
  display: block;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  ${font.numeric}
`;

/** 값이 없는 칸. 중립 muted 로만 말한다 — 없다는 사실에 색을 칠하지 않는다. */
export const UnknownValue = styled.span`
  display: block;
  color: ${color.textMuted};
  font-family: ${font.sans};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
`;

/**
 * "가장 높음/낮음" 표식. 값 **아래 줄**로 내려왔다 — 종전에는 숫자 오른쪽에 붙어 숫자보다 넓은
 * 회색 알약이 되면서 정작 값의 우측 정렬을 깨뜨렸다.
 *
 * 🔴 **색이 유일한 채널이면 안 된다** — 화살표 글리프와 텍스트("가장 높음")가 실제로 붙는다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다. 배당률이 높은 것은 이익이 아니라 **사실**이고,
 *    높다고 좋은 종목도 아니다(커버드콜은 분배율이 높은 대신 NAV 가 깎일 수 있다).
 */
export const ExtremeMark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: ${space[1]};
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;
