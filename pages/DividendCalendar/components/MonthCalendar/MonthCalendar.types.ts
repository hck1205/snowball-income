import type { DayCell } from '../../utils';

export type MonthCalendarProps = {
  /** 6주 × 7일 고정. */
  weeks: DayCell[][];
  /** '2026년 7월' — `<caption>`에 들어간다. */
  monthLabel: string;
  /** 월 제목 `<h2>` 의 id. 표를 그 제목과 묶는다. 예시 모드에서는 무시된다(표가 자기 이름을 갖는다). */
  labelledById: string;
  /**
   * **예시(미리보기)** 렌더인가. 실제 선택 결과가 아니라 "고르면 이런 게 보인다"를 깔아 두는 모드다.
   *
   * 켜지면 ①칩이 흐려지고(장식) ②칩이 버튼이 아니게 되며(누를 실체가 없다) ③표의 접근명·캡션이
   * **예시임을 말한다**. ③이 핵심이다 — 흐림은 스크린리더에 도달하지 않는다.
   */
  isPreview?: boolean;
  /**
   * 지급이 있는 날 칸을 눌렀을 때(ISO 'YYYY-MM-DD').
   * 미배선이면 버튼 자체를 렌더하지 않는다 — 격리 렌더에서도 누를 수 없는 버튼이 생기지 않는다.
   */
  onDayJump?: (isoDate: string) => void;
};
