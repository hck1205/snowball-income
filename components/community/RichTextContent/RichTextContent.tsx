import { useMemo } from 'react';
import { sanitizeRichHtml } from '@/shared/lib/richtext';
import { Prose } from './RichTextContent.styled';

export type RichTextContentProps = {
  html: string;
};

/**
 * 저장된 본문 HTML을 **sanitize 후** 렌더한다(XSS 경계).
 *
 * ⚠ dompurify에 정적으로 의존하므로 상세 청크에서만 import 한다(barrel 미포함).
 */
export default function RichTextContent({ html }: RichTextContentProps) {
  const safeHtml = useMemo(() => sanitizeRichHtml(html), [html]);
  if (!safeHtml) return null;
  return <Prose dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
