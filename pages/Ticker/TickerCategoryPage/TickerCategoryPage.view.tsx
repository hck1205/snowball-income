import { Link } from 'react-router-dom';

import { SIMULATOR_PATH } from '@/shared/constants/routes';

import * as S from './TickerCategoryPage.styled';
import type { TickerCategoryViewProps } from './TickerCategoryPage.types';

/**
 * 카테고리 허브의 표시 전용 뷰.
 *
 * 서버 렌더러(`server/handlers/TickerHtml` 의 `injectCategoryBody`)와 **같은 순서·같은 문장**을 낸다 —
 * 제목 → 설명 → 주의 → 목록 → 시뮬레이터 CTA → 다른 묶음. 크롤러가 읽는 HTML 과 화면이 어긋나면
 * 색인된 내용과 실제 화면이 다른 말을 하게 된다.
 */
export default function TickerCategoryView({ label, meta, entries, siblings }: TickerCategoryViewProps) {
  return (
    <S.Wrapper>
      <S.Header>
        <S.Title>{meta.metaTitle}</S.Title>
        <S.Lede>{meta.description}</S.Lede>
        {/* 🔴 장점보다 먼저 온다. 이 자리가 초심자가 가장 먼저 닿는 곳이다. */}
        <S.Caution>{meta.caution}</S.Caution>
      </S.Header>

      <S.Section aria-labelledby="category-members">
        <S.SectionTitle id="category-members">
          {label} {entries.length}종
        </S.SectionTitle>
        <S.List>
          {entries.map((entry) => (
            <S.Item key={entry.slug}>
              <S.ItemLink to={`/ticker/${entry.slug}`}>
                <S.Ticker>{entry.ticker}</S.Ticker>
                <S.ItemTitle>{entry.metaTitle}</S.ItemTitle>
              </S.ItemLink>
              <S.Tagline>{entry.heroTagline}</S.Tagline>
            </S.Item>
          ))}
        </S.List>
      </S.Section>

      <S.Cta>
        <Link to={SIMULATOR_PATH}>이 묶음으로 배당 재투자 계산해 보기</Link>
      </S.Cta>

      {siblings.length > 0 && (
        <S.Section as="nav" aria-labelledby="category-siblings">
          <S.SectionTitle id="category-siblings">다른 묶음</S.SectionTitle>
          <S.SiblingList>
            {siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link to={sibling.to}>{sibling.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/ticker/all">전체 목록 보기</Link>
            </li>
          </S.SiblingList>
        </S.Section>
      )}
    </S.Wrapper>
  );
}
