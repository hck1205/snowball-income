/**
 * 가계부 분류 사전 — **항목(대분류) → 상세항목(소분류) 2단**. 순수 데이터 + 순수 조회 함수.
 *
 * 왜 사전이 필요한가
 * ---------------------------------------------------------------------------
 * v1 의 `분류` 는 자유 텍스트 한 칸이었다. 그러면 "식비"·"식료품"·"식료/생필품비"가 서로 다른
 * 분류가 되어 **합계가 갈라진다**. 남의 가계부를 가져오는 순간 그 갈라짐이 폭발한다.
 * 이 파일은 정규 분류 한 벌을 정하고, 바깥 세계의 이름들을 거기로 모으는 **별칭표**를 함께 든다.
 *
 * 별칭은 어디서 왔나 (2026-08-08 실측)
 * ---------------------------------------------------------------------------
 * 널리 쓰이는 구글 시트 가계부 템플릿 2종(1인가구 / 2인·공동생활비 세분화)의 `dropdown` 탭을
 * 전수 분석해 그 22 + 21 개 이름을 전부 흡수했다. 두 템플릿은 같은 개념을 다른 이름으로 부른다
 * (`식료/생필품비` ↔ `식료품비`+`생필품비`, `배달음식비` ↔ `외식비`). 별칭표가 그 간극을 메운다.
 * 근거·표 전문: docs/ledger-v2-design.md §1.2
 *
 * 🔴 축을 섞지 않는다
 * ---------------------------------------------------------------------------
 * 분석한 2인 템플릿은 `공동생활비`·`남편용돈`·`아내용돈`을 **항목**에 넣었다. 그건 "무엇에 썼나"가
 * 아니라 "누구 지갑에서 나갔나"다. 두 축이 한 칸에 겹치면 "남편이 쓴 식비"를 적을 자리가 사라진다
 * (그 템플릿의 예시 데이터에서 실제로 뭉개져 있다). 그래서 **주체는 이 사전에 없다** — 별도 축
 * (`payer`)이 진다. 여기 있는 것은 오직 "무엇에 썼나"다.
 *
 * ⚠ 이 사전은 **기본값**이지 강제가 아니다. 사용자가 항목을 더하거나 이름을 바꿀 수 있어야 하고,
 *   그때 여기 값들은 초기 시드로만 쓰인다. 사전에 없는 값을 만나면 조용히 `기타`로 뭉개지 말고
 *   **미분류로 남겨 화면에 표시**한다 — 조용한 오분류가 가계부 숫자 전체를 못 믿게 만든다.
 */

/** 항목(대분류) 식별자. 시트에는 `label` 이 저장되고, 이 id 는 앱 안에서만 산다. */
export type LedgerCategoryId =
  | 'housing'
  | 'food'
  | 'living'
  | 'transport'
  | 'personal'
  | 'children'
  | 'finance'
  | 'social'
  | 'saving'
  | 'income'
  | 'etc';

export type LedgerSubcategory = {
  readonly id: string;
  readonly label: string;
  /** 바깥 가계부에서 이 상세항목을 부르는 다른 이름들. 정규화 후 비교한다. */
  readonly aliases?: readonly string[];
};

export type LedgerCategory = {
  readonly id: LedgerCategoryId;
  readonly label: string;
  /** 이 항목이 수입인지 지출인지. `saving` 은 이체라 어느 쪽도 아니다. */
  readonly flow: 'expense' | 'income' | 'transfer';
  readonly aliases?: readonly string[];
  readonly subcategories: readonly LedgerSubcategory[];
};

/**
 * 기본 분류 사전.
 *
 * 🔴 `saving`(저축·투자)의 flow 가 `transfer` 인 것이 이 표에서 가장 중요한 판단이다.
 *   분석한 두 템플릿은 저축을 **지출 항목**에 넣었다. 그러면 지출 합계가 저축만큼 부풀고
 *   "저축률 = 1 − 지출/소득" 이 무너진다(내 돈이 내 통장으로 간 것을 쓴 것으로 세는 셈이다).
 *   이체로 두면 지출에서 빠지고, 자산 축과 이어진다. 원본 시트와 **숫자가 달라지는 것은 의도다.**
 */
