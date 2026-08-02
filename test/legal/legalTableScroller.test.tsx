import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LegalDocument } from '@/pages/Legal/components';
import { PRIVACY_DOCUMENT } from '@/pages/Legal/copy';

/**
 * 법무 고지문 안의 **가로 스크롤 표**가 키보드로 읽히는지에 대한 계약.
 *
 * 국외 이전 표는 7열이고 셀 값이 긴 한글이라 좁은 화면에서 반드시 옆으로 밀어야 한다. 그런데 표
 * 안에는 링크도 버튼도 없다 — **포커스 가능한 자손이 하나도 없으므로** 스크롤 상자 자신이 포커스를
 * 받지 못하면 잘린 열에 닿을 방법이 아예 없다(WCAG 2.1.1). Chrome 127+ 만 스크롤러를 기본
 * 포커서블로 만들고 Safari·구 Chrome 은 그렇지 않다 — `tabindex="0"` 이 그 차이를 메운다.
 *
 * 이름은 `<caption>` 을 `aria-labelledby` 로 **가리킨다**. 같은 문자열을 `aria-label` 로 한 번 더
 * 적으면 스크린리더가 영역 이름과 표 캡션으로 같은 제목을 두 번 읽는다.
 *
 * 역할이 `region` 인 것은 이 앱의 가로 스크롤 표 처방을 하나로 통일한 결과다
 * (형제: pages/DividendCalendar/.../ScheduleLegendTable — test/dividendCalendar/calendarLegendTable.behavior.test.tsx).
 */

const tableCaptions = PRIVACY_DOCUMENT.sections.flatMap((section) =>
  section.blocks.flatMap((block) => (block.kind === 'table' ? [block.caption] : []))
);

describe('법무 고지문의 가로 스크롤 표', () => {
  it('표마다 캡션으로 이름 붙은 스크롤 영역이 있고, 그 영역이 키보드 포커스를 받는다', () => {
    render(
      <MemoryRouter>
        <LegalDocument document={PRIVACY_DOCUMENT} />
      </MemoryRouter>
    );

    // 문서에 표가 있다는 전제 자체가 무너지면(카피 개정으로 표가 사라지면) 이 테스트는 의미가 없다.
    expect(tableCaptions.length).toBeGreaterThan(0);

    for (const caption of tableCaptions) {
      const region = screen.getByRole('region', { name: caption });

      expect(region).toHaveAttribute('tabindex', '0');
      // 이름은 캡션 요소를 가리켜서 얻는다 — 같은 문자열을 aria-label 로 중복해 적지 않는다.
      expect(region).not.toHaveAttribute('aria-label');
      expect(document.getElementById(region.getAttribute('aria-labelledby') ?? '')?.tagName).toBe(
        'CAPTION'
      );
    }
  });
});
