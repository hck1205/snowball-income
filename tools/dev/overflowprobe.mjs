#!/usr/bin/env node
/**
 * overflowprobe — **요소 단위** 가로 오버플로 게이트.
 *
 * 왜 또 만드나. `headerprobe` 는 **문서 레벨**(`documentElement.scrollWidth > clientWidth`)만 본다.
 * 그건 "페이지가 가로로 스크롤되나"라는 가장 큰 사고만 잡는다. 그런데 카드 안쪽에서 새는 것은
 * 문서를 넓히지 않고도 **옆 요소를 덮거나 잘려 보인다**(실측 사례: 표를 카드로 접는 CSS에서
 * `width: 1%` 가 문자 그대로 1% 가 되어 삭제 버튼이 21px 삐져나간 건 — pitfalls 참고).
 * 그래서 문서가 아니라 **모든 요소**를 훑는다.
 *
 * ## 🔴 이 스크립트의 핵심은 "무엇을 세지 않느냐" 다
 *
 * `scrollWidth − clientWidth` 를 그대로 믿으면 이 레포에서는 **거의 전부가 거짓 양성**이다.
 * 2026-08-01 실측(390px `/`): 68개 요소가 걸렸고 그중 **진짜 레이아웃 결함은 0개**였다.
 * 세 부류를 규칙으로 걸러낸다.
 *
 * 1. **스크롤 컨테이너**(`overflow-x: auto|scroll`) — 저자가 명시적으로 "여기는 가로로 스크롤한다"고
 *    선언한 자리다. 내용은 도달 가능하고, 스크롤 컨테이너는 조상의 스크롤 영역에 넘침을 전파하지
 *    않으므로 **문서를 넓힐 수 없다.** 세지 않는다(대신 목록으로 보여준다 — §허용 목록).
 * 2. **클리핑 컨테이너**(`overflow-x: hidden|clip`) — 잘라내기로 끝난다. 새지 않는다.
 *    `sr-only`(1×1 + hidden)와 `text-overflow: ellipsis` 가 여기에 대량으로 걸린다.
 * 3. 🔴 **의사요소만 넘치는 경우 = 터치 타깃.** `shared/styles/surfaces.ts` 의 `hitArea`/
 *    `hitAreaWithin` 은 시각 크기는 그대로 두고 `::before` 로 **누를 수 있는 영역만** 넓힌다.
 *    그 `::before` 는 `position: absolute` + `translate(-50%,-50%)` 라 요소 좌우로 균등하게
 *    삐져나가고 `scrollWidth` 는 그것을 센다 — **보이지도 않고 레이아웃을 밀지도 않는다.**
 *    실측 지문: 38px 토글 트랙(`Toggle.styled.ts`)의 44px 히트 영역 → 좌우 **3px**,
 *    18px 도움말 버튼의 24px 히트 영역 → 좌우 **4px**, 28px 헤더 아이콘 버튼의 44px → 좌우 **8px**.
 *    판정법: 자손 **요소 박스**와 **텍스트 조각(Range)** 중 어느 것도 패딩 박스를 넘지 않으면
 *    넘친 주체는 의사요소다(요소·텍스트가 아니면 화면에 배치된 것이 없다).
 *
 * 4. 🔴 **저자가 선언한 장식 돌출**(`data-decorative-overflow` 속성). 넘치는 것이 사실이지만
 *    **그렇게 그리기로 한 것**이다 — 랜딩 히어로의 금화(무대 밖 13% 돌출이 연출의 핵심)와
 *    내 포트폴리오의 선글라스 하마(`right: calc(-1 * space[3])`, "카드가 이 그림을 자르지 마라"가
 *    명시된 규칙)가 그렇다. 둘 다 코드 주석에 이미 확정 결정으로 적혀 있던 것을 도구에 말해 준 것이다.
 *    ⚠ 스크롤러 허용 목록과 같은 원칙: **넘긴 것도 `▫` 로 항상 출력한다.** 조용히 사라지면
 *      허용이 아니라 눈감기가 되고, 그 순간 이 가드는 장식이 된다.
 *    ⚠ 선언은 **요소에 붙인다**(경로 목록이 아니라). 그래야 옆 요소까지 덤으로 면제되지 않는다.
 *
 * 남는 것만 실패로 센다: **`overflow-x: visible` 인데 실제 자손 박스나 텍스트가 밖으로 나간 요소.**
 * 그것만이 옆 요소를 덮거나 조상으로 전파되어 문서를 넓힌다.
 *
 * ## 이 도구가 **보지 않는** 것 (다음 사람이 오해하지 않게)
 * - **`overflow: hidden` 이 잘라먹는 내용.** "말줄임(의도)"과 "실수로 잘림"을 기하만으로는 구분할 수
 *   없다. 그 층은 `archclip`(아치 침범)과 눈(`uiprobe --shot`)이 본다.
 * - **세로 오버플로.** 이 도구는 가로만 본다.
 * - **스크롤 컨테이너의 도달성.** 가로 스크롤러가 키보드로 조작 가능한지는 별개 문제다
 *   (Chrome 127+ 는 스크롤러를 기본 포커서블로 만든다 — 그 이전 브라우저에선 `tabindex="0"` 이 필요하다).
 *   앱의 처방은 **`tabindex="0"` + `role="region"` + 접근명**으로 통일돼 있고, 그건 여기가 아니라
 *   RTL 이 잠근다(test/dividendCalendar/calendarLegendTable.behavior.test.tsx · test/legal/legalTableScroller.test.tsx).
 *
 * ## 재기 전에 만드는 상태 (빈 화면을 재는 것은 통과가 아니다)
 * - **보유 종목 시드**(IndexedDB) — `/dividend/portfolio` 용.
 * - **캘린더 선택 시드**(IndexedDB) — 선택 0종이면 `/dividend/calendar` 는 상세 카드를 아예
 *   그리지 않아 그 안의 표가 DOM 에 없다.
 * - **접힌 `<details>` 전부 펼치기** — 기본 접힘인 표·목록은 스캔 시점에 존재하지 않는다.
 *
 * - **충분한 대기**(`--wait`, 기본 6,500ms — 라우트별 렌더 실측은 `DEFAULT_WAIT_MS` 주석). 짧으면
 *   로딩 스켈레톤을 재고 "0건"이라 말한다. 그래서 스캔은 **검사한 요소 수를 항상 출력**하고,
 *   비어 있으면 8초 더 기다렸다 다시 본 뒤 그래도 비면 **실패**한다(`MIN_INSPECTED_ELEMENTS`).
 *   "0건"이 결함 없음인지 빈 화면인지 사람이 로그만 보고 구분할 수 있어야 한다.
 *
 * 🔴 위 둘이 없어서 2026-08-01 에 실제 결함을 놓쳤다: `/dividend/calendar` 의 지급 월 표가
 * 카드를 뚫고 문서를 390 → 587 로 늘리고 있었는데 가드는 그 라우트를 "0건"으로 통과시켰다.
 * **가드가 만들지 않은 상태는 가드가 본 적 없는 상태다.**
 *
 * ## 허용 목록 (의도적 가로 스크롤)
 * `INTENTIONAL_SCROLLERS` 에 **근거와 함께** 적혀 있다. 목록에 없는 새 스크롤 컨테이너가 나타나면
 * 실패시키지 않고 `INFO` 로 찍는다 — 새 스크롤러 자체는 결함이 아니고, 다만 **의도한 것인지
 * 사람이 한 번 봐야** 하기 때문이다.
 *
 * ```sh
 * node tools/dev/overflowprobe.mjs                       # 기본 라우트 × 390,360
 * node tools/dev/overflowprobe.mjs --widths 390,360,320
 * node tools/dev/overflowprobe.mjs --routes /,/dividend/calendar --verbose
 * node tools/dev/overflowprobe.mjs --mutant              # 🔴 감도 자가검증(아래)
 * ```
 *
 * ## 감도 자가검증(`--mutant`)
 * "지우면 빨개지지만 더해도 초록인" 가드는 감도 0이다. `--mutant` 는 각 라우트에 **일부러 넘치는
 * 요소 3종**(고정폭 초과 자식 / 긴 무공백 텍스트 / 음수 마진)을 심고, 가드가 **세 종류를 모두**
 * 지목하는지 확인한 뒤 제거해 **기준선으로 정확히 되돌아오는지**까지 본다(양방향).
 *
 * ⚠ 잡히는 **건수**는 3보다 크다 — 넘침은 조상으로 전파되므로 심은 요소와 그 래퍼가 함께 걸린다
 * (실측: 3종을 심으면 6건). 그래서 건수가 아니라 **`data-testid` 세 개가 모두 나왔는가**로 단정한다.
 *
 * ⚠ **Git Bash(MSYS)에서 `--routes` 에 슬래시로 시작하는 값을 그대로 넘기지 마라** — MSYS 가
 * 윈도우 경로로 바꿔치기해 "Cannot navigate to invalid URL" 로 죽는다. `MSYS_NO_PATHCONV=1` 을
 * 앞에 붙이거나 PowerShell 에서 실행한다.
 *
 * 외부 의존성 0(Node 빌트인 fetch + WebSocket 으로 CDP 를 직접 말한다 — `headerprobe.mjs` 와 같은 방식).
 * 실패하면 종료 코드 1.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { platform } from 'node:process';

/* ── 계약 상수 ────────────────────────────────────────────────────────────── */

