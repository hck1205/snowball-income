/**
 * 배당 목록 갱신의 **멤버십 변화** 판정 — 순수 함수(파일·git 없음).
 *
 * ## 🔴 왜 생겼나 (2026-11-06)
 * `refresh-dividend-lists.yml` 은 늘 "사람 확인 필요" PR 을 열고 멈췄다. 멤버십 변화(배당킹에서 한
 * 종목이 빠지는 것)는 사람이 봐야 하는 **사건**이라는 판단이었고, 그 판단은 맞다. 그런데 2026-11-05 에
 * 이 워크플로가 매달 **배당률도** 다시 재게 되면서(metrics.ts), 멤버십이 그대로인 달에도 값이 바뀌어
 * 매번 PR 이 열린다. 사람이 머지하지 않으면 배당률이 다시 멈춘다 — 유니버스 PR 이 석 달 쌓여 지표가
 * 8월에 멈춘 것과 같은 길이다.
 * 그래서 **멤버십이 그대로면 자동 머지**하고, 바뀐 달에만 사람을 부른다.
 *
 * 멤버십 = 목록(킹·귀족·챔피언 생성물) 구성 · 히든스타 구성 · 도감 카드 구성. 셋 중 하나라도 종목이
 * 들고 나면 사람이 본다. 값(배당률·날짜)만 바뀐 것은 사건이 아니다.
 */

export type MembershipDelta = { scope: string; added: string[]; removed: string[] };

const tickersOf = (members: unknown): string[] =>
  Array.isArray(members)
    ? members.map((member) => (member as { ticker?: unknown }).ticker).filter((ticker): ticker is string => typeof ticker === 'string')
    : [];

const delta = (scope: string, before: readonly string[], after: readonly string[]): MembershipDelta | null => {
  const added = after.filter((ticker) => !before.includes(ticker)).sort();
  const removed = before.filter((ticker) => !after.includes(ticker)).sort();
  return added.length > 0 || removed.length > 0 ? { scope, added, removed } : null;
};

/** 세 생성물의 갱신 전·후(JSON 파싱 결과)를 받아 종목이 들고 난 곳만 돌려준다. 빈 배열 = 값만 바뀌었다. */
export const diffDividendListMembership = (
  before: { lists: unknown; hiddenStars: unknown; dex: unknown },
  after: { lists: unknown; hiddenStars: unknown; dex: unknown }
): MembershipDelta[] => {
  const deltas: MembershipDelta[] = [];

  const listsOf = (snapshot: unknown): Record<string, { members?: unknown }> =>
    ((snapshot as { lists?: Record<string, { members?: unknown }> } | null)?.lists ?? {});
  const beforeLists = listsOf(before.lists);
  const afterLists = listsOf(after.lists);
  for (const id of [...new Set([...Object.keys(beforeLists), ...Object.keys(afterLists)])].sort()) {
    const found = delta(`목록 ${id}`, tickersOf(beforeLists[id]?.members), tickersOf(afterLists[id]?.members));
    if (found) deltas.push(found);
  }

  const membersOf = (file: unknown): unknown => (file as { members?: unknown } | null)?.members;
  const hidden = delta('히든스타', tickersOf(membersOf(before.hiddenStars)), tickersOf(membersOf(after.hiddenStars)));
  if (hidden) deltas.push(hidden);

  const cardsOf = (file: unknown): unknown => (file as { entries?: unknown } | null)?.entries;
  const dex = delta('도감', tickersOf(cardsOf(before.dex)), tickersOf(cardsOf(after.dex)));
  if (dex) deltas.push(dex);

  return deltas;
};

/** PR 본문용 요약. */
export const formatMembershipDeltas = (deltas: readonly MembershipDelta[]): string[] =>
  deltas.map(
    (item) =>
      `- **${item.scope}** — 편입 ${item.added.length ? item.added.join(', ') : '없음'} / 제외 ${item.removed.length ? item.removed.join(', ') : '없음'}`
  );
