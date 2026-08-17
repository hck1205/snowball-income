import type { InvestorAxisId } from './investorTypeAxes';

/**
 * 성향 테스트 **12문항** — 축당 3문항.
 *
 * ## 🔴 문항 규율 (어기면 축이 죽는다)
 *  1. **선호가 아니라 상황을 묻는다.** "분산이 좋습니까?" 는 전원이 예라고 답한다. "한 종목이 40%가
 *     됐습니다, 어떻게 하시겠습니까?" 는 실제로 갈린다.
 *  2. **선택지는 넷이고 점수는 0·1·2·3 고정**이다. 순서가 곧 점수라 배열 순서를 바꾸면 채점이 바뀐다 —
 *     문구만 고칠 때도 순서를 건드리지 마라.
 *  3. **정답이 없다.** 어느 선택지도 더 나은 것으로 읽히면 안 된다(투자 권유 금지 규율).
 *  4. **지어낸 수익률을 약속하지 않는다.** Q8 의 범위는 "이런 폭이라면 어느 쪽을 고르겠는가"라는
 *     가정이지 예측이 아니다 — 문구가 조건부인 이유다.
 *  5. 격식체(합니다체) 통일.
 *
 * ⚠ 문항을 늘리거나 줄이면 `scoreAnswers` 의 정규화가 축당 문항 수를 데이터에서 세므로 코드는
 *   그대로다. 다만 **축당 개수는 같게** 유지해라 — 한 축만 4문항이면 그 축의 해상도만 높아진다.
 */

export type InvestorQuestionOption = {
  /** 화면에 보이는 문장. */
  readonly label: string;
  /** 0~3. 배열 순서와 같아야 한다(`investorTypeQuestions.test.ts` 가 잠근다). */
  readonly score: 0 | 1 | 2 | 3;
};

export type InvestorQuestion = {
  readonly id: string;
  readonly axis: InvestorAxisId;
  /** 상황 서술. 없으면 질문만 나간다. */
  readonly context?: string;
  readonly question: string;
  readonly options: readonly [
    InvestorQuestionOption,
    InvestorQuestionOption,
    InvestorQuestionOption,
    InvestorQuestionOption
  ];
};

