/**
 * GA 원값 → 사람이 읽는 이름(2026-11-13). 리포트는 휴대폰으로 훑어보는 글이라 `m.search.naver.com / referral`
 * 같은 원값을 그대로 두면 읽히지 않는다. 모르는 값은 **원값 그대로** 돌려준다 — 이름을 지어내지 않는다.
 */

/** `source / medium` → 유입 경로 묶음. 같은 묶음은 리포트에서 합쳐진다(네이버 모바일·PC 검색 → "네이버 검색"). */
export const sourceLabel = (sourceMedium: string): string => {
  const [rawSource = '', rawMedium = ''] = sourceMedium.split(' / ');
  const source = rawSource.trim().toLowerCase();
  const medium = rawMedium.trim().toLowerCase();
  if (source === '(direct)') return '직접 방문(주소·북마크)';
  if (source.includes('blog.naver')) return '네이버 블로그';
  if (source.includes('cafe.naver')) return '네이버 카페';
  if (source.includes('naver')) return '네이버 검색';
  if (source === 'accounts.google.com') return '구글 로그인 후 복귀';
  if (source.includes('google')) return medium === 'organic' || source.includes('search') ? '구글 검색' : `구글(${rawSource})`;
  if (source.includes('daum')) return '다음 검색';
  if (source.includes('bing')) return '빙 검색';
  if (source.includes('yahoo') || source.includes('duckduckgo') || source.includes('yandex')) return '기타 검색엔진';
  if (source.includes('youtube')) return '유튜브';
  if (source.includes('t.co') || source.includes('twitter') || source === 'x.com') return 'X(트위터)';
  if (source.includes('facebook') || source.includes('instagram') || source.includes('threads')) return '메타(페북·인스타·스레드)';
  if (source.includes('kakao')) return '카카오';
  if (medium === 'referral') return `${rawSource} 링크`;
  if (source === '(not set)' || source === '') return '알 수 없음';
  return `${rawSource}${rawMedium && rawMedium !== '(not set)' ? ` / ${rawMedium}` : ''}`;
};

const EXACT_PAGES: Readonly<Record<string, string>> = {
  '/': '홈',
  '/simulator': '배당 시뮬레이터',
  '/market/us-calendar': '미국 증시 캘린더',
  '/market/fomc': 'FOMC 일정',
  '/market/this-week': '이번 주 미국 증시 일정',
  '/market/pulse': '시장 온도',
  '/market/stats': '시장 통계',
  '/dividend/tax': '배당 세금 계산기',
  '/retirement/income': '은퇴 후 월 소득 계산기',
  '/dividend/how-much': '월 배당 필요 원금',
  '/dividend/calendar': '배당 캘린더',
  '/dividend/lists': '배당 종목 목록',
  '/dividend/portfolio': '배당 포트폴리오',
  '/ticker/all': '전체 종목',
  '/ticker/compare': '종목 비교',
  '/ticker/overlap': 'ETF 겹침',
  '/portfolio/nps': '국민연금 포트폴리오',
  '/portfolio/korea-assembly': '국회의원 보유 종목',
  '/portfolio/congress': '미 의회 주식 거래',
  '/portfolio/investors': '유명 투자자 포트폴리오',
  '/investor-type': '투자 성향 테스트',
  '/community': '커뮤니티',
  '/community/board': '게시판',
  '/community/portfolio': '포트폴리오 갤러리',
  '/ledger': '배당 가계부',
  '/about': '소개'
};

/** 첫 페이지 경로 → 이름. 쿼리는 떼고 본다. 패턴 경로(종목 · 연도 · 글)는 묶지 않고 구체 이름을 준다. */
export const pageLabel = (rawPath: string): string => {
  const path = (rawPath.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (rawPath === '' || rawPath === '(not set)') return '알 수 없음';
  const exact = EXACT_PAGES[path];
  if (exact) return exact;
  let match = path.match(/^\/market\/us-holidays\/(\d{4})$/);
  if (match) return `${match[1]}년 미국 증시 휴장일`;
  match = path.match(/^\/dividend\/how-much\/(\d+)$/);
  if (match) return `월 배당 ${match[1]}만원 필요 원금`;
  match = path.match(/^\/ticker\/category\/([^/]+)$/);
  if (match) return `종목 분류: ${decodeURIComponent(match[1]!)}`;
  match = path.match(/^\/ticker\/([^/]+)$/);
  if (match) return `종목 ${decodeURIComponent(match[1]!).toUpperCase()}`;
  if (/^\/community\/board\/[^/]+$/.test(path)) return '게시판 글';
  if (/^\/community\/portfolio\/[^/]+$/.test(path)) return '포트폴리오 갤러리 글';
  if (/^\/community\/firenow/.test(path)) return 'FIRE 인증';
  match = path.match(/^\/guide\/([^/]+)$/);
  if (match) return `가이드: ${decodeURIComponent(match[1]!)}`;
  match = path.match(/^\/dividend\/([a-z-]+)$/);
  if (match) return `배당 목록: ${match[1]}`;
  return path;
};

/** GA 가 자동으로 세는 이벤트 — "무엇을 했나"에서 뺀다(방문했다는 사실 말고 정보가 없다). */
export const AUTO_EVENTS: ReadonlySet<string> = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'user_engagement',
  'scroll',
  'return_visit',
  'cta_impression',
  'cpa_cta_impression',
  'modal_view',
  'tutorial_step_view'
]);

const EVENT_NAMES: Readonly<Record<string, string>> = {
  click: '외부 링크 클릭',
  file_download: '파일 받기',
  cta_click: '안내 버튼 클릭',
  cpa_cta_click: '제휴 버튼 클릭',
  ticker_selected: '종목 고르기',
  ticker_included: '종목 담기',
  ticker_saved: '종목 저장',
  preset_applied: '프리셋 적용',
  investment_setting_changed: '투자 조건 바꾸기',
  allocation_changed: '비중 바꾸기',
  simulation_result_view: '시뮬레이션 결과 보기',
  chart_view: '차트 보기',
  portfolio_config_completed: '포트폴리오 완성',
  calculator_shared: '계산 결과 공유',
  tutorial_started: '튜토리얼 시작',
  tutorial_completed: '튜토리얼 완료',
  toggle_changed: '옵션 켜고 끄기',
  scenario_tab_action: '시나리오 탭 사용'
};

export const eventLabel = (eventName: string): string => EVENT_NAMES[eventName] ?? eventName;

export const deviceLabel = (device: string): string =>
  ({ mobile: '모바일', desktop: 'PC', tablet: '태블릿' })[device.toLowerCase()] ?? device;

export const visitorLabel = (newVsReturning: string): string =>
  ({ new: '처음 온 사람', returning: '다시 온 사람' })[newVsReturning.toLowerCase()] ?? '알 수 없음';
