import { ArrowRight } from 'lucide-react';
import { BrandGlyph } from '@/components/common';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY, LANDING_HERO_CTAS } from '../../copy';
import { ClosingLead, ClosingLink, ClosingMark, ClosingNote, ClosingRow } from './ClosingCta.styled';

/**
 * 페이지를 닫는 줄 — **중립 카드 + 브랜드 레일 + 하마 배지 + 오로라 CTA**.
 *
 * **왜 필요한가**: before 의 마지막 인터랙티브 요소는 FAQ 8번째 summary 였고 그 뒤는 곧바로 면책
 * 푸터였다 — 끝까지 읽은 사람에게 다음 행동이 주어지지 않았다.
 *
 * 🔴 **금색·네이비 패널은 여기 없다.** 바로 아래 `PageFooter` 가 이미 그 면이고, 둘 다 패널이면
 * 같은 네이비가 76px 사이로 두 번 서면서 랜딩의 틴트 면이 3/2 로 넘친다(실측 근거와 되돌리는
 * 조건은 `ClosingCta.styled.ts` 머리말). 마스코트는 장식(`aria-hidden` 기본값)이라 접근성
 * 트리에 이름을 더하지 않는다 — 바로 옆 문장이 이미 말한다.
 *
 * ⚠ **DOM 계약**: 앵커의 `parentElement` 가 `ClosingRow` 여야 하고, 그 안의 **첫 `p`** 가 닫는
 * 문장이어야 한다(`test/landing/landingClosingCta.test.tsx` 가 그 두 가지로 요소를 찾는다).
 * 그래서 마스코트·문장은 `ClosingLead` 로 묶되 **앵커는 행의 직계 자식으로 남긴다.**
 *
 * 🔴 **`data-landing-cta` 를 붙이지 마라.** 그 앵커는 "접힘 위 히어로 CTA"를 가리키는 프로브 계약이고
 * 정확히 2개임이 테스트로 잠겨 있다. 이 요소가 필요로 하는 앵커는 `data-landing-closing-cta` 다.
 *
 * 🔴 라벨은 히어로 CTA 배열에서 읽는다 — 같은 의도(시뮬레이터로 간다)에 두 개의 문구를 두지 않는다.
 */
const SIMULATOR_CTA = LANDING_HERO_CTAS.find((cta) => cta.id === 'simulator');

export default function ClosingCta() {
  if (!SIMULATOR_CTA) return null;

  return (
    <ClosingRow>
      <ClosingLead>
        {/* 금화(accent)는 켜지 않는다 — currentColor 로 그려지므로 네이비 패널 밖에서는 금색이 될 수 없다. */}
        <ClosingMark>
          <BrandGlyph size={32} />
        </ClosingMark>
        <ClosingNote>{LANDING_COPY.closing.note}</ClosingNote>
      </ClosingLead>
      <ClosingLink
        to={SIMULATOR_CTA.to}
        data-landing-closing-cta="simulator"
        onClick={() => trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_closing_simulator' })}
      >
        {SIMULATOR_CTA.label}
        <ArrowRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </ClosingLink>
    </ClosingRow>
  );
}
