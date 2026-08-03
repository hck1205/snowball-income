import type { ReactNode } from 'react';

export type FeedMastheadProps = {
  /** 금색 소제목 — 이 목록이 속한 축("커뮤니티"). 제목보다 먼저 읽히지만 무게는 가장 가볍다. */
  eyebrow: string;
  /** 이 화면의 이름. 목록 화면의 문서 제목이므로 기본 `h1`. */
  title: string;
  /** 한 문장 리드. 무엇을 고르는 지면인지 말한다. */
  lead: string;
  /** 문서 개요에 맞춰 고른다. 목록 인덱스는 `h1`. */
  titleAs?: 'h1' | 'h2';
  /** 주 행동(글쓰기) 라벨. */
  actionLabel: string;
  /** 주 행동 아이콘. 라벨과 함께 읽힌다(아이콘 단독 금지). */
  actionIcon?: ReactNode;
  onAction: () => void;
};
