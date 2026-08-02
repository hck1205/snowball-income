import styled from '@emotion/styled';
import { color, font, radius, space, subtleScrollbar } from '@/shared/styles';

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
  /*
   * 🔴 본문이 페이지 폭을 넓히지 못하게 하는 마개.
   * 아래 table 이 GitHub 레시피(display:block + width:max-content + max-width:100%)를 쓰는데,
   * 퍼센트 max-width 는 내재 크기(min/max-content) 계산에서 무시된다 — 그래서 이 요소의 min-content
   * 기여가 표의 max-content(실측 534px)가 되고, 조상 grid 의 auto 트랙이 그 값으로 부풀어
   * 문서 전체가 뷰포트보다 넓어진다(390px 뷰포트에서 문서 592px 실측 → 뷰포트 폭인 sticky 헤더가
   * 가로 스크롤에 잘려 상단 메뉴가 화면 밖으로 나갔다).
   * 여기서 0 으로 끊으면 표는 설계대로 자기 안에서만 스크롤한다.
   */
  min-width: 0;

  p {
    margin: 0 0 ${space[4]};
    /*
     * 🔴 **글줄 길이 상한**(2026-08-02). 커뮤니티 카드가 앱 공통 1160px 로 넓어지면서 산문이
     * 그대로 한 줄 140자에 가까워졌다 — 그 길이에서는 줄을 바꿀 때 눈이 다음 줄 첫 글자를 잃는다.
     *
     * 상한을 **문단에만** 건다. 카드·표·이미지·코드블록은 넓은 폭을 그대로 쓰는 게 이득이고,
     * 좁히면 표가 불필요하게 스크롤된다. 즉 "카드는 넓게, 읽는 줄만 짧게"다.
     * 단위가 'ch' 인 이유: 폰트 크기가 바뀌어도 글자 수 기준이 유지된다.
     */
    max-width: 72ch;
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
    ${subtleScrollbar}

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
    ${subtleScrollbar}
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
