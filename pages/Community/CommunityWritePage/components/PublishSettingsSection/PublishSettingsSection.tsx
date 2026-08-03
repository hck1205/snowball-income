import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ToggleField } from '@/components/common';
import { InspectorSection, InspectorTitle } from '../../CommunityWritePage.styled';
import type { PublishSettingsSectionProps } from './PublishSettingsSection.types';
import { VisibilityRow, VisibilityText } from './PublishSettingsSection.styled';

const w = COMMUNITY_COPY.write;

/**
 * 게시 설정(공개 범위) — 인스펙터 타일.
 * 공용 `FormSection` 대신 인스펙터 어휘를 쓴다: 타일 머리가 작은 라벨이고, 상태 안내가
 * 토글 **아래 한 줄**로 내려와 좁은 칼럼에서 줄바꿈으로 어긋나지 않는다.
 * 섹션 자체의 노출 여부(canChooseVisibility)는 부모가 그대로 게이트한다.
 */
export default function PublishSettingsSection({ isPublic, onIsPublicChange }: PublishSettingsSectionProps) {
  return (
    <InspectorSection>
      <InspectorTitle>{w.sectionPublish}</InspectorTitle>
      <VisibilityRow>
        <ToggleField label="비공개" checked={!isPublic} onChange={(event) => onIsPublicChange(!event.target.checked)} />
      </VisibilityRow>
      <VisibilityText>{isPublic ? w.visibilityPublic : w.visibilityPrivate}</VisibilityText>
    </InspectorSection>
  );
}
