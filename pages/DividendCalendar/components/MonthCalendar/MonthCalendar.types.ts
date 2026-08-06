import type { DayCell, TickerSeriesResolver } from '../../utils';

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
   * **개관 열용 밀도**. 이 격자가 본문 전폭이 아니라 340~480px 짜리 옆 열에 설 때 켠다 —
   * 칸 높이·패딩·칩 껍데기를 줄여 6주 격자가 뷰포트를 넘지 않게 한다(sticky 지도가 성립하려면
   * 화면 안에 들어와야 한다).
   *
   * 🔴 **DOM 은 한 글자도 달라지지 않는다.** 밀도는 표 루트가 내리는 CSS 변수로만 바뀐다 —
   * 밀도에 따라 렌더 개수를 바꾸면 잘린 정보가 폭에 따라 도달 불가능해진다(MAX_DAY_CHIPS 주석 참고).
   */
  compact?: boolean;
  /**
   * 티커 → 시리즈 색 변수. **화면 하나가 만든 색 사전을 그대로 받는다**(`tickerSeriesResolver`) —
   * 부품이 스스로 색을 정하면 같은 화면의 아젠다·범례와 배정이 갈려 "같은 종목 다른 색"이 된다.
   * 미지정이면 집합을 모르는 1겹 해시로 떨어진다(격리 렌더용 폴백).
   */
  seriesOf?: TickerSeriesResolver;
  /**
   * 지급이 있는 날 칸을 눌렀을 때(ISO 'YYYY-MM-DD').
   * 미배선이면 버튼 자체를 렌더하지 않는다 — 격리 렌더에서도 누를 수 없는 버튼이 생기지 않는다.
   */
  onDayJump?: (isoDate: string) => void;
};
