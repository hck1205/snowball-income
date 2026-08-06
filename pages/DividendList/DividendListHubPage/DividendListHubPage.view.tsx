import { ArrowRight, Trophy } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import { ICON } from '@/shared/styles';
import type { DividendListId } from '@/shared/constants/dividendLists';
import { DIVIDEND_LIST_COPY } from '../copy';
import { DIVIDEND_LIST_MASCOT } from '../utils';
import type { DividendListHubViewProps } from './DividendListHubPage.types';
import {
  CompareCell,
  CompareHeadArt,
  CompareHeadCell,
  CompareHeadInner,
  CompareLink,
  CompareNumber,
  CompareRowLabel,
  CompareTable,
  CompareWrap,
  ConceptBody,
  ConceptPanel,
  ConceptTitle,
  RelationNote,
  Section,
  SectionLede,
  SectionTitle,
  Sections,
  Spotlight,
  SpotlightArt,
  SpotlightBadge,
  SpotlightBody,
  SpotlightCta,
  SpotlightFoot,
  SpotlightHeadline,
  SpotlightMeta,
  SpotlightPoint,
  SpotlightPoints,
  SpotlightQuestion,
  SpotlightTitle
} from './DividendListHubPage.styled';

const copy = DIVIDEND_LIST_COPY.hub;
const pageCopy = DIVIDEND_LIST_COPY.page;

/**
 * 그림이 오른쪽에 서는 목록.
 *
 * 🔴 사용자 지시(2026-08-05): **배당킹 왼쪽 · 배당귀족 오른쪽 · 배당챔피언 왼쪽.** 좌·우·좌로
 * 교차해야 스크롤에 리듬이 생긴다 — 셋이 같은 쪽이면 세 블록이 한 덩어리로 읽힌다.
 * ⚠ 목록 **페이지**(`DividendListPage`)의 좌우 배치와는 다른 값이다. 그쪽은 화면마다 "바뀌었다"는
 *   신호를 주려고 정한 것이고, 여기는 한 화면 안의 리듬이라 기준이 다르다. 맞추려 하지 마라.
 */
const ART_ON_RIGHT: ReadonlySet<DividendListId> = new Set<DividendListId>(['aristocrats']);

/** S&P 500 소속을 요구하는 목록. 비교 매트릭스의 한 행이 이 사실만 본다. */
const REQUIRES_INDEX: ReadonlySet<DividendListId> = new Set<DividendListId>(['aristocrats']);

/**
 * 허브 — **랜딩형 지면**(2026-08-05 전면 개편, 사용자 지시).
 *
 * ## 이 화면이 답해야 하는 질문
 * "배당킹·배당귀족·배당챔피언이 각각 뭐고, 나는 어느 것을 열어야 하는가."
 * 종전 허브(카드 3장 + 4열 표)는 그 답을 갖고 있지 않았다 — 카드에는 한 줄 설명뿐이었고 표는
 * 글자만 있어 읽히지 않았다. 그래서 순서를 **개념 → 세 목록 → 관계 → 비교**로 다시 세웠다.
 *
 * ## 구조 규율
 * 🔴 개념 블록이 **맨 위**다. 이 화면에 검색으로 처음 들어온 사람은 세 이름의 차이는커녕
 *   "연속 증배"라는 말 자체를 모른다.
 * 🔴 세 소개 블록은 **같은 골격**(칩 · 제목 · 한 줄 성격 · 근거 3줄 · 질문 · 종목 수 · 열기)을 쓴다.
 *   블록마다 항목이 다르면 비교가 되지 않는다 — 이 지면의 목적이 비교다.
 * ⚠ 종목 수·기준일은 **데이터에서 온 값**(`summaries`)이다. 카피에 숫자를 적지 마라.
 */
