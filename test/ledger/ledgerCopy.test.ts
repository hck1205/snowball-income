// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { LEDGER_COPY } from '@/pages/Ledger/copy';

/**
 * `/ledger` **카피 정확일치** 계약.
 *
 * 🔴 부분일치(`toContain`)를 쓰지 않는다 — 문장이 축약되거나 절반이 잘려도 통과하기 때문이다.
 * 🔴 기대값에 `LEDGER_COPY` 를 재사용하지 않는다 — 그건 동어반복이라 회귀를 못 잡는다.
 *    아래는 전부 **스펙(docs/ledger-google-sheets-ui-spec.md §4)의 확정 문자열 리터럴**이다.
 *
 * 문자열 트리 전체를 한 번에 비교하므로 **추가·삭제·오타가 전부 잡힌다**(개별 키 단정은
 * "새로 생긴 뭉갠 문구"를 못 본다).
 */

type StringTree = { [key: string]: string | StringTree };

/** 문자열 잎만 남긴다 — 함수 카피는 아래에서 출력으로 따로 단정한다. */
const stringLeaves = (value: unknown): StringTree => {
  const out: StringTree = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string') out[key] = item;
    else if (typeof item === 'object' && item !== null) out[key] = stringLeaves(item);
  }
  return out;
};

