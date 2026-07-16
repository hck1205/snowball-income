import type { ReactNode } from 'react';

export type CommunityModalProps = {
  title: string;
  children?: ReactNode;
  /** 하단 액션 영역(버튼들). */
  actions?: ReactNode;
  /** 배경 클릭 또는 Esc로 닫기. */
  onClose: () => void;
  /**
   * 텍스트 정렬. 기본 `start`. `center`면 컨테이너에 text-align을 줘서
   * 제목·본문 텍스트가 상속으로 가운데 정렬된다(예: 로그인 모달).
   */
  align?: 'start' | 'center';
};
