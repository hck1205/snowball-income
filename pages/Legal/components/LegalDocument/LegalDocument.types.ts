/**
 * 법무 고지문(개인정보처리방침·이용약관)의 **표현 모델**.
 *
 * 두 문서는 성격이 같다 — 조문 번호가 붙은 절이 쌓이고, 그 안에 문단·목록·표가 섞인다. 그래서
 * 화면(`LegalDocument`)은 하나만 만들고 내용은 데이터로 넣는다. 문서를 JSX 로 직접 쓰지 않는 이유:
 *
 *  1. 개정이 잦은 글이라 **문장만 고치는 변경**이 마크업 변경과 섞이면 diff 에서 무엇이 바뀌었는지
 *     읽히지 않는다. 법무 문서는 "무엇이 바뀌었나"가 곧 고지 의무의 대상이다.
 *  2. 카피 어미 가드(`test/shared/copyTone.test.ts`)가 소스의 문자열을 훑는다 — 문장이 상수 파일에
 *     모여 있어야 검사와 검수(사람이 읽는 교정) 둘 다 한 파일에서 끝난다.
 *
 * 🔴 이 모델은 **표현만** 담는다. 여기에 "동의 여부" 같은 상태를 얹지 마라 — 지금 두 문서는 읽기
 *    전용 고지이고, 동의 절차가 생기면 그건 별도의 흐름(가입 단계)이 소유해야 한다.
 */

/** 절 안에 들어가는 내용 조각. 한 절은 이 블록들을 순서대로 쌓는다. */
export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] }
  /**
   * 표. `caption` 은 장식이 아니라 **접근성 요구**다 — 국외 이전·보유 기간처럼 표가 여럿인 문서에서
   * 스크린리더 사용자가 표를 구별할 유일한 단서다(시각적으로도 표 제목으로 쓰인다).
   */
  | { kind: 'table'; caption: string; columns: readonly string[]; rows: readonly (readonly string[])[] }
  /** 이름-값 쌍(보호책임자 등). 정의 목록(dl)으로 그린다. */
  | { kind: 'definitions'; items: readonly { term: string; description: string }[] };

export type LegalSection = {
  /** 제목과 본문을 잇는 id(`aria-labelledby`). 문서 안에서 고유해야 한다. */
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocumentModel = {
  /** 브라우저 탭 제목(`document.title`). */
  documentTitle: string;
  /** 화면의 유일한 h1. */
  title: string;
  /** 히어로 도입 문단. */
  lede: string;
  /** 시행일 등 문서 메타 — 히어로 아래 한 줄로 나열된다. */
  meta: readonly string[];
  sections: readonly LegalSection[];
};

/**
 * 문서 끝에서 가리키는 **다른 법무 문서**.
 *
 * 이 두 화면은 공용 `PageFooter` 를 그리지 않는다(그 푸터가 바로 이 두 문서로 가는 링크를 갖고 있어
 * 자기 자신으로 가는 링크가 생긴다). 그래서 다 읽은 사람에게는 **나갈 길이 헤더뿐**이었다.
 * 문서 끝의 이 안내가 그 자리를 대신한다 — 자기 자신이 아니라 **형제 문서**를 가리키므로 자기 링크
 * 문제도 생기지 않는다.
 *
 * 🔴 모델(`LegalDocumentModel`)이 아니라 **props** 로 받는다. 문서 내용이 아니라 화면 사이의 배치이고,
 *    모델에 넣으면 카피 파일이 라우트 구조를 알게 된다(개정마다 링크를 함께 검수해야 한다).
 */
export type LegalRelatedDocument = {
  /** 형제 문서의 경로. 예: `/terms`. */
  to: string;
  /** 형제 문서의 제목. 예: `이용약관`. */
  title: string;
  /** 그 문서가 무엇을 정하는지 한 줄. 법적 주장이 아니라 길 안내 문장이다. */
  summary: string;
};

export type LegalDocumentProps = {
  document: LegalDocumentModel;
  /** 없으면 문서 끝 안내에서 형제 문서 줄만 빠진다(홈으로 가는 길은 남는다). */
  related?: LegalRelatedDocument;
};
