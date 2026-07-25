// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { Footer } from '../../PdfReportDocument.styled';
import type { PdfPageFooterProps } from './PdfPageFooter.types';

/** 모든 페이지 하단에 반복되는 브랜드명 · 페이지 번호. 5개 페이지 컴포넌트가 공유한다. */
function PdfPageFooter({ title, label }: PdfPageFooterProps) {
  return (
    <Footer>
      <span>스노우볼 인컴 · {title}</span>
      <span>{label}</span>
    </Footer>
  );
}

export default PdfPageFooter;
