import type { MouseEvent } from 'react';
import { PickCard, PickCardGrid } from '@/components/common';
import type { RelatedLinksProps } from './RelatedLinks.types';

/**
 * 캘린더 하단 "함께 보면 좋은 화면" 카드 묶음(2026-11-07).
 *
 * ## 왜
 * 이 페이지는 검색 유입 1위 랜딩인데 사람이 보는 화면에는 다른 화면으로 가는 길이 없었다
 * (28일 37세션 전부 신규, 세션당 1.9페이지). 크롤러용 HTML 에는 사이트 내비를 깔았지만(#299),
 * 그것은 JS 가 돌면 사라진다 — 사람에게는 이 카드가 그 길이다.
 *
 * ## 계측을 `nav` 에서 받는 이유
 * `PickCard` 의 링크 모드(`to`)는 `onClick` 을 따로 받지 않는다(세 갈래 중 하나만 — PickCard.types).
 * 그래서 감싼 `nav` 가 **캡처 단계**에서 눌린 링크의 경로를 읽는다. 이동은 막지 않는다.
 */
const RelatedLinks = ({ label, items, onNavigate }: RelatedLinksProps) => {
  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!onNavigate) return;
    const anchor = (event.target as Element | null)?.closest?.('a');
    const to = anchor?.getAttribute('href');
    if (to && items.some((item) => item.to === to)) onNavigate(to);
  };

  return (
    <nav aria-label={label} onClickCapture={handleClickCapture}>
      <PickCardGrid as="ul" minColumnWidth="220px">
        {items.map((item) => (
          <PickCard
            key={item.to}
            as="li"
            /* 섹션 제목(h2) 아래 카드라 h3. */
            titleAs="h3"
            title={item.title}
            to={item.to}
            /* 글리프를 제목 줄에 세운다 — 모바일에서 넷이 세로로 쌓일 때 카드마다 한 줄씩 짧아진다. */
            cap={{ kind: 'rail', axis: 'brand', glyph: item.glyph, glyphInline: true }}
          >
            {item.description}
          </PickCard>
        ))}
      </PickCardGrid>
    </nav>
  );
};

export default RelatedLinks;
