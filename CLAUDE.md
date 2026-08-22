# snowball-income — 프로젝트 가이드 (Claude Code)

배당 재투자 시뮬레이터 **Hungry Hippo**. 사용자가 포트폴리오와 투자 조건을 입력하면 장기 배당 현금흐름과
목표 달성 시점을 계산해 보여주는 **프론트엔드 전용 웹앱**이다. (백엔드 없음 — 모든 계산은 브라우저에서)

> 🔴 제품명은 **영문 "Hungry Hippo" 하나**다(한글 음차 금지, 2026-08-03 확정). "눈덩이/스노우볼/snowball"
> 비유는 **전 표면 완전 금지**이고 브랜드 예외 조항은 폐기됐다 — 같은 개념은 복리·시간·재투자로 푼다.
> 위 제목의 `snowball-income` 과 아래 경로들의 `snowball`(`shared/lib/snowball/`·`jotai/snowball/`)은
> **저장소·코드 식별자**라 브랜드가 아니다 — 바꾸지 마라.
> 근거 [.claude/knowledge/decisions.md](.claude/knowledge/decisions.md) "리브랜딩" 섹션.
>
> 🔴 **브라우저 저장소 접두사는 2026-08-17 에 `snowball:` → `hungryhippo:` 로 옮겼다**(사용자 결정으로
> 위 "바꾸지 마라"에서 **제외**됐다 — 예전 이 줄은 접두사도 바꾸지 말라고 적고 있었다).
> 접두사 정본은 [shared/lib/storage](shared/lib/storage/storagePrefix.ts) 한 곳이고, 새 키는 반드시
> `storageKey('...')` 로 만든다. 옛 접두사로 저장된 값은 부팅 시 1회 이관된다(`migrateLegacyStorageKeys`,
> `main.tsx` 본문 첫 줄). IndexedDB 도 `snowball-income-db` → `hungryhippo-db` 로 옮겼다
> (`jotai/snowball/persistence/portfolioDbMigration.ts` — 실패하면 **옛 DB 를 계속 쓴다**).
> ⚠ `LEGACY_STORAGE_PREFIX` 와 `index.html` 프리페인트의 옛 키 폴백을 지우지 마라 — 아직 이관되지 않은
> 브라우저가 남아 있고, 그게 언제 0이 되는지는 알 수 없다.

## 🔍 검색은 인덱스 먼저 (토큰 효율 필수 규칙)

코드·문서를 찾을 때 **원문을 훑기 전에 인덱스를 1차 검색**한다. 레포 전체를 grep/Read로 스캔하지 말 것.

```sh
npm run search -- runSimulation            # 코드 + 문서 통합
npm run search -- kind:code atom           # 코드 심볼만 (component|hook|atom|type|const|function|styled)
npm run search -- kind:pure allocation     # 순수 함수만 — FP 리팩터링 결과물을 빠르게 찾는다
npm run search -- kind:test reinvest       # 테스트 케이스 제목으로
npm run search -- kind:docs 공유            # 문서(CLAUDE.md / README.md / DESIGN.md / .cursor/rules)
npm run search -- file:shared/lib/snowball/SnowballSimulation.ts   # 파일 카드
```

- 검색 결과는 **`path:line`** 을 준다 → **그 위치만 Read**한다.
- `file:<경로>` 는 그 파일의 **export 심볼 / import / importedBy(이 파일을 쓰는 곳) / testedBy / documentedBy** 를
  한 화면에 보여준다. 변경 영향 범위(blast radius)를 파악할 때 먼저 본다.
- 인덱스가 없거나 오래됐으면 `npm run index`. 커밋 시 pre-commit 훅이 자동 재생성한다
  (최초 1회 `npm run hooks:install`).
- `.index/`는 **자동 생성물**이다(git 비추적). 직접 편집하지 말고 검색만 한다.

> ⚠ 필터는 `kind:` / `limit:` / `file:` **콜론 형태**로 쓴다. Windows PowerShell에서 `npm run`은
> `--kind` 같은 플래그를 npm 설정으로 삼켜 스크립트까지 전달하지 않는다(값만 검색어로 남아 결과가 오염된다).
> 그런 경우 검색 CLI가 조용히 틀린 결과를 내지 않고 에러로 알려준다.

### 심화 탐색은 codegraph (호출 관계·영향 범위)

