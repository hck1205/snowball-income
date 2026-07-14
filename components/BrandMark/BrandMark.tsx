import type { BrandMarkProps } from './BrandMark.types';

/**
 * 로고 마크 — 굴러가며 커지는 눈덩이(복리).
 *
 * 형태 언어: 같은 중심에서 출발한 원 세 개가 **점점 커진다**. 복리 곡선을 원의 반지름으로 번역한 것이다.
 * (막대그래프/화살표 같은 흔한 금융 클리셰를 피했다 — 이 앱의 주제는 "성장"이 아니라 "누적"이다)
 *
 * 구현 노트:
 *  - 색은 `currentColor`를 쓴다 → 라이트/다크에서 부모 색을 그대로 따라간다. 하드코딩된 hex가 없다.
 *  - 가장 큰 원만 채우고 나머지는 선으로 둔다 → 작은 크기(16px)에서도 뭉개지지 않는다.
 *  - `aria-hidden`: 옆에 워드마크("Snowball Income")가 텍스트로 있으므로 마크는 장식이다.
 *    스크린리더가 로고를 두 번 읽지 않게 한다.
 */
export default function BrandMark({ size = 32 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* 눈덩이가 굴러온 자취 — 작은 원에서 큰 원으로 */}
      <circle cx="7" cy="24" r="3" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <circle cx="14" cy="20" r="5.2" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
      <circle cx="23" cy="14" r="8" fill="currentColor" />
      {/* 큰 눈덩이의 하이라이트 — 구(球)로 읽히게 하는 최소한의 단서 */}
      <circle cx="20" cy="11" r="2.4" fill="var(--sb-surface)" opacity="0.55" />
    </svg>
  );
}
