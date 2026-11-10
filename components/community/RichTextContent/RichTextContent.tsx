import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RichTextChart } from '@/components/community/RichTextChart';
import { parseRichChartTable, sanitizeRichHtml, type RichChartData } from '@/shared/lib/richtext';
import { Prose } from './RichTextContent.styled';

export type RichTextContentProps = {
  html: string;
};

type ChartSlot = { readonly host: HTMLElement; readonly data: RichChartData };

/** 차트 자리 표식. 본문 스타일(`Prose`)이 이 자리의 간격을 잡는다. */
export const RICH_CHART_SLOT_ATTR = 'data-rich-chart';

/**
 * 저장된 본문 HTML을 **sanitize 후** 렌더한다(XSS 경계).
 *
 * ⚠ dompurify에 정적으로 의존하므로 상세 청크에서만 import 한다(barrel 미포함).
 *
 * ## 표 차트(2026-11-09)
 * `<table data-chart="bar|line">` 이 있으면 그 표 **바로 앞에** 차트를 덧그린다. 표는 그대로 남는다.
 * 🔴 본문 DOM 을 조각내지 않는다 — 본문 스타일이 직계 자식 선택자(`& > p:first-of-type` 리드 문단,
 *   `* + h2` 간격)에 기대고 있어, 조각내면 **차트가 없는 기존 글의 모양까지** 바뀐다. 대신 그려진 본문 안에
 *   빈 자리(div)를 끼워 넣고 차트를 포털로 그린다. 차트 표가 없으면 아무 일도 하지 않는다.
 */
export default function RichTextContent({ html }: RichTextContentProps) {
  const safeHtml = useMemo(() => sanitizeRichHtml(html), [html]);
  const rootRef = useRef<HTMLElement | null>(null);
  const [slots, setSlots] = useState<ChartSlot[]>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !safeHtml.includes('data-chart')) {
      setSlots((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const created: ChartSlot[] = [];
    root.querySelectorAll('table[data-chart]').forEach((table) => {
      const data = parseRichChartTable(table);
      if (!data) return;
      const host = document.createElement('div');
      host.setAttribute(RICH_CHART_SLOT_ATTR, '');
      table.before(host);
      created.push({ host, data });
    });
    setSlots(created);

    return () => {
      for (const slot of created) slot.host.remove();
    };
  }, [safeHtml]);

  if (!safeHtml) return null;
  return (
    <>
      <Prose ref={rootRef} dangerouslySetInnerHTML={{ __html: safeHtml }} />
      {slots.map((slot, index) => createPortal(<RichTextChart data={slot.data} />, slot.host, `rich-chart-${index}`))}
    </>
  );
}