`npm run search`(자체 인덱서)는 **"어디에 있나"**(심볼·파일 위치)를 빠르게 준다. 그 위를 보완하는 것이
**codegraph** — 호출 그래프·의존·영향 범위를 하나의 도구 호출로 준다(트리시터 파싱, 로컬 SQLite `.codegraph/`).
MCP 서버로 등록돼 있어(`.mcp.json`) `codegraph_explore`·`codegraph_node` 툴을 쓸 수 있고, CLI로도 된다.

```sh
codegraph explore "배당 재투자 타이밍"   # 관련 심볼의 소스 + 호출 경로를 한 번에
codegraph node runSimulation            # 한 심볼의 소스 + caller/callee 추적
codegraph callers buildOgCardModel       # 이 심볼을 부르는 모든 곳
codegraph impact sanitizeRichHtml        # 이 심볼을 바꾸면 영향받는 코드(변경 blast radius)
codegraph affected server/handlers/Sitemap/index.ts  # 이 파일 변경에 영향받는 테스트
```

- **역할 분담**: 이름·위치로 찾을 땐 `npm run search`(가볍고 문서까지 포함), **호출 관계·변경 영향**을 볼 땐 codegraph.
- **신선도**: codegraph는 **파일 와처로 자동 갱신**된다. 와처가 없는 환경(새 clone·CI)에서도 커밋 시
  pre-commit 훅이 `codegraph sync`를 돌려 이중으로 맞춘다. 수동 갱신은 `codegraph sync`(증분)·`codegraph index`(전체).
- `.codegraph/`는 **자동 생성물**이다(git 비추적, `.gitignore`). 설치: `npm i -g @colbymchenry/codegraph && codegraph init`.
- codegraph는 **선택 도구**다 — 없어도 `npm run search`로 대부분의 탐색이 된다. pre-commit 훅도 codegraph가
  없으면 조용히 건너뛴다.

### 전체 지식 그래프는 graphify (코드+문서 통합·커뮤니티)

**graphify** 는 코드뿐 아니라 문서·SQL·설정까지 한 그래프로 묶어(AST 트리시터, 36개 언어) **서브시스템 커뮤니티**
(Leiden 클러스터링)와 **관계 경로**를 준다. codegraph가 "심볼 단위 호출 그래프"라면 graphify는 "레포 전체의
지식 지도 + 리포트(`GRAPH_REPORT.md`)"다. Claude Code 스킬(`/graphify`)과 MCP(`.mcp.json`)로 등록돼 있다.

```sh
graphify update .                    # 코드 재추출·그래프 갱신 (LLM/네트워크 비용 0)
graphify cluster-only . --no-label   # 클러스터 재계산 + GRAPH_REPORT.md 재생성 (LLM 없이)
graphify path "A" "B"                # 두 노드 사이 최단 경로
graphify explain "runSimulation"     # 한 노드와 이웃을 평문으로 설명
```
Claude Code 안에서는 **`/graphify .`** 로 빌드/질의한다(스킬).

- **역할 분담(3층)**: `npm run search`(위치·이름, 가장 가벼움) < **codegraph**(심볼 호출·변경 영향) < **graphify**(레포 전체
  지식 지도·커뮤니티·코드↔문서 연결). 좁은 질문일수록 위쪽, 넓은 "구조 파악"일수록 아래쪽.
- **산출물**: `graphify-out/graph.json`(질의용) · `GRAPH_REPORT.md`(하이라이트·의외의 연결·추천 질문). 서브시스템을
  처음 파악하거나 리팩터 범위를 잡을 때 리포트를 먼저 본다.
- **신선도**: pre-commit 훅이 `graphify update .`(AST 재추출, 비용 0)로 그래프를 증분 갱신한다. **리포트 재생성은
  느려서 훅에 안 넣었다** — 큰 구조 변경 뒤 필요하면 수동으로 `graphify cluster-only . --no-label`.
  실시간이 필요하면 `graphify watch .`(폴더 감시).
- `graphify-out/`은 **자동 생성물**(git 비추적). 설치: `pipx install graphifyy && graphify install --platform claude`.
- graphify도 **선택 도구**다 — 없으면 pre-commit 훅이 조용히 건너뛴다.
  ⚠ SQL 파일은 `pip install "graphifyy[sql]"` 를 추가로 깔아야 그래프에 들어간다(현재는 .sql 제외).

## 스택 / 명령

