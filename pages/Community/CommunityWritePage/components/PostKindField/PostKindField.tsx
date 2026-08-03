import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { PostCategory } from '@/shared/lib/supabase';
import { Select } from '@/components/common';
import { InspectorLabel, InspectorSection } from '../../CommunityWritePage.styled';
import type { PostKindFieldProps } from './PostKindField.types';

const w = COMMUNITY_COPY.write;

/**
 * 글 종류(자유게시판 전용) — 리워크에서 **인스펙터 칼럼으로 옮겼다**.
 *
 * 그전에는 제목 위, 본문 흐름 안에 있었다. "글의 성격을 먼저 정한다"는 순서 의도는 옳았지만
 * 결과적으로 문서(제목·본문)와 메타데이터(분류)가 한 줄기에 섞여 있었다. 이제 분류는 첨부·공개범위와
 * 같은 성격 — **글에 붙는 속성** — 이므로 같은 칼럼에서 함께 읽힌다.
 *
 * 네이티브 `select` 를 쓰는 이유는 그대로다: 옵션이 2~3개뿐이고 모바일 OS 휠 UI·키보드·스크린리더
 * 지원이 공짜다(role=combobox + label htmlFor).
 */
export default function PostKindField({ value, onChange, options }: PostKindFieldProps) {
  return (
    <InspectorSection>
      <InspectorLabel htmlFor="community-category">{w.fieldCategory}</InspectorLabel>
      <Select
        id="community-category"
        width="full"
        value={value}
        onChange={(event) => onChange(event.target.value as PostCategory)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {w.categoryLabels[option]}
          </option>
        ))}
      </Select>
    </InspectorSection>
  );
}
