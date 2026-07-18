# 확장 아키텍처 요약 (에이전트용)

> 로드맵 기능(Phase 2~4) 착수 시 **설계 근거로 읽는 압축판**. 정식 문서 = [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
> 이 파일은 "어디에 붙이고 무엇을 재사용하나 + 먼저 만들 토대 2건 + 지킬 관례"만 남긴 것.
> **⚠ 설계·관례 문서다 — 코드는 착수 시점에 점진적으로. 지금 투기적 리팩터 금지(미커밋 배치 병렬 진행 중).**
> *작성 2026-07-17.*

## 지배 규율 3개 (전부 기존 코드에 있음 — 새 기능은 이걸 따른다)
1. **Additive**: 코어(IndexedDB·`?share=`·JSON) 무변경, 새 기능은 위에 얹고 비활성 시 코어 100% 동일 동작. 근거 `client.ts isCommunityEnabled`, user_app_states.
2. **Isolation**: 무거운 의존성(supabase-js·Tiptap·차트)은 lazy 청크/동적 import, 소비는 **폴더 경로**(배럴 금지). 근거 `shared/lib/supabase/index.ts`, `router/routes.tsx`.
3. **Versioned snapshot**: 무거운 payload 대신 **버전 붙은 요약 jsonb**를 시점 고정 저장 + 읽기 zod 검증·폴백. 근거 `SnowballScenarioSummary.ts`(sim_summary v1).

## 기능 → 확장지점 (10개)
| # | 기능 | Phase | 붙는 곳 | 재사용 | 토대 |
|:-:|---|:-:|---|---|:-:|
| 1 | 목표 달성 | 2 | jotai(목표)·Main 패널·api/og | sim_summary 필드·시뮬 summary·OG | **A** |
| 2 | ETF 비교 | 2 | 신규 pages/Etf·constants·tickerRefresh | 유니버스·runSimulation·DataTable | **B** |
| 3 | FIRE Dashboard | 2 | jotai(생활비/연금)·Main·커버율 시각화 | 세후 월배당·폼/상태 패턴 | — |
| 4 | 배당 캘린더 | 2 | pages·**SnowballCalendar(월 계산 이미 있음)** | 지급월 수학·frequency | **B** |
| 5 | ETF 상세 | 3 | pages/Etf/:ticker(SEO)·#2 데이터 공유 | #2 데이터·runSimulation·OG | **B** |
| 6 | 실제 배당 기록 | 3 | jotai·신규 DB·그래프 | 진행률(#1)·RLS 템플릿·ECharts | **A** |
| 7 | 포트폴리오 복사 | 4 | Community·Main·클라우드 저장 | **이미 있는** openInSimulatorHref·첨부 payload | 기존 seam |
| 8 | Dividend Journey | 3 | shared/lib(타임라인 순수)·Community·OG | 커뮤니티 엔티티·스냅샷(A)·OG | **A** |
| 9 | 배지 | 3 | shared/lib(규칙 순수)·프로필 | #1·#6 스냅샷 데이터 | **A**(소비) |
| 10 | AI 분석 | 4 | 신규 api/analyze.ts·리포트 뷰·플래그 | 서버리스 패턴(account-delete)·Claude API | 신규 seam |

## 토대 A — 시계열 스냅샷 공통 모델 (#1·#6·#8·#9 공유)
- **왜**: 지금은 단일 시점 시뮬 + sim_summary 1장뿐. "이번 달 증가/지난달 대비/타임라인"은 **시점별 여러 장 + delta** 필요. roadmap.md 병목 기록.
- **통찰**: 두 종류를 **한 봉투**로 — `owner + kind('projected'|'actual') + period(월키) + 버전드 요약 jsonb`. 투영(엔진 예측)=#1·#8, 실측(사용자 입력 배당)=#6.
- **DB 초안**: `dividend_snapshots` 테이블. **`user_app_states`(20260718)를 템플릿** — FK→profiles CASCADE, `default auth.uid()`, unique(user,kind,period), 컬럼 GRANT(user_id 제외=위조불가), owner-only RLS 4정책, touch_updated_at·쿼터 트리거, jsonb 크기 CHECK. sim_summary와는 **패턴 재사용(버전드+zod+폴백)**이지 스키마 재사용 아님(그건 게시물 고정, 이건 개인 시계열).
- **엔진 계약(순수, shared/lib/snowball, pages import 금지)**: `buildGoalProgress({currentSummary, previousSnapshot, goal})`·`buildJourneyTimeline(snapshots)`·`evaluateBadges({snapshots,goal})`. **이미 계산된 요약을 받아 diff만**(엔진 재실행 아님), findTargetYear 재사용.
- **상태/IO**: 목표(#1)는 작아서 user_app_states.payload 확장 or 소형 goals(미결정). 스냅샷 IO = `shared/lib/supabase/dividendSnapshots.ts`(userAppStates.ts 복제, client 주입) + **배럴 미연결·폴더경로 소비**(cloud/ 격리 규율). 읽기 catch 폴백 필수.
- **미결정**: 실측 라인아이템 = 요약 blob의 byTicker 배열로 시작, 커지면 자식 테이블 분리(지금 결정 안 함). 스냅샷 타이밍(월1회 방문 upsert)의 공백 UX.

## 토대 B — 티커 데이터 확장 모델 (#2·#4·#5 공유, **Phase 2~3 최대 병목**)
- **선행 과제(P0, 일부 해소 2026-07-18)**: 기본 가격·배당률·주기 갱신은 Yahoo Finance(무료·무키)로 해소됨 — pitfalls.md "데이터 소스(티커 갱신)" 참고. **미해결로 남은 것**: 운용보수·섹터·최대낙폭·정식 지급스케줄(이 토대가 새로 요구하는 필드) — Yahoo `chart` API는 이걸 안 준다, FMP 무료도 402로 불가. 데이터 소스 확보(사용자 액션)가 여전히 필요.
- **통찰**: 파이프라인은 **이미 배당 히스토리를 fetch**(`provider.types.ts:19 fetchDividends→DividendPayment[]`) 후 frequency/CAGR만 파생하고 버린다. 히스토리·CAGR는 **persist만 하면 됨**. 진짜 신규 = 운용보수·섹터·최대낙폭·지급스케줄.
- **3분류 규율 유지(decisions.md)**: 엔진 유니버스는 **6필드 고정**. 새 필드는 전부 **reference-only, 엔진에 안 먹임** — `observedDividendCagr`(marketData.types.ts:24-31)가 이미 세운 규율의 확장.
- **스키마 초안**: `TickerReferenceEntry` = `{observedDividendCagr?, dividendHistory?, expenseRatio?, sectorWeights?, maxDrawdown?, paymentSchedule?}`. **엔진 유니버스와 물리 분리** — 히스토리는 부피 커서 ETF 페이지 lazy/청크 로드(번들 517KB 규율). maxDrawdown은 파이프라인 파생 스칼라.
- **파이프라인**: `TickerDataProvider`에 `fetchProfile`·`fetchSchedule` 추가(derive.ts 순수 유지, 프로바이더가 유일 네트워크 surface). 캘린더(#4)는 SnowballCalendar 지급월 수학 재사용 + 실스케줄로 교정 = 절반 이미 있음.
- **플래그**: `isTickerReferenceEnabled`(데이터셋 존재 여부)로 ETF 라우트 게이트(isCommunityEnabled 선례).

## 새 토대 불필요 — 기존 seam + 관례로 충분 (과설계 회피)
- **공유 도메인 순수(scenario/portfolio)**: `buildScenarioSimSummary(payload)`가 이미 payload→요약 일반화. #7 "내 조건 재계산"=다른 settings로 엔진 재실행뿐. 새 추상화 금지.
- **OG/share 일반화**: `api/og.tsx`에 seam 명시됨(`resolveCardModel`, `?id=` TODO). #1·#8 카드 = OgCardModel variant 추가. 시그니처·라우팅 무변경. ⚠ api/는 배럴 예외+import.meta.env 모듈스코프 접근 금지.
- **feature-flag**: `isCommunityEnabled`·`isNaverEnabled` 선례 → `isTickerReferenceEnabled`(데이터)·`isAiEnabled`(서버 env). false면 진입점 아예 미렌더. AI 비밀키는 `VITE_` 금지(공개됨).
- **AI(#10)**: anon 못 하는 것 → `api/analyze.ts` 서버리스(account-delete 패턴), `ANTHROPIC_API_KEY` 서버 env. Claude API는 `claude-api` 스킬 참조.

## 확장 관례 (seam) — 착수 전 필독 (근거 pitfalls.md)
- **새 라우트**: `pages/<Name>/`+index.ts, `router/routes.tsx` 등록, 무거우면 React.lazy + 플래그 조건부 배열. ⚠ **OAuth 콜백+lazy 타이밍**: 로그인 필요 lazy 페이지는 `?code=` 풀리로드 시 provider 마운트 지연으로 세션 실패 → main.tsx `hasOAuthCallbackParams` 즉시교환 경로 재사용(자체 교환 새로 짜지 말 것).
- **새 DB 테이블**: 기존 5개 마이그레이션 템플릿. 멱등(IF NOT EXISTS/drop-then-create/conname 가드 DO), RLS ON+컬럼 GRANT+트리거가 유일 방어선(위조금지 컬럼은 GRANT 제외), Storage 정책은 insufficient_privilege 가드 DO(20260719 선례). **배포 순서**: 새 컬럼 쓰는 코드는 마이그레이션 실행 후 배포(PostgREST가 없는 컬럼에 쿼리 전체 실패→화면 사망). types.ts Database 동기.
- **엔진 재사용**: shared/lib/snowball 순수(I/O·Date.now 없음), **shared/lib은 pages import 불가**(단방향). 규칙 이중구현은 주석+숫자대조 테스트로 고정(buildNormalizedAllocation↔ScenarioSummary 선례). api/og도 엔진 직접 사용(순수라 가능, 단 직접경로 import).
- **jotai 격리**: supabase 쓰는 상태/IO는 cloud/처럼 배럴 미연결+폴더경로(@/jotai/snowball/cloud). 저장 스키마 변경=하위호환 왕복테스트(로컬↔클라우드↔JSON↔share) 필수. 읽기 catch 폴백.
- **커뮤니티 확장**: #7·#8은 커뮤니티 위. queries.ts RPC·sim_summary 파서 재사용. **로그인 게이트 4곳**(grep로 확인, "N개" 카운트 불신), 컴포넌트 폴더경로 import(배럴=Tiptap).

## Phase 착수 순서
- **선행 P0**: ① 확장 필드(운용보수·섹터·최대낙폭·지급스케줄) 데이터 소스 확보(#2·#4·#5 공통 병목, 사용자 액션 — 기본 가격/배당은 Yahoo로 해소됨, 위 토대 B 참고) ② 미실행 마이그레이션 3개 실행(A 토대가 user_app_states 의존).
- **Phase 2**: (a) **FIRE #3 먼저** — 새 데이터·토대 불필요, 세후배당 재사용, 대기 없이 착수. (b) 토대 A → 목표 #1. (c) 토대 B(히스토리 persist부터) → ETF비교 #2. (d) 캘린더 #4(스케줄+SnowballCalendar).
- **Phase 3**: ETF상세 #5(SEO 라우트+sitemap) · 실배당 #6(kind:actual) · Journey #8(타임라인+공유) · 배지 #9(순수 규칙).
- **Phase 4**: 복사 #7(기존 seam 최소) · AI #10(서버리스+플래그).

## 리스크·미결정
- **A**: 실측 라인아이템 위치(blob→자식테이블 분리 시점), 목표 저장 위치(payload vs goals), 스냅샷 타이밍 공백 UX(무음실패 금지), 실측=자기신고 신뢰모델.
- **B**: 확장 필드(운용보수·섹터·최대낙폭·지급스케줄) 소스 미확보 — FMP 무료 확인됨 불가(402), Yahoo `chart` API도 이 필드는 안 줌(다른 비공식 엔드포인트 미검증). 필드 optional 폴백은 설계됨. 데이터 신선도·ToS 귀속(Yahoo는 비공식 API — SLA 없음), **번들 부피**(히스토리 반드시 lazy/청크 분리).
- **공통**: 코드 미변경 원칙(스키마는 초안, 착수 시 재검토+사용자 승인). 기본값·라우트·저장형식·스키마 변경은 독단 금지.