Vite + React 18 + TypeScript(strict) + Emotion + Jotai + React Router + ECharts + zod + Vitest/RTL

```sh
npm run dev            # 개발 서버
npm run test           # Vitest 단발 실행
npx tsc -b tsconfig.build.json   # 전체 타입체크 (noUnusedLocals/Params 켜져 있음)
                                 # ⚠ bare `tsc -b`는 루트(api+middleware)만 체크한다.
                                 #   루트 tsconfig.json은 Vercel이 읽는 정상 config이고,
                                 #   `tsc -b` 솔루션 진입점은 tsconfig.build.json 이다.
npm run build          # ticker:parse → tsc -b tsconfig.build.json → vite build
npm run ticker:parse   # utils/TickerParser로 상장 티커 JSON 재생성
npm run index          # 코드/문서 인덱스 재생성 (.index/)
npm run search -- <질의>  # 인덱스 검색 (위 "검색은 인덱스 먼저" 참고)
npm run hooks:install  # pre-commit 훅 활성화 (커밋 시 자동 재인덱싱)
```

## 절대 규칙 — `.cursor/rules`

코드를 만들거나 고칠 때 **[.cursor/rules](.cursor/rules)가 요청보다 우선**한다. 핵심만:

- **모든 폴더에 `index.ts` 필수.** 외부에서는 **폴더 경로로만** import — 내부 파일 직접 import 금지.
  - ✅ `import { Card } from '@/components/common'` ❌ `import Card from '@/components/common/Card/Card'`
- 폴더명 = 파일 prefix (PascalCase). 재사용 컴포넌트는 `X.tsx` / `X.styled.ts` / `X.types.ts` / `X.utils.ts` / `X.test.ts` 세트.
- 스타일은 Emotion `styled` (`*.styled.ts`), 시맨틱 HTML. 거대 atom 금지. 과도한 추상화 금지.
- 테스트는 사용자 행동 기반. **className/Emotion 내부 구현 기반 테스트 금지.**
- import alias: `@/*` → 저장소 루트.

## 코드 지도

| 레이어 | 위치 | 메모 |
|--------|------|------|
| 계산 엔진(순수 함수) | `shared/lib/snowball/SnowballSimulation.ts` | zod 폼 스키마, `runSimulation`, `toSimulationInput`, `findTargetYear` |
| 전역 상태 | `jotai/snowball/` | `atoms/`(form·portfolio·ui·derived), `selectors/simulation.ts`, `persistence/` |
| 페이지 | `pages/Main/` | `Main.tsx`(컨테이너) ↔ `Main.view.tsx`(뷰), `hooks/`(business·form·interaction·persistence) |
| UI | `components/common/*`(재사용), `components/*`(도메인) | Card·DataTable·InputField·… / InvestmentSettings·SimulationResult·… |
| 데이터 | `shared/constants/presets/`, `utils/TickerParser/` | 포트폴리오 프리셋, 상장 티커 목록(생성물) |
| 공유/저장 | `jotai/snowball/persistence/`, `pages/Main/hooks/persistence/shareLink.ts` | lz-string 압축 URL, 이름별 저장 슬롯 |
| 계측 | `shared/lib/analytics.ts` | GA4 이벤트 택소노미(`ANALYTICS_EVENT`) — 이벤트마다 용도 주석 |
| 인덱서(도구) | `tools/indexer/` | 순수 Node(.mjs), 외부 의존성 0. `.index/`의 code.json·docs.json 생성 — 앱 코드가 아니라 `.cursor/rules`의 폴더 규칙 적용 대상이 아니다 |

**주의 (구조 편차)**: `.cursor/rules`는 `features/`를 규정하지만 현재 코드에 `features/`는 없고,
상태는 `jotai/`에, 비즈니스 훅은 `pages/Main/hooks/`에 있다. **기존 배치를 존중하고**, 대규모 재배치는
사용자 승인 후에만 한다. 새 폴더/파일은 위 규칙(특히 `index.ts`, 폴더 단위 import)을 지킨다.

## 가장 조심할 것

1. **계산 정확성** — 수정 이력이 반복된 영역이다. 지급 주기 off-by-one, 연↔월 이율 변환,
   재투자 타이밍, 수익률 이중 반영. 바꿨으면 **반드시 `npm run test`로 확인**한다.
2. **하위 호환** — 저장 데이터와 공유 URL은 사용자 자산이다. 영속 페이로드/공유 링크 스키마 변경은
   기존 데이터가 계속 열리는지 왕복 테스트로 확인한다.

