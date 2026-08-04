/**
 * `**굵게**` 한 문법만 해석하는 최소 분해기.
 *
 * 🔴 마크다운 파서를 들이지 않는 이유: 여기서 필요한 강조는 문장 앞머리 한 덩어리뿐이고,
 * 입력은 **우리가 쓴 카피 상수**다(사용자 입력이 아니다). 파서를 붙이면 자료 화면 셋 때문에
 * 파싱 라이브러리가 번들에 실린다. `dangerouslySetInnerHTML` 도 쓰지 않는다 — 조각 배열로 낸다.
 *
 * 홀수 인덱스가 강조 조각이다(`String.split` 이 캡처 그룹을 사이사이에 끼워 넣는 성질).
 * ⚠ 짝이 안 맞는 `**` 는 강조로 치지 않고 글자 그대로 남는다 — 카피 오타가 화면을 깨뜨리지 않는다.
 */
export type NoteChunk = { readonly text: string; readonly strong: boolean };

export const splitEmphasis = (text: string): NoteChunk[] => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts
    .map((chunk, index) => ({ text: chunk, strong: index % 2 === 1 }))
    .filter((chunk) => chunk.text.length > 0);
};
