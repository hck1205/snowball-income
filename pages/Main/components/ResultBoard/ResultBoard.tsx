import { memo } from 'react';
import { BoardBody, BoardHeader, BoardNotices, BoardRoot } from './ResultBoard.styled';
import type { ResultBoardProps } from './ResultBoard.types';

/**
 * 결과 영역을 **문서 하나로** 묶는 틀. 배치만 하고 상태·계측은 갖지 않는다.
 *
 * 구조: 머리(시나리오 탭) → 알림(공유 실패·프리필) → 본문(결과 격자).
 *
 * 🔴 캡처 루트는 여전히 **본문 안쪽의 격자**다(`MainResultGrid`). 머리와 알림은 결과 이미지에
 *    들어가지 않는다 — 탭 이름과 안내 문구는 그 이미지를 받는 사람에게 아무 뜻도 없다.
 */
function ResultBoardComponent({ header, notices, children }: ResultBoardProps) {
  return (
    <BoardRoot aria-label="시뮬레이션 결과">
      {header ? <BoardHeader>{header}</BoardHeader> : null}
      <BoardNotices>{notices}</BoardNotices>
      <BoardBody>{children}</BoardBody>
    </BoardRoot>
  );
}

const ResultBoard = memo(ResultBoardComponent);

export default ResultBoard;
