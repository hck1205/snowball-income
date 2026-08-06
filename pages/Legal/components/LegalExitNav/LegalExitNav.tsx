import { ArrowUp, FileText, House } from 'lucide-react';
import { BrandGlyph } from '@/components/common';
import { scrollToClause } from '../../utils';
import type { LegalExitNavProps } from './LegalExitNav.types';
import {
  ExitGlyph,
  ExitHead,
  ExitHeading,
  ExitLede,
  ExitList,
  ExitRoot,
  ExitTileButton,
  ExitTileKicker,
  ExitTileLink,
  ExitTileSummary,
  ExitTileTitle
} from './LegalExitNav.styled';

/**
 * 문서 끝의 이동 안내.
 *
 * 이 두 화면은 공용 `PageFooter` 를 그리지 않는다 — 그 푸터가 바로 `/privacy`·`/terms` 로 가는
 * 링크를 갖고 있어서, 문서 안에 다시 그리면 지금 보고 있는 페이지로 가는 링크가 자기 아래에 생긴다.
 * 그 결정은 그대로 두되, **다 읽은 사람에게 나갈 길이 헤더뿐이던 문제**는 여기서 푼다: 자기 자신이
 * 아니라 **형제 문서 · 앱 첫 화면 · 이 문서의 처음** 셋만 가리킨다.
 *
 * 🔴 카피는 길 안내다. 여기에 문서 요약이나 해석을 적지 마라 — 법무 문언의 정본은 위 조문이고,
 *    같은 말을 두 곳이 다르게 하면 어느 쪽이 정본인지 아무도 모르게 된다.
 */
export default function LegalExitNav({ related, firstClauseId }: LegalExitNavProps) {
  const handleBackToTop = () => {
    if (firstClauseId && scrollToClause(firstClauseId)) return;
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <ExitRoot aria-labelledby="legal-exit-heading">
      <ExitHead>
        <ExitGlyph>
          {/* 금화는 네이비 패널 위에서만 켠다(밝은 면 위 금색은 대비가 나오지 않는다). */}
          <BrandGlyph size={24} />
        </ExitGlyph>
        <ExitHeading id="legal-exit-heading">이어서 보실 곳</ExitHeading>
      </ExitHead>

      <ExitLede>이 문서의 정본은 위 조문입니다. 아래는 이동을 위한 안내입니다.</ExitLede>

      <ExitList>
        {related ? (
          <ExitTileLink to={related.to}>
            <ExitTileKicker>
              <FileText size={12} strokeWidth={1.8} aria-hidden focusable={false} /> 함께 보는 문서
            </ExitTileKicker>
            <ExitTileTitle>{related.title}</ExitTileTitle>
            <ExitTileSummary>{related.summary}</ExitTileSummary>
          </ExitTileLink>
        ) : null}

        <ExitTileLink to="/">
          <ExitTileKicker>
            <House size={12} strokeWidth={1.8} aria-hidden focusable={false} /> 서비스
          </ExitTileKicker>
          <ExitTileTitle>Hungry Hippo 첫 화면</ExitTileTitle>
          <ExitTileSummary>배당 재투자 시뮬레이터로 돌아갑니다.</ExitTileSummary>
        </ExitTileLink>

        <ExitTileButton type="button" onClick={handleBackToTop}>
          <ExitTileKicker>
            <ArrowUp size={12} strokeWidth={1.8} aria-hidden focusable={false} /> 이 문서
          </ExitTileKicker>
          <ExitTileTitle>처음으로</ExitTileTitle>
          <ExitTileSummary>첫 조항으로 되돌아갑니다.</ExitTileSummary>
        </ExitTileButton>
      </ExitList>
    </ExitRoot>
  );
}
