import type { RefObject } from 'react';

export type ScrollTopButtonProps = {
  /**
   * 맨 위로 이동한 **뒤 포커스를 넘길 요소**(글 상세에서는 제목 `h1` + `tabIndex={-1}`).
   *
   * 옵셔널이 아닌 이유: 버튼은 이동 직후 임계 아래로 내려가 **스스로 사라진다**. 포커스를 그대로 두면
   * 키보드 사용자는 사라진 요소에 남아 다음 Tab이 문서 어디서 시작될지 알 수 없다. "포커스를 어디에
   * 둘 것인가"는 이 부품을 쓰는 화면이 반드시 답해야 하는 질문이라 프롭으로 강제한다.
   */
  focusRef: RefObject<HTMLElement>;
};
