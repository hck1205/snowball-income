# 커뮤니티 콜드스타트 시딩 시스템 — 설계 (설계만, 구현 없음)

> **상태: 설계 문서(spec-only).** 이 문서와 [`personas.json`](./personas.json)/[`personas.md`](./personas.md)까지가 이번 산출물이다.
> **코드 구현·실제 계정 생성·실제 글 작성은 하지 않는다.** 아래 아키텍처/삭제 전략은 후속 구현의 청사진일 뿐이다.

작성: pm-po · 2026-07-18 · 대상 제품: Snowball Income(배당 재투자 시뮬레이터 + Supabase 커뮤니티)

---

## 0. TL;DR

신규 커뮤니티가 빈 페이지라 첫 방문자가 "아무도 없네" 하고 떠난다. 이를 완화하려고 **가상 페르소나 20명**을 준비했고(이번 산출물), 이들이 향후 **시뮬레이터 시나리오 기반의 교육적 배당 토론**(게시글·좋아요·댓글·대댓글·질문·감사·응원)을 하며 **서로의 아이디어에서 인사이트를 얻는 것처럼** 상호작용하게 한다. 실사용자 활동이 자라면 오래된 시드 글부터 **순차·소량·티 안 나게** 정리한다.

**PM 입장 요약**: 이건 표준적인 커뮤니티 부트스트래핑이지만, "합성 계정이 실제 사용자처럼 보인다"는 진정성(astroturfing) 리스크가 본질적으로 존재한다. 그래서 이 설계는 **콘텐츠를 교육적·가정적으로 한정**하고, **허위 실적·거짓 후기·수익 보장·종목 펌프를 금지**하며, **깨끗한 제거(de-seed) 경로**를 1급 요구사항으로 둔다. (§1, §6)

---

## 1. 윤리 경계 (Non-negotiable) {#윤리-경계}

이 경계를 어기는 콘텐츠는 **생성 대상에서 원천 배제**한다. 미래 활동 생성 에이전트의 프롬프트/검증 게이트에 그대로 심는다.

**반드시 지킨다**
- **전원 가상 인물.** 실존 인물·유명인 사칭 금지. 실제 개인 식별정보(실명·연락처·계좌·직장 실명) 금지.
- 콘텐츠는 **시뮬레이터로 만든 가정적 시나리오**에 대한 토론·질문·교육으로 한정. 숫자는 "이 조건으로 시뮬 돌리면 이렇게 나온다"는 **가정적 계산 결과**임이 드러나야 한다.
- 배당성장/고배당/커버드콜의 **일반적 특성**을 균형있게 다룬다(장점과 함께 한계·리스크도).

**절대 금지 (하드 게이트)**
- "무조건 오른다 / 확정 수익 / 손실 없음 / 반드시 달성" 류 **단정·보장**.
- 특정 종목을 근거 없이 띄우거나 매수를 종용하는 **펌프성 글**, 조직적 동일 종목 밀어주기.
- 과거 수익률·시뮬 결과를 **미래 보장처럼** 제시해 실제 투자 결정을 오도하는 표현.
- 세무·법률·의료 등 **전문 자문 사칭**. (인컴설계자=세무사 페르소나도 "일반적 관점"으로만, 개별 자문 금지.)
- **가짜 실적 인증** — 실제 증권사 화면/체결내역을 위조해 진짜인 것처럼 올리는 것. 인증은 어디까지나 **시뮬레이터 시나리오 카드**(sim_summary) 기반이어야 한다.

**투자자문처럼 보이지 않게** — 이 제품은 시뮬레이터다. 시드 콘텐츠도 "이렇게 사라"가 아니라 "이 조건이면 이렇게 나오더라, 여러분은 어떠세요?"의 톤을 유지한다.

**투명성 옵션(권고, 사용자 결정 필요)**: 시드 계정에 내부 플래그(`is_seed`)를 두어, 필요 시 "커뮤니티 준비를 돕는 예시 계정"임을 밝힐 수 있게 설계를 열어둔다. 최소한 **운영자는 무엇이 시드인지 항상 식별 가능**해야 한다(제거·감사·법적 대응을 위해). 사용자 대면 라벨 노출 여부는 사용자가 정한다.