export default function DividendListHubView({ viewModel }: DividendListHubViewProps) {
  const { summaries } = viewModel;

  return (
    <>
      <PageHero
        icon={<Trophy size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        notice={copy.notice}
      />

      <Sections>
        {/* ── 개념: 목록 이름을 모르는 사람을 위한 첫 블록 ─────────────────── */}
        <ConceptPanel aria-labelledby="dividend-list-concept">
          <ConceptTitle id="dividend-list-concept">{copy.intro.heading}</ConceptTitle>
          {/* ⚠ 문자열을 그대로 그린다 — HTML 주입(dangerouslySetInnerHTML)은 쓰지 않는다.
              강조가 필요하면 문장을 나누거나 스타일이 문단 전체를 다루게 한다. */}
          {copy.intro.paragraphs.map((paragraph) => (
            <ConceptBody key={paragraph.slice(0, 16)}>{paragraph}</ConceptBody>
          ))}
        </ConceptPanel>

        {/* ── 세 목록: 그림과 글이 좌우로 마주 보는 지그재그 ───────────────── */}
        <Section>
          <SectionTitle>{copy.sectionTitle}</SectionTitle>

          {summaries.map((summary) => {
            const listCopy = DIVIDEND_LIST_COPY.lists[summary.id];
            const art = DIVIDEND_LIST_MASCOT[summary.id];
            const flip = ART_ON_RIGHT.has(summary.id);

            const artNode = (
              <SpotlightArt
                src={art.src}
                alt=""
                width={art.width}
                height={art.height}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            );

            const bodyNode = (
              <SpotlightBody>
                <SpotlightBadge>{listCopy.criterionLabel}</SpotlightBadge>
                <SpotlightTitle>{listCopy.title}</SpotlightTitle>
                <SpotlightHeadline>{listCopy.hub.headline}</SpotlightHeadline>
                <SpotlightPoints>
                  {listCopy.hub.points.map((point) => (
                    <SpotlightPoint key={point.slice(0, 16)}>{point}</SpotlightPoint>
                  ))}
                </SpotlightPoints>
                <SpotlightQuestion>{listCopy.hub.question}</SpotlightQuestion>
                <SpotlightFoot>
                  {/* 접근명에 목록 이름을 넣는다 — 화면 글자는 짧게, 이름은 분명하게(copy.ctaFor 주석). */}
                  <SpotlightCta to={summary.path} aria-label={copy.ctaFor(listCopy.title)}>
                    {copy.cta}
                    <ArrowRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                  </SpotlightCta>
                  <SpotlightMeta>
                    {`${summary.count}${pageCopy.countUnit} · ${pageCopy.asOfLabel} ${summary.asOf}`}
                  </SpotlightMeta>
                </SpotlightFoot>
              </SpotlightBody>
            );

            /* 🔴 DOM 순서가 곧 낭독 순서다 — 좁은 폭에서 한 열이 되면 위에서부터 이 순서로 읽힌다.
               넓은 폭의 좌우는 grid-template-columns 가 정한다(order 로 뒤집지 않는다). */
            return (
              <Spotlight key={summary.id} $flip={flip}>
                {flip ? bodyNode : artNode}
                {flip ? artNode : bodyNode}
              </Spotlight>
            );
          })}

          <RelationNote>{copy.relation}</RelationNote>
        </Section>

        {/* ── 비교: 같은 질문에 대한 세 답을 가로로 훑는다 ──────────────────── */}
        <Section>
          <SectionTitle>{copy.tableHeading}</SectionTitle>
          <SectionLede>{copy.tableCaption}</SectionLede>

          <CompareWrap>
            {/* ⚠ caption 을 두지 않는다 — 바로 위 제목·리드가 같은 말을 하고 있어서 caption 을 더하면
                보조기술이 표 이름을 두 번 읽는다. 행·열 머리(scope)가 표 구조를 이미 말한다. */}
            <CompareTable>
              <thead>
                <tr>
                  <CompareHeadCell scope="col" />
                  {summaries.map((summary) => {
                    const art = DIVIDEND_LIST_MASCOT[summary.id];
                    return (
                      <CompareHeadCell key={summary.id} scope="col">
                        <CompareHeadInner>
                          <CompareHeadArt
                            src={art.src}
                            alt=""
                            width={art.width}
                            height={art.height}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                          {DIVIDEND_LIST_COPY.lists[summary.id].title}
                        </CompareHeadInner>
                      </CompareHeadCell>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <CompareRowLabel scope="row">{copy.compareRows.streak}</CompareRowLabel>
                  {summaries.map((summary) => (
                    <CompareCell key={summary.id}>
                      {DIVIDEND_LIST_COPY.lists[summary.id].criterionLabel}
                    </CompareCell>
                  ))}
                </tr>
                <tr>
                  <CompareRowLabel scope="row">{copy.compareRows.index}</CompareRowLabel>
                  {summaries.map((summary) => (
                    <CompareCell key={summary.id}>
                      {REQUIRES_INDEX.has(summary.id) ? copy.compareIndexYes : copy.compareIndexNo}
                    </CompareCell>
                  ))}
                </tr>
                <tr>
                  <CompareRowLabel scope="row">{copy.compareRows.count}</CompareRowLabel>
                  {summaries.map((summary) => (
                    <CompareCell key={summary.id}>
                      <CompareNumber>{summary.count}</CompareNumber>
                      {pageCopy.countUnit}
                    </CompareCell>
                  ))}
                </tr>
                <tr>
                  <CompareRowLabel scope="row">{copy.compareRows.asOf}</CompareRowLabel>
                  {summaries.map((summary) => (
                    <CompareCell key={summary.id}>{summary.asOf}</CompareCell>
                  ))}
                </tr>
                <tr>
                  {/* 마지막 줄은 값이 아니라 **행동**이다 — 비교를 끝낸 자리에서 바로 열 수 있게 한다. */}
                  <CompareRowLabel scope="row" aria-hidden />
                  {summaries.map((summary) => (
                    <CompareCell key={summary.id}>
                      <CompareLink
                        to={summary.path}
                        aria-label={copy.ctaFor(DIVIDEND_LIST_COPY.lists[summary.id].title)}
                      >
                        {copy.cta}
                      </CompareLink>
                    </CompareCell>
                  ))}
                </tr>
              </tbody>
            </CompareTable>
          </CompareWrap>
        </Section>
      </Sections>

      {/* 각주 + 사이트 공통 고지 = 공용 푸터 한 벌(목록 페이지와 같은 문장·같은 자리). */}
      <PageFooter notesTitle={pageCopy.footerNotesTitle} notes={pageCopy.footerNotes} />
    </>
  );
}
