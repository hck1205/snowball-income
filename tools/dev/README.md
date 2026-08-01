# tools/dev — 개발 속도용 CLI 3종

이번 개발 사이클에서 **여러 기능 트랙이 병렬로**(각자 브랜치/워크트리) 굴러가면서 반복된 수작업을
자동화한다. 전부 **순수 Node `.mjs`(외부 의존성 0, `node:` 빌트인만)** 이고, `tools/indexer` 관례를 따른다.

| 도구 | 한 줄 | 안전성 |
|------|-------|--------|
| `tracks` | 미커밋 변경을 "기능 트랙"별로 갈라 본다 | 읽기 전용 |
| `devstatus` | 브랜치·변경·워크트리·인덱스·api번들 한 화면 대시보드 | 읽기 전용 |
| `predeploy` | 한 트랙의 변경만으로 격리 빌드가 그린인지 검증 + api 드리프트 진단 | 기본 dry-run, `--run` 도 라이브 트리 무손상 |
| `uiprobe` | 앱을 실제로 그려서 재고 찍는다(스샷·오버플로·정렬) | 읽기 전용(헤드리스) |
| `tintscan` | 라우트별 **틴트 면 개수** 실측 — `DESIGN.md` §2-6 상한 2 | 헤드리스 · 자기가 띄운 프로파일의 localhost 저장소만 비운다 |
| `archclip` | 카드의 **둥근 모서리(아치)를 콘텐츠가 넘는지** 실측 — 허용 0건 | 헤드리스 · 자기가 띄운 프로파일의 localhost 저장소만 비운다 |
| `headerprobe` | 헤더 높이 상한 + **문서 레벨** 가로 오버플로 | 읽기 전용(헤드리스) |
| `overflowprobe` | **요소 레벨** 가로 오버플로 — 터치 타깃 거짓 양성을 걸러낸다 | 헤드리스 · 시드로 localhost IndexedDB 에만 쓴다 |

```sh
npm run tracks                     # = node tools/dev/tracks.mjs
npm run devstatus                  # = node tools/dev/devstatus.mjs
npm run predeploy -- reconcile     # = node tools/dev/predeploy.mjs reconcile
```

> Windows PowerShell에서 `npm run` 은 인자 앞에 `--` 를 붙여야 스크립트로 전달된다:
> `npm run predeploy -- reconcile --run`. 헷갈리면 `node tools/dev/predeploy.mjs reconcile` 로 직접 실행한다.

---

## 트랙이란

한 사이클에 동시에 진행되는 **기능 단위**다. 파일 경로 → 트랙 매핑 규칙은 [`trackConfig.mjs`](./trackConfig.mjs)
**한 곳**에 있다. 현재 트랙:

| 트랙 | 대략의 범위 |
|------|-------------|
| `ticker-seo` | `pages/Ticker/`, `shared/constants/tickers/`, `server/handlers/TickerHtml/`, `api/ticker-html.js`, `test/api/tickerHtml*` |
| `reconcile` | `jotai/snowball/cloud/`, `components/CloudReconcileModal/`·`CloudSyncIndicator/`, `pages/Main/hooks/business/useCloud*`, `pages/Main/components/MainLeftPanel/`, `*cloud*`·`*reconcile*` 테스트 |
| `ticker-data` | `shared/constants/marketData/`·`presets/`, `scripts/tickerRefresh/` |
| `chart-viz` | `pages/Main/components/ChartPanel/`·`MainRightPanel/`, `pages/Main/utils/charts*`, `components/ResultSummaryCard/`, `components/common/StatTile/`, `shared/styles/chartTheme*` |
| `fx` | `components/ExchangeRateWidget/`, `api/fx.js` |
| `docs-knowledge` | `.claude/`, `docs/`, 루트의 `*.md` |
| `other` | 위 어디에도 안 걸리는 전부 |

---

## 1. `tracks` — 변경을 트랙별로

```sh
node tools/dev/tracks.mjs                    # 트랙별 그룹(사람용). 파일마다 staged/unstaged/untracked 표시
node tools/dev/tracks.mjs --json             # 전체를 JSON 으로
node tools/dev/tracks.mjs --track reconcile  # 그 트랙 파일 경로만(개행 구분) — 파이프용
```

한 트랙만 스테이징:

```sh
git add $(node tools/dev/tracks.mjs --track reconcile)
```

- `--track` 출력은 **stdout 에 경로만** 낸다(안내·경고는 stderr). 그래서 `$(...)` 파이프가 깨끗하다.
- git 이 없거나 레포가 아니어도 죽지 않고 조용히 알린다.

