import { storageKey } from '@/shared/lib/storage';
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * 로컬 개발/미리보기에서는 GA4로 데이터를 보내지 않는다 — 실측 지표가 로컬 테스트(페이지뷰·클릭)로
 * 오염되는 걸 막는다. dev 서버(`import.meta.env.DEV`: `npm run dev`는 localhost든 LAN IP(모바일 테스트)든
 * 전부 DEV=true)와 localhost 계열 호스트(`vite preview`로 프로덕션 빌드를 로컬에서 돌리는 경우)를 모두 배제해
 * **프로덕션 도메인(Vercel)에서만** 활성화된다. GA_MEASUREMENT_ID 미설정 시에도 물론 비활성.
 */
const isLocalHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local")
  );
};

const isAnalyticsEnabled = (): boolean =>
  Boolean(GA_MEASUREMENT_ID) && !import.meta.env.DEV && !isLocalHost();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type PageLocation = {
  pathname: string;
  search?: string;
  hash?: string;
};

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

export const ANALYTICS_EVENT = {
  // 모달 노출 이벤트. 용도: 어떤 모달(도움말/저장/불러오기)에 사용자가 시간을 쓰는지 파악.
  MODAL_VIEW: "modal_view",
  // 주요 CTA 클릭 이벤트. 용도: 버튼/영역별 클릭률 비교, CTA 문구/위치 A/B 테스트 근거.
  // 🔴 **제휴(CPA) CTA 는 이 이름을 쓰지 마라** — 아래 `CPA_*` 를 쓴다. 이유는 그 주석 참고.
  CTA_CLICK: "cta_click",
  /*
   * ── 제휴(CPA) CTA 3종 ─────────────────────────────────────────────────────
   *
   * 🔴 **`cta_click` 을 재사용하지 않는 이유**: 그 이름은 이미 사이트 전역 CTA 47곳이 쏘고 있다.
   * 제휴 CTA 를 같은 이름으로 실으면 두 값공간이 한 지표에 섞여 **CTR(=제휴 최적화의 주 지표)이
   * 오염된다.** 되돌리려면 과거 데이터를 파라미터로 갈라내야 하는데, GA4 는 소급 재처리가 안 된다.
   * (같은 모양의 사고: `preset_id` 에 팔레트 8종과 밝기 2종이 한 값공간에 섞였던 건.)
   *
   * ⚠ 아직 **아무도 쏘지 않는다.** 제휴 승인 전이라 CTA 자체가 없다 — 이 세 줄은 이름을 미리
   * 못 박아 두는 것이 목적이다(구현 시점에 급하게 정하면 위 사고가 그대로 재발한다).
   *
   * 파라미터 규약(구현 시 지킬 것):
   *   placement : 'compare' | 'simulator' | 'ticker'   — 어느 화면의 자리인가(§5-2 배치)
   *   account   : 'general' | 'isa' | 'pension'        — 안내한 계좌 **유형**
   *               🔴 증권**사**를 파라미터로 싣지 마라. 금소법상 '광고 주체' 로 읽힐 여지를 만든다
   *   variant   : A/B 문구 식별자
   * KPI: CPA_CTA_CLICK / CPA_CTA_IMPRESSION = CTR, 제휴사 리포트 건수 / CPA_CTA_CLICK = 최종 전환율.
   */
  CPA_CTA_IMPRESSION: "cpa_cta_impression",
  CPA_CTA_CLICK: "cpa_cta_click",
  CPA_CTA_DISMISS: "cpa_cta_dismiss",
  // 티커 생성 퍼널 시작 이벤트. 용도: 생성 퍼널 시작 모수 집계 및 시작 대비 완료율 계산.
  TICKER_CREATE_STARTED: "ticker_create_started",
  // 티커 생성/수정 완료 이벤트. 용도: 생성 성공률, 입력 방식(커스텀/프리셋)별 완료 성과 분석.
  TICKER_SAVED: "ticker_saved",
  // 티커 프로필 삭제 이벤트. 용도: 어떤 종목이 자주 제외되는지, 종목 유지율 분석.
  TICKER_DELETED: "ticker_deleted",
  // 포트폴리오 포함(편입) 이벤트. 용도: 월간 인기 종목 TOP, 종목 선택 트렌드 콘텐츠 제작.
  TICKER_INCLUDED: "ticker_included",
  // 이미 포함된 티커 선택 이벤트. 용도: 조회/편집 집중 종목 파악 및 UI 우선순위 개선.
  TICKER_SELECTED: "ticker_selected",
  // 추천 프리셋 적용 이벤트. 용도: 프리셋 인기 순위, 프리셋별 전환/완주율 비교.
  PRESET_APPLIED: "preset_applied",
  // 투자 설정 값 변경 이벤트. 용도: 목표 월배당/기간/세율 등 설정 분포와 월별 트렌드 분석.
  // ⚠ 내 포트폴리오(/dividend/portfolio) 목표 카드의 칩·직접 입력으로 정한 목표도 **시뮬레이터에서 커밋**되므로
  //   이 이벤트로 함께 집계된다(field_name='targetMonthlyDividend'). 그 카드의 cta_click(goal_set_target)은
  //   "누르는 순간"을, 이 이벤트는 "실제로 값이 정해진 순간"을 세는 별개 지표다(이중 집계 아님).
  INVESTMENT_SETTING_CHANGED: "investment_setting_changed",
  // 토글 상태 변경 이벤트. 용도: 간편/정밀, 그래프 모드 등 기능 선호도 분석.
  TOGGLE_CHANGED: "toggle_changed",
  // 테마 변경 이벤트(파라미터: preset_id). 용도: 테마 선호도 분포와 기본값 유지율 분석.
  // ⚠ 2026-08-01 부터 이 이벤트로 들어오는 것은 **라이트/다크 전환뿐**이다(preset_id = 'light' | 'dark').
  //   사용자 결정으로 색 프리셋 8종 선택 UI 를 화면에서 감췄기 때문이다(값·토큰은 살아 있고
  //   노출 목록만 막았다 — shared/constants/palette 의 VISIBLE_PALETTE_PRESET_IDS).
  //   이벤트명·파라미터명은 **일부러 그대로 둔다** — 이름을 바꾸면 그 이전 데이터와 시계열이 끊기고,
  //   프리셋 선택을 되살리면 preset_id 에 다시 팔레트 id 가 실린다(과거 리포트가 그대로 유효해진다).
  //   즉 이 필드는 "사용자가 고른 테마 식별자"로 읽으면 시점과 무관하게 맞다.
  THEME_PRESET_CHANGED: "theme_preset_changed",
  // 포트폴리오 비중 변경 이벤트. 용도: 평균 편입 비중, 고정 비율 사용 패턴, 리밸런싱 행동 분석.
  ALLOCATION_CHANGED: "allocation_changed",
  // 시나리오 탭 액션 이벤트(생성/선택/이름변경/삭제). 용도: 전략 실험 패턴과 다중 시나리오 사용성 분석.
  SCENARIO_TAB_ACTION: "scenario_tab_action",
  // 시뮬레이션 결과 노출 이벤트. 용도: 핵심 퍼널 완료 지표(실질 전환) 및 조건별 완료율 비교.
  SIMULATION_RESULT_VIEW: "simulation_result_view",
  // 차트 노출 이벤트. 용도: 차트별 관심도, 보기 옵션 사용 패턴, 리포트 콘텐츠 소재 발굴.
  CHART_VIEW: "chart_view",
  // 유효한 포트폴리오 구성 완료 이벤트. 용도: 결과 직전 단계 전환율과 구성 난이도 분석.
  PORTFOLIO_CONFIG_COMPLETED: "portfolio_config_completed",
  // 검증 에러 노출 이벤트. 용도: 이탈 유발 입력 항목 식별, UX 개선 우선순위 결정.
  VALIDATION_ERROR_VIEW: "validation_error_view",
  // 공통 동작 에러 이벤트. 용도: 저장/불러오기 등 실패율 모니터링 및 장애 탐지.
  OPERATION_ERROR: "operation_error",
  // 복귀 방문 신호 이벤트. 용도: 리텐션 측정, 저장 기능이 재방문에 미치는 효과 분석.
  RETURN_VISIT: "return_visit",
  // 튜토리얼 투어 시작 이벤트. 용도: 온보딩 퍼널 시작 모수, 첫 방문자 대비 투어 진입률 측정.
  TUTORIAL_STARTED: "tutorial_started",
  // 튜토리얼 단계 노출 이벤트. 용도: 단계별 이탈 지점(어디서 그만두는지) 파악 및 문구/순서 개선.
  TUTORIAL_STEP_VIEW: "tutorial_step_view",
  // 튜토리얼 완주 이벤트. 용도: 온보딩 완료율, 완주 유저의 시뮬레이션 전환율 비교.
  TUTORIAL_COMPLETED: "tutorial_completed",
  // 튜토리얼 중도 이탈 이벤트(건너뛰기/Esc/닫기). 용도: 이탈 단계와 이탈 방식 분석.
  TUTORIAL_DISMISSED: "tutorial_dismissed",
  // 프로필 저장 완료 이벤트(파라미터: field='nickname'). 용도: 닉네임 변경 빈도 분석. (아바타 기능 제거로 field는 현재 nickname만 발화)
  PROFILE_UPDATED: "profile_updated",
  // 회원 탈퇴 다이얼로그 열림 이벤트. 용도: 탈퇴 의향 모수와 실제 탈퇴 완료 대비 이탈(재고)률 측정.
  ACCOUNT_DELETE_STARTED: "account_delete_started",
  // 회원 탈퇴 완료 이벤트(서버 200 확정 후에만 발화). 용도: 실제 이탈률, 탈퇴 시작 대비 완료 전환율 분석.
  ACCOUNT_DELETED: "account_deleted",
  // 로그인 완료 이벤트(파라미터: source). 용도: 로그인 시작 대비 완료율, 저장 유도 로그인 전환율(§성공지표) 계산.
  LOGIN_COMPLETED: "login_completed",
  // 로그인 실패 이벤트(콜백으로 돌아왔으나 세션 미생성). 파라미터: provider·reason·in_app_browser·context_switched·attempts·error_code.
  // 용도: 무음이던 OAuth 콜백 실패(특히 iOS 카카오 인앱브라우저 컨텍스트 분리)의 실제 발생 빈도·환경·프로바이더 분포를
  // 데이터로 관측. login_completed 대비 실패율로 "돌아왔는데 로그인 안 됨" 규모를 잡는다.
  LOGIN_FAILED: "login_failed",
  // 클라우드 자동 저장 완료 이벤트. 용도: 클라우드 저장 성공률(= completed / (completed + operation_error(cloud_save))) 모니터링.
  CLOUD_SAVE_COMPLETED: "cloud_save_completed",
  // 세션 시작 클라우드 latest-wins 동기화 완료 이벤트(파라미터: direction='cloud_to_local'|'local_to_cloud'|'noop').
  // 용도: 양방향 자동 동기화의 방향 분포와 세션 시작 시 이미-동기 비율(noop) 모니터링, 실패는 operation_error(cloud_sync)로 분리.
  // (구 CLOUD_MIGRATION_STARTED/LOCAL_MIGRATION_COMPLETED 2단계 마이그레이션 택소노미를 대체 — 클라우드는 이제 매 세션 양방향 동기화)
  CLOUD_SYNC_RECONCILED: "cloud_sync_reconciled",
  // 세션 시작 디바이스↔클라우드 워크스페이스 충돌 화해 이벤트(화해/이연 시 발화).
  // 파라미터: shown(모달 노출 여부)·resolution(device|cloud|blend|deferred)·device_tabs·cloud_tabs·result_tabs.
  // 용도: 무음 last-write-wins를 대체한 화해 UI에서 사용자가 어느 쪽을 택하는지(디바이스/클라우드/블렌드/이연) 분포와 병합 결과 탭 수 모니터링.
  CLOUD_SYNC_CONFLICT: "cloud_sync_conflict",

  // 내 포트폴리오(/dividend/portfolio) **목표 달성 카드** 노출 이벤트
  // (파라미터: has_target·current_basis·progress_bucket·reached_in_range). 카드가 값과 함께 실제로 떴을 때 1회.
  // 용도: ①목표를 실제로 설정해 두고 쓰는 비율(has_target) ②달성률 분포(진행 구간별 이탈·재방문 비교)
  // ③투자 기간 안에 목표에 닿는 사용자 비율(reached_in_range) ④달성률의 현재값이 실측(보유)인지 시뮬
  // 폴백인지(current_basis)로 목표 난이도와 카피 톤을 조정.
  // 목표 미설정이면 progress_bucket·reached_in_range 는 "0"이 아니라 해당 없음이라 아예 보내지 않는다.
  // ⚠ 이름은 구 목표 달성 페이지 시절 그대로다(미배포라 과거 데이터가 없어 개명 이득이 없다). has_target 의
  //   **모수만 바뀌었다**: "목표 페이지 방문자" → "목표 카드가 뜬 포트폴리오 방문자"(전환율 지표로 더 정확).
  //   holdings_count·value_bucket 은 여기 싣지 않는다 — 같은 세션의 portfolio_summary_view 로 조인한다.
  GOAL_WIDGET_VIEW: "goal_widget_view",

  // 내 포트폴리오(/dividend/portfolio) 진입 이벤트(파라미터: holdings_count·has_holdings). 진입당 1회.
  // 용도: ①이 화면에 오는 사람 중 실제로 보유를 등록해 둔 비율(has_holdings = 재방문 가치의 1차 신호)
  // ②등록 종목 수 분포로 목록 UI(표/카드) 밀도와 정렬 필요성을 판단.
  PORTFOLIO_VIEW: "portfolio_view",
  // 보유 종목 저장 이벤트(파라미터: action='add'|'edit'·covered). 수량 편집은 **값이 실제로 바뀐 blur 시점**에만 발화한다.
  // 용도: 추가 대비 수량 입력 완료율(=계산이 성립한 비율)과, 시뮬레이터가 아는 종목(covered)의 비중 파악.
  PORTFOLIO_HOLDING_SAVED: "portfolio_holding_saved",
  // 보유 종목 삭제 이벤트(파라미터: covered). 용도: 추가→삭제 이탈 패턴과 잘못 고른 종목의 규모 관측.
  PORTFOLIO_HOLDING_DELETED: "portfolio_holding_deleted",
  // 요약(지금 받는 배당) 노출 이벤트(파라미터: holdings_count·covered_count·value_bucket). 진입당 1회.
  // 용도: 계산이 실제로 성립한 세션 비율(covered_count)과 평가금액 규모 분포. ⚠ 금액 원값은 싣지 않는다 —
  // 환율 실패 세션과 성공 세션이 같은 축에 놓이도록 **달러 기준 버킷**만 보낸다(PortfolioPage.utils 경계).
  PORTFOLIO_SUMMARY_VIEW: "portfolio_summary_view",

  // ── 시나리오 공유 (Phase 1 신규) ────────────────────────────────────────────
  // 공유 링크 생성/복사(파라미터: share_method). 용도: 바이럴 계수, 공유 채널 분포.
  SCENARIO_SHARED: "scenario_shared",

  // ── 커뮤니티 참여 (Phase 1 신규 — 계측 최대 갭) ──────────────────────────────
  // 갤러리 진입. 용도: 커뮤니티 유입 모수, 갤러리→상세→시뮬 퍼널 시작.
  COMMUNITY_GALLERY_VIEW: "community_gallery_view",
  // 게시물 상세 진입(파라미터: has_sim). 용도: 시뮬 첨부 글의 조회 성과 비교.
  COMMUNITY_POST_VIEW: "community_post_view",
  // 게시물 발행(파라미터: has_sim). 용도: 창작 전환(Key Event), 시뮬 첨부율.
  COMMUNITY_POST_PUBLISHED: "community_post_published",
  // 좋아요/취소(파라미터: like_action). 용도: 참여도, 콘텐츠 반응 분석.
  COMMUNITY_LIKE: "community_like",
  // 댓글 작성. 용도: 심화 참여, 활성 커뮤니티 여부 판단.
  COMMUNITY_COMMENT: "community_comment",
  // 상세→시뮬레이터 유입("이 시나리오로 열기"). 용도: 커뮤니티→코어 제품 유입 측정.
  COMMUNITY_TO_SIMULATOR: "community_to_simulator",
  // 글 자체(공개 상세 URL)를 외부로 공유(파라미터: method='web_share'|'copy_link'|채널id, post_id, kind, placement='feed'|'detail').
  // method 는 사용자가 실제로 고른 경로다: 'web_share'=터치 기기 OS 시트, 'copy_link'=공유 창의 링크 복사,
  // 'x'|'facebook'|'naver'=공유 창의 채널 버튼. 데스크톱은 OS 시트를 쓰지 않으므로 web_share 는 모바일 신호에 가깝다.
  // 시뮬 상태 공유(scenario_shared)와 구분 — 이건 공개 SEO 페이지로의 유입을 노린 글 공유. 용도: 바이럴 계수(어떤 글이 퍼지나) 측정.
  COMMUNITY_POST_SHARED: "community_post_shared",
  // 유입 화면에서 고른 종목을 실은 채 `/ticker/compare` 에 도착(파라미터: from, ticker_count).
  //
  // 🔴 **클릭이 아니라 도착을 센다.** 퍼널 지표가 "유입 화면 → 종목 비교 **이동률**"이라, 눌렀지만
  //    도착하지 못한 것(뒤로가기·중간 이탈)을 이동으로 세면 뒤 단계 전환율이 조용히 부풀려진다.
  // ⚠ `from` 이 없는 도착(직접 방문·북마크·공유 링크)은 이 이벤트를 쏘지 않는다 — 그건 연결의
  //   성과가 아니라 그냥 그 화면의 트래픽이고, 섞으면 어느 화면이 보냈는지를 되레 흐린다.
  COMPARE_ENTRY: "compare_entry",
  // 비교 화면에서 고른 한 종목을 시뮬레이터로 보냄("이 종목으로 계산", 파라미터: ticker).
  // 용도: §3-2 퍼널의 "종목 비교 → 시뮬레이터 이동률" **클릭** 측정. 도착(compare_entry)의 다음 칸이다.
  // 🔴 클릭을 센다(도착이 아니라) — 시뮬레이터 도착은 프리필을 `location.state` 로 받아 URL 에 표식이
  //    남지 않으므로 도착측에서 셀 수 없다. 그래서 이 짝은 비대칭이다(비교=도착, 여기=클릭).
  COMPARE_TO_SIMULATOR: "compare_to_simulator",
  // 시장 온도 화면에서 시뮬레이터로 유입("진입 시점보다 기간" 넛지 클릭).
  // 용도: §3-2 리텐션층(일간 재방문) → 코어 제품(시뮬레이터) 전환 측정. community_to_simulator 와 같은 짝이다.
  // 🔴 클릭을 센다 — 도착은 URL 에 표식이 없어 셀 수 없다(compare_to_simulator 와 같은 이유).
  MARKET_PULSE_TO_SIMULATOR: "market_pulse_to_simulator",
  /*
   * ── 수준 분기 · 성향 테스트 (2026-08-17) ──────────────────────────────────
   *
   * 랜딩 히어로가 "바로 계산하기" 두 갈래에서 **수준 4갈래**로 바뀌었다. 그 결정이 옳았는지는
   * 데이터로만 답할 수 있어서, 여기 넷이 그 답을 만든다.
   *
   * 🔴 `cta_click` 을 재사용하지 않는다 — 그 이름은 이미 사이트 전역 CTA 수십 곳이 쏘고 있어
   *   수준 선택 분포가 그 안에 묻힌다(CPA_* 를 가른 것과 같은 이유).
   */
  // 랜딩 4갈래에서 수준을 고른 순간(파라미터: level_id).
  // 용도: 방문자 구성 파악 — 입문자가 실제로 많은지, 어느 갈래가 죽어 있는지.
  LEVEL_SELECTED: "level_selected",
  // 성향 테스트 1문항이 응답된 순간(파라미터: question_index 1~12, axis).
  // 🔴 **이탈 지점을 보려고 문항마다 쏜다.** 12문항은 정밀도를 위해 고른 값이라(사용자 결정),
  //    실제 이탈이 어디서 나는지 모르면 줄일 근거도 늘릴 근거도 생기지 않는다.
  //    완주율 = quiz_completed / quiz_answered(question_index=1).
  QUIZ_ANSWERED: "quiz_answered",
  // 결과 화면이 실제로 그려진 순간(파라미터: type_id).
  // 용도: 완주율, 유형 분포. 유형이 한쪽으로 쏠리면 기준 좌표를 다시 잡아야 한다는 신호다.
  QUIZ_COMPLETED: "quiz_completed",
  // 결과 화면에서 다음 행동을 고른 순간(파라미터: action='prefill'|'share'|'next', type_id).
  // 용도: 이 기능의 **종착 전환** — 테스트가 계산기 사용으로 이어지는지가 존재 이유다.
  QUIZ_RESULT_ACTION: "quiz_result_action",

  /**
   * ── 목표 여섯 (2026-08-27) ────────────────────────────────────────────────
   *
   * 첫 화면이 **긴 안내문에서 목표 버튼 여섯**으로 바뀌었다(사용자 피드백). 안내문은 `/about` 으로
   * 옮겼다. 이 이벤트가 그 교체의 성적표다 — 여섯 중 무엇이 눌리는지, **아무것도 안 눌리는지**.
   *
   * 🔴 `level_selected` 를 재사용하지 않는다. 그쪽은 "수준 4갈래"의 분포를 재는 이름이고 그 갈래는
   *   이제 `/about` 에만 있다. 한 이름에 두 화면을 섞으면 둘 다 못 읽는다.
   * ⚠ 값공간: `goal_id` 는 `shared/constants/landingGoals` 의 여섯 id 뿐이다(`asset-100m` …).
   *   `goal_kind` 는 `asset`|`dividend` — 자산이 먼저 눌리는지 배당이 먼저인지가 이 앱의
   *   포지셔닝을 되묻는 질문이라 따로 뽑는다.
   */
  // 첫 화면에서 목표 하나를 고른 순간(파라미터: goal_id, goal_kind).
  GOAL_SELECTED: "goal_selected",
  /**
   * 계산기가 그 목표를 **되짚어 보여 준 순간**(파라미터: goal_id, goal_kind, status).
   *
   * 🔴 `goal_selected` 의 **착지 확인**이다. 둘의 차이가 곧 이탈이다 — 목표를 눌렀는데 계산기에서
   *   배너를 못 본 사람이 있다면 링크·프리필 경로가 새고 있다는 뜻이다.
   * 🔴 `status` 가 이 이벤트의 진짜 값어치다: `missed` 비율이 높으면 **목표값 자체가 비현실적**
   *   이거나 기본 조건(기간·적립금)이 낮게 잡혀 있다는 신호다. 그건 카드 여섯의 숫자를 다시
   *   정할 근거가 된다 — 지금은 그걸 알 방법이 없다.
   * ⚠ 값공간: status = reached | missed | unknown (셋뿐이다).
   */
  GOAL_BANNER_VIEW: "goal_banner_view",

  /**
   * ── 콘텐츠 지면 → 계산기 (2026-08-30) ─────────────────────────────────────
   *
   * 🔴 **이 사이트의 가장 큰 계측 공백이었다.** 검색 유입 대부분은 티커 소개(`/ticker/:name`)와
   * 검색어 가이드(`/guide/:slug`)에 착지하는데, 그 지면들의 "계산해 보기" 버튼에 계측이 하나도
   * 없었다(2026-08-30 감사). 즉 **SEO 가 실제로 앱 사용으로 이어지는지**를 잴 수 없었다 — 페이지뷰는
   * 늘어도 그게 성과인지 알 길이 없었다는 뜻이다.
   *
   * 🔴 지면마다 새 이름을 만들지 않는다. 이미 `community_to_simulator`·`compare_to_simulator`·
   *   `market_pulse_to_simulator` 셋이 같은 질문을 서로 다른 이름으로 재고 있다(그 셋은 이미
   *   배포돼 데이터 연속성이 있어 그대로 둔다). 여기서 다섯 개를 더 만들면 "어느 지면이 잘
   *   보내는가"를 물을 때마다 리포트를 여덟 번 합쳐야 한다.
   * ⚠ 값공간: surface = ticker | guide (늘어날 수 있다) · slot = hero | toc (지면 안 위치).
   *   slot 을 가르는 이유: 같은 지면에서도 **글 위 버튼과 목차 레일 버튼의 성적이 다르고**,
   *   그 차이가 곧 "본문을 읽고 눌렀나, 훑다가 눌렀나"다.
   */
  CONTENT_TO_SIMULATOR: "content_to_simulator",

  /**
   * 목표를 누른 사람에게 **계획이 실제로 만들어진 순간**(파라미터: goal_id, goal_kind, preset_id, solved).
   *
   * 🔴 `solved` 가 이 이벤트의 핵심이다. `false` 면 그 구성으로는 **어떤 적립금으로도 목표에 닿지
   *   못한다**는 뜻이고(무배당·마이너스 성장), 그건 목표값이 아니라 **기본 프리셋을 다시 골라야
   *   한다**는 신호다. 지금은 그걸 알 방법이 없다.
   * ⚠ `goal_banner_view` 와 짝이다: 배너는 "무엇을 골랐고 닿는가", 이것은 "계획을 만들어 줬는가".
   *   둘의 차이가 곧 새 탭을 못 만들어 막힌 사람(비로그인 1탭 게이트)의 수다.
   */
  GOAL_PLAN_APPLIED: "goal_plan_applied",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

/** 빌드 시 주입되는 배포 도메인 (vite.config.ts의 단일 소스). */
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");

/** GA용 — 쿼리/해시까지 포함한 실제 접속 URL. 유입 분석에는 파라미터가 필요하다. */
const resolveAbsoluteUrl = (location?: PageLocation) => {
  if (typeof window === "undefined") return "";

  if (!location) {
    return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  return `${window.location.origin}${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
};

/**
 * SEO용 canonical — 쿼리/해시를 의도적으로 버린다.
 *
 * 공유 링크는 `?s=<lz-string 압축 상태>` 형태라, 접속 URL을 그대로 canonical에 넣으면
 * 공유될 때마다 새 canonical이 생겨 색인이 무한히 오염된다(중복 콘텐츠). 항상 클린 URL로 고정한다.
 * origin이 아니라 빌드 도메인을 쓰는 이유: 프리뷰 배포가 자기 자신을 canonical로 선언해
 * 본 도메인과 경쟁하는 것을 막는다.
 */
const resolveCanonicalUrl = (location?: PageLocation) => {
  if (typeof window === "undefined") return "";

  const pathname = location?.pathname ?? window.location.pathname;
  const origin = SITE_URL || window.location.origin;

  return `${origin}${pathname}`;
};

/**
 * canonical / og:url을 현재 라우트에 맞춘다.
 *
 * JSON-LD는 건드리지 않는다 — index.html에 정적으로 박혀 있어야 JS를 실행하지 않는 크롤러
 * (네이버 Yeti, 다음, 카카오/페이스북 스크래퍼)도 읽을 수 있기 때문이다.
 * 런타임에 주입하면 그 크롤러들에게는 존재하지 않는 것과 같다.
 */
export const applySeoRuntimeMetadata = (location?: PageLocation) => {
  if (typeof window === "undefined") return;

  const canonicalLink = document.getElementById("canonical-link") as HTMLLinkElement | null;
  const ogUrlMeta = document.getElementById("og-url") as HTMLMetaElement | null;
  const canonicalUrl = resolveCanonicalUrl(location);

  if (canonicalLink) canonicalLink.href = canonicalUrl;
  if (ogUrlMeta) ogUrlMeta.content = canonicalUrl;
};

export const initGoogleAnalytics = () => {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;

  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
  }

  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
};

/**
 * SPA 페이지뷰.
 *
 * 🔴 **`gtag("event", "page_view", …)` 다. `gtag("config", …)` 재호출이 아니다.**
 *
 * 2026-08-22 GA4 실측에서 페이지뷰가 대량으로 유실되고 있었다:
 * ```
 *   landingPage=(not set)   158 세션 (28일 전체의 53%)  이탈률 76.6%   ← 다른 페이지는 0~14%
 *   /            페이지뷰 1  vs  사용자 9
 *   /simulator   페이지뷰 13 vs  사용자 17
 * ```
 * 페이지뷰가 사용자 수보다 **적다**는 것은 대다수 방문이 페이지뷰를 한 건도 남기지 않았다는 뜻이다.
 * 그 결과 GA4 가 세션의 첫 페이지를 못 정해 `landingPage` 가 `(not set)` 이 되고, 유입 분석의 절반이
 * 눈이 먼 상태가 된다(어느 지면으로 들어오는지 모르면 어디를 고쳐야 할지도 모른다).
 *
 * 원인은 전달 방식이었다. 부팅에서 `config` 에 `send_page_view: false` 를 준 뒤(첫 화면 중복 방지),
 * 라우트마다 **`config` 를 다시 부르는** 방식으로 페이지뷰를 보내고 있었다. 같은 측정 ID 로 `config` 를
 * 되풀이하는 것은 gtag 가 **설정 갱신**으로 취급하는 경로라 이벤트가 나가지 않을 수 있다 — 구글이
 * SPA 에 안내하는 방식도 `event` 쪽이다.
 *
 * ⚠ `initGoogleAnalytics` 의 `send_page_view: false` 는 **그대로 둔다.** 그것을 켜면 첫 화면이
 *   자동 페이지뷰 + 이 함수의 페이지뷰로 **두 번** 세어진다.
 * ⚠ 계약은 `test/analytics/pageView.test.ts` 가 잠근다 — 다시 `config` 로 되돌리면 빨개진다.
 */
export const sendPageView = (location?: PageLocation) => {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (!window.gtag) return;

  const pathname = location?.pathname ?? window.location.pathname;
  const search = location?.search ?? window.location.search;
  const hash = location?.hash ?? window.location.hash;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: resolveAbsoluteUrl({ pathname, search, hash }),
    page_path: `${pathname}${search}${hash}`,
    page_type: pathname
  });
};

export const trackEvent = (eventName: AnalyticsEventName, params?: AnalyticsEventParams) => {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (!window.gtag) return;

  window.gtag("event", eventName, params ?? {});
};

/**
 * 이벤트별 파라미터 **타입 계약**. 여기 매핑된 이벤트는 `track()`이 파라미터를 강제한다
 * (오타·누락 = 컴파일 에러). 매핑 안 된 이벤트는 느슨한 파라미터를 받는다(기존 배선과의 점진 이행).
 *
 * ⚠ PII·연속 원값 금지(docs/analytics/ga4-plan.md) — 금액/기간 같은 연속값은 `bucketValue`로 버킷 라벨을 넣는다.
 */
export type AnalyticsEventParamMap = {
  [ANALYTICS_EVENT.PRESET_APPLIED]: { preset_id: string };
  [ANALYTICS_EVENT.SIMULATION_RESULT_VIEW]: { reinvest_mode?: string; target_met?: boolean };
  // 🔴 `source` 를 쓰지 마라 — GA4 가 유입 출처 귀속에 쓰는 이름이다(login_failed 와 같은 `provider`).
  [ANALYTICS_EVENT.LOGIN_COMPLETED]: { provider: string; entry_point?: string };
  [ANALYTICS_EVENT.LOGIN_FAILED]: {
    provider: string;
    reason: "provider_error" | "no_session" | "client_unavailable";
    in_app_browser: string;
    context_switched: boolean;
    attempts: number;
    error_code?: string;
  };
  [ANALYTICS_EVENT.SCENARIO_SHARED]: { share_method: string };
  [ANALYTICS_EVENT.GOAL_WIDGET_VIEW]: {
    has_target: boolean;
    /**
     * 달성률의 현재값 출처 — 지금 보유한 종목(measured) / 시뮬레이터에 저장된 조건(simulated).
     * ⚠ GA4 콘솔에 커스텀 차원을 등록하기 전까지는 `(not set)` 으로만 보인다.
     */
    current_basis: "measured" | "simulated";
    /** 달성률 버킷 — 연속값 금지 규칙에 따른 저카디널리티 라벨. 목표 미설정이면 미전송. */
    progress_bucket?: "0-25" | "25-50" | "50-75" | "75-100" | "reached";
    /** 저장된 투자 기간 안에 목표에 닿는가. 목표 미설정이면 미전송. */
    reached_in_range?: boolean;
  };
  [ANALYTICS_EVENT.PORTFOLIO_VIEW]: {
    holdings_count: number;
    has_holdings: boolean;
  };
  [ANALYTICS_EVENT.PORTFOLIO_HOLDING_SAVED]: {
    action: "add" | "edit";
    /** 시뮬레이터 유니버스가 아는 종목인가(직접 추가한 종목이면 false). */
    covered: boolean;
  };
  [ANALYTICS_EVENT.PORTFOLIO_HOLDING_DELETED]: { covered: boolean };
  [ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW]: {
    holdings_count: number;
    /** 합계에 실제로 반영된 종목 수(수량 미입력·데이터 없음 제외). */
    covered_count: number;
    /** 평가금액 버킷(**USD** 기준). 원값 금지 — `bucketValue` 라벨만. */
    value_bucket: string;
  };
  [ANALYTICS_EVENT.CLOUD_SYNC_CONFLICT]: {
    shown: boolean;
    resolution: "device" | "cloud" | "blend" | "deferred";
    device_tabs: number;
    cloud_tabs: number;
    result_tabs: number;
  };
  [ANALYTICS_EVENT.COMMUNITY_POST_VIEW]: { has_sim: boolean };
  [ANALYTICS_EVENT.COMMUNITY_POST_PUBLISHED]: { has_sim: boolean };
  [ANALYTICS_EVENT.COMMUNITY_LIKE]: { like_action: "like" | "unlike" };
  [ANALYTICS_EVENT.COMMUNITY_POST_SHARED]: {
    /** 'x'|'facebook'|'naver' 는 공유 창의 채널 버튼(components/common/ShareDialog 의 ShareChannelId). */
    method: "web_share" | "copy_link" | "x" | "facebook" | "naver";
    post_id: string;
    kind: string;
    /** 공유가 일어난 표면 — 피드 카드='feed', 상세 페이지='detail'. */
    placement: "feed" | "detail";
  };
  [ANALYTICS_EVENT.COMPARE_ENTRY]: {
    /** 보낸 화면(`pages/Ticker/utils` 의 `CompareEntryPoint`). 라우트 경로가 아니라 안정적인 슬러그다. */
    from: string;
    /** 실제로 열린 열 수. 고른 수와 다를 수 있다 — 유니버스에서 빠진 티커는 걸러진다. */
    ticker_count: number;
  };
  [ANALYTICS_EVENT.COMPARE_TO_SIMULATOR]: {
    /** 시뮬레이터로 보낸 종목(대문자 심볼). */
    ticker: string;
  };
};

/**
 * 타입 안전 이벤트 전송. 신규 배선은 이걸 쓴다(계약된 이벤트는 파라미터가 강제됨).
 * 내부적으로 `trackEvent`에 위임하므로 발화 동작·GA 게이트는 완전히 동일하다.
 */
export function track<K extends keyof AnalyticsEventParamMap>(event: K, params: AnalyticsEventParamMap[K]): void;
export function track(event: AnalyticsEventName, params?: AnalyticsEventParams): void;
export function track(event: AnalyticsEventName, params?: AnalyticsEventParams): void {
  trackEvent(event, params);
}

/** GA4 User Properties — 유저 코호트 분석용. PII 금지(불리언·저카디널리티 라벨만). */
export type AnalyticsUserProperties = {
  /** 최초 로그인 완료 시 true. */
  has_account?: boolean;
  /** 최초 저장(로컬/클라우드) 시 true. */
  has_saved?: boolean;
  /** 2회차+ 방문 시 true. */
  is_returning?: boolean;
  /**
   * 사용자가 마지막으로 고른 테마 값.
   *
   * ⚠ **두 축이 한 속성에 섞여 들어온다**(2026-08-01): 색 프리셋 id(`'velog'`·`'grape'`…, `ThemePresetSwitcher`)와
   * 밝기(`'light'`·`'dark'`, `ColorSchemeToggle`). 지금 화면에 있는 진입점은 밝기 토글 하나뿐이라
   * 실제로 들어오는 값은 사실상 `'light'|'dark'` 다. 판별자 파라미터로 축을 쪼개는 택소노미 정리는 별건.
   */
  preferred_theme?: string;
  /** 최초 커뮤니티 참여(글/좋아요/댓글) 시 true. */
  community_active?: boolean;
};

/**
 * GA4 User Properties 설정. `gtag('set','user_properties',…)`는 이후 **모든 이벤트**에 이 속성을 부착해
 * "저장한 유저 vs 아닌 유저"처럼 코호트로 쪼개 보게 한다. GA4 콘솔에 User Properties로도 등록해야 리포트에 뜬다.
 */
export const setUserProperties = (props: AnalyticsUserProperties) => {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (!window.gtag) return;

  window.gtag("set", "user_properties", props);
};

/**
 * 연속값(금액·기간·세율)을 **저카디널리티 버킷 라벨**로 바꾼다. GA로는 원값이 아니라 버킷을 보낸다
 * (PII화·카디널리티 폭발 방지 + 분포 분석 용이). `edges`는 경계값 목록(오름차순 정렬됨).
 * 예: `bucketValue(75, [50, 100, 300])` → `"50–100"`, `bucketValue(500, [50,100,300])` → `"≥300"`.
 */
export const bucketValue = (value: number, edges: readonly number[]): string => {
  const sorted = [...edges].sort((a, b) => a - b);
  if (sorted.length === 0) return String(value);
  if (value < sorted[0]) return `<${sorted[0]}`;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (value < sorted[i + 1]) return `${sorted[i]}–${sorted[i + 1]}`;
  }
  return `≥${sorted[sorted.length - 1]}`;
};

/**
 * 로그인 전환 귀속(login_completed) 마커 — sessionStorage.
 *
 * OAuth는 풀 리다이렉트라 "로그인을 시작했다"는 맥락이 리다이렉트를 넘어가며 유실된다. 그래서
 * 로그인 시작 시(`login()` 이 signInWithOAuth 리다이렉트 **직전**) 이 마커에 source를 심고, 복귀 후
 * 세션이 잡힌 랜딩에서 **read+clear** 하여 `login_completed(source)` 를 딱 1회 발화한다.
 *
 * ⚠ 이중 계측 방지(project-map §GA4): 랜딩이 메인이면 `useCloudWorkspaceSync`, 커뮤니티면
 * `CommunityAuthProvider` 가 읽는다. **양쪽 다 이 read+clear 로 게이팅**하므로 — 랜딩 페이지는 하나뿐이고
 * 마커는 한 번 읽히면 지워지므로 — 로그인당 정확히 1회만 발화한다(SIGNED_IN 무조건 발화 금지).
 */
export const LOGIN_SOURCE_KEY = storageKey('cloud-login-source');

/** 로그인 리다이렉트 직전에 source를 심는다(예: 'google'|'naver'|'kakao'). */
export const writeLoginSource = (source: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LOGIN_SOURCE_KEY, source);
  } catch {
    // sessionStorage 불가(프라이빗 모드 등) — 로그인 자체엔 영향 없다. 전환 귀속만 생략된다.
  }
};

/**
 * 마커를 **지우지 않고** 읽는다. 콜백 실패 판정(main.tsx)이 프로바이더를 알아야 하지만,
 * 성공 시 랜딩(`readAndClearLoginSource`)이 `login_completed` 를 발화하도록 마커를 **남겨야** 한다.
 */
export const peekLoginSource = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(LOGIN_SOURCE_KEY);
  } catch {
    return null;
  }
};

/** 복귀 랜딩에서 마커를 읽고 즉시 지운다(1회성). 없으면 null. */
export const readAndClearLoginSource = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(LOGIN_SOURCE_KEY);
    if (value) window.sessionStorage.removeItem(LOGIN_SOURCE_KEY);
    return value;
  } catch {
    return null;
  }
};
