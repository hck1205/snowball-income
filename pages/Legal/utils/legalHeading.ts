/**
 * 조항 제목을 **번호와 제목으로 가른다.**
 *
 * 왜 문자열을 쪼개나 — 법무 문서의 위계는 번호가 만든다. `제10조 (책임의 제한)` 을 한 덩어리
 * 텍스트로 그리면 화면에는 "굵은 한 줄"이 열네 번 반복될 뿐이고, 읽는 사람은 지금 몇 번째 조항을
 * 보고 있는지 눈으로 셀 수 없다. 번호를 별도의 자리(왼쪽 여백 기둥)에 세우면 스크롤 중에도
 * 위치를 잃지 않는다.
 *
 * 🔴 **원문을 복원할 수 있어야 한다.** 조항 제목은 `<section aria-labelledby>` 가 가리키는 문자열,
 * 즉 그 절의 **접근성 이름**이다(가드: test/router/legalRoutes.test.tsx 가
 * `getByRole('region', { name: '12. 개인정보 보호책임자' })` 로 잠근다). 그래서 번호와 제목만
 * 돌려주지 않고 **사이에 있던 공백까지** 그대로 돌려준다 — 소비처가 `ordinal + gap + label` 로
 * 이어 붙이면 원문 그대로다. 공백을 상수로 적어 넣는 순간 어느 문서에선가 이름이 달라진다.
 *
 * 두 문서가 쓰는 번호 형식이 다르다.
 *  - 개인정보처리방침: `1.` ~ `14.` (번호 없는 개요 절이 하나 있다)
 *  - 이용약관:        `제1조` ~ `제13조` (번호 없는 `부칙` 이 하나 있다)
 * 둘 다 아닌 제목은 번호가 없는 것으로 본다 — 없는 번호를 지어내지 않는다.
 */

export type LegalHeadingParts = {
  /** `제10조` · `3.` — 번호가 없는 절(개요·부칙)은 `null`. */
  ordinal: string | null;
  /** 번호와 제목 사이의 **원문 공백**. 번호가 없으면 빈 문자열. */
  gap: string;
  /** 번호를 뗀 제목. 번호가 없으면 제목 전체. */
  label: string;
};

/** `제12조` 또는 `12.` 로 시작하고, 공백 뒤에 제목이 이어질 때만 번호로 인정한다. */
const ORDINAL_PATTERN = /^(제\s*\d+\s*조|\d+\.)(\s+)(\S[\s\S]*)$/;

export const splitLegalHeading = (heading: string): LegalHeadingParts => {
  const matched = ORDINAL_PATTERN.exec(heading);

  if (!matched) return { ordinal: null, gap: '', label: heading };

  return { ordinal: matched[1], gap: matched[2], label: matched[3] };
};
