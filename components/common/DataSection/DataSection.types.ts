import type { ReactNode } from 'react';

export type DataSectionProps = {
  /** 섹션 제목. 밑줄 한 선 위에 서는 `<h2>` 로 나간다. */
  title: string;
  /** 제목 아래 한 줄. 이 섹션의 숫자를 어떻게 읽어야 하는지. */
  subtitle?: ReactNode;
  /** 제목 블록 **아래**, 본문 **위**의 한 줄(기준일·건수). */
  meta?: ReactNode;
  children: ReactNode;
};

/** `**굵게**` 만 해석하는 최소 문법. 마크다운 파서를 들이지 않는다. */
export type NoteListProps = {
  /** 각 항목은 `**앞머리**` 하나만 굵게 쓸 수 있다. */
  items: readonly string[];
  /** `brand` 면 브랜드 면(안내), 기본은 중립 면(자료의 한계). */
  tone?: 'neutral' | 'brand';
  /** 목록 위 제목. 없으면 목록만 그린다. */
  title?: string;
  /** 목록 앞에 놓일 본문 단락. */
  lead?: ReactNode;
  /** 목록 뒤에 놓일 것(출처 줄 등). */
  footer?: ReactNode;
};