export const INVESTOR_QUESTIONS: readonly InvestorQuestion[] = [
  // ── 축1 집중도: 0 소수 집중 ←→ 3 넓은 분산 ──────────────────────────────
  {
    id: 'concentration-1',
    axis: 'concentration',
    context: '새로 투자할 돈이 생겼습니다.',
    question: '어떻게 나누시겠습니까?',
    options: [
      { label: '가장 확신이 큰 한 종목에 전부 넣습니다', score: 0 },
      { label: '잘 아는 두세 종목에 나눠 넣습니다', score: 1 },
      { label: '여러 종목에 고르게 나눠 넣습니다', score: 2 },
      { label: '넓게 담은 ETF 한두 개에 넣습니다', score: 3 }
    ]
  },
  {
    id: 'concentration-2',
    axis: 'concentration',
    context: '보유 종목 하나가 오르면서 전체의 40%를 넘었습니다.',
    question: '어떻게 하시겠습니까?',
    options: [
      { label: '잘 고른 것이니 그대로 둡니다', score: 0 },
      { label: '신경은 쓰이지만 손대지 않습니다', score: 1 },
      { label: '일부 덜어 비중을 낮춥니다', score: 2 },
      { label: '원래 비중으로 되돌립니다', score: 3 }
    ]
  },
  {
    id: 'concentration-3',
    axis: 'concentration',
    question: '종목을 고를 때 무엇을 더 믿으십니까?',
    options: [
      { label: '깊이 조사한 소수 종목에 대한 제 판단', score: 0 },
      { label: '제 판단, 다만 몇 종목으로는 나눕니다', score: 1 },
      { label: '시장 평균에 가까운 구성', score: 2 },
      { label: '개별 판단을 뺀 지수 추종', score: 3 }
    ]
  },

  // ── 축2 목적: 0 지금 현금흐름 ←→ 3 나중 총수익 ──────────────────────────
  {
    id: 'purpose-1',
    axis: 'purpose',
    /**
     * ⚠ 처음엔 "둘 중 하나만 고르라"고 묻고 선택지를 넷 두었다. 그러면 가운데 둘이
     *   "둘 중에는 5% 쪽에 기웁니다" 같은 **억지 표현**이 된다 — 이분법 질문에 4단 답을 붙인 탓이다
     *   (2026-08-18 사용자 지적). 질문을 "어디에 무게를 두는가"로 바꾸니 넷이 자연스러운 배분 단계가 됐다.
     * 🔴 다른 문항을 고칠 때도 같은 함정을 조심해라 — **질문이 이분법이면 선택지도 둘이어야 한다.**
     *   축당 3문항 × 4선택지 구조를 지키려면 질문을 정도(程度)로 물어야 한다.
     */
    context:
      '배당률 5%인데 배당이 늘지 않는 종목과, 배당률 1.5%인데 배당이 해마다 10%씩 느는 종목이 있다고 가정합니다.',
    question: '어느 쪽에 무게를 두시겠습니까?',
    options: [
      { label: '5% 쪽에 전부 넣습니다', score: 0 },
      { label: '5% 쪽을 더 많이 담습니다', score: 1 },
      { label: '1.5% 쪽을 더 많이 담습니다', score: 2 },
      { label: '1.5% 쪽에 전부 넣습니다', score: 3 }
    ]
  },
  {
    id: 'purpose-2',
    axis: 'purpose',
    question: '받은 배당을 어떻게 하십니까?',
    options: [
      { label: '생활비로 씁니다', score: 0 },
      { label: '일부만 다시 넣습니다', score: 1 },
      { label: '대부분 다시 넣습니다', score: 2 },
      { label: '전액 다시 넣습니다', score: 3 }
    ]
  },
  {
    id: 'purpose-3',
    axis: 'purpose',
    question: '계좌를 열었을 때 가장 먼저 확인하는 숫자는 무엇입니까?',
    options: [
      { label: '이번 달에 들어온 배당금', score: 0 },
      { label: '올해 들어온 배당 합계', score: 1 },
      { label: '전체 평가액', score: 2 },
      { label: '누적 수익률', score: 3 }
    ]
  },

  // ── 축3 변동성: 0 원금 방어 ←→ 3 하락 감내 ──────────────────────────────
  {
    id: 'volatility-1',
    axis: 'volatility',
    context: '보유 종목이 6개월 만에 30% 내렸습니다. 배당은 그대로 나오고 있습니다.',
    question: '어떻게 하시겠습니까?',
    options: [
      { label: '팝니다', score: 0 },
      { label: '일부 줄입니다', score: 1 },
      { label: '그대로 둡니다', score: 2 },
      { label: '더 삽니다', score: 3 }
    ]
  },
  {
    id: 'volatility-2',
    axis: 'volatility',
    context: '1년 뒤 수익률이 아래 네 범위 중 하나에서 정해진다고 가정합니다.',
    question: '어느 쪽을 고르시겠습니까?',
    options: [
      { label: '+3% 확정', score: 0 },
      { label: '-5% ~ +12%', score: 1 },
      { label: '-20% ~ +30%', score: 2 },
      { label: '-40% ~ +60%', score: 3 }
    ]
  },
  {
    id: 'volatility-3',
    axis: 'volatility',
    context: '보유 종목에 대한 나쁜 소식을 뉴스에서 봤습니다.',
    question: '가장 먼저 무엇을 하십니까?',
    options: [
      { label: '일단 팔고 나서 확인합니다', score: 0 },
      { label: '비중을 줄이고 지켜봅니다', score: 1 },
      { label: '사실을 확인할 때까지 손대지 않습니다', score: 2 },
      { label: '값이 싸졌는지부터 봅니다', score: 3 }
    ]
  },

  // ── 축4 시간: 0 5년 이내 ←→ 3 20년 이상 ────────────────────────────────
  {
    id: 'horizon-1',
    axis: 'horizon',
    question: '지금 넣는 돈을 언제 쓸 계획이십니까?',
    options: [
      { label: '5년 안에 씁니다', score: 0 },
      { label: '5년에서 10년 사이에 씁니다', score: 1 },
      { label: '10년에서 20년 사이에 씁니다', score: 2 },
      { label: '20년 뒤이거나 아직 정하지 않았습니다', score: 3 }
    ]
  },
  {
    id: 'horizon-2',
    axis: 'horizon',
    question: '한 종목을 사면 보통 얼마나 오래 들고 계십니까?',
    options: [
      { label: '몇 달쯤 들고 있습니다', score: 0 },
      { label: '1년에서 3년쯤 들고 있습니다', score: 1 },
      { label: '3년에서 10년쯤 들고 있습니다', score: 2 },
      { label: '팔 이유가 생기기 전까지 계속 둡니다', score: 3 }
    ]
  },
  {
    id: 'horizon-3',
    axis: 'horizon',
    question: '지금 목표에 가장 가까운 문장은 무엇입니까?',
    options: [
      { label: '가까운 시일 안에 생활비를 배당으로 채우고 싶습니다', score: 0 },
      { label: '몇 년 안에 받는 배당을 눈에 띄게 늘리고 싶습니다', score: 1 },
      { label: '은퇴 시점에 맞춰 키우고 싶습니다', score: 2 },
      { label: '오래 두고 최대한 키우고 싶습니다', score: 3 }
    ]
  }
] as const;

export const INVESTOR_QUESTION_COUNT = INVESTOR_QUESTIONS.length;

export const findInvestorQuestion = (id: string): InvestorQuestion | undefined =>
  INVESTOR_QUESTIONS.find((question) => question.id === id);
