import type { BrandMarkProps } from './BrandMark.types';

/**
 * 앱 브랜드 마크 — 앱 아이콘(`/app_icon.png`)을 원형으로 표시한다.
 *
 * 파비콘·홈스크린 아이콘과 **같은 이미지**를 써서 브랜드 아이콘이 헤더·커뮤니티 어디서나 일관되게 보인다.
 * (예전엔 인라인 SVG 눈덩이 마크였지만, 실제 앱 아이콘으로 통일한다.)
 *
 * `aria-hidden`: 옆에 워드마크("Snowball Income")가 텍스트로 있으므로 마크는 장식이다.
 * 스크린리더가 로고를 두 번 읽지 않게 한다.
 */
export default function BrandMark({ size = 32 }: BrandMarkProps) {
  return (
    <img
      src="/app_icon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
    />
  );
}
