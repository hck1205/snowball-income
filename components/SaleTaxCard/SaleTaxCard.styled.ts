import styled from '@emotion/styled';
import { CompactSummaryHelpButton } from '@/components/common';
import { color, font, iconOpticalAlign, sectionTitleFontSize, space } from '@/shared/styles';

/**
 * 카드 **제목 줄**에 서는 도움말 버튼. 같은 버튼이라도 자리에 따라 보정이 다르다.
 *
 * 카드 제목(`CardTitle`)은 `h2` = 헤딩 서체(`font.display`)라 잉크 중심이 라인박스 중심보다
 * 위에 있고, `CardHeader` 의 `align-items: center` 는 라인박스를 기준으로 맞춘다 → 버튼이
 * 제목보다 낮게 앉는다(실측 2026-08-01: 18px 제목 **+2.02px** @1280 · 16px 제목 **+2.13px** @390).
 *
 * 🔴 공용 `CompactSummaryHelpButton` 자체에는 걸지 않는다 — 같은 버튼이 `StatTile` 안에서는
 * 본문 서체(`font.sans`) 라벨 옆에 서고, 그 자리는 보정하면 없던 오차가 생긴다. 보정 기준은
 * 제목 크기(`sectionTitleFontSize`)이지 버튼 자신의 em 이 아니다.
 */
export const SaleTaxTitleHelpButton = styled(CompactSummaryHelpButton)`
  ${iconOpticalAlign('display', sectionTitleFontSize)}
`;

/** 지표 그리드 — 요약 카드와 같은 리듬을 쓴다(같은 종류의 숫자 나열이므로 형태도 같아야 한다). */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** "전량 매도 가정" 같은 전제 조건을 작게 명시한다. */
export const TaxAssumptionNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
`;
