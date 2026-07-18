import { useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  BoldIcon,
  BulletListIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon
} from '@/components/community/CommunityIcons';
import {
  EditorArea,
  EditorShell,
  LinkForm,
  LinkInput,
  LinkPopover,
  Toolbar,
  ToolbarButton,
  ToolbarDivider
} from './RichTextEditor.styled';

export type RichTextEditorProps = {
  /** 초기 본문 HTML(마운트 시 1회만 반영). */
  initialHtml: string;
  onChange: (html: string) => void;
  ariaLabel: string;
  placeholder?: string;
};

const c = COMMUNITY_COPY.write;
const isSafeUrl = (url: string) => /^https?:\/\//i.test(url.trim());

/**
 * 본문 리치 에디터(Tiptap). 툴바: 굵게/기울임/제목(H2·H3)/글머리·번호 목록/링크.
 *
 * ⚠ Tiptap에 정적으로 의존 → 글쓰기 청크에서만 import 한다(barrel 미포함).
 * 한글 IME: Tiptap이 조합 입력을 내부적으로 처리하므로 onUpdate의 getHTML을 그대로 전달해도 안전하다.
 * `value`를 되먹이지 않는 비제어 방식이라 조합 중 상태를 덮어쓰지 않는다.
 */
export default function RichTextEditor({ initialHtml, onChange, ariaLabel, placeholder }: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // 별도 설정한 Link 확장을 쓰므로 StarterKit 내장 Link는 끈다(중복 방지).
        link: false,
        heading: { levels: [2, 3] }
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
      }),
      Placeholder.configure({ placeholder: placeholder ?? c.bodyPlaceholder })
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel,
        role: 'textbox',
        'aria-multiline': 'true'
      }
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    }
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      h2: current?.isActive('heading', { level: 2 }) ?? false,
      h3: current?.isActive('heading', { level: 3 }) ?? false,
      bullet: current?.isActive('bulletList') ?? false,
      ordered: current?.isActive('orderedList') ?? false,
      link: current?.isActive('link') ?? false
    })
  });

  if (!editor) {
    return <EditorShell aria-busy="true" />;
  }

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
    <EditorShell>
      <Toolbar role="toolbar" aria-label={c.toolbarAriaLabel}>
        <ToolbarButton
          type="button"
          aria-label={c.bold}
          aria-pressed={state?.bold ?? false}
          active={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          type="button"
          aria-label={c.italic}
          aria-pressed={state?.italic ?? false}
          active={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon size={16} />
        </ToolbarButton>

        <ToolbarDivider aria-hidden="true" />

        <ToolbarButton
          type="button"
          aria-label={c.heading2}
          aria-pressed={state?.h2 ?? false}
          active={state?.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          type="button"
          aria-label={c.heading3}
          aria-pressed={state?.h3 ?? false}
          active={state?.h3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>

        <ToolbarDivider aria-hidden="true" />

        <ToolbarButton
          type="button"
          aria-label={c.bulletList}
          aria-pressed={state?.bullet ?? false}
          active={state?.bullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <BulletListIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          type="button"
          aria-label={c.orderedList}
          aria-pressed={state?.ordered ?? false}
          active={state?.ordered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon size={16} />
        </ToolbarButton>

        <ToolbarDivider aria-hidden="true" />

        <LinkPopover>
          <ToolbarButton
            type="button"
            aria-label={c.link}
            aria-pressed={state?.link ?? false}
            active={state?.link}
            onClick={openLinkEditor}
          >
            <LinkIcon size={16} />
          </ToolbarButton>
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
      </Toolbar>

      <EditorArea>
        <EditorContent editor={editor} />
      </EditorArea>
    </EditorShell>
  );
}