## 2. `devstatus` — 한 화면 대시보드

```sh
node tools/dev/devstatus.mjs
```

보여주는 것:

- **브랜치** + origin 대비 `ahead/behind`
- **미커밋 변경** 트랙별 개수 (tracks 로직 재사용)
- **로컬 브랜치**(`◆` = 다른 워크트리가 체크아웃) + **워크트리** 목록
- **인덱스 신선도** — `.index/code.json` mtime vs `shared/`·`pages/`·`components/`·`jotai/` 최신 소스
- **api 번들 신선도** — `api/*.js` 가 `server/handlers/` 와 일치하는지 (`api:check` 실행, **상태만** 보고)

모든 섹션은 실패해도 죽지 않고 "확인 불가"로 표기한다. **아무것도 고치지 않는다** — `npm run index`,
`npm run api:bundle` 같은 다음 행동만 제안한다.

## 3. `predeploy` — 트랙 격리 빌드 검증 (⚠ 안전 최우선)

```sh
node tools/dev/predeploy.mjs <track>         # dry-run(기본): 대상 파일 + 격리 검증 계획만 출력
node tools/dev/predeploy.mjs <track> --run    # 실제 격리 빌드
```

"이 트랙의 변경만 배포하면 빌드가 서는가?"를 **라이브 작업트리를 건드리지 않고** 검증한다.

### 안전 설계 — 라이브 트리 무손상 보장

- **`git stash` 를 절대 쓰지 않는다** (에러 시 미커밋 변경 유실 위험).
- 기본은 **dry-run** — 대상 파일과 "무엇을 할지"만 출력하고 아무것도 실행하지 않는다.
- `--run` 은 **임시 git worktree**(`git worktree add --detach <tmp> HEAD`)를 OS 임시 폴더에 따로 만들고:
  1. `node_modules` 를 실 저장소 것으로 **정션/심링크**(설치 0초)
  2. 이 트랙의 **추적 파일 변경만** `git diff HEAD -- <파일들>` → `git apply` 로 반영
  3. 이 트랙의 **untracked 파일만** 복사
  4. 거기서 `tsc -b tsconfig.build.json` → `vite build` 실행
  5. 결과 보고 후 **워크트리 제거**
  - 라이브 트리는 `git diff`·파일 읽기로 **읽기만** 한다 — `add`·`checkout`·`stash` 없음.
  - 어느 단계에서 실패하든 `finally` 에서 반드시 정리한다. 정리 순서가 안전의 핵심이다:
    **node_modules 링크를 먼저 끊고**(재귀 삭제가 실제 node_modules 에 닿지 못하게) → 워크트리 제거 → 임시 폴더 삭제.

### api 번들 드리프트 진단

`predeploy` 는 끝에 `api:check` 를 돌려 `api/*.js` 가 `server/handlers/` 와 어긋났는지 본다. 어긋났으면
어느 산출물이 어느 핸들러 소스에서 나왔는지 매핑해 보여주고 **`npm run api:bundle` 을 제안**한다
(직접 실행하지 않는다). 드리프트가 아니라 빌드 자체가 깨진 경우(예: node_modules 없는 워크트리)는
"확인 불가"로 구분해 알린다.

---

## 트랙 추가·수정하는 법

[`trackConfig.mjs`](./trackConfig.mjs) **한 파일만** 고치면 세 CLI에 모두 반영된다.

1. `TRACKS` 배열에 항목 추가:
   ```js
   { name: 'my-track', emoji: '🧩', label: '한 줄 설명', patterns: [/^pages\/MyFeature\//, /^api\/my-feature\.js$/] }
   ```
2. `patterns` 는 **저장소 루트 기준 POSIX 경로**(슬래시)에 대해 `test` 된다.
   - 폴더: `/^pages\/Ticker\//` (앵커 `^` + 후행 `/`)
   - 특정 파일: `/^api\/fx\.js$/`
   - 이름 패턴: `/reconcile/i`
3. **순서가 의미 있다** — `classifyPath` 는 위에서부터 **첫 매칭**을 채택한다. 좁은/우선순위 높은 트랙을 위에.
4. 확인: `node tools/dev/tracks.mjs` 로 파일이 의도한 트랙에 떨어지는지 본다.

## 구성 파일

| 파일 | 역할 |
|------|------|
| `trackConfig.mjs` | 트랙 정의(`classifyPath`) + 트랙 메타 + 공용 헬퍼(`git`/`run`/`paint`/`checkApiBundle`) |
| `tracks.mjs` | `collectChanges()`(git status 파싱+분류, 다른 둘이 재사용) + `tracks` CLI |
| `devstatus.mjs` | 대시보드 CLI |
| `predeploy.mjs` | 격리 빌드 검증 CLI |

