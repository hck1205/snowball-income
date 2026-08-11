import type { PresetTickerKey } from '@/shared/constants';
import { isValidTickerInput, toExpectedTotalReturnPercent } from '@/shared/lib/snowball';
import type { TickerDraft, TickerModalMode } from '@/shared/types/snowball';
import { getTickerDisplayName } from '@/shared/utils';

export type ListedTickerMeta = { name: string; issuer?: string };
export type ListedTickerMap = Record<string, ListedTickerMeta>;
export type TickerSearchRow = { ticker: string; name: string; issuer: string; tickerUpper: string; nameUpper: string };
export type ScoredTickerSearchRow = TickerSearchRow & { score: number };

/** Merges two listed-ticker maps into search rows; `primary` wins on duplicate tickers. */
export const buildTickerSearchRows = (primary: ListedTickerMap, secondary: ListedTickerMap): TickerSearchRow[] => {
  const merged = new Map<string, ListedTickerMeta>();
  for (const [ticker, meta] of Object.entries(primary)) merged.set(ticker.toUpperCase(), meta);
  for (const [ticker, meta] of Object.entries(secondary)) {
    const normalizedTicker = ticker.toUpperCase();
    if (!merged.has(normalizedTicker)) merged.set(normalizedTicker, meta);
  }

  return Array.from(merged.entries()).map(([ticker, meta]) => ({
    ticker,
    name: meta.name ?? '',
    issuer: meta.issuer ?? '',
    tickerUpper: ticker,
    nameUpper: (meta.name ?? '').toUpperCase()
  }));
};

/**
 * Ranks rows against a keyword: exact ticker > prefix > substring, plus a bonus per matching character.
 * Ties break alphabetically. Empty keyword yields no results.
 */
export const scoreTickerSearch = ({
  rows,
  keyword,
  maxResults
}: {
  rows: TickerSearchRow[];
  keyword: string;
  maxResults: number;
}): ScoredTickerSearchRow[] => {
  const query = keyword.toUpperCase();
  if (!query) return [];

  const queryChars = Array.from(new Set(query.replace(/[^A-Z0-9]/g, '').split('').filter(Boolean)));

  return rows
    .map((row) => {
      const searchableTicker = row.tickerUpper;
      const includesQuery = searchableTicker.includes(query);
      const charHitCount = queryChars.reduce((count, char) => (searchableTicker.includes(char) ? count + 1 : count), 0);
      if (!includesQuery && charHitCount === 0) return null;

      let score = charHitCount * 12;
      if (row.tickerUpper === query) score += 1200;
      else if (row.tickerUpper.startsWith(query)) score += 800;
      else if (row.tickerUpper.includes(query)) score += 520;

      return { ...row, score };
    })
    .filter((item): item is ScoredTickerSearchRow => item !== null)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.ticker.localeCompare(right.ticker, 'en', { sensitivity: 'base' });
    })
    .slice(0, maxResults);
};

/** Sorts preset keys by their display label. */
export const sortPresetKeys = (presetTickers: Record<PresetTickerKey, TickerDraft>): PresetTickerKey[] =>
  (Object.keys(presetTickers) as PresetTickerKey[]).sort((leftKey, rightKey) => {
    const leftLabel = getTickerDisplayName(presetTickers[leftKey].ticker, presetTickers[leftKey].name);
    const rightLabel = getTickerDisplayName(presetTickers[rightKey].ticker, presetTickers[rightKey].name);
    return leftLabel.localeCompare(rightLabel, 'en', { sensitivity: 'base' });
  });

/** 공백을 없앤 형태 — "리얼티인컴" 으로도 "리얼티 인컴" 이 검색되게 하는 공백 무시 매칭용. */
const stripSpaces = (value: string): string => value.replace(/\s+/g, '');

