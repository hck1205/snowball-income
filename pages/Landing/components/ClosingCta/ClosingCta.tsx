import { ArrowRight } from 'lucide-react';
import { HippoCoinScene } from '@/components/common';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY, LANDING_HERO_CTAS } from '../../copy';
import { ClosingLead, ClosingLink, ClosingMark, ClosingNote, ClosingRow } from './ClosingCta.styled';

/**
 * 페이지를 닫는 줄 — **brand-subtle 틴트 면 + 흰 하마 판 + 오로라 CTA**.
 *
 * **왜 필요한가**: before 의 마지막 인터랙티브 요소는 FAQ 8번째 summary 였고 그 뒤는 곧바로 면책
 * 푸터였다 — 끝까지 읽은 사람에게 다음 행동이 주어지지 않았다.
 *
 * 🔴 **랜딩의 틴트 면 2장 중 ①이 여기다**(②는 `PageFooter` 네이비 패널). 흰 캔버스 전환으로
 * 히어로 그라디언트가 사라지며 풀린 예산 한 장을 이 줄이 받았다 — 근거·대안 검토·되돌리는 조건은
 * 전부 `ClosingCta.styled.ts` 머리말에 있다. 세 번째 면을 만들면 tintscan 의 `/` 항목이 exit 1 이다.
 *
 * 🔴 **금색·네이비 패널은 여기 없다.** 바로 아래 `PageFooter` 가 이미 그 면이라, 둘 다 네이비면
 * 같은 색이 76px 사이로 두 번 선다(경사가 아니라 반복이다). 마스코트는 장식(`aria-hidden` 기본값)이라
 * 접근성 트리에 이름을 더하지 않는다 — 바로 옆 문장이 이미 말한다.
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
        {/*
          🔴 앱 전체에서 **금화가 켜지는 단 한 자리**다(2026-08-03 사용자 지시 — 하마+금화는 정말
          특별한 곳 한두 군데만). 여덟 군데에 흩어져 있던 accent 를 전부 걷어내고 여기로 모았다.
          왜 여기냐: 히어로는 접힘 위 예산이 239px 이라 연출이 들어갈 자리가 없고(LandingPage.view 주석),
          그 주석이 **"큰 마스코트는 마무리 패널이 가져간다"**고 이 자리를 미리 예약해 뒀다.
          ⚠ 금화는 **이미지**다 — 금색 토큰이 아니라 자기 음영과 외곽선을 가진 그림이라, "금색은
            네이비 패널 위에서만"이라는 토큰 규칙(1.83:1)의 대상이 아니다. 민트 면 위 실측 확인.
          ⚠ 접힘 아래이므로 lazy 다 — 두 이미지가 합쳐 800KB 대라 eager 면 첫 페인트를 갉아먹는다.
        */}
        <ClosingMark>
          <HippoCoinScene size={88} loading="lazy" />
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
