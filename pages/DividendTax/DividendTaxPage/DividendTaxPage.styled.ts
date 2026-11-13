import styled from '@emotion/styled';
import { color, radius, space } from '@/shared/styles';

/**
 * 세금 계산기(2026-11-12, 같은 날 정렬 재작업 · 2026-11-13 컴포넌트 분리). 페이지 골격(폭·패널·입력 격자·설명 글)은
 * 공용 `CalculatorLayout`, 결과·비교·공유 조각은 `pages/DividendTax/components/*` 가 각자 스타일을 갖는다.
 * 여기에는 페이지에만 쓰는 각주 상자만 남는다.
 */
export const Footnotes = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;
