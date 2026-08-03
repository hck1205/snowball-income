import { Trophy } from 'lucide-react';
import { DataTable, PageFooter, PageHero } from '@/components/common';
import { ICON } from '@/shared/styles';
import { DIVIDEND_LIST_COPY } from '../copy';
import type { DividendListSummary } from '../utils';
import type { DividendListHubViewProps } from './DividendListHubPage.types';
import {
  CardBody,
  CardCriterion,
  CardCta,
  CardGrid,
  CardMeta,
  CardTitle,
  ListCard,
  Section,
  SectionTitle,
  Sections
} from './DividendListHubPage.styled';

const copy = DIVIDEND_LIST_COPY.hub;
const pageCopy = DIVIDEND_LIST_COPY.page;

/**
 * 허브 — 세 목록의 **차이**를 한 화면에서 말한다.
 *
 * 카드와 표가 같은 사실을 두 번 그리는 것처럼 보이지만 역할이 다르다: 카드는 고르는 면(무엇을 열까),
 * 표는 읽는 면(기준·규모·기준일을 나란히 비교). 표가 없으면 "세 목록이 어떻게 다른가"에 답하려고
 * 세 페이지를 왕복해야 한다. 표는 공용 `DataTable` 을 그대로 쓴다 — 3행짜리 비교표라 정렬이 필요 없다.
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
        <Section>
          <SectionTitle>{copy.sectionTitle}</SectionTitle>
          <CardGrid>
            {summaries.map((summary) => {
              const listCopy = DIVIDEND_LIST_COPY.lists[summary.id];
              return (
                <ListCard key={summary.id} to={summary.path}>
                  <CardTitle>{listCopy.title}</CardTitle>
                  <CardCriterion>{listCopy.criterionLabel}</CardCriterion>
                  <CardBody>{listCopy.lede}</CardBody>
                  <CardMeta>
                    {`${summary.count}${pageCopy.countUnit} · ${pageCopy.asOfLabel} ${summary.asOf}`}
                  </CardMeta>
                  <CardCta>{copy.cta}</CardCta>
                </ListCard>
              );
            })}
          </CardGrid>
        </Section>

        <Section>
          <SectionTitle>{copy.tableHeading}</SectionTitle>
          <DataTable<DividendListSummary>
            caption={copy.tableCaption}
            columns={[
              {
                key: 'list',
                header: copy.columns.list,
                render: (row) => DIVIDEND_LIST_COPY.lists[row.id].title
              },
              {
                key: 'criterion',
                header: copy.columns.criterion,
                render: (row) => DIVIDEND_LIST_COPY.lists[row.id].criterionLabel
              },
              {
                key: 'count',
                header: copy.columns.count,
                render: (row) => `${row.count}${pageCopy.countUnit}`
              },
              { key: 'asOf', header: copy.columns.asOf, render: (row) => row.asOf }
            ]}
            rows={summaries}
          />
        </Section>
      </Sections>

      {/* 각주 + 사이트 공통 고지 = 공용 푸터 한 벌(목록 페이지와 같은 문장·같은 자리). */}
      <PageFooter notesTitle={pageCopy.footerNotesTitle} notes={pageCopy.footerNotes} />
    </>
  );
}
