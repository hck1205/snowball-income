import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 본문 프로즈 스타일. sanitize 허용 태그(p/br/h2/h3/ul/ol/li/a/strong/b/em/i/s/u/blockquote/code/pre/hr/
 * table/tbody/tr/th/td)만 다룬다.
 * 허용 목록(shared/lib/richtext/sanitize.ts)에 태그를 추가하면 여기 렌더 스타일도 함께 채워야 한다 —
 * 안 그러면 브라우저 기본 스타일로 떨어져 본문 톤이 깨진다.
 */
export const Prose = styled.article`
  color: ${color.text};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  word-break: break-word;
  overflow-wrap: anywhere;

  p {
    margin: 0 0 ${space[4]};
  }

  h2 {
    margin: ${space[6]} 0 ${space[3]};
    font-size: ${font.size.xl};
    font-weight: ${font.weight.bold};
    line-height: ${font.leading.snug};
  }

  h3 {
    margin: ${space[5]} 0 ${space[2]};
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
    line-height: ${font.leading.snug};
  }

  ul,
  ol {
    margin: 0 0 ${space[4]};
    padding-left: ${space[6]};
  }

  li {
    margin: ${space[1]} 0;
  }

  a {
    color: ${color.brandText};
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: ${color.brand};
    }
  }

  strong,
  b {
    font-weight: ${font.weight.bold};
  }

  u {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  s {
    text-decoration: line-through;
    color: ${color.textSecondary};
  }

  hr {
    margin: ${space[6]} 0;
    border: 0;
    border-top: 1px solid ${color.border};
  }

  blockquote {
    margin: 0 0 ${space[4]};
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
    margin: 0 0 ${space[4]};
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
   * 표. 좁은 화면에서 표만 가로 스크롤되게 한다.
   *
   * ⚠ 저장 HTML은 editor.getHTML() 산출물이라 에디터 DOM에 있던 .tableWrapper div가 **없다**
   * (실측 확인). Prose는 styled.article 하나뿐이라 스타일만으로 래퍼를 만들 수도 없다.
   * 그래서 GitHub 마크다운과 같은 레시피로 **표 자신을 블록으로 만들어** 스크롤 컨테이너로 쓴다.
   */
  table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    scrollbar-color: ${color.borderStrong} transparent;
    border-collapse: collapse;
    margin: 0 0 ${space[4]};
    font-size: ${font.size.sm};
    ${font.numeric};
  }

  th,
  td {
    border: 1px solid ${color.border};
    padding: ${space[2]} ${space[3]};
    text-align: left;
    vertical-align: top;

    /* Tiptap이 셀 내용을 p 로 감싼다 — 문단 기본 여백이 셀 안에서 겹치지 않게 지운다. */
    & > p {
      margin: 0;
    }
  }

  /* 헤더 강조는 면색 + 굵기 2중(색만으로 전달하지 않는다). */
  th {
    background: ${color.surfaceSunken};
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }

  & > *:last-child {
    margin-bottom: 0;
  }
`;