export const LEDGER_CATEGORIES: readonly LedgerCategory[] = [
  {
    id: 'housing',
    label: '주거',
    flow: 'expense',
    aliases: ['주거비', '주택', '집'],
    subcategories: [
      { id: 'housing.rent', label: '월세', aliases: ['임대료', '전세월세'] },
      { id: 'housing.utility', label: '관리비/공과금', aliases: ['관리비/가스비', '관리비', '공과금', '가스비', '전기요금', '수도요금'] },
      { id: 'housing.mortgage', label: '주담대이자', aliases: ['주택담보대출이자', '주담대'] },
      { id: 'housing.deposit', label: '전월세보증금이자', aliases: ['보증금이자', '전세대출이자'] }
    ]
  },
  {
    id: 'food',
    label: '식비',
    flow: 'expense',
    aliases: ['먹거리'],
    subcategories: [
      /* 🔴 원본 1인 템플릿의 `식료/생필품비` 는 식비와 생활용품이 한 칸에 눌려 있다. 여기서는 갈라
         놓고, 별칭으로 그 이름을 받는다 — 받되 우리 쪽에서는 식비로 떨어진다(장보기의 주 성분). */
      { id: 'food.grocery', label: '식료품', aliases: ['식료품비', '식료/생필품비', '장보기', '마트'] },
      { id: 'food.dining', label: '외식', aliases: ['외식비', '식사', '점심', '저녁'] },
      { id: 'food.delivery', label: '배달', aliases: ['배달음식비', '배달비', '배달음식'] },
      { id: 'food.cafe', label: '카페/간식', aliases: ['카페', '간식', '커피', '디저트'] }
    ]
  },
  {
    id: 'living',
    label: '생활',
    flow: 'expense',
    aliases: ['생활비'],
    subcategories: [
      { id: 'living.supplies', label: '생필품', aliases: ['생필품비', '생활용품', '일용품'] },
      { id: 'living.telecom', label: '통신/인터넷', aliases: ['통신비', '휴대폰요금', '인터넷', '통신'] },
      { id: 'living.subscription', label: '구독료', aliases: ['구독', 'OTT', '정기결제'] },
      { id: 'living.health', label: '의료/건강', aliases: ['병원비', '약국', '의료비', '건강'] },
      { id: 'living.pet', label: '반려동물', aliases: ['반려동물비', '펫'] }
    ]
  },
  {
    id: 'transport',
    label: '교통·차량',
    flow: 'expense',
    aliases: ['교통', '차량'],
    subcategories: [
      { id: 'transport.transit', label: '대중교통', aliases: ['교통비', '지하철', '버스'] },
      { id: 'transport.taxi', label: '택시', aliases: ['택시비'] },
      { id: 'transport.car', label: '차량유지', aliases: ['차량유지비', '자동차', '정비', '보험(차)'] },
      { id: 'transport.fuel', label: '주유', aliases: ['주유비', '기름값', '충전'] }
    ]
  },
  {
    id: 'personal',
    label: '개인·여가',
    flow: 'expense',
    aliases: ['개인소비·여가', '여가', '문화'],
    subcategories: [
      { id: 'personal.fashion', label: '의류/미용', aliases: ['의류/미용비', '옷', '미용실', '화장품'] },
      { id: 'personal.hobby', label: '취미/자기계발', aliases: ['취미/자기계발비', '취미', '자기계발', '교육(본인)'] },
      { id: 'personal.travel', label: '여행', aliases: ['여행비', '숙박', '항공'] },
      { id: 'personal.date', label: '데이트', aliases: ['데이트비'] },
      { id: 'personal.misc', label: '개인소비', aliases: ['용돈', '개인용돈'] }
    ]
  },
  {
    id: 'children',
    label: '자녀',
    flow: 'expense',
    aliases: ['육아'],
    subcategories: [
      { id: 'children.care', label: '보육/교육', aliases: ['자녀양육비', '학원비', '교육비', '어린이집'] },
      { id: 'children.goods', label: '자녀용품', aliases: ['육아용품', '기저귀', '분유'] }
    ]
  },
  {
    id: 'finance',
    label: '금융',
    flow: 'expense',
    aliases: ['금융·기타', '대출이자'],
    subcategories: [
      { id: 'finance.insurance', label: '보험료', aliases: ['보험', '실비보험'] },
      { id: 'finance.interest', label: '신용/마통이자', aliases: ['신용대출이자', '마이너스통장이자', '대출이자'] },
      { id: 'finance.tax', label: '세금', aliases: ['세금/수수료', '수수료'] }
    ]
  },
  {
    id: 'social',
    label: '관계',
    flow: 'expense',
    aliases: ['경조사'],
    subcategories: [
      { id: 'social.event', label: '경조사', aliases: ['경조사비', '축의금', '조의금'] },
      { id: 'social.club', label: '모임회비', aliases: ['계모임비', '회비', '모임'] },
      { id: 'social.gift', label: '선물', aliases: ['선물비'] }
    ]
  },
  {
    id: 'saving',
    label: '저축·투자',
    flow: 'transfer',
    aliases: ['저축', '투자'],
    subcategories: [
      { id: 'saving.deposit', label: '저축', aliases: ['적금', '예금', '저축통장'] },
      { id: 'saving.invest', label: '투자', aliases: ['주식', '펀드', '연금'] }
    ]
  },
  {
    id: 'income',
    label: '수입',
    flow: 'income',
    aliases: ['소득'],
    subcategories: [
      { id: 'income.salary', label: '급여', aliases: ['급여(월급)', '월급', '월급여', '본업'] },
      { id: 'income.bonus', label: '상여/성과급', aliases: ['상여금', '보너스', '성과급'] },
      { id: 'income.side', label: '부수입', aliases: ['부업', '사업소득', '알바'] },
      { id: 'income.financial', label: '금융소득', aliases: ['배당', '이자', '배당금'] }
    ]
  },
  {
    id: 'etc',
    label: '기타',
    flow: 'expense',
    subcategories: [{ id: 'etc.etc', label: '기타', aliases: ['기타비용', '미분류'] }]
  }
];

