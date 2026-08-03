/**
 * ─────────────────────────────────────────────────────────────────────────────
 * `/dividend/portfolio` 의 **레이아웃 골격** (2026-08-03 2차 리워크)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ## 무엇이 틀렸었나
 * 1차 리워크는 색(귀·도넛·링)만 얹고 **구조를 그대로 뒀다** — 1280px 에서 폭 1160px 짜리 카드
 * 다섯 장이 세로로 쌓여 문서 길이가 2,300px 이었고, 이 화면의 질문("지금 얼마 받나 / 목표까지
 * 얼마 남았나")의 답인 요약 카드는 **y≈1,200 에 있었다.** 스크롤 두 번 아래가 답이면 위계가 없는 것이다.
 *
 * ## 지금의 골격 — 데크 + 작업대(2열)
 * ```
 *  [시세 스트립]
 *  ┌ Deck ─────────────────────────────────┬ 다음 지급 ─┐   ← 히어로와 D-Day 가 한 줄
 *  │ h1 · 리드 · 기준일                     │  D-12      │
 *  └───────────────────────────────────────┴────────────┘
 *  [라이브 리전 · 클라우드 고지 · 배너]
 *  ┌ Workbench ────────────────────────────┬ Rail ──────┐
 *  │ ① 보유 종목 (표 — 이 화면의 본체)      │ ③ 지금 받는│  ← 레일은 sticky.
 *  │ ② 목표 달성                            │    배당    │     수량을 고치는 동안
 *  │                                        │  (raised)  │     답이 화면에 남는다
 *  └───────────────────────────────────────┴────────────┘
 *  [진입 격자: 배당 캘린더 · 가계부]  [가정]  [푸터]
 * ```
 *
 * 🔴 **DOM 순서는 보유 종목 → 목표 달성 → 지금 받는 배당 그대로다**(사용자 확정 2026-07-29,
 * `test/portfolio/portfolioCardOrder.test.tsx` 가 잠근다). 2열은 **래퍼 두 개**(`MainColumn` ·
 * `RailColumn`)로 만들었고 `grid-area` 로 순서를 뒤집지 않는다 — 시각 순서와 낭독 순서가 갈리면
 * 그 테스트가 지키려던 것이 무의미해진다.
 *
 * ## 색면 예산 (실측: 히어로 + 푸터 = 2/2, 여유 0)
 * 이 폴더가 새로 만드는 면은 **전부 중립 토큰**이다(`surface` · `surfaceMuted` · `surfaceSunken`).
 * 위계는 색이 아니라 **레이아웃 · 크기 대비 · 밀도 · 형태**가 만든다. 🔴 여기에 `accentSubtle`
 * 같은 채도면을 얹지 마라 — `tools/dev/tintscan.mjs` 가 즉시 exit 1 이다.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## 관심사별 분할 지도 (구 `PortfolioPage.styled.ts` 833줄을 값 변경 없이 옮긴 것)
 *   layout.styled.ts    페이지 스택 · 라이브 리전 · 작업대 2열(MainColumn / sticky RailColumn)
 *   deck.styled.ts      데크 — 히어로 옆 다음 지급일 패널
 *   cards.styled.ts     카드 공통 — 기하 믹스인 · 요약/보유 카드 · 카드 머리(툴바)
 *   summary.styled.ts   요약 카드 안쪽 — hero 슬롯 · 지표 정의 목록 · 주의 줄 · 액션
 *   empty.styled.ts     빈 상태 보드(2열: 권유 + 근거·빠른 시작)
 *   skeleton.styled.ts  로딩 골격
 *   entry.styled.ts     진입 격자(배당 캘린더 · 가계부) · 실행 취소 줄
 *
 * ⚠ 파일 이름이 `*.styled.ts` 인 것은 **가드가 그 접미사로 파일을 고른다**. `shared/styles/geometry.test.ts`
 *   의 상단 리본 감사(`collectStyled`)와 `test/shared/copyTone.test.ts` 의 CSS 제외가 둘 다
 *   `/\.styled\.ts$/` 로 수집한다 — 접미사를 떼면 `EmptyBoard` 의 `topRail` 이 감사 대상에서
 *   조용히 빠지고(이 레포에서 세 번 재발한 결함이다) CSS 가 카피 스캔에 들어온다.
 *
 * ⚠ 가정 요약(세율 입력 + 계산 조건 + 목표 조건 그룹)의 스타일은
 *   `PortfolioPage/components/PortfolioAssumptions`로 옮겼다.
 *
 * ⚠ 각주 묶음은 공용 `components/common/PageFooter` 로 수렴했다(2026-07-31). 로컬로 복제하지 마라.
 */

export { PageStack, LiveRegion, Workbench, MainColumn, RailColumn } from './layout.styled';

export { Deck, NextPayoutPanel, NextPayoutLabel, NextPayoutValue, NextPayoutTickers } from './deck.styled';

export {
  SummaryCard,
  HoldingsCard,
  CardHead,
  CardHeadPlain,
  CardTitleGroup,
  CardTitle,
  CardTitleBadge,
  CountBadge,
  CardSubtitle
} from './cards.styled';

export {
  HeroSlot,
  FigureList,
  FigureRow,
  FigureTerm,
  FigureValue,
  FigureHint,
  CardDivider,
  NoteLine,
  ExcludedNote,
  ActionRow,
  ActionHint
} from './summary.styled';

export {
  EmptyBoard,
  EmptyLead,
  EmptyMascot,
  EmptyTitle,
  EmptyBody,
  EmptyAside,
  PreviewLabel,
  PreviewList,
  PreviewItem,
  PreviewMark,
  PreviewTerm,
  PreviewBody,
  QuickPickLabel,
  QuickPickList,
  QuickPickItem,
  QuickPickBlock
} from './empty.styled';

export { SkeletonBar, SkeletonList, SkeletonRow, SkeletonCell } from './skeleton.styled';

export { EntryGrid, EntryBody, EntryActions, EntryHint, UndoRow } from './entry.styled';
