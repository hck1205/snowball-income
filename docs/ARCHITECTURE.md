# 확장 아키텍처 설계 (Architecture for the Roadmap)

> **목적** — [ROADMAP.md](ROADMAP.md)의 10개 미래 기능(Phase 2~4)이 **어느 레이어·어느 파일 근처에 붙는지**,
> **무엇을 재사용하는지**, 그리고 **먼저 설계할 값어치가 있는 공통 토대**를 정의한다.
> 각 에이전트가 로드맵 기능에 착수할 때 이 문서를 설계 근거로 읽는다.
>
> **⚠ 이 문서는 설계·관례 문서다. 지금 시점에 코드는 한 줄도 바꾸지 않는다.**
> 미커밋 대규모 배치가 병렬로 도는 중이라 투기적 리팩터는 충돌·리스크만 키운다. 실제 구조 변경은
> "현재 배치를 커밋·정리한 뒤 기능 착수 시점에 점진적으로"가 원칙이다. 대개편 금지.
>
> **과설계 금지 원칙** — 기존 레이어링(폴더 단위·`index.ts`·계층 분리·supabase 청크 격리·feature-flag)은
> 이미 상당히 확장적이다. 이 문서는 **여러 로드맵 기능이 실제로 공유하는 토대 2건만** 초안으로 설계하고,
> 나머지는 "이미 존재하는 seam을 어떻게 쓰는가"의 **관례 문서화**로 남긴다. 값어치 없는 추상화 레이어를
> 미리 만들지 않는다.
>
> *작성: 2026-07-17 · 근거 문서: [.claude/knowledge/roadmap.md](../.claude/knowledge/roadmap.md),
> [decisions.md](../.claude/knowledge/decisions.md), [pitfalls.md](../.claude/knowledge/pitfalls.md),
> [project-map.md](../.claude/knowledge/project-map.md)*

---

## 0. 현재 아키텍처 — 확장 관점 레이어 지도

이 앱은 **프론트엔드 전용 코어(백엔드 없이 정적 배포) + 그 위에 덧붙는 Supabase 계층**이라는
이중 구조다. 커뮤니티/클라우드 저장/OG 카드가 전부 "코어를 죽이지 않고 얹는" 방식으로 들어와 있다.
이 "덧붙이는" 규율이 로드맵 확장의 핵심 자산이다.

| 레이어 | 위치 | 확장 시 성격 |
|--------|------|--------------|
| 계산 엔진 (순수) | `shared/lib/snowball/` — `SnowballSimulation`·`SnowballScenarioSummary`·`SnowballCalendar`·`SnowballSummary`·`SnowballCapitalGains` | **재사용 최다.** 순수 함수라 서버(`api/og.tsx`)·상태·페이지 어디서든 호출. `pages/` import 금지(단방향). |
| 전역 상태 | `jotai/snowball/{atoms,selectors,persistence,cloud}` | 새 입력값·시나리오·저장 스키마가 붙는 곳. `cloud/`는 supabase 격리를 위해 배럴 미연결(폴더 경로 소비). |
| 페이지 | `pages/Main/`, `pages/Community/` | 조립 레이어. 새 라우트 = 새 페이지 폴더 + `router/routes.tsx` 등록(대개 lazy 청크). |
| 재사용 UI | `components/common/*` | Card·DataTable·InputField·Tabs·Banner… 새 기능 화면이 조립해 쓴다. |
| 도메인 UI | `components/*`, `components/community/*` | 기능별 컴포넌트. community는 배럴이 Tiptap을 끌어오므로 **폴더 경로 import**. |
| 티커/시장 데이터 | `shared/constants/presets/`(큐레이션), `shared/constants/marketData/`(생성물), `utils/TickerParser/`(상장목록 생성) | ETF 기능군의 데이터 원천. 3분류 규율(관측/가정/파생)이 지배. |
| 데이터 파이프라인 | `scripts/tickerRefresh/` — FMP 프로바이더 + 순수 `derive` | 크론성 갱신. 프로바이더 1개 교체로 전 파이프라인 오프라인 테스트. |
| Supabase 데이터 레이어 | `shared/lib/supabase/` (배럴 격리, SDK 동적 import) | 커뮤니티·클라우드 저장 IO. `isCommunityEnabled` 플래그로 전면 게이트. |
| 커뮤니티 순수 로직 | `shared/lib/community/` | 닉네임 검증·표시·탈퇴 분기 등 순수. IO 없는 부분. |
| 서버리스 (소스) | `server/handlers/` — `Og`(동적 OG), `AccountDelete`(SERVICE_ROLE), `NaverAuth`, `PostHtml`, `ShareHtml`, `Sitemap` | anon 키로 못 하는 것(auth.users 조작·비밀키·SSR 이미지). 앱 배럴 우회는 규약이 아니라 **런타임 제약**(모듈 스코프 `import.meta.env` 금지). |
| 서버리스 (배포 산출물) | `api/*.js` — **커밋되는 생성물**, 직접 편집 금지 | `tools/apiBundle` 이 esbuild 로 번들. Vercel 은 `api/*` 를 번들하지 않고 네이티브 ESM 으로 실행하므로 배럴·확장자 생략이 전부 불법이다. `npm run build` 가 재생성해 **바이트 대조**한다(`npm run api:bundle` 로 갱신). |
| DB 스키마 | `supabase/migrations/*.sql` | 멱등 마이그레이션. RLS·컬럼 GRANT·트리거가 유일한 방어선. |
| 라우팅 | `router/routes.tsx` | `AnalyticsLayout` → 라우트. 커뮤니티 라우트는 `isCommunityEnabled` 게이트 + 전부 lazy. |

