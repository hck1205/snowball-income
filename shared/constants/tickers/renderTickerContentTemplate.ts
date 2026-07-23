import type { TickerEngineFacts } from './resolveTickerEngineFacts';

/**
 * 지원하는 토큰 → `TickerEngineFacts` 표시값 매핑. 템플릿 엔진이 아니라 고정된 토큰 집합에
 * 대한 문자열 치환 하나 — 새 토큰이 필요해지면 이 맵과 `TickerEngineFacts`에 같이 추가한다.
 */
const buildTokenMap = (facts: TickerEngineFacts): Record<string, string> => ({
  ticker: facts.ticker,
  englishName: facts.englishName,
  koreanName: facts.koreanName,
  dividendYield: facts.dividendYieldDisplay,
  dividendGrowth: facts.dividendGrowthDisplay,
  expectedTotalReturn: facts.expectedTotalReturnDisplay,
  frequencyLabel: facts.frequencyLabel,
  initialPrice: facts.initialPriceDisplay
});

/**
 * 콘텐츠 문자열 속 `{{token}}`을 `TickerEngineFacts`(=프리셋에서 그대로 조인한 값)로 치환한다.
 * 지원하지 않는 토큰은 조용히 지우지 않고 원문 그대로 남긴다 — 오탈자(`{{dividendYeild}}` 등)가
 * 화면에 그대로 보여야 콘텐츠 리뷰 단계에서 바로 눈에 띈다.
 *
 * 왜 숫자를 콘텐츠 데이터에 직접 적지 않는가: 배당률·배당성장률·기대수익률은 시장데이터
 * 자동 갱신 파이프라인(크론)이 주기적으로 프리셋을 덮어쓴다. 문자열에 그 숫자를 직접 박으면
 * 프리셋이 갱신된 뒤에도 콘텐츠는 옛 숫자를 보여줘 "숫자 날조"와 같은 결과가 된다. 토큰으로
 * 두면 렌더 시점의 프리셋 값이 항상 반영된다.
 */
export const renderTickerContentTemplate = (text: string, facts: TickerEngineFacts): string => {
  const tokens = buildTokenMap(facts);

  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token: string) => (token in tokens ? tokens[token] : match));
};