---

## 4. `uiprobe` — 앱을 **실제로 그려서** 재고 찍는다

```sh
npm run uiprobe -- --shot tmp/main.png --width 390
npm run uiprobe -- --overflow --width 320,360,390,768,1200
npm run uiprobe -- --eval "document.querySelectorAll('[role=tab]').length"
npm run uiprobe -- --click "워렌 버핏" --click "적용" --shot tmp/result.png
```

**왜 있나.** 이 레포에는 렌더 테스트로 못 잡는 결함이 반복해서 난다 — 아이콘 정렬 어긋남, 좁은 폭
가로 오버플로, 컨테인먼트로 잘리는 카드. jsdom 은 레이아웃을 계산하지 않아서(`@media`·
`getBoundingClientRect` 전부 0) 테스트가 그린이어도 화면은 깨져 있을 수 있다. 그때마다 CDP 스크립트를
즉석에서 다시 짜는 낭비가 매 세션 반복됐다(2026-07-29 하루에만 8개).

**가장 중요한 옵션은 `--shot` 이다.** PNG 로 남기면 **눈으로 확인**할 수 있다 — 보지 않고 고치는 것이
이 레포에서 가장 비쌌던 실패다(같은 날 캡처 기능을 추측으로 5회 수정).

- 이미 CDP 가 떠 있으면 **붙고**, 없으면 헤드리스로 띄운다(`--keep` 로 남길 수 있다).
- `--width` 에 쉼표를 주면 각 폭을 순회하며 같은 검사를 반복한다. `--shot` 은 파일명에 폭이 붙는다.
- `--overflow` 는 넘쳤을 때 **범인 후보 요소**까지 같이 준다 — "문서가 넘쳤다"만으로는 어디를 볼지 모른다.
- 외부 의존성 0. Node 빌트인 `fetch` + `WebSocket` 으로 CDP 를 직접 말한다.

> ⚠ `content-visibility: auto` 인 요소(이 레포의 `Card`)는 **뷰포트 밖이면 그려지지 않는다.**
> 전체 페이지 스샷에서 아래쪽 카드가 비어 보이면 그것 때문이다 — 화면 결함이 아니다.
> 같은 이유로 **이미지 내보내기(결과 캡처)도 영향을 받는다.**

---

## 5. `tintscan` — 라우트별 **틴트 면 개수**를 실측한다

```sh
npm run tintscan                                     # 3라우트 · 1280px · 상한 2 (초과하면 exit 1)
npm run tintscan -- --url http://localhost:5199      # dev 서버 포트가 다를 때
npm run tintscan -- --route /dividend/portfolio --click SCHD   # 빈 상태가 아닌 화면을 만들어서 센다
npm run tintscan -- --json
```

**왜 있나.** `DESIGN.md` §2-6 이 "한 화면에 틴트 면 최대 2개"를 규칙으로 적어 뒀는데 **아무도 세지
않아서** `/dividend/portfolio` 가 3~5개로 늘어난 채 배포돼 있었다. 이건 **소스 스캔으로 못 잡는다** —
각 면은 각자의 파일에서 각자 옳고, 문제는 "한 화면에 몇 개가 동시에 서는가"다. jsdom 도 못 잡는다.

- **면의 정의**: 스코프(기본 `main`) 안에서 폭 ≥180px · 높이 ≥8px 이고 배경이 중립 토큰
  (`--sb-bg`/`surface*`/`progress-track`)이 아니거나 `background-image`가 있는 엘리먼트.
  중립 색은 **런타임 `:root`에서 읽어** 비교하므로 8프리셋 × 라이트/다크 어디서 돌려도 맞는다.
- 전역 헤더는 뺀다(`<main>` 안쪽만) — 모든 라우트에 상시 서는 앱 크롬이라 비교값에 상수로 얹힌다.
- **빈 화면은 통과가 아니라 실패다**(`측정 불가`). 콜드 로드가 늦으면 "0개 ✓"가 나오던 것을 막는다.
- 우리가 띄운 브라우저면 측정 전에 **origin 저장소를 비운다** — 안 그러면 `--click` 으로 만든 상태가
  다음 실행의 "기본 상태"로 남아 값이 흔들린다.

> ⚠ Git Bash 에서는 `--route /dividend/portfolio` 가 윈도 경로로 바뀐다(MSYS 경로 변환).
> `MSYS_NO_PATHCONV=1` 을 앞에 붙여라 — 안 붙이면 도구가 죽지 않고 **그 사실을 알려준다**.

