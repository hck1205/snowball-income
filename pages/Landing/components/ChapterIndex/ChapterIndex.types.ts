import type { LandingChapter } from '../../copy';

export type ChapterIndexProps = {
  /**
   * 그릴 장 목록. 🔴 **뷰가 손으로 적지 않는다** — `LANDING_CHAPTERS` 하나가 차례·앵커·번호의
   * 유일한 출처다(두 곳이 갈라지면 목차가 없는 장을 가리키거나 번호가 어긋난다).
   */
  chapters: readonly LandingChapter[];
};
