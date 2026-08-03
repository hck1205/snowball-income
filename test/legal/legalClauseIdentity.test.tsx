import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LegalDocument } from '@/pages/Legal/components';
import type { LegalDocumentModel } from '@/pages/Legal/components';
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from '@/pages/Legal/copy';
import { splitLegalHeading } from '@/pages/Legal/utils';

/**
 * 조항 제목이 **화면 조립을 거쳐도 원문 그대로**인지 잠근다.
 *
 * 🔴 왜 필요한가. 판형을 문서형으로 바꾸면서 조항 제목은 더 이상 한 덩어리 문자열이 아니다 —
 * `splitLegalHeading` 이 `제10조` / 원문 공백 / `(책임의 제한)` 셋으로 가르고, 화면은 번호를 왼쪽
 * 기둥에 따로 세운다. 그런데 그 제목 문자열은 동시에 절의 **접근성 이름**이다
 * (`<section aria-labelledby>` 가 이 요소를 가리킨다). 가르는 규칙이 한 글자라도 어긋나면
 * 스크린리더가 읽는 조항 이름이 법무 원문과 달라진다 — 타입도, 스냅샷도 잡지 못하는 종류의 사고다.
 *
 * 기존 라우트 테스트는 조항 **두 개**의 이름만 못 박아 두었다. 여기서는 두 문서의 **모든 절**을
 * 원문(`copy/`)과 대조한다. 문언 개정으로 번호 형식이 바뀌면(예: `제 10 조`) 여기서 먼저 깨진다.
 *
 * 목차 항목 수도 함께 잠근다. 판형이 바뀌어도 **조항이 하나도 사라지지 않는다**는 것이
 * 이 화면의 유일한 절대 제약이라, 그 계약을 사람 눈이 아니라 테스트가 지키게 한다.
 */

const DOCUMENTS: readonly (readonly [string, LegalDocumentModel])[] = [
  ['개인정보처리방침', PRIVACY_DOCUMENT],
  ['이용약관', TERMS_DOCUMENT]
];

describe('법무 조항의 동일성', () => {
  it.each(DOCUMENTS)('%s — 번호와 제목을 이어 붙이면 원문 제목이 복원된다', (_label, model) => {
    for (const section of model.sections) {
      const { ordinal, gap, label } = splitLegalHeading(section.heading);

      expect(`${ordinal ?? ''}${gap}${label}`).toBe(section.heading);
    }
  });

  it.each(DOCUMENTS)('%s — 화면에 그린 절의 접근성 이름이 원문 제목과 같다', (_label, model) => {
    render(
      <MemoryRouter>
        <LegalDocument document={model} />
      </MemoryRouter>
    );

    for (const section of model.sections) {
      // getByRole 의 name 은 정확 일치(문자열)라, 한 글자만 달라져도 여기서 못 찾는다.
      expect(screen.getByRole('region', { name: section.heading })).toBeInTheDocument();
    }
  });

  it.each(DOCUMENTS)('%s — 목차가 절과 1:1 로 대응한다 (조항이 사라지지 않는다)', (_label, model) => {
    render(
      <MemoryRouter>
        <LegalDocument document={model} />
      </MemoryRouter>
    );

    const toc = screen.getByRole('navigation', { name: '조항 목차' });
    const entries = within(toc).getAllByRole('link');

    expect(entries).toHaveLength(model.sections.length);

    // 목차 링크의 이름은 **번호를 뗀 제목**이다(번호 span 은 aria-hidden — 겹쳐 읽지 않게).
    for (const section of model.sections) {
      const { label } = splitLegalHeading(section.heading);

      expect(within(toc).getByRole('link', { name: label })).toHaveAttribute(
        'href',
        `#${section.id}`
      );
    }
  });
});
