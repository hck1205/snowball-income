import { useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  BoldIcon,
  BulletListIcon,
  CodeBlockIcon,
  HorizontalRuleIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
  UndoIcon
} from '@/components/community/CommunityIcons';
import {
  LinkForm,
  LinkInput,
  LinkPopover,
  TableContextGroup,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup
} from '../../RichTextEditor.styled';
import { ToolButton } from '../ToolButton';
import type { RichTextToolbarProps } from './RichTextToolbar.types';

const c = COMMUNITY_COPY.write;
const isSafeUrl = (url: string) => /^https?:\/\//i.test(url.trim());

/**
 * 본문 리치 에디터 툴바 + 링크 팝오버.
 *
 * 그룹 구성: 글자 서식(굵게/기울임/밑줄/취소선/인라인 코드) · 문단(H2·H3/인용/코드 블록) ·
 * 목록(글머리/번호) · 삽입(링크/표) · 이력(실행 취소/다시 실행).
 * 표 조작(행·열 추가/삭제, 표 삭제)은 **커서가 표 안일 때만** 나타나는 컨텍스트 행이다.
 *
 * 활성/가능 상태(`state`)는 부모(`RichTextEditorBody`)의 `useEditorState`가 만들어 내려준다 —
 * 이 컴포넌트는 그 결과를 그대로 렌더에만 쓴다(훅 개수 고정 불변식은 `RichTextEditor.tsx` 상단 ⚠ 참고).
 */
const RichTextToolbar = ({ editor, state }: RichTextToolbarProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const openLinkEditor = () => {
    const existing = (editor.getAttributes('link').href as string | undefined) ?? '';
    setLinkValue(existing);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkValue.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else if (isSafeUrl(url)) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkOpen(false);
  };

  return (
    <Toolbar role="toolbar" aria-label={c.toolbarAriaLabel}>
      <ToolbarGroup role="group" aria-label={c.toolbarGroupInline}>
        <ToolButton
          label={c.bold}
          shortcut={c.shortcutBold}
          active={state?.bold ?? false}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.italic}
          shortcut={c.shortcutItalic}
          active={state?.italic ?? false}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.underline}
          shortcut={c.shortcutUnderline}
          active={state?.underline ?? false}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.strike}
          shortcut={c.shortcutStrike}
          active={state?.strike ?? false}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.inlineCode}
          shortcut={c.shortcutInlineCode}
          active={state?.code ?? false}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <InlineCodeIcon size={16} strokeWidth={1.8} />
        </ToolButton>
      </ToolbarGroup>

      <ToolbarDivider aria-hidden="true" />

      <ToolbarGroup role="group" aria-label={c.toolbarGroupBlock}>
        <ToolButton
          label={c.heading2}
          shortcut={c.shortcutHeading2}
          active={state?.h2 ?? false}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolButton>
        <ToolButton
          label={c.heading3}
          shortcut={c.shortcutHeading3}
          active={state?.h3 ?? false}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolButton>
        <ToolButton
          label={c.blockquote}
          shortcut={c.shortcutBlockquote}
          active={state?.blockquote ?? false}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.codeBlock}
          shortcut={c.shortcutCodeBlock}
          active={state?.codeBlock ?? false}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeBlockIcon size={16} strokeWidth={1.8} />
        </ToolButton>
      </ToolbarGroup>

      <ToolbarDivider aria-hidden="true" />

      <ToolbarGroup role="group" aria-label={c.toolbarGroupList}>
        <ToolButton
          label={c.bulletList}
          shortcut={c.shortcutBulletList}
          active={state?.bullet ?? false}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <BulletListIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.orderedList}
          shortcut={c.shortcutOrderedList}
          active={state?.ordered ?? false}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon size={16} strokeWidth={1.8} />
        </ToolButton>
      </ToolbarGroup>

      <ToolbarDivider aria-hidden="true" />

      <ToolbarGroup role="group" aria-label={c.toolbarGroupInsert}>
        <LinkPopover>
          <ToolButton label={c.link} active={state?.link ?? false} onClick={openLinkEditor}>
            <LinkIcon size={16} strokeWidth={1.8} />
          </ToolButton>
          {linkOpen ? (
            <LinkForm
              onSubmit={(event) => {
                event.preventDefault();
                applyLink();
              }}
            >
              <LinkInput
                type="url"
                inputMode="url"
                autoFocus
                aria-label={c.link}
                placeholder={c.linkUrlPlaceholder}
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setLinkOpen(false);
                }}
              />
              <ToolbarButton type="submit" aria-label={c.linkApply}>
                {c.linkApply}
              </ToolbarButton>
              <ToolbarButton type="button" aria-label={c.linkRemove} onClick={removeLink}>
                {c.linkRemove}
              </ToolbarButton>
            </LinkForm>
          ) : null}
        </LinkPopover>
        <ToolButton label={c.horizontalRule} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <HorizontalRuleIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.insertTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon size={16} strokeWidth={1.8} />
        </ToolButton>
      </ToolbarGroup>

      <ToolbarDivider aria-hidden="true" />

      <ToolbarGroup role="group" aria-label={c.toolbarGroupHistory}>
        <ToolButton
          label={c.undo}
          shortcut={c.shortcutUndo}
          disabled={!(state?.canUndo ?? false)}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoIcon size={16} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          label={c.redo}
          shortcut={c.shortcutRedo}
          disabled={!(state?.canRedo ?? false)}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoIcon size={16} strokeWidth={1.8} />
        </ToolButton>
      </ToolbarGroup>

      {/*
       * 표 조작 행 — 커서가 표 안일 때만 렌더한다(`aria-hidden`/`inert`로 감추지 않는다:
       * 안 보이는 버튼이 탭 순서에 남거나 스크린리더에 유령으로 잡히는 편이 더 나쁘다).
       *
       * ⚠ 6개 전부 `.focus()`를 체인에 넣는다. 특히 **표 삭제**는 자기가 속한 이 그룹을 DOM에서
       * 없애므로, `.focus()`가 없으면 포커스가 <body>로 떨어져 키보드 사용자가 길을 잃는다.
       * 별도 live region은 두지 않는다 — 캐럿이 표를 드나들 때마다 낭독되어 소음이 되고,
       * 브라우저가 <table> 시맨틱을 이미 노출한다.
       */}
      {state?.inTable ? (
        <TableContextGroup role="group" aria-label={c.toolbarGroupTable}>
          <ToolButton label={c.tableAddRow} onClick={() => editor.chain().focus().addRowAfter().run()}>
            {c.tableAddRow}
          </ToolButton>
          <ToolButton label={c.tableDeleteRow} onClick={() => editor.chain().focus().deleteRow().run()}>
            {c.tableDeleteRow}
          </ToolButton>
          <ToolButton label={c.tableAddColumn} onClick={() => editor.chain().focus().addColumnAfter().run()}>
            {c.tableAddColumn}
          </ToolButton>
          <ToolButton label={c.tableDeleteColumn} onClick={() => editor.chain().focus().deleteColumn().run()}>
            {c.tableDeleteColumn}
          </ToolButton>
          <ToolbarDivider aria-hidden="true" />
          <ToolButton label={c.tableDelete} onClick={() => editor.chain().focus().deleteTable().run()}>
            {c.tableDelete}
          </ToolButton>
        </TableContextGroup>
      ) : null}
    </Toolbar>
  );
};

export default RichTextToolbar;
