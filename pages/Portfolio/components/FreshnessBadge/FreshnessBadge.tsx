import { PORTFOLIO_COPY } from '../../copy';
import type { FreshnessBadgeProps } from './FreshnessBadge.types';
import { FreshnessBadgeRoot } from './FreshnessBadge.styled';

const copy = PORTFOLIO_COPY;

/**
 * 시세 출처 배지. `title` 을 쓰지 않는다 — 모바일에서 보이지 않아 "설명을 숨긴" 것과 같다.
 * 자세한 설명은 가정 요약(`AssumptionsDetails`)에 글로 있다.
 */
export default function FreshnessBadge({ tone }: FreshnessBadgeProps) {
  if (tone === null) return null;

  return (
    <FreshnessBadgeRoot $tone={tone}>
      {tone === 'stale-price' ? copy.badge.stalePrice : copy.badge.manual}
    </FreshnessBadgeRoot>
  );
}
