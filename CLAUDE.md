# snowball-income — 프로젝트 가이드 (Claude Code)

배당 재투자(스노우볼) 시뮬레이터. 사용자가 포트폴리오와 투자 조건을 입력하면 장기 배당 현금흐름과
목표 달성 시점을 계산해 보여주는 **프론트엔드 전용 웹앱**이다. (백엔드 없음 — 모든 계산은 브라우저에서)

## 스택 / 명령

Vite + React 18 + TypeScript(strict) + Emotion + Jotai + React Router + ECharts + zod + Vitest/RTL

```sh
npm run dev            # 개발 서버
npm run test           # Vitest 단발 실행
npx tsc -b             # 타입체크 (noUnusedLocals/Params 켜져 있음)
npm run build          # ticker:parse → tsc -b → vite build
npm run ticker:parse   # utils/TickerParser로 상장 티커 JSON 재생성
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
