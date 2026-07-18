import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ChartIcon } from '@/components/community/CommunityIcons';
import { SimBadgeRoot } from './SimBadge.styled';

/**
 * "시뮬 결과" 배지 — 첨부(payload)가 있는 글에만 붙는다(자유 글은 배지 없음).
 * 아이콘 + 텍스트를 함께 써서 색만으로 구분하지 않는다.
 */
export default function SimBadge() {
  return (
    <SimBadgeRoot>
      <ChartIcon size={12} />
      {COMMUNITY_COPY.gallery.simBadge}
    </SimBadgeRoot>
  );
}
