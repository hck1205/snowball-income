import styled from '@emotion/styled';
import { color, font, media, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * `/ticker/compare` 의 스타일.
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊겨 앱이 부팅하지 않는다
 *   (편집 직후 .claude/hooks/styled-backtick-check.mjs 가 잡는다).
 * 🔴 하드코딩 hex 금지 — 토큰만 쓴다.
 */

export const Stack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/* ── 선택 줄 ───────────────────────────────────────────────────────────────── */

export const PickerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

export const PickerHint = styled.p`
  margin: 0;
  min-width: 0;
  flex: 1 1 20ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 비교표 ────────────────────────────────────────────────────────────────── */

/**
 * 표가 좁은 폭에서 넘칠 때는 **가로 스크롤**로 흡수한다. 칸을 접거나 열을 감추면 비교가 깨진다 —
 * 비교표에서 열이 사라지는 것은 정보 손실이 아니라 **비교 자체의 실패**다.
 */
export const TableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  /* 🔴 앱 공용 스크롤바 — 부품마다 다른 막대가 나오지 않게 한다(scrollbarStyle.test.ts 가 잠근다). */
  ${subtleScrollbar}
`;

export const Table = styled.table`
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: ${font.size.sm};
`;

export const HeadCell = styled.th`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  text-align: left;
  white-space: nowrap;
  vertical-align: bottom;
`;

export const TickerName = styled.span`
  display: block;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  white-space: normal;
  max-width: 18ch;
`;

export const MetricCell = styled.th`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textSecondary};
  font-weight: ${font.weight.medium};
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
`;

export const MetricNote = styled.span`
  display: block;
  margin-top: 2px;
  max-width: 32ch;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.snug};
  white-space: normal;
`;

export const ValueCell = styled.td`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  font-family: ${font.dataNumeric};
  white-space: nowrap;
  vertical-align: top;
  ${font.numeric}
`;

/** 값이 없는 칸. 중립 muted 로만 말한다 — 없다는 사실에 색을 칠하지 않는다. */
export const UnknownValue = styled.span`
  color: ${color.textMuted};
  font-family: ${font.sans};
  font-size: ${font.size.xs};
`;

/**
 * "가장 높음/낮음" 표식.
 *
 * 🔴 **색이 유일한 채널이면 안 된다** — 텍스트(가장 높음)가 실제로 붙고, 색은 거들 뿐이다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다. 배당률이 높은 것은 이익이 아니라 **사실**이고,
 *    높다고 좋은 종목도 아니다(커버드콜은 분배율이 높은 대신 NAV 가 깎일 수 있다).
 */
export const ExtremeMark = styled.span`
  display: inline-block;
  margin-left: ${space[1]};
  padding: 1px ${space[1]};
  border: 1px solid ${color.border};
  border-radius: ${radius.xs};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
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
 *   (`accent-text/accent-subtle` · `text-secondary/surface-muted` · `warning/warning-surface`).
 *   새 색을 만들지 마라 — 만들면 16테마(프리셋 8 × 라이트/다크) 대비를 전부 다시 재야 한다.
 * ⚠ 손익색(dataPositive/dataNegative)은 쓰지 않는다. 배당률이 높은 것은 이익이 아니다.
 */
export const BasisBadge = styled.span<{ $basis: 'observed' | 'assumed' | 'reference' }>`
  display: inline-block;
  margin-left: ${space[1]};
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

/* ── 지급월 띠 ─────────────────────────────────────────────────────────────── */

/**
 * 12칸 지급월 격자. 좁은 폭에서는 6칸씩 두 줄로 접힌다 —
 * 12칸을 가로 스크롤로 두면 "빈 달이 어디인가"를 한눈에 볼 수 없어 이 표의 목적이 사라진다.
 */
export const MonthGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
`;

/**
 * 한 달 칸.
 *
 * 🔴 지급 있음/없음을 **면색 하나로 가르지 않는다**(색 단독 채널 금지 · 회색조에서도 읽혀야 한다).
 * 채워진 달은 사방 1px 링 + 굵기로 함께 갈린다 — 배당 캘린더의 12칸 트랙이 같은 처방을 쓴다
 * (그 화면에서 면 대 면 대비가 16테마 전부 1.01~1.18:1 이라는 실측이 근거다).
 */
export const MonthCell = styled.li<{ $paid: boolean }>`
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: ${space[1]} 2px;
  border: 1px solid ${({ $paid }) => ($paid ? color.accentAltText : 'transparent')};
  border-radius: ${radius.xs};
  background: ${({ $paid }) => ($paid ? color.accentAltSubtle : color.surfaceSunken)};
  color: ${({ $paid }) => ($paid ? color.accentAltText : color.textMuted)};
  font-size: ${font.size['2xs']};
  font-weight: ${({ $paid }) => ($paid ? font.weight.bold : font.weight.regular)};
  min-width: 0;
`;

export const MonthName = styled.span`
  font-family: ${font.dataNumeric};
  ${font.numeric}
`;

export const MonthTickers = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  text-align: center;
  overflow-wrap: anywhere;
`;

export const CoverageNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 빈 상태 · 각주 ────────────────────────────────────────────────────────── */

export const EmptyBlock = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: start;
  padding: ${space[5]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const EmptyTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
`;

export const EmptyBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const SuggestionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const FootNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/** 스크린리더 전용. 시각 표식(가장 높음 등)이 이미 텍스트라 여기서는 표의 구조 설명에만 쓴다. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
