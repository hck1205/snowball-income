/**
 * 법무 고지문(`/privacy`·`/terms`).
 *
 * ⚠ 라우터는 이 배럴을 쓰지 않고 각 페이지 폴더를 **직접 lazy import** 한다
 * (`lazy(() => import('@/pages/Legal/PrivacyPage'))`). 배럴을 lazy 하면 두 문서가 한 청크로 묶여
 * 방침만 열어도 약관까지 내려받게 된다. 이 배럴은 테스트·도구가 폴더 단위로 가져다 쓰는 용도다.
 */
export { default as PrivacyPage } from './PrivacyPage';
export { default as TermsPage } from './TermsPage';
