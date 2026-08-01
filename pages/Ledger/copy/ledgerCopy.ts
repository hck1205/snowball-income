/**
 * `/ledger` 가계부 화면의 **모든 카피**. 리터럴을 뷰·컴포넌트에 두지 않는다.
 *
 * 규칙(어기면 회귀):
 *  - 격식체. 요청·권유만 `~세요`/`~해 주세요`(`test/shared/copyTone.test.ts` 가 소스에서 잠근다).
 *  - 🚫 "눈덩이/스노우볼" 비유 금지 — 앱 이름과 콘텐츠를 연관 짓지 않는다.
 *  - 🔴 실패 문구는 **"일부 실패" 같은 뭉갠 말을 쓰지 않는다.** 항상 `M건 / 전체 N건` 을 숫자로 말한다.
 *  - 🔴 429(요청 제한)는 다른 실패와 **다른 문장**을 쓴다 — 같은 말이면 사용자가 연타한다.
 *  - 접근성 문자열(`aria-label`)도 같은 어미 규칙을 받는다.
 */
export const LEDGER_COPY = {
  hero: {
    title: '가계부',
    lede: '수입과 지출을 사용자의 구글 시트에 기록하고, 달마다 얼마를 벌고 썼는지 확인합니다.',
    /** 🔴 상시 노출. 권한 범위를 화면에서 한 번만 말하는 자리다(`PageHero.notice` = `role="note"`). */
    scopeNotice: '이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.',
    /** 연결 후에만. 값이 없으면 슬롯 자체를 넘기지 않는다 — 없는 값에 "—" 를 남기지 않는다. */
    meta: (sheetName: string, readAt: string) => `연결한 시트 ${sheetName} · ${readAt}에 읽었습니다`,
    addEntry: '항목 추가',
    openSheet: '시트에서 열기',
    openSheetAria: '연결된 구글 시트를 새 탭에서 열기'
  },

  connect: {
    heading: '가계부를 시작하는 방법을 고릅니다',
    existing: {
      title: '이미 쓰는 시트 연결하기',
      body: '구글 드라이브에서 가계부로 쓰던 시트를 고릅니다. 다음 단계에서 어느 열이 날짜·구분·금액·분류인지 지정합니다.',
      cta: '시트 고르기',
      loading: '구글 드라이브를 여는 중입니다'
    },
    create: {
      title: '새 가계부 시트 만들기',
      body: '날짜·구분·금액·분류·메모 열이 준비된 시트를 사용자의 드라이브에 새로 만듭니다. 만든 뒤에는 구글 시트에서 직접 열어 볼 수 있습니다.',
      cta: '새 시트 만들기',
      loading: '시트를 만드는 중입니다'
    },
    consentHint: '두 방법 모두 구글 로그인과 시트 접근 동의가 필요합니다. 동의는 구글 계정 설정에서 언제든 취소할 수 있습니다.',
    popupBlocked: '브라우저가 팝업을 막아 구글 창을 열지 못했습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'
  },

  mapping: {
    title: '열 지정',
    subtitle: '각 항목이 시트의 어느 열에 있는지 고릅니다. 첫 행을 열 이름으로 읽었습니다.',
    sheetLine: (name: string) => `선택한 시트 ${name}`,
    autoMatched: (n: number) => `머리글을 읽어 ${n}개 항목을 자동으로 맞췄습니다. 다르면 직접 고쳐 주세요.`,
    autoMatchedNone: '머리글에서 맞출 수 있는 항목을 찾지 못했습니다. 항목마다 열을 직접 골라 주세요.',
    fields: {
      date: '날짜',
      kind: '구분',
      amount: '금액',
      category: '분류',
      memo: '메모 (선택)'
    },
    required: '필수',
    unset: '선택 안 함',
    columnOption: (letter: string, header: string) => (header ? `${letter}열 · ${header}` : `${letter}열`),
    missing: (names: string[]) => `아직 지정하지 않은 항목이 있습니다: ${names.join(', ')}`,
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

  month: {
    groupLabel: '월 이동',
    label: (year: number, month: number) => `${year}년 ${month}월`,
    prev: (label: string) => `이전 달로 이동, ${label}`,
    next: (label: string) => `다음 달로 이동, ${label}`,
    todayAria: (label: string) => `이번 달로 돌아가기, ${label}`,
    moved: (label: string, count: number) => `${label} 기록 ${count}건입니다.`
  },

  summary: {
    net: (label: string) => `${label} 순액`,
    netHint: '수입에서 지출을 뺀 금액입니다.',
    income: '수입',
    expense: '지출',
    countHint: (n: number) => `${n}건`
  },

  list: {
    title: '거래 내역',
    subtitle: '시트에 적힌 순서 그대로 보여 줍니다.',
    caption: (label: string) => `${label} 수입·지출 기록`,
    columnDate: '날짜',
    columnKind: '구분',
    columnCategory: '분류',
    columnAmount: '금액',
    columnMemo: '메모',
    columnActions: '작업',
    kindIncome: '수입',
    kindExpense: '지출',
    noMemo: '',
    editAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 수정`,
    removeAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 삭제`,
    retryAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 다시 저장`
  },

  emptyMonth: {
    titleCurrent: '이번 달 기록이 없습니다.',
    titleOther: (label: string) => `${label}에 기록이 없습니다.`,
    latestElsewhere: (label: string) => `가장 최근 기록은 ${label}에 있습니다.`,
    goLatest: (label: string) => `${label}로 이동`,
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
    amount: '금액',
    amountUnit: '원',
    category: '분류',
    categoryPlaceholder: '예: 식비',
    categoryHint: '시트에 있는 분류에서 고르거나 새로 적을 수 있습니다.',
    categoryListLabel: '시트에 있는 분류',
    memo: '메모 (선택)',
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
      categoryRequired: '분류를 입력해 주세요.',
      categoryTooLong: '분류는 40자까지 입력할 수 있습니다.',
      memoTooLong: '메모는 200자까지 입력할 수 있습니다.'
    }
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
    rateLimited: {
      title: '요청이 잠시 제한되었습니다',
      body: '짧은 시간에 요청이 많아 구글이 잠시 제한했습니다. 잠시 뒤에 다시 시도해 주세요.'
    },
    rateLimitedCountdown: (seconds: number) => `${seconds}초 뒤에 다시 시도할 수 있습니다.`,
    retryIn: (seconds: number) => `다시 시도 (${seconds}초)`,
    unknown: {
      title: '저장하지 못했습니다',
      body: '시트에 저장하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.'
    },
    rowFailed: '저장 실패',
    partial: {
      title: (ok: number, total: number) => `${total}건 중 ${ok}건을 저장했습니다`,
      body: (failed: number) =>
        `저장하지 못한 ${failed}건은 아래 목록에 그대로 남아 있습니다. 항목마다 사유를 확인하고 다시 시도할 수 있습니다.`,
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

  /**
   * 화면당 **하나뿐인** 라이브 리전이 읽는 문장.
   * 🔴 오류는 여기서 말하지 않는다 — 오류는 `Banner role="alert"` 가 낭독한다(중복 낭독 금지).
   */
  live: {
    saved: '기록을 저장했습니다.',
    updated: '기록을 수정했습니다.',
    removed: '기록을 삭제했습니다.',
    refreshed: '시트를 다시 읽었습니다.'
  },

  footnote: {
    title: '이 화면에 대하여',
    ownership: '가계부 기록은 사용자의 구글 시트에만 저장됩니다. 이 앱의 서버에는 남지 않습니다.',
    order: '목록은 시트에 적힌 순서 그대로 보여 주며, 앱이 시트를 정렬하지 않습니다.',
    consent: '구글 계정에 준 접근 권한은 구글 계정 설정에서 언제든 취소할 수 있습니다.'
  }
} as const;