const EXPECTED: StringTree = {
  hero: {
    // 메뉴는 '가계부' 그대로다 — 페이지 제목만 제품명을 붙인다(2026-08-02 사용자 결정).
    // 🔴 제품명은 "Hungry Hippo" 하나이고 시트 파일명(`APP_SPREADSHEET_TITLE`)과 같은 표기다 — 줄임말 금지.
    title: 'Hungry Hippo 가계부',
    lede: '수입과 지출을 사용자의 구글 시트에 기록하고, 달마다 얼마를 벌고 썼는지 확인합니다.',
    scopeNotice: '이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.',
    addEntry: '항목 추가',
    openSheet: '시트에서 열기',
    openSheetAria: '연결된 구글 시트를 새 탭에서 열기'
  },
  signIn: {
    checking: '로그인 상태를 확인하는 중입니다',
    heading: '가계부를 열려면 먼저 로그인합니다',
    body: '구글·네이버·카카오 중 어느 계정으로 로그인해도 됩니다. 로그인한 다음 단계에서 기록할 구글 시트를 고릅니다.'
  },
  connect: {
    heading: '가계부를 시작하는 방법을 고릅니다',
    // 연결 무대(네이비 면)의 리드 한 줄 — 🔴 `privacy` 네 문장을 요약하지 않는다(단일 출처 유지).
    stageLede:
      '기록은 사용자의 구글 시트에 남고, 분류·요약·시각화는 이 화면이 맡습니다. 날짜·금액·내용만 적으면 나머지는 채워 드립니다.',
    stepsLabel: '연결 절차',
    // 🔴 연결 화면과 열 지정 화면이 **같은 값**을 쓴다 — 두 화면이 한 흐름임을 화면이 말한다.
    steps: {
      pick: '시트 고르기',
      map: '열 지정 (필요할 때만)',
      record: '기록 시작'
    },
    existing: {
      title: '이미 쓰는 시트 연결하기',
      body: '구글 드라이브에서 가계부로 쓰던 시트를 고릅니다. 다음 단계에서 어느 열이 날짜·구분·금액·항목인지 지정합니다.',
      cta: '시트 고르기',
      loading: '구글 드라이브를 여는 중입니다'
    },
    create: {
      title: '새 가계부 시트 만들기',
      body:
        '기록·자산·투자·분류 규칙과 자동 요약 표까지 갖춘 시트를 드라이브에 새로 만듭니다. '
        + '머리가 이미 맞아 열 지정을 건너뛰고 바로 기록을 시작합니다.',
      cta: '새 시트 만들기',
      loading: '시트를 만드는 중입니다'
    },
    consentHint: '두 방법 모두 구글 로그인과 시트 접근 동의가 필요합니다. 동의는 구글 계정 설정에서 언제든 취소할 수 있습니다.',
    separateConsentNote:
      '앱 로그인은 사용자를 확인하는 절차이고 시트 접근은 별개의 구글 권한이라, 구글 계정으로 로그인했더라도 시트 접근 동의는 따로 받습니다.',
    popupBlocked: '브라우저가 팝업을 막아 구글 창을 열지 못했습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'
  },
  mapping: {
    title: '열 지정',
    subtitle: '각 항목이 시트의 어느 열에 있는지 고릅니다. 첫 행을 열 이름으로 읽었습니다.',
    autoMatchedNone: '머리글에서 맞출 수 있는 항목을 찾지 못했습니다. 항목마다 열을 직접 골라 주세요.',
    fields: {
      date: '날짜',
      kind: '구분',
      amount: '금액',
      category: '항목',
      subcategory: '상세항목 (선택)',
      payer: '주체 (선택)',
      method: '결제수단 (선택)',
      fixity: '고정 (선택)',
      memo: '내용 (선택)'
    },
    required: '필수',
    unset: '선택 안 함',
    preview: {
      title: '이렇게 읽었습니다',
      body: '고른 열로 시트의 첫 3행을 읽은 결과입니다.',
      caption: '고른 열로 읽은 시트 첫 3행 미리보기',
      unreadable: '형식을 읽을 수 없음',
      empty: '빈 칸',
      allUnreadable: '고른 열에서 값을 하나도 읽지 못했습니다. 열을 다시 확인해 주세요.',
      noRows: '시트에 아직 데이터 행이 없습니다. 연결한 뒤 첫 항목을 추가하면 이 시트에 기록됩니다.'
    },
    submit: '연결하기',
    reselect: '다른 시트 고르기'
  },
  /* B-1 탭 선택 — 비활성 문구는 **막힌 이유 + 푸는 방법**을 함께 말해야 한다. */
  tab: {
      openSheet: '구글 시트에서 열기',
    label: '탭',
    switching: '탭을 여는 중입니다',
    blockedByForm: '기록을 추가하거나 고치는 중에는 탭을 바꿀 수 없습니다. 저장하거나 취소한 뒤에 이동해 주세요.',
    blockedByQueue:
      '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요.'
  },
  month: {
    groupLabel: '월 이동'
  },
  summary: {
    netHint: '수입에서 지출을 뺀 금액입니다.',
    income: '수입',
    expense: '지출'
  },
  list: {
    title: '거래 내역',
    subtitle: '시트에 적힌 순서 그대로 보여 줍니다.',
    columnDate: '날짜',
    columnKind: '구분',
    columnCategory: '분류',
    columnAmount: '금액',
    columnMemo: '메모',
    columnActions: '작업',
    kindIncome: '수입',
    kindExpense: '지출',
    kindTransfer: '이체',
    noMemo: ''
  },
  /* B-2 신선도 — 429 문구는 여기 없다(`error.rateLimited*` 를 그대로 쓴다). */
  freshness: {
    refresh: '새로고침',
    updated: '시트 내용이 갱신되었습니다.'
  },
  /**
   * B-4 배당 겹쳐 보기 — 🔴 **전 문장이 "예상"임을 말한다**(AC4-8). 앱은 사용자가 배당을 실제로
   * 받았는지 알 수 없으므로 실수령처럼 쓰면 그 순간 거짓 고지가 된다.
   * 🔴 `subtitle` 이 "합계에는 더하지 않습니다"를 상시로 말한다 — 이 한 줄이 이중 계상 오해를 막는다.
   */
  dividend: {
    title: '배당 겹쳐 보기',
    subtitle: '내 포트폴리오 기준 예상 배당입니다. 위 수입·지출 합계에는 더하지 않습니다.',
    toggleAria: '배당 겹쳐 보기',
    off: '켜면 이 달 예상 배당이 지출의 어디까지를 덮는지 함께 보여 줍니다.',
    loading: '포트폴리오를 불러오는 중입니다.',
    unavailable: '포트폴리오를 불러오지 못해 예상 배당을 계산할 수 없습니다.',
    noHoldings: '내 포트폴리오에 종목과 보유 수량을 입력하면 이 달 예상 배당을 계산합니다.',
    amountHint: '세후 · 원화 환산 · 지급월에 균등 분배한 추정치입니다.',
    usdHint: '세후 · 달러 원값 · 지급월에 균등 분배한 추정치입니다.',
    fxUnavailable: '환율을 불러오지 못해 원화 환산과 지출 커버율을 표시할 수 없습니다.',
    coverageLabel: '지출 커버율',
    coverageUnderOne: '1% 미만',
    noExpense: '이 달에는 지출 기록이 없어 커버율을 계산하지 않습니다.',
    coveredNone: '이 달 지출에서 예상 배당만으로 덮이는 분류는 없습니다.'
  },
  emptyMonth: {
    titleCurrent: '이번 달 기록이 없습니다.',
    sheetEmpty: '시트에 아직 기록이 없습니다. 첫 항목을 추가하면 이 시트에 저장됩니다.',
    add: '항목 추가',
    prevMonth: '이전 달 보기'
  },
  form: {
    createTitle: '항목 추가',
    editTitle: '항목 수정',
    date: '날짜',
    kindLegend: '구분',
    kindIncome: '수입',
    kindExpense: '지출',
    kindTransfer: '이체',
    amount: '금액',
    amountUnit: '원',
    category: '항목',
    categoryPlaceholder: '예: 식비',
    categoryHint: '기본 분류에서 고르거나 새로 적을 수 있습니다.',
    categoryListLabel: '항목 제안',
    subcategory: '상세항목 (선택)',
    subcategoryPlaceholder: '예: 외식',
    subcategoryListLabel: '상세항목 제안',
    payer: '주체 (선택)',
    payerPlaceholder: '비워 두면 공동',
    payerListLabel: '주체 제안',
    payerHint: '2인 이상이 함께 쓸 때만 채우면 됩니다. 비워 두면 공동 지출입니다.',
    method: '결제수단 (선택)',
    methodPlaceholder: '예: 신한카드',
    methodListLabel: '결제수단 제안',
    fixed: '고정비',
    fixedHint: '매달 같은 자리에서 빠져나가는 돈이면 켜 주세요. 고정비만 따로 볼 수 있습니다.',
    memo: '내용 (선택)',
    submitCreate: '저장',
    submitEdit: '수정 저장',
    cancel: '취소',
    errors: {
      dateRequired: '날짜를 입력해 주세요.',
      dateFormat: '날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
      amountRequired: '금액을 입력해 주세요.',
      amountNumber: '금액은 숫자만 입력할 수 있습니다.',
      amountPositive: '금액은 0보다 큰 값이어야 합니다.',
      amountTooLarge: '금액은 1조 원 미만으로 입력해 주세요.',
      categoryRequired: '항목을 비우실 거라면 내용을 적어 주세요. 내용을 보고 항목을 채워 드립니다.',
      categoryTooLong: '항목은 40자까지 입력할 수 있습니다.',
      subcategoryTooLong: '상세항목은 40자까지 입력할 수 있습니다.',
      payerTooLong: '주체는 20자까지 입력할 수 있습니다.',
      methodTooLong: '결제수단은 40자까지 입력할 수 있습니다.',
      memoTooLong: '내용은 200자까지 입력할 수 있습니다.'
    }
  },
  analysis: {
    title: '이 달 살펴보기',
    subtitle: '숫자를 그대로 두고, 어디에 몰렸는지만 보여 드립니다.',
    empty: '아직 살펴볼 기록이 없습니다. 항목을 추가하면 이 자리에 요약이 생깁니다.',
    fixityHeading: '고정비와 변동비',
    fixityHint: '고정비는 계약을 바꿔야 줄고, 변동비는 이번 달에 줄일 수 있습니다.',
    fixedLabel: '고정비',
    variableLabel: '변동비',
    payerHeading: '누가 얼마를 썼나',
    payerHint: '주체를 적지 않은 기록은 공동으로 셉니다.',
    topHeading: '많이 쓴 항목',
    topHint: '이 달 기준 상위 다섯입니다.',
    trendHeading: '최근 흐름',
    trendHint: '기록이 있는 최근 여섯 달입니다. 이체(저축·투자)는 지출에 넣지 않습니다.',
    trendIncome: '수입',
    trendExpense: '지출',
    savingRateUnknown: '수입이 없어 저축률을 잴 수 없습니다'
  },

  carryOver: {
    title: '지난달 고정비를 이번 달에 넣습니다',
    body: '아래 항목이 이번 달 기록으로 추가됩니다. 금액이 달라졌으면 추가한 뒤 고쳐 주세요.',
    confirm: '추가',
    saving: '추가하는 중입니다',
    cancel: '취소'
  },

  remove: {
    title: '이 기록을 삭제합니다',
    body: '아래 기록을 시트에서 지웁니다. 되돌릴 수 없습니다.',
    fieldDate: '날짜',
    fieldKind: '구분',
    fieldCategory: '분류',
    fieldAmount: '금액',
    confirm: '삭제',
    cancel: '취소'
  },
  expired: {
    bannerTitle: '연결이 만료되었습니다',
    bannerBody: '구글 시트 연결이 만료되어 지금은 읽기만 할 수 있습니다. 아래 내용은 마지막으로 읽은 기록입니다.',
    reconnect: '다시 연결',
    reconnecting: '다시 연결하는 중입니다',
    writeBlockedHint: '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.',
    inFormBody: '연결이 만료되었습니다. 다시 연결하면 지금 입력한 내용을 그대로 저장합니다.',
    reconnectAndSave: '다시 연결하고 저장',
    reconnectAndRemove: '다시 연결하고 삭제',
    restored: '연결을 복구했습니다.'
  },
  error: {
    retry: '다시 시도',
    retryAll: '모두 다시 시도',
    network: {
      title: '저장하지 못했습니다',
      body: '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.'
    },
    permission: {
      title: '저장하지 못했습니다',
      body: '이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.'
    },
    // 🔴 위 `permission` 과 반드시 다른 문구여야 한다 — 구글이 "프로젝트에서 API 가 꺼짐"과
    //    "이 파일에 접근 불가"에 똑같이 403 을 주기 때문이다(2026-08-01 실제 오분류).
    apiDisabled: {
      title: '구글 시트 API가 켜져 있지 않습니다',
      body: 'Google Cloud Console에서 이 프로젝트의 Google Sheets API를 사용 설정한 뒤 다시 시도해 주세요. 시트 자체의 권한 문제가 아닙니다.'
    },
    rateLimited: {
      title: '요청이 잠시 제한되었습니다',
      body: '짧은 시간에 요청이 많아 구글이 잠시 제한했습니다. 잠시 뒤에 다시 시도해 주세요.'
    },
    unknown: {
      title: '저장하지 못했습니다',
      body: '시트에 저장하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.'
    },
    rowFailed: '저장 실패',
    partial: {
      listTitle: '저장하지 못한 기록',
      rateLimitedBlocked: '요청 제한이 풀린 뒤에 다시 시도할 수 있습니다.'
    }
  },
  denied: {
    title: '시트 접근 권한이 없어 연결하지 못했습니다',
    body: '구글 동의 화면에서 접근을 허용해야 가계부를 쓸 수 있습니다. 이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.',
    unaffected: '포트폴리오·시뮬레이터 등 다른 기능은 그대로 사용할 수 있습니다.',
    retry: '다시 시도'
  },
  conflict: {
    title: '시트가 변경되었습니다',
    body: '시트가 다른 곳에서 변경되었습니다. 새로고침 후 다시 시도하세요.',
    refresh: '새로고침',
    refreshing: '시트를 다시 읽는 중입니다'
  },
  created: {
    title: '가계부 시트를 만들었습니다',
    body: '이 시트는 사용자의 구글 드라이브에 있습니다. 앱 없이도 언제든 직접 열어 볼 수 있습니다.',
    open: '구글 시트에서 열기',
    openAria: '새로 만든 구글 시트를 새 탭에서 열기',
    dismiss: '안내 닫기'
  },
  live: {
    saved: '기록을 저장했습니다.',
    updated: '기록을 수정했습니다.',
    removed: '기록을 삭제했습니다.',
    refreshed: '시트를 다시 읽었습니다.'
  },
  privacy: {
    title: '기록은 사용자의 구글 계정에만 남습니다',
    where: '가계부 기록은 사용자의 구글 시트에 저장됩니다. 이 서비스의 서버는 금액·분류·메모를 저장하지 않으며, 전송받지도 않습니다.',
    scope: '이 앱이 받는 권한은 사용자가 직접 고르거나 새로 만든 시트 1개에 대한 접근뿐입니다. 드라이브의 다른 파일은 목록조차 볼 수 없습니다.',
    local: '이 브라우저에 남는 것은 시트 주소와 열 번호뿐입니다. 기록한 값 자체는 남지 않습니다.',
    revoke: '허용한 권한은 구글 계정 설정에서 언제든 취소할 수 있습니다. 취소해도 시트와 기록은 사용자 드라이브에 그대로 남습니다.'
  },
  footnote: {
    title: '이 화면에 대하여',
    order: '목록은 시트에 적힌 순서 그대로 보여 주며, 앱이 시트를 정렬하지 않습니다.'
  }
};

