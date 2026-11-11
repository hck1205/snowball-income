/**
 * 미국 증시 안내 지면 문구 — **정본 1곳**(2026-11-11). 화면 `useDocumentMeta` 와 정적 셸(`tools/seo`)이
 * 같은 제목·설명을 쓴다(둘이 다르면 검색 결과와 탭 제목이 어긋난다).
 *
 * 제목은 **검색어 모양 그대로**다("미국 증시 휴장일 2027", "FOMC 일정"). 꾸민 제목보다 검색어와 맞는
 * 제목이 검색 결과에서 눌린다. 문구는 격식체(앱 카피 어미 규칙).
 */
export const MARKET_GUIDE_COPY = {
  holidays: {
    title: (year: number) => `미국 증시 휴장일 ${year} — 뉴욕증권거래소·나스닥 휴장일과 조기 폐장 (한국시간)`,
    heroTitle: (year: number) => `${year}년 미국 증시 휴장일`,
    description: (year: number) =>
      `${year}년 미국 증시(뉴욕증권거래소·나스닥) 휴장일과 조기 폐장일을 한국시간 기준으로 정리했습니다. 거래소 공식 일정을 옮긴 것으로, 연휴 전 조기 마감 시각도 함께 보여 드립니다.`,
    lede: (year: number) => `${year}년 미국 증시가 쉬거나 일찍 닫는 날입니다. 조기 폐장은 미국 동부 13시에 마감합니다.`,
    tableCaption: (year: number) => `${year}년 미국 증시 휴장일·조기 폐장일`,
    source: '출처: 뉴욕증권거래소(NYSE) 공식 휴장 일정. 나스닥도 같은 날 쉽니다.'
  },
  fomc: {
    title: 'FOMC 일정 2026 — 미국 연준 금리 결정 발표 날짜와 한국시간',
    heroTitle: 'FOMC 회의 일정',
    description:
      '2026년 미국 연준(FOMC) 회의 일정과 금리 결정 성명이 나오는 한국시간을 정리했습니다. 경제전망(점도표)이 함께 나오는 회차도 표시했습니다.',
    lede: '연준의 금리 결정은 회의 마지막 날 미국 동부 14시에 나옵니다. 한국에서는 다음 날 새벽입니다.',
    tableCaption: '2026년 FOMC 회의 일정',
    projectionsNote: '점도표: 경제전망요약(SEP)이 함께 나오는 회차로, 시장 반응이 더 큰 편입니다.',
    nextYearNote: '2027년 일정은 연준이 아직 공시하지 않았습니다. 공시되면 이 표에 더합니다.',
    source: '출처: 미국 연방준비제도(Federal Reserve) 공식 FOMC 일정.'
  },
  week: {
    title: '이번 주 미국 증시 일정 — 경제지표·실적 발표·휴장 (한국시간)',
    heroTitle: '이번 주 미국 증시 일정',
    description:
      '이번 주 미국 증시의 주요 경제지표 발표, 실적 발표, 휴장·FOMC 일정을 한국시간으로 정리했습니다. 매주 자동으로 갱신됩니다.',
    lede: '오늘부터 7일 동안의 일정입니다. 시각은 모두 한국시간이고, 실적은 장 전·장 후로 표시합니다.',
    tableCaption: '이번 주 미국 증시 일정 (한국시간)',
    stale: (generatedAt: string) => `실적·지표 자료는 ${generatedAt} 수집분입니다. 다음 갱신 전이라 일부 일정이 빠졌을 수 있습니다.`,
    empty: '이번 주에는 표시할 주요 일정이 없습니다.',
    source: '출처: 휴장·FOMC는 거래소·연준 공시, 지표·실적은 주간 수집 자료.'
  },
  related: '함께 보면 좋은 일정',
  relatedLinks: {
    calendar: { title: '미국 증시 캘린더', description: '달력으로 한 달 일정을 한눈에' },
    week: { title: '이번 주 미국 증시 일정', description: '지표·실적·휴장을 한국시간으로' },
    fomc: { title: 'FOMC 회의 일정', description: '금리 결정 발표 한국시간' },
    holidays: (year: number) => ({ title: `${year}년 미국 증시 휴장일`, description: '휴장·조기 폐장 한국시간' })
  }
} as const;