/**
 * Keeps preset keys whose ticker, display name, or Korean name contains the keyword.
 *
 * 매칭은 **공백 포함 + 공백 무시** 두 방식을 모두 제공한다:
 * 예) "리얼티인컴"(공백 없음) 으로도 "리얼티 인컴"(공백 있음) 이 걸리고, 그 반대도 걸린다.
 */
export const filterPresetKeys = ({
  presetKeys,
  presetTickers,
  koreanNameByTicker,
  keyword
}: {
  presetKeys: PresetTickerKey[];
  presetTickers: Record<PresetTickerKey, TickerDraft>;
  koreanNameByTicker: Record<PresetTickerKey, string>;
  keyword: string;
}): PresetTickerKey[] => {
  const query = keyword.trim().toUpperCase();
  if (!query) return presetKeys;

  const queryNoSpace = stripSpaces(query);
  // 공백 포함 매칭(그대로) 또는 공백 무시 매칭(양쪽 공백 제거) 중 하나라도 걸리면 통과.
  const matches = (target: string): boolean => {
    const upper = target.toUpperCase();
    return upper.includes(query) || stripSpaces(upper).includes(queryNoSpace);
  };

  return presetKeys.filter((presetKey) => {
    const ticker = presetTickers[presetKey].ticker;
    const displayName = getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name);
    const koreanName = koreanNameByTicker[presetKey];
    return matches(ticker) || matches(displayName) || matches(koreanName);
  });
};

/** True while the user is typing a brand new ticker instead of picking a preset. */
export const isCustomTickerInput = (mode: TickerModalMode, selectedPreset: 'custom' | PresetTickerKey): boolean =>
  mode === 'create' && selectedPreset === 'custom';

/**
 * Blocks the create button unless the engine would accept the hand-written draft.
 *
 * This used to only reject NaN, so a draft still holding the default price of 0 was
 * creatable — the chip appeared and the whole result panel turned into a validation error.
 */
export const isTickerCreateDisabled = ({
  mode,
  selectedPreset,
  tickerDraft
}: {
  mode: TickerModalMode;
  selectedPreset: 'custom' | PresetTickerKey;
  tickerDraft: TickerDraft;
}): boolean => isCustomTickerInput(mode, selectedPreset) && !isValidTickerInput(tickerDraft);

/**
 * 생성 대기 목록의 한 칸 — "담은 종목".
 *
 * 🔴 프리셋과 직접 입력을 **한 목록**에 담는다(2026-08-10 다중 생성). 그래서 프리셋 3개 + 직접
 *    입력 2개를 한 번에 만들 수 있고, 직접 입력이 "다중 선택에 못 끼는 예외"가 되지 않는다.
 * ⚠ `isCustomPreset` 은 저장 시 이름 처리를 가른다(`buildTickerProfileFromDraft`) — 프리셋은
 *   영문 풀네임을 버리고 심볼만 남기고, 직접 입력은 사용자가 적은 이름을 지킨다. 그래서 항목마다
 *   따라다녀야 한다(목록 전체에 하나로 둘 수 없다).
 */
export type StagedTicker = {
  /** 목록 안의 신원. 프리셋은 프리셋 키, 직접 입력은 `custom:<번호>`. */
  key: string;
  draft: TickerDraft;
  isCustomPreset: boolean;
};

/** 직접 입력 항목의 키 접두사 — 프리셋 키와 절대 겹치지 않는 형태여야 한다. */
const CUSTOM_STAGED_PREFIX = 'custom:';

/**
 * 프리셋 칩 토글. 이미 담겨 있으면 빼고, 아니면 뒤에 붙인다(누른 순서가 목록 순서다).
 *
 * ⚠ 프리셋의 `name`(영문 풀네임)을 담지 않는다 — 담으면 좌측 칩이 심볼 대신 풀네임으로 보인다
 *   (`TickerModal.tsx` 의 단일 선택 경로가 같은 이유로 name 을 비운다).
 */