describe('LEDGER_COPY — 고정 문자열', () => {
  it('전 문자열이 스펙 확정 카피와 정확히 일치한다 (추가·삭제·축약 전부 잡는다)', () => {
    expect(stringLeaves(LEDGER_COPY)).toEqual(EXPECTED);
  });
});

describe('LEDGER_COPY — 문장을 만드는 카피', () => {
  it('월·요약·목록', () => {
    expect(LEDGER_COPY.month.label(2026, 8)).toBe('2026년 8월');
    expect(LEDGER_COPY.month.prev('2026년 7월')).toBe('이전 달로 이동, 2026년 7월');
    expect(LEDGER_COPY.month.next('2026년 9월')).toBe('다음 달로 이동, 2026년 9월');
    expect(LEDGER_COPY.month.todayAria('2026년 8월')).toBe('이번 달로 돌아가기, 2026년 8월');
    expect(LEDGER_COPY.month.moved('2026년 7월', 0)).toBe('2026년 7월 기록 0건입니다.');

    expect(LEDGER_COPY.summary.net('2026년 8월')).toBe('2026년 8월 순액');
    expect(LEDGER_COPY.summary.countHint(3)).toBe('3건');

    expect(LEDGER_COPY.list.caption('2026년 8월')).toBe('2026년 8월 수입·지출 기록');
    expect(LEDGER_COPY.list.editAria('8월 3일 (월)', '식비', '₩12,000')).toBe('8월 3일 (월) 식비 ₩12,000 기록 수정');
    expect(LEDGER_COPY.list.removeAria('8월 3일 (월)', '식비', '₩12,000')).toBe('8월 3일 (월) 식비 ₩12,000 기록 삭제');
    expect(LEDGER_COPY.list.retryAria('8월 3일 (월)', '식비', '₩12,000')).toBe(
      '8월 3일 (월) 식비 ₩12,000 기록 다시 저장'
    );
  });

  it('연결·매핑', () => {
    expect(LEDGER_COPY.mapping.sheetLine('우리집 가계부')).toBe('선택한 시트 우리집 가계부');
    expect(LEDGER_COPY.mapping.autoMatched(4)).toBe('머리글을 읽어 4개 항목을 자동으로 맞췄습니다. 다르면 직접 고쳐 주세요.');
    expect(LEDGER_COPY.mapping.columnOption('A', '사용일자')).toBe('A열 · 사용일자');
    expect(LEDGER_COPY.mapping.columnOption('B', '')).toBe('B열');
    expect(LEDGER_COPY.mapping.missing(['금액', '분류'])).toBe('아직 지정하지 않은 항목이 있습니다: 금액, 분류');
  });

  it('B-2 신선도 — 시각은 절대시각으로 말한다 ("3분 전" 류 상대시간 금지)', () => {
    expect(LEDGER_COPY.freshness.readAt('09:30')).toBe('09:30 기준');
  });

  it('🔴 히어로에는 연결 요약(meta)이 없다 — 같은 사실을 탭 줄·목록 헤더와 세 번 말하지 않는다', () => {
    expect('meta' in LEDGER_COPY.hero).toBe(false);
  });

  it('탭 — 탭이 하나면 이름만 말하고, 전환은 완료를 알린다', () => {
    expect(LEDGER_COPY.tab.single('2026')).toBe('2026 탭을 보고 있습니다');
    expect(LEDGER_COPY.tab.switched('2025')).toBe('2025 탭을 열었습니다.');
  });

  it('B-4 배당 — 달 이름과 숫자를 문장에 심는다', () => {
    expect(LEDGER_COPY.dividend.amountLabel('2026년 8월')).toBe('2026년 8월 예상 배당');
    expect(LEDGER_COPY.dividend.coverageHint('2026년 8월')).toBe('2026년 8월 지출 합계 대비 예상 배당의 비율입니다.');
    expect(LEDGER_COPY.dividend.noPayout('2026년 8월')).toBe('2026년 8월에 지급이 예정된 보유 종목이 없습니다.');
    expect(LEDGER_COPY.dividend.coveragePercent(17)).toBe('17%');
    expect(LEDGER_COPY.dividend.covered(['통신비', '구독료'])).toBe('통신비 · 구독료 지출을 덮는 정도입니다.');
    expect(LEDGER_COPY.dividend.unknownSchedule(3)).toBe('지급월을 알 수 없는 3종은 이 계산에 포함되지 않았습니다.');
  });

  it('빈 달', () => {
    expect(LEDGER_COPY.emptyMonth.titleOther('2026년 7월')).toBe('2026년 7월에 기록이 없습니다.');
    expect(LEDGER_COPY.emptyMonth.latestElsewhere('2026년 5월')).toBe('가장 최근 기록은 2026년 5월에 있습니다.');
    expect(LEDGER_COPY.emptyMonth.goLatest('2026년 5월')).toBe('2026년 5월로 이동');
  });

  it('🔴 부분 실패는 "M건 / 전체 N건"을 숫자로 말한다 — 뭉갠 표현이 아니다', () => {
    expect(LEDGER_COPY.error.partial.title(2, 5)).toBe('5건 중 2건을 저장했습니다');
    expect(LEDGER_COPY.error.partial.body(3)).toBe(
      '저장하지 못한 3건은 아래 목록에 그대로 남아 있습니다. 항목마다 사유를 확인하고 다시 시도할 수 있습니다.'
    );
  });

  it('🔴 429 는 다른 실패와 다른 문장·라벨을 쓴다', () => {
    expect(LEDGER_COPY.error.rateLimited.title).not.toBe(LEDGER_COPY.error.network.title);
    expect(LEDGER_COPY.error.rateLimited.body).not.toBe(LEDGER_COPY.error.unknown.body);
    expect(LEDGER_COPY.error.rateLimitedCountdown(30)).toBe('30초 뒤에 다시 시도할 수 있습니다.');
    expect(LEDGER_COPY.error.retryIn(27)).toBe('다시 시도 (27초)');
  });
});
