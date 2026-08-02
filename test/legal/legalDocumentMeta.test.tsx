import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LegalDocument } from '@/pages/Legal/components';
import type { LegalDocumentModel } from '@/pages/Legal/components';

/**
 * 법무 고지문 히어로의 **메타 줄**이 여러 개일 때도 서로 떨어져 나오는지 잠근다.
 *
 * 🔴 이 테스트가 유일한 증명이다. 지금 두 문서(`PRIVACY_DOCUMENT`·`TERMS_DOCUMENT`)는 메타가
 * 한 줄뿐이라 결함이 화면에 드러나지 않는다. 그런데 `MetaList` 는 `inline-flex` + `gap` 이고,
 * 항목을 텍스트 노드로 두면 flexbox 가 **연속된 텍스트 런을 하나의 익명 flex 아이템**으로 묶어
 * gap 이 적용될 경계가 사라진다. 시행일을 확정하며 메타가 두 줄이 되는 순간
 * `시행일: …최종 개정: …` 로 붙어 나온다 — 타입(`readonly string[]`)도, 라우트 테스트도 못 잡는다.
 *
 * jsdom 은 레이아웃을 계산하지 않으므로 "12px 떨어졌다"는 잴 수 없다. 대신 그 시각 처방이 성립할
 * **구조**를 본다: 각 줄이 자기 요소를 갖고(= 각자 flex 아이템), 한 요소가 두 줄을 통째로 갖지 않는다.
 */

const model: LegalDocumentModel = {
  documentTitle: '메타 두 줄 문서',
  title: '메타 두 줄 문서',
  lede: '메타가 두 줄인 경우를 위한 최소 모델입니다.',
  meta: ['시행일: 2026-08-05', '최종 개정: 2026-08-05'],
  sections: [
    {
      id: 'meta-fixture-section',
      heading: '1. 절',
      blocks: [{ kind: 'paragraph', text: '본문 한 줄.' }]
    }
  ]
};

describe('법무 고지문 메타 줄', () => {
  it('메타가 두 줄이면 각 줄이 자기 요소로 나온다 (텍스트 노드로 붙지 않는다)', () => {
    render(
      <MemoryRouter>
        <LegalDocument document={model} />
      </MemoryRouter>
    );

    const effective = screen.getByText('시행일: 2026-08-05');
    const revised = screen.getByText('최종 개정: 2026-08-05');

    // 각자 다른 요소이면서 같은 줄(같은 flex 컨테이너)에 있다 = gap 이 걸릴 경계가 있다.
    expect(effective).not.toBe(revised);
    expect(effective.parentElement).toBe(revised.parentElement);
    expect(within(effective).queryByText('최종 개정: 2026-08-05')).not.toBeInTheDocument();

    // 회귀의 지문 — 두 줄이 한 요소의 텍스트로 이어 붙으면 이 문자열이 잡힌다.
    expect(screen.queryByText('시행일: 2026-08-05최종 개정: 2026-08-05')).not.toBeInTheDocument();
  });
});
