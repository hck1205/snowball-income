/**
 * `/ticker/overlap` 의 공용 스타일 — **종목 비교(`/ticker/compare`)와 같은 문법**을 쓴다.
 *
 * - 고르는 면(검색·바구니)은 brand 면: `PICK_RADIUS` + `cardElevation('base')`.
 * - 결론(중복률)은 비교 화면의 결론 블록과 같은 모양: 가라앉은 중립 면 + 상단 6px hue 리본 + 화면 유일 hero 숫자.
 * - 종목 색은 `assignSeries` 한 벌이 바구니 귀 → 매트릭스 머리 → 종목 행의 점 세 곳을 관통한다.
 *
 * 🔴 하드코딩 hex 금지 — 토큰만. 새 색 토큰을 만들지 않는다.
 * 🔴 색이 유일한 채널이 되지 않는다 — 중복률 증감은 부호 글자가, 보유 여부는 점의 채움/테두리 + 낭독 문구가 진다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다 — 겹침이 느는 것은 손실이 아니라 사실이다.
 *    "몰림"은 warning 계열 하나로만 말한다.
 * ⚠ styled 템플릿 안 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊긴다.
 */
export { PickerColumn, ResultColumn, Stack, Workbench } from './layout.styled';
export {
  EmptyNote,
  PickSurface,
  SectionHint,
  SeriesDot,
  SurfaceCount,
  SurfaceHead,
  SurfaceTitle,
  VisuallyHidden
} from './primitives.styled';
