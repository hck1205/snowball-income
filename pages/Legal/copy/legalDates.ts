/**
 * 두 법무 고지문(개인정보처리방침·이용약관)이 **함께 쓰는 날짜**.
 *
 * ## 🔴 시행일을 무엇으로 잡았나 (2026-08-09 사용자 결정)
 *
 * **서비스가 Hungry Hippo 라는 이름으로 공개된 날**로 잡았다. 이름을 바꾼 커밋은 `9f106b6`(2026-08-03)
 * 이지만 그날은 브랜치 안이었고, 이용자가 그 이름을 실제로 본 것은 PR #94 가 머지돼 배포된
 * **2026-08-07** 이다. 시행일은 *결정한 날*이 아니라 *효력이 생긴 날*이라 뒤쪽을 쓴다 — 아무도 볼 수
 * 없던 날짜를 시행일로 적으면 그 자체가 사실과 다른 고지다.
 *
 * ⚠ 지어내지 마라. 이 두 값은 각각 **git 이력으로 확인되는 날짜**여야 한다. 문서를 고칠 때마다
 *   `LEGAL_LAST_REVISED_DATE` 를 그날로 올리고, 시행일은 건드리지 않는다(시행일이 움직이면
 *   "언제부터 적용되는 방침인가"를 이용자가 알 수 없다).
 */

/** 서비스가 Hungry Hippo 로 공개된 날 = 두 문서의 시행일. */
export const LEGAL_EFFECTIVE_DATE = '2026-08-07';

/** 문서 본문을 마지막으로 고친 날. 문서를 고칠 때마다 함께 올린다. */
export const LEGAL_LAST_REVISED_DATE = '2026-08-09';

/**
 * `2026-08-07` → `2026년 8월 7일`.
 *
 * 🔴 `new Date(iso)` 로 파싱하지 않는다. 날짜만 있는 ISO 문자열은 **UTC 자정**으로 읽히고, 한국보다
 *    서쪽 시간대의 브라우저에서는 하루 앞의 날짜가 찍힌다 — 법적 고지에서 하루가 밀리는 종류의 결함은
 *    화면에 오류로 드러나지 않고 그냥 틀린 값이 그럴듯하게 보인다. 그래서 문자열만 자른다.
 */
export const formatLegalDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

/**
 * 히어로 메타 줄. 두 문서가 같은 줄을 쓴다 — 한쪽만 고쳐 두 문서의 날짜가 어긋나는 일을 막는다.
 *
 * ⚠ 항목마다 자기 요소가 필요하다(문자열 하나에 둘을 이어 붙이면 붙어 나온다) —
 *   근거·가드는 LegalDocument.styled.ts `MetaItem` 주석과 test/legal/legalDocumentMeta.test.tsx.
 */
export const LEGAL_DOCUMENT_META: readonly string[] = [
  `시행일: ${formatLegalDate(LEGAL_EFFECTIVE_DATE)}`,
  `최종 개정: ${formatLegalDate(LEGAL_LAST_REVISED_DATE)}`
];
