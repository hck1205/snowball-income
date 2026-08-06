/**
 * `/guide/:slug` 조판의 배럴.
 *
 * 관심사별로 쪼개 둔다 — 한 파일에 몰면 목차·표·FAQ·마무리가 서로의 맥락 없이 섞여 어느 규칙이
 * 어디에 걸린 것인지 읽을 수 없게 된다(티커 상세 `styled/` 와 같은 배치).
 */
export { MEASURE, RAIL, RAIL_COLUMN } from './metrics';

export { Breadcrumb, Content, HeroCta, Layout, TopBar } from './layout';

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
  Caution,
  Lead,
  Paragraph,
  Section,
  SectionEyebrow,
  SectionHead,
  SectionHeading,
  SectionIndex
} from './section';

export { Table, TableCaption, TableCard, TableNote, TableScroll, Td, Th } from './table';

export { FaqAnswer, FaqIndex, FaqItem, FaqList, FaqSummary } from './faq';

export {
  CtaActions,
  CtaNote,
  CtaPanel,
  CtaTitle,
  NextAction,
  NextBody,
  NextCard,
  NextEyebrow,
  NextTitle,
  RelatedBody,
  RelatedCard,
  RelatedGrid,
  RelatedHead,
  RelatedLede,
  RelatedTitle,
  StepBadge
} from './next';
