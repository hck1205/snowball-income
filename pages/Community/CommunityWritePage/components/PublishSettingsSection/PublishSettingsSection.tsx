import { COMMUNITY_COPY } from '@/shared/constants/community';
import { FormSection, ToggleField } from '@/components/common';
import { FieldBlock } from '../../CommunityWritePage.styled';
import type { PublishSettingsSectionProps } from './PublishSettingsSection.types';
import { VisibilityRow, VisibilityText } from './PublishSettingsSection.styled';

const w = COMMUNITY_COPY.write;

/**
 * 게시 설정 섹션(공개 범위만) — CommunityWritePage 뷰에서 조각만 분리했다.
 * 섹션 자체의 노출 여부(canChooseVisibility)는 부모가 그대로 게이트한다.
 */
export default function PublishSettingsSection({ isPublic, onIsPublicChange }: PublishSettingsSectionProps) {
  return (
    <FormSection title={w.sectionPublish}>
      {/* 공개 범위 — "비공개" 스위치 + 상태 안내를 **한 행에 나란히**. 기본 off=공개, on=비공개. */}
      <FieldBlock>
        <VisibilityRow>
          <ToggleField
            label="비공개"
            checked={!isPublic}
            onChange={(event) => onIsPublicChange(!event.target.checked)}
          />
          <VisibilityText>{isPublic ? w.visibilityPublic : w.visibilityPrivate}</VisibilityText>
        </VisibilityRow>
      </FieldBlock>
    </FormSection>
  );
}
