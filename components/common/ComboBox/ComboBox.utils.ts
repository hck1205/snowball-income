/**
 * 콤보박스의 **순수 규칙**. 컴포넌트에서 떼어 놓아 테스트가 DOM 없이 돈다.
 */

/**
 * 비교용 정규화 — 공백·구분기호를 지우고 소문자로.
 *
 * ⚠ `shared/constants/ledger` 의 `normalizeCategoryToken` 과 **일부러 다르다.** 저쪽은 분류를
 *   **정확히 맞추는** 자리라 글자를 지우지 않는데, 여기는 사람이 타이핑하는 도중을 다루므로
 *   `식료/생필품` 을 `식료생필품` 으로도 찾아야 한다. 규칙이 하나여야 하는 자리가 아니다
 *   (한쪽은 저장되는 값의 판정, 한쪽은 화면 검색이다).
 */
const normalize = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[\s·・/\\|,.()[\]{}~\-_]/g, '');

/**
 * 검색어로 제안을 좁힌다.
 *
 * 🔴 **검색어가 비어 있으면 전부 보여 준다.** 빈 입력에서 목록을 감추면 "무엇을 고를 수 있나"를
 *    알 방법이 없다 — 그게 datalist 보다 나아야 하는 이유 중 하나다.
 * 🔴 **입력한 값과 정확히 같은 항목 하나만 남는 상태에서는 목록을 닫는다**(호출부 판단).
 *    이미 고른 것을 다시 보여 주는 것은 소음이다.
 *
 * 앞에서 시작하는 것을 먼저 세운다 — `카페` 를 치면 `카페` 가 `프랜차이즈카페` 보다 위여야 한다.
 */
export const filterComboOptions = (
  options: readonly string[],
  query: string
): readonly string[] => {
  const needle = normalize(query);
  if (needle.length === 0) return options;

  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const option of options) {
    const haystack = normalize(option);
    if (haystack.startsWith(needle)) startsWith.push(option);
    else if (haystack.includes(needle)) contains.push(option);
  }
  return [...startsWith, ...contains];
};

/** 입력값이 제안 하나와 정확히 같은가(정규화 기준). 같으면 목록을 열어 둘 이유가 없다. */
export const isExactMatch = (options: readonly string[], value: string): boolean => {
  const needle = normalize(value);
  if (needle.length === 0) return false;
  return options.some((option) => normalize(option) === needle);
};

/**
 * 키보드로 옮긴 뒤의 활성 인덱스.
 *
 * 🔴 **감싸 돈다**(마지막에서 아래 → 첫째). 목록이 스크롤되는 자리라, 끝에서 멈추면 사용자는
 *    자기가 끝에 있는지 컨트롤이 죽었는지 구분할 수 없다.
 * ⚠ 아직 아무것도 활성이 아닐 때(`-1`) 위로 누르면 **마지막**이 잡힌다 — 위로 눌러 끝에서
 *   시작하는 것이 사람이 기대하는 동작이다.
 */
export const nextActiveIndex = (
  current: number,
  length: number,
  direction: 1 | -1
): number => {
  if (length === 0) return -1;
  if (current < 0) return direction === 1 ? 0 : length - 1;
  return (current + direction + length) % length;
};
