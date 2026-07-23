# HANDOFF — 2026-07-24 (ETF 티커 SEO · 리컨사일 정책 · 환율 위젯 · 티커 갱신 · 적응형 개발 프로세스)

> 다음 세션은 이 문서부터. 이번 세션 산출물은 **PR #41~#45 전부 main 머지·Vercel 배포 완료**.
> main = origin/main = `9e798fc`, 작업트리 클린. 이전 핸드오프(2026-07-21, api 인프라/SEO ISR)는 git 히스토리 참고 —
> 그 문서의 사용자 액션(네이버 검수·카카오 GA4 분석·관리자 시딩)이 아직 열려 있으면 계속 유효하다.

## 배포 상태 (먼저 확인)

| PR | 내용 | 상태 |
|---|---|---|
| **#41** | ETF 티커 SEO 페이지 11종 (데이터 기반, 크롤러 서버렌더) | ✅ 라이브 |
| **#42** | 클라우드 리컨사일 Policy A(merge-base) + M1(다계정 보호) | ✅ 라이브 |
| **#43** | 티커 시장데이터 갱신 (Yahoo, 49종) | ✅ 라이브 |
| **#44** | FX 환율 위젯(표시전용) + "계산방식 공지" 제거 | ✅ 라이브 |
| **#45** | 개발 도구(CLI 4종) + 적응형 개발 프로세스(스킬 5종) | ✅ 라이브 |
| **#46** | 지식 문서 1줄(git 커밋순서 함정) | ⚠ **OPEN — 확인/머지 필요**(권한 분류기 차단, 앱 무영향) |

## 1. ETF 티커 SEO 페이지 11종 (PR #41)
- SCHD + VIG·DGRO·DGRW·SCHY·HDV·VYM·SPYD·JEPI·JEPQ·O. 라우팅 `/ticker/:name`·`/ticker/all`.
- **확장 구조**: `shared/constants/tickers/`에 데이터 파일 1개 + registry 한 줄 = 페이지·크롤러 HTML·사이트맵·JSON-LD·내부링크 **자동 파생**. → `new-ticker-page` 스킬로 코드화됨.
- 크롤러 대응: `server/handlers/TickerHtml` → `api/ticker-html.js`(marketData 인라인). SPA라 이 서버렌더가 SEO 본체.
- 엔진 수치(배당률 등)는 `{{token}}`으로 프리셋에서 조인(복제 금지). 참고 수치는 공식 팩트시트로 검증(SCHD/VYM 등), 시점민감값 `asOfNote` 표기.
- 신규 서브에이전트 `etf-seo-page-builder`.

## 2. 클라우드 리컨사일 Policy A + M1 (PR #42) — 사용자 데이터 영역, 신중
- **문제**: "기기와 클라우드가 다릅니다" 모달이 해결해도 **계속 뜸**(다기기 핑퐁).
- **근본원인**: merge-base(마지막 합의점) 부재 → 단방향 변경과 동시편집을 구분 못함.
- **Policy A**: per-user merge-base 3-way. 단방향 변경 = **조용한 fast-forward**(모달 없음), 진짜 동시편집 = **모달 1회** → 해결 후 base 갱신 → **재발 없음**. (무모달 자동병합 A+는 사용자와 논의 후 **철회** — 삭제 탭 되살아남/중복 탭 오해 우려. decisions.md 기록.)
- **M1 회귀 수정**: "한 브라우저 다계정"(A→B로그인편집→A재로그인)에서 A의 클라우드가 조용히 덮이는 데이터안전 회귀 → **로컬 소유자 마커**로 foreign이면 보호 모달. 오프라인 미동기 편집 유실 없음.
- **데이터 무손실·영속 스키마/공유 URL 무변경·마이그레이션 불필요.**

## 3. 티커 데이터 갱신 (PR #43)
- `scripts/tickerRefresh`(Yahoo 무키, `--delay=2000`) → **49 갱신 / 19 스킵 / 0 실패.** 예: SCHD 3.34→3.19%, QDVO 6.5→10.51%, JEPQ 8.2→10.53%, T 6.5→4.83%.
- **⚠ api:check 젬린 규명**: `api/og.js`·`api/ticker-html.js`가 **marketData를 인라인 번들**(트리쉐이킹 전이의존이라 grep으로 안 잡혔음) → **데이터 변경 시 `npm run api:bundle` 재생성 필수.** post-html/share-html은 무관(오해 정정).
- **후속 필요(§남은 것 2번)**: 스킵 19종은 프리셋 `initialPrice` 노후화로 ±50% 가드에 걸림 → 매달 계속 스킵됨.

