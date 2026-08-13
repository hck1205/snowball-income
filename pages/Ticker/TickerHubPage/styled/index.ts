/**
 * ── `/ticker/all` 의 지면 설계 ─────────────────────────────────────────────────
 *
 * 이 화면은 **라이브러리의 색인(index)** 이다. 27종을 고르게 하는 것이 유일한 일이고,
 * 그래서 지면이 답해야 하는 질문은 셋이다 — "무엇이 있나 / 어디 있나 / 어떤 게 나은가".
 *
 * 종전 구조는 "히어로 카드 + 카테고리별 카드 나열"이라 셋 중 첫 번째만 답했다. 1280px 에서 문서가
 * 5,393px 이었고(실측 2026-08-03), 특정 티커를 찾는 유일한 방법이 스크롤이었다. 검색으로 들어온
 * 사람은 자기가 찾던 티커가 이 목록에 있는지조차 눈으로 확인해야 했다.
 *
 * 새 구조는 **좌: 색인 레일 / 우: 결과**의 2단이다. 상세 페이지(`/ticker/:name`)가 방금
 * "번호 붙은 목차 레일 + 본문"으로 재편됐고, 허브가 그 어휘를 그대로 쓴다 —
 * 허브에서 카드를 눌러 상세로 들어간 사람이 **같은 골격**을 다시 만난다.
 *
 * ## 상세 페이지와 공유하는 어휘 (한 제품으로 읽히게 하는 장치)
 *  · sticky 색인 레일 + 항목 번호(`01`) + 개수 + 바닥 상시 CTA → 상세의 `TocAside` 와 같은 골격
 *  · 번호 + 헤어라인 머리말(`SectionEyebrow`) → 장이 어디서 시작하는지를 선으로도 말한다
 *  · 라벨 좌 · 값 우 · 행 사이 헤어라인(`SpecTable`) → 매스트헤드 스펙 줄이 같은 문법
 *  · 주역 지표 하나 + 보조 지표 행들(`HeroMetric`) → 카드 안의 지표판이 같은 문법
 *  · 표 보기의 순위·티커·비중 표 → 상세의 `HoldingsTable` 과 같은 문법
 *
 * ## 틴트 면 예산 (tintscan: 화면당 2면) — 실측 기준선 **1**, 여유 1(쓰지 않는다)
 * 이 화면이 스스로 만드는 채도 면은 **0개**다. 하나 남은 면은 이 화면 것이 아니다.
 *   ① 공용 `PageFooter`(브랜드 패널) — 이 화면이 고를 수 없는, 페이지 공통으로 딸려오는 면
 *
 * 🔴 **남은 한 장을 쓰지 마라.** 흰 캔버스의 이득은 절제에서 나온다
 * (`shared/styles/surfaces.ts` 머리말). 특히 카드 캡으로 되돌리지 마라 — `card.ts` 의 `CardScope`
 * 에 붙은 `--tk-cap-fill` 주석이 그 자리를 왜 비웠는지 실측으로 적어 뒀다.
 *
 * 🔴 이 파일의 컨트롤(검색·주기 칩·정렬·보기 전환·색인 레일)도 **전부 중립 면**이다.
 * 색은 폭 180px 미만의 자리(칩·점·번호·귀)와 6px 이하의 줄(리본·레일)에만 싣는다 — 둘 다 면 판정
 * (폭 ≥180px · 높이 ≥8px · 비중립 배경)에 걸리지 않는다. 컨트롤 하나에 틴트 면을 깔고 싶어지면
 * 먼저 tintscan 을 돌려 몇이 되는지 확인하라.
 *
 * ── 이 폴더의 구성 ────────────────────────────────────────────────────────────
 * 종전에는 한 파일(1,338줄)이었다. **동작을 바꾸지 않고** 관심사별로만 갈랐다 —
 * 값·선택자는 그대로다. 배럴이 옛 파일과 **똑같은 72개 심볼**을 내보낸다.
 *
 *   tokens.ts        색 축(카테고리 3색 순환)·기하 상수 — 여러 파일이 함께 읽는다
 *   accent.ts        티커 액센트 파생 블록 — 🔴 카드와 표 행이 **반드시 공유해야** 하는 단일 원본
 *   masthead.ts      지면 머리(제목·리드·라이브러리 스펙 줄)
 *   rail.ts          2단 레이아웃 + 색인 레일 뼈대(묶음 라벨·구분선)
 *   search.ts        레일 안 검색 필드
 *   filters.ts       레일 안 주기 칩·정렬·보기 전환
 *   categoryIndex.ts 레일 안 카테고리 목차와 비교 CTA
 *   results.ts       결과 영역 골격과 요약 줄
 *   sections.ts      카테고리 섹션 머리말·제목·빈 섹션
 *   card.ts          카드 보기(색 스코프·리본·지표판)
 *   table.ts         표 보기
 *   empty.ts         검색 결과 0건의 빈 상태
 */

export { CARD_MIN_WIDTH } from './tokens';

export {
  LibrarySpec,
  LibrarySpecItem,
  LibrarySpecLabel,
  LibrarySpecValue,
  Masthead,

  MastheadLede,
  MastheadMascot,
  MastheadTitle
} from './masthead';

export { IndexRail, Layout, RailDivider, RailGroupLabel } from './rail';

export { SearchClear, SearchField, SearchGlyph, SearchInput } from './search';

export { FilterRow, FrequencyChip, SortSelect, ViewToggle, ViewToggleButton } from './filters';

export {
  CategoryIndex,
  CategoryLink,
  CategoryLinkCount,
  CategoryLinkLabel,
  CategoryList,
  CategoryNav,
  CompareLink
} from './categoryIndex';

export { ResetButton, ResultChip, ResultCount, ResultSummary, Results } from './results';

export {
  CategorySection,
  SectionCount,
  SectionEmpty,
  SectionEyebrow,
  SectionGlyph,
  SectionHead,
  SectionHeading
} from './sections';

export {
  CapLabel,
  CardBody,
  CardMetric,
  CardMetricLabel,
  CardMetricLead,
  CardMetricRow,
  CardMetricRowLabel,
  CardMetricRowValue,
  CardMetricRows,
  CardMetricValue,
  CardNames,
  CardScope,
  CardSymbol,
  CardTagline,
  HubPickCard
} from './card';

export {
  TableEnglish,
  TableKorean,
  TableMuted,
  TableNameCell,
  TableNumberCell,
  TableRow,
  TableScroll,
  TableSelectCell,
  TableTickerCell,
  TableTickerLink,
  TickerTable
} from './table';

export {
  EmptyActions,
  EmptyGlyph,
  EmptyState,
  EmptySuggestion,
  EmptyText,
  EmptyTitle
} from './empty';