/**
 * 실패로 세는 최소 초과 폭(px).
 *
 * 서브픽셀 레이아웃 때문에 `scrollWidth`(정수)와 실제 박스(소수)는 상시 1px 미만으로 어긋난다.
 * 1px 은 사람 눈에 안 보이고 라운딩만으로도 나므로 **2px 부터** 결함으로 센다.
 * ⚠ 이 값을 0/1 로 낮추려면 먼저 `--mutant` 로 오발이 없는지 확인하라.
 */
const OVERFLOW_TOLERANCE = 2;

/** 자손 박스가 패딩 박스를 넘었다고 인정하는 최소 거리(px). 라운딩 잡음 차단용. */
const OFFENDER_TOLERANCE = 1;

/**
 * 라우트 하나를 열고 스캔하기까지 기다리는 기본 시간(ms). **실측으로 정한 값이다 — 바꾸기 전에 아래를 읽어라.**
 *
 * ## 2026-08-01 실측 — "6.5초가 모자라다"는 제보는 재현되지 않았다
 *
 * 페이지 안에 MutationObserver 기록기를 심어(레이아웃을 강제하지 않는 지문만 기록) 콜드 vite dev
 * 서버에서 라우트별 렌더 완료 시각을 쟀다. **최종 요소 수의 95% 도달** / **마지막 DOM 변화** 기준(ms):
 *
 * | 라우트                 | 390px 95%도달 | 390px 마지막변화 | 360px 95%도달 |
 * |-----------------------|--------------|-----------------|--------------|
 * | `/`                   | 2,273        | 3,163           | 1,535        |
 * | `/simulator`          | 1,151        | 1,385           | 1,178        |
 * | `/dividend/portfolio` | 1,856        | 1,932           | 1,054        |
 * | `/dividend/calendar`  | 1,439        | 1,439           | 1,006        |
 * | `/ticker/all`         |   771        |   931           |   718        |
 * | `/community/portfolio`| 1,309        | 1,309           |   912        |
 *
 * 14초를 관찰해도 3.2초 이후로는 **DOM 이 한 번도 변하지 않았다.** 6,500ms 는 최악(3,163ms)의 2배다.
 *
 * 🔴 **관찰자 효과 주의(이 측정을 다시 할 사람에게).** 첫 시도는 CDP 로 100ms 마다 `innerText` 를 읽는
 * 방식이었는데, 그 리플로 강제가 메인 스레드를 잡아먹어 같은 라우트가 **1.9초 → 6.9초**로 보였다.
 * 그 수치를 믿고 기본값을 9,000ms 로 올릴 뻔했다 — **측정 도구가 만든 지연을 앱의 지연으로 읽지 마라.**
 *
 * 감도 확인도 했다: `--wait 3000` 으로 콜드 서버 + **CPU 14코어 점유** 상태에서 돌려도 12개 조합 전부
 * 완성 화면(요소 500~1,348개)이 잡혔다 — 짧은 대기와 긴 대기의 결과가 같았다. 그래서 **올리지 않았다.**
 * 대신 진짜 위험(대기가 모자라 빈 화면을 재고도 `✓ 0건`이라 말하는 것)은 값이 아니라 **구조**로 막는다:
 * 스캔한 요소 수를 항상 출력하고, 비어 있으면 `RESCAN_WAIT_MS` 만큼 더 기다렸다가 한 번 더 본 뒤
 * 그래도 비면 **실패**시킨다(`MIN_INSPECTED_ELEMENTS`). 이러면 느린 환경은 스스로 낫고, 정말 못 본
 * 경우만 빨간불이 켜진다 — 매 실행에 30초를 더 내지 않고도 "눈 감기"가 불가능해진다.
 */
