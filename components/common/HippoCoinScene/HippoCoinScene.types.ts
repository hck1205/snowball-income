export type HippoCoinSceneProps = {
  /** 무대 한 변의 px(하마 크기). 히어로는 240~280, 빈 상태는 120~160. 기본 240. */
  size?: number;
  /**
   * 이미지 로딩 전략. 히어로처럼 첫 화면이면 `eager`, 접힘 아래면 `lazy`.
   * ⚠ 두 이미지가 합쳐 800KB 대라 접힘 아래에서 eager 를 쓰면 첫 페인트가 늦어진다.
   */
  loading?: 'eager' | 'lazy';
  /**
   * 넘기면 이 연출이 **이름을 진다**(role=img). 생략하면 장식이다.
   * 🔴 기본은 장식이 맞다 — 옆의 제목·리드가 같은 말을 이미 한다.
   */
  label?: string;
};