**확장을 지탱하는 3대 규율 (전부 이미 코드에 있다 — 새 기능은 이것을 따른다):**

1. **덧붙이는 계층 (additive).** 코어(IndexedDB·`?share=`·JSON)는 무변경, 새 기능은 그 위에 얹고
   비활성 시(env·데이터 없음) 코어가 100% 동일 동작. 근거: `client.ts` `isCommunityEnabled`,
   `user_app_states`(추가 계층).
2. **격리 (isolation).** 무거운 의존성(supabase-js·Tiptap·dompurify)은 lazy 청크/동적 import로만 로드,
   초기 번들 보호. 소비는 배럴이 아니라 **폴더 경로**로. 근거: `shared/lib/supabase/index.ts` 주의문,
   `router/routes.tsx` lazy.
3. **게시 시점 고정 + 버전드 요약 (versioned snapshot).** 무거운 원본(payload) 대신 **버전 붙은
   요약 jsonb**를 게시 시점 1회 계산해 저장, 읽기 측이 zod로 검증·폴백. 근거:
   `SnowballScenarioSummary.ts`(`sim_summary` v1).

---

## 1. 기능 → 확장지점 매핑

| # | 기능 | Phase | 붙는 레이어·파일 근처 | 재사용 | 신규 필요 | 공통 토대 |
|:-:|------|:-:|----------------------|--------|-----------|:--------:|
| 1 | 목표 달성 시스템 | 2 | `jotai/snowball`(목표 입력·파생) · `pages/Main` 패널 · `api/og.tsx`(공유 카드) | 시뮬 결과(`summary`), `sim_summary` 필드(`targetMonthlyDividend`·`targetReachedInYears`), OG 인프라 | 목표 저장, **시점별 스냅샷**(증감/지난달 대비), OG 템플릿 변형 | **A** |
| 2 | ETF 비교 | 2 | 신규 `pages/Etf` · `shared/constants`(참조 데이터) · `scripts/tickerRefresh` | 티커 유니버스, `runSimulation`(비교용 재계산), DataTable | 배당 CAGR·운용보수·섹터·최대낙폭·**배당 히스토리** 데이터 소스 | **B** |
| 3 | FIRE Dashboard | 2 | `jotai/snowball`(생활비·연금 입력) · `pages/Main` 또는 신규 탭 · 커버율 시각화 | 시뮬 세후 월배당(`summary.finalMonthlyAverageDividend`), 폼·상태 패턴 | 목표 생활비/연금/기타수입 입력값, 커버율 순수 계산 | — |
| 4 | 배당 캘린더 | 2 | 신규 `pages/Calendar` 또는 Main 패널 · `shared/lib/snowball/SnowballCalendar`(이미 월 계산) | **`SnowballCalendar`의 지급월 수학**, 티커 frequency | 배당락일/지급일 **스케줄 데이터**, 예상 입금 집계 | **B** |
| 5 | ETF 상세 페이지 | 3 | 신규 `pages/Etf/:ticker` (SEO 정적/SSG 지향) · #2와 데이터 공유 | #2 참조 데이터 전부, `runSimulation`, OG 카드 | 티커별 상세 뷰, 라우트, sitemap 항목 | **B** |
| 6 | 실제 배당 기록 | 3 | 신규 `jotai`(입력) · 신규 DB 테이블 · `pages`(그래프) | 목표 대비 진행률(#1), ECharts, 클라우드 저장 RLS 템플릿 | 실수령 배당 **시점별 원장**, 월/연 집계 | **A** |
| 7 | 포트폴리오 복사 | 4 | `pages/Community`(시나리오 상세) · `pages/Main`(열기) · 클라우드 저장 | **이미 있는** `openInSimulatorHref`(useScenarioDetail), 글쓰기 첨부 payload, 클라우드 저장 | "내 조건으로 재계산" = 다른 settings로 엔진 재실행(신규 최소) | — (기존 seam) |
| 8 | Dividend Journey | 3 | `shared/lib/snowball`(타임라인 순수) · `pages/Community`(공유·댓글) · `api/og.tsx` | 커뮤니티 엔티티(좋아요·댓글), **시점별 스냅샷**(A), OG | 연도별 성장 타임라인 뷰, 공유 카드 | **A** |
| 9 | 배지 시스템 | 3 | `shared/lib`(배지 규칙 순수) · `jotai`/프로필 · 커뮤니티 프로필 표시 | 실배당 기록(#6)·목표(#1)의 스냅샷 데이터, 프로필 페이지 | 배지 판정 순수 규칙, 획득 저장·표시 | **A**(소비) |
| 10 | AI 포트폴리오 분석 | 4 | 신규 `api/analyze.ts`(Claude API, 서버) · `pages`(리포트 뷰) · 플래그 | 서버리스 패턴(`account-delete.ts`), 포트폴리오 payload, Claude API | LLM 프롬프트·점수 스키마, `ANTHROPIC_API_KEY` 서버 경로, `isAiEnabled` 플래그 | — (신규 seam) |

**읽는 법**: "공통 토대 A" = §2 시계열 스냅샷 모델을 공유. "공통 토대 B" = §3 티커 데이터 확장 모델을 공유.
"—" 인 기능은 새 공통 토대가 필요 없고 **기존 seam + 관례**(§4)로 충분하다.

---

## 2. 공통 토대 A — 시계열 스냅샷 공통 모델

> **공유 기능: #1 목표 달성(증감/지난달 대비) · #6 실제 배당 기록 · #8 Dividend Journey · #9 배지(소비).**
> 지금은 **단일 시점 시뮬**(입력 → 한 번 계산)만 있고 `sim_summary`도 **게시 시점 1장**뿐이다.
> 위 기능들은 전부 **"시점별로 저장된 여러 장의 요약"과 그 사이의 차이(delta)**를 요구한다.
> 한 번 설계하면 넷이 공유한다 → 먼저 설계할 값어치가 있다(roadmap.md 병목 기록 #1).

### 2.1 핵심 통찰 — 두 종류의 시계열을 하나의 봉투로

시계열에는 성격이 다른 둘이 섞여 있다:

- **투영(projected) 스냅샷** — 목표 진행(#1)·Journey(#8)가 쓴다. "오늘 시점에 시뮬이 예측한 월배당"을
  주기적으로 다시 찍어 **월 대비 증감**을 낸다. 내용물은 `sim_summary`와 사실상 같은 요약 blob.
- **실측(actual) 원장** — 실제 배당 기록(#6)이 쓴다. 사용자가 "7월 SCHD $54" 를 입력한 **관측값**.
  월별 티커 라인아이템의 집계.

둘은 **저장 봉투(envelope)를 공유**할 수 있다: `owner + kind(투영/실측) + period(월 키) + 버전드 요약 jsonb`.
`kind` 판별자로 한 테이블에서 다룬다. 내용물 스키마만 `kind`별로 다르되, **읽기 검증·RLS·GRANT·쿼터·멱등
마이그레이션 규율은 100% 공유**한다.

### 2.2 DB 스키마 초안 — `dividend_snapshots`

`user_app_states`(20260718)를 **템플릿으로** 삼는다. 형태·RLS·GRANT·쿼터·멱등성 패턴을 그대로 따른다.

```sql
-- supabase/migrations/2026XXXX_dividend_snapshots.sql (초안 — 미실행)
create table if not exists public.dividend_snapshots (
  id          uuid        primary key default gen_random_uuid(),
  -- user_app_states·scenarios와 같은 이유로 FK는 public.profiles (auth.users 삭제 → CASCADE).
  -- default auth.uid() + 컬럼 GRANT 제외 = 위조 불가.
  user_id     uuid        not null default auth.uid() references public.profiles (id) on delete cascade,
  -- 투영(엔진 예측 요약) vs 실측(사용자 입력 배당). 내용물 스키마가 갈리는 판별자.
  kind        text        not null check (kind in ('projected', 'actual')),
  -- 월 키 (YYYY-MM-01 정규화). 같은 달에 두 번 찍으면 upsert (아래 unique).
  period      date        not null,
  -- 버전드 요약 jsonb. sim_summary와 같은 규율: version 필드 + 읽기 측 zod 검증 + 크기 상한.
  -- projected: {version, finalMonthlyDividend, targetMonthlyDividend, targetReachedInYears, ...}
  -- actual:    {version, month, byTicker:[{ticker, amount}], totalReceived, ...}
  summary     jsonb       not null check (jsonb_typeof(summary) = 'object' and pg_column_size(summary) <= 4096),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- (user, kind, period) 유일 — 한 달·한 종류당 한 장(재기록은 update). 증감 계산은 연속 period 차이.
create unique index if not exists dividend_snapshots_period_one
  on public.dividend_snapshots (user_id, kind, period);
create index if not exists dividend_snapshots_user_idx
  on public.dividend_snapshots (user_id, kind, period desc);

-- updated_at 트리거는 community의 public.touch_updated_at() 재사용.
-- 쿼터 트리거(enforce_..._quota 패턴): 예) 사용자당 스냅샷 상한(수백 장 = 수십 년치)으로 남용 방지.

-- 컬럼 GRANT (authenticated only — user_id/created_at/updated_at 제외 = 위조 불가):
grant select on public.dividend_snapshots to authenticated;
grant insert (kind, period, summary) on public.dividend_snapshots to authenticated;
grant update (summary)               on public.dividend_snapshots to authenticated;
grant delete on public.dividend_snapshots to authenticated;

-- RLS owner-only 4정책 (user_app_states와 동일 형태 — 공개 개념 없음).
```

**설계 결정·근거:**

- **`sim_summary`와의 관계**: 봉투(버전드 jsonb + 읽기 zod 검증 + 폴백)는 `sim_summary`와 **같은 계약 패턴**.
  단 `sim_summary`는 **커뮤니티 게시물에 고정**(scenarios 컬럼)이고, `dividend_snapshots`는 **개인 시계열**
  (user_app_states 계열, 공개 개념 없음)이다. 스키마 재사용이 아니라 **패턴 재사용**.
- **투영 스냅샷을 언제 찍나**: 사용자가 앱을 열 때(월 1회 상한, `period` upsert)나 명시적 "목표 갱신" 시.
  자동저장(`user_app_states`)과 별개 — 자동저장은 워크스페이스 미러, 스냅샷은 **시점 고정 기록**이다.
- **왜 별도 테이블(payload에 안 넣나)**: `user_app_states.payload`는 "현재 워크스페이스"라 매번 덮어써진다.
  시계열은 **덮어쓰면 안 되는 과거**라 행 단위로 쌓아야 한다.
- **실측 원장의 라인아이템**: 초안은 월 요약 blob 안에 `byTicker` 배열을 넣는다(월당 티커 수십 개 = 수 KB).
  라인아이템 CRUD·집계 쿼리가 커지면 그때 자식 테이블(`dividend_entries`)로 분리 — **지금은 분리하지 않는다**
  (과설계 회피, §6 리스크에 미결정으로 기록).

### 2.3 상태·엔진 계약 초안

- **엔진(순수, `shared/lib/snowball/`)** — 새 순수 함수. `pages/` import 금지 규율 유지.
  - `buildGoalProgress({ currentSummary, previousSnapshot, goal })` → `{ achievedPercent, monthOverMonthDelta, projectedReachDate }`.
    **이미 계산된 요약**을 받아 차이만 낸다(엔진 재실행 아님). `findTargetYear`(SnowballSummary) 재사용.
  - `buildJourneyTimeline(snapshots[])` → 연도별 성장 포인트. #8·#9가 소비.
  - 배지(#9): `evaluateBadges({ snapshots, goal })` → 획득 배지 목록. **순수 규칙**(실배당·목표에 의존).
- **상태(`jotai/snowball/`)**:
  - 목표(#1)는 작은 값(목표 월배당 등)이라 **`user_app_states.payload` 확장** 또는 소형 `goals` 저장으로 충분.
    새 테이블을 성급히 만들지 말 것(§6 미결정).
  - 스냅샷 IO는 `shared/lib/supabase/` 에 새 파일(`dividendSnapshots.ts`, client 주입 IO 패턴 = `userAppStates.ts` 복제).
    `jotai/snowball/cloud/` 처럼 **배럴 미연결 + 폴더 경로 소비**로 supabase 격리 규율 유지.

### 2.4 하위 호환

전부 **추가 계층**이다. 비로그인·데이터 없음이면 목표 패널은 "현재 달성률"만 보이고 증감/Journey는 숨긴다
(`sim_summary` NULL 폴백과 같은 철학). 마이그레이션 미실행 시 select가 죽지 않도록 **읽기 경로는 catch 폴백**
(pitfalls: user_app_states는 앱을 안 죽이지만 pullAutosave만 try/catch 없음 → 새 IO는 반드시 감쌀 것).

---

## 3. 공통 토대 B — 티커 데이터 확장 모델

> **공유 기능: #2 ETF 비교 · #4 배당 캘린더 · #5 ETF 상세.** roadmap.md가 **Phase 2~3 최대 병목**으로 명시.
> 현재 티커 데이터(`initialPrice`·`dividendYield`·`dividendGrowth`·`expectedTotalReturn`·`frequency`)는
> **엔진 입력 6필드뿐**이라 CAGR·운용보수·섹터·최대낙폭·배당 히스토리·지급 스케줄이 없다.
> **선행 과제: 데이터 소스(FMP 유료 티어 등) 확보.** 이게 없으면 #2·#4·#5는 착수 불가.

### 3.1 핵심 통찰 — 파이프라인은 이미 히스토리를 받아온다 (버리고 있을 뿐)

`scripts/tickerRefresh`의 프로바이더는 **이미 `fetchDividends → DividendPayment[]`(전체 배당 지급 이력)을
받아온다**(`provider.types.ts:19`). 지금은 그걸로 frequency와 `observedDividendCagr`만 파생한 뒤 **버린다**.
즉 배당 히스토리·CAGR는 **새 소스가 아니라 이미 흐르는 데이터를 persist만 하면** 얻는다. 진짜 신규는
운용보수·섹터 비중·최대낙폭·지급 스케줄(배당락/지급일)뿐이다.

### 3.2 3분류 규율을 확장에 그대로 적용 (decisions.md 존중)

핵심 제약: **엔진 유니버스는 6필드로 고정**한다. 새 데이터는 전부 **참조 전용(reference-only)**이며
엔진에 먹이지 않는다 — `observedDividendCagr`가 이미 확립한 규율(`marketData.types.ts:24-31`,
"엔진이 절대 읽지 않는 관측값")의 확장이다.

- **관측 사실 (파이프라인이 덮어씀)**: price·yield·frequency (현행) + **신규 참조 필드**(아래).
- **사람의 가정 (자동화 금지)**: `expectedTotalReturn`·`name` — 절대 파이프라인이 못 건드림.
- **파생 (계산)**: `dividendGrowth = etr − dy` — 스냅샷에 안 씀.

### 3.3 스키마 초안 — 참조 데이터셋을 엔진 유니버스와 분리

```ts
// shared/constants/marketData/marketData.types.ts 의 MarketDataSnapshotEntry 확장 (초안),
// 또는 별도 shared/constants/tickerReference/ 데이터셋. 전부 reference-only.
type TickerReferenceEntry = {
  observedDividendCagr?: number;                          // 이미 존재
  dividendHistory?: DividendPayment[];                    // 이미 fetch — persist만 (#2·#4·#5)
  expenseRatio?: number;                                  // 신규: FMP profile/etf-info (#2·#5)
  sectorWeights?: { sector: string; weight: number }[];   // 신규: FMP etf-sector-weightings (#2·#5)
  maxDrawdown?: number;                                    // 신규: 가격 시계열에서 파생 (#2)
  paymentSchedule?: { exDate: string; payDate: string; amount?: number }[]; // 신규: 배당 캘린더 (#4·#5)
};
```

**설계 결정·근거:**

- **엔진 유니버스와 물리적 분리**: 히스토리·스케줄은 **부피가 크다**(티커당 수십~수백 지급 이력).
  현재 유니버스(`DIVIDEND_UNIVERSE`)는 작고 초기 번들에 들어가도 되지만, 참조 데이터셋은 **ETF 상세/비교
  페이지에서만 lazy 로드**해야 한다(supabase 격리와 같은 번들 규율). → 참조 데이터는 **티커별/청크별 생성물**로
  분리하고, 엔진 유니버스는 지금처럼 가볍게 유지.
- **파이프라인 확장**: `TickerDataProvider`에 `fetchProfile`·`fetchSchedule` 추가(현행 `fetchQuote`·`fetchDividends`
  옆). `derive.ts`는 순수 유지 — 프로바이더 1개만 네트워크 surface라 픽스처로 전 파이프라인 오프라인 테스트
  가능한 현 구조 보존. 생성 결과는 `marketData.generated.json` 계열에 추가하거나 별도 생성 JSON.
- **캘린더(#4)는 절반이 이미 있다**: `SnowballCalendar.ts`의 지급월 수학(`isPayoutMonth`·달력 변환)을 재사용하고,
  `paymentSchedule` 실데이터로 예측을 실측 날짜로 교정한다. 완전 신규가 아니다.
- **최대낙폭(maxDrawdown)**: FMP 가격 시계열에서 **파이프라인이 파생**(derive 순수 함수). 원본 시계열은
  부피가 커 저장하지 않고 파생 스칼라만 저장.

### 3.4 데이터 소스·플래그

- **소스**: `scripts/tickerRefresh/provider/fmpProvider.ts`가 이미 FMP를 쓴다. 확장 필드(profile·sector·schedule)는
  FMP 유료 티어 엔드포인트. **유료 티어 확보가 선행**(사용자 액션 — §6 리스크).
- **feature-flag**: ETF 기능군은 **참조 데이터 존재 여부로 게이트**한다 — `isCommunityEnabled`(env) 선례를 따라
  `isTickerReferenceEnabled`(데이터셋이 채워졌나) 도입. 데이터 없으면 ETF 라우트/진입점을 아예 렌더하지 않고
  코어는 무영향(additive 규율).

---

## 4. 검토 항목 — 새 토대 대신 "기존 seam + 관례"로 충분한 것들

> 아래는 로드맵 기능이 건드리지만 **새 공통 추상화를 만들 값어치는 없는** 것들이다.
> 이미 있는 seam을 쓰는 관례로 문서화한다(과설계 회피).

### 4.1 공유 도메인 순수 레이어 (scenario/portfolio) — 이미 일반화돼 있음

`buildScenarioSimSummary(payload)`(`SnowballScenarioSummary.ts`)가 이미 **payload(unknown) → 요약**을
일반화한 순수 경로다. 포트폴리오 복사(#7)의 "내 조건으로 재계산"은 **같은 payload에 다른 `investmentSettings`를
얹어 엔진을 재실행**하는 것뿐 — 새 레이어가 아니라 기존 함수 재사용이다. **권고: 새 추상화 만들지 말 것.**

### 4.2 OG/share 일반화 — seam은 이미 표시됨, 채우기만

`api/og.tsx`는 확장 지점을 **명시적으로 주석**해 뒀다(`resolveCardModel` 한 곳, `?id=` 미지원 TODO).
목표 공유 카드(#1)·Journey 카드(#8)는 **새 OG 템플릿 변형**이지 새 인프라가 아니다. `pages/Main/utils/ogCard.ts`의
`OgCardModel`에 variant를 더하는 방식. **권고: 카드 모델에 variant 추가, 함수 시그니처·라우팅은 그대로.**
⚠ `api/`는 앱 배럴 규칙 예외(Vercel 규약) + `import.meta.env` 모듈 스코프 접근 금지(og.tsx 상단 주석) 준수.

### 4.3 feature-flag 패턴 일반화 — 선례 2개를 규약으로

`isCommunityEnabled`(env 유무)·`isNaverEnabled`(env + 상위 플래그)가 선례. 로드맵 기능은 이 규약을 따른다:

- **데이터 게이트**: `isTickerReferenceEnabled`(ETF #2·#4·#5), 데이터셋 존재 여부.
- **API 게이트**: `isAiEnabled`(#10), `ANTHROPIC_API_KEY` 서버 env 유무(클라 노출 금지 — `VITE_` 접두사 쓰지 말 것).
- **규칙**: 플래그 false면 **진입점(라우트·버튼·탭)을 아예 렌더하지 않는다**. 코어는 무영향. 근거: `routes.tsx`.

### 4.4 AI 분석(#10) — 서버리스 seam 재사용

Claude API 호출은 **anon 키로 못 하는 것**(비밀키 필요)이라 `api/account-delete.ts`와 같은 **Vercel 서버리스 함수**
(`api/analyze.ts` 신규)로 간다. 비밀키는 서버 env(`ANTHROPIC_API_KEY`), 클라는 `/api/analyze`를 fetch.
Claude API 사용법은 관련 스킬(`claude-api`) 참조. **새 공통 토대 아님 — 기존 서버리스 패턴 인스턴스.**

---

## 5. 확장 관례 (seam) — 새 기능 착수 시 지킬 규칙

> 각 항목은 "겪어봐야 아는 함정"([pitfalls.md](../.claude/knowledge/pitfalls.md))에 근거한다. 착수 전 필독.

### 5.1 새 페이지/라우트 추가

1. `pages/<Name>/` 폴더 + `index.ts`(폴더 단위 import 규율). 조립만 — 로직은 훅/엔진으로.
2. `router/routes.tsx`에 등록. 무거운 의존성(supabase·Tiptap·차트 라이브러리)을 쓰면 **`React.lazy` 청크**로
   (커뮤니티 라우트 선례). 데이터/기능 게이트가 있으면 배열 조건부(`isXEnabled ? [...] : []`).
3. **⚠ OAuth 콜백 + lazy 타이밍 함정**(pitfalls): 로그인이 필요한 lazy 페이지는 `?code=` 풀 리로드 시
   provider 마운트가 늦어 세션 확립이 실패할 수 있다. 엔트리(`main.tsx`)의 `hasOAuthCallbackParams` 감지 →
   즉시 교환 경로를 이미 깔아뒀으니 **새 인증 페이지는 그 경로를 재사용**하고 자체 교환을 새로 짜지 말 것.
4. SEO 페이지(ETF 상세 #5)는 sitemap·`llms.txt`·메타태그 갱신 필요 → `docs-seo-writer` 담당.

### 5.2 새 DB 테이블 마이그레이션

`supabase/migrations/`의 **기존 5개 파일을 템플릿**으로. 반드시 지킬 것:

- **멱등**: `create table if not exists`, `create index if not exists`, 트리거 `drop ... if exists` 후 create,
  함수 `create or replace`, 제약은 `pg_constraint conname` 가드 DO 블록.
- **RLS ON + 컬럼 GRANT + 트리거**가 유일한 방어선(anon 키는 공개). 정책만으로 카운터·소유권을 못 막는다 —
  위조 금지 컬럼은 **GRANT에서 제외**(`user_id`·`updated_at` 등).
- **Storage 정책은 `insufficient_privilege` 가드 DO 블록**으로 감싼다 — `storage.objects`는 다른 롤 소유라
  `db push` 전체가 깨진다(20260719 선례). 실패 시 대시보드 수동이 정본.
- **⚠ 배포 순서**(pitfalls·decisions): 새 컬럼/테이블을 **select·insert 하는 코드는 마이그레이션 실행 후에만
  배포**. PostgREST는 없는 컬럼 요청에 쿼리 전체를 실패시켜 화면이 통째로 죽는다. 추가 계층(user_app_states류)은
  앱을 안 죽이지만 로그인 사용자에 '저장 실패' 배지·계측 스팸을 유발 → 그래도 순서 준수.
- `shared/lib/supabase/types.ts`의 `Database` 타입과 **동기**.

### 5.3 엔진 순수함수 재사용 계약

- `shared/lib/snowball/`는 **순수**(같은 입력 → 같은 출력, I/O·Date.now 없음). 새 계산은 여기 순수 함수로.
- **`shared/lib`은 `pages/`를 import할 수 없다**(단방향). 규칙이 양쪽에 필요하면(예: 가중치 정규화) 주석 단서 +
  **숫자 대조 테스트**로 고정(`buildNormalizedAllocation` ↔ `SnowballScenarioSummary` 선례).
- 서버(`api/og.tsx`)도 엔진을 직접 쓴다 — 순수라서 가능. 단 `api/`에서 앱 배럴 import 시 `import.meta.env`
  모듈 평가가 Node에서 터진다 → 필요한 파일만 **직접 경로** import.

### 5.4 Jotai 상태·영속 격리

- supabase를 쓰는 상태/IO는 `jotai/snowball/cloud/`처럼 **배럴 미연결 + 폴더 경로 소비**(`@/jotai/snowball/cloud`).
  초기 번들에 SDK가 새지 않게 하는 규율. 새 시계열 IO(§2.3)도 같은 격리.
- 저장 페이로드 스키마 변경은 **하위 호환 왕복 테스트**(로컬↔클라우드↔JSON↔`?share=`) 필수 — 저장 데이터·공유
  URL은 사용자 자산이다.
- IO 읽기 경로는 **catch 폴백** 필수(마이그레이션 미실행·오프라인에서 앱이 안 죽게).

### 5.5 커뮤니티 엔티티 확장

- Journey(#8)·포트폴리오 복사(#7)는 커뮤니티 위에 얹힌다. 좋아요·댓글·조회수 RPC(`queries.ts`)와 sim_summary
  파서(`SnowballScenarioSummary`)를 재사용.
- **로그인 게이트는 4곳**(LoginModal·MySavePanel·CommunityWritePage·CommunityProfilePage) — 새 게이트 추가 시
  `SocialLoginButton` + 공유 카피로 일관. "N개 게이트" 카운트를 믿지 말고 grep으로 확인(pitfalls 반복 사고).
- 커뮤니티 컴포넌트는 **폴더 경로 import**(`@/components/community/X`) — 배럴은 Tiptap을 끌어온다.

---

## 6. Phase별 착수 순서 (설계·구현)

> roadmap.md의 Phase 2/3/4와 우선순위(★)를 반영. **핵심 선행 과제 2건이 순서를 지배한다.**

### 선행 과제 (Phase 2 착수 전)

- **P0 · 티커 데이터 소스 확보** — FMP 유료 티어(또는 대체) 계약. **#2·#4(Phase 2)·#5(Phase 3)의 공통 병목.**
  이게 없으면 ETF·캘린더 3종이 전부 막힌다. **사용자 액션 필요.**
- **P0 · 미실행 마이그레이션 3개 실행** — sim_summary·user_app_states·profile(project-map.md 경고). 시계열
  토대(A)가 user_app_states를 템플릿·의존으로 삼으므로 이것부터 실배포.

### Phase 2

1. **FIRE Dashboard (#3)** — **가장 싼 Phase 2 승리.** 새 데이터·새 토대 **불필요**. 시뮬 세후 월배당 재사용 +
   생활비/연금 입력값(폼·상태 확장) + 커버율 순수 계산. 토대 대기 없이 **먼저 착수 가능.**
2. **공통 토대 A 설계·구현 (시계열 스냅샷)** → 그 위에 **목표 달성 시스템 (#1)**. OG 공유 카드는 §4.2 variant.
3. **공통 토대 B 설계·구현 (티커 확장)** — P0 데이터 소스 확보 후. 먼저 **배당 히스토리 persist**(이미 fetch 중)로
   빠른 진전, 그 위에 **ETF 비교 (#2)**.
4. **배당 캘린더 (#4)** — 토대 B의 `paymentSchedule` + 기존 `SnowballCalendar` 재사용.

### Phase 3

5. **ETF 상세 (#5)** — 토대 B 데이터 공유 + 신규 SEO 라우트(sitemap·메타 갱신).
6. **실제 배당 기록 (#6)** — 토대 A의 `kind:'actual'` 원장. #1과 스냅샷 봉투 공유.
7. **Dividend Journey (#8)** — 토대 A 스냅샷 → `buildJourneyTimeline` + 커뮤니티 공유·댓글.
8. **배지 시스템 (#9)** — #1·#6 스냅샷 데이터에 순수 배지 규칙(`evaluateBadges`).

### Phase 4

9. **포트폴리오 복사 (#7)** — 대부분 기존 seam(`openInSimulatorHref` + 첨부 payload + 클라우드 저장). 신규 최소.
10. **AI 분석 (#10)** — 신규 서버리스 `api/analyze.ts` + `isAiEnabled` 플래그 + Claude API. 서버 비밀키 경로.

---

## 7. 리스크·미결정 사항

### 토대 A (시계열 스냅샷)

- **[미결정] 실측 원장 라인아이템 위치** — 초안은 월 요약 blob의 `byTicker` 배열(수 KB). 라인아이템 CRUD·필터·집계
  쿼리가 커지면 자식 테이블(`dividend_entries`)로 분리해야 할 수 있다. **지금 결정하지 않는다**(과설계 회피) —
  #6 착수 시 실제 UX 요구로 판단.
- **[미결정] 목표(#1) 저장 위치** — `user_app_states.payload` 확장 vs 소형 `goals` 테이블. payload 확장이 저렴하나
  왕복 호환 테스트 필요. #1 착수 시 확정.
- **[리스크] 스냅샷 찍는 타이밍의 신뢰성** — "월 1회 방문 시 upsert"는 앱을 안 여는 달의 증감을 놓친다. "증감"
  카피가 데이터 공백에 어떻게 대응하는지 UX 결정 필요(무음 실패 금지 — user-profile.md).
- **[리스크] 클라이언트 신뢰 모델** — 실측 배당은 사용자가 입력하는 **주관 값**이라 서버가 내용을 검증 못 한다
  (sim_summary와 같음). 배지·Journey가 이 값을 근거로 삼으면 "자기 신고"임을 UX가 드러내야 한다.

### 토대 B (티커 확장)

- **[선행/리스크] 데이터 소스 비용·커버리지** — FMP 유료 티어가 섹터·운용보수·스케줄을 **모든 티커에 대해** 주는지
  미검증. 커버리지 구멍 시 필드 optional 폴백(설계에 반영됨) + 큐레이션 보완 필요.
- **[리스크] 데이터 신선도·법적 표기** — 배당 스케줄·최대낙폭은 시간에 따라 변한다. 크론 주기·"기준일 표기"·데이터
  제공자 귀속(FMP ToS) 필요. 3분류 규율상 이건 전부 **관측값**이라 자동 갱신 대상.
- **[리스크] 번들 부피** — 배당 히스토리는 티커당 크다. 참조 데이터셋을 반드시 lazy/청크 분리하지 않으면 초기 번들
  517KB 규율이 깨진다. ETF 페이지 진입 시에만 로드하는 구조를 설계 초기에 못박을 것.

### 공통

- **[제약] 코드 미변경** — 이 문서는 설계·관례만이다. 실제 테이블·플래그·파일은 각 기능 착수 시, 현재 미커밋 배치가
  정리·커밋된 뒤 점진적으로 만든다. 스키마 초안은 **초안**이며 착수 시점 재검토·사용자 승인(스키마·저장 형식 변경은
  독단 금지 — retro.md) 대상이다.
- **[제약] 파괴적 변경 승인** — 기본값·라우트·저장 형식·스키마 변경은 사용자 승인 필요(decisions/retro 규율).