const DEFAULT_WAIT_MS = 6500;

/**
 * "이 페이지를 실제로 검사했다"고 인정하는 최소 요소 수.
 *
 * 대기가 모자라면 스캔 대상이 **로딩 스켈레톤**이고, 결함이 0건인 게 아니라 **볼 게 없었던 것**이다.
 * 그런데 출력은 똑같이 `✓ 새는 요소 0` 이라 사람은 통과로 읽는다 — 가드가 장식이 되는 지점.
 * 2026-08-01 실측(390px): 완성 화면은 500~1,348개(`/ticker/all` 500 이 최소), `/dividend/portfolio`
 * 의 로딩 스켈레톤은 96개. 3배 이상 벌어져 있어 150 을 문턱으로 잡았다. 새 라우트가 정말로 150개
 * 미만이면 그때 조정하라 — 다만 그 전에 "정말 다 그려진 화면인가"를 먼저 의심하라.
 */
const MIN_INSPECTED_ELEMENTS = 150;

/**
 * 빈 화면을 만났을 때 **한 번 더** 기다리는 시간(ms). 기본 대기(6.5초)를 더해 총 14.5초까지 준다.
 * 콜드 서버·CPU 경합에서도 3.2초면 끝나는 화면이므로, 이걸 다 쓰고도 비어 있으면 대기 문제가 아니라
 * dev 서버가 죽었거나 라우트가 사라진 것이다 — 그때는 조용히 통과시키지 말고 실패해야 한다.
 */
const RESCAN_WAIT_MS = 8000;

/**
 * 고정 대기가 끝난 뒤 **"DOM 이 아직 자라는 중인가"** 를 확인하는 폴링 간격(ms)과 그 상한(ms).
 *
 * ## 왜 필요한가 — 빈 화면만 막으면 절반만 막은 것이다 (2026-08-01 qa 실측)
 *
 * `MIN_INSPECTED_ELEMENTS`(150)는 **완전히 빈** 화면만 잡는다. 그런데 대기가 모자랄 때 훨씬 흔한
 * 모습은 **절반쯤 그려진** 화면이고, 그건 문턱을 가볍게 넘어 `✓ 0건` 으로 통과한다.
 * `--wait 800 --widths 390` 실측(콜드 vite dev, 5188):
 *
 * | 라우트                 | 800ms 에 검사된 요소 | 완성 화면 | 아코디언 |
 * |-----------------------|--------------------|----------|---------|
 * | `/`                   | **439** (32%)      | 1,348    | 0/0 → 1/1 |
 * | `/simulator`          | **879** (65%)      | 1,348    | 0/0 → 1/1 |
 * | `/community/portfolio`| **407** (59%)      |   694    | 0/0       |
 *
 * 셋 다 `✓ 새는 요소 0` 이었다. 🔴 특히 `아코디언 0/0` — 2026-08-01 에 197px 를 새게 했던 바로 그
 * `<details>` 가 아직 DOM 에 없었는데 가드는 초록불을 켰다. **"덜 그려진 화면을 봤다"는 "안 본 것"이다.**
 *
 * 그래서 스캔 직전에 요소 수가 **더 이상 늘지 않는지** 한 번 확인한다. 자라는 중이면 멈출 때까지
 * (최대 `GROWTH_MAX_EXTRA_MS`) 더 기다린다. 이미 다 그려진 정상 실행에서 드는 비용은 폴링 1회
 * (라우트·폭 조합당 500ms, 12조합이면 약 6초)뿐이고, 느린 환경에서만 실제로 더 기다린다 —
 * 모든 실행에 고정 대기를 얹는 것보다 싸고 정확하다.
 *
 * ⚠ 세는 값은 `querySelectorAll('*').length` 다. **레이아웃을 강제하지 않는 지표**를 일부러 골랐다 —
 * `innerText`/`getBoundingClientRect` 를 폴링하면 그 리플로가 메인 스레드를 잡아 측정 자체가 렌더를
 * 늦춘다(같은 라우트가 1.9초 → 6.9초로 보이는 관찰자 효과. `DEFAULT_WAIT_MS` 주석 참고).
 */