## 4. FX 환율 위젯 + 공지 제거 (PR #44)
- **표시전용** 카드 위젯(교환 아이콘 + "원↔달러 환율" 타이틀 + "$1 ≈ 1,4XX원" + 기준일 + "**참고용·계산 미반영**" 상시). Main 좌패널 TickerCreation↔InvestmentSettings 사이.
- 서버 프록시 `api/fx.js`(무키 open.er-api.com → frankfurter.dev 폴백, 엣지캐시 `s-maxage=21600` → 트래픽 무관 upstream 소량 호출).
- **비영속**(저장/공유 URL 미포함)·**계산 무영향**·**손익색 없음**(환율은 P&L 아님, 값은 중립색·크롬만 accent).
- `ModelChangeNotice`("계산 방식이 업데이트되었습니다") **공지 제거** — 렌더/import만 해제. **컴포넌트 자체는 미삭제**(죽은 코드, 완전 삭제는 §남은 것 4번).

## 5. 적응형 개발 프로세스 (PR #45) ⭐ — 이번 세션의 방법론 산출물
LLM+RULES+SKILLS+CODES를 **트리아지로 선택적 구동 + 자기진화**하는 프로세스.
- **마스터**: `.claude/skills/dev-process/SKILL.md` — 트리아지 T0(대화)~T4(배포)+도메인, 루프, **§4 진화 메커니즘**(살아있는 문서: 더 나으면 고쳐라).
- **워크플로 스킬**: `ship`(배포) · `feature`(신기능) · `new-ticker-page` · `refresh-data`.
- **dev CLI**(`tools/dev/`, 순수 Node .mjs): `npm run tracks`(변경 기능별 분류) · `devstatus`(대시보드) · `predeploy`(격리 빌드 검증) · **`verify`**(tsc→test→api:bundle→api:check→build 게이트).
- `CLAUDE.md`에 "개발 프로세스(적응형)" 섹션 상시 로드.
- **다음 세션은 요청을 트리아지해 맞는 스킬/에이전트를 선택적으로 켜라.** 프로세스가 어긋나면 retro에 남기고 고쳐라.

## UI 폴리시 (#41·#44에 포함)
반응형 근본원인(목차 음수마진→ICB 폭주 490px) 수정, 히어로 크기 다이어트, 헤더-목차 갭(`--tk-header-h`), 모바일 목차 wrap, Apple풍 scroll-driven 애니(+blur 제거), 헤더 소형화면. **GA4 로컬 차단**(dev/localhost 미전송). **카피 규칙**(눈덩이/스노우볼 금지·앱이름 비연관) → decisions.md·에이전트 정의 반영.

## 남은 것 / 사용자 액션 (후속 — 배포 안 함)
1. **PR #46 머지 확인** — 지식 문서 1줄(pitfalls, 앱 무영향). GitHub에서 머지하거나 다음 세션 승인. (권한 분류기가 세션 스코프 밖으로 판단해 차단.)
2. **⭐ 19종 프리셋 가격 리베이스** — `QQQ·VUG·NOBL·CGDV·HDV·JNJ·ENB·AVGO·TXN·ADI·LRCX·KLAC·AMAT·TSM·ASML·VRT·SMH·AIQ·NVDA`의 `shared/constants/presets/*` `initialPrice`를 **신뢰 소스로 확인해 수기 갱신**(NVDA·AVGO 등은 2024 액면분할). 안 하면 매월 계속 스킵. **실가격 확인 없이 지어내지 말 것.** → `ticker-data-curator` / `refresh-data` 스킬.
3. **FX 위젯 실브라우저 확인** — 8프리셋 색감(teal accent 과하지/약하지)·좌패널 최소폭·스크린리더. (서버 없는 검증이라 미확인.)
4. **ModelChangeNotice 완전 삭제**(선택) — 지금은 렌더만 해제. `pages/Main/components/ModelChangeNotice/` + export + 테스트 삭제하면 죽은 코드 정리.
5. **에이전트 worktree 정리** — `.claude/worktrees/agent-*`(이제 gitignore). `git worktree remove` 필요(⚠ Windows 정션은 `cmd /c rmdir` 먼저, pitfalls.md 참고).
6. **`tools/dev/README.md`에 `verify` 반영**(저우선, docs-seo-writer).

## 리스크 / 주의 (이번 세션 학습)
- **PR 머지마다 권한 분류기 재확인 가능** — "하나씩 배포" 승인이 각 머지에서 재확인을 요구할 수 있음(#46 차단 사례). 다음 배포 착수 전 염두.
- **티커/marketData 변경 시 `api:bundle` 재생성 필수**(og/ticker-html이 marketData 인라인).
- **동시 worktree 에이전트 → 공유 node_modules에서 emotion 유실 가능** — 빌드 실패 시 `npm install`로 복구. 격리 검증은 worktree 독립 `npm ci`.
- **vitest는 `--exclude "**/.claude/**"`** — worktree 사본 중복 실행 유령 실패 방지(`npm run verify`에 내장).

## 배포 규칙 (기억)
- **main push = 프로덕션 배포.** 배포는 **사용자 승인 후 매번**([[ask-before-deploy]]). 서브에이전트 전언은 승인 아님.
- **표준 게이트 = `npm run verify`**(tsc→test→api:bundle→api:check→build). 배포는 **`ship` 스킬**(tracks로 선택 커밋 → predeploy 격리 검증 → PR → 머지).
- 머지 후 실 URL/Vercel status 확인. api/*는 유닛 통과가 실행을 증명 못 함.
