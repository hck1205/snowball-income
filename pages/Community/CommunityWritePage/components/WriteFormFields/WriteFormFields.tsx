import { useId } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { POST_TITLE_MAX_LENGTH, type PostCategory } from '@/shared/lib/supabase';
import { Select } from '@/components/common';
import { RichTextEditor } from '@/components/community/RichTextEditor';
import { EditorHint, FieldBlock, FieldError } from '../../CommunityWritePage.styled';
import type { WriteFormFieldsProps } from './WriteFormFields.types';
import { Counter, FieldLabel, LabelRow, TitleInput } from './WriteFormFields.styled';

const w = COMMUNITY_COPY.write;

/**
 * 글 종류(자유게시판 전용)·제목·본문 필드 묶음. CommunityWritePage 뷰에서 조각만 분리했다 —
 * 값·에러·변경 핸들러는 전부 부모가 준 `composer`가 그대로 쥔다.
 */
export default function WriteFormFields({ composer, isBoard, categoryOptions }: WriteFormFieldsProps) {
  const titleErrorId = useId();
  const bodyErrorId = useId();

  return (
    <>
      {/* 글 종류 — 자유게시판 전용(갤러리는 분류 개념이 없어 미렌더). 선택지 구성(공지=운영자 전용)은
          컨테이너가 categoryOptions로 접어 내려준다. 렌더 게이트의 단일 출처는 composer다.
          제목보다 **위**에 둔다 — 글의 성격을 먼저 정하고 그에 맞는 제목을 쓰는 순서가 자연스럽고,
          제목은 폼에서 가장 큰 타이포라 그 아래 작은 셀렉트가 오면 위계가 역행해 보인다. */}
      {composer.categoryAllowed ? (
        <FieldBlock>
          <FieldLabel htmlFor="community-category">{w.fieldCategory}</FieldLabel>
          <Select
            id="community-category"
            width="auto"
            minWidth="140px"
            value={composer.category}
            onChange={(event) => composer.setCategory(event.target.value as PostCategory)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {w.categoryLabels[option]}
              </option>
            ))}
          </Select>
        </FieldBlock>
      ) : null}

      {/* 제목 */}
      <FieldBlock>
        <LabelRow>
          <FieldLabel htmlFor="community-title">{w.fieldTitle}</FieldLabel>
          <Counter>{w.counter(composer.title.length, POST_TITLE_MAX_LENGTH)}</Counter>
        </LabelRow>
        <TitleInput
          id="community-title"
          value={composer.title}
          maxLength={POST_TITLE_MAX_LENGTH}
          placeholder={isBoard ? w.titlePlaceholderBoard : w.titlePlaceholder}
          invalid={Boolean(composer.errors.title)}
          aria-invalid={Boolean(composer.errors.title)}
          aria-describedby={composer.errors.title ? titleErrorId : undefined}
          onChange={(event) => composer.setTitle(event.target.value)}
        />
        {composer.errors.title ? <FieldError id={titleErrorId}>{composer.errors.title}</FieldError> : null}
      </FieldBlock>

      {/* 본문 — 게시 규칙(내용/첨부 중 하나)을 에러 전에 미리 알려준다(§A3). */}
      <FieldBlock>
        <FieldLabel as="span">{w.fieldBody}</FieldLabel>
        <RichTextEditor
          initialHtml={composer.initialBodyHtml}
          ariaLabel={w.bodyAriaLabel}
          placeholder={isBoard ? w.bodyPlaceholderBoard : w.bodyPlaceholder}
          onChange={composer.handleBodyChange}
        />
        <EditorHint>{isBoard ? w.bodyRequiredHintBoard : w.bodyOrAttachHint}</EditorHint>
        {composer.errors.body ? <FieldError id={bodyErrorId}>{composer.errors.body}</FieldError> : null}
      </FieldBlock>
    </>
  );
}