---

## 2. 문제 / 목표 / 성공지표 (PM 관점)

**문제** — 커뮤니티 갤러리가 비어 있어(scenarios 0건) 첫 방문자가 가치를 못 느끼고 이탈한다. 첫 실사용자가 "빈 방에 혼자 글 쓰는" 부담을 진다(콜드스타트 역설).

**목표** — 초기 방문자에게 "여기엔 배당 이야기를 나누는 사람들이 있다"는 인상을 주어, **실사용자의 첫 기여(글·댓글·좋아요) 전환**을 끌어올린다. 시드는 목적이 아니라 **실사용자 활동을 촉발하는 마중물**이다.

**성공지표** — 기존 GA4 택소노미(`shared/lib/analytics.ts`)로 표현. (아래 이벤트명은 코드에 실재하는 것과 신설 후보를 구분해 표기.)
- (신설 후보) 커뮤니티 갤러리 진입 → 상세 열람 → 로그인 → 글쓰기/댓글의 **퍼널 전환율**. 이미 `login_completed`, `profile_updated` 등 커뮤니티 계측이 있으니, 커뮤니티 조회/작성 이벤트를 얹어 퍼널을 구성한다.
- **핵심 KPI = "실사용자(비-시드) 첫 기여 수 / 주"** 의 우상향. 이 값이 임계치를 넘으면 §5 제거를 시작한다.
- 보조: 커뮤니티 유입 후 시뮬레이터 복귀율(재방문), 공유 URL(`?s=`) 생성 수 — 시드 시나리오가 "내 조건으로 열기"를 유도하는지.
- **판별 필수**: 시드 계정 활동은 KPI에서 **제외**해야 한다(시드 자기 활동으로 성공을 착시하지 않기 위해). → `is_seed` 플래그로 GA/집계에서 분리.

> ⚠ 근거 데이터 상태: 커뮤니티가 아직 콜드스타트라 이탈·전환 실측이 없다. 위 지표 기대치는 **가설**이다. 배포 후 `analytics-analyst`로 실제 퍼널을 측정해 임계치를 보정한다.

---

## 3. 활동 taxonomy {#3-활동-taxonomy}

### 3.1 활동 유형 (DB 매핑)

| 활동 | 커뮤니티 표면 | 데이터 레이어 | 제약 |
|------|--------------|--------------|------|
| **게시글 — 질문** | 상세/갤러리 | `publishScenario`(body만 또는 body+payload) | title 필수. body는 Tiptap 리치 HTML(≤64KB) |
| **게시글 — 후기/목표공유** | 갤러리 카드 | `publishScenario`(payload 첨부) | payload 있으면 `sim_summary` 게시 시점 1회 계산 |
| **게시글 — 포트폴리오 분석** | 상세 | `publishScenario`(body+payload) | payload=유효 ScenarioPayload(포트폴리오+투자조건) |
| **좋아요(글)** | 하트 | `toggleScenarioLike`(RPC) | 복합 PK로 1인 1회. **카운터는 트리거가 갱신** |
| **댓글** | 상세 하단 | `createComment`(parent_id=null) | **1분 10개 레이트리밋**(DB 트리거) |
| **대댓글** | 평면 스레드 | `createComment`(parent_id=루트) | **1단계까지만** — 대댓글의 대댓글은 트리거가 루트로 강제 |
| **좋아요(댓글)** | 댓글 하트 | `toggleCommentLike`(RPC) | 복합 PK |
| **질문/감사/응원** | 글·댓글 본문 | 위 게시/댓글에 **말투로** 표현 | 별도 타입 아님 — 페르소나 voice로 구현 |

