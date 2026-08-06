import type { TickerContent } from './TickerContent.types';

/**
 * SCHH(슈왑 미국 리츠 ETF) SEO 랜딩 콘텐츠 — VNQ와 같은 미국 리츠 ETF 카테고리지만 슈왑 특유의
 * 초저보수(0.07%)가 핵심 차별점. `schd.ts` 계열의 슈왑 가문 액센트를 공유한다.
 *
 * 숫자 출처:
 * - 계산 6필드는 `shared/constants/presets`(`REIT_ETFS.SCHH`)에서 그대로 온다.
 * - 상장일(2011년 1월 13일)·총보수(0.07%)·추종지수(Dow Jones Equity All REIT Capped Index,
 *   모기지·하이브리드 리츠 제외)·보유종목수(약 120종)·상위 10종 비중(약 49.49%)은 복수 소스로
 *   2026년 8월 교차 확인. ⚠ 슈왑 발행사 페이지는 SCHD·SCHY 조사 때와 동일하게 스크립트 렌더로
 *   직접 확인이 막혀 있어(decisions.md 2026-08-02 SCHD 항목 참고), 이번에도 제3자 소스로
 *   교차 확인했다.
 */
export const SCHH_TICKER_CONTENT: TickerContent = {
  ticker: 'SCHH',
  slug: 'schh',
  categoryIds: ['reit'],
  metaTitle: 'SCHH 배당률·운용보수·구성 총정리 — 슈왑 미국 리츠 ETF',
  metaDescription:
    'SCHH(슈왑 미국 리츠 ETF)의 배당률·운용보수 0.07%·모기지 리츠 제외 구성을 정리했습니다. 업계 최저 수준 보수로 미국 리츠에 분산 투자하고 싶다면 여기서 확인하세요.',
  heroTagline: '모기지·하이브리드 리츠를 뺀 실물 부동산 리츠만, 업계 최저 수준 보수로 담는 ETF',
  sections: [
    {
      id: 'overview',
      navLabel: '개요',
      heading: 'SCHH, 무엇을 추종하는 ETF인가',
      paragraphs: [
        'SCHH(슈왑 미국 리츠 ETF, {{englishName}})는 2011년 1월 13일 상장한 ETF로, Dow Jones Equity All REIT Capped Index를 추종합니다. SCHD와 같은 슈왑 자산운용의 초저비용 라인업에 속하는 상품입니다.',
        '이 지수의 특징은 모기지 리츠(mREIT)와 하이브리드 리츠를 의도적으로 제외한다는 점입니다. 대출·채권 성격이 섞인 모기지 리츠 대신, 실제 부동산을 보유하고 임대하는 "에쿼티 리츠"만 담습니다.',
        '{{koreanName}}는 이 시뮬레이터의 계산 프리셋에서 배당률 {{dividendYield}}, 연 배당성장률(가정) {{dividendGrowth}}, {{frequencyLabel}} 지급을 기준으로 합니다.'
      ],
      stat: {
        label: '추종 지수',
        value: 'Dow Jones Equity All REIT Capped Index',
        caption: '모기지·하이브리드 리츠를 제외하고 실물 부동산 보유 리츠만 담는 지수'
      }
    },
    {
      id: 'dividend-yield',
      navLabel: '배당률',
      heading: '배당률 {{dividendYield}}, 리츠 과세 구조가 만드는 숫자',
      paragraphs: [
        'SCHH의 배당률은 {{dividendYield}} 안팎입니다. VNQ와 마찬가지로, 미국 리츠는 과세소득의 대부분을 배당으로 지급해야 법인세 혜택을 받는 구조라 일반 주식 ETF보다 배당률이 높게 형성되는 경향이 있습니다.',
        '모기지 리츠를 제외했다는 점에서 VNQ와 미묘한 차이가 생깁니다. 모기지 리츠는 대체로 배당률이 더 높은 편이라, 이를 제외한 SCHH는 순수 에쿼티 리츠만 남아 VNQ보다 상대적으로 안정적인 배당 흐름을 보이는 경향이 있습니다.',
        '배당률은 주가에 따라 매일 움직이는 값이라, 이 페이지의 숫자는 작성 시점 기준입니다. 내 조건에서의 실제 현금흐름은 시뮬레이터에서 직접 계산해 보세요.'
      ],
      stat: {
        label: '배당률(세전, 명목)',
        value: '{{dividendYield}}',
        caption: '시뮬레이터 계산 프리셋 기준 — 실제 배당률은 주가와 분배금에 따라 달라집니다'
      }
    },
    {
      id: 'dividend-growth',
      navLabel: '배당성장',
      heading: '임대료 기반의 완만한 성장, 분기마다 오르내림',
      paragraphs: [
        '이 시뮬레이터의 계산 프리셋은 SCHH의 연 배당성장률(가정)을 {{dividendGrowth}}, 기대 총수익률을 {{expectedTotalReturn}}로 둡니다. 이 성장률은 과거 실적의 재현이 아니라 향후 흐름에 대한 가정입니다.',
        '리츠의 배당 재원은 임대료입니다. 임대료는 물가와 함께 완만히 오르는 경향이 있지만, 배당성장 ETF처럼 매년 꾸준히 인상되는 모습과는 다릅니다. 공실률이 오르거나 재계약 조건이 나빠지면 분배금이 줄어들 수 있습니다.',
        '모기지 리츠를 제외한 만큼 금리 급변동에 따른 분배금 충격은 VNQ보다 상대적으로 덜할 수 있지만, 실물 부동산 리츠도 금리와 부동산 경기에서 자유롭지 않습니다.'
      ],
      stat: {
        label: '연 배당성장률(계산 가정)',
        value: '{{dividendGrowth}}',
        caption: '기대 총수익 {{expectedTotalReturn}}에서 배당률을 뺀 값 — 관측치가 아니라 큐레이터의 가정입니다'
      }
    },
    {
      id: 'expense-ratio',
      navLabel: '운용보수',
      heading: '총보수 0.07% — 리츠 ETF 중 업계 최저 수준',
      paragraphs: [
        'SCHH의 총보수는 0.07%로, 같은 카테고리의 VNQ(0.13%)보다도 낮습니다. SCHD와 마찬가지로 슈왑 자산운용의 초저비용 전략이 그대로 적용된 결과입니다.',
        '리츠라는 별도 자산군에 대한 노출을 이 정도 보수로 얻을 수 있다는 점은, 실물 부동산을 직접 매입할 때 드는 취득세·중개수수료·관리비와 비교하면 확연한 차이입니다.',
        '보수는 매년 총수익에서 조용히 빠져나갑니다. 같은 미국 리츠 카테고리 안에서도 상품마다 보수와 편입 범위가 다르므로 VNQ와 함께 비교해 보시는 편이 좋습니다.'
      ],
      stat: {
        label: '운용보수(총보수)',
        value: '0.07%',
        caption: '복수 소스 교차 확인(2026년 8월 기준) — 슈왑 발행사 페이지는 스크립트 렌더로 직접 확인 불가'
      }
    },
    {
      id: 'selection-criteria',
      navLabel: '구성 기준',
      heading: '모기지 리츠를 뺀, 실물 부동산 보유 리츠만의 분산',
      paragraphs: [
        'SCHH가 추종하는 지수는 미국에 상장된 리츠 중 모기지 리츠와 하이브리드 리츠를 제외한 에쿼티 리츠만을 후보로 삼습니다. 최소 시가총액·유동성 기준도 함께 적용됩니다.',
        '2026년 8월 기준 약 120종을 담고 있으며, 상위 10종의 비중 합계가 약 49.49%로 절반 가까이를 차지합니다. 데이터센터·물류창고·통신탑·리테일·주거 등 다양한 부동산 유형이 섞여 있습니다.',
        '한 종목이 지수 내 비중 상한(cap)을 넘지 못하도록 규칙(Capped)이 적용돼 있어, 특정 대형 리츠 하나에 과도하게 쏠리는 것을 막습니다.'
      ]
    },
    {
      id: 'who-and-tradeoffs',
      navLabel: '적합성·트레이드오프',
      heading: '어떤 투자자에게 맞고, 무엇을 포기하는가',
      paragraphs: [
        'SCHH는 이런 투자자에게 맞습니다. 업계 최저 수준의 낮은 보수로 미국 리츠에 분산 투자하고 싶은 사람, 모기지 리츠의 금리 민감도를 피하고 실물 부동산 보유 리츠에 집중하고 싶은 사람, 이미 SCHD를 보유하고 같은 발행사의 저비용 상품으로 리츠 노출을 더하고 싶은 사람입니다.',
        '포기하는 것도 있습니다. 첫째, 금리가 오르면 리츠는 대체로 압박을 받습니다. 둘째, 분배금이 분기마다 오르내려 안정적인 증배를 기대하기 어렵습니다. 셋째, 한 섹터에 집중된 상품이라 부동산 경기가 나쁠 때 전체가 함께 흔들립니다.',
        '더 넓은 편입 범위(모기지 리츠 포함)를 원한다면 VNQ, 월 단위 현금흐름을 원한다면 개별 월배당 리츠 O와 함께 비교해 보세요.'
      ]
    }
  ],
  faqs: [
    {
      question: 'SCHH 배당률은 얼마인가요?',
      answer:
        '이 시뮬레이터가 쓰는 계산 프리셋 기준 SCHH의 명목 배당률(세전)은 {{dividendYield}}입니다. 리츠는 과세소득 대부분을 배당해야 하는 구조라 일반 주식 ETF보다 배당률이 높게 형성되는 편입니다.'
    },
    {
      question: 'SCHH는 어떤 지수를 추종하나요?',
      answer:
        'Dow Jones Equity All REIT Capped Index를 추종합니다. 모기지·하이브리드 리츠를 제외하고 실물 부동산을 보유·임대하는 에쿼티 리츠만 담습니다.'
    },
    {
      question: 'SCHH 운용보수(총보수)는 얼마인가요?',
      answer: '0.07%입니다. 같은 카테고리의 VNQ(0.13%)보다 낮은, 리츠 ETF 중에서도 업계 최저 수준입니다.'
    },
    {
      question: 'SCHH와 VNQ는 무엇이 다른가요?',
      answer:
        'SCHH는 모기지·하이브리드 리츠를 제외하고 에쿼티 리츠만 담는 반면, VNQ는 더 넓은 범위를 담습니다. 보수도 SCHH(0.07%)가 VNQ(0.13%)보다 낮습니다.'
    },
    {
      question: 'SCHH는 몇 종목을 담고 있나요?',
      answer: '2026년 8월 기준 약 120종을 담고 있으며, 상위 10종 비중 합계가 약 49.49%입니다.'
    },
    {
      question: 'SCHH 배당은 얼마나 자주 지급되나요?',
      answer: 'SCHH는 {{frequencyLabel}} 지급됩니다. 정확한 배당락일·지급일은 매 분기 공지에 따라 달라질 수 있습니다.'
    },
    {
      question: 'SCHH 배당에 붙는 세금은 어떻게 계산하나요?',
      answer:
        '리츠 분배금은 일반 기업 배당과 세무상 성격이 다를 수 있고, 세율은 거주 국가와 계좌 종류에 따라 달라져 이 페이지가 대신 알려드릴 수 없습니다. 이 시뮬레이터에서는 세율을 직접 입력해 세후 배당을 계산해 볼 수 있습니다.'
    }
  ],
  reference: {
    trackedIndex: 'Dow Jones Equity All REIT Capped Index',
    inceptionYear: 2011,
    expenseRatioPercent: 0.07,
    holdingsCountApprox: 120,
    paymentMonthsNote: '연 4회 분기 지급',
    asOfNote:
      '상장일(2011년 1월 13일)·총보수(0.07%)·추종지수(Dow Jones Equity All REIT Capped Index, 모기지·하이브리드 리츠 제외)·보유종목수(약 120종)·상위 10종 비중(약 49.49%)은 복수 소스로 2026년 8월 교차 확인한 사실입니다. 슈왑 발행사 공식 상품 페이지는 스크립트 렌더로 직접 확인이 막혀 있어(SCHD·SCHY와 동일한 제약) 제3자 소스로 교차 확인했습니다. 대표 섹터 비중·대표 보유 종목은 이번 조사에서 발행사 공식 보유 종목 파일을 확보하지 못해 비웠습니다. 배당률·배당성장률·기대수익률 등 계산에 쓰이는 값은 이 페이지가 아니라 시뮬레이터 계산 프리셋을 그대로 따릅니다.'
  },
  relatedTickers: [
    { ticker: 'VNQ', relationLabel: '더 넓은 편입 범위의 미국 리츠 ETF를 원한다면' },
    { ticker: 'O', relationLabel: '월 단위 현금흐름을 주는 개별 리츠를 보고 싶다면' },
    { ticker: 'VNQI', relationLabel: '미국 밖 부동산으로 넓히고 싶다면' },
    { ticker: 'SCHD', relationLabel: '부동산 대신 배당성장 쪽으로 무게를 옮긴다면' }
  ],
  // 슈왑(Charles Schwab) 정체성 — SCHD·SCHY와 같은 계열, 톤만 살짝 다르게. 장식 전용.
  accent: {
    from: '#0a3d52',
    to: '#3fb8d9',
    textLight: '#0a5570',
    textDark: '#7fd4e8'
  },
  disclaimer:
    '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있으며, 과거 성과가 미래 수익을 보장하지 않습니다. 리츠는 금리와 부동산 경기에 민감한 단일 섹터 자산이고, 분배금의 세무상 성격이 일반 기업 배당과 다를 수 있습니다. 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
  contentUpdatedAt: '2026-08-06'
};