---

## 6. `headerprobe` — 앱 헤더의 **높이 상한과 가로 오버플로**를 실측한다

```sh
npm run headerprobe                                   # 5라우트 × 5폭, 계약 위반이면 exit 1
npm run headerprobe -- --base http://localhost:5199   # dev 서버 포트가 다를 때
npm run headerprobe -- --widths 1280,390 --routes /
```

**왜 있나.** 헤더는 이 레포에서 가장 조용히 뚱뚱해지는 표면이다. 2026-07-31 이전에는 데스크톱에서
**117px 짜리 2줄**(브랜드 줄 오른쪽 900px 이 빈 채로), 390px 에서 127px 로 첫 화면의 15% 를 먹고
있었는데 **어떤 테스트도 깨지지 않았다** — jsdom 은 `@media` 도 레이아웃도 계산하지 않아 높이를
알 수 없고, 소스만 읽어서는 "두 줄"이 결함으로 보이지 않는다.

재는 계약 4가지:

1. `--sb-app-header-h`(AppHeader 가 실측해 발행하는 값)가 **≥1024px 에서 80px 이하** — 목표 대역 64~72.
2. **발행값 = 실측 박스**. 어긋나면 `ResizeObserver` 발행이 멎은 것이라 그 자체가 결함이다.
3. 전 폭 **가로 오버플로 0**(`documentElement.scrollWidth > clientWidth` 면 실패).
   등호로 판정하지 않는다 — 세로 스크롤바가 없는 짧은 페이지에서는 `scrollWidth`(1265)가
   `clientWidth`(1280)보다 **작게** 나오는 정상 상태가 있다.
4. **스크롤한 뒤에도** 오버플로 0 + 승격된 히어로 액션이 헤더 아래 정확히 8px.
   로드 직후만 재면 못 잡는다 — 실제로 조상 `transform` 하나 때문에 그 버튼이 화면 밖(x=2043px)으로
   날아가 **스크롤한 상태에서만 드러나는** 가로 오버플로가 있었다(2026-07-31 수정).

> ⚠ Git Bash 에서 `--routes /dividend/calendar` 는 윈도 경로로 바뀐다(위 tintscan 과 같은 MSYS 변환).
> `MSYS_NO_PATHCONV=1` 을 앞에 붙이거나 PowerShell 에서 실행하라.

---

## 7. `archclip` — 카드 **아치를 콘텐츠가 넘는지** 실측한다

```sh
node tools/dev/archclip.mjs                                  # / · 390px · 허용 0건
node tools/dev/archclip.mjs --width 320,360,390,414,768
node tools/dev/archclip.mjs --click 캘린더                    # 씨앗 뒤에 이어 눌러 상태를 만든다
node tools/dev/archclip.mjs --json
```

**왜 있나.** 카드 반경을 `calc(radius.sm + 카드패딩)` 으로 키운 뒤에도, **반경 값과 무관하게**
"콘텐츠가 둥근 모서리에 잘리는" 결함은 따로 존재한다(가로 스크롤 표·음수 마진·마지막 행 밀착).
이건 세 방법 다 못 잡는다 — 소스는 파일마다 각자 옳고, jsdom 은 `getBoundingClientRect` 가 전부 0,
`getComputedStyle` 은 선언값만 준다. **기하로 따져야 보인다.**

판정: 모서리는 반지름 r 인 원호다(중심 = 모서리에서 r 안쪽). 자식의 그 방향 꼭짓점이 중심에서
**r 보다 멀면** 그만큼 잘린다.

🔴 이 도구가 **틀린 답을 내지 않기 위해** 하는 세 가지(전부 실측으로 한 번씩 속았던 것):

1. **카드마다 `scrollIntoView` + rAF 2회 뒤에 잰다.** 공용 `Card` 는 `content-visibility: auto` 라
   뷰포트 밖이면 DOM 측정이 거짓말한다.
2. **`checkVisibility({ contentVisibilityAuto: true })` 로 건너뛴 서브트리를 버린다.** 닫힌
   `<details>` 안의 지급월 표가 **카드 아래로 223px 삐져나온 것처럼** 잡혔다 — 화면엔 아무것도 없는데도.
3. **클리핑 조상과 교집합한 뒤에 판정한다.** 지급월 표는 `min-width: 520px` 라 390px 에서 카드 밖까지
   뻗지만 자기 스크롤 컨테이너가 자른다 — 아치 결함이 아니다.

