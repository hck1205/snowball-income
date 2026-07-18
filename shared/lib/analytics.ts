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
