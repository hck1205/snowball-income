import styled from '@emotion/styled';
import { color, font, iconFirstLineAlign, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 요약 카드 안쪽 — 큰 숫자 하나 + 촘촘한 지표 목록                              */
/* -------------------------------------------------------------------------- */

export const HeroSlot = styled.div`
  min-width: 0;
  display: grid;
`;

/**
 * 🔴 **타일 격자 → 정의 목록**(이번 리워크의 밀도 결정).
 *
 * 종전에는 지표 다섯이 각자 테두리 있는 200px 박스였다(전폭 5열 → 400px 높이). 레일 폭에서는
 * 그 박스들이 한 줄씩 쌓여 800px 가 되고, 무엇보다 **다섯 개가 전부 같은 무게**라 hero 숫자와
 * 경쟁했다. 지금은 라벨/값이 한 줄에 마주 보는 **행**이고, 행 사이는 헤어라인 하나다:
 * 높이가 절반 이하로 줄고 위계가 hero → 목록 순으로 분명해진다.
 *
 * `dl` 인 것은 시맨틱이다 — 라벨과 값의 쌍이 다섯이다.
 */
export const FigureList = styled.dl`
  margin: 0;
  display: grid;
  gap: 0;
  min-width: 0;
`;

export const FigureRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: ${space[3]};
  row-gap: 2px;
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;

export const FigureTerm = styled.dt`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const FigureValue = styled.dd`
  margin: 0;
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  text-align: end;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  white-space: nowrap;
  ${font.numeric}
`;

/**
 * 값 아래 한 줄(단위·전제). 라벨 열에 붙여 값과 시선을 다투지 않게 한다.
 *
 * ⚠ `p` 가 아니라 **두 번째 `dd`** 인 것은 시맨틱이다 — `dl > div` 안에는 `dt`/`dd` 만 올 수 있다
 * (한 `dt` 에 `dd` 가 여럿인 것은 규격상 정상이다). `p` 를 끼우면 DOM 이 무효가 된다.
 */
export const FigureHint = styled.dd`
  margin: 0;
  grid-column: 1 / -1;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/**
 * 요약 카드 안의 가름선 — hero 숫자 / 지표 목록 / 비중 도넛이 **세 문단**임을 말한다.
 * 카드를 더 쪼개지 않는 이유: 카드 안 카드 금지 규칙(그리고 화면당 주역 카드는 하나다).
 */
export const CardDivider = styled.hr`
  margin: 0;
  border: 0;
  border-top: 1px solid ${color.border};
`;

/**
 * 인포 아이콘 + 여러 줄 설명. 아이콘은 **문단 가운데가 아니라 첫 줄**에 맞춘다
 * (`align-items: center` 는 두 줄 이상에서 아이콘을 문단 한복판으로 내린다).
 * 보정값은 손으로 적은 `margin-top: 2px` 대신 공용 `iconFirstLineAlign` 이 글자 크기·행간에서 계산한다.
 */
export const NoteLine = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};

  svg {
    ${iconFirstLineAlign(font.size.xs, font.leading.snug)}
  }
`;

/**
 * 요약 하단의 "무엇이 빠졌는가" 줄.
 *
 * 🔴 종전에는 `warningSurface` **면**이었다 — 폭이 카드 전체라 `tintscan` 의 면 판정(폭 ≥180 AND
 * 높이 ≥8)을 넘겨 히어로·푸터와 함께 예산 2를 깨는 세 번째 면이 될 수 있었다. 지금은 **왼쪽
 * 3px 경고선 + 중립 면**이다: 색은 선(L1 파생, 폭 3px)으로 남고 문장은 그대로 경고 색 글자다.
 *
 * ⚠ 면이 `surface-muted` 인 이유는 대비다 — `warning` 은 `surface-muted` 위에서 8프리셋 ×
 * 라이트/다크 전수 최저 **4.88:1**(AA 통과)이지만 `surface-sunken` 위에서는 **4.18 로 미달**이다
 * (2026-08-03 실측). 이 쌍은 `shared/styles/contrast.test.ts` 순회 목록에 없으므로 여기 근거를 남긴다.
 */
export const ExcludedNote = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-left: 3px solid ${color.warning};
  border-radius: 0 ${radius.sm} ${radius.sm} 0;
  background: ${color.surfaceMuted};
  color: ${color.warning};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 카드 하단 액션.
 *
 * 레일에 서는 카드라 **버튼은 전폭**이다 — 좁은 열에서 좌측 정렬된 버튼은 허공을 남기고,
 * 이 화면의 1급 행동(시뮬레이션)은 크게 보여야 한다.
 */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};

  > * {
    flex: 1 1 200px;
    justify-content: center;
  }
`;

/** 버튼 아래 사유 1줄. **무음 비활성 금지** — 비활성 버튼 옆에는 언제나 이유가 있다. */
export const ActionHint = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;