export const toggleStagedPreset = (
  staged: readonly StagedTicker[],
  presetKey: PresetTickerKey,
  draft: TickerDraft
): StagedTicker[] =>
  staged.some((item) => item.key === presetKey)
    ? staged.filter((item) => item.key !== presetKey)
    : [...staged, { key: presetKey, draft: { ...draft, name: '' }, isCustomPreset: false }];

/** 직접 입력 폼의 현재 값을 목록에 담는다. 키는 기존 번호 중 가장 큰 것 + 1 (재사용 안 함). */
export const stageCustomDraft = (staged: readonly StagedTicker[], draft: TickerDraft): StagedTicker[] => {
  const nextSequence =
    staged.reduce((max, item) => {
      if (!item.key.startsWith(CUSTOM_STAGED_PREFIX)) return max;
      const parsed = Number(item.key.slice(CUSTOM_STAGED_PREFIX.length));
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0) + 1;

  return [...staged, { key: `${CUSTOM_STAGED_PREFIX}${nextSequence}`, draft, isCustomPreset: true }];
};

export const removeStaged = (staged: readonly StagedTicker[], key: string): StagedTicker[] =>
  staged.filter((item) => item.key !== key);

/**
 * 실제로 생성할 항목들. **버튼 라벨(N개 생성)과 잠금 판정이 이 함수 하나를 본다** —
 * 두 곳이 따로 세면 "3개 생성"을 눌렀는데 2개만 생기는 어긋남이 난다.
 *
 * 규칙 둘.
 *  ① 담은 목록이 곧 대상이다.
 *  ② 직접 입력 탭에서 **담기를 누르지 않고** 바로 생성해도 그 폼 값이 함께 생성된다 — 담기를
 *     모르고 지나친 사용자가 입력을 잃지 않게. 같은 티커가 이미 담겨 있으면 두 번 만들지 않는다.
 *
 * @param isCustomInputTab 직접 입력 탭이 열려 있는가(프리셋 탭의 미리보기 드래프트는 대상이 아니다 —
 *   칩을 누르는 순간 이미 목록에 담겼으므로 여기서 또 세면 같은 종목이 두 번 만들어진다).
 */
export const resolveCreateTargets = ({
  staged,
  tickerDraft,
  isCustomInputTab
}: {
  staged: readonly StagedTicker[];
  tickerDraft: TickerDraft;
  isCustomInputTab: boolean;
}): StagedTicker[] => {
  if (!isCustomInputTab) return [...staged];
  if (!isValidTickerInput(tickerDraft)) return [...staged];

  const typedTicker = tickerDraft.ticker.trim().toUpperCase();
  const alreadyStaged = staged.some((item) => item.draft.ticker.trim().toUpperCase() === typedTicker);
  if (alreadyStaged) return [...staged];

  return [...staged, { key: `${CUSTOM_STAGED_PREFIX}live`, draft: tickerDraft, isCustomPreset: true }];
};

/**
 * 이름 칸에 **보여 줄** 이름. 저장값이 아니라 표시의 문제다.
 *
 * ## 🔴 왜 저장된 이름을 그대로 못 쓰나
 *
 * 프리셋에서 만든 티커는 `name` 을 **일부러 비운다** — `getTickerDisplayName` 이 name 을 우선하므로
 * 실으면 종목 칩이 심볼(SCHD) 대신 영문 풀네임으로 보인다(`TickerModal.tsx` 의 같은 주석).
 * 그 대가가 두 곳에서 나타났다(2026-08-11 사용자 지적):
 *   ① 프리셋을 눌렀을 때 미리보기의 이름 칸이 공란
 *   ② **수정 모드**로 들어가도 공란 — 이쪽은 화면 문제가 아니라 **저장된 값 자체가 빈 문자열**이다.
 *      그래서 선택된 프리셋이 없어도(수정 모드는 항상 `'custom'`) 심볼로 이름을 되찾아야 한다.
 *
 * 우선순위: 사용자가 적은 이름 → 지금 고른 프리셋의 한글 이름 → **심볼로 찾은** 한글 이름 →
 * 프리셋의 영문 이름 → 빈 문자열.
 *
 * ⚠ 저장 데이터는 건드리지 않는다. 이 함수의 결과가 `name` 으로 저장되면 칩 표시가 다시 망가진다.
 */
export const toPreviewDisplayName = ({
  tickerDraft,
  selectedPreset,
  presetTickers,
  koreanNameByTicker
}: {
  tickerDraft: TickerDraft;
  selectedPreset: 'custom' | PresetTickerKey;
  presetTickers: Record<PresetTickerKey, TickerDraft>;
  koreanNameByTicker: Record<PresetTickerKey, string>;
}): string => {
  const typedName = tickerDraft.name.trim();
  if (typedName) return typedName;

  /* 심볼로 프리셋을 되찾는다 — 프리셋 키가 곧 심볼이다(대소문자만 맞춘다). */
  const symbol = tickerDraft.ticker.trim().toUpperCase() as PresetTickerKey;
  const presetKey = selectedPreset !== 'custom' ? selectedPreset : symbol;

  return koreanNameByTicker[presetKey] ?? presetTickers[presetKey]?.name ?? '';
};

/** Empty number inputs become NaN so the draft stays visibly blank instead of snapping to 0. */
export const parseNumericInputOrNaN = (rawValue: string): number => (rawValue === '' ? Number.NaN : Number(rawValue));

/**
 * 정합 모델: `expectedTotalReturn` 은 입력이 아니라 파생값이다 (r = y + g).
 * 배당률/배당 성장률이 바뀔 때마다 드래프트의 총수익률을 다시 계산해 둔다.
 */
export const withDerivedTotalReturn = (draft: TickerDraft): TickerDraft => ({
  ...draft,
  expectedTotalReturn: toExpectedTotalReturnPercent(draft.dividendYield, draft.dividendGrowth)
});

/**
 * "배당률은 넣었는데 지급 주기가 `배당 없음`" 모순 안내.
 *
 * 계산은 이미 안전하다 — 주기가 `none` 이면 엔진이 배당을 한 푼도 만들지 않는다
 * (`SnowballPayout`). 남은 문제는 **사용자가 그 사실을 모른 채 배당률만 보고 기대한다**는 것이다.
 *
 * 🔴 선택지를 막지 않는다. 무배당 종목(성장주)을 정직하게 담는 것이 이 옵션의 존재 이유이고,
 *   배당률 입력칸에 옛 값이 남아 있는 것도 정상적인 편집 중간 상태다. 그래서 **금지가 아니라 고지**다.
 *
 * 값이 없으면 `undefined` 를 돌려 줄 자체를 감춘다(NaN = 아직 안 친 상태도 여기 포함된다).
 */
export const buildFrequencyMismatchHint = (draft: Pick<TickerDraft, 'dividendYield' | 'frequency'>): string | undefined => {
  if (draft.frequency !== 'none') return undefined;
  if (!Number.isFinite(draft.dividendYield) || draft.dividendYield <= 0) return undefined;

  return "배당률이 입력돼 있지만 지급 주기가 '배당 없음'이라 배당이 계산되지 않습니다.";
};

/** 총수익률 분해 캡션. 값이 아직 비어 있으면 null 을 돌려 캡션을 감춘다. */
export const toTotalReturnCaption = (draft: TickerDraft): string | null => {
  if (!Number.isFinite(draft.dividendYield) || !Number.isFinite(draft.dividendGrowth)) return null;

  const totalReturn = toExpectedTotalReturnPercent(draft.dividendYield, draft.dividendGrowth);

  return `총수익률 ${totalReturn}% (배당 ${draft.dividendYield}% + 성장 ${draft.dividendGrowth}%)`;
};
