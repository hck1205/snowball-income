/**
 * 투자 성향 테스트의 **네 축**.
 *
 * ## 왜 네 개인가
 * 축을 늘리면 문항이 늘고(축당 3문항 = 12문항), 늘어난 문항만큼 중간 이탈이 는다. 줄이면 유형이
 * 뭉개진다. 넷은 "배당 재투자 도구가 실제로 갈라 줄 수 있는 것"의 최소 집합이다 — 이 앱이 프리셋과
 * 계산기로 답할 수 있는 질문이 딱 이 넷이다(무엇을 몇 개 담을지 · 지금 받을지 나중에 받을지 ·
 * 얼마나 흔들려도 되는지 · 언제 쓸 돈인지).
 *
 * ## 🔴 축은 선호가 아니라 **판단 상황**으로 묻는다
 * "분산이 좋다고 생각하십니까?" 는 전원이 예라고 답해 축이 죽는다. `investorTypeQuestions` 의 문항이
 * 전부 구체적 상황인 것은 그래서다 — 그 규율을 깨면 이 축들이 의미를 잃는다.
 *
 * ## 방향 규약
 * 모든 축은 **0 = low 쪽, 100 = high 쪽**이다. 어느 쪽이 "좋다"는 뜻은 없다 — 결과 화면도 우열로
 * 읽히지 않게 쓴다(투자 권유 금지 규율).
 */

export type InvestorAxisId = 'concentration' | 'purpose' | 'volatility' | 'horizon';

export type InvestorAxis = {
  readonly id: InvestorAxisId;
  /** 축 이름 — 결과 화면의 막대 라벨. */
  readonly label: string;
  /** 0 쪽 끝의 이름. */
  readonly low: string;
  /** 100 쪽 끝의 이름. */
  readonly high: string;
  /** 이 축이 무엇을 재는지 한 문장. 결과 화면에서 막대 아래에 붙는다. */
  readonly caption: string;
};

export const INVESTOR_AXES: readonly InvestorAxis[] = [
  {
    id: 'concentration',
    label: '집중도',
    low: '소수 집중',
    high: '넓은 분산',
    caption: '몇 개에 나눠 담는 편인지를 봅니다.'
  },
  {
    id: 'purpose',
    label: '목적',
    low: '지금 현금흐름',
    high: '나중 총수익',
    caption: '받은 배당을 쓰는 쪽인지 다시 넣는 쪽인지를 봅니다.'
  },
  {
    id: 'volatility',
    label: '변동성',
    low: '원금 방어',
    high: '하락 감내',
    caption: '값이 흔들릴 때 어떻게 하시는지를 봅니다.'
  },
  {
    id: 'horizon',
    label: '시간',
    low: '5년 이내',
    high: '20년 이상',
    caption: '언제 쓸 돈인지를 봅니다.'
  }
] as const;

/** 축 점수 한 벌. 값은 **0~100 정수**다. */
export type InvestorAxisScores = Readonly<Record<InvestorAxisId, number>>;

export const INVESTOR_AXIS_IDS = INVESTOR_AXES.map((axis) => axis.id);

export const findInvestorAxis = (id: InvestorAxisId): InvestorAxis | undefined =>
  INVESTOR_AXES.find((axis) => axis.id === id);
