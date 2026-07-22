import { Chip } from '@/components/common';
import type { PresetFilterStatusProps } from './PresetFilterPanel.types';
import { buildActiveFilterTags, countActiveFilters, createInitialFilterState } from './PresetFilterPanel.utils';
import { ResetButton, StatusDot, StatusRow, StatusText, TagRow } from './PresetFilterPanel.styled';

/**
 * 검색행 바로 아래의 "필터 적용 중" 표시(3중 표식 중 2·3번). 드로어가 닫혀 있어도
 * 활성 필터를 상태줄 + 제거형 칩으로 노출해 무음 실패를 막는다. activeCount 0 이면 아무것도 안 그린다.
 */
export default function PresetFilterStatus({ filter, ranges, onChange }: PresetFilterStatusProps) {
  const activeCount = countActiveFilters(filter, ranges);
  if (activeCount === 0) return null;

  const tags = buildActiveFilterTags(filter, ranges);
  const reset = () => onChange(createInitialFilterState(ranges));

  return (
    <>
      <StatusRow>
        <StatusDot aria-hidden />
        <StatusText>필터 적용 중 {activeCount}개</StatusText>
        <ResetButton type="button" onClick={reset}>
          필터 초기화
        </ResetButton>
      </StatusRow>
      {tags.length > 0 ? (
        <TagRow>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              onRemove={() => onChange(tag.clear(filter))}
              removeAriaLabel={`${tag.label} 필터 제거`}
            >
              {tag.label}
            </Chip>
          ))}
        </TagRow>
      ) : null}
    </>
  );
}