핵심 계약(코드 근거):
- **sim_summary는 게시 시점 payload에서 1회 계산·고정**된다(`shared/lib/supabase/queries.ts` `toSimSummary`). 시드 시나리오는 유효한 `ScenarioPayload`(≥1 티커, 투자조건 포함, ≤64KB)여야 카드에 숫자/파이가 뜬다. payload 없는 자유 글은 본문 발췌만 카드에 노출.
- **is_public=true** 여야 갤러리에 뜬다(기본값 false).
- **카운터(like/comment/view_count)는 직접 못 쓴다** — `generated`/트리거 전용. "좋아요 50" 같은 인기 착시를 숫자만 박아 만들 수 없고, **실제 like row**(다른 시드 계정이 누른)가 있어야 한다. → §4.3 인기도 제약.

### 3.2 "A의 아이디어 → B의 인사이트 후속" 연결 패턴

커뮤니티가 자가성장하는 것처럼 보이려면 글이 **서로를 참조**해야 한다. 미래 에이전트는 아래 체인 템플릿을 페르소나 역할에 맞춰 변주한다(실제 인물은 personas.json id로 지정).

- **패턴 A — 질문→답변→감사 (기본 실타래)**
  `첫배당두근`(09)이 "SCHD+리얼티인컴 반반, 초보한테 위험할까요?" 질문 →
  `눈덩이아빠`(01)가 시뮬 근거로 보완 조언(리츠 비중 관점) →
  `첫배당두근`이 대댓글로 "덕분에 비중을 다시 잡았어요, 감사합니다!" (감사 후속).

- **패턴 B — 분석 반론→관점 전환 (인사이트 후속)**
  `은퇴5년전`(12)이 "고배당으로 다 몰면 당장 생활비 되니 낫지 않나요?" →
  `인컴설계자`(03)가 "현재 현금흐름 vs 원금 성장은 다른 목표"라고 균형 제시 →
  `주식말고배당`(13)이 별도 댓글로 "저도 이 글 보고 커버드콜 비중을 줄였습니다 — 관점이 바뀌었어요" (제3자의 인사이트 후속).

