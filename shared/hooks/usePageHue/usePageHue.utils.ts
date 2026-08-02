import { PAGE_HUE_TOKEN, PAGE_HUE_VAR } from '@/shared/styles';
import type { ResolvedPageHue } from './usePageHue.types';

/**
 * ── 라우트 → 페이지 hue 매핑(정본) ──────────────────────────────────────────────
 *
 * 배정 근거(2026-07-31 확정):
 *  - `/simulator` 시뮬레이터 = **identity**(쿨 블루). "미래를 계산한다"가 이 제품의 아이덴티티
 *    축이고, 워드마크 첫 단어와 같은 색이다. identity 토큰은 스킨(프리셋)을 따라가지 않는다.
 *    🔴 이 줄이 살아 있는지 확인하라 — 빠뜨리면 **모든 테스트가 그린인 채로** 시뮬레이터가
 *    폴백 색으로 떨어진다.
 *  - `/` 랜딩 = **identity**. 🔴 시뮬레이터와 **의도적으로 같은 색**이다(2026-08-01 랜딩 승격,
 *    ui-ux-designer 판정). ①identity 는 섹션 색이 아니라 **전 프리셋 공통값**(스킨 미추종)인 제품
 *    자신의 색이고 ②랜딩은 워드마크가 가리키는 **정문**, 시뮬레이터는 그 문 안의 도구라 한 축이다
 *    (`/ledger`↔`/dividend/portfolio` 가 accentAlt 를 공유하는 것과 같은 근거). 차별화 손실도 0이다 —
 *    랜딩에는 **활성 내비 알약이 없어서**(nav "시뮬레이터"는 `/simulator` 를 가리킨다) hue 소비처가
 *    히어로 하나뿐이다. **새 hue 를 만들지 마라**(라우트별로 색이 갈리는지 재는 가드에 이 쌍을
 *    넣지 않는 이유도 같다 — 갈리면 안 되는 쌍이다).
 *  - `/dividend/portfolio` = **accentAlt**(그린). 지금 자라고 있는 것.
 *  - `/ledger` = **accentAlt**. 🔴 포트폴리오와 **의도적으로 같은 색**이다 — 둘 다 "내가 직접 넣은
 *    실측 데이터"라는 한 축이고, 색이 갈리면 사용자가 두 화면을 다른 성격으로 읽는다.
 *    (라우트별로 색이 갈리는지 재는 가드에는 이 쌍을 넣지 않는다 — 갈리면 안 되는 쌍이다.)
 *  - `/dividend/calendar` = **accent**(틸). 흐름·일정.
 *  - `/community/*` = **brand**. 사람이 모이는 곳 — 인터랙션 축과 같은 색이다.
 *  - `/ticker/*` = **배정하지 않는다**. 티커 화면은 이미 **티커별 액센트**(`--tk-from/--tk-to` →
 *    `--tk-text/--tk-soft/--tk-border`)라는 자기 색 체계를 갖는다. 여기에 페이지 hue 를 겹치면
 *    한 화면이 두 색으로 말한다.
 *
 * 새 라우트를 추가하면 **여기 한 줄**만 늘린다. 페이지 컴포넌트가 각자 발행하지 않는 이유는
 * `usePageHue.ts` 주석 참고.
 */
export const resolvePageHue = (pathname: string): ResolvedPageHue => {
  /* 랜딩(`/`) 과 시뮬레이터(`/simulator`) 는 같은 identity 를 쓴다 — 위 배정 근거 참고. */
  if (pathname === '/') return 'identity';
  if (pathname.startsWith('/simulator')) return 'identity';
  if (pathname.startsWith('/dividend/portfolio')) return 'accentAlt';
  if (pathname.startsWith('/ledger')) return 'accentAlt';
  if (pathname.startsWith('/dividend/calendar')) return 'accent';
  if (pathname.startsWith('/community')) return 'brand';
  // 티커 랜딩 + 미배정 라우트 — 폴백(brand)으로 둔다.
  return null;
};

/**
 * `document.documentElement` 에 hue 를 발행한다.
 *
 * 왜 루트인가: 이 변수를 읽는 곳은 본문 히어로**와** 상단 내비(`PrimaryNav` 활성 알약)다. 내비는
 * 페이지 트리 **바깥**에 있으므로 히어로 엘리먼트에만 세팅하면 내비가 영원히 못 읽는다.
 */
export const applyPageHue = (hue: ResolvedPageHue): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (hue === null) {
    root.style.removeProperty(PAGE_HUE_VAR);
    return;
  }
  root.style.setProperty(PAGE_HUE_VAR, PAGE_HUE_TOKEN[hue]);
};
