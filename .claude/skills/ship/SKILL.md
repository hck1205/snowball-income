---
name: ship
description: >-
  snowball-income 배포(T4) 워크플로 — 미커밋 변경을 **기능 트랙별로 갈라** 배포할 트랙만
  스테이징하고, 격리 빌드를 그린으로 확인한 뒤 브랜치·PR·승인·main 머지(=Vercel)까지 간다.
  "배포/올려/커밋/PR" 요청, 또는 여러 트랙이 한 작업트리에 섞여 있을 때. api 산출물 재생성·
  선택 커밋의 함정을 코드화했다. ⚠ 매번 [[ask-before-deploy]] 승인 확인.
---

# ship — 배포 (T4)

배포는 이 프로젝트에서 **가장 사고가 잦은 지점**이다. main push = Vercel 자동배포라 되돌리기 어렵고,
한 작업트리에 **여러 트랙이 병렬로** 섞여 있어(FX·리컨사일·티커 등) "무관한 WIP까지 실려 나가는" 사고가
반복됐다. 이 스킬은 그 절차를 못 박는다.

> ⚠ **트리아지**: 이건 T4다. 코드를 아직 안 고쳤으면 먼저 T1~T3(직접편집/feature)로 만들고, **여기서는 배포만** 한다.

## 트리거
"배포해줘 / 올려줘 / 커밋하고 PR / main에 머지" + 이미 만들어진(검증 대기) 변경이 작업트리에 있을 때.

## 절차

### 1. 무엇이, 어느 트랙인지 — 스테이징 전에 반드시
한 작업트리에 여러 기능이 섞여 있다고 전제한다(실제로 그렇다). 배포할 **하나의 트랙**만 골라낸다.

- `npm run tracks` (있으면; `tools/dev`가 `chore/dev-cli-tools`와 함께 랜딩) — 미커밋 변경을 트랙별로 분류해 보여준다.
  없으면 `git status`를 직접 훑어 트랙 경계를 잡는다. 트랙 예: **ticker-seo · reconcile · ticker-data ·
  chart-viz · fx · docs-knowledge · other**.
- **배포 대상 트랙 하나만** 정한다. 나머지(다른 트랙·`other`의 무관 WIP)는 이 배포에 **넣지 않는다.**

### 2. 선택 스테이징 — 함정 3개(#42 리컨사일 실측)
한 파일에 두 트랙의 훵크가 섞여 있으면(예: `analytics.ts`에 GA4 가드 + 리컨사일 택소노미) `git add -p`로 훵크를 가른다. 그다음:

- 🔴 **`git commit -- <pathspec>` 금지.** pathspec 커밋의 기본은 `--only`(그 경로의 **작업트리 현재 내용**을
  통째 커밋 — index staged 여부 무시)라, 부분 스테이징한 파일을 pathspec으로 커밋하면 unstaged 훵크까지 실린다.
  → 다른 트랙을 **전부 pathspec 커밋으로 먼저 떼어내** 인덱스에 이 트랙의 staged 훵크만 남긴 뒤,
  **pathspec 없는 순수 `git commit`**(인덱스 커밋)으로 마무리한다.
- **격리 빌드 전에 HOLD 코드를 대피**할 땐 `git stash push -u --keep-index` → 빌드 → **`stash pop` 금지**.
  plain pop은 staged/unstaged 구분을 못 복원해 부분 스테이징이 통째 unstage된다. `apply --index`로 복원 검증 후 `drop`.
- SHIP 커밋 완료 후 다른 브랜치로 checkout할 때 "local changes would be overwritten"은 **안전장치**(데이터 손실 아님) —
  HOLD 잔여를 다시 `stash push -u`로 대피하고 전환한다.

### 3. api 산출물 재생성 — 소스 의존 시 필수
`api/*.js`는 **커밋되는 생성물**이다(`server/handlers/*`를 esbuild 번들). **소스가 바뀌면 재생성 없이는 stale**로 배포된다.

