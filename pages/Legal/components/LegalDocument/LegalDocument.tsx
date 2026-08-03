import { useEffect, useMemo } from 'react';
import { ArrowRight, ScrollText } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useReadingPosition } from '../../hooks';
import { splitLegalHeading } from '../../utils';
import { LegalClause } from '../LegalClause';
import { LegalExitNav } from '../LegalExitNav';
import { LegalToc } from '../LegalToc';
import type { LegalDocumentProps } from './LegalDocument.types';
import {
  Article,
  Clauses,
  DocumentLayout,
  HeroCrossLink,
  Masthead,
  MetaItem,
  MetaList,
  PageRoot,
  ReadingProgress,
  ReadingProgressFill
} from './LegalDocument.styled';

/**
 * 법무 고지문(개인정보처리방침·이용약관)을 그리는 **단 하나의 화면**.
 *
 * ## 이 화면이 하는 일은 하나다 — 읽히게 하는 것
 * 두 문서는 각각 조항이 열넷·열다섯이고 표가 여섯 개까지 들어간다. 그래서 판형이 화면의 전부다:
 * **목차 레일 · 조항 번호 기둥 · 읽기 진행 띠** 셋이 "지금 어디를 읽고 있는가"를 계속 말한다.
 * 각 부분의 근거는 그 컴포넌트의 주석에 있다(LegalToc · LegalClause · LegalExitNav).
 *
 * ## 색인을 막지 않는다
 * 404 와 달리 이 문서들은 `noindex` 를 걸지 않는다. 구글 OAuth 동의 화면 심사에 개인정보처리방침
 * URL 이 공개적으로 접근 가능해야 하고, 이용약관은 서비스의 조건을 공개하는 문서라 검색으로
 * 찾아지는 편이 맞다. 그래서 `pages/NotFound` 의 `useNoIndex` 같은 장치를 **일부러 넣지 않았다**.
 * 같은 이유로 목차 링크는 주소에 해시를 남기지 않는다(`pages/Legal/utils/scrollToClause.ts`).
 *
 * ## 문서 제목만 바꾼다
 * canonical / og:url 은 `router/routes.tsx` 의 `RootLayout` 이 라우트마다 이미 맞춘다
 * (`applySeoRuntimeMetadata`). 여기서는 브라우저 탭 제목만 마운트 동안 바꾸고 언마운트에서
 * 되돌린다 — 404 가 쓰는 것과 같은 방식이다.
 *
 * ## 🔴 공용 푸터를 둔다 (2026-08-04, 종전 판단을 뒤집었다)
 * 종전에는 두지 않았다. 이유는 *"공용 `PageFooter` 가 이 두 문서로 가는 링크를 갖고 있어서,
 * 문서 안에 그리면 지금 보고 있는 페이지로 가는 링크가 자기 아래에 생긴다"* 였다.
 * 그 지적 자체는 지금도 맞다 — 다만 **대가가 더 컸다.** 이 두 화면만 페이지가 끝나는 표식 없이
 * 끊기고, `contentinfo` 랜드마크도 없었다(실측: 21개 라우트 중 footer 0개인 곳 셋 중 둘).
 */
export default function LegalDocument({ document: model, related }: LegalDocumentProps) {
  useEffect(() => {
    const previous = window.document.title;
    window.document.title = model.documentTitle;

    return () => {
      window.document.title = previous;
    };
  }, [model.documentTitle]);

  /** 목차 항목 = 조항 제목을 번호/제목으로 가른 것. 제목 문자열은 절의 접근성 이름이라 손대지 않는다. */
  const tocEntries = useMemo(
    () =>
      model.sections.map((section) => {
        const { ordinal, label } = splitLegalHeading(section.heading);

        return { id: section.id, ordinal, label };
      }),
    [model.sections]
  );

  const sectionIds = useMemo(() => tocEntries.map((entry) => entry.id), [tocEntries]);
  const { progress, activeId } = useReadingPosition(sectionIds);

  return (
    <TickerPageShell>
      <ReadingProgress aria-hidden>
        <ReadingProgressFill $ratio={progress} />
      </ReadingProgress>

      <PageRoot>
        <DocumentLayout>
          <Masthead>
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
              actions={
                related ? (
                  <HeroCrossLink to={related.to}>
                    {related.title}
                    <ArrowRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                  </HeroCrossLink>
                ) : undefined
              }
            />
          </Masthead>

          <LegalToc entries={tocEntries} activeId={activeId} />

          <Article>
            <Clauses>
              {model.sections.map((section, index) => (
                <LegalClause key={section.id} section={section} index={index} />
              ))}
            </Clauses>

            <LegalExitNav related={related} firstClauseId={sectionIds[0] ?? null} />
          </Article>
        </DocumentLayout>

        {/* 자기 자신을 가리키는 링크가 푸터에 하나 생기지만, 그 값보다 "페이지가 여기서 끝난다"는
            표식과 contentinfo 랜드마크가 크다(머리말 참고). 문서 안 이동은 위 LegalExitNav 가 맡는다. */}
        <PageFooter />
      </PageRoot>
    </TickerPageShell>
  );
}
