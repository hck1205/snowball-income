# tools/dev — 개발 속도용 CLI 3종

이번 개발 사이클에서 **여러 기능 트랙이 병렬로**(각자 브랜치/워크트리) 굴러가면서 반복된 수작업을
자동화한다. 전부 **순수 Node `.mjs`(외부 의존성 0, `node:` 빌트인만)** 이고, `tools/indexer` 관례를 따른다.

| 도구 | 한 줄 | 안전성 |
|------|-------|--------|
| `tracks` | 미커밋 변경을 "기능 트랙"별로 갈라 본다 | 읽기 전용 |
| `devstatus` | 브랜치·변경·워크트리·인덱스·api번들 한 화면 대시보드 | 읽기 전용 |
| `predeploy` | 한 트랙의 변경만으로 격리 빌드가 그린인지 검증 + api 드리프트 진단 | 기본 dry-run, `--run` 도 라이브 트리 무손상 |

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
| `chart-viz` | `pages/Main/components/ChartPanel/`·`MainRightPanel/`, `pages/Main/utils/charts*`, `components/SimulationResult/`, `components/common/StatTile/`, `shared/styles/chartTheme*` |
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