const GROWTH_POLL_MS = 500;
const GROWTH_MAX_EXTRA_MS = 8000;

/**
 * **의도적 가로 스크롤 허용 목록.** 각 항목은 "이 자리는 가로로 스크롤하는 것이 설계다"라는 근거다.
 * `match` 는 페이지 안에서 평가되는 CSS 선택자 — emotion 해시 클래스는 매 빌드 바뀌므로
 * **절대 쓰지 않고** 시맨틱 앵커(태그·역할·aria-label)로만 지목한다.
 */
const INTENTIONAL_SCROLLERS = [
  {
    /* 헤더 내비. 칩이 넘치면 가로 스크롤한다 — 줄바꿈으로 헤더가 두 줄 되는 것을 막는 설계다. 근거 components/common/NavScroller. */
    match: 'nav[aria-label="주요 메뉴"], nav[aria-label="주요 메뉴"] > *',
    why: 'NavScroller — 헤더 칩 내비의 가로 스크롤(줄바꿈 금지가 설계)'
  },
  {
    /* 표를 직접 감싼 래퍼. 대표 사례가 종목별 지급 월 표(13열)로, 좁은 화면에서 12칸 그리드를
       줄바꿈으로 구기지 않으려고 표만 자체 스크롤한다 — 근거
       components/MonthlyCashflow/components/PayoutScheduleStrip/PayoutScheduleStrip.styled.ts:21(ScheduleScroll)
       + 같은 파일 30행의 `min-width: 520px`. 연도별 결과 등 다른 넓은 표 래퍼도 같은 규칙이다. */
    match: 'div:has(> table), div:has(> * > table)',
    why: '표 래퍼 — 넓은 표는 접지 않고 자체 가로 스크롤한다(PayoutScheduleStrip 등)'
  },
  {
    /* 캐러셀 트랙. 구현이 **네이티브 스크롤 + scroll-snap** 이라 가로 스크롤이 곧 그 부품의 기능이다
       (components/common/Carousel/Carousel.styled.ts:37 `overflow-x: auto` + 39 `scroll-snap-type`).
       랜딩의 포트폴리오 프리셋 묶음 넷(성장·균형·인컴·특화)이 이것으로 그려진다.
       ⚠ `aria-label` 은 호출부가 만드는 동적 문자열("성장 4개")이라 앵커로 못 쓴다 — 그래서 트랙이
         `data-carousel-track` 을 직접 단다(그 속성은 이 계약을 위해 존재한다). */
    match: '[data-carousel-track]',
    why: 'Carousel 트랙 — 네이티브 스크롤 + scroll-snap 이 이 부품의 구현이다'
  }
];

/* ── 인자 ─────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const BASE = arg('base', 'http://localhost:5173').replace(/\/$/, '');
const WIDTHS = arg('widths', '390,360')
  .split(',')
  .map((w) => Number(w.trim()))
  .filter(Boolean);
/*
 * 🔴 `/` 는 **랜딩**, `/simulator` 가 시뮬레이터다(2026-08-01 이전 완료). 둘 다 목록에 있어야 한다 —
 *   `/simulator` 를 빼면 이 레포에서 가장 넓은 화면(결과 표·차트)을 한 번도 재지 않은 채 초록이 뜬다.
 */
/*
 * 🔴 `/privacy` 는 **표 6개**(국외 이전 표는 7열, 셀 값이 긴 한글)를 가진 유일한 라우트다.
 *   지금은 새지 않지만 그건 `TableScroller` 가 `Section`(grid)의 **직접 아이템**이라 자동 최소
 *   크기가 0 으로 클램프되는 덕이다 — 그 배치가 한 겹만 깊어지면(래퍼 하나 추가) 캘린더의 지급 월
 *   표가 문서를 390 → 587 로 늘렸던 것과 **같은 사고**가 난다. 우연히 맞은 상태를 가드 안으로 넣는다.
 *   `/terms` 는 표가 0개라 뺐다(문단·목록뿐 — 라우트를 늘린 만큼 매 실행이 느려진다).
 *
 * 🔴 `/dividend/kings` 는 **카드 모드 격자가 이 표에만 있는 배당 목록 표**다(2026-08-15 추가).
 *   다른 표들이 값을 늘려 채우는(`stretch`) 것과 달리 이 표만 `justify-items: end` 로 값을 제 폭만큼
 *   만들어 오른쪽에 붙인다 — 그 배치에서는 값이 트랙보다 넓어지면 **왼쪽(라벨 쪽)으로** 삐져나간다.
 *   게다가 공용 `DataTable` 셀에 있는 방어(`overflow: hidden`)가 이 사본에는 없다.
 *   지금은 새지 않는다(390/360/320px 실측 0건, 뮤턴트 3/3 지목으로 감도도 확인). 하지만 그건
 *   **현재 값들이 짧아서**이지 구조가 막아 주는 것이 아니다 — `/privacy` 와 같은 이유로,
 *   우연히 맞은 상태를 가드 안으로 넣는다.
 */
const ROUTES = arg(
  'routes',
  '/,/simulator,/dividend/portfolio,/dividend/calendar,/ticker/all,/community/portfolio,/privacy,/dividend/kings'
)
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);
const PORT = Number(arg('port', '9346'));
const WAIT = Number(arg('wait', String(DEFAULT_WAIT_MS)));
const VERBOSE = flag('verbose');
const MUTANT = flag('mutant');
/** 보유 종목이 있는 상태로 `/dividend/portfolio` 를 재려면 켠다(기본 켜짐 — 빈 화면만 재는 것은 무의미). */
const SEED = !flag('no-seed');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 브라우저 ─────────────────────────────────────────────────────────────── */

