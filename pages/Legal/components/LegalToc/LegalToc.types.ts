export type LegalTocEntry = {
  /** 조항 제목 요소의 id. 링크의 `href`(`#id`)이자 스크롤 대상이다. */
  id: string;
  /** `제10조` · `3.` — 번호가 없는 절은 `null`. */
  ordinal: string | null;
  /** 번호를 뗀 제목. 링크의 **접근성 이름**이 된다(번호는 aria-hidden 이다). */
  label: string;
};

export type LegalTocProps = {
  entries: readonly LegalTocEntry[];
  /** 지금 읽고 있는 조항의 id. `null`이면 아무것도 강조하지 않는다. */
  activeId: string | null;
};
