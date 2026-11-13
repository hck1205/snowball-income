import type { FomcGuideRow } from '@/shared/lib/marketGuide';
import type { RowState } from '../GuideList';

export type FomcRowView = {
  readonly key: string;
  readonly date: string;
  readonly state: RowState;
  readonly title: string;
  /** "회의 1월 27~28일" — 괄호 속 요일은 날짜 블록이 이미 말하므로 뺀다. */
  readonly meeting: string;
  readonly kstLabel: string;
};

/** FOMC 목록 한 줄씩 — 지나지 않은 첫 회의가 "다음". 점도표가 나오는 회의는 제목이 말한다. */
export const buildFomcRowViews = (rows: readonly FomcGuideRow[]): FomcRowView[] => {
  const next = rows.find((row) => !row.past)?.decisionDate;
  return rows.map((row) => ({
    key: row.decisionDate,
    date: row.decisionDate,
    state: row.decisionDate === next ? 'next' : row.past ? 'past' : 'normal',
    title: row.withProjections ? 'FOMC 금리 결정 · 점도표' : 'FOMC 금리 결정',
    meeting: `회의 ${row.meetingLabel.replace(/\s*\([^)]*\)/g, '')}`,
    kstLabel: row.kstLabel
  }));
};
