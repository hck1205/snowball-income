# Hungry Hippo

배당 재투자 시뮬레이터이자 배당 투자 포털. 포트폴리오와 투자 조건을 넣으면 장기 배당 현금흐름과
목표 달성 시점을 계산해 보여준다. **시뮬레이션 계산은 전부 브라우저에서 돈다** — 계산용 백엔드가 없다.

프로덕션: [hungry-hippo.xyz](https://hungry-hippo.xyz)

## Tech Stack

| | |
|---|---|
| 빌드·언어 | Vite · React 18 · TypeScript(strict, `noUnusedLocals`/`noUnusedParams`) |
| 스타일 | Emotion (`styled`) — CSS 변수 기반 팔레트 8프리셋 × light/dark |
| 상태 | Jotai |
| 라우팅 | React Router |
| 차트 | ECharts |
| 검증 | zod (폼·페이로드 스키마) |
| 테스트 | Vitest + React Testing Library |
| 배포 | Vercel (정적 SPA + 서버리스 함수 9개) |

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

## Test / Build

```bash
npm run test                      # Vitest 1회 실행
npx tsc -b tsconfig.build.json    # 전체 타입체크
npm run build                     # ticker:parse → tsc → vite build
npm run verify                    # 배포 전 게이트 (아래 참고)
```

⚠ 맨 `tsc -b` 는 루트(api·middleware)만 본다. 솔루션 진입점은 **`tsconfig.build.json`** 이다.

### 검증은 두 단계다

전체 스위트는 4분 넘게 걸리고, [ci.yml](.github/workflows/ci.yml)이 모든 PR·push 에서 같은 것을 돌린다.

| 무엇을 건드렸나 | 로컬에서 돌릴 것 |
|---|---|
| 🔴 계산 엔진 · 영속 페이로드 · 공유 URL 스키마 | `npm run verify` + 왕복 테스트 — 틀리면 사용자 자산이 걸린다 |
| 그 외 전부 | 해당 테스트 + `npx tsc -b tsconfig.build.json`. 전체는 CI 에 맡긴다 |

`npm run verify` 는 fail-fast 7단계다: 브랜드 체크 → styled 주석 체크 → 타입체크 → 전체 테스트 →
API 번들 → API 체크 → 빌드.

## 코드 검색은 인덱스 먼저

레포 전체를 grep 하지 말고 인덱스를 먼저 친다.

```bash
npm run search -- runSimulation                  # 코드 + 문서 통합
npm run search -- kind:code atom                 # 심볼 종류로 좁히기
npm run search -- file:shared/lib/snowball/SnowballSimulation.ts   # 파일 카드(영향 범위)
npm run index                                    # 인덱스 재생성 (.index/, git 비추적)
npm run hooks:install                            # 커밋 시 자동 재인덱싱 (최초 1회)
```

`file:` 카드는 그 파일의 export·import·**importedBy**·testedBy 를 한 화면에 준다 — 변경 영향 범위를
잡을 때 먼저 본다.

## Folder Structure

```
components/   재사용 UI(components/common/)와 도메인 컴포넌트
pages/        라우팅 페이지 (Main = 시뮬레이터, Landing, Ticker, Portfolio, Ledger, …)
jotai/        전역 상태 · 영속화 · 공유 링크
shared/       공용 코드 — lib/(계산 엔진·서버 유틸) · constants/ · types/ · styles/ · utils/
router/       라우트 정의
server/       서버 렌더 핸들러 18개 (크롤러 HTML · OG 카드 · 프록시 · OAuth)
api/          Vercel 서버리스 진입점 9개 — 🔴 커밋되는 빌드 산출물이다 (`npm run api:bundle`)
tools/        인덱서 · API 번들러 · 개발 검사 스크립트 (순수 Node .mjs)
scripts/      데이터 갱신 파이프라인 (티커 시세·배당·의원거래·국민연금 등)
utils/        상장 티커 파서
test/         Vitest 스위트
supabase/     커뮤니티 스키마 · 마이그레이션
```

**모든 대상 폴더는 `index.ts` 를 포함하고, 외부에서는 폴더 경로로만 import 한다.**
`import { Card } from '@/components/common'` ⭕ / 내부 파일 직접 import ❌
Import alias: `@/*` → 저장소 루트.

⚠ `.cursor/rules` 는 `features/` 를 규정하지만 **현재 코드에 `features/` 는 없다.** 상태는 `jotai/` 에,
비즈니스 훅은 `pages/Main/hooks/` 에 있다. 기존 배치를 존중하고, 대규모 재배치는 승인 후에만 한다.

## 규칙 문서

| 문서 | 무엇 |
|---|---|
| [.cursor/rules](.cursor/rules) | 🔴 **코드 규칙의 정본.** 폴더·파일 명명, import 규약, 테스트 원칙 |
| [CLAUDE.md](CLAUDE.md) | 에이전트·개발 프로세스 가이드, 코드 지도, 조심할 것 |
| [DESIGN.md](DESIGN.md) | 디자인 정본 — 팔레트 2계층, 타이포, 깊이, 반응형 |

## 가장 조심할 것

1. **계산 정확성** — 지급 주기 off-by-one, 연↔월 이율 변환, 재투자 타이밍, 수익률 이중 반영.
   수정 이력이 반복된 영역이다. 바꿨으면 반드시 `npm run test` 로 확인한다.
2. **하위 호환** — 저장 데이터와 공유 URL 은 **사용자 자산**이다. 영속 페이로드·공유 링크 스키마를
   바꾸면 기존 데이터가 계속 열리는지 왕복 테스트로 확인한다.
3. **`api/*.js` 는 데이터를 품은 배포 산출물**이다. 데이터를 갱신하면 `npm run api:bundle` 도 함께
   돌려 커밋한다. Vercel Hobby 의 함수 상한(12개)을 넘기면 **빌드는 통과하고 배포에서 죽는다** —
   `test/api/serverlessFunctionBudget.test.ts` 가 그 실패를 앞당겨 잡는다.
