import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Fragment, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, PageFooter, PageHero } from '@/components/common';
import { guidePath } from '@/shared/constants/guides';
import type { GuideSection as GuideSectionContent } from '@/shared/constants/guides';
import { useRevealOnScroll, useScrollSpy } from '@/shared/hooks';
import { ICON } from '@/shared/styles';
import type { GuideViewProps } from './GuidePage.types';
import { FAQ_SECTION_ID, NEXT_SECTION_ID, chapterIndex } from './GuidePage.utils';
import {
  Breadcrumb,
  Caution,
  Content,
  CtaActions,
  CtaNote,
  CtaPanel,
  CtaTitle,
  FaqAnswer,
  FaqIndex,
  FaqItem,
  FaqList,
  FaqSummary,
  HeroCta,
  Layout,
  Lead,
  NextAction,
  NextBody,
  NextCard,
  NextEyebrow,
  NextTitle,
  Paragraph,
  RelatedBody,
  RelatedCard,
  RelatedGrid,
  RelatedHead,
  RelatedLede,
  RelatedTitle,
  Section,
  SectionEyebrow,
  SectionHead,
  SectionHeading,
  SectionIndex,
  StepBadge,
  Table,
  TableCaption,
  TableCard,
  TableNote,
  TableScroll,
  Td,
  Th,
  TocAside,
  TocButton,
  TocCount,
  TocCta,
  TocDivider,
  TocDot,
  TocHead,
  TocIndex,
  TocLabel,
  TocList,
  TopBar
} from './styled';

/**
 * 도구로 가는 문에 붙는 **한 가지 문구**.
 *
 * 🔴 히어로는 글마다 다른 `cta.label`("월 배당 목표 도달 시점 계산해 보기")을 쓰고, 목차 레일과
 * 마무리 버튼은 이 한 문구를 쓴다. 세 자리가 제각각이면 같은 목적지가 세 가지 이름을 갖게 되고,
 * 마무리 패널에서는 제목과 버튼이 **같은 문장을 두 번** 말하게 된다(2026-08-06 실측에서 그랬다).
 */
const SIMULATOR_ACTION = '시뮬레이터로 계산';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 본문 한 장. 뷰포트에 들어오면 등장한다(reduced-motion 이면 즉시 표시).
 *
 * 장 머리는 **번호 배지 + 짧은 이름 + 헤어라인**이다 — 목차의 번호와 같은 값이라, 레일을 보지
 * 않아도 문서 어디쯤인지가 본문 안에서 읽힌다.
 */