## 검증은 두 단계다 — 로컬은 얇게, 전체는 CI (2026-08-12 사용자 결정)

**대기 시간이 실제 비용이다.** 전체 스위트는 4분 넘게 걸리는데, 이제 [ci.yml](.github/workflows/ci.yml)이
모든 PR·push 에서 같은 것(타입체크 → `test:ci` → `api:check`)을 돌린다. **로컬에서 또 돌리는 것은 대개 중복**이다.

| 무엇을 건드렸나 | 로컬에서 돌릴 것 |
|---|---|
| 🔴 **계산 엔진 · 영속 페이로드 · 공유 URL 스키마** | **풀검증.** `npm run verify` + 왕복 테스트. 틀리면 사용자 자산이 걸린다 — 여기서만 뮤턴트·라이브 검증도 유지한다 |
| 그 외 전부 | **해당 테스트 + `npx tsc -b tsconfig.build.json`.** 전체는 CI 에 맡긴다 |

- **독립적인 명령은 한 번에 묶어 병렬로** 부른다(순차 호출은 그만큼 사용자를 기다리게 한다).
- **뮤턴트 테스트·외부 도구 라이브 검증은 위 🔴 줄이거나 사용자가 요청할 때만.** 워크플로 YAML·문서·
  스타일 같은 곳에는 붙이지 않는다.
- 길게 걸리는 것(전체 테스트·verify·PR·배포)은 **백그라운드로 던지고 턴을 끝낸다** — "확인 중"이 정상이다.
- ⚠ 이 완화는 **속도를 위해 위험을 옮긴 것**이지 없앤 게 아니다. 로컬을 얇게 가는 대신 **CI 가 실제로
  초록인지 확인하는 책임**이 생긴다. 머지 전에 CI 결과를 본다.

### 🔴 로컬 초록이 CI 초록을 보장하지 않는다 (2026-08-22 실측)

이 작업 트리는 **여러 세션이 동시에 쓴다.** 그래서 로컬 `npm run verify` 는 내 변경 + 남의 미커밋 변경을
함께 검사하고, CI 는 **커밋된 것만** 본다. 실제로 로컬 verify 가 exit 0 인데 CI 가 3건 실패했다
(`structureRules` · `portfolioPage.states` · `useGoalScenario`).

- 부분 스테이징을 했다면 **커밋한 것만으로 성립하는지** 따로 생각한다. 트리 전체가 초록인 것과 다르다.
- 남의 작업이 섞인 트리에서 `git add` 할 때는 스테이징 목록을 **눈으로 확인**한다.
  (`git diff --cached --name-only` 로 남의 경로가 섞였는지 본다.)

### 🔴 `api/*.js` 는 소스가 아니라 **소스의 그림자**다

`shared/**` 를 건드렸으면 `npm run api:bundle` 을 돌리고 **바뀐 `api/*.js` 를 함께 커밋**한다.
그 파일들은 Vercel 이 실제로 실행하는 배포 산출물이고, 소스와 어긋나면 **프로덕션이 옛 코드를 돈다.**

⚠ **"이 파일은 내 것이 아닌 것 같다"는 판단 기준이 여기서는 통하지 않는다.** 2026-08-17 에 정확히 그렇게
판단해 `api/` 를 스테이징에서 뺐고(그때 트리에 남의 작업이 섞여 있어 그쪽 변경으로 보였다), 그 결과
`api/og.js` 가 어긋난 채 main 에 머지돼 프로덕션이 옛 번들을 돌았다. 되돌리는 데 PR 을 하나 더 썼다.
누가 고쳤든 **소스가 바뀌면 다시 굽는다.**

### 🔴 CI 가 빨간 PR 은 머지하지 않는다

위 사고는 **CI 실패 10초 뒤 머지**로 들어갔다. `mergeStateStatus` 가 `CLEAN` 인지 보고 머지한다
(`gh pr checks <번호> --watch` 로 기다릴 수 있다).
⚠ 자동 갱신이 여는 PR 에는 애초에 CI 가 붙지 않는다 — `GITHUB_TOKEN` 이 만든 이벤트는 워크플로를
트리거하지 않기 때문이다. 그 구멍은 [main-health.yml](.github/workflows/main-health.yml) 이 매일 main 을
직접 검사해 메운다.

