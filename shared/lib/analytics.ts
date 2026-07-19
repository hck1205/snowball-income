const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

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
  CTA_CLICK: "cta_click",
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
  INVESTMENT_SETTING_CHANGED: "investment_setting_changed",
  // 토글 상태 변경 이벤트. 용도: 간편/정밀, 그래프 모드 등 기능 선호도 분석.
  TOGGLE_CHANGED: "toggle_changed",
  // 테마 프리셋 변경 이벤트(파라미터: preset_id). 용도: 프리셋별 선호도 분포, 기본 팔레트(velog) 유지율 분석.
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
  if (!GA_MEASUREMENT_ID) return;

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

export const sendPageView = (location?: PageLocation) => {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (!window.gtag) return;

  const pathname = location?.pathname ?? window.location.pathname;
  const search = location?.search ?? window.location.search;
  const hash = location?.hash ?? window.location.hash;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: resolveAbsoluteUrl({ pathname, search, hash }),
    page_path: `${pathname}${search}${hash}`,
    page_type: pathname
  });
};

export const trackEvent = (eventName: AnalyticsEventName, params?: AnalyticsEventParams) => {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
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
  [ANALYTICS_EVENT.LOGIN_COMPLETED]: { source: string; entry_point?: string };
  [ANALYTICS_EVENT.SCENARIO_SHARED]: { share_method: string };
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
  /** 현재 테마 프리셋 id. */
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
  if (!GA_MEASUREMENT_ID) return;
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
export const LOGIN_SOURCE_KEY = "snowball:cloud-login-source";

/** 로그인 리다이렉트 직전에 source를 심는다(예: 'google'|'naver'|'kakao'). */
export const writeLoginSource = (source: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LOGIN_SOURCE_KEY, source);
  } catch {
    // sessionStorage 불가(프라이빗 모드 등) — 로그인 자체엔 영향 없다. 전환 귀속만 생략된다.
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