const findBrowser = () => {
  const candidates =
    platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
        ]
      : platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((path) => existsSync(path)) ?? null;
};

const cdpReady = async () => {
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return true;
  } catch {
    return false;
  }
};

let child = null;

const launch = async () => {
  if (await cdpReady()) return 'attached';
  const browser = findBrowser();
  if (!browser) {
    console.error('[overflowprobe] 크롬/엣지를 찾지 못했다.');
    process.exit(1);
  }
  /*
   * 🔴 프로파일 경로에 포트를 붙인다. `--port` 를 따로 줘도 **프로파일이 같으면 크롬이 뜨지 못한다**
   * (한 프로파일은 한 인스턴스만 잠근다). 2026-08-01 에 병렬 트랙 둘이 동시에 이 도구를 돌렸을 때
   * 뒤에 뜬 쪽이 `CDP 가 뜨지 않았다` 로 죽었다 — 스크립트 잘못처럼 보이지만 원인은 프로파일 충돌이다.
   */
  const profile = resolve(`node_modules/.cache/overflowprobe-profile-${PORT}`);
  mkdirSync(profile, { recursive: true });
  child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );
  for (let i = 0; i < 40; i += 1) {
    if (await cdpReady()) return 'launched';
    await sleep(300);
  }
  console.error('[overflowprobe] CDP 가 뜨지 않았다.');
  process.exit(1);
};

const connect = async () => {
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('[overflowprobe] page 타겟이 없다.');
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  });
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      id += 1;
      pending.set(id, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { send, close: () => ws.close() };
};

/* ── 페이지 안에서 도는 조각 ──────────────────────────────────────────────── */

/**
 * 요소 단위 오버플로 스캔. 위 문서의 3단 필터를 그대로 구현한다.
 * 반환: `{ doc, real[], scrollers[] }`.
 */
const buildScan = (allowlist, tolerance, offenderTolerance) => `(() => {
  const ALLOW = ${JSON.stringify(allowlist)};
  const TOL = ${tolerance};
  const OFF_TOL = ${offenderTolerance};

  const desc = (el) => {
    if (!el) return 'null';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const testid = el.getAttribute('data-testid') ? '[' + el.getAttribute('data-testid') + ']' : '';
    const aria = el.getAttribute('aria-label') ? '{' + el.getAttribute('aria-label') + '}' : '';
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24);
    return tag + id + testid + aria + (text ? ' «' + text + '»' : '');
  };
  const chain = (el) => {
    const out = [];
    let node = el.parentElement;
    while (node && node !== document.documentElement && out.length < 4) {
      out.push(desc(node));
      node = node.parentElement;
    }
    return out;
  };
  /** 자손 요소 + 텍스트 조각 중 패딩 박스 좌/우를 실제로 넘는 것. 없으면 넘친 주체는 의사요소다. */
  const findOffenders = (el, padLeft, padRight) => {
    const found = [];
    for (const node of el.querySelectorAll('*')) {
      const r = node.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const out = Math.max(r.right - padRight, padLeft - r.left);
      if (out > OFF_TOL) found.push({ what: desc(node), out: Math.round(out * 100) / 100, kind: 'element', decorative: !!node.closest('[data-decorative-overflow]') });
    }
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue || !t.nodeValue.trim()) continue;
      range.selectNodeContents(t);
      for (const r of range.getClientRects()) {
        if (r.width === 0) continue;
        const out = Math.max(r.right - padRight, padLeft - r.left);
        if (out > OFF_TOL) {
          found.push({ what: 'text «' + t.nodeValue.trim().slice(0, 24) + '»', out: Math.round(out * 100) / 100, kind: 'text', decorative: false });
          break;
        }
      }
    }
    found.sort((a, b) => b.out - a.out);
    return found;
  };

  /** 자신 또는 조상 중 **가장 가까운 가로 스크롤 컨테이너**. 넘침은 거기서 멈추고 스크롤로 도달 가능해진다. */
  // ⚠ body 는 제외한다 — body 가 가로로 스크롤하는 것은 "흡수"가 아니라 **페이지 가로 스크롤 사고** 그 자체다.
  const nearestScroller = (el) => {
    for (let node = el; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const ox = getComputedStyle(node).overflowX;
      if (ox === 'auto' || ox === 'scroll') return node;
    }
    return null;
  };
  const allowReason = (el) => {
    const rule = ALLOW.find((r) => {
      try { return el.matches(r.match); } catch { return false; }
    });
    return rule ? rule.why : null;
  };

  const real = [];
  const scrollers = [];
  const decorative = [];
  const seenScrollers = new Set();
  /* 🔴 "무엇을 보았나"의 증거. 이 숫자가 작으면 결함 0건이 아니라 **볼 게 없었던 것**이다. */
  let inspected = 0;

  for (const el of document.querySelectorAll('*')) {
    inspected += 1;
    const over = el.scrollWidth - el.clientWidth;
    if (over < TOL) continue;
    const cs = getComputedStyle(el);

    // 필터 1 — 스크롤 컨테이너(자신 또는 조상). 내용은 스크롤로 도달 가능하고 그 위로 전파되지 않는다.
    // ⚠ 조상까지 보는 이유: 스크롤러는 보통 래퍼고 **실제로 넘치는 것은 그 안쪽 트랙 div** 다
    //    (NavScroller 가 그렇다 — nav 가 auto, 넘치는 것은 자식 div). 자신만 보면 트랙이 거짓 실패로 남는다.
    const scroller = nearestScroller(el);
    if (scroller) {
      // 스크롤러 자신이 가로로 넘치지 않으면(세로 전용 auto 등) 안쪽 신호는 의사요소였다 — 조용히 넘긴다.
      const scrollerOver = scroller.scrollWidth - scroller.clientWidth;
      if (scrollerOver >= TOL && !seenScrollers.has(scroller)) {
        seenScrollers.add(scroller);
        scrollers.push({
          el: desc(scroller),
          over: scrollerOver,
          client: scroller.clientWidth,
          scroll: scroller.scrollWidth,
          why: allowReason(scroller),
          chain: chain(scroller)
        });
      }
      continue;
    }
    // 필터 2 — 클리핑 컨테이너(sr-only·말줄임 포함). 새지 않는다.
    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') continue;

    const rect = el.getBoundingClientRect();
    const padLeft = rect.left + (parseFloat(cs.borderLeftWidth) || 0);
    const padRight = rect.right - (parseFloat(cs.borderRightWidth) || 0);
    const offenders = findOffenders(el, padLeft, padRight);

    // 필터 3 — 요소도 텍스트도 안 넘었다 = 넘친 주체는 의사요소(hitArea 터치 타깃). 보이지 않는다.
    if (offenders.length === 0) continue;

    /*
     * 필터 4 — **저자가 선언한 장식 돌출**(data-decorative-overflow 속성).
     * ⚠ 이 블록은 브라우저로 보내는 템플릿 문자열 안이다 — 주석에 백틱을 쓰면 문자열이 끊긴다.
     * 스크롤러 허용 목록과 같은 성격이다: 넘치는 것이 사실이지만 **그렇게 그리기로 한 것**이다.
     * 넘긴 것도 INFO 로 반드시 출력한다 — 조용히 사라지면 허용이 아니라 눈감기가 된다.
     */
    if (offenders.every((o) => o.decorative)) {
      decorative.push({ el: desc(el), over, offenders: offenders.slice(0, 3), chain: chain(el) });
      continue;
    }

    real.push({
      el: desc(el),
      over,
      client: el.clientWidth,
      scroll: el.scrollWidth,
      offenders: offenders.slice(0, 3),
      chain: chain(el)
    });
  }

  real.sort((a, b) => b.over - a.over);
  scrollers.sort((a, b) => b.over - a.over);
  return {
    doc: { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth },
    inspected,
    real,
    scrollers,
    decorative
  };
})()`;