**빈 화면은 통과가 아니다.** 프로파일이 비면 시뮬레이터는 결과 카드 대신 프리셋 보드만 그린다
(카드 18개·침범 0건). 그래서 기본으로 프리셋을 하나 눌러 결과 카드를 세우고, `실지급 월별 배당` 이
없으면 **실패로 끝낸다**.

> 감도 확인(2026-07-31): `ScheduleDetails` 에 `margin-inline: -16px; margin-bottom: -11px` 를 넣으면
> `0건 → 4건 · 최대 5.21px` 로 빨개지고(exit 1), 되돌리면 다시 0건이 된다.

---

## 8. `overflowprobe` — **요소 단위** 가로 오버플로

```sh
npm run overflowprobe                                          # 5라우트 × 390·360px
npm run overflowprobe -- --base http://localhost:5178
npm run overflowprobe -- --routes / --widths 390 --verbose      # 의도적 스크롤러 목록까지
npm run overflowprobe -- --mutant                                # 감도 자가검증
```

**왜 있나.** `headerprobe` 는 **문서 레벨**(`documentElement.scrollWidth > clientWidth`)만 본다.
그건 "페이지가 통째로 가로 스크롤되나"라는 가장 큰 사고만 잡고, **카드 안쪽에서 새는 것**은 문서를
넓히지 않고도 옆 요소를 덮거나 잘려 보인다(실측 사례: 표를 카드로 접는 CSS에서 `width: 1%` 가 문자
그대로 1% 가 되어 삭제 버튼이 21px 삐져나간 건). 그래서 **모든 요소**를 훑는다.

### 🔴 핵심은 "무엇을 세지 않느냐" 다

`scrollWidth − clientWidth` 를 그대로 믿으면 이 레포에서는 **거의 전부가 거짓 양성**이다.
2026-08-01 실측(390px `/`): 걸린 68개 중 **진짜 레이아웃 결함은 0개**였다. 세 부류를 걸러낸다.

1. **스크롤 컨테이너**(`overflow-x: auto|scroll`, **조상까지** 본다) — 내용이 스크롤로 도달 가능하고
   조상으로 전파되지 않는다. 조상까지 보는 이유: 스크롤러는 래퍼고 실제로 넘치는 것은 그 안쪽
   트랙 div 다(`NavScroller` 가 그렇다).
2. **클리핑 컨테이너**(`hidden|clip`) — `sr-only`(1×1+hidden)와 말줄임이 여기 대량으로 걸린다.
3. **의사요소만 넘치는 경우 = 터치 타깃.** `shared/styles/surfaces.ts` 의 `hitArea`/`hitAreaWithin`
   이 시각 크기는 그대로 두고 `::before` 로 히트 영역만 넓힌다. 지문: 38px 토글 트랙 → 좌우 **3px**,
   18px 도움말 버튼 → 좌우 **4px**, 28px 헤더 아이콘 버튼 → 좌우 **8px**. 판정은 자손 **요소 박스**와
   **텍스트 조각(Range)** 중 무엇도 패딩 박스를 넘지 않는지로 한다.

남는 것 = `overflow-x: visible` 인데 실제 자손 박스나 텍스트가 밖으로 나간 요소. 그것만 실패다.

**허용 목록**은 `INTENTIONAL_SCROLLERS` 에 근거와 함께 있다(emotion 해시가 아니라 시맨틱 앵커로
지목한다 — 해시는 빌드마다 바뀐다). 목록에 없는 새 스크롤러는 실패가 아니라 `INFO` 로 찍는다.

**보유 종목 시드**: `/dividend/portfolio` 는 빈 상태로 재면 의미가 없어서 IndexedDB 에 5건을 심고
잰다(`--no-seed` 로 끈다). 스키마 근거는 `pages/Portfolio/utils/portfolioStorage.ts`.

> 감도 확인(2026-08-01, 5라우트 × 2폭 전부): `--mutant` 가 넘치는 요소 3종(고정폭 초과 자식 /
> 무공백 긴 텍스트 / 음수 마진)을 심으면 `0건 → 6건(3/3종 지목) → 제거 후 0건`.
> 건수가 6인 이유는 넘침이 조상으로 전파되기 때문이라 **종류**로 단정한다.
> 소스 뮤턴트로도 확인했다: `PayoutScheduleStrip.styled.ts` 의 `ScheduleScroll` 을
> `overflow-x: auto → visible` 로 바꾸면 `0건 → 1건 · 188px(client 332 / scroll 520)` 로 빨개진다.

> ⚠ Git Bash 에서 `--routes /dividend/calendar` 는 윈도 경로로 바뀐다(MSYS 변환).
> `MSYS_NO_PATHCONV=1` 을 앞에 붙이거나 PowerShell 에서 실행하라.
