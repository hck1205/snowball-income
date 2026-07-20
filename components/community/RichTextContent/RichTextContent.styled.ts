import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 본문 프로즈 스타일. sanitize 허용 태그(p/br/h2/h3/ul/ol/li/a/strong/b/em/i/s/u/blockquote/code/pre/hr)만 다룬다.
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

  & > *:last-child {
    margin-bottom: 0;
  }
`;
