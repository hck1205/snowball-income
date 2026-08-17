import { DIVIDEND_LIST_HUB_PATH, SIMULATOR_PATH } from '@/shared/constants/routes';
import type { InvestorAxisScores } from './investorTypeAxes';

/**
 * 성향 **여섯 유형**과 그 유형이 이어지는 곳.
 *
 * ## 왜 여섯인가
 * 축이 넷이니 조합은 16이지만, 16개 유형은 이름이 서로 구별되지 않고 각 유형에 붙일 근거도 없다.
 * 여섯은 **이 앱이 실제로 다르게 대접할 수 있는 갈래의 수**다 — 유형마다 프리셋이 다르고, 넷은
 * 13F 실측으로 닮은 투자자를 댈 수 있다.
 *
 * ## 🔴 대가 매칭은 13F 가 **실제로 말하는 것**만 쓴다
 * 공시가 알려 주는 것은 보유 종목·종목 수·비중이다. 그래서 매칭 근거도 거기서만 온다 —
 * 버핏 29종·1위 22% 는 "집중"이고 켄 피셔 1037종은 "분산"이다. **"이 사람은 배당을 좋아한다"
 * 같은 말은 13F 에 없다.** 그래서 현금흐름 성향 두 유형(`monthly-income`·`retirement-ready`)은
 * `investors` 가 **빈 배열**이다. 억지로 채우지 마라 — 데이터가 말하지 않는 것을 말하게 된다.
 * ⚠ 결과 화면은 빈 배열을 정상 상태로 그린다(대가 카드 자리를 비우고 프리셋을 앞세운다).
 *
 * ## 🔴 유형 이름은 성격 진단이 아니다
 * "당신은 공격적입니다" 같은 판정을 하지 않는다. 이름은 **행동의 서술**(집중 가치형·월 현금흐름형)
 * 이고, 어느 유형도 더 나은 것으로 읽히면 안 된다(투자 권유 금지 규율).
 */

export type InvestorTypeId =
  | 'concentrated-value'
  | 'broad-diversified'
  | 'macro-allocator'
  | 'long-holder'
  | 'monthly-income'
  | 'retirement-ready';

/** 13F 로 뒷받침되는 매칭만 싣는다. `cik` 은 `investorHoldings.generated.json` 의 키다. */
export type InvestorTypeMatch = {
  readonly cik: string;
  readonly person: string;
  /** 무엇이 닮았는지 — **공시에서 읽히는 사실**로만 쓴다. */
  readonly why: string;
};

export type InvestorTypeNextLink = {
  readonly label: string;
  readonly to: string;
};

export type InvestorTypeProfile = {
  readonly id: InvestorTypeId;
  readonly name: string;
  /** 한 줄 정의. 결과 화면 제목 아래. */
  readonly tagline: string;
  /** 두세 문장 설명. */
  readonly description: string;
  /** 이 유형의 **기준 좌표**(0~100). 가장 가까운 유형을 고르는 데 쓴다. */
  readonly ideal: InvestorAxisScores;
  readonly investors: readonly InvestorTypeMatch[];
  /** `shared/constants/portfolioPresets` 의 프리셋 id. 결과에서 계산기로 채워 넣는다. */
  readonly presetId: string;
  readonly next: readonly InvestorTypeNextLink[];
};

