import type { ReactNode } from 'react';

/**
 * info    — 중립 공지. **면(틴트)이 없다** — 중립 배경 + 1px 액센트 테두리 + 색 아이콘.
 * warning — 주의가 필요하지만 막지는 않음(예: 금융소득종합과세 임계 초과). 틴트 면.
 * danger  — 잘못된 입력/에러. 틴트 면.
 *
 * 톤마다 표현이 갈리는 이유는 `Banner.styled.ts` 의 `TONE` 주석에 있다(한 화면의 틴트 면 상한).
 */
export type BannerTone = 'info' | 'warning' | 'danger';

export type BannerProps = {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  /** 주면 오른쪽에 닫기 버튼이 붙는다. */
  onDismiss?: () => void;
  dismissAriaLabel?: string;
  /**
   * 접근성 역할.
   * - `status`(기본): 조용히 알린다. 스크린리더가 하던 말을 끊지 않는다.
   * - `alert`: 즉시 끼어든다. 사용자가 지금 조치해야 하는 에러에만.
   */
  role?: 'status' | 'alert' | 'note';
  /**
   * 세로 정렬. 기본 `start` — 첫 줄에 닫기 버튼을 맞춘다(여러 줄 배너에 적합).
   * 한 줄짜리 배너는 `center`로 제목과 닫기 버튼을 같은 중앙선에 맞춘다.
   */
  align?: 'start' | 'center';
  'aria-label'?: string;
};