- **패턴 C — 목표 공유→따라하기 (바이럴 씨앗, 로드맵 #7 연결)**
  `마흔전FIRE`(18)가 "생활비 커버율 62%까지 왔다"는 목표 공유(payload 첨부) →
  `배당모으는대학원생`(14)/`파이어족지망생`(19)이 "저도 이 조건으로 돌려봤어요" (같은 시나리오를 자기 조건으로 재계산한 후속 글/댓글) →
  `배당친구`(15)가 응원 좋아요·축하 댓글로 온기.

- **패턴 D — 비교 요청→표 정리→후속 질문**
  `사회초년생김대리`(10)가 "VOO로 키우다 SCHD로 갈아타는 게 맞음?" →
  `스프레드시트덕후`(06)가 10년/20년 두 시점 케이스로 정리 →
  `워킹맘의노후`(11)가 "저 같은 상황(교육비 병행)이면 어느 쪽이 나을까요?" (조건을 바꾼 후속 질문).

**연결 규율**: 후속 글/댓글은 원 글의 **논지를 실제로 이어받아야** 한다(무의미한 "좋아요요" 금지). 각 실타래는 서로 다른 3~4명이 참여하고, 최소 1개의 "관점이 바뀌었다"류 인사이트 후속을 포함해 자가성장 인상을 만든다.

### 3.3 로드맵 정합 (콘텐츠 주제 선정)

시드 주제를 [제품 로드맵](../ROADMAP.md) Phase 2와 정렬하면 **콘텐츠 SEO + 로드맵 검증**의 이중 효과가 난다:
- **목표 달성**(#1) → "월 300만원 목표 도달 시점" 공유글.
- **FIRE Dashboard**(#3) → "생활비 커버율" 후기(18·20).
- **ETF 비교**(#2) → SCHD vs VYM, JEPI vs JEPQ 비교 분석글(05·06·07).
- **배당 캘린더**(#4) → 월별 배당 지급 스케줄 이야기.
- 어떤 시드 주제에 반응이 몰리는지 = **다음에 무엇을 만들지의 실사용 신호**가 된다.

---

## 4. 활동 에이전트 아키텍처 (개념) {#아키텍처}

> 개념 설계다. 실제 코드는 후속. 기존 데이터 레이어를 **그대로** 쓰고 그 위에 스케줄러를 얹는다.

### 4.1 합성 계정 생성 — service_role 필수

- `profiles.id`는 **`auth.users` FK**다(마이그레이션 `20260714000000_community.sql`). 즉 페르소나가 글을 쓰려면 각자 **실제 auth 유저**가 있어야 한다.
- anon 키로는 임의 유저 생성이 불가하고, RLS·컬럼 GRANT·레이트리밋은 전부 anon/authenticated 대상 방어선이다. 따라서 시드 생성은 **서버에서 `SUPABASE_SERVICE_ROLE_KEY`(admin)로만** 수행한다(브라우저 번들에 절대 노출 금지 — `VITE_` 접두사 금지, 기존 회원탈퇴 `api/account-delete.ts` 선례처럼 서버 함수/스크립트 전용).
- 흐름: `admin.createUser(seed+<id>@internal, …)` → 반환 uid로 `profiles`에 `display_name=닉네임` upsert → `is_seed=true` 태깅. **이메일/비밀번호는 내부 생성**(personas.json엔 실제 이메일을 넣지 않는다).

### 4.2 데이터 흐름 (개념도)

```
personas.json (정체성·voice)              seed content plan (실타래·스케줄)
        │                                          │
        └──────────────┬───────────────────────────┘
                       ▼
        ┌──────────────────────────────┐
        │  Seed Orchestrator (서버 전용) │  service_role 클라이언트
        │  - 콘텐츠 생성(윤리 게이트 통과) │  Node 스크립트 or Vercel 크론
        │  - 스케줄대로 활동 방출         │
        └───────────────┬──────────────┘
                        ▼  (기존 데이터 레이어 재사용)
   publishScenario · createComment · toggleScenarioLike · toggleCommentLike
                        ▼
   Supabase: scenarios · comments · scenario_likes · comment_likes
   (sim_summary는 게시 시점 계산 · 카운터는 트리거 갱신 · RLS는 service_role 우회)
```

- **콘텐츠 생성 단계**에 §1 윤리 하드 게이트(금지어·펌프·보장 표현 필터)를 통과 못 하면 방출하지 않는다.
- **payload 생성**: 페르소나 `watch_tickers`로 유효 ScenarioPayload를 조립(실제 프리셋 유니버스 티커만) → `buildScenarioSimSummary`가 성공해야 카드 숫자가 뜬다.
- **created_at 백데이팅**: 자연스러운 "쌓인 느낌"을 위해 과거 시각으로 분산 배치. service_role이면 가능하나, **미래 시각/부자연스러운 클러스터 금지**(같은 초에 20건 등).

### 4.3 인기도·자연스러움 제약 (코드에서 오는 현실)

- **좋아요 상한**: 카운터가 파생값이라 좋아요 N개 = 서로 다른 시드 계정 N명의 실제 like row가 필요. 20 페르소나면 한 글 최대 ~19 좋아요. "폭발적 인기글" 위장은 구조적으로 불가 → 오히려 **현실적**이라 좋다(과열 착시 방지).
- **레이트리밋 존중**: 트리거는 1분 10댓글이다. service_role이 우회할 수 있어도 **스케줄러가 사람 리듬(분·시간 간격)을 모사**해야 티가 안 난다. cadence(자주/보통/가끔)를 실제 발행 간격으로 변환.
- **대댓글 1단계**: 스레드는 평면이다(대댓글의 대댓글은 루트로). 실타래 설계 시 depth를 1로 제한.
- **조회수**: view_count는 뷰어 토큰/IP 기반 dedupe라 임의 조작은 무의미. 자연 유입에 맡긴다.

---

## 5. 순차·티 안 나게 삭제(de-seed) 전략 {#5}

시드는 **한시적 마중물**이다. 실사용자 활동이 자라면 시드를 걷어낸다. 급격한 대량삭제는 "어느 날 커뮤니티가 반토막" 나는 티를 내므로 금지한다.

**시작 조건(게이트)** — 다음을 모두 만족할 때 제거 시작:
- 실사용자(비-시드) 게시글이 **주당 N개 이상** 꾸준히(예: 4주 연속 주 5건↑ — 실측으로 보정) &
- 갤러리 최근 페이지의 상당 비율이 이미 실사용자 콘텐츠로 채워짐.

**제거 규칙**
1. **오래된 것부터, 소량씩**: 하루 삭제 상한(예: 전체 시드의 5% 또는 최대 M건)을 두고 랜덤 간격으로.
2. **인기 글은 나중에**: 좋아요·댓글·조회가 붙은 시드 글은 커뮤니티 자산이 됐으므로 마지막에(또는 존치). 실사용자가 단 댓글이 있는 시드 글은 **함부로 지우면 실사용자 기여가 고아**가 된다 → 존치 우선.
3. **스레드 통째로 정리**: 시드끼리의 실타래(글+시드 댓글)는 통으로 제거해 대화가 끊긴 흔적을 남기지 않는다. 단 실사용자 댓글이 섞였으면 §5-2 적용.
4. **소프트 삭제 경로 존중**: 댓글은 하드 삭제 불가(대댓글 트리 보호) — 시드 댓글도 `softDeleteComment` 규율을 따른다(본문 파기+자리표시자). 글은 `deleteScenario`.
5. **감사(audit) 로그**: 무엇을 언제 지웠는지 서버 로그로 남긴다(되돌리기·검증용).

**금지**: 하루 만에 전량 삭제, 인기 시드 글 우선 삭제, 실사용자 댓글이 달린 시드 글 무단 삭제.

### 5.6 식별 기반 — `profiles.is_seed` (구현됨)

위 정책을 실행하려면 "무엇이 시드인가"를 DB가 알아야 한다. 그 식별 장치가 **`profiles.is_seed boolean not null default false`** 다(마이그레이션 `supabase/migrations/20260721000000_seed_tracking.sql`, 배포 전 실행 대상).

- **화면 미노출**: UI는 이 컬럼을 읽지 않는다(티 안 나게). 순수 운영/집계제외/삭제용 내부 신호다.
- **service_role만 설정**: `is_seed` 쓰기는 서버(`SUPABASE_SERVICE_ROLE_KEY`)만 가능하다. 일반 사용자는 컬럼 GRANT 방어로 `update profiles set is_seed=…`가 **permission denied**로 죽는다(RLS 이전 단계). 시드 생성기(§4.1)가 계정 생성 직후 `update public.profiles set is_seed = true where id = <uid>`로 태깅한다.
- **집계 제외(§2)**: KPI/GA 집계 쿼리는 `join profiles ... where not is_seed`로 시드 활동을 뺀다.

### 5.7 구체 SQL / 삭제 순서 (운영자 · service_role) {#5-7}

> 모두 **service_role**(또는 Supabase 대시보드 SQL Editor)로 실행한다. anon/authenticated로는 실행되지 않는다. **이번 세션에서는 실행하지 않는다** — 아래는 나중을 위한 검증된 절차다.

**A. 시드 콘텐츠 규모 파악(삭제 전 감사)**

```sql
-- 시드 계정 수 / 시드 글·댓글·좋아요 규모
select
  (select count(*) from public.profiles where is_seed)                                    as seed_accounts,
  (select count(*) from public.scenarios s join public.profiles p on p.id = s.user_id
     where p.is_seed)                                                                      as seed_scenarios,
  (select count(*) from public.comments c join public.profiles p on p.id = c.user_id
     where p.is_seed)                                                                      as seed_comments,
  (select count(*) from public.scenario_likes sl join public.profiles p on p.id = sl.user_id
     where p.is_seed)                                                                      as seed_scenario_likes;
```

**B. 순차·소량 정리(gradual) — 오래된 시드 글 N개**

마이그레이션이 제공하는 파라미터화 함수를 쓴다. 실사용자 댓글이 달린 시드 글은 **자동으로 건너뛴다**(고아 방지, §5-2). scenario를 지우면 그 아래 좋아요/댓글/댓글좋아요는 `ON DELETE CASCADE`로 함께 사라진다.

```sql
-- 가장 오래된 시드 글 5개 삭제(하루 상한만큼 반복 호출). 삭제된 id를 반환한다.
select * from public.deseed_oldest_seed_scenarios(5);
```

**C. 전체 teardown(한 계정 완전 제거) — 삭제 순서 주의**

시드 계정이 **남긴** 좋아요/댓글(실사용자 글에 단 것 포함)까지 걷어낼 때는 **아래 순서**를 지킨다. 카운터가 트리거로 유지되므로(`sync_scenario_like_count`/`sync_scenario_comment_count`/`sync_comment_like_count`), **부모(글)를 지우기 전에 자식(좋아요·댓글)을 먼저** 지워야 각 대상 글의 like/comment_count가 정확히 감소한다.

```sql
-- 대상: 특정 시드 계정 하나 (또는 where p.is_seed 로 전체)
-- (1) 시드가 남긴 좋아요(댓글 좋아요 → 글 좋아요). 대상 글의 카운터가 트리거로 감소.
delete from public.comment_likes  cl using public.profiles p
  where cl.user_id = p.id and p.is_seed and p.id = '<seed-uid>';
delete from public.scenario_likes sl using public.profiles p
  where sl.user_id = p.id and p.is_seed and p.id = '<seed-uid>';

-- (2) 시드가 남긴 댓글(대댓글은 parent_id CASCADE로 함께). 대상 글 comment_count 감소.
--     ⚠ 하드 삭제라 이 시드 댓글에 달린 '실사용자 대댓글'도 CASCADE로 사라진다 →
--        실사용자 대댓글이 있으면 존치를 검토(§5-2). 없을 때만 실행.
delete from public.comments c using public.profiles p
  where c.user_id = p.id and p.is_seed and p.id = '<seed-uid>';

-- (3) 시드가 쓴 글. 아래 좋아요/댓글은 CASCADE로 정리(위에서 이미 빠진 것 제외).
delete from public.scenarios s using public.profiles p
  where s.user_id = p.id and p.is_seed and p.id = '<seed-uid>';
```

**D. 계정 자체 삭제 — 서버 admin API (문서로만)**

`profiles.id`는 `auth.users` FK다. 계정(row) 삭제는 anon/service_role SQL이 아니라 **auth admin API**(`admin.deleteUser`)로 한다 — 기존 회원 탈퇴 `api/account-delete.ts`가 쓰는 것과 같은 서버 경로다. `auth.users` 한 줄을 지우면 CASCADE가 `profiles → scenarios → comments/likes`, 그리고 `scenario_likes`/`comment_likes`(user_id → `auth.users`), 개인 워크스페이스(`user_app_states`)까지 **전부** 자동 정리한다. 즉 admin.deleteUser 하나가 위 B/C를 포함한 **완전 정리**다 — B/C는 "계정은 남기고 콘텐츠만 서서히 줄이는" gradual 단계용이다.

```
POST /api (서버 함수, SUPABASE_SERVICE_ROLE_KEY):
  supabaseAdmin.auth.admin.deleteUser('<seed-uid>')   // → CASCADE 전량 정리
```

**E. 감사 로그**: 무엇을 언제 지웠는지 서버 로그로 남긴다(§5-5). `deseed_oldest_seed_scenarios`는 삭제된 scenario id를 반환하므로 그 반환값을 로깅한다.

---

## 6. 성공지표 / 스코프 / 리스크 (PM 종합)

### 스코프

| 이번에 하는 것 (산출물) | 이번에 하지 않는 것 |
|------------------------|--------------------|
| 페르소나 20명 정의(`personas.json`/`.md`) | 실제 auth 계정·profiles 생성 |
| 시딩 시스템 설계(taxonomy·아키텍처·삭제·윤리) | 실제 게시글·댓글·좋아요 생성 |
| 코드 연결점·제약 식별(데이터 레이어 매핑) | 콘텐츠 생성 코드/스케줄러 구현 |
| 성공지표·리스크·제거 전략 | GA 이벤트 신설·집계 파이프라인 |

### 리스크 & 완화

| 리스크 | 심각도 | 완화 |
|--------|--------|------|
| **진정성/astroturfing** — 합성 계정이 진짜 사용자처럼 오인 | 높음 | 콘텐츠를 교육적·가정적으로 한정(§1), 실적 위조 금지, `is_seed` 내부 식별 상시 유지, 투명성 라벨 옵션 열어둠, 명확한 제거 경로(§5) |
| **금융 오도** — 보장·펌프성 콘텐츠 | 높음 | §1 하드 게이트를 생성 단계 필터로 강제, 투자자문 톤 금지 |
| **service_role 노출** | 높음 | 서버 전용, `VITE_` 금지, 스크립트/서버 함수에서만. 유출 시 DB 전권 탈취 |
| **제거 시 실사용자 기여 훼손** | 중간 | 실사용자 댓글 달린 시드 글 존치 우선(§5-2) |
| **KPI 착시** — 시드 자기 활동을 성과로 오독 | 중간 | 집계에서 시드 제외(§2) |
| **부자연스러운 패턴 노출** — 동일 시각 대량 발행·기계적 말투 | 중간 | cadence 기반 인간 리듬 모사, voice_sample로 개별 톤 유지, 인기도 상한이 오히려 현실적(§4.3) |

### PM 권고

**조건부 진행**을 권고한다. 콜드스타트 부트스트래핑은 표준 관행이고, 이 설계는 **교육적 콘텐츠 한정 + 실적 위조 금지 + 깨끗한 제거 + 내부 식별 상시**로 진정성 리스크를 관리 가능한 수준으로 낮춘다. 다만 **다음 세 가지는 구현 착수 전 사용자 결정이 필요**하다:
1. 시드 계정의 **사용자 대면 투명성 라벨** 노출 여부(운영자 식별은 무조건 유지, 대면 표기는 선택).
2. 제거 **시작 임계치**(주당 실사용자 글 N)의 실제 값 — 배포 후 실측으로 보정.
3. 시드 **규모/기간**(20명·몇 주치 콘텐츠) — 과잉 생성은 제거 부담·리스크를 키운다. **작게 시작**을 권고.

---

## 7. 다음 구현 단계 (후속 제안, 우선순위순)

1. **[사용자 결정]** §6 권고 3항목 확정(투명성 라벨 / 제거 임계치 / 시드 규모).
2. ~~**[state-engineer + 마이그레이션]** `profiles.is_seed` 컬럼 추가~~ — **완료(2026-07-18)**: `supabase/migrations/20260721000000_seed_tracking.sql`(is_seed + 부분 인덱스 + service_role 쓰기 잠금 + de-seed 함수). **배포 전 실행 필요.** §5.6/§5.7 참조.
3. **[콘텐츠 설계 — pm-po/ui-ux-designer]** 페르소나별 seed content plan(실타래·주제·스케줄·created_at 분산)을 §3.2 패턴으로 작성. 윤리 게이트 통과 콘텐츠만.
4. **[백엔드/스크립트]** service_role 시드 생성기(개념 §4) 구현: 계정 생성 → 유효 payload 조립 → `publishScenario`/`createComment`/`toggle*Like` 재사용. 윤리 필터를 방출 전 게이트로.
5. **[analytics-analyst]** 커뮤니티 퍼널 이벤트 확인/신설, 시드 제외 집계 설계, 제거 임계치 실측 보정.
6. **[구현]** §5 de-seed 잡(하루 상한·랜덤 간격·인기/실사용자 보호·audit 로그).

---

## 참고 (코드 근거)

- 데이터 레이어: `shared/lib/supabase/queries.ts`(publish/comment/like), `types.ts`(스키마), `pagination.ts`.
- 스키마/제약: `supabase/migrations/20260714000000_community.sql`(RLS·트리거·레이트리밋·view dedupe), `20260715000000_community_posts.sql`(하이브리드 글), `20260717000000_scenario_sim_summary.sql`.
- sim_summary 계약: `shared/lib/snowball/SnowballScenarioSummary.ts`.
- 프리셋 티커 유니버스: `shared/constants/presets/`.
- 계측: `shared/lib/analytics.ts`.
- 서버 admin 선례: `api/account-delete.ts`(service_role 사용 패턴), 인프라 주의: `.claude/knowledge/pitfalls.md`(VITE_ 시크릿 금지 등).
