/**
 * 분류 이외의 **직교 축** — 주체(누구 지갑) · 결제수단(무엇으로) · 반복성(고정/변동).
 *
 * 왜 분류와 갈라 두는가: docs/ledger-v2-design.md §2.1. 한 줄로 줄이면 —
 * 분석한 2인 템플릿이 "누구 지갑"을 항목 칸에 넣는 바람에 "남편이 쓴 식비"를 적을 자리가 없었다.
 * 축을 나누면 1인 가구는 주체 칸을 아예 보지 않고, 2인 가구는 같은 스키마로 분담까지 표현한다.
 */

// ── 주체(payer) — 누구 지갑에서 나갔나 ────────────────────────────────────────

/**
 * 공동 지갑을 가리키는 정규 값. 시트에 이 글자가 그대로 저장된다.
 *
 * 🔴 빈 칸도 공동으로 읽는다 — 1인 가구는 이 칸을 영영 비워 두고, 그때 모든 행이 `공동`이 되어야
 *   집계가 성립한다. "비어 있으니 미분류"로 두면 1인 가구 사용자가 쓰지도 않은 칸 때문에 경고를 본다.
 */
export const LEDGER_PAYER_SHARED = '공동';

/**
 * 구성원 이름은 **사용자가 정한다**(`남편`·`아내`·`나`·실명 무엇이든). 앱이 성별·관계를 가정하지 않는다 —
 * 분석한 템플릿은 `남편용돈`·`아내용돈`으로 못 박혀 있어 1인 가구·동성 부부·룸메이트가 쓸 수 없었다.
 * 그래서 여기엔 목록이 없고, 공동을 가리키는 이름 하나만 예약어로 둔다.
 */
export const isSharedPayer = (raw: string | undefined): boolean => {
  const value = (raw ?? '').trim();
  return value.length === 0 || value === LEDGER_PAYER_SHARED;
};

/** 시트에 쓸 주체 값. 공동이면 **빈 칸으로 쓴다** — 1인 가구 시트에 같은 글자가 천 줄 반복되지 않게. */
export const formatPayerCell = (payer: string | undefined): string =>
  isSharedPayer(payer) ? '' : (payer ?? '').trim();

// ── 반복성(fixity) — 고정비인가 ──────────────────────────────────────────────

export type LedgerFixity = 'fixed' | 'variable';

/**
 * 시트에 저장되는 글자. 변동은 **빈 칸**이다.
 *
 * 🔴 원본 템플릿은 `고정지출`을 **날짜 칸**에 적었다(`고정지출` / `1일` / `3일`…). 그러면 고정비를
 *   세려면 날짜를 파싱하다 말고 특수 토큰을 봐야 하고, 고정비에 날짜를 줄 수 없다. 별도 칸으로 꺼내면
 *   "고정비만 합계"가 필터 한 줄이 된다. 대신 **읽을 때는 그 관습도 받아 준다**(parse 쪽 참고).
 */
export const LEDGER_FIXITY_LABEL: Readonly<Record<LedgerFixity, string>> = {
  fixed: '고정',
  variable: ''
};

const FIXED_WORDS = new Set(['고정', '고정지출', '고정비', 'fixed']);

/** 모르는 값은 `variable` 이다 — 고정비는 **명시적으로 표시된 것만** 고정비다(과대 집계 방지). */
export const parseFixity = (raw: string | undefined): LedgerFixity => {
  if (typeof raw !== 'string') return 'variable';
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '');
  return FIXED_WORDS.has(normalized) ? 'fixed' : 'variable';
};

/**
 * 날짜 칸에 들어온 값이 **날짜가 아니라 고정지출 표시**인지. 원본 템플릿 호환용.
 * 이게 true 면 그 행은 날짜 없는 고정비이고, 호출부가 해당 월의 기준일을 넣어 준다.
 */
export const isFixityToken = (raw: string | undefined): boolean =>
  typeof raw === 'string' && FIXED_WORDS.has(raw.trim().toLowerCase().replace(/\s+/g, ''));

// ── 결제수단(method) — 카드 추천의 유일한 입력 ────────────────────────────────

/**
 * 결제수단의 종류. 사용자는 이 위에 **별칭**(`신한 딥드림`, `국민 체크`)을 붙여 쓴다.
 *
 * 🔴 이 축이 v2 스키마에 지금 들어가는 이유는 화면이 아니라 **로드맵**이다(설계 문서 §5).
 *   지출 내역으로 카드를 추천하려면 "무엇으로 결제했나"가 있어야 하고, 나중에 열을 더해도
 *   **그때까지 쌓인 과거 데이터에는 그 값이 없다**. 지금 넣지 않으면 그 데이터는 영영 무자격이다.
 */
export type LedgerMethodKind = 'credit' | 'debit' | 'cash' | 'transfer' | 'other';

export const LEDGER_METHOD_LABEL: Readonly<Record<LedgerMethodKind, string>> = {
  credit: '신용카드',
  debit: '체크카드',
  cash: '현금',
  transfer: '계좌이체',
  other: '기타'
};

const METHOD_ALIASES: Readonly<Record<LedgerMethodKind, readonly string[]>> = {
  credit: ['신용', '신용카드', 'credit', '카드'],
  debit: ['체크', '체크카드', 'debit'],
  cash: ['현금', 'cash'],
  transfer: ['이체', '계좌이체', '자동이체', 'transfer', '무통장'],
  other: ['기타', 'other']
};

/**
 * 결제수단 문자열에서 종류를 추린다. 모르면 `null` — 사용자 별칭(`신한 딥드림`)은 종류를 알 수 없고,
 * 그건 정상이다. 종류는 설정에서 사용자가 별칭에 붙인다.
 */
export const parseMethodKind = (raw: string | undefined): LedgerMethodKind | null => {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase().replace(/[\s\-_]/g, '');
  if (normalized.length === 0) return null;
  for (const [kind, aliases] of Object.entries(METHOD_ALIASES) as [LedgerMethodKind, readonly string[]][]) {
    if (aliases.some((alias) => alias.toLowerCase() === normalized)) return kind;
  }
  return null;
};