/**
 * 접힌 `<details>` 를 전부 펼친다.
 *
 * 🔴 이것이 없어서 **실제 결함을 놓쳤다**(2026-08-01). `/dividend/calendar` 의 "종목별 지급 월
 * 표로 보기"는 기본이 접힘이라 스캔 시점의 DOM 에 표가 아예 없었고, 가드는 그 자리를 "0건"으로
 * 통과시켰다. 펼치면 문서가 390 → 587 로 새고 있었다(197px). 접힘은 **초기 상태일 뿐 최종
 * 상태가 아니다** — 사용자가 누르는 순간의 레이아웃도 가드의 사정 범위다.
 *
 * `open` 을 직접 세팅하는 이유: 좌표로 누르면 아코디언이 화면 밖에 있을 때 실패하고, 텍스트로
 * 누르면 같은 글자를 가진 내비를 잡아 라우트를 갈아탄다(같은 날 실제로 겪은 오작동).
 */
const EXPAND_SCRIPT = `(() => {
  const all = [...document.querySelectorAll('details')];
  const opened = all.filter((d) => !d.open);
  for (const d of opened) d.open = true;
  return { total: all.length, opened: opened.length };
})()`;

/** 보유 종목 시드 — `/dividend/portfolio` 를 빈 상태로만 재는 것은 무의미하다. */
const SEED_SCRIPT = `(async () => {
  // 스키마 근거: pages/Portfolio/utils/portfolioStorage.ts (DB 'snowball-portfolio' / store·key 'holdings' / v1)
  const record = {
    v: 1,
    holdings: [
      { ticker: 'SCHD', quantity: 120 },
      { ticker: 'DGRO', quantity: 85 },
      { ticker: 'JEPI', quantity: 40 },
      { ticker: 'O', quantity: 33 },
      { ticker: 'SCHY', quantity: 1234.5678 }
    ],
    taxPercent: 15.4,
    updatedAt: Date.now()
  };
  await new Promise((res, rej) => {
    const open = indexedDB.open('snowball-portfolio', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('holdings')) db.createObjectStore('holdings');
    };
    open.onerror = () => rej(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('holdings', 'readwrite');
      tx.objectStore('holdings').put(record, 'holdings');
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    };
  });

  /*
   * 🔴 캘린더 선택도 심는다. 선택이 0종이면 /dividend/calendar 는 상세 카드 자체를 렌더하지
   * 않아(showCalendar = selectedWithData > 0) 그 안의 표는 DOM 에 없다 — 빈 화면만 재고
   * "이 라우트 0건"이라고 말하는 상태였다(2026-08-01 사고).
   * 스키마 근거: pages/DividendCalendar/utils/calendarStorage.ts (DB 'snowball-dividend-calendar' / store·key 'selection' / v1)
   */
  const calendarRecord = { v: 1, tickers: ['SCHD', 'JEPI', 'O', 'QYLD'], updatedAt: Date.now() };
  await new Promise((res, rej) => {
    const open = indexedDB.open('snowball-dividend-calendar', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('selection')) db.createObjectStore('selection');
    };
    open.onerror = () => rej(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('selection', 'readwrite');
      tx.objectStore('selection').put(calendarRecord, 'selection');
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    };
  });
  return 'seeded';
})()`;

