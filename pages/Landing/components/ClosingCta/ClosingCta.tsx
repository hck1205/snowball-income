import { ArrowRight } from 'lucide-react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY, LANDING_HERO_CTAS } from '../../copy';
import { ClosingLink, ClosingNote, ClosingRow } from './ClosingCta.styled';

/**
 * 페이지를 닫는 액션 한 줄.
 *
 * **왜 필요한가**: before 의 마지막 인터랙티브 요소는 FAQ 8번째 summary 였고 그 뒤는 곧바로 면책
 * 푸터였다 — 끝까지 읽은 사람에게 다음 행동이 주어지지 않았다.
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
      <ClosingNote>{LANDING_COPY.closing.note}</ClosingNote>
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
