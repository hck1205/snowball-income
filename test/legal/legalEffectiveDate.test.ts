import { describe, expect, it } from 'vitest';
import {
  LEGAL_DOCUMENT_META,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_REVISED_DATE,
  PRIVACY_DOCUMENT,
  TERMS_DOCUMENT,
  formatLegalDate
} from '@/pages/Legal/copy';
import type { LegalDocumentModel } from '@/pages/Legal/components';

/**
 * 법무 고지문의 **시행일**.
 *
 * 🔴 시행일은 "이 방침이 언제부터 적용되는가"를 말하는 자리다. 두 문서가 서로 다른 날짜를 말하거나,
 *    `[확인 필요: …]` 자리표시자가 그대로 배포되면 **고지 자체가 성립하지 않는다** — 화면은 멀쩡히
 *    그려지고 타입도 통과하므로 사람이 보기 전에는 아무도 못 잡는다. 그래서 여기서 잠근다.
 *
 * ⚠ 날짜 값 자체(2026-08-07)는 여기서 검증하지 않는다. 그건 사실이지 계약이 아니고, 근거는
 *   legalDates.ts 주석에 있다. 여기서 보는 것은 **형태와 일관성**이다.
 */

/** 문서 안의 모든 문장을 한 줄씩 펴서 본다 — 자리표시자가 어느 블록에 숨어 있든 걸리게. */
const textsOf = (document: LegalDocumentModel): string[] =>
  document.sections.flatMap((section) =>
    section.blocks.flatMap((block) => {
      if (block.kind === 'paragraph') return [block.text];
      if (block.kind === 'list') return [...block.items];
      if (block.kind === 'table') return block.rows.flatMap((row) => [...row]);
      return [];
    })
  );

const DOCUMENTS = [
  ['개인정보처리방침', PRIVACY_DOCUMENT],
  ['이용약관', TERMS_DOCUMENT]
] as const;

describe('🔴 시행일이 실제 날짜로 확정돼 있다', () => {
  it.each(DOCUMENTS)('%s — 자리표시자가 남아 있지 않다', (_label, document) => {
    const everything = [...document.meta, document.lede, ...textsOf(document)];

    expect(everything.filter((line) => line.includes('시행일 — 실제 게시일'))).toEqual([]);
  });

  it.each(DOCUMENTS)('%s — 히어로에 시행일과 최종 개정일이 함께 있다', (_label, document) => {
    expect(document.meta).toEqual(LEGAL_DOCUMENT_META);
    expect(document.meta).toHaveLength(2);
  });

  it('두 문서가 같은 날짜를 말한다 — 한쪽만 고쳐 어긋나는 것을 막는다', () => {
    expect(PRIVACY_DOCUMENT.meta).toEqual(TERMS_DOCUMENT.meta);
  });

  it('⭐ 약관 부칙이 시행일을 문장으로도 적는다 — 히어로 한 줄에만 있으면 인쇄본에서 사라진다', () => {
    const addendum = TERMS_DOCUMENT.sections.find((section) => section.id === 'terms-addendum');

    expect(textsOf({ ...TERMS_DOCUMENT, sections: addendum ? [addendum] : [] }).join(' ')).toContain(
      formatLegalDate(LEGAL_EFFECTIVE_DATE)
    );
  });

  it('⭐ 방침 변경 절이 제정일과 개정일을 함께 적는다', () => {
    const changes = PRIVACY_DOCUMENT.sections.find((section) => section.id === 'privacy-changes');
    const text = textsOf({ ...PRIVACY_DOCUMENT, sections: changes ? [changes] : [] }).join(' ');

    expect(text).toContain(formatLegalDate(LEGAL_EFFECTIVE_DATE));
    expect(text).toContain(formatLegalDate(LEGAL_LAST_REVISED_DATE));
    /* 개정일을 적는 순간 "이전 버전은 없습니다"는 자기모순이다. */
    expect(text).not.toContain('이전 버전은 없습니다');
  });
});

describe('날짜 표기', () => {
  it('🔴 시간대에 밀리지 않는다 — `new Date(iso)` 는 UTC 자정으로 읽혀 하루가 어긋난다', () => {
    expect(formatLegalDate('2026-08-07')).toBe('2026년 8월 7일');
    expect(formatLegalDate('2026-01-01')).toBe('2026년 1월 1일');
    expect(formatLegalDate('2026-12-31')).toBe('2026년 12월 31일');
  });

  it('앞의 0 을 떼고 읽는다 — "08월 07일" 은 고지문의 말투가 아니다', () => {
    expect(formatLegalDate(LEGAL_EFFECTIVE_DATE)).not.toContain('0월');
    expect(formatLegalDate(LEGAL_EFFECTIVE_DATE)).toMatch(/^\d{4}년 \d{1,2}월 \d{1,2}일$/);
  });

  it('개정일이 시행일보다 앞서지 않는다', () => {
    expect(LEGAL_LAST_REVISED_DATE >= LEGAL_EFFECTIVE_DATE).toBe(true);
  });
});
