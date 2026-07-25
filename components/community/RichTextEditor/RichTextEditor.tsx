import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { RichTextToolbar } from './components';
import { EditorArea, EditorShell } from './RichTextEditor.styled';

export type RichTextEditorProps = {
  /** 초기 본문 HTML(마운트 시 1회만 반영). */
  initialHtml: string;
  onChange: (html: string) => void;
  ariaLabel: string;
  placeholder?: string;
};

const c = COMMUNITY_COPY.write;

/**
 * 본문 리치 에디터(Tiptap).
 *
 * 툴바(그룹 구성·링크 팝오버·표 컨텍스트 행)는 `./components/RichTextToolbar`로 분리했다 —
 * 구성 상세는 그쪽 docblock 참고.
 *
 * ⚠ 툴바에 노출하는 서식은 **`shared/lib/richtext/sanitize.ts` 허용 목록과 반드시 짝이 맞아야 한다** —
 * 허용되지 않은 태그를 만들면 편집기에선 보이다가 저장 후 렌더에서 조용히 사라진다.
 * 밑줄·취소선·인용·코드·코드 블록·구분선은 모두 StarterKit(v3) 내장이라 추가 패키지가 없다.
 * 정렬/하이라이트/글자색은 `style`·`class` 속성을 요구해 XSS 표면을 넓히므로 의도적으로 제외했다.
 * 표만 `@tiptap/extension-table`이 필요하고, `colspan`/`rowspan` 두 속성을 허용 목록에 더한다.
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
      /*
       * 표. 컬럼 리사이즈는 끈다 — 켜면 셀에 `colwidth`가 박혀 sanitize가 다뤄야 할 속성이 늘고,
       * 좁은 화면에서 사용자가 열 폭을 잘못 잡아 본문이 깨질 여지가 생긴다.
       *
       * ⚠ `resizable: false`로도 `getHTML()`에는 `<colgroup>`과 `style="min-width: …"`가 계속
       * 나온다(실측). 이건 renderHTML이 항상 조립하는 것이라 옵션으로 못 끈다 — 대신 sanitize가
       * 통째로 걷어내고(허용 목록에 colgroup/col/style 없음) 렌더 CSS가 폭을 소유한다.
       */
      TableKit.configure({ table: { resizable: false } }),
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
      /** 표 조작 행을 렌더할지 — 커서가 표 안일 때만 true. */
      inTable: current.isActive('table'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo()
    })
  });

  return (
    <EditorShell>
      <RichTextToolbar editor={editor} state={state} />
      <EditorArea>
        <EditorContent editor={editor} />
      </EditorArea>
    </EditorShell>
  );
}
