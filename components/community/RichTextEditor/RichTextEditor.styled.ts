import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space } from '@/shared/styles';

export const EditorShell = styled.div`
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.md};
  background: ${color.surface};
  overflow: hidden;

  &:focus-within {
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[2]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surfaceMuted};
`;

/**
 * 툴바 버튼 묶음(서식 / 문단 / 목록 / 삽입 / 이력). 버튼이 늘어 좁은 화면에서 줄바꿈될 때
 * 그룹 단위로 함께 넘어가도록(가로 스크롤 대신 wrap) 자체도 `flex-wrap` 을 갖는다.
 */
export const ToolbarGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
`;

export const ToolbarButton = styled.button<{ active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 ${space[1]};
  border-radius: ${radius.sm};
  border: 1px solid ${({ active }) => (active ? color.brandBorder : 'transparent')};
  background: ${({ active }) => (active ? color.brandSubtle : 'transparent')};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  cursor: pointer;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * 표 조작 버튼 묶음. 커서가 표 안일 때만 렌더되는 **컨텍스트 행**이라, 나타나고 사라질 때 위쪽
 * 툴바 버튼들의 줄바꿈을 흔들지 않도록 `flex: 1 0 100%`로 항상 자기 줄을 차지한다.
 * 위 구분선은 `ToolbarDivider`(세로선)가 아니라 자기 `border-top`으로 긋는다.
 */
export const TableContextGroup = styled.div`
  display: flex;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  margin-top: ${space[1]};
  padding-top: ${space[1]};
  border-top: 1px solid ${color.border};
`;

export const ToolbarDivider = styled.span`
  width: 1px;
  height: 20px;
  background: ${color.border};
  margin: 0 ${space[1]};
`;

export const EditorArea = styled.div`
  .ProseMirror {
    min-height: 240px;
    padding: ${space[4]};
    outline: none;
    color: ${color.text};
    font-size: ${font.size.md};
    line-height: ${font.leading.relaxed};

    p {
      margin: 0 0 ${space[3]};
    }

    h2 {
      font-size: ${font.size.xl};
      font-weight: ${font.weight.bold};
      margin: ${space[4]} 0 ${space[2]};
    }

    h3 {
      font-size: ${font.size.lg};
      font-weight: ${font.weight.bold};
      margin: ${space[3]} 0 ${space[2]};
    }

    ul,
    ol {
      padding-left: ${space[6]};
      margin: 0 0 ${space[3]};
    }

    a {
      color: ${color.brandText};
      text-decoration: underline;
    }

    /* 저장 후 렌더(RichTextContent.styled)와 같은 톤으로 맞춘다 — 편집 중 미리보기 괴리를 줄인다. */
    blockquote {
      margin: 0 0 ${space[3]};
      padding: ${space[2]} ${space[4]};
      border-left: 3px solid ${color.brandBorder};
      color: ${color.textSecondary};
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: ${font.size.sm};
      background: ${color.surfaceSunken};
      padding: 1px ${space[1]};
      border-radius: ${radius.xs};
    }

    pre {
      margin: 0 0 ${space[3]};
      padding: ${space[3]};
      background: ${color.surfaceSunken};
      border-radius: ${radius.sm};
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }

    /*
     * 편집 중 표. 저장 후 렌더(RichTextContent.styled)와 테두리·여백·헤더 톤을 맞추되 **레이아웃은
     * 다르다**: 저장본은 display:block 으로 가로 스크롤을 만들지만, 편집기 표를 block으로 바꾸면
     * ProseMirror의 셀 선택·표 조작이 어긋난다. 대신 table-layout:fixed 로 타이핑 중 열 폭이
     * 흔들리지 않게 고정한다.
     */
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 0 0 ${space[3]};
      font-size: ${font.size.sm};
    }

    th,
    td {
      border: 1px solid ${color.border};
      padding: ${space[2]} ${space[3]};
      text-align: left;
      vertical-align: top;

      /* 셀 내용은 Tiptap이 p 로 감싼다 — 문단 기본 여백이 셀 안에서 겹치지 않게 지운다. */
      & > p {
        margin: 0;
      }
    }

    th {
      background: ${color.surfaceSunken};
      color: ${color.text};
      font-weight: ${font.weight.semibold};
    }

    /* 표 조작 커맨드가 잡은 셀 범위 표시(ProseMirror table 플러그인이 붙이는 클래스). */
    .selectedCell {
      background: ${color.brandSubtle};
    }

    hr {
      margin: ${space[4]} 0;
      border: 0;
      border-top: 1px solid ${color.border};

      &.ProseMirror-selectednode {
        border-top-color: ${color.brand};
      }
    }

    &.is-editor-empty:first-of-type::before,
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: ${color.textMuted};
      float: left;
      height: 0;
      pointer-events: none;
    }

    & > *:last-child {
      margin-bottom: 0;
    }
  }
`;

export const LinkPopover = styled.div`
  position: relative;
  display: inline-flex;
`;

export const LinkForm = styled.form`
  position: absolute;
  top: calc(100% + ${space[1]});
  left: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[2]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};
`;

export const LinkInput = styled.input`
  height: 32px;
  width: 200px;
  max-width: 60vw;
  padding: 0 ${space[2]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;
