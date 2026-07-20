import { useState } from 'react';
import type { ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
  UnderlineIcon,
  UndoIcon
} from '@/components/community/CommunityIcons';
import {
  EditorArea,
  EditorShell,
  LinkForm,
  LinkInput,
  LinkPopover,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup
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

/** 접근명은 라벨 그대로 두고 툴팁(title)에만 단축키를 덧붙인다. */
const withShortcut = (label: string, shortcut?: string) => (shortcut ? `${label} (${shortcut})` : label);

type ToolButtonProps = {
  label: string;
  shortcut?: string;
  /** 토글형 버튼만 넘긴다. 삽입/이력처럼 상태가 없는 버튼은 생략해 aria-pressed를 붙이지 않는다. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

const ToolButton = ({ label, shortcut, active, disabled, onClick, children }: ToolButtonProps) => (
  <ToolbarButton
    type="button"
    aria-label={label}
    title={withShortcut(label, shortcut)}
    {...(active === undefined ? {} : { 'aria-pressed': active, active })}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </ToolbarButton>
);

/**
 * 본문 리치 에디터(Tiptap).
 *
 * 툴바 구성(그룹 단위): 글자 서식(굵게/기울임/밑줄/취소선/인라인 코드) · 문단(H2·H3/인용/코드 블록) ·
 * 목록(글머리/번호) · 삽입(링크/구분선) · 이력(실행 취소/다시 실행).
 *
 * ⚠ 툴바에 노출하는 서식은 **`shared/lib/richtext/sanitize.ts` 허용 목록과 반드시 짝이 맞아야 한다** —
 * 허용되지 않은 태그를 만들면 편집기에선 보이다가 저장 후 렌더에서 조용히 사라진다.
 * 밑줄·취소선·인용·코드·코드 블록·구분선은 모두 StarterKit(v3) 내장이라 추가 패키지가 없다.
 * 정렬/하이라이트/글자색은 `style`·`class` 속성을 요구해 XSS 표면을 넓히므로 의도적으로 제외했다.
 *
 * ⚠ Tiptap에 정적으로 의존 → 글쓰기 청크에서만 import 한다(barrel 미포함).
 * 한글 IME: Tiptap이 조합 입력을 내부적으로 처리하므로 onUpdate의 getHTML을 그대로 전달해도 안전하다.
 * `value`를 되먹이지 않는 비제어 방식이라 조합 중 상태를 덮어쓰지 않는다.
 */
export default function RichTextEditor({ initialHtml, onChange, ariaLabel, placeholder }: RichTextEditorProps) {
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

  /*
   * ⚠ **훅 개수 고정** — 여기서 `useEditorState`를 부르면 안 된다.
   *
   * `immediatelyRender: false`라 첫 렌더에는 `editor`가 null이고 다음 렌더에 인스턴스가 생긴다.
   * `useEditorState`는 editor 유무에 따라 내부 훅 경로가 갈려서, 같은 컴포넌트가 렌더마다 다른
   * 개수의 훅을 부르게 된다 → 프로덕션 빌드에서 **React #311**("Rendered fewer hooks than
   * expected")로 글쓰기 화면 전체가 죽는다. 개발 빌드·jsdom에서는 드러나지 않아 테스트 83개가
   * 전부 통과한 채로 배포됐다.
   *
   * 그래서 editor가 **확정된 뒤에만 마운트되는 자식**으로 나눈다. 자식은 `editor`를 non-null로
   * 받으므로 훅 개수가 항상 같다.
   */
  if (!editor) {
    return <EditorShell aria-busy="true" />;
  }

  return <RichTextEditorBody editor={editor} />;
}

/** 툴바 + 본문. `editor`가 준비된 뒤에만 마운트되므로 훅 개수가 렌더마다 동일하다(위 ⚠ 참고). */
function RichTextEditorBody({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      code: current.isActive('code'),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
      bullet: current.isActive('bulletList'),
      ordered: current.isActive('orderedList'),
      link: current.isActive('link'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo()
    })
  });

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
        <ToolbarGroup role="group" aria-label={c.toolbarGroupInline}>
          <ToolButton
            label={c.bold}
            shortcut={c.shortcutBold}
            active={state?.bold ?? false}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.italic}
            shortcut={c.shortcutItalic}
            active={state?.italic ?? false}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.underline}
            shortcut={c.shortcutUnderline}
            active={state?.underline ?? false}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.strike}
            shortcut={c.shortcutStrike}
            active={state?.strike ?? false}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.inlineCode}
            shortcut={c.shortcutInlineCode}
            active={state?.code ?? false}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <InlineCodeIcon size={16} />
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
            <QuoteIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.codeBlock}
            shortcut={c.shortcutCodeBlock}
            active={state?.codeBlock ?? false}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <CodeBlockIcon size={16} />
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
            <BulletListIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.orderedList}
            shortcut={c.shortcutOrderedList}
            active={state?.ordered ?? false}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <OrderedListIcon size={16} />
          </ToolButton>
        </ToolbarGroup>

        <ToolbarDivider aria-hidden="true" />

        <ToolbarGroup role="group" aria-label={c.toolbarGroupInsert}>
          <LinkPopover>
            <ToolButton label={c.link} active={state?.link ?? false} onClick={openLinkEditor}>
              <LinkIcon size={16} />
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
            <HorizontalRuleIcon size={16} />
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
            <UndoIcon size={16} />
          </ToolButton>
          <ToolButton
            label={c.redo}
            shortcut={c.shortcutRedo}
            disabled={!(state?.canRedo ?? false)}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <RedoIcon size={16} />
          </ToolButton>
        </ToolbarGroup>
      </Toolbar>

      <EditorArea>
        <EditorContent editor={editor} />
      </EditorArea>
    </EditorShell>
  );
}
