# snowball-income — 프로젝트 가이드 (Claude Code)

배당 재투자(스노우볼) 시뮬레이터. 사용자가 포트폴리오와 투자 조건을 입력하면 장기 배당 현금흐름과
목표 달성 시점을 계산해 보여주는 **프론트엔드 전용 웹앱**이다. (백엔드 없음 — 모든 계산은 브라우저에서)

## 🔍 검색은 인덱스 먼저 (토큰 효율 필수 규칙)

코드·문서를 찾을 때 **원문을 훑기 전에 인덱스를 1차 검색**한다. 레포 전체를 grep/Read로 스캔하지 말 것.

```sh
npm run search -- runSimulation            # 코드 + 문서 통합
npm run search -- kind:code atom           # 코드 심볼만 (component|hook|atom|type|const|function|styled)
npm run search -- kind:pure allocation     # 순수 함수만 — FP 리팩터링 결과물을 빠르게 찾는다
npm run search -- kind:test reinvest       # 테스트 케이스 제목으로
npm run search -- kind:docs 공유            # 문서(CLAUDE.md / .cursor/rules / .claude/agents)
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

## 에이전트 팀 (orchestrator ↔ specialist)

복잡한 다단계 작업은 **`orchestrator`** 가 분해 → 위임 → 검증 → 종합한다
(`.claude/settings.json`의 UserPromptSubmit 훅이 프롬프트를 orchestrator로 라우팅한다.
끄고 싶으면 그 `hooks` 블록을 지운다). 정의는 [.claude/agents/](.claude/agents/).

### 팀 지식 기반 — 성장형 에이전트 (2026-07-17~)

**[.claude/knowledge/](.claude/knowledge/)** 는 에이전트 팀의 누적 학습 저장소다
(decisions·pitfalls·project-map·retro·user-profile). 모든 에이전트는 정의에 심어진
**학습 프로토콜**에 따라 작업 전 `INDEX.md`를 읽고, 작업 후 "코드만 봐서는 알 수 없는"
교훈을 기록한다. orchestrator는 큐레이터(브리핑에 지식 주입·중복 정리·미션 회고)를 겸한다.
메인 세션도 여기 기록된 결정·함정을 존중한다 — **확정 결정을 뒤집으려면 사용자 승인 필요.**

| 에이전트 | 담당 |
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

각 에이전트는 작업 결과를 **핸드오프 형식**(요약 / 산출물 `path:line` / 다음 담당 제안 / 리스크)으로 반환한다.

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
