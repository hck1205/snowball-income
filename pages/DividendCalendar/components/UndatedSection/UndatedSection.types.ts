import type { ExpectedPayout } from '../../utils';

export type UndatedSectionProps = {
  /** 그 달 지급 예정이지만 날짜를 추정할 수 없는 종목들. 0건이면 아무것도 렌더하지 않는다. */
  items: ExpectedPayout[];
};
