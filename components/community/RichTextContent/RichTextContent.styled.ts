import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 본문 프로즈 스타일. 허용 태그(p/h2/h3/ul/ol/li/a/strong/em/blockquote/code/pre)만 다룬다. */
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

  strong {
    font-weight: ${font.weight.bold};
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