// ── 조회 ──────────────────────────────────────────────────────────────────────

/**
 * 비교용 정규화 — 공백·구분기호·괄호를 지우고 소문자로 내린다.
 *
 * ⚠ 슬래시를 지우는 것이 핵심이다: `식료/생필품비` 와 `식료생필품비` 가 같은 말이어야 한다.
 *   반대로 **글자 자체는 지우지 않는다** — `교통비`와 `교통`은 다른 문자열로 남고, 별칭표가 잇는다.
 *   (부분일치로 이으면 `보험료`가 `보험(차)`에 걸리는 식의 조용한 오분류가 난다.)
 */
export const normalizeCategoryToken = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[\s·・/\\|,.()[\]{}~\-_]/g, '');

type ResolveIndex = ReadonlyMap<string, { readonly categoryId: LedgerCategoryId; readonly subcategoryId?: string }>;

/** 별칭 → 정규 분류 색인. 모듈 로드 시 1회 만든다(사전이 상수라 무효화될 일이 없다). */
const buildIndex = (): ResolveIndex => {
  const index = new Map<string, { categoryId: LedgerCategoryId; subcategoryId?: string }>();

  const put = (token: string, value: { categoryId: LedgerCategoryId; subcategoryId?: string }) => {
    const key = normalizeCategoryToken(token);
    if (key.length === 0) return;
    // 🔴 먼저 등록된 쪽이 이긴다. 사전 순서가 곧 우선순위이고, 별칭 충돌이 조용히 뒤집히지 않는다.
    if (!index.has(key)) index.set(key, value);
  };

  for (const category of LEDGER_CATEGORIES) {
    // 상세항목을 **먼저** 넣는다 — `저축`처럼 항목명과 상세항목명이 같을 때 더 구체적인 쪽을 남긴다.
    for (const sub of category.subcategories) {
      put(sub.label, { categoryId: category.id, subcategoryId: sub.id });
      for (const alias of sub.aliases ?? []) put(alias, { categoryId: category.id, subcategoryId: sub.id });
    }
    put(category.label, { categoryId: category.id });
    for (const alias of category.aliases ?? []) put(alias, { categoryId: category.id });
  }

  return index;
};

const RESOLVE_INDEX = buildIndex();

export type ResolvedCategory = {
  readonly category: LedgerCategory;
  readonly subcategory?: LedgerSubcategory;
};

/** 항목 id 로 찾는다. */
export const findCategory = (id: LedgerCategoryId): LedgerCategory | undefined =>
  LEDGER_CATEGORIES.find((category) => category.id === id);

/**
 * 바깥 세계의 이름 하나를 정규 분류로 옮긴다. 모르는 이름이면 `null`.
 *
 * 🔴 추측하지 않는다 — 못 맞춘 값은 호출부가 "미분류"로 표시하고 사용자에게 물어야 한다.
 *   여기서 `기타`로 떨어뜨리면 사용자는 잘못 분류된 사실조차 모른다.
 */
export const resolveCategoryName = (raw: string | undefined): ResolvedCategory | null => {
  if (typeof raw !== 'string') return null;
  const hit = RESOLVE_INDEX.get(normalizeCategoryToken(raw));
  if (!hit) return null;
  const category = findCategory(hit.categoryId);
  if (!category) return null;
  const subcategory = hit.subcategoryId
    ? category.subcategories.find((sub) => sub.id === hit.subcategoryId)
    : undefined;
  return subcategory ? { category, subcategory } : { category };
};

/**
 * 항목 + 상세항목 두 칸을 함께 해석한다(시트가 두 열로 들고 있는 모양 그대로).
 *
 * 상세항목이 먼저다 — 더 구체적인 값이 항목을 결정할 수 있고, 두 값이 어긋나면(`생활비` + `외식비`)
 * **상세항목 쪽을 믿는다**. 사람이 마지막에 고른 칸이 상세항목이기 때문이다.
 */
export const resolveCategoryPair = (
  categoryRaw: string | undefined,
  subcategoryRaw: string | undefined
): ResolvedCategory | null => resolveCategoryName(subcategoryRaw) ?? resolveCategoryName(categoryRaw);

/** 화면 드롭다운용 — 특정 flow 의 항목만. */
export const categoriesByFlow = (flow: LedgerCategory['flow']): readonly LedgerCategory[] =>
  LEDGER_CATEGORIES.filter((category) => category.flow === flow);