/**
 * 🔴 뮤턴트 — 일부러 넘치는 요소 3종을 심는다. 각각 다른 원인이다:
 * 고정폭 초과 자식 / 줄바꿈 불가 긴 텍스트 / 음수 마진.
 * 셋 다 `overflow-x: visible` 이라 실제로 옆을 덮는다 = 가드가 반드시 잡아야 하는 부류.
 */
const MUTANT_SCRIPT = `(() => {
  const host = document.createElement('div');
  host.id = '__overflow_mutant__';
  host.style.cssText = 'width:200px;margin:0 auto;';
  host.innerHTML =
    '<div data-testid="mutant-child" style="width:200px;overflow-x:visible"><div style="width:260px;height:8px;background:#f00"></div></div>' +
    '<div data-testid="mutant-text" style="width:200px;overflow-x:visible;white-space:nowrap;font-size:12px">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</div>' +
    '<div data-testid="mutant-margin" style="width:200px;overflow-x:visible"><div style="height:8px;margin-right:-40px;background:#00f"></div></div>';
  document.body.appendChild(host);
  return 'planted';
})()`;

const REMOVE_MUTANT = `(() => {
  const host = document.getElementById('__overflow_mutant__');
  if (host) host.remove();
  return 'removed';
})()`;

/* ── 실행 ─────────────────────────────────────────────────────────────────── */

const mode = await launch();
const cdp = await connect();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 400));
  return result.result?.value;
};

const SCAN = buildScan(INTENTIONAL_SCROLLERS, OVERFLOW_TOLERANCE, OFFENDER_TOLERANCE);

console.log(`[overflowprobe] ${mode} · ${BASE}`);
console.log(
  `  계약: overflow-x:visible 요소가 자손 박스/텍스트로 ${OVERFLOW_TOLERANCE}px 이상 새면 실패` +
    ` · 스크롤/클리핑 컨테이너와 터치 타깃 의사요소는 세지 않는다`
);

if (SEED) {
  await cdp.send('Page.navigate', { url: `${BASE}/` });
  await sleep(1500);
  try {
    await evaluate(SEED_SCRIPT);
    console.log('  시드: 보유 종목 5건 (SCHD·DGRO·JEPI·O·SCHY) · 캘린더 선택 4종 (SCHD·JEPI·O·QYLD)');
  } catch (error) {
    console.log(`  시드 실패(무시하고 진행): ${String(error).slice(0, 120)}`);
  }
}

const failures = [];
let mutantFailures = 0;

/**
 * 요소 수가 멈출 때까지 기다린다. 반환값의 `stable: false` 는 상한을 다 쓰고도 계속 자랐다는 뜻 —
 * 실패로 만들지는 않는다(그 화면도 스캔할 가치는 있다). 다만 로그로 남겨 사람이 알게 한다.
 * 근거: `GROWTH_POLL_MS` 주석.
 */
