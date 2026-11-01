/**
 * `/dividend/how-much` — 월 배당 목표 → 종목별 필요 원금.
 * ⚠ 라우터는 이 배럴이 아니라 `@/pages/DividendTarget/DividendTargetPage` 를 lazy 로 직접 가져간다
 *   (다른 lazy 페이지와 같은 이유 — 배럴을 lazy 하면 형제 모듈까지 한 청크로 묶인다).
 */
export { default as DividendTargetPage } from './DividendTargetPage';
export { DIVIDEND_TARGET_COPY } from './copy';
