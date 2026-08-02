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
    /*
     * 🔴 헤더 메뉴는 그대로 "가계부"다(`shared/constants/community/copy.ts` 의 `nav.ledger`).
     * 여기만 제품명을 붙인다 — 메뉴는 좁은 폭에서 다른 6개 항목과 폭을 다투고, 페이지 제목은
     * "지금 어느 서비스의 가계부인가"를 말해야 하는 자리라 역할이 다르다(2026-08-02 사용자 결정).
     * ⚠ 제품 리브랜딩(→ Hungry Hippo)은 아직 코드 전반에 적용하지 않았다 — 이 제목과 시트 파일명
     * (`APP_SPREADSHEET_TITLE`)만 새 이름을 쓰는 과도기다.
     */
    title: 'Hippo 가계부',
    lede: '수입과 지출을 사용자의 구글 시트에 기록하고, 달마다 얼마를 벌고 썼는지 확인합니다.',
    /** 🔴 상시 노출. 권한 범위를 화면에서 한 번만 말하는 자리다(`PageHero.notice` = `role="note"`). */
    scopeNotice: '이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.',
    /*
     * ⚠ 히어로에는 **연결 요약 줄(meta)이 없다**(2026-08-02, B-2). 예전에는
     * `연결한 시트 {탭 제목} · {HH:MM}에 읽었습니다` 를 여기서 말했는데, 그 뒤 같은 사실을 말하는
     * 자리가 둘 더 생겼다 — 탭 줄(`tab.single`/`tab.label`)이 "어느 장부"를, 목록 카드 헤더의
     * `freshness` 가 "언제 기준"을 말한다. 한 사실은 한 자리에서만 말한다.
     * 🔴 되살리지 마라 — 되살리면 탭이 1개일 때 같은 제목이 화면에 두 번 뜬다.
     */
    addEntry: '항목 추가',
    openSheet: '시트에서 열기',
    openSheetAria: '연결된 구글 시트를 새 탭에서 열기'
  },

  /**
   * **앱 로그인 게이트** — 🔴 구글 시트 접근 권한과 **다른 층**이다.
   *
   *  - 앱 신원("당신은 누구인가") = Supabase 세션. 구글·네이버·카카오 아무 계정이나 된다.
   *  - 구글 리소스 권한("당신 시트를 읽고 써도 되는가") = GIS 액세스 토큰(`drive.file`).
   *
   * 그래서 네이버로 로그인한 사용자도 앱 로그인을 유지한 채 구글 동의만 따로 받으면 된다
   * (중첩 로그인이 아니다). 두 층의 관계를 말하는 문장은 화면 전체에서
   * `connect.separateConsentNote` **하나뿐**이다 — 같은 말을 여러 자리에 복제하지 않는다.
   */
  signIn: {
    checking: '로그인 상태를 확인하는 중입니다',
    heading: '가계부를 열려면 먼저 로그인합니다',
    body: '구글·네이버·카카오 중 어느 계정으로 로그인해도 됩니다. 로그인한 다음 단계에서 기록할 구글 시트를 고릅니다.'
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
    /**
     * 🔴 앱 로그인을 이미 마친 사용자에게만 보인다.
     * "이미 구글로 로그인했는데 왜 또 동의하라고 하는가"가 이 화면에서 가장 흔한 혼란 지점이라,
     * 두 층이 왜 다른지를 **한 문장으로** 답한다(`signIn` 주석 참고).
     */
    separateConsentNote:
      '앱 로그인은 사용자를 확인하는 절차이고 시트 접근은 별개의 구글 권한이라, 구글 계정으로 로그인했더라도 시트 접근 동의는 따로 받습니다.',
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

  /**
   * B-1 탭 선택 — "어느 장부인가". 아래 `month`("어느 기간인가")와 **축이 다르다**.
   *
   * 🔴 탭 제목은 준PII 다. 여기 있는 문장 중 제목을 끼워 넣는 것은 화면에 그리는 `switched` 하나뿐이고,
   * 저장·GA·에러 문구에는 어디에도 넣지 않는다.
   * ⚠ 비활성 문구는 **막힌 이유 + 풀 방법**을 함께 말한다 — 사유 없는 회색 컨트롤을 만들지 않는다.
   */
  tab: {
    label: '탭',
    /** 탭이 하나뿐일 때. 고를 것이 없으므로 드롭다운을 만들지 않고 이름만 말한다. */
    single: (title: string) => `${title} 탭을 보고 있습니다`,
    switching: '탭을 여는 중입니다',
    switched: (title: string) => `${title} 탭을 열었습니다.`,
    blockedByForm: '기록을 추가하거나 고치는 중에는 탭을 바꿀 수 없습니다. 저장하거나 취소한 뒤에 이동해 주세요.',
    blockedByQueue:
      '저장하지 못한 기록이 남아 있어 탭을 바꿀 수 없습니다. 지금 탭을 바꾸면 다시 시도할 때 다른 탭에 기록됩니다. 아래 목록에서 다시 저장한 뒤에 이동해 주세요.'
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

  /**
   * B-2 신선도 — 목록 카드 헤더의 "언제 기준인가 · 다시 읽기".
   *
   * 🔴 **"자동으로 최신입니다" 류의 약속을 하지 않는다.** 이 화면은 폴링하지 않는다(창으로 돌아오고
   * 5분이 지났을 때만 다시 읽는다). 늘 최신인 척하면 그 문구부터 거짓이 된다.
   * ⚠ 429 문구·카운트다운은 새로 만들지 않고 `error.rateLimited*` 를 그대로 쓴다 — 같은 사건을
   * 두 목소리로 말하면 사용자가 다른 일이 났다고 읽는다.
   */
  freshness: {
    refresh: '새로고침',
    /** 시각만 말한다. "3분 전" 같은 상대시간은 렌더 시점마다 값이 달라져 화면이 흔들린다. */
    readAt: (time: string) => `${time} 기준`,
    /**
     * 재조회 결과가 직전과 달랐을 때. 🔴 **무엇이 달라졌는지는 말하지 않는다** — 물리 삭제가 행
     * 번호를 밀면 옛 행과 새 행의 대응이 불확실해서, 행 단위로 짚으면 그건 날조다.
     */
    updated: '시트 내용이 갱신되었습니다.'
  },

  /**
   * B-4 배당 겹쳐 보기 — "내 예상 배당이 이 달 지출의 어디까지를 덮는가".
   *
   * 🔴 **전부 "예상"이다.** 앱은 사용자가 배당을 실제로 받았는지 알 방법이 없다(입금 내역을 보지
   * 못한다). 아는 것은 내 포트폴리오의 보유 수량·배당률·지급월뿐이라, 모든 문장이 "예상"과
   * "내 포트폴리오 기준"을 말하고 **실수령처럼 쓰지 않는다**.
   * 🔴 **가계부 합계에 더하지 않는다** — 더하면 "가계부 총합"의 정의가 둘이 되고, 사용자가 배당
   * 입금을 시트에 이미 적어 뒀다면 이중 계상이 된다. 그래서 `subtitle` 이 그 사실을 상시로 말한다.
   * 🔴 시트에 쓰지 않는다 — 이 기능에는 쓰기 경로가 없다(화면 오버레이 전용).
   */
  dividend: {
    title: '배당 겹쳐 보기',
    subtitle: '내 포트폴리오 기준 예상 배당입니다. 위 수입·지출 합계에는 더하지 않습니다.',
    /** 스위치의 접근명. 시각 라벨(카드 제목)과 같은 말을 쓴다. */
    toggleAria: '배당 겹쳐 보기',
    /** 꺼져 있을 때의 한 줄 — 켜면 무엇을 보게 되는지. */
    off: '켜면 이 달 예상 배당이 지출의 어디까지를 덮는지 함께 보여 줍니다.',
    loading: '포트폴리오를 불러오는 중입니다.',
    /** 🔴 값을 0 으로 위장하지 않는다 — 못 읽었다고 말한다. */
    unavailable: '포트폴리오를 불러오지 못해 예상 배당을 계산할 수 없습니다.',
    noHoldings: '내 포트폴리오에 종목과 보유 수량을 입력하면 이 달 예상 배당을 계산합니다.',
    noPayout: (label: string) => `${label}에 지급이 예정된 보유 종목이 없습니다.`,

    amountLabel: (label: string) => `${label} 예상 배당`,
    amountHint: '세후 · 원화 환산 · 지급월에 균등 분배한 추정치입니다.',
    /** 환율이 없을 때의 단위 안내 — 원화로 위장하지 않는다. */
    usdHint: '세후 · 달러 원값 · 지급월에 균등 분배한 추정치입니다.',
    fxUnavailable: '환율을 불러오지 못해 원화 환산과 지출 커버율을 표시할 수 없습니다.',

    coverageLabel: '지출 커버율',
    coveragePercent: (percent: number) => `${percent}%`,
    /** 반올림하면 0% 가 되는 구간. 🔴 0% 로 적으면 "배당이 없다"로 읽힌다. */
    coverageUnderOne: '1% 미만',
    coverageHint: (label: string) => `${label} 지출 합계 대비 예상 배당의 비율입니다.`,
    /** 🔴 지출이 0 인 달에는 커버율을 만들지 않는다(0 나눗셈을 100% 로 위장하지 않는다). */
    noExpense: '이 달에는 지출 기록이 없어 커버율을 계산하지 않습니다.',

    covered: (names: readonly string[]) => `${names.join(' · ')} 지출을 덮는 정도입니다.`,
    coveredNone: '이 달 지출에서 예상 배당만으로 덮이는 분류는 없습니다.',
    /** 지급월을 모르는 종목은 이 달 계산에서 빠진다 — 빠진 사실을 숨기지 않는다. */
    unknownSchedule: (count: number) => `지급월을 알 수 없는 ${count}종은 이 계산에 포함되지 않았습니다.`
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
    /*
     * 🔴 위 `permission` 과 반드시 갈라 둔다. 구글은 **프로젝트에서 Sheets API 가 꺼진 것**과
     * **그 파일에 접근할 수 없는 것**에 똑같이 403 을 준다. 앱이 방금 만든 시트에서도 이 오류가 나므로,
     * "시트 편집 권한을 확인하세요"라고 안내하면 사용자가 고칠 수 없는 곳을 헤매게 된다.
     */
    apiDisabled: {
      title: '구글 시트 API가 켜져 있지 않습니다',
      body: 'Google Cloud Console에서 이 프로젝트의 Google Sheets API를 사용 설정한 뒤 다시 시도해 주세요. 시트 자체의 권한 문제가 아닙니다.'
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
    /*
     * 이 카드에서 여는 길은 **이 버튼 하나뿐**이다. 예전에는 시트 이름 링크가 함께 있었는데
     * 같은 곳으로 가는 길이 둘이라 2026-08-01 에 링크를 뺐다. 히어로의 `시트에서 열기` 와는
     * 문구를 갈라 둔다 — 이건 "방금 만든 그것"을 가리키므로 `구글` 을 붙여 대상을 분명히 한다.
     */
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

  /**
   * 🔴 **보안·프라이버시의 단일 출처.** 가계부는 소득과 지출이라 이 앱에서 가장 민감한 데이터이고,
   * 사용자가 권한을 허용하기 **전에** 무엇이 어디에 남는지 알아야 한다. 그래서 푸트노트가 아니라
   * **연결 화면 본문**에 세운다(2026-08-01 사용자 요청 — "보안성을 잘 정리해서 강조").
   *
   * ⚠ 여기 적은 네 문장은 전부 **구현이 실제로 하는 일**이다. 하나라도 코드와 어긋나면 허위 고지가 된다:
   *   - `where`   → 이 앱에는 가계부 저장소가 없다(서버로 보내는 경로가 존재하지 않는다)
   *   - `scope`   → `GOOGLE_SHEETS_SCOPE = '…/auth/drive.file'` 하나뿐(`config.ts`)
   *   - `local`   → 브라우저에 남는 것은 시트 ID·탭 ID·열 인덱스뿐(`useLedgerConnection` 의 연결 정보)
   *   - `revoke`  → 구글 계정 설정에서 취소 가능(우리가 통제하지 않는다)
   * 기능을 바꾸면 **이 문장부터 고쳐라.**
   */
  privacy: {
    title: '기록은 사용자의 구글 계정에만 남습니다',
    where: '가계부 기록은 사용자의 구글 시트에 저장됩니다. 이 서비스의 서버는 금액·분류·메모를 저장하지 않으며, 전송받지도 않습니다.',
    scope: '이 앱이 받는 권한은 사용자가 직접 고르거나 새로 만든 시트 1개에 대한 접근뿐입니다. 드라이브의 다른 파일은 목록조차 볼 수 없습니다.',
    local: '이 브라우저에 남는 것은 시트 주소와 열 번호뿐입니다. 기록한 값 자체는 남지 않습니다.',
    revoke: '허용한 권한은 구글 계정 설정에서 언제든 취소할 수 있습니다. 취소해도 시트와 기록은 사용자 드라이브에 그대로 남습니다.'
  },

  footnote: {
    title: '이 화면에 대하여',
    // ⚠ 소유·권한·취소 문장은 위 `privacy` 가 소유한다 — 여기 다시 적지 마라(같은 말이 두 곳에서 갈린다).
    order: '목록은 시트에 적힌 순서 그대로 보여 주며, 앱이 시트를 정렬하지 않습니다.'
  }
} as const;