export const INVESTOR_TYPE_PROFILES: readonly InvestorTypeProfile[] = [
  {
    id: 'concentrated-value',
    name: '집중 가치형',
    tagline: '아는 것에 크게 걸고, 오래 들고 계십니다.',
    description:
      '고른 종목의 수가 적고 한 종목의 비중이 큽니다. 값이 흔들려도 판단이 바뀌지 않으면 손대지 않는 편이고, 배당은 쓰기보다 다시 넣는 쪽에 가깝습니다.',
    ideal: { concentration: 15, purpose: 75, volatility: 80, horizon: 85 },
    investors: [
      {
        cik: '0001067983',
        person: '워런 버핏',
        why: '공시된 보유 종목이 29종이고 1위 종목 하나가 전체의 22%입니다.'
      },
      {
        cik: '0001709323',
        person: '리루',
        why: '보유 종목이 8종뿐이고 1위 비중이 24%를 넘습니다.'
      }
    ],
    presetId: 'warren-buffett-style',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '대가들의 실제 보유 종목', to: '/portfolio/investors' }
    ]
  },
  {
    id: 'broad-diversified',
    name: '넓은 분산형',
    tagline: '고르는 일보다 나누는 일에 무게를 두십니다.',
    description:
      '한 종목의 판단이 전체를 흔들지 않도록 넓게 나눕니다. 개별 종목을 깊이 파는 대신 구성 전체가 시장을 닮게 두는 편이고, 그만큼 한 종목의 소식에 덜 흔들립니다.',
    ideal: { concentration: 95, purpose: 50, volatility: 45, horizon: 70 },
    investors: [
      {
        cik: '0000850529',
        person: '켄 피셔',
        why: '공시된 보유 종목이 1,037종이고 1위 비중도 5%대에 그칩니다.'
      }
    ],
    presetId: 'smart-diversification-360',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '종목을 나란히 비교하기', to: '/ticker/compare' }
    ]
  },
  {
    id: 'macro-allocator',
    name: '거시 배분형',
    tagline: '개별 종목보다 자산 전체의 배치를 보십니다.',
    description:
      '어떤 종목인가보다 어디에 얼마나 놓여 있는가를 먼저 봅니다. 넓게 나누되 시장 상황에 따라 배치를 조정하는 편이고, 총수익 쪽에 기울어 있습니다.',
    ideal: { concentration: 80, purpose: 85, volatility: 60, horizon: 65 },
    investors: [
      {
        cik: '0001350694',
        person: '레이 달리오',
        why: '보유 종목이 997종으로 넓게 퍼져 있으면서 1위 비중은 16%로 배치가 뚜렷합니다.'
      },
      {
        cik: '0001536411',
        person: '스탠리 드러켄밀러',
        why: '95종을 들고 있으면서 1위 비중이 16%대로, 넓히되 무게를 싣는 형태입니다.'
      }
    ],
    presetId: 'global-dividend-diversified',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '지금 시장 온도 보기', to: '/market/pulse' }
    ]
  },
  {
    id: 'long-holder',
    name: '장기 보유형',
    tagline: '사고파는 횟수가 적고, 시간을 편으로 두십니다.',
    description:
      '한 번 담으면 오래 둡니다. 배당이 해마다 조금씩 늘어나는 것을 중요하게 보고, 짧은 기간의 등락으로 구성을 바꾸지 않는 편입니다.',
    ideal: { concentration: 35, purpose: 55, volatility: 45, horizon: 95 },
    investors: [
      {
        cik: '0001166559',
        person: '빌 게이츠 재단',
        why: '24종을 들고 1위 비중이 21%이며, 분기마다 구성이 거의 바뀌지 않습니다.'
      },
      {
        cik: '0000915191',
        person: '프렘 왓사',
        why: '32종에 1위 비중 21%로, 보유 기간이 길고 회전이 적은 형태입니다.'
      }
    ],
    presetId: 'stable-dividend-growth',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '배당을 오래 늘려 온 기업들', to: DIVIDEND_LIST_HUB_PATH }
    ]
  },
  {
    id: 'monthly-income',
    name: '월 현금흐름형',
    tagline: '해마다가 아니라 다달이 들어오는 쪽을 보십니다.',
    description:
      '배당이 언제 들어오는지가 얼마나 들어오는지만큼 중요합니다. 지급 월이 겹치지 않게 짜서 매달 비슷한 금액이 들어오도록 맞추는 편이고, 원금이 크게 흔들리는 것은 피하십니다.',
    ideal: { concentration: 70, purpose: 10, volatility: 25, horizon: 40 },
    // 🔴 비어 있는 것이 맞다 — 13F 는 "이 사람은 월 현금흐름을 노린다"를 말하지 않는다.
    investors: [],
    presetId: 'reit-monthly-rent-strategy',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '종목별 배당 지급 월 보기', to: '/dividend/calendar' }
    ]
  },
  {
    id: 'retirement-ready',
    name: '은퇴 준비형',
    tagline: '쓸 시점이 정해져 있어, 지키는 것을 먼저 보십니다.',
    description:
      '돈을 쓸 시점이 비교적 가깝습니다. 크게 불리는 것보다 원금이 줄지 않는 것을 앞에 두고, 들어오는 배당이 예측 가능한지를 중요하게 보십니다.',
    ideal: { concentration: 75, purpose: 25, volatility: 20, horizon: 25 },
    // 🔴 위와 같은 이유로 비어 있다.
    investors: [],
    presetId: 'retirement-prep',
    next: [
      { label: '이 구성으로 계산해 보기', to: SIMULATOR_PATH },
      { label: '월 배당 목표까지 얼마가 필요한가', to: '/guide/monthly-dividend-goal' }
    ]
  }
] as const;

export const findInvestorTypeProfile = (id: InvestorTypeId): InvestorTypeProfile | undefined =>
  INVESTOR_TYPE_PROFILES.find((profile) => profile.id === id);

/** 공유 링크에 담기는 짧은 코드 ↔ 유형 id. 🔴 값을 바꾸면 이미 공유된 링크가 깨진다. */
export const INVESTOR_TYPE_CODES: Readonly<Record<InvestorTypeId, string>> = {
  'concentrated-value': 'cv',
  'broad-diversified': 'bd',
  'macro-allocator': 'ma',
  'long-holder': 'lh',
  'monthly-income': 'mi',
  'retirement-ready': 'rr'
} as const;

export const findInvestorTypeByCode = (code: string): InvestorTypeId | undefined =>
  (Object.keys(INVESTOR_TYPE_CODES) as InvestorTypeId[]).find((id) => INVESTOR_TYPE_CODES[id] === code);
