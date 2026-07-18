import type { ReactNode, RefObject } from 'react';

export type CommunityModalProps = {
  title: string;
  children?: ReactNode;
  /** 하단 액션 영역(버튼들). */
  actions?: ReactNode;
  /** 배경 클릭 또는 Esc로 닫기. */
  onClose: () => void;
  /**
   * 열릴 때 처음 포커스할 요소. 미전달이면 현행 동작(첫 포커서블 자동 포커스)이라 기존 호출부는 무영향.
   * 파괴적 다이얼로그(회원 탈퇴)에서 취소 버튼에 포커스를 주어 실수 실행을 막는 데 쓴다.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * 텍스트 정렬. 기본 `start`. `center`면 컨테이너에 text-align을 줘서
   * 제목·본문 텍스트가 상속으로 가운데 정렬된다(예: 로그인 모달).
   */
  align?: 'start' | 'center';
};