## 개발 프로세스 (적응형)

들어온 요청을 **먼저 트리아지**해 그 티어에 맞는 만큼만 켠다(사소한 일에 풀세트는 낭비, 스키마·계산을 국소변경으로
처리하면 사고). 애매하면 한 티어 **위**로 — 특히 사용자 데이터·계산 정확성을 건드리면 최소 T2+reviewer.

| 티어 | 신호 | 켜는 것 |
|---|---|---|
| **T0 대화·사소** | 질문·설명·슬래시 호출 | 직접 답. 에이전트 0 |
| **T1 국소 변경** | 1~2파일·명확·되돌리기 쉬움 | 직접 편집 + `npm run verify` |
| **T2 다층 기능·버그** | 여러 레이어·버그추적·리팩터 | understand(search/codegraph) → specialist 병렬 → qa → reviewer |
| **T3 신규 제품기능** | 새 화면/도메인·스코프 불명 | 문제·목표·수용기준을 먼저 적고 → T2 루프 |
| **T4 배포** | "배포/올려/커밋/PR" | ⚠ 매번 [[ask-before-deploy]] 승인 — 포괄 승인으로 해석 금지 |
| **도메인 반복** | 티커 페이지 추가·데이터 갱신 | 기존 파이프라인(`scripts/`)과 프리셋 규약을 그대로 따른다 |

검증 게이트는 `npm run verify`(브랜드→styled주석→tsc→test→api번들→api체크→build, fail-fast).
**이 프로세스는 진화한다 — 현실과 어긋나거나 더 나으면 근거를 남기고 이 표를 고쳐라.**

⚠ **여기서 프로세스 스킬 문서를 가리키지 않는다.** 예전에는 `.claude/skills/dev-process` 를 "마스터"로
지목했는데 **그 디렉터리는 존재하지 않는다**(2026-08-15 확인). `.claude/` 는 git 비추적이라 새 클론·CI
·다른 PC 에는 애초에 따라가지 않는다 — 추적 문서가 그것을 정본으로 삼으면 안 된다. 프로세스의 정본은
**이 표**다.

## 에이전트 팀 (orchestrator ↔ specialist)

🔴 **위임의 기본값은 "안 한다"다 (2026-08-02 사용자 결정).** 모든 프롬프트를 orchestrator로 보내던
`UserPromptSubmit` 훅은 **제거했다** — 훅 파일도 스크립트도 없다. 되살리지 마라.

**먼저 맨몸으로 시도한다.** 에이전트를 띄우기 전에 항상 "이거 그냥 하면 안 되나?"를 묻는다.
위임은 셋 중 하나일 때만 — ①파일 경계가 실제로 갈리는 병렬 작업 ②머지 전 독립 리뷰·가드 설계
③단일 컨텍스트를 넘는 규모. **공유 파일이 병목이면 위임은 손해다**(핸드오프 왕복만 는다).

🔴 **에이전트 정의(`.claude/agents/`)는 이 PC 에 없다** (2026-08-15 확인 — 디렉터리 자체가 없다).
`.claude/` 는 git 비추적이라 다른 PC 에 있었을 수도, 지워졌을 수도 있다. **아래 표는 "이런 역할로
나누면 좋다"는 지도이지 실재하는 정의가 아니다** — 위임하려면 그 자리에서 역할을 프롬프트로 준다.

**요청이 들어오면 [docs/work-request-template.md](docs/work-request-template.md)의 네 칸(문제·판단기준·제약·기정사항)이
채워져 있는지 먼저 본다.** 채워져 있으면 pm-po 단계를 건너뛰고 바로 착수한다. 비어 있고 그 빈칸이
**결과를 갈라놓을 때만** 되묻는다 — 관례로 답할 수 있는 것은 정하고 진행하고, 무엇을 가정했는지 밝힌다.

### 팀 지식 기반 — 성장형 에이전트 (2026-07-17~)

**[.claude/knowledge/](.claude/knowledge/)** 는 누적 학습 저장소다. **실제로 있는 파일은 셋뿐이다**
(2026-08-15 확인): `INDEX.md` · `decisions.md`(확정 결정) · `pitfalls.md`(반복해서 당한 함정).
예전 이 문단은 `project-map`·`retro`·`user-profile` 도 있다고 적었으나 **그런 파일은 없다.**