const settleGrowth = async () => {
  const count = async () => {
    try {
      return await evaluate(`document.querySelectorAll('*').length`);
    } catch {
      return 0; /* 내비게이션 중 — 다음 폴에서 다시 센다. */
    }
  };
  let previous = await count();
  let waited = 0;
  while (waited < GROWTH_MAX_EXTRA_MS) {
    await sleep(GROWTH_POLL_MS);
    waited += GROWTH_POLL_MS;
    const now = await count();
    /* 2%(최소 2개) 이내 변동이면 멈춘 것으로 본다 — 툴팁 하나 붙었다 떨어지는 잡음까지 쫓지 않는다. */
    if (now > 0 && Math.abs(now - previous) <= Math.max(2, previous * 0.02)) return { waited, count: now, stable: true };
    previous = now;
  }
  return { waited, count: previous, stable: false };
};

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await cdp.send('Page.navigate', { url: `${BASE}${route}` });
    await sleep(WAIT);

    /* 🔴 아직 자라는 중인 DOM 을 재면 "덜 본 것"이다 — 멈출 때까지 기다린다. 근거 GROWTH_POLL_MS 주석. */
    const growth = await settleGrowth();

    /*
     * 접힌 아코디언 안은 스캔에 잡히지 않는다 — 펼치고 레이아웃이 안정된 뒤에 잰다.
     * 아직 내비게이션 중이면 `document.body` 가 null 이라 여기서 던진다(짧은 `--wait` 에서 실제로 겪었다).
     * 그건 "결과 없음"으로 다루고 아래 재시도에 맡긴다 — 스크립트가 죽어서 남은 라우트를 통째로
     * 건너뛰는 것이 가장 나쁜 결말이다.
     */
    const lookOnce = async () => {
      try {
        const opened = await evaluate(EXPAND_SCRIPT);
        if (opened.opened > 0) await sleep(400);
        return { expanded: opened, scan: await evaluate(SCAN) };
      } catch {
        return { expanded: { total: 0, opened: 0 }, scan: { doc: { scroll: 0, client: 0 }, inspected: 0, real: [], scrollers: [] } };
      }
    };

    let { expanded, scan } = await lookOnce();
    const label = `${route.padEnd(24)} ${String(width).padStart(4)}px`;

    /* 한 번의 폴로 끝났으면(=이미 멈춰 있었으면) 조용히 간다. 더 기다렸다면 그 사실을 남긴다. */
    if (!growth.stable) {
      console.log(`    … ${label} ${GROWTH_MAX_EXTRA_MS}ms 동안 DOM 이 계속 변했다 — 움직이는 화면을 잰 결과일 수 있다`);
    } else if (growth.waited > GROWTH_POLL_MS) {
      console.log(`    … ${label} 렌더가 아직 진행 중이어서 ${growth.waited}ms 더 기다렸다 (요소 ${growth.count}개에서 멈춤)`);
    }

    /*
     * 🔴 빈 화면을 재고 "0건"이라 말하지 않는다. 느린 환경(콜드 청크·데이터 페치·CPU 경합)은
     * 여기서 스스로 회복하고, 정말 못 본 경우만 아래 실패로 남는다. 매 실행에 대기를 더 얹는
     * 대신 **필요할 때만** 더 기다리는 쪽을 골랐다 — 근거는 `DEFAULT_WAIT_MS` 주석의 실측.
     */
    if (scan.inspected < MIN_INSPECTED_ELEMENTS) {
      console.log(`    … ${label} 요소 ${scan.inspected}개뿐 — ${RESCAN_WAIT_MS}ms 더 기다렸다 다시 본다`);
      await sleep(RESCAN_WAIT_MS);
      ({ expanded, scan } = await lookOnce());
    }

    if (scan.doc.scroll > scan.doc.client) {
      failures.push(`${label} — 문서 가로 오버플로 ${scan.doc.scroll} > ${scan.doc.client}`);
    }
    /* 🔴 재시도까지 하고도 비어 있으면 "결함 0건"이 아니라 **검사 자체가 실패**한 것이다. */
    if (scan.inspected < MIN_INSPECTED_ELEMENTS) {
      failures.push(
        `${label} — ${WAIT + RESCAN_WAIT_MS}ms 를 기다리고도 요소가 ${scan.inspected}개뿐이다(기준 ${MIN_INSPECTED_ELEMENTS}).` +
          ` 이 라우트는 검사된 적이 없다 — dev 서버가 살아있는지, 라우트 경로가 아직 유효한지 확인하라.`
      );
    }
    for (const hit of scan.real) {
      failures.push(
        `${label} — ${hit.el} 이 ${hit.over}px 샌다 (client ${hit.client} / scroll ${hit.scroll})\n` +
          `        원인: ${hit.offenders.map((o) => `${o.what} +${o.out}px`).join(' · ')}\n` +
          `        위치: ${hit.chain.join(' < ')}`
      );
    }

    const unknown = scan.scrollers.filter((s) => !s.why);
    /* 검사한 요소 수를 항상 붙인다 — "0건"이 결함 없음인지 빈 화면인지 사람이 구분할 수 있어야 한다. */
    const seen = `요소 ${scan.inspected}개 검사`;
    if (scan.real.length) {
      console.log(`  ✗ ${label}  새는 요소 ${scan.real.length}개 · ${seen}`);
      for (const hit of scan.real) console.log(`      ${hit.el} +${hit.over}px ← ${hit.offenders[0]?.what}`);
    } else {
      console.log(
        `  ${scan.inspected < MIN_INSPECTED_ELEMENTS ? '✗' : '✓'} ${label}  새는 요소 0 · ${seen}` +
          ` · 의도적 스크롤 ${scan.scrollers.length}개(허용 ${scan.scrollers.length - unknown.length})` +
          ` · 선언된 장식 돌출 ${scan.decorative.length}개` +
          ` · 아코디언 ${expanded.opened}/${expanded.total} 펼침`
      );
    }
    /* 선언된 장식 돌출은 실패가 아니지만 **항상 보인다** — 허용이 눈감기로 굳지 않게. */
    for (const d of scan.decorative) {
      console.log(`      ▫ ${d.el} +${d.over}px ← ${d.offenders[0]?.what}  [선언된 장식 돌출 — data-decorative-overflow]`);
    }
    if (VERBOSE || unknown.length) {
      for (const s of scan.scrollers) {
        const tag = s.why ? `허용 — ${s.why}` : 'INFO 목록에 없는 스크롤 컨테이너 (의도한 것인지 확인하라)';
        console.log(`      ↔ ${s.el} ${s.client}→${s.scroll}  [${tag}]`);
      }
    }

    /* 🔴 감도 자가검증: 심은 뒤 정확히 3건 늘어나야 한다. */
    if (MUTANT) {
      await evaluate(MUTANT_SCRIPT);
      await sleep(200);
      const after = await evaluate(SCAN);
      await evaluate(REMOVE_MUTANT);
      await sleep(200);
      const restored = await evaluate(SCAN);

      const marks = ['mutant-child', 'mutant-text', 'mutant-margin'];
      const caughtMarks = marks.filter((m) => after.real.some((hit) => hit.el.includes(`[${m}]`)));
      const missed = marks.filter((m) => !caughtMarks.includes(m));
      const restoredOk = restored.real.length === scan.real.length;
      const ok = missed.length === 0 && restoredOk;
      console.log(
        `      뮤턴트: 심기 전 ${scan.real.length}건 → 심은 뒤 ${after.real.length}건` +
          `(${caughtMarks.length}/3종 지목: ${caughtMarks.join('·') || '없음'}) → 제거 후 ${restored.real.length}건 ${ok ? '✓' : '✗'}`
      );
      if (!ok) {
        mutantFailures += 1;
        failures.push(
          `${label} — 뮤턴트 감도 실패: ` +
            (missed.length ? `못 잡은 종류 ${missed.join('·')} · ` : '') +
            (restoredOk ? '' : `제거 후 ${restored.real.length}건 (기대 ${scan.real.length}건)`)
        );
      }
    }
  }
}

cdp.close();
if (child) child.kill();

if (failures.length) {
  console.error(`\n[overflowprobe] ${failures.length}건 실패${mutantFailures ? ` (뮤턴트 ${mutantFailures}건 포함)` : ''}`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log('\n[overflowprobe] 전부 통과');
