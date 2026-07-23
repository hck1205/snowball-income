---
name: dev-process
description: >-
  snowball-income의 **적응형·진화형 개발 프로세스** — 들어온 요청을 트리아지해
  LLM+RULES+SKILLS+CODES를 "딱 필요한 만큼만" 켜는 법. 비단순 개발을 시작할 때, 또는
  "이 작업을 어떻게 접근할지" 정할 때 참고한다. 이 문서 자체가 살아있는 규칙이라, 더 나은
  방법이 보이면 고쳐 쓴다.
---

# Smart Dev Process — snowball-income

목표: AI로 개발하되 **일관·효율·스마트**하게. 그 핵심은 LLM 하나가 아니라 **네 기둥의 협업**이고,
매번 풀세트를 켜는 게 아니라 **요청에 따라 선택적으로** 켜는 것이다. 그리고 이 프로세스 자체가
**진화**한다 — 더 나은 길이 보이면 이 문서와 스킬을 고친다.

## 네 기둥 (어디에 사는가)

| 기둥 | 무엇 | 위치 |
|---|---|---|
| **RULES** | 제약·누적 지식 (항상 먼저 로드) | `CLAUDE.md` · `.cursor/rules` · `.claude/knowledge/`(decisions·pitfalls·project-map·architecture·roadmap·user-profile·retro) |
| **SKILLS** | 반복 워크플로를 코드화한 절차 | `.claude/skills/`(dev-process·ship·feature·new-ticker-page·refresh-data·graphify·portfolio-post) |
| **AGENTS(LLM)** | 실행 — 스페셜리스트 팀 + orchestrator | `.claude/agents/` + UserPromptSubmit 라우팅 훅 |
| **CODES/TOOLS** | 빠른·결정적 컨텍스트/검증 | `npm run search`(인덱스) · codegraph · graphify · `tools/dev/`(tracks·devstatus·predeploy·verify) · 테스트 |

## 1. 먼저 트리아지 (적응형 — 필요한 만큼만)

**모든 요청은 먼저 티어로 분류하고, 그 티어에 맞는 기둥만 켠다.** 사소한 질문에 pm-po→specialist→
qa→reviewer를 돌리는 건 스마트한 게 아니라 낭비다. 반대로 스키마·저장·계산을 건드리는 일을 "국소
변경"으로 처리하면 사고가 난다. 티어 판단이 이 프로세스의 두뇌다.

| 티어 | 신호 | 엔진 (켜는 것) |
|---|---|---|
| **T0 대화·사소** | 질문·설명·사소한 확인, 슬래시/스킬 호출, 대화에서 바로 답 가능 | **직접 답.** 에이전트·스킬 0. RULES는 컨텍스트로만. |
| **T1 국소 변경** | 1~2파일·명확·되돌리기 쉬움 (카피 변경, 상수, 플래그, 단일 컴포넌트 제거) | **직접 편집 + `verify`.** 필요시 스페셜리스트 1명. |
| **T2 다층 기능·버그** | 여러 레이어(엔진/상태/UI)·버그 추적·리팩터 | **understand**(codegraph/search) → **specialist(들) 병렬** → **qa** → **reviewer**. orchestrator가 분해·종합. |
| **T3 신규 제품기능** | "이 기능 어때", 새 화면/도메인, 스코프 불명 | **pm-po**(문제·목표·AC·비목표) → T2 루프. |
| **T4 배포** | "배포/올려/커밋", 프로덕션 반영 | **`ship` 스킬** (아래). ⚠ [[ask-before-deploy]] — 매번 승인. |
| **도메인 반복** | ETF 페이지 추가 · 티커 데이터 갱신 | `new-ticker-page` · `refresh-data` 스킬. |

**경계 판단 원칙**: 애매하면 한 티어 **위**로(더 신중히). 특히 **사용자 데이터·계산 정확성**(CLAUDE.md
"가장 조심할 것")을 건드리면 최소 T2 + reviewer. 되돌리기 어렵거나 외부로 나가는 일은 승인 먼저.

## 2. 루프 (T2 이상)

이해 → 계획 → 실행 → 검증 → 학습 → 배포. 각 단계가 특정 기둥을 쓴다.

1. **이해**: `npm run search`로 위치, `codegraph`로 호출·영향범위, 관련 `.claude/knowledge/` 로드.
   원문 훑기 전에 인덱스부터(토큰 규칙).
2. **계획**: T3는 pm-po가 AC까지. T2는 orchestrator가 독립 하위작업으로 분해(병렬 가능한 건 병렬).
3. **실행**: 스페셜리스트에 위임. 브리핑에 **관련 지식·확정 결정·제약**을 주입(서브에이전트는 대화 못 봄).
4. **검증**: `npm run verify`(tsc→test→api번들→build) + qa(사용자행동 테스트) + reviewer(정확성·구조·
   하위호환·데이터안전). **바꿨으면 반드시 테스트**(계산·왕복·공유링크).
5. **학습**: "코드만 봐선 모를" 교훈을 `.claude/knowledge/`에 기록(형식: `- [YYYY-MM-DD][도메인] 교훈 — 근거`).
   중복 검색 후. **여기서 프로세스 개선점도 함께 잡는다(§4).**
6. **배포**: `ship` 스킬(T4).

## 3. `ship` (T4 배포) — 요약, 상세는 `.claude/skills/ship`

`tracks`로 변경을 기능별 분류 → 배포할 트랙만 스테이징 → `predeploy`/`verify`로 **격리 빌드 그린 확인**
→ 브랜치·PR → **배포 승인 확인** → main 머지(Vercel). 무관 WIP·다른 트랙은 섞지 않는다. api 산출물이
소스에 의존하면(og/ticker-html이 marketData 임베드) `api:bundle` 재생성 필수.

## 4. 진화 (이 프로세스는 살아있다) ⭐

**이 구조는 고정이 아니다. 더 나은 방법이 보이면 바꾼다.** 그게 스마트함의 핵심이다.

- **언제 진화하나**: 같은 마찰을 반복해 겪을 때(예: api:check 젬린, worktree vitest 중복), 스킬이 실제와
  어긋날 때, 더 빠른/안전한 패턴을 발견했을 때, 새 도구·에이전트·규칙이 생겼을 때.
- **어떻게**: 그 발견을 `.claude/knowledge/retro.md`(또는 pitfalls/decisions)에 남기고 → **관련 스킬·이
  문서·트리아지 표를 실제로 고친다**(기록만 하고 방치 금지). orchestrator가 큐레이터로 주기적으로 retro를
  스킬/규칙에 접는다.
- **누가**: 아무 세션·아무 에이전트나. "이 문서를 따르되, 더 나으면 이 문서를 고쳐라"가 규칙이다.
- **버전 감각**: 큰 구조 변경은 retro에 한 줄 근거를 남겨 왜 바뀌었는지 추적 가능하게. 확정 결정을
  뒤집을 땐 [[team-knowledge-base]] 규칙대로 사용자 승인.

> 이 문서가 개발을 느리게 하거나 현실과 어긋나면, 그건 이 문서가 틀린 것이다 — 고쳐라.

## 참고 (연결)

- 워크플로 스킬: `.claude/skills/ship` · `feature` · `new-ticker-page` · `refresh-data`
- CODES: `npm run tracks|devstatus|predeploy|verify` (`tools/dev/`), `npm run search`, codegraph, graphify
- RULES 진입점: `CLAUDE.md`(스택·규칙·코드지도) · `.claude/knowledge/INDEX.md`
