/** 12칸 리듬 한 줄. `months` 는 스냅샷에서 읽은 **실제** 지급 월이다(1~12, 오름차순·중복 없음). */
export type PayoutRhythmRow = {
  symbol: string;
  months: number[];
  /** 지급 월을 하나도 모르는 종목(스냅샷에 이력이 없음). 칸은 그리되 사유를 텍스트로 밝힌다. */
  isUnknown: boolean;
};
