import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { CALENDAR_SKELETON_MONTHS } from './MonthBoard.utils';
import { BoardList, MonthBody, MonthHead, MonthItem, MonthLabel, SkeletonBlock } from './MonthBoard.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 저장된 선택을 불러오는 동안의 골격. 월 라벨은 **진짜 텍스트**로 두고 칩 자리만 회색 블록이다
 * (12칸 리듬이 먼저 자리를 잡아야 로딩이 끝났을 때 화면이 튀지 않는다).
 * 상태 안내는 라이브 리전이 읽으므로 블록 자체는 접근성 트리에서 감춘다.
 */
export default function MonthBoardSkeleton() {
  return (
    <BoardList aria-hidden>
      {CALENDAR_SKELETON_MONTHS.map((month) => (
        <MonthItem key={month} $paying={false} $current={false}>
          <MonthHead>
            <MonthLabel>{copy.board.monthLabel(month)}</MonthLabel>
          </MonthHead>
          <MonthBody>
            <SkeletonBlock />
            <SkeletonBlock />
          </MonthBody>
        </MonthItem>
      ))}
    </BoardList>
  );
}