작업 **전** `INDEX.md` 를 읽고, 작업 **후** "코드만 봐서는 알 수 없는" 교훈을 남긴다.
여기 기록된 결정·함정을 존중한다 — **확정 결정을 뒤집으려면 사용자 승인 필요.**

⚠ `.claude/` 는 git 비추적이라 **여기 적은 것은 이 PC 에만 남는다.** 팀이 공유해야 할 규칙은
이 `CLAUDE.md` 나 `.cursor/rules` 에, 코드에 붙는 근거는 **그 코드 옆 주석**에 적어야 살아남는다.

아래는 **역할 분담 지도**다(위 경고대로 실재하는 에이전트 정의가 아니다).

| 역할 | 담당 |
|----------|------|
| `pm-po` | 제품 정의 — 문제·목표·성공지표·스코프, 유저스토리·수용기준, 백로그 우선순위 |
| `orchestrator` | 작업 분해·위임·검증·종합 (직접 구현하지 않음) |
| `simulation-engineer` | 계산 엔진 (`shared/lib/snowball/`) |
| `state-engineer` | Jotai 상태·영속화·공유 링크 (`jotai/snowball/`) |
| `frontend-engineer` | React/Emotion 화면·컴포넌트·훅 |
| `ui-ux-designer` | 화면 흐름·반응형·접근성·카피 설계 |
| `ticker-data-curator` | 프리셋/티커 데이터, TickerParser |
| `qa-tester` | Vitest + RTL 테스트 설계·실행 |
| `reviewer` | 머지 전 정확성·구조 규칙 검토 (수정 안 함) |
| `perf-optimizer` | 리렌더·ECharts·캡처·번들 성능 |
| `analytics-analyst` | GA4 데이터 분석 (Google Analytics MCP) |
| `git-manager` | 브랜치·커밋·PR |
| `docs-seo-writer` | README·llms.txt·sitemap·도움말 카피 |
| `portfolio-post-writer` | 포폴 갤러리 글(제목·본문) 작성 — 소개 톤, 결과 숫자 미기재·눈덩이 표현 금지 |
| `etf-seo-page-builder` | ETF·티커 SEO 소개 랜딩 페이지(콘텐츠 모델·크롤러 HTML·JSON-LD·사이트맵·내부링크)를 확장 가능하게 대량 생성 |
| `portfolio-strategist` | 배당 포트폴리오 전략 설계 — 타겟·컨셉·효율 배분을 잡고 앱의 전 입력 필드를 채운 완성 제안 생성. 프리셋에 없는 티커는 실측으로 정의하되 코드 미수정, 없는 티커 목록만 보고(제안 전용) |

위임할 때는 결과를 **핸드오프 형식**(요약 / 산출물 `path:line` / 다음 담당 제안 / 리스크)으로 받는다.

## MCP — Google Analytics (`analytics-mcp`)

[.mcp.json](.mcp.json)에 [공식 GA MCP 서버](https://github.com/googleanalytics/google-analytics-mcp)를 등록해 두었다.
`analytics-analyst`가 이 툴로 실제 GA4 데이터를 조회한다 (`run_report`, `run_funnel_report`, `run_realtime_report` 등).

**설치 (이 PC에는 완료됨)**

```sh
python -m pip install --user pipx
python -m pipx install analytics-mcp    # analytics-mcp 실행파일이 ~/.local/bin 에 설치됨
python -m pipx ensurepath               # PATH 등록 (반영하려면 VS Code 재시작)
```

**인증 (사용자가 직접 해야 함)** — Google Cloud ADC를 쓴다.

1. GCP 프로젝트에서 **Google Analytics Admin API**와 **Google Analytics Data API**를 활성화한다.
2. 아래 둘 중 하나로 자격증명을 만든다.
   - `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform`
     (gcloud CLI 설치 필요. 기본 위치에 저장되므로 추가 설정 불필요)
   - 서비스 계정 키 JSON을 받아 환경변수 `GOOGLE_APPLICATION_CREDENTIALS`에 경로를 지정하고,
     GA 속성 관리에서 해당 서비스 계정 이메일에 **뷰어** 권한을 준다.
3. VS Code를 재시작한 뒤 `/mcp`로 `analytics-mcp` 연결을 확인한다.

인증 전에는 서버는 뜨지만 리포트 호출이 실패한다 — 그 경우 `analytics-analyst`는 데이터를 지어내지 않고
인증 미설정을 그대로 보고한다.
