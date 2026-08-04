/**
 * 커뮤니티 한국어 카피 — 한 곳에서 관리한다.
 * 톤: **격식체("~습니다")로 전 앱 통일**(확정 결정). 요청·권유는 격식체 안에서 "~해 주세요"·"~하세요"를 쓰고,
 * 서술·상태·에러는 "~습니다"로 끝낸다. 해요체("~해요/~돼요/~없어요/~이에요")는 쓰지 않는다 —
 * 접근성 텍스트(aria-label 등)도 같은 규칙이다. `test/shared/copyTone.test.ts`가 소스 수준으로 잠근다
 * (이 파일은 그 스캔의 앵커 4개 중 하나다 — 경로가 바뀌면 그 테스트가 먼저 빨개진다).
 */
export const COMMUNITY_COPY = {
  nav: {
    community: '커뮤니티',
    simulator: '시뮬레이터',
    toSimulator: '시뮬레이터로',
    write: '글쓰기',
    login: '로그인',
    logout: '로그아웃',
    theme: '테마',
    // ── 전역 nav(PrimaryNav) — 브랜드 링크 + 라우트 링크(시뮬레이터·갤러리·게시판) ──
    /** nav 랜드마크 이름(<nav aria-label>). */
    primaryLabel: '주요 메뉴',
    /**
     * 브랜드 워드마크(홈 링크의 접근명). 표기는 **"Hungry Hippo" 영문 하나로 통일**한다(2026-08-03 확정).
     *
     * 🔴 **한글 음차("헝그리 히포")를 만들지 마라.** 브랜드 키트가 영문 워드마크이고, 한글 카피 사이에
     * 음차를 섞으면 같은 제품 이름이 두 표기로 갈린다. 화면·메타·본문이 전부 이 한 낱말을 쓴다 —
     * 예전처럼 "화면은 한글, <title> suffix 는 영문" 으로 계층을 나누지 않는다.
     *
     * 앞뒤 두 낱말을 서로 다른 색으로 그리므로 PrimaryNav 가 **공백으로 쪼개 쓴다**("Hungry" / "Hippo").
     * 낱말 수·공백 위치를 바꾸면 색 분할이 함께 바뀐다.
     *
     * ⚠ 슬로건 "FEED YOUR FUTURE" 는 **로고 락업 전용**이다 — 여기에도 UI 카피에도 붙이지 마라.
     */
    brand: 'Hungry Hippo',
    /** 커뮤니티 갤러리 링크(/community). */
    gallery: '포트폴리오 갤러리',
    /** 자유게시판 링크(/community/board). */
    board: '게시판',
    /** 티커 SEO 소개 허브 링크(/ticker/all). 커뮤니티와 무관하게 항상 노출된다. */
    tickers: 'ETF 소개',
    /** 종목 비교(/ticker/compare). ETF 소개와 같은 '종목 정보' 축이라 그 바로 뒤에 선다. */
    tickerCompare: '종목 비교',
    /** 배당 지급 월 캘린더(/dividend/calendar). 시뮬 결과가 아니라 관측 지급월 기반 페이지다. */
    dividendCalendar: '배당 캘린더',
    /**
     * 내 포트폴리오(/dividend/portfolio). 보유 종목·수량으로 현재 배당을 계산한다.
     * 목표 달성률·예상 달성 시점도 이 화면 안에 있다(구 /dividend/goal 흡수).
     * ⚠ 단독 '포트폴리오' 금지 — 같은 nav 에 `gallery: '포트폴리오 갤러리'` 가 있어 서로 헷갈린다.
     *   이 금지는 **목적지 링크**에 대한 것이다. 아래 `portfolioGroup` 은 링크가 아니라 묶음 이름이라
     *   예외다(눌러도 이동하지 않고 이 항목을 자식으로 펼친다) — 자세한 근거는 그 주석에 있다.
     */
    myPortfolio: '나의 배당 포트폴리오',
    /**
     * 포트폴리오 묶음 메뉴(드롭다운) 이름 — 자식은 `myPortfolio` · `investors` · `gallery` 셋이다
     * (2026-08-02 사용자 지시). nav 항목이 8개에 닿아 더 늘릴 수 없어 같은 축을 접었다.
     * ⚠ `gallery` 는 커뮤니티 기능이라 `isCommunityEnabled` 가 꺼지면 이 묶음에서도 빠진다.
     * 🔴 **목적지가 아니다.** `/portfolio` 같은 라우트는 없다 — 이 낱말에 링크를 달지 마라.
     */
    portfolioGroup: '포트폴리오',
    /**
     * 대가들의 포트폴리오(/portfolio/investors). SEC 13F 공시로 만든 유명 투자자 보유 종목 화면.
     * ⚠ '대가들의 포폴' 같은 줄임말 금지 — 앱 카피는 격식체를 쓴다.
     */
    investors: '대가들의 포트폴리오',
    /**
     * 국민연금 미국 주식 포트폴리오(/portfolio/nps). SEC 13F 공시로 만든 화면이다.
     * ⚠ '국민연금'만 쓰지 않는다 — 이 화면은 기금 전체가 아니라 **미국 주식 신고분**이라,
     *   이름이 그 범위를 먼저 말해야 사용자가 비중을 기금 비중으로 오해하지 않는다.
     */
    npsPortfolio: '국민연금 (미국 주식)',
    /**
     * 국회의원 주식 거래(/portfolio/congress). 미 하원 STOCK Act 정기거래보고서 기반.
     * ⚠ '보유'가 아니라 '거래'다 — 신고서가 사고판 기록이라 보유 현황은 알 수 없다.
     *   이름에서 그 구분이 무너지면 화면 전체가 거짓이 된다.
     */
    congressTrades: '국회의원 주식 거래',
    /**
     * 캘린더 묶음 메뉴 이름 — 자식은 배당 캘린더(`/dividend/calendar`)와
     * 미국 증시 캘린더(`/market/us-calendar`) 둘이다(2026-08-04 신설).
     * 🔴 **묶음이지 목적지가 아니다** — `/calendar` 라우트는 없다.
     * 왜 묶었나: 증시 캘린더가 아홉 번째 nav 항목이 될 뻔했다. 두 화면 다 "언제"를 묻는 축이라
     * 묶는 값이 가장 컸고, 묶어서 상한(8)을 지켰다(`portfolioGroup` 과 같은 처방).
     */
    calendarGroup: '캘린더',
    /** 미국 증시 캘린더(/market/us-calendar). 휴장일·개장 시각·주요 발표 일정. */
    marketCalendar: '미국 증시 캘린더',
    /**
     * 가계부(/ledger). 🔴 아래 `ledger.menuItem`(프로필 드롭다운)과 **같은 낱말이어야 한다** —
     * 같은 목적지를 두 진입점이 다른 이름으로 부르면 사용자는 두 화면으로 읽는다.
     * ⚠ 환경변수가 없으면(가계부 비활성) 라우트 자체가 없으므로 이 항목도 렌더하지 않는다.
     */
    ledger: '가계부',
    /**
     * 배당 목록 묶음 메뉴(드롭다운) 이름 — 자식은 허브(`/dividend/lists`) + 배당킹·배당귀족·배당챔피언
     * 셋이다. 🔴 **묶음이지 목적지가 아니다** — 눌러도 이동하지 않고 자식을 펼친다(`portfolioGroup` 과
     * 같은 규칙). 목록 셋을 nav 에 각각 올리면 항목이 8 → 11개가 되어 상한(8)을 넘는다.
     */
    dividendListGroup: '배당 리스트',
    /** 묶음 안 첫 항목 = 허브(`/dividend/lists`). 세 목록의 차이를 비교하는 화면이다. */
    dividendListHub: '목록 비교',
    /** 배당킹(/dividend/kings) — 연속 증배 50년 이상. */
    dividendKings: '배당킹',
    /**
     * 배당귀족(/dividend/aristocrats) — S&P 500 소속 + 연속 증배 25년 이상.
     * ⚠ 영문 상표명(Dividend Aristocrats)을 메뉴에 쓰지 않는다 — 그 낱말은 S&P Dow Jones Indices 의
     *   상표라, 화면 카피는 한국어 서술어를 쓰고 영문 지수명은 출처 문장 안에서만 등장시킨다.
     */
    dividendAristocrats: '배당귀족',
    /** 배당챔피언(/dividend/champions) — 지수 소속과 무관한 연속 증배 25~49년. */
    dividendChampions: '배당챔피언',
    /** 상세/글쓰기 하위에서 목록으로 복귀하는 뒤로가기 라벨. */
    list: '목록'
  },
  gallery: {
    mainLabel: '시나리오 목록',
    sortAriaLabel: '정렬 기준',
    sortRecent: '최신',
    sortPopular: '인기',
    viewCard: '카드 보기',
    viewInline: '목록 보기',
    metaViews: '조회수',
    metaLikes: '좋아요',
    metaComments: '댓글',
    simBadge: '시뮬 결과',
    loadingMore: '더 불러오는 중…',
    reachedEnd: '마지막 시나리오입니다',
    emptyTitle: '아직 공유된 시나리오가 없습니다',
    emptySubtitle: '첫 번째 시나리오를 공유해 주세요.',
    emptyCta: '글쓰기',
    searchEmptyTitle: (query: string) => `'${query}'에 대한 결과가 없습니다`,
    searchEmptySubtitle: '다른 검색어나 필터를 사용해 주세요.',
    searchEmptyCta: '검색 초기화',
    errorTitle: '목록을 불러오지 못했습니다',
    errorBody: '잠시 후 다시 시도해주세요.',
    retry: '다시 시도',
    searchPlaceholder: '포트폴리오 검색',
    searchAriaLabel: '포트폴리오 검색',
    searchFilterAriaLabel: '검색 필터',

    // ── 정밀 검색(PrecisionSearch) — 트리거·패널·필드·빈결과 (단일 원천) ──
    filterTitle: '정밀 검색',
    filterTriggerAria: '정밀 검색',
    filterActiveCountAria: (n: number) => `적용된 필터 ${n}개`,
    filterClose: '닫기',

    filterMonthlyLabel: '월 배당(세후)',
    filterMonthlyMinAria: '월 배당 최소',
    filterMonthlyMaxAria: '월 배당 최대',
    filterMonthlyHint: '세후 월 배당 기준입니다.',

    filterTargetLabel: '목표 월 배당',
    filterTargetMinAria: '목표 월 배당 이상',
    filterTargetSuffix: '이상',

    filterDurationLabel: '투자 기간',
    filterDurationMinAria: '투자 기간 최소',
    filterDurationMaxAria: '투자 기간 최대',

    // 티커(TICKER_FILTER_ENABLED=true 될 때만 사용 — 미리 정의)
    filterTickerLabel: '종목(티커)',
    filterTickerAria: '종목 티커',
    filterTickerPlaceholder: '티커 검색 (예: SCHD)',

    unitManwon: '만원',
    unitYear: '년',

    filterApply: '적용',
    filterReset: '초기화',
    filterRangeError: '최솟값이 최댓값보다 클 수 없습니다.',

    // filteredEmpty 빈상태
    filterEmptyTitle: '조건에 맞는 시나리오가 없습니다',
    filterEmptySubtitle: '검색어나 필터를 바꿔 주세요.',
    filterEmptyCta: '필터 초기화'
  },
  board: {
    // 커뮤니티 게시판(질문·고민·인사이트·컬럼·건의·잡담) — 최신순.
    // 🔴 명칭은 '자유게시판'이 아니라 **'커뮤니티 게시판'**이다(2026-08-03 사용자 지시).
    // subtitle 의 나열은 글 종류 드롭다운(POST_CATEGORY_IDS)과 어휘를 맞춘다 — 무엇을 골라야 할지
    // 목록에서 미리 감이 오도록. '자유'는 마지막 "무엇이든"이 대신 가리킨다.
    mainLabel: '커뮤니티 게시판',
    title: '커뮤니티 게시판',
    subtitle: '질문·고민·인사이트·건의, 무엇이든 자유롭게 이야기해 주세요.',
    write: '글쓰기',
    loadingMore: '더 불러오는 중…',
    reachedEnd: '마지막 글입니다',
    emptyTitle: '아직 글이 없습니다',
    emptySubtitle: '첫 글을 남겨 주세요.',
    emptyCta: '글쓰기',
    errorTitle: '게시판을 불러오지 못했습니다',
    errorBody: '잠시 후 다시 시도해주세요.',
    retry: '다시 시도',

    // 글 분류 필터(2026-08-04 사용자 지시로 읽기 전용 범례 → 누를 수 있는 필터가 됐다).
    // 🔴 낱말 '글 종류' 는 여기서 쓰지 않는다 — 라벨 줄 자체를 없애라는 지시였고, 분류 낱말은
    //    칩이 스스로 말한다. (글쓰기 폼의 `write.fieldCategory` 는 드롭다운 라벨이라 그대로 산다.)
    categoryFilterLabel: '글 분류 필터',
    /** 필터 없음(=조건 없음). 여섯 번째 분류가 아니라 "전부 보기"라 짧은 낱말로 둔다. */
    categoryAll: '전체',
    // filteredEmpty 빈상태 — "아직 글이 없습니다"는 필터가 걸린 목록에서 거짓말이 된다.
    filterEmptyTitle: '이 분류에는 아직 글이 없습니다',
    filterEmptySubtitle: '다른 분류를 골라 보시거나 전체로 돌아가 주세요.',
    filterEmptyCta: '전체 보기'
  },
  write: {
    titleNew: '시나리오 공유',
    titleEdit: '시나리오 수정',
    // 자유게시판 글쓰기/수정(같은 폼 재사용, kind='board') — 시나리오 공유가 아니라 자유글이다.
    titleNewBoard: '새 글 쓰기',
    titleEditBoard: '글 수정',
    /** 게시판 본문 플레이스홀더 — 전략 설명이 아니라 자유 주제. */
    bodyPlaceholderBoard: '자유롭게 이야기를 남겨 주세요.',
    fieldTitle: '제목',
    /**
     * 제목 플레이스홀더 — 라벨('제목')을 그대로 되풀이하지 않고 "무엇을 쓰면 되는지"를 알려준다.
     * 본문 플레이스홀더(bodyPlaceholder/bodyPlaceholderBoard)와 같은 방식으로 kind별로 나뉜다.
     */
    titlePlaceholder: '어떤 포트폴리오인지 한 줄로 적어주세요',
    /** 게시판 제목 플레이스홀더 — 포트폴리오 공유가 아니라 자유 주제. */
    titlePlaceholderBoard: '어떤 이야기인지 한 줄로 적어주세요',
    fieldBody: '내용',
    fieldAttachment: '시뮬레이션',
    /**
     * 자유게시판(kind='board') 전용 분류 드롭다운. 갤러리에는 없다.
     * DB 는 영어 슬러그(free · question · insight · suggestion · notice)로 저장하고
     * 라벨만 한국어다.
     */
    fieldCategory: '글 종류',
    /**
     * 슬러그 → 화면 라벨. 목록 배지(PostRow)도 **같은 맵**을 써야 표기가 어긋나지 않는다.
     * 표시 순서는 여기가 아니라 `POST_CATEGORY_IDS`(config.ts)가 정한다.
     */
    categoryLabels: {
      free: '자유',
      question: '질문&고민',
      insight: '인사이트',
      suggestion: '건의사항',
      notice: '공지'
    },
    bodyAriaLabel: '내용',
    toolbarAriaLabel: '서식',
    bold: '굵게',
    italic: '기울임',
    underline: '밑줄',
    strike: '취소선',
    inlineCode: '인라인 코드',
    heading2: '제목',
    heading3: '소제목',
    blockquote: '인용',
    codeBlock: '코드 블록',
    bulletList: '글머리 목록',
    orderedList: '번호 목록',
    horizontalRule: '구분선',
    /**
     * 표. 삽입은 항상 보이는 버튼(아이콘) 하나, 나머지 조작 5개는 커서가 표 안일 때만 나타나는
     * 컨텍스트 행이라 아이콘 대신 **텍스트 라벨**을 쓴다(행/열 × 추가/삭제는 아이콘으로 구분이 안 된다).
     */
    insertTable: '표 삽입',
    tableAddRow: '행 추가',
    tableDeleteRow: '행 삭제',
    tableAddColumn: '열 추가',
    tableDeleteColumn: '열 삭제',
    tableDelete: '표 삭제',
    undo: '실행 취소',
    redo: '다시 실행',
    link: '링크',
    linkUrlPlaceholder: 'https://',
    linkApply: '적용',
    linkRemove: '해제',
    /**
     * 툴바 버튼 title(툴팁)에 붙는 단축키 힌트. 접근명(aria-label)은 위 라벨 그대로 두고,
     * 툴팁에만 "굵게 (Ctrl+B)" 형태로 합쳐 보여준다.
     */
    shortcutBold: 'Ctrl+B',
    shortcutItalic: 'Ctrl+I',
    shortcutUnderline: 'Ctrl+U',
    shortcutStrike: 'Ctrl+Shift+S',
    shortcutInlineCode: 'Ctrl+E',
    shortcutHeading2: 'Ctrl+Alt+2',
    shortcutHeading3: 'Ctrl+Alt+3',
    shortcutBlockquote: 'Ctrl+Shift+B',
    shortcutCodeBlock: 'Ctrl+Alt+C',
    shortcutBulletList: 'Ctrl+Shift+8',
    shortcutOrderedList: 'Ctrl+Shift+7',
    shortcutUndo: 'Ctrl+Z',
    shortcutRedo: 'Ctrl+Shift+Z',
    /** 툴바 그룹(role=group) 접근명 — 버튼이 늘어 줄바꿈되므로 그룹으로 묶어 탐색을 돕는다. */
    toolbarGroupInline: '글자 서식',
    toolbarGroupBlock: '문단 서식',
    toolbarGroupList: '목록',
    toolbarGroupInsert: '삽입',
    toolbarGroupHistory: '실행 이력',
    /** 커서가 표 안일 때만 나타나는 조작 행(조건부 렌더)의 접근명. */
    toolbarGroupTable: '표 편집',
    bodyPlaceholder: '어떤 전략인지, 왜 이렇게 구성했는지 적어 주세요.',
    visibilityPublic: '공개 — 커뮤니티 갤러리에 노출됩니다.',
    visibilityPrivate: '비공개 — 나만 볼 수 있습니다.',
    sectionPublish: '게시 설정',
    bodyOrAttachHint: '내용과 시뮬레이션 중 하나만 있어도 게시할 수 있습니다.',
    /** 게시판(kind='board')은 시뮬 첨부가 없어 본문이 필수다 — 위 힌트(첨부 대체 가능)를 쓰면 거짓말이 된다. */
    bodyRequiredHintBoard: '제목과 내용을 입력하면 게시할 수 있습니다.',
    attachSectionHint: '첨부하면 읽는 사람이 내 포트폴리오와 투자 설정을 시뮬레이터에서 그대로 열어볼 수 있습니다.',
    attachToggleLabel: '첨부',
    attachPickerHeading: '첨부할 시나리오를 고르세요. 고르는 즉시 첨부됩니다.',
    attachPickerGroupLabel: '첨부할 시나리오',
    attachOptionUnavailable: '첨부할 수 없습니다',
    attachEmptyTitle: '아직 첨부할 시뮬레이션이 없습니다',
    attachEmptyBody: '메인 화면에서 포트폴리오와 투자 설정을 만들면 여기에서 바로 첨부할 수 있습니다.',
    attachEmptyCta: '시뮬레이터로 가기',
    attachedHint: '첨부 시점의 설정이 저장됩니다. 게시하면 읽는 사람이 시뮬레이터에서 그대로 열어볼 수 있습니다.',
    attachTickerCount: (count: number) => `티커 ${count}개`,
    submitNew: '게시',
    submitEdit: '수정 완료',
    cancel: '취소',
    loginGateTitle: '로그인하고 시나리오를 공유하세요',
    loginGateSubtitle: '로그인하면 시나리오를 공유하고 좋아요·댓글을 남길 수 있습니다.',
    counter: (current: number, max: number) => `${current}/${max}`,
    errorTitleRequired: '제목을 입력해주세요.',
    errorTitleTooLong: '제목은 80자까지 쓸 수 있습니다.',
    errorBodyRequired: '내용이나 시뮬레이션 중 하나는 있어야 합니다.',
    errorBodyTooLong: '내용이 너무 깁니다. 조금 줄여주세요.',
    errorBodyTooLarge: '내용이 너무 깁니다. 서식이나 길이를 줄여주세요.',
    issueTooManyTickers: '티커가 너무 많습니다. 최대 50개까지 첨부할 수 있습니다.',
    issuePayloadTooLarge: '시나리오 데이터가 너무 큽니다. 티커 수나 본문을 줄여주세요.',
    issueMissingSettings: '시뮬레이션 설정이 비어 있습니다. 시뮬레이터에서 먼저 구성해주세요.',
    saveFailed: '게시에 실패했습니다. 잠시 후 다시 시도해주세요.',
    leaveConfirmTitle: '작성 중인 내용이 있습니다',
    leaveConfirmBody: '나가면 사라집니다.',
    leaveConfirmStay: '계속 작성',
    leaveConfirmLeave: '나가기'
  },
  detail: {
    mainLabel: '시나리오 상세',
    attachCtaTitle: '이 시나리오로 시뮬레이션 열기',
    attachCtaButton: '시뮬레이터에서 열어보기',
    previewTitle: '시나리오 미리보기',
    previewChartLabel: '포트폴리오 비중',
    edit: '수정',
    delete: '삭제',
    deleteConfirmTitle: '이 시나리오를 삭제하시겠습니까?',
    deleteConfirmBody: '되돌릴 수 없습니다.',
    deleteConfirm: '삭제',
    deleteCancel: '취소',
    likeAria: '좋아요',
    likeActiveAria: '좋아요 취소',
    share: '공유',
    shareAria: '이 글 공유하기',
    /**
     * ⚠ **현재 소비처가 없다**(2026-08-03 실측: 레포·api 번들 통틀어 이 키를 읽는 코드 0건).
     * 실제 공유는 `usePostShare` 가 **글 제목과 URL 만** 넘긴다(네이티브 시트·채널 URL 모두).
     * 즉 이 문장은 어디에도 렌더되지 않으므로 "공유 문구에 브랜드가 들어간다"고 읽지 마라 —
     * 공유 문구를 실제로 바꾸려면 그 훅의 `title` 조립부터 손대야 한다.
     * 문구 자체는 브랜드 교체(2026-08-03)에 맞춰 갱신해 두었다: 되살릴 때 옛 제품명이 새어 나오지 않도록.
     */
    shareText: 'Hungry Hippo에서 만든 배당 포트폴리오입니다.',
    shareToastCopied: '링크를 복사했습니다.',
    shareToastFailed: '복사에 실패했습니다. 링크:',
    /* 채널 새 창이 브라우저 팝업 차단에 막혔을 때 — 아무 일도 안 일어난 것처럼 보이면 안 된다. */
    shareToastPopupBlocked: '브라우저가 새 창을 막았습니다. 팝업을 허용하거나 링크를 복사해 주세요.',
    notFoundTitle: '시나리오를 찾을 수 없습니다',
    notFoundCta: '목록으로',
    errorTitle: '시나리오를 불러오지 못했습니다',
    errorBody: '잠시 후 다시 시도해주세요.',
    retry: '다시 시도'
  },
  comments: {
    sectionLabel: '댓글',
    heading: (count: number) => `댓글 ${count}`,
    placeholder: '댓글을 남겨 주세요.',
    reply: '답글',
    submit: '등록',
    deletedPlaceholder: '삭제된 댓글입니다',
    empty: '첫 댓글을 남겨 주세요.',
    loginPrompt: '댓글을 쓰려면 로그인하세요',
    deleteConfirmTitle: '댓글을 삭제하시겠습니까?',
    deleteConfirm: '삭제',
    deleteCancel: '취소',
    delete: '삭제',
    errorTitle: '댓글을 불러오지 못했습니다',
    retry: '다시 시도',
    submitFailed: '댓글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    deleteFailed: '댓글을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    likeFailed: '좋아요 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    loadMore: '더 보기',
    loadingMore: '더 불러오는 중…'
  },
  profile: {
    menuItem: '프로필 설정',
    title: '프로필 설정',
    loading: '불러오는 중…',
    loginGateTitle: '로그인하고 프로필을 관리하세요',
    loginGateSubtitle: '커뮤니티에 표시될 닉네임을 바꾸고, 계정을 관리할 수 있습니다.',
    accountSectionLabel: '내 계정',
    nicknameLabel: '닉네임',
    nicknameHint: '2~20자. 커뮤니티 글과 댓글에 표시됩니다.',
    nicknameSave: '저장',
    nicknameSaved: '닉네임을 바꿨습니다. 이전에 쓴 글에도 새 닉네임이 표시됩니다.',
    errorNicknameLength: '닉네임은 2~20자로 입력해주세요.',
    errorNicknameNetwork: '닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
    /** 중복 검사 진행 중 — 저장 버튼이 잠긴 이유를 설명한다(무음 비활성 금지). */
    nicknameChecking: '사용할 수 있는 닉네임인지 확인하고 있습니다…',
    /** 검사 통과 — 저장을 눌러도 된다는 신호. */
    nicknameAvailable: '사용할 수 있는 닉네임입니다.',
    /** 검사 실패 — 이미 누가 쓰고 있다. 대소문자만 다른 경우도 여기로 온다. */
    errorNicknameTaken: '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
    /** 검사 자체가 실패(네트워크 등) — 통과로 위장하지 않고 사실대로 알린다. */
    errorNicknameCheckFailed: '닉네임 중복을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
    errorSessionExpired: '로그인이 만료됐습니다. 다시 로그인한 뒤 시도해주세요.',
    dangerTitle: '회원 탈퇴',
    dangerBody: '계정과 함께 작성한 글·댓글·좋아요가 모두 삭제됩니다. 되돌릴 수 없습니다.',
    dangerCta: '회원 탈퇴',
    deleteTitle: '정말 탈퇴하시겠습니까?',
    deleteScopeIntro: '아래 데이터가 모두 삭제됩니다:',
    deleteScopeItems: [
      '프로필과 계정 정보',
      '작성한 글 전부 (첨부한 시뮬레이션 포함)',
      '작성한 댓글 전부 — 내 댓글에 달린 다른 사람의 답글도 함께 삭제됩니다',
      '좋아요 기록'
    ],
    deleteIrreversible: '삭제한 데이터는 되돌릴 수 없습니다.',
    deleteConfirmInstruction: "계속하려면 '탈퇴'를 입력해주세요.",
    deleteConfirmLabel: '탈퇴 확인 입력',
    deleteConfirmWord: '탈퇴',
    deleteCancel: '취소',
    deleteExecute: '영구 삭제',
    deleteFailed: '탈퇴를 완료하지 못했습니다. 계정은 그대로 남아 있습니다. 잠시 후 다시 시도해주세요.',
    deleteDone: '탈퇴가 완료됐습니다. 그동안 함께해주셔서 감사합니다.',
    deleteDoneDismiss: '닫기'
  },
  /**
   * "내가 쓴 글" 화면(`/community/my-posts`) — 프로필 드롭다운의 두 번째 항목.
   *
   * 갤러리/게시판 목록 쿼리는 `is_public = true` 를 걸어 **비공개 글이 어디에도 안 보인다**.
   * 이 화면이 비공개 글을 볼 수 있는 유일한 곳이라, 공개/비공개를 **배지 텍스트로** 명시한다
   * (색만으로 구분 금지). 공개 전환 버튼은 두지 않는다(되돌리기 어려운 동작) — 상세/수정 화면의
   * 공개 토글로 안내한다.
   */
  /**
   * 가계부(`/ledger`) 진입 — 프로필 드롭다운의 "내가 쓴 글" 아래, "시뮬레이터로" 위.
   * 위 두 항목은 커뮤니티 계정 관리이고 아래는 앱 이동이다. 가계부는 "내 데이터"라 계정 묶음 끝에 붙는다.
   * ⚠ 환경변수가 없으면 이 항목을 렌더하지 않는다(비활성·"준비 중" 표시도 하지 않는다).
   */
  ledger: {
    menuItem: '가계부'
  },

  myPosts: {
    /** 프로필 드롭다운 메뉴 라벨 — "프로필 설정" 바로 아래. */
    menuItem: '내가 쓴 글',
    title: '내가 쓴 글',
    loading: '불러오는 중…',
    loginGateTitle: '로그인하고 내가 쓴 글을 확인하세요',
    loginGateSubtitle: '공개 글은 물론 나만 볼 수 있는 비공개 글까지 한곳에서 볼 수 있습니다.',
    sectionLabel: '내 글',
    hint: '비공개 글은 나만 볼 수 있습니다. 공개로 바꾸려면 글을 열어 수정해주세요.',
    count: (n: number) => `${n}개`,
    visibilityPublic: '공개',
    visibilityPrivate: '비공개',
    kindPortfolio: '갤러리',
    kindBoard: '게시판',
    listLoading: '내 글을 불러오는 중…',
    emptyTitle: '아직 쓴 글이 없습니다',
    emptySubtitle: '갤러리나 게시판에 첫 글을 남겨 주세요.',
    errorTitle: '내 글을 불러오지 못했습니다',
    errorBody: '잠시 후 다시 시도해주세요.',
    retry: '다시 시도'
  },
  login: {
    title: '로그인',
    subtitle: '로그인하면 시나리오를 공유하고 좋아요·댓글을 남길 수 있습니다.',
    // 구글 규정 "Continue with Google"의 한국어 표준 표기(공식체). 4개 진입점(로그인 모달·내 저장·글쓰기 게이트·프로필 게이트) 공통 정본.
    google: 'Google 계정으로 계속하기',
    kakao: '카카오로 계속하기',
    // 네이버: 컴포넌트 로컬 상수였던 것을 정본으로 승격.
    naver: '네이버로 계속하기',
    naverPending: '네이버 로그인은 준비 중입니다. 지금은 구글 또는 카카오로 로그인해 주세요.',
    naverPendingBadge: '준비 중',
    // 네이버 앱 심사(검수) 통과 전 상태 — env 는 설정됐지만 authorize 가 아직 승인 전이라 실패한다.
    naverReview: '네이버 로그인은 심사 중입니다. 승인되면 바로 열립니다. 지금은 구글 또는 카카오로 로그인해 주세요.',
    naverReviewBadge: '검수중',
    // 네이버 authorize 에서 되돌아온 콜백 경로가 세션 교환 중 잠깐 보이는 안내(main.tsx completeNaverCallback).
    naverCallback: '네이버 로그인 처리 중…',
    // 카카오 authorize 에서 되돌아온 콜백 경로가 세션 교환 중 잠깐 보이는 안내(main.tsx completeKakaoCallback).
    // 카카오도 계정 병합 회피를 위해 네이버와 같은 커스텀 콜백 경로를 탄다(shared/lib/supabase/kakao.ts).
    kakaoCallback: '카카오 로그인 처리 중…'
  },
  common: {
    close: '닫기',
    genericError: '잠시 후 다시 시도해주세요.'
  }
} as const;
