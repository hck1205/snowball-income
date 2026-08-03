import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, subtleScrollbar, zIndex } from '@/shared/styles';

/**
 * ── 본문 에디터 (2026-08-03 리워크) ─────────────────────────────────────────
 *
 * 툴바가 **버튼 16개가 세로선으로만 갈린 한 줄**이었다. 좁은 화면에서 줄이 바뀌면 어느 버튼이
 * 어느 묶음인지 사라졌고, 세로선은 버튼 사이 여백과 굵기가 비슷해 구분 역할을 거의 못 했다.
 *
 * 지금은 **세그먼트**다: 묶음마다 자기 면(가라앉은 타일)을 갖고, 그 안에서 버튼이 붙어 선다.
 * 줄이 바뀌어도 묶음이 통째로 넘어가므로 구조가 유지된다. 세로 구분선은 사라졌다 —
 * 면 자체가 구분이라 선을 겹쳐 그을 이유가 없다(장식이었지 기능이 아니다).
 *
 * 편집 중 본문 타이포는 저장 후 렌더(`RichTextContent.styled.ts`)와 **같은 값**을 쓴다 —
 * WYSIWYG 괴리를 줄이는 게 이 파일의 두 번째 일이다. 저쪽을 고치면 여기도 함께 고쳐라.
 */

export const EditorShell = styled.div`
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  overflow: hidden;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.brand};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};
`;

/**
 * 버튼 묶음(서식 / 문단 / 목록 / 삽입 / 이력) = 가라앉은 타일 한 장.
 * 🔴 묶음이 통째로 줄바꿈되도록 자체 `flex-wrap` 은 끈다 — 켜 두면 타일 안에서 버튼이 갈라져
 * 세그먼트의 의미가 사라진다(묶음째 다음 줄로 넘어가는 편이 읽힌다).
 */
export const ToolbarGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const ToolbarButton = styled.button<{ active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 ${space[2]};
  border-radius: ${radius.sm};
  border: 0;
  /* 활성은 **면색 반전**으로 말한다 — 가라앉은 타일 위에 뜬 흰 칩이라 형태로도 읽힌다. */
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  box-shadow: ${({ active }) => (active ? shadow.e1 : 'none')};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  cursor: pointer;
  font-size: ${font.size.sm};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.semibold)};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/**
 * 표 조작 버튼 묶음. 커서가 표 안일 때만 렌더되는 **컨텍스트 행**이라, 나타나고 사라질 때 위쪽
 * 툴바 버튼들의 줄바꿈을 흔들지 않도록 `flex: 1 0 100%`로 항상 자기 줄을 차지한다.
 * 여기서는 라벨이 글자라 버튼이 넓다 — 묶음 안에서 wrap 을 허용한다(세그먼트 규칙의 예외).
 */
export const TableContextGroup = styled.div`
  display: flex;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin-top: ${space[1]};
  padding: 2px;
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const ToolbarDivider = styled.span`
  width: 1px;
  height: 20px;
  background: ${color.border};
  margin: 0 ${space[1]};
