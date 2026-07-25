import { CHART_SERIES_VARS } from '@/shared/styles';

/**
 * 티커 → 시리즈 색 CSS 변수. **이름 해시 기반**이라 선택 순서·달·화면과 무관하게
 * 같은 티커는 항상 같은 색이다 — 달을 넘기며 같은 종목을 눈으로 추적하는 용도라
 * "안 바뀌는 것"이 색이 겹치지 않는 것보다 중요하다(8색 순환이라 충돌은 허용).
 * CSS 변수라 팔레트 프리셋·다크 전환을 리렌더 없이 따라간다.
 */
export const tickerSeriesVar = (ticker: string): string => {
  let hash = 0;
  for (let index = 0; index < ticker.length; index += 1) {
    hash = (hash * 31 + ticker.charCodeAt(index)) | 0;
  }
  return CHART_SERIES_VARS[Math.abs(hash) % CHART_SERIES_VARS.length];
};
