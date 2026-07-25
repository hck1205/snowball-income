import type { Editor } from '@tiptap/react';

/** `useEditorState` 셀렉터가 만드는 활성/가능 상태 — 버튼 하이라이트(aria-pressed)·비활성화·표 컨텍스트 행 노출에 쓰인다. */
export type RichTextToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  h2: boolean;
  h3: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  bullet: boolean;
  ordered: boolean;
  link: boolean;
  /** 표 조작 행을 렌더할지 — 커서가 표 안일 때만 true. */
  inTable: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

export type RichTextToolbarProps = {
  editor: Editor;
  state: RichTextToolbarState;
};
