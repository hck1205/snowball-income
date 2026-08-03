import { useId } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { POST_TITLE_MAX_LENGTH } from '@/shared/lib/supabase';
import { RichTextEditor } from '@/components/community/RichTextEditor';
import { EditorHint, FieldBlock, FieldError } from '../../CommunityWritePage.styled';
import type { WriteFormFieldsProps } from './WriteFormFields.types';
import { BodyBlock, Counter, FieldLabel, LabelRow, TitleInput } from './WriteFormFields.styled';

const w = COMMUNITY_COPY.write;

/**
 * **문서 시트의 내용** — 제목과 본문. 값·에러·변경 핸들러는 전부 부모가 준 `composer` 가 그대로 쥔다.
 *
 * 🔴 글 종류(분류) 드롭다운은 2026-08-03 리워크에서 여기를 떠나 인스펙터 칼럼(`PostKindField`)으로
 * 갔다. 기능은 그대로고 **자리만** 바뀌었다 — 분류는 글의 내용이 아니라 글에 붙는 속성이라,
 * 첨부·공개범위와 같은 칼럼에서 읽히는 편이 맞다.
 */
export default function WriteFormFields({ composer, isBoard }: WriteFormFieldsProps) {
  const titleErrorId = useId();
  const bodyErrorId = useId();

  return (
    <>
      {/* 제목 — 시트의 첫 줄. 라벨은 카운터와 한 줄을 나눠 쓴다(입력칸 위 공간을 두 배로 쓰지 않게). */}
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
      <BodyBlock>
        <FieldLabel as="span">{w.fieldBody}</FieldLabel>
        <RichTextEditor
          initialHtml={composer.initialBodyHtml}
          ariaLabel={w.bodyAriaLabel}
          placeholder={isBoard ? w.bodyPlaceholderBoard : w.bodyPlaceholder}
          onChange={composer.handleBodyChange}
        />
        <EditorHint>{isBoard ? w.bodyRequiredHintBoard : w.bodyOrAttachHint}</EditorHint>
        {composer.errors.body ? <FieldError id={bodyErrorId}>{composer.errors.body}</FieldError> : null}
      </BodyBlock>
    </>
  );
}