`;

export const EditorArea = styled.div`
  .ProseMirror {
    /* 본문이 화면의 주인공이다 — 240px 은 "입력칸"의 높이였지 "지면"의 높이가 아니었다. */
    min-height: clamp(320px, 44vh, 560px);
    padding: clamp(${space[4]}, 3vw, ${space[6]});
    outline: none;
    color: ${color.text};
    font-size: ${font.size.lg};
    line-height: 1.75;

    p {
      margin: 0 0 ${space[4]};
    }

    h2 {
      font-size: clamp(${font.size['3xl']}, 2.6vw, ${font.size['4xl']});
      font-weight: ${font.weight.bold};
      line-height: ${font.leading.tight};
      letter-spacing: -0.02em;
      margin: 0 0 ${space[3]};
    }

    /* 저장본(RichTextContent)의 절 머리 표식과 같은 28x4px 막대 — 편집 중에도 같은 모양이 보인다. */
    h2::before {
      content: '';
      display: block;
      width: 28px;
      height: 4px;
      margin-bottom: ${space[3]};
      border-radius: ${radius.pill};
      background: ${color.brand};
    }

    /* 저장본과 같은 절 표식 — h3 는 아래 hairline(굵은 본문과 헷갈리지 않게). */
    h3 {
      font-size: ${font.size['2xl']};
      font-weight: ${font.weight.bold};
      line-height: ${font.leading.snug};
      letter-spacing: -0.01em;
      margin: 0 0 ${space[3]};
      padding-bottom: ${space[2]};
      border-bottom: 1px solid ${color.border};
    }

    ul,
    ol {
      padding-left: ${space[6]};
      margin: 0 0 ${space[4]};
    }

    li {
      margin: ${space[2]} 0;
    }

    a {
      color: ${color.brandText};
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* 저장 후 렌더와 같은 풀 인용 — 회색으로 죽이지 않는다. */
    blockquote {
      margin: 0 0 ${space[5]};
      padding: ${space[1]} 0 ${space[1]} ${space[6]};
      border-left: 2px solid ${color.borderStrong};
      color: ${color.text};
      font-size: ${font.size.xl};
      font-weight: ${font.weight.medium};
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.88em;
      background: ${color.surfaceSunken};
      border: 1px solid ${color.border};
      padding: 1px ${space[1]};
      border-radius: ${radius.xs};
    }

    pre {
      margin: 0 0 ${space[5]};
      padding: ${space[5]};
      background: ${color.surfaceSunken};
      border: 1px solid ${color.border};
      border-radius: ${radius.lg};
      overflow-x: auto;
      font-size: ${font.size.base};
      ${subtleScrollbar}

      code {
        background: none;
        border: 0;
        padding: 0;
      }
    }

    /*
     * 편집 중 표. 저장 후 렌더와 괘선 어휘(가로선만)를 맞추되 **레이아웃은 다르다**:
     * 저장본은 display:block 으로 가로 스크롤을 만들지만, 편집기 표를 block 으로 바꾸면
     * ProseMirror 의 셀 선택·표 조작이 어긋난다. 대신 table-layout:fixed 로 타이핑 중 열 폭이
     * 흔들리지 않게 고정한다.
     */
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 0 0 ${space[5]};
      font-size: ${font.size.base};
    }

    th,
    td {
      border: 0;
      border-bottom: 1px solid ${color.border};
      padding: ${space[3]} ${space[4]};
      text-align: left;
      vertical-align: top;

      /* 셀 내용은 Tiptap 이 p 로 감싼다 — 문단 기본 여백이 셀 안에서 겹치지 않게 지운다. */
      & > p {
        margin: 0;
      }
    }

    th {
      border-bottom: 2px solid ${color.borderStrong};
      color: ${color.textSecondary};
      font-size: ${font.size.xs};
      font-weight: ${font.weight.semibold};
      letter-spacing: 0.04em;
    }

    /* 표 조작 커맨드가 잡은 셀 범위 표시(ProseMirror table 플러그인이 붙이는 클래스). */
    .selectedCell {
      background: ${color.brandSubtle};
    }

    hr {
      width: 48px;
      height: 4px;
      margin: 0 auto ${space[8]};
      border: 0;
      color: ${color.textMuted};
      background-image: radial-gradient(circle, currentColor 1.5px, transparent 1.6px);
      background-size: 16px 4px;
      background-repeat: repeat-x;

      &.ProseMirror-selectednode {
        color: ${color.brand};
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

    /* 저장본(RichTextContent)과 같은 절 간격 규칙 — 앞 형제가 있을 때만 쉰다. */
    * + h2,
    * + hr {
      margin-top: ${space[12]};
    }

    * + h3,
    * + blockquote,
    * + pre,
    * + table {
      margin-top: ${space[8]};
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
  top: calc(100% + ${space[2]});
  left: 0;
  /*
   * 🔴 5 였는데 글쓰기 커맨드 바가 sticky(zIndex.stickyAction = 10)로 올라오면서 그 아래로 깔렸다.
   * 툴바가 커맨드 바에 가려지는 위치까지 스크롤한 뒤 링크를 열면 팝오버가 통째로 숨는다.
   * dropdown(20) 은 "떠 있는 작은 패널" 층이고 헤더(30)보다는 낮아 올바른 자리다.
   */
  z-index: ${zIndex.dropdown};
  display: flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[2]};
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};

  /* 팝오버의 [적용]·[제거]는 세그먼트 타일 밖이라 자기 테두리가 없으면 면 위에서 사라진다. */
  button {
    border: 1px solid ${color.border};
    background: ${color.surface};
    color: ${color.text};
  }
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
