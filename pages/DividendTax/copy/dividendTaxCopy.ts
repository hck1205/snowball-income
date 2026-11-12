import { DIVIDEND_TAX_RULES } from '../../../shared/lib/dividendTax/dividendTax';

/**
 * 미국 배당 세금·건보료 계산기 문구 — 정본 1곳(2026-11-12). 화면 메타와 정적 셸이 같은 제목을 쓴다.
 * 격식체(앱 카피 어미 규칙). 투자·세무 자문이 아닌 **계산 예시**라는 틀을 끝까지 유지한다.
 * ⚠ 정적 셸(tools/seo)이 이 파일을 읽으므로 상대 경로 import 만 쓴다(빌드 설정은 @/ 를 못 읽는다).
 */
export const DIVIDEND_TAX_COPY = {
  meta: {
    title: '미국 배당 세금·건강보험료 계산기 2026 — 금융소득종합과세·피부양자·ISA 비교',
    description:
      '미국 주식·ETF 배당을 받으면 세금이 얼마인지, 금융소득종합과세 대상인지, 건강보험 피부양자에서 빠지는지, 지역가입자 보험료가 얼마나 오르는지 한 번에 계산합니다. 일반계좌와 ISA 세금도 비교합니다.'
  },
  heroTitle: '미국 배당 세금·건강보험료 계산기',
  lede: '월 배당을 넣으면 세금, 금융소득종합과세, 건강보험료 변화를 한 번에 보여 드립니다.',
  inputs: {
    monthlyUs: '미국 주식·ETF 월 배당 (세전)',
    otherFinancial: '그 밖의 금융소득 (예금 이자·국내 배당, 연간)',
    otherTaxBase: '다른 종합소득 과세표준 (근로·사업, 연간)',
    otherTaxBaseHint: '모르면 0으로 두세요. 종합과세 대상일 때만 쓰입니다.',
    health: '건강보험 자격',
    healthOptions: { employee: '직장가입자', regional: '지역가입자', dependent: '피부양자' },
    otherIncomeForDependent: '피부양자 판정에 더할 다른 소득 (공적연금·근로 등, 연간)',
    isaSeomin: '서민형 ISA'
  },
  results: {
    withholding: '미국 원천징수 15% 뒤 손에 쥐는 배당',
    perYear: (value: string) => `연 ${value}`,
    comprehensiveYes: '금융소득종합과세 대상입니다',
    comprehensiveNo: '금융소득종합과세 대상이 아닙니다',
    comprehensiveDetail: (financial: string) => `연 금융소득 ${financial} — 기준은 연 2,000만원 초과입니다.`,
    extraTax: '종합과세로 더 낼 세금 (지방세 포함, 추정)',
    extraTaxZero: '미국에서 낸 15%가 국내 세율(14%)보다 커서, 다른 소득이 없으면 추가 세금이 거의 생기지 않습니다.',
    dependentLost: '피부양자 자격을 잃을 수 있습니다',
    dependentKept: '피부양자 소득요건(연 2,000만원)은 넘지 않습니다',
    dependentNote: '확인되지 않은 부분은 보수적으로 계산해 금융소득 전액을 더했습니다.',
    premiumIncrease: '배당 때문에 늘어나는 월 건강보험료 (장기요양 포함)',
    premiumZeroRegional: '금융소득이 연 1,000만원 이하라 지역 보험료에 반영되지 않습니다.',
    premiumZeroEmployee: '보수 외 소득이 연 2,000만원 이하라 추가 보험료가 없습니다.',
    isaHeading: '같은 배당, 일반계좌 vs ISA 세금 (국내 상장 미국 배당 ETF 기준)',
    isaGeneral: '일반계좌 (15.4%)',
    isaAccount: (limit: string) => `ISA (비과세 ${limit} 초과분 9.9%)`,
    isaNote: 'ISA는 의무가입 3년, 연 납입 2,000만원 한도가 있고, 해외 상장 주식은 직접 담을 수 없습니다. 일반계좌 분배금은 보수적으로 15.4%로 계산했습니다.'
  },
  basis: `기준: ${DIVIDEND_TAX_RULES.basisDate} · 건강보험료율 7.19%, 장기요양 13.14%(2026) · 종합소득세율 8구간 · 근거: 국세청·국가법령정보센터·국민건강보험공단 공식 자료.`,
  disclaimer:
    '세무 자문이 아닌 계산 예시입니다. 공제·다른 소득·재산에 따라 실제 세금과 보험료는 달라집니다. 중요한 결정은 세무사나 국세청·국민건강보험공단에 확인하세요.'
} as const;