function GuideChapter({
  section,
  index,
  numericColumns
}: {
  section: GuideSectionContent;
  index: string;
  numericColumns: readonly boolean[];
}) {
  const { ref, shown } = useRevealOnScroll<HTMLElement>();
  const [lead, ...rest] = section.paragraphs;
  const table = section.table;

  return (
    <Section
      id={section.id}
      ref={ref}
      $shown={shown}
      tabIndex={-1}
      aria-labelledby={`${section.id}-heading`}
    >
      <SectionHead>
        <SectionEyebrow>
          <SectionIndex aria-hidden>{index}</SectionIndex>
          <span>{section.navLabel}</span>
        </SectionEyebrow>
        <SectionHeading id={`${section.id}-heading`}>{section.heading}</SectionHeading>
      </SectionHead>

      {lead ? <Lead>{lead}</Lead> : null}
      {rest.map((paragraph) => (
        <Paragraph key={paragraph.slice(0, 24)}>{paragraph}</Paragraph>
      ))}

      {table ? (
        <TableCard>
          <TableCaption>{table.caption}</TableCaption>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  {table.columns.map((column, order) => (
                    <Th
                      key={column || `col-${order}`}
                      scope="col"
                      $numeric={numericColumns[order] ?? false}
                      $lead={order === 0}
                    >
                      {column}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell, order) => (
                      <Td
                        key={`${row.join('|')}-${order}`}
                        $numeric={numericColumns[order] ?? false}
                        $lead={order === 0}
                      >
                        {cell}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
          {/* 🔴 전제 없는 숫자를 남기지 않는다 — 표가 무엇을 가정했는지 이 줄이 말한다. */}
          {table.note ? <TableNote>{table.note}</TableNote> : null}
        </TableCard>
      ) : null}

      {section.caution ? <Caution>{section.caution}</Caution> : null}
    </Section>
  );
}

/**
 * `/guide/:slug` 의 조판.
 *
 * ## 무엇이 바뀌었나(2026-08-06 리워크)
 * 종전에는 제목·문단·표·FAQ 가 세로로만 이어졌다. 사용자 지적은 "다른 페이지만큼 정돈되지 않았다,
 * 통일성 있게 다른 페이지에 맞춰라" 였고, 맞출 기준은 이 레포에서 가장 정돈된 긴 글 화면인
 * **티커 상세**(`pages/Ticker/TickerDetailPage`)다. 그 지면에서 가져온 것 넷:
 *   ① 페이지 레벨 내비(뒤로 가기 + 빵부스러기)를 히어로 **밖** 첫 줄에
 *   ② 목차 레일(스크롤 스파이·상시 CTA) — 데스크톱 사이드바 / 좁은 폭 sticky 칩바
 *   ③ 번호 붙은 장 + 등장 연출
 *   ④ 표·FAQ·마무리를 **카드**로 세워 문단 흐름과 구분
 *
 * ⚠ 크롤러가 읽는 HTML 은 `server/handlers/GuideHtml` 이 따로 그린다 — **같은 콘텐츠**를 읽으므로
 *   문장은 갈릴 수 없지만, 조판은 이 파일만의 것이다(그쪽에 목차·연출은 없다).
 */
export default function GuideView({ viewModel }: GuideViewProps) {
  const { guide, toc, step, readingMinutes, next, others, numericColumns } = viewModel;
  const navigate = useNavigate();

  /* 🔴 안정된 참조여야 한다 — 매 렌더 새 배열이면 스파이가 관찰자를 매번 다시 만든다. */
  const tocIds = useMemo(() => toc.map((item) => item.id), [toc]);
  const activeId = useScrollSpy(tocIds);

  const onTocClick = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    // 키보드 사용자를 위해 포커스도 옮긴다 — 스크롤만으로는 포커스가 따라가지 않는다.
    target.focus({ preventScroll: true });
  }, []);

  /*
   * 🔴 가이드는 **검색으로 바로 들어오는** 지면이다. 그 경우 히스토리에 앞 항목이 없어
   * `navigate(-1)` 은 사이트 밖으로 나가거나 아무 일도 일어나지 않는다. 그래서 앱 안에서 온
   * 경우에만 되돌아가고, 아니면 홈으로 보낸다(react-router 가 history state 에 idx 를 심는다).
   */
  const onBack = useCallback(() => {
    const state = typeof window === 'undefined' ? null : (window.history.state as { idx?: number } | null);
    if ((state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/');
  }, [navigate]);

  const metaLine = [
    step ? `시작 경로 ${step.current} / ${step.total}` : null,
    `본문 ${guide.sections.length}장`,
    `약 ${readingMinutes}분`
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {/* 🔴 히어로 **밖** 첫 줄 — 착지 직후 첫 시선은 경로가 아니라 제목에 닿아야 한다. */}
      <TopBar>
        <Button variant="secondary" size="sm" startIcon={<ArrowLeft size={16} strokeWidth={ICON.stroke} />} onClick={onBack}>
          뒤로
        </Button>
        <Breadcrumb aria-label="위치">
          <Link to="/">홈</Link>
          <span aria-hidden="true">/</span>
          <span>가이드</span>
        </Breadcrumb>
      </TopBar>

      <PageHero
        icon={<BookOpen size={ICON.lg} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
        title={guide.title}
        titleAs="h1"
        lede={guide.lede}
        meta={metaLine}
        actions={
          <HeroCta to={guide.cta.to}>
            {guide.cta.label}
            <ArrowRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
          </HeroCta>
        }
      />

      <Layout>
        <TocAside aria-label="이 페이지 목차">
          <TocHead>
            목차
            <TocCount>{guide.sections.length}장</TocCount>
          </TocHead>
          <TocList>
            {toc.map((item, order) => {
              const active = activeId === item.id;
              const startsAppendix = !item.index && Boolean(toc[order - 1]?.index);

              return (
                <Fragment key={item.id}>
                  {startsAppendix ? <TocDivider aria-hidden /> : null}
                  <li>
                    <TocButton
                      type="button"
                      $active={active}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => onTocClick(item.id)}
                    >
                      {/* 🔴 번호는 aria-hidden 이다 — 접근 가능한 이름은 라벨 하나여야 목록 훑기가 빠르다. */}
                      {item.index ? (
                        <TocIndex $active={active} aria-hidden>
                          {item.index}
                        </TocIndex>
                      ) : (
                        <TocDot $active={active} aria-hidden />
                      )}
                      <TocLabel>{item.label}</TocLabel>
                    </TocButton>
                  </li>
                </Fragment>
              );
            })}
          </TocList>
          <TocCta to={guide.cta.to}>
            {SIMULATOR_ACTION}
            <ArrowRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
          </TocCta>
        </TocAside>

        <Content>
          {guide.sections.map((section, order) => (
            <GuideChapter
              key={section.id}
              section={section}
              index={chapterIndex(order)}
              numericColumns={numericColumns[section.id] ?? []}
            />
          ))}

          <Section id={FAQ_SECTION_ID} tabIndex={-1} $shown aria-labelledby="faq-heading">
            <SectionHead>
              <SectionEyebrow>
                <span>자주 묻는 질문</span>
              </SectionEyebrow>
              <SectionHeading id="faq-heading">이 주제에서 가장 많이 묻는 것</SectionHeading>
            </SectionHead>
            <FaqList>
              {guide.faqs.map((faq, order) => (
                <FaqItem key={faq.question}>
                  <FaqSummary>
                    <FaqIndex aria-hidden>Q{order + 1}</FaqIndex>
                    <span>{faq.question}</span>
                  </FaqSummary>
                  <FaqAnswer>{faq.answer}</FaqAnswer>
                </FaqItem>
              ))}
            </FaqList>
          </Section>

          <Section id={NEXT_SECTION_ID} tabIndex={-1} $shown aria-labelledby="next-heading">
            <SectionHead>
              <SectionEyebrow>
                <span>다음 걸음</span>
              </SectionEyebrow>
              <SectionHeading id="next-heading">여기까지 읽었다면</SectionHeading>
            </SectionHead>

            <CtaPanel>
              <CtaTitle>{guide.cta.label}</CtaTitle>
              <CtaNote>{guide.cta.note}</CtaNote>
              <CtaActions>
                <HeroCta to={guide.cta.to}>
                  {SIMULATOR_ACTION}
                  <ArrowRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
                </HeroCta>
              </CtaActions>
            </CtaPanel>

            {/* 시작 경로의 다음 글은 나머지와 **같은 크기로 늘어놓지 않는다** — 순서가 사라진다. */}
            {next ? (
              <NextCard to={guidePath(next.slug)}>
                <StepBadge aria-hidden>{next.step ?? '→'}</StepBadge>
                <NextBody>
                  <NextEyebrow>다음 글</NextEyebrow>
                  <NextTitle>{next.title}</NextTitle>
                </NextBody>
                <NextAction>
                  읽기
                  <ArrowRight size={14} strokeWidth={ICON.stroke} aria-hidden />
                </NextAction>
              </NextCard>
            ) : null}

            {others.length > 0 ? (
              <>
                <RelatedHead>다른 가이드</RelatedHead>
                <RelatedGrid>
                  {others.map((entry) => (
                    <li key={entry.slug}>
                      <RelatedCard to={guidePath(entry.slug)}>
                        <StepBadge aria-hidden>{entry.step ?? '·'}</StepBadge>
                        <RelatedBody>
                          <RelatedTitle>{entry.title}</RelatedTitle>
                          <RelatedLede>{entry.lede}</RelatedLede>
                        </RelatedBody>
                      </RelatedCard>
                    </li>
                  ))}
                </RelatedGrid>
              </>
            ) : null}
          </Section>
        </Content>
      </Layout>

      <PageFooter />
    </>
  );
}