- 배포 트랙이 `server/handlers/`나 그 **전이 의존**(marketData·presets·tickers)을 건드리면 → `npm run api:bundle` 후 바뀐 `api/*.js`를 함께 스테이징.
- ⚠ 최상위 import grep만으론 부족하다(#43 실측): `og.js`는 핸들러 최상위 import엔 안 보이지만 `ogCard`의 재시뮬 경로로
  **marketData까지 전이 의존**한다. 의심되면 재번들해 실제 바이트 diff를 본다. **정답은 `npm run verify`가 대신 해준다**(4단계).

### 4. 격리 빌드 그린 — 이 트랙만으로 서는가
- `npm run verify` — **tsc → vitest(.claude 제외) → api:bundle → api:check → vite build** fail-fast. 3단계에서
  api 산출물을 재생성하고 4단계에서 드리프트 0을 확인한다. (server/handlers 무관 트랙이면 `--no-api` 가능하나 확신 없으면 전부 돌린다.)
- `npm run predeploy -- <track> --run` (있으면) — 임시 워크트리에 **이 트랙 변경만** 반영해 `tsc→vite build`가 서는지
  **격리** 검증(라이브 트리 무손상, stash 안 씀). "무관 WIP 없이도 빌드가 서는가"를 verify보다 엄밀히 본다.

### 5. 커밋 스코프 검증 — 누출 없나
- 스테이징한 diff에 **다른 트랙 심볼이 없는지** grep. ⚠ 지식문서(`.claude/knowledge/*`)에 트랙 키워드가 매치되는 건
  **팀 지식(정상)**이고, 실제 **코드**(`jotai/…`·`components/…`)에 매치되는 것만 진짜 누출이다 — 구분해서 본다(#42 실측).
- 공유 지식파일(roadmap.md 등)은 다른 트랙이 같은 파일에 남긴 항목이 같은 diff에 섞일 수 있다 — 파일별 diff를 훑어
  무엇이 왜 들어왔는지 파악하고, 스코프 설명과 어긋나면 리포트에 한 줄 남긴다.
- 로컬 main이 origin보다 뒤처졌으면 push 전 `git merge-tree --write-tree <branch> origin/main`(읽기전용)로
  실제 충돌 여부를 미리 확인(특히 여러 세션이 append하는 지식문서).

### 6. 브랜치·PR·승인·머지
- `git-manager`가 브랜치·커밋(메시지 끝에 Co-Authored-By)·PR을 만든다. 새 env(예: `VITE_*`)를 요구하면 그 PR에 `.env.example`·셋업 문서 갱신을 포함.
- 🔴 **[[ask-before-deploy]] — main 머지(=Vercel 배포) 전 매번 사용자 승인.** "요청 문구의 해석"은 승인이 아니다. 승인 없이 머지 금지.
- 승인되면 main 머지 → Vercel 자동배포. `api/*` 는 유닛테스트가 초록이어도 **배포 후 실 URL curl 이 유일한 검증**(호출 규약 사고 이력).

## 검증(요약)
`npm run verify` 그린 + (있으면) `predeploy --run` 그린 + diff 누출 grep 통과 + 승인 획득.

## 함정 압축
- pathspec 커밋 `--only` 기본동작 · `stash pop` vs `apply --index` · api 전이의존(og→marketData) · 지식문서 grep 오판 · main push=되돌리기 어려움.
- **예외**: 티커 데이터 월간 갱신은 [[ask-before-deploy]]의 **승인된 자동배포 예외**(→ `refresh-data` 스킬). 그 외 배포는 전부 승인.

## 진화
이 절차가 현실과 어긋나거나 더 나은 길이 보이면 `.claude/knowledge/retro.md`(또는 pitfalls)에 근거를 남기고 이 스킬을 고쳐라. 프로세스는 살아있다(dev-process 마스터 §4).
