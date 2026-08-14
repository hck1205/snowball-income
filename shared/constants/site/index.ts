/**
 * 제품 표기의 **단일 원천**.
 *
 * 🔴 이 문자열은 종전에 **일곱 곳에 복사돼** 있었다 — 서버 렌더 핸들러 5개, `useDocumentMeta`,
 * 그리고 빌드(`vite.config.ts`). 브랜드 표기가 한 번이라도 갈리면 검색결과 제목·SNS 카드·탭 제목이
 * 서로 다른 이름을 말하게 되고, 그 손실은 **화면 확인으로는 드러나지 않는다**(각 표면을 크롤러
 * 시점으로 따로 열어 봐야 보인다).
 *
 * ⚠ 제품명은 **영문 "Hungry Hippo" 하나**다(한글 음차 금지, 2026-08-03 확정).
 * `tools/brand/check-brand-alpha.mjs` 가 표기 규칙을 별도로 잠근다.
 */
export const SITE_NAME = 'Hungry Hippo';

/**
 * 문서 제목에 사이트명을 붙인다 — `제목 - Hungry Hippo`.
 *
 * 🔴 **접미는 표면이 붙인다.** 콘텐츠(카피 상수·티커 메타)는 앞자리만 소유한다. 콘텐츠가 접미를
 * 직접 적으면 표면이 한 번 더 붙여 `… - Hungry Hippo - Hungry Hippo` 가 된다 — 2026-08-14 에
 * `documentTitle` 두 개가 실제로 그 상태였다.
 */
export const withSiteTitleSuffix = (title: string): string => `${title} - ${SITE_NAME}`;
