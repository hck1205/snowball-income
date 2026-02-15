import ReactDOM from "react-dom/client";
import AppRouter from "@/router";

const applySeoRuntimeMetadata = () => {
  const canonicalLink = document.getElementById("canonical-link") as HTMLLinkElement | null;
  const ogUrlMeta = document.getElementById("og-url") as HTMLMetaElement | null;
  const absoluteUrl = `${window.location.origin}${window.location.pathname}`;

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

applySeoRuntimeMetadata();

ReactDOM.createRoot(document.getElementById("root")!).render(<AppRouter />);
