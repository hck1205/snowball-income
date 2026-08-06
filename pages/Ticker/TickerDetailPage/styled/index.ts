/**
 * ── `/ticker/:name` 의 면 설계 ────────────────────────────────────────────────
 *
 * 이 화면은 **긴 서사 문서**다. 검색으로 처음 들어온 사람이 착지하는 지면이라 구조가 곧 신뢰다.
 * 그래서 두 축을 분리했다.
 *
 *  · **brand 면(고르는 면)** — 히어로 캡 · CTA · 관련 티커 카드. 색·큰 라운드·부상이 여기 산다.
 *  · **data 면(읽는 면)**   — 히어로 지표판 · 스탯 밴드 · 스펙 표 · 보유 종목 표 · FAQ.
 *    L1(선·점·귀) 외의 채도면을 두지 않는다. 숫자의 신뢰감을 지키는 자리다.
 *
 * ## 틴트 면 예산 (tintscan: 화면당 2면)
 * 개편 전 이 라우트는 **5면**이었다(실측 2026-08-03, 1280·390 동일):
 * 히어로 전면 틴트 1 + 섹션 `StatHighlight` 틴트 4. 상한의 2.5배다.
 * 개편 후는 정확히 둘이고, 그중 하나는 이 화면 것이 아니다.
 *   ① 히어로 캡 — **이 티커 자신의 색**으로 칠한 면(`--tk-active-bg` 면 + `--tk-text` 잉크).
 *      🔴 2026-08-03: 허브 카드 캡은 흰 캔버스 전환에서 중립 판이 됐다(`TickerHubPage/styled/`
 *      의 CardScope 주석). 그래서 두 지면을 잇는 것은 이제 **면색이 아니라 잉크와 리본**이다 —
 *      허브 카드의 심볼·캡 글자·6px 리본이 그대로 이 히어로의 심볼·캡 글자·6px 리본이 된다.
 *      이 면을 남긴 이유는 개수다: 여기서는 **한 페이지에 한 장**이라 반복이 없고, 면색과 잉크가
 *      같은 hue 라 서로 싸우지도 않는다(허브에서는 brand 민트 면 위에 티커 hue 잉크였다).
 *   ② 공용 `PageFooter`(브랜드 패널) — 페이지 공통으로 딸려오는 면.
 *
 * 🔴 그래서 **히어로 본체는 채도 면이 아니다.** 색은 상단 6px 티커 그라디언트 리본 · 캡 ·
 * 심볼 글자 · 레일(4px)이 말한다 — 넷 다 면 판정(폭 ≥180px · 높이 ≥8px · 비중립 배경)에 걸리지 않는다.
 * 새 색면을 하나라도 더 얹고 싶어지면 먼저 tintscan 을 돌려라.
 *
 * ## 파일 배치 (2026-08-04 분할 — 선언은 한 줄도 바뀌지 않았다)
 * 종전 `TickerDetailPage.styled.ts` 한 파일(1,504줄)을 관심사별로 나눴다. 화면을 위에서
 * 아래로 읽는 순서가 곧 파일 순서다.
 *
 *  · `metrics.ts`    — 여러 관심사가 나눠 쓰는 치수 상수(RAIL · RAIL_COLUMN · MEASURE)
 *  · `accent.ts`     — 티커 색을 CSS 변수로 주입하는 `AccentScope`(+ 워시 비율 `INK_WASH`)
 *  · `motion.ts`     — 리빌 이징·키프레임(히어로 시간 기반 / 섹션·목차 스크롤 기반)
 *  · `layout.ts`     — 빵부스러기 · 2단 레이아웃 · 본문 열
 *  · `hero.ts`       — 히어로 본체 · 캡 · 정체성 · 지표판
 *  · `cta.ts`        — 시뮬레이터로 가는 CTA 한 쌍
 *  · `toc.ts`        — 리더 레일(목차)
 *  · `section.ts`    — 번호 붙은 장 · 본문 타이포 · 스탯 밴드
 *  · `appendix.ts`   — 부록 껍데기(머리 · 제목 · 노트)
 *  · `spec.ts`       — 참고 지표 스펙 표 · 섹터 순위 · 각주
 *  · `holdings.ts`   — 상위 보유 종목 표
 *  · `faq.ts`        — FAQ 아코디언
 *  · `related.ts`    — 관련 티커 카드 · 빈 상태 · 격자 폭 상수
 *  · `disclaimer.ts` — 마무리 고지
 *
 * 🔴 `INK_WASH` · `REVEAL_EASE` · `revealIn` · `scrollRail` 은 폴더 **안에서만** 쓰는 조각이라
 * 여기서 다시 내보내지 않는다 — 분할 전에도 모듈 밖으로 나가지 않던 값들이고, 밖으로 새면
 * 대비 실측(accent.ts 주석)이 걸린 상수를 다른 화면이 임의로 참조하게 된다.
 */

export { AccentScope } from './accent';

export { HeroReveal } from './motion';

export { Breadcrumb, Content, Layout } from './layout';

export {
  Hero,
  HeroBody,
  HeroCap,
  HeroCapGlyph,
  HeroCapMeta,
  HeroMain,
  HeroMetric,
  HeroMetricCaption,
  HeroMetricLabel,
  HeroMetricLead,
  HeroMetricRow,
  HeroMetricRowLabel,
  HeroMetricRowValue,
  HeroMetricRows,
  HeroMetricValue,
  HeroTagline,
  TickerBadge,
  TickerEnglishName,
  TickerNames,
  TickerSymbol
} from './hero';

export { CtaRow, PrimaryCta, SecondaryCta } from './cta';

export {
  TocAside,
  TocButton,
  TocCount,
  TocCta,
  TocDivider,
  TocDot,
  TocHead,
  TocIndex,
  TocLabel,
  TocList
} from './toc';

export {
  BulletList,
  Lead,
  Paragraph,
  Section,
  SectionEyebrow,
  SectionHead,
  SectionHeading,
  StatBand,
  StatBandBody,
  StatBandCaption,
  StatBandLabel,
  StatBandValue
} from './section';

export { Appendix, AppendixHead, AppendixHeading, AppendixNote } from './appendix';

export {
  AsOfNote,
  SectorRank,
  SectorRankItem,
  SectorRankLabel,
  SectorRankNumber,
  SpecLabel,
  SpecRow,
  SpecTable,
  SpecValue
} from './spec';

export {
  HoldingBar,
  HoldingBarFill,
  HoldingName,
  HoldingRank,
  HoldingSymbol,
  HoldingWeight,
  HoldingWeightValue,
  HoldingsTable,
  SourceLine
} from './holdings';

export { FaqAnswer, FaqIndex, FaqItem, FaqList, FaqSummary } from './faq';

export {
  RELATED_MIN_WIDTH,
  RelatedEmpty,
  RelatedEmptyText,
  RelatedKorean,
  RelatedPendingBadge,
  RelatedPickCard,
  RelatedRelation,
  RelatedScope,
  RelatedStaticCard,
  RelatedSymbol
} from './related';

export { Disclaimer, DisclaimerText, UpdatedAt } from './disclaimer';
