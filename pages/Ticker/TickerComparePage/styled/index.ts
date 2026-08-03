/**
 * `/ticker/compare` 의 스타일 — **2026-08-03 전면 개편**.
 *
 * ## 종전 화면의 진단 (실측 스크린샷 기준)
 * 흰 카드 셋이 세로로 같은 무게로 쌓여 있었다. 그래서 이런 일이 벌어졌다:
 *  1. **비교 대상이 화면에서 정체성을 못 가졌다.** SCHD 라는 글자가 칩 · 열 머리 · 지급월 칸
 *     **세 곳**에 나오는데 셋이 아무 시각적 연결이 없어, 눈이 매번 글자를 다시 읽어야 했다.
 *  2. **답이 맨 아래 회색 한 줄이었다.** 이 화면이 답하는 질문은 "이 조합이면 매달 들어오는가"인데
 *     그 결론이 세 번째 카드 바닥의 13px 문장이었다. 화면의 초점이 없었다.
 *  3. **표에 읽는 방향이 없었다.** 일곱 행이 같은 굵기·같은 색으로 이어져 출처(실측/가정)가
 *     배지를 하나씩 읽어야만 갈렸다.
 *  4. **빈 상태가 똑같은 사각형 열 개였다.** 무엇을 누를지 정할 근거가 라벨 한 줄뿐이었다.
 *
 * ## 이 파일이 바꾼 것 (구조 — 색이 아니라)
 *  - 선택은 칩 줄이 아니라 **정원 4자리의 덱**이다. 빈 자리가 도형으로 보인다.
 *  - **결론 블록**이 표 **위**로 올라오고, 이 화면의 유일한 hero 숫자(`font.heroNumeric`)를 갖는다.
 *  - 표는 출처별 **행 묶음** 셋으로 갈리고, 열 머리가 종목의 얼굴(귀 + 큰 티커)이 된다.
 *  - 종목 색(`assignSeries`)이 **덱 귀 → 열 머리 귀 → 지급월 마크** 세 곳을 관통한다.
 *
 * ## 규율
 * 🔴 하드코딩 hex 금지 — 토큰만. 새 색 토큰을 만들지 않는다.
 * 🔴 색이 유일한 채널이 되지 않는다 — 지급 있음/없음, 최고/최저, 자료 없음은 전부 **글자·모양**이 진다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다 — 배당률이 높은 것은 이익이 아니라 사실이다.
 * 🔴 채도 **면**은 늘리지 않는다. 이 파일이 쓰는 채도는 전부 높이 6px 이하 · 폭 180px 미만의
 *    선·귀·마크(L1)다 — `tintscan` 의 면 판정(폭 180 AND 높이 8)에 걸리지 않는다.
 * ⚠ styled 템플릿 **안** 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊겨 앱이 부팅하지 않는다.
 *
 * ## 관심사별 분할 지도 (원본 `TickerComparePage.styled.ts` 962줄을 값 변경 없이 옮긴 것)
 * ```
 *   shell.ts      화면 세로 리듬 + 스크린리더 전용 (각주를 자기 손으로 그리지 않는 이유도 여기)
 *   deck.ts       선택 덱 — 정원 4자리 슬롯 · 셀렉트 줄
 *   verdict.ts    결론 블록 — hero 숫자 · 12칸 지급월 트랙
 *   table/        비교표 — frame(스크롤 상자) · head(열 머리) · cells(항목·값 칸)
 *   empty.ts      빈 상태 패널 · 1종만 골랐을 때의 안내
 *   suggest.ts    예시 조합 격자 · 미니 트랙
 *   constants.ts  두 파일 이상이 함께 쓰는 치수 상수 (모듈 내부용 — 여기서 재수출하지 않는다)
 * ```
 */

export { Stack, VisuallyHidden } from './shell';

export {
  Deck,
  DeckHead,
  DeckTitle,
  DeckCount,
  SlotGrid,
  Slot,
  SlotBody,
  SlotTicker,
  SlotName,
  SlotRemove,
  SlotGhost,
  AddRow,
  PickerHint
} from './deck';

export {
  Verdict,
  VerdictHead,
  VerdictLede,
  VerdictEyebrow,
  VerdictValue,
  VerdictUnit,
  VerdictSentence,
  MonthTrack,
  MonthCol,
  MonthNum,
  MonthMarks,
  MonthMark,
  MonthTickers,
  MonthGapMark,
  VerdictNotes,
  CoverageNote
} from './verdict';

export {
  TableScroller,
  ScrollHint,
  Table,
  HeadCorner,
  HeadCell,
  HeadTicker,
  HeadName,
  GroupHead,
  GroupTitle,
  GroupDesc,
  MetricCell,
  MetricLabelRow,
  MetricLabel,
  MetricNote,
  BasisBadge,
  ValueCell,
  ValueText,
  UnknownValue,
  ExtremeMark
} from './table';

export { EmptyBlock, EmptyGlyph, EmptyBody, EmptyTitle, EmptyLede, PartialNotice } from './empty';

export {
  SuggestSection,
  SectionHead,
  SectionTitle,
  SectionHint,
  CoverBadge,
  MiniPreview,
  MiniTrack,
  MiniCell,
  MiniCaption
} from './suggest';
