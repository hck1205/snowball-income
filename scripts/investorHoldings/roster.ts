/**
 * "대가들의 포폴" 명단 — **CIK 를 못 박는다.**
 *
 * 🔴 이름으로 EDGAR 를 검색해 CIK 를 찾지 마라. 2026-08-02 실측에서 바우포스트·듀케인·아팔루사가
 * **10~24년 전에 신고를 멈춘 동명 옛 법인**으로 검색 상위에 떴다. 그걸 썼으면 2002년·2010년·2015년
 * 포트폴리오를 "대가의 현재 보유"라고 보여줄 뻔했다. 사람은 법인을 옮기고 이름은 재사용된다.
 *
 * 명단 근거: https://etfshopping.com/investors 의 8인 + 배당 관점에서 반드시 필요한 5인.
 * 추가 5인의 선정 기준은 "이 앱이 배당 앱"이라는 것이다 — 게이츠 재단은 배당주 장기 보유의 교과서고,
 * 켄 피셔는 규모와 배당 지향, 리루·왓사·데일리 저널은 가치투자 계보다.
 *
 * ⚠ 명단에 사람을 더할 때는 **최신 13F 보고 분기를 먼저 확인하라.** 유명해도 신고를 멈춘 사람이 있다
 * (실측: 파브라이 2011년, 아인혼 2023년, 아이칸 2000년에서 멈춘 CIK 들이 검색에 잡힌다).
 */
export type Investor = {
  /** 10자리 0패딩 CIK. `data.sec.gov/submissions/CIK{cik}.json` 에 그대로 들어간다. */
  readonly cik: string;
  /** 화면에 보이는 사람 이름. */
  readonly person: string;
  /** 운용사·법인. SEC 등록명과 다를 수 있어 표시용으로 따로 둔다. */
  readonly firm: string;
  /**
   * 왜 이 사람이 명단에 있는지 — 화면의 한 줄 소개가 된다.
   * 🔴 성과를 단정하거나 추천으로 읽힐 말을 쓰지 마라("수익률이 좋다"·"따라 살 만하다" 금지).
   */
  readonly note: string;
};

export const INVESTORS: readonly Investor[] = [
  {
    cik: '0001067983',
    person: '워런 버핏',
    firm: 'Berkshire Hathaway',
    note: '보험·제조업을 함께 소유하며 소수의 종목에 크게 집중하는 것으로 알려져 있습니다.'
  },
  {
    cik: '0000850529',
    person: '켄 피셔',
    firm: 'Fisher Asset Management',
    note: '천 종목 이상으로 넓게 분산하는 대형 자산운용사입니다.'
  },
  {
    cik: '0001166559',
    person: '빌 게이츠 재단',
    firm: 'Gates Foundation Trust',
    note: '재단 기금을 운용하며 보유 기간이 길고 회전이 적은 편입니다.'
  },
  {
    cik: '0001350694',
    person: '레이 달리오',
    firm: 'Bridgewater Associates',
    note: '거시경제 기반으로 자산군을 넓게 배분하는 헤지펀드입니다.'
  },
  {
    cik: '0001336528',
    person: '빌 애크먼',
    firm: 'Pershing Square',
    note: '소수 종목에 집중하고 기업 경영에 관여하는 행동주의 투자로 알려져 있습니다.'
  },
  {
    cik: '0001697748',
    person: '캐시 우드',
    firm: 'ARK Invest',
    note: '혁신 기술 기업에 집중합니다. 배당을 지급하지 않는 종목의 비중이 높습니다.'
  },
  {
    cik: '0001656456',
    person: '데이비드 테퍼',
    firm: 'Appaloosa',
    note: '경기 국면에 따라 보유를 크게 바꾸는 것으로 알려져 있습니다.'
  },
  {
    cik: '0001061768',
    person: '세스 클라만',
    firm: 'Baupost Group',
    note: '안전마진을 강조하는 가치투자자로, 현금 비중이 높은 시기가 있습니다.'
  },
  {
    cik: '0001536411',
    person: '스탠리 드러켄밀러',
    firm: 'Duquesne Family Office',
    note: '거시 판단에 따라 포지션을 빠르게 바꾸는 것으로 알려져 있습니다.'
  },
  {
    cik: '0001649339',
    person: '마이클 버리',
    firm: 'Scion Asset Management',
    note: '역발상 투자로 알려져 있습니다. 공시가 뜸해 자료가 오래된 편입니다.'
  },
  {
    cik: '0001709323',
    person: '리루',
    firm: 'Himalaya Capital',
    note: '소수 종목을 오래 보유하는 가치투자자입니다.'
  },
  {
    cik: '0000915191',
    person: '프렘 왓사',
    firm: 'Fairfax Financial',
    note: '보험사를 통해 투자하는 구조로, 버크셔와 자주 비교됩니다.'
  },
  {
    cik: '0000783412',
    person: '데일리 저널',
    firm: 'Daily Journal',
    note: '찰리 멍거가 이끌던 회사로, 보유 종목이 매우 적습니다.'
  }
];
