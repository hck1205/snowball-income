import { useId } from 'react';
import type { BrandMarkProps } from './BrandMark.types';

/**
 * 앱 브랜드 마크 — 같은 중심에서 커지는 동심원 세 개 = 복리(누적)의 시각화(§4.8 A안).
 *
 * 오로라 그라데이션은 CSS 변수(`--sb-ribbon-stop-1~3`)를 stopColor로 참조하므로
 * 라이트(진한 리본)/다크(밝은 리본)를 코드 분기 없이 자동으로 따라간다.
 * 바깥 원일수록 opacity가 낮다 — "번져가는 오로라".
 *
 * `useId`: 한 화면에 마크가 여러 번 렌더돼도(헤더/드로어) gradient id가 충돌하지 않는다.
 * 콜론 등 특수문자는 `url(#…)` 참조에서 브라우저별로 깨질 수 있어 제거한다.
 *
 * `aria-hidden`: 옆에 워드마크가 텍스트로 있으므로 마크는 장식이다.
 * 스크린리더가 로고를 두 번 읽지 않게 한다.
 *
 * ⚠ **2026-08-03 현재 이 컴포넌트를 import 하는 곳이 없다**(자기 테스트와 `index.ts` 뿐 — 배럴에도
 *   실려 있지 않다). 헤더는 "텍스트 워드마크 단독"이 확정 결정이고(2026-07-27), OG 카드는
 *   `server/handlers/Og/Og.tsx` 가 **자기만의 로컬 `BrandMark`** 를 따로 갖고 있다.
 * 🔴 리브랜딩(Hungry Hippo) 관점에서 이 그림은 **동심원 = 복리 은유**라 새 브랜드(하마·금화)와
 *   맞지 않는다. 살릴 거면 마스코트 심볼(`components/common/BrandGlyph`)로 교체하고, 아니면
 *   폴더째 지워라 — 지금은 어느 쪽도 결정되지 않아 **그대로 둔다**(지우는 것은 리네임 트랙의 일이 아니다).
 */
export default function BrandMark({ size = 32 }: BrandMarkProps) {
  const gid = `sb-brand-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--sb-ribbon-stop-1)" />
          <stop offset="0.52" stopColor="var(--sb-ribbon-stop-2)" />
          <stop offset="1" stopColor="var(--sb-ribbon-stop-3)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13.5" fill="none" stroke={`url(#${gid})`} strokeWidth="2" opacity="0.45" />
      <circle cx="16" cy="16" r="9" fill="none" stroke={`url(#${gid})`} strokeWidth="2.4" opacity="0.75" />
      <circle cx="16" cy="16" r="4.5" fill={`url(#${gid})`} />
    </svg>
  );
}
