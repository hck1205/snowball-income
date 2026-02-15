const GA_MEASUREMENT_ID = "G-VY837P1WK2";

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

const resolveAbsoluteUrl = (location?: PageLocation) => {
  if (typeof window === "undefined") return "";

  if (!location) {
    return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  return `${window.location.origin}${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
};

export const applySeoRuntimeMetadata = (location?: PageLocation) => {
  if (typeof window === "undefined") return;

  const canonicalLink = document.getElementById("canonical-link") as HTMLLinkElement | null;
  const ogUrlMeta = document.getElementById("og-url") as HTMLMetaElement | null;
  const absoluteUrl = resolveAbsoluteUrl(location);

  if (canonicalLink) canonicalLink.href = absoluteUrl;
  if (ogUrlMeta) ogUrlMeta.content = absoluteUrl;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Snowball Income",
    applicationCategory: "FinanceApplication",
    applicationSubCategory: "Dividend Strategy Simulator",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    description: "배당 투자 전략을 설계하고 장기 현금흐름 및 자산 변화를 시뮬레이션하는 웹 애플리케이션",
    keywords: "배당 투자, 포트폴리오 시뮬레이션, 월배당, 장기 투자",
    featureList: [
      "포트폴리오 비중 시뮬레이션",
      "월별/연도별 배당 추이 분석",
      "목표 월배당 도달 시점 계산",
      "세율/재투자 설정 기반 결과 비교"
    ],
    isAccessibleForFree: true,
    url: absoluteUrl
  };

  let script = document.getElementById("structured-data") as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = "structured-data";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

export const initGoogleAnalytics = () => {
  if (typeof window === "undefined") return;

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
  if (!window.gtag) return;

  const pathname = location?.pathname ?? window.location.pathname;
  const search = location?.search ?? window.location.search;
  const hash = location?.hash ?? window.location.hash;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: resolveAbsoluteUrl({ pathname, search, hash }),
    page_path: `${pathname}${search}${hash}`
  });
};
