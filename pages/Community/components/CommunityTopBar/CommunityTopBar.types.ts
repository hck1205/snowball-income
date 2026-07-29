import type { ReactNode } from 'react';

export type CommunityTopBarProps = {
  /** 우측 액션 슬롯 — 화면이 채운다(상세의 수정·삭제). 없으면 "← 목록"만 남는다. */
  actions?: ReactNode;
};
