/**
 * ⚠ 이 배럴은 **엔트리 번들에서 참조하지 않는다**. 라우터는 `@/pages/DividendCalendar/DividendCalendarPage`
 * 를 `React.lazy`로 직접 불러 캘린더 화면을 별도 청크로 유지한다(`pages/index.ts`에도 연결하지 않는다).
 */
export { default as DividendCalendarPage } from './DividendCalendarPage';
export type { DividendCalendarPageProps } from './DividendCalendarPage';
