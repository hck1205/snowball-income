import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 눈에 띄지 않게, 그러나 읽히게. 당시의 `textMuted`는 앱 배경 위에서 WCAG AA(4.5:1)에
 * 못 미쳐 `textSecondary`를 쓴다 — 토큰 값이 바뀌어도 더 진한 단계라 항상 안전 마진이 있다.
 */
/*
 * 🔴 `footer` 가 아니라 `p` 다(2026-08-04).
 * `<footer>` 가 main/section/article 밖에 있으면 **contentinfo 랜드마크**가 된다. 이 각주는
 * `FeatureLayout` 직계라 그 조건에 걸렸고, 같은 층의 공용 `PageFooter` 와 합쳐 시뮬레이터에만
 * **contentinfo 가 둘** 있었다(실측: 21개 라우트 중 /simulator 만 2개).
 * 랜드마크가 둘이면 스크린리더의 "페이지 정보로 가기"가 어디로 갈지 사용자가 알 수 없다.
 * 이건 페이지의 마무리가 아니라 **숫자 하나에 붙은 각주**다 — 문단이 맞다.
 * ⚠ 접근명으로 구분하려던 종전 처방은 랜드마크 자체를 없애는 것보다 약하다. 되돌리지 마라.
 */
export const MarketDataFootnote = styled.p`
  margin: 0;
  padding: 0 ${space[1]};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  text-align: right;
`;

export const MarketDataDate = styled.time`
  ${font.numeric}
  font-weight: ${font.weight.medium};
`;
