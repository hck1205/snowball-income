import type { ReactNode } from 'react';

export type CommunityTopBarProps = {
  /** 우측 액션 슬롯 — 화면이 채운다(상세의 수정·삭제). 없으면 "← 목록"만 남는다. */
  actions?: ReactNode;
  /**
   * 스크롤을 따라오게 할지(2026-08-05 사용자 지시 — 긴 글에서 목록·수정·삭제가 화면 밖으로 나갔다).
   *
   * 🔴 **기본값이 `false` 인 이유**: 글쓰기 화면에는 이미 sticky 커맨드 바가 같은 기준선에 붙어 있어,
   * 여기까지 켜면 두 줄이 같은 자리에서 겹친다. 화면이 자기 사정을 알고 켜는 편이 안전하다.
   */
  sticky?: boolean;
};
