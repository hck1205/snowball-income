import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * B-4 배당 겹쳐 보기 카드의 로컬 스타일.
 *
 * 🔴 **손익색을 쓰지 않는다.** 배당은 P&L 이 아니고, 이 화면의 수입·지출이 이미 중립색이라
 * 배당만 색을 가지면 "이건 이익"이라는 없는 의미가 생긴다. 커버율도 색으로 말하지 않는다 —
 * 숫자와 문장이 채널이다.
 * 🔴 이 카드는 `Card tone="sunken"`(부속)이다. 주역 카드는 화면당 하나이고 그것은 월 요약이다.
 *
 * ## 2026-08-03 재설계
 * 예전에는 `StatTile` 두 개가 `auto-fit minmax(180px)` 격자에 나란히 섰다. 이 카드는 이제 **280px
 * 짜리 범위 레일** 안에 사는데, 거기서 그 격자는 언제나 1열로 접혀 "타일 두 개"라는 형태만 남고
 * 무게는 없었다. 지금은 **금액(큰 숫자) → 얇은 선 → 커버율(라벨·값 한 줄)** 의 세로 배치다 —
 * 좁은 폭에서 자연스럽고, 둘의 관계(얼마를 받아서 얼마를 덮는가)가 순서로 읽힌다.
 */

/** 지표 묶음. 두 값의 관계가 위→아래 순서로 읽힌다. */
export const MetricStack = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const MetricLabel = styled.p`
  margin: 0 0 ${space[1]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.03em;
  color: ${color.textMuted};
`;

/** 이 달 예상 배당. 🔴 색 없음 — 크기와 데이터 서체만으로 선다. */
export const MetricValue = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  overflow-wrap: anywhere;
  ${font.numeric}
`;

export const MetricHint = styled.p`
  margin: ${space[1]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 커버율 줄 — 라벨 왼쪽, 값 오른쪽. 위 금액과 다른 리듬이라 두 지표가 섞이지 않는다. */
export const CoverageRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
`;

export const CoverageLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const CoverageValue = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

/** 지표 아래 설명 줄 묶음. 문장이 여러 개여도 간격이 한 곳에서 정해진다. */
export const NoteList = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[3]};
  min-width: 0;
`;

/**
 * 지표 아래 문장 한 줄. 전제·한계("예상"·"포함되지 않음")도 이 톤으로 **접지 않고** 편다 —
 * 접힌 뒤에 있으면 사용자는 실수령으로 읽는다.
 */
export const Note = styled.p`
  margin: 0;
  max-width: 60ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/**
 * 꺼져 있을 때·값을 못 만들 때의 한 줄. 글리프를 붙여 "지금은 비어 있다"를 형태로도 말한다 —
 * 문장만 있으면 카드가 고장 난 것처럼 보인다.
 */
export const StateNote = styled.p`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};

  svg {
    margin-top: 2px;
    color: ${color.textMuted};
  }
`;
