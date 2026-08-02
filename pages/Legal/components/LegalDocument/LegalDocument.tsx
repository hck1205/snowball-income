import { useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import type { LegalBlock, LegalDocumentProps } from './LegalDocument.types';
import {
  DefinitionDescription,
  DefinitionList,
  DefinitionRow,
  DefinitionTerm,
  List,
  ListItem,
  MetaItem,
  MetaList,
  PageStack,
  Paragraph,
  Section,
  SectionHeading,
  Table,
  TableCaption,
  TableCell,
  TableHeaderCell,
  TableScroller
} from './LegalDocument.styled';

/**
 * 법무 고지문(개인정보처리방침·이용약관)을 그리는 **단 하나의 화면**.
 *
 * ## 색인을 막지 않는다
 * 404 와 달리 이 문서들은 `noindex` 를 걸지 않는다. 구글 OAuth 동의 화면 심사에 개인정보처리방침
 * URL 이 공개적으로 접근 가능해야 하고, 이용약관은 서비스의 조건을 공개하는 문서라 검색으로
 * 찾아지는 편이 맞다. 그래서 `pages/NotFound` 의 `useNoIndex` 같은 장치를 **일부러 넣지 않았다**.
 *
 * ## 문서 제목만 바꾼다
 * canonical / og:url 은 `router/routes.tsx` 의 `RootLayout` 이 라우트마다 이미 맞춘다
 * (`applySeoRuntimeMetadata`). 여기서는 브라우저 탭 제목만 마운트 동안 바꾸고 언마운트에서
 * 되돌린다 — 404 가 쓰는 것과 같은 방식이다.
 *
 * ## 푸터를 두지 않는다
 * 공용 `PageFooter` 는 이 두 문서로 가는 **링크**를 갖고 있다. 문서 안에 다시 그 푸터를 그리면
 * 지금 보고 있는 페이지로 가는 링크가 자기 아래에 생긴다. 대신 문서 마지막 절이 문의처를 말한다.
 */
function renderBlock(block: LegalBlock, key: number, sectionId: string) {
  switch (block.kind) {
    case 'paragraph':
      return <Paragraph key={key}>{block.text}</Paragraph>;

    case 'list':
      return (
        <List key={key}>
          {block.items.map((item) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </List>
      );

    case 'definitions':
      return (
        <DefinitionList key={key}>
          {block.items.map((item) => (
            // dl 의 dt/dd 는 형제여야 하므로 줄 묶음은 div 로 감싼다(HTML 5.2 이후 허용).
            <DefinitionRow key={item.term}>
              <DefinitionTerm>{item.term}</DefinitionTerm>
              <DefinitionDescription>{item.description}</DefinitionDescription>
            </DefinitionRow>
          ))}
        </DefinitionList>
      );

    case 'table': {
      /* 절 id 는 문서 안에서 고유하고(LegalDocument.types.ts) 블록 순서는 그 절 안에서 고유하다. */
      const captionId = `${sectionId}-table-${key}`;

      return (
        /*
         * 가로 스크롤 영역은 키보드로도 움직일 수 있어야 한다(표 안에 포커스 가능한 자손이 없어
         * `tabIndex` 가 없으면 잘린 열에 닿을 방법이 아예 없다 — WCAG 2.1.1).
         *
         * 🔴 이름은 `aria-label` 이 아니라 `aria-labelledby` 로 `<caption>` 을 가리킨다. 같은 문자열을
         * 양쪽에 적으면 스크린리더가 영역 이름으로 한 번, 표 캡션으로 또 한 번 **같은 제목을 두 번**
         * 읽는다. 가리키면 하나의 문자열이 두 역할을 겸한다.
         *
         * 역할은 `group` 이 아니라 `region` 이다 — 이 앱의 가로 스크롤 표 처방을 하나로 통일했고
         * (형제: pages/DividendCalendar/.../ScheduleLegendTable.tsx), 고른 쪽이 `region` 인 이유는
         * ①`group` 은 랜드마크가 아니라 랜드마크 탐색(NVDA `D`)으로 도달할 수 없는데 이 상자는
         * "찾아가서 밀어야" 내용이 보이는 자리이고 ②이 화면은 이미 절마다 `<section aria-labelledby>`
         * = 랜드마크라, 표만 비랜드마크로 두면 같은 문서 안에서 규칙이 두 벌이 된다.
         */
        <TableScroller key={key} tabIndex={0} role="region" aria-labelledby={captionId}>
          <Table>
            <TableCaption id={captionId}>{block.caption}</TableCaption>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <TableHeaderCell key={column} scope="col">
                    {column}
                  </TableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, cellIndex) => (
                    // 같은 행 안에서 같은 문자열이 반복될 수 있어 열 위치를 키에 넣는다(열 순서는 고정이다).
                    // eslint-disable-next-line react/no-array-index-key
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroller>
      );
    }

    default:
      return null;
  }
}

export default function LegalDocument({ document: model }: LegalDocumentProps) {
  useEffect(() => {
    const previous = window.document.title;
    window.document.title = model.documentTitle;

    return () => {
      window.document.title = previous;
    };
  }, [model.documentTitle]);

  return (
    <TickerPageShell>
      <PageStack>
        {/* 헤더 워드마크가 h1 이 아닌 화면이라 문서 제목을 h1 로 올린다(404·포트폴리오와 같은 규칙). */}
        <PageHero
          icon={<ScrollText size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
          title={model.title}
          titleAs="h1"
          lede={model.lede}
          meta={
            <MetaList>
              {model.meta.map((line) => (
                <MetaItem key={line}>{line}</MetaItem>
              ))}
            </MetaList>
          }
        />

        {model.sections.map((section) => (
          <Section key={section.id} aria-labelledby={section.id}>
            <SectionHeading id={section.id}>{section.heading}</SectionHeading>
            {section.blocks.map((block, index) => renderBlock(block, index, section.id))}
          </Section>
        ))}
      </PageStack>
    </TickerPageShell>
  );
}
