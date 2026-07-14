# HANDOFF — 2026-07-15

> 다음 세션에서 이 문서부터 읽으세요. 어디까지 했고, 왜 그렇게 했고, 무엇이 남았는지가 전부 여기 있습니다.

## 지금 상태 한 줄

브랜치 **`refactor/pure-functions`** (커밋 21개, PR [#9](https://github.com/hck1205/snowball-income/pull/9) OPEN, `+30,814 / -4,916`) — **테스트 797개 전부 통과**, `npx tsc -b` / `npm run build` 통과, 워킹트리 clean. **아직 main에 머지 안 됨 = 배포 안 됨.**

---

## 이번 세션에서 무엇이 바뀌었나

### 🔴 가장 중요: 코어 계산 모델이 틀려 있었고, 고쳤다

시뮬레이션이 배당(DPS)을 주가와 **독립적으로** 성장시켰다.
- 기존: `priceGrowth = expectedTotalReturn − dividendYield`, `dps(t) = P0 × y0 × (1+dividendGrowth)^t` ← 가격과 무관
- 그 결과 실효 총수익률이 입력값과 일치하는 건 `dy + dg == etr`일 때뿐인데(고든 성장모형), **프리셋 68개 중 48개가 이를 어겼다.**

**증상**: 30년 시뮬(초기 1,000만 / 월 50만 / 재투자 100% / 세율 15.4%)에서 **총수익률 7%로 입력한 QYLD(19.87억)가 10%인 SCHD(11.80억)를 압도**. 배당률 50% 이상 입력 시 `NaN`이 화면에 렌더.

**수정**: 배당을 가격에 앵커했다.
```
priceGrowth = dividendGrowth
dps(t)      = price(t) × dividendYield     → 배당수익률이 일정하게 유지
totalReturn = dividendYield + dividendGrowth  → 입력이 아니라 파생값
```
- 프리셋은 큐레이션된 `expectedTotalReturn`을 보존하고 `dividendGrowth = etr − dy`로 재계산. 커버드콜은 자연히 **음수 성장률**(QYLD −3%)이 된다 — NAV 침식이 실제로 그렇다.
- **결과: SCHD 11.38억 > QYLD 4.98억**으로 역전 해소. 60년 후 yield-on-price 표류 9e-16%p.
- 기존 저장 데이터·공유 URL은 **같은 규칙으로 마이그레이션**(dy·etr 보존, dg 재계산). **lz-string 인코딩 포맷은 안 바꿨으므로 기존 공유 링크는 그대로 열린다.**
- ⚠️ **사용자가 보던 숫자가 바뀐다** → 이를 알리는 [ModelChangeNotice](pages/Main/components/ModelChangeNotice/) 배너를 넣어뒀다(닫으면 다시 안 뜸).

### 그 외 고친 버그 (전부 실사용자에게 영향 있던 것들)

| 버그 | 무엇이 문제였나 |
|---|---|
| **IndexedDB 통째 삭제** | 모든 read/write/delete의 `catch`가 `resetPortfolioDb()`를 호출 → 다른 탭의 version 잠금·quota 초과·프라이빗 모드만으로도 **저장 슬롯 전체가 사라졌고**, 그러고도 성공한 것처럼 resolve됐다. 자동 삭제 제거 + 읽기 실패 후 자동 저장이 원본을 덮어쓰던 2차 경로도 차단 |
| **주가 0원 티커 생성** | 모달은 `Number.isFinite`만 검사(0 통과), 엔진 zod는 `positive()` 요구 → 티커명만 넣고 생성하면 칩은 생기고 **결과 화면이 통째로 오류**로 바뀜. 이제 모달과 엔진이 같은 zod 스키마 공유 |
| **존재하지 않는 날짜** | `2026-02-31`이 정규식을 통과 → `toStartDate`가 조용히 "오늘"로 폴백 → 같은 입력이 실행일마다 다른 결과. 달력 유효성 검증 추가, `runSimulation`이 진짜 순수 함수가 됨 |
| **프리셋 비중 밀림** | 필터링된 배열 인덱스로 `allocations[i]`를 읽어서, universe에 없는 티커가 섞이면 이후 비중이 한 칸씩 당겨짐 |
| **간편 추정이 재투자 무시** | 재투자 OFF일 때 75% 과대(QYLD는 4배). 이제 재투자 비율·타이밍 반영, 오차 0.2% 이내 |
| **양도세 미표시** | 배당소득세만 계산 → 표시 세금이 실제 세부담의 27%. "전량 매도한다면" 섹션 추가(취득원가·평가이익·양도세 22%·세후 자산). 금융소득종합과세 2,000만원 초과 시 경고 |

### 구조·인프라

- **FP 리팩터링**: 계산·상태·UI 로직을 순수 함수로 추출. **테스트 23개 → 797개** (착수 시 9개가 깨진 채였다)
- **디자인 시스템** (`shared/styles/`): primitives → semantic 토큰, 다크모드, 프리미티브 컴포넌트(Button/Toggle/Chip/StatTile/Card/Banner/Tabs/Modal/BrandMark). **Pretendard를 npm으로 self-host** — 선언만 하고 로드가 안 되던 게 "올드함"의 주범이었다
- **튜토리얼**: 헤더 나침반 아이콘 → 스포트라이트 코치마크 투어. 외부 라이브러리 없이 구현. GA4 이벤트(`tutorial_*`)로 온보딩 퍼널 측정 가능
- **SEO**: canonical 도메인이 `snowball-income.example`(존재하지 않는 예약 TLD)이었고, FAQPage 구조화 데이터가 **앱에 없는 Q&A를 마크업**하고 있었다(구글 정책 위반). 전부 정리. **초기 JS 2.83MB → 523KB** (죽어 있던 `lazy()`를 정적 import가 무력화하고 있었다)
- **동적 OG 이미지** (`/api/og`): 공유 링크마다 그 시나리오의 실제 숫자로 카드 생성 → 카톡 공유 시 표시. `middleware.ts`가 `?share=` 요청의 og:image를 치환
- **프리렌더**: `#root`에 1,500자 한글 콘텐츠(빌드 시 실제 엔진으로 계산한 예시 포함) → 네이버 Yeti·다음이 읽을 수 있게
- **티커 자동 갱신** (`scripts/tickerRefresh/`): 주간 크론 → FMP에서 가격·배당률·지급주기 → 이상치 가드 → **PR 생성**(직접 push 안 함)
- **인덱서** (`tools/indexer/`): `npm run search -- <질의>`로 코드 검색. `kind:pure`, `file:<경로>` 필터
- **에이전트 팀** (`.claude/agents/`): orchestrator + pm-po + 11 specialist
- **Supabase 커뮤니티 (Stage 1)**: 스키마 + RLS + 데이터 레이어. **UI는 아직 없음**

---

## 내일 이어서 할 일

### 1순위 — 커뮤니티 UI (Stage 2)

DB·RLS·데이터 레이어는 **완성됐고 실제 Supabase에 연결·검증까지 끝났다**. 남은 건 화면이다.

- 시나리오 갤러리 (최신순/인기순, 카드에 조회수·좋아요·댓글 수)
- 시나리오 공개/저장 (제목·설명, 기본 비공개)
- 좋아요 / 조회수 (낙관적 업데이트, 중복은 DB가 막음)
- 댓글 + 대댓글(1단계) + 좋아요, 본인 소프트 삭제
- 로그인 버튼 (구글/카카오), 비로그인은 읽기만

데이터 레이어: `shared/lib/supabase/`(`queries.ts`, `comments.ts`, `auth.ts`, `pagination.ts`). `isCommunityEnabled`가 false면 커뮤니티 진입점을 아예 렌더하지 않으면 된다.

**동적 OG와 붙으면 루프가 완성된다**: 갤러리에서 발견 → 카톡 공유(그 시나리오의 숫자가 카드로) → 유입 → 좋아요.

### 그 다음

- **네이버 로그인** — Supabase 기본 프로바이더가 아니라 Edge Function으로 토큰 교환 필요. 확장 지점은 `CommunityOAuthProvider` 한 곳에 모아뒀다
- **댓글 모더레이션** — 현재 RLS로는 시나리오 주인도 악성 댓글을 못 지운다(본인 것만 소프트 삭제). Vercel `/api`에 Supabase secret 키를 두고 관리자 삭제 경로를 만들어야 한다
- **아이콘 제작** — 프롬프트는 [docs/brand/icon-prompts.md](docs/brand/icon-prompts.md)에 준비됨. PWA 설치를 위해 192/512 PNG 필요

---

## 사용자님이 직접 해야 하는 것 (제가 못 하는 것)

| # | 할 일 | 어디서 | 왜 필요한가 |
|---|---|---|---|
| 1 | **`VITE_SITE_URL`에 실제 도메인 설정** | Vercel → Settings → Environment Variables → **Redeploy** | 기본값이 존재하지 않는 예약 TLD라 **canonical·sitemap·OG가 전부 무효**. SEO 작업 전체가 이것 하나에 걸려 있다 |
| 2 | **GA4 속성에 서비스 계정 뷰어 추가**<br>`ga-mcp@snowball-income-487806.iam.gserviceaccount.com` | GA4 → 관리 → 속성 액세스 관리 | GA MCP가 붙는다. 실사용자 퍼널을 데이터로 분석해 다음 우선순위를 정할 수 있다. 지금은 인증은 되지만 접근 가능한 속성이 0개 |
| 3 | **구글/카카오 OAuth 등록** | Supabase → Authentication → Providers | 커뮤니티 로그인. 콜백 `https://nbgwafropjbxypqxncfm.supabase.co/auth/v1/callback`. ⚠️ **카카오는 REST API 키**를 Client ID에 (JavaScript 키를 넣으면 조용히 실패) |
| 4 | Redirect URLs 등록 | Supabase → Authentication → URL Configuration | `http://localhost:5175/**` + 배포 도메인 |
| 5 | `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel Environment Variables | 프로덕션에서 커뮤니티 활성화 |
| 6 | **`FMP_API_KEY`** | GitHub → Settings → Secrets → Actions | 티커 시세 자동 갱신 크론. 무료 티어 250 req/day라 빠듯 — 첫 실행은 `npm run ticker:refresh -- --only=SCHD,JEPI` (dry-run이 기본) |
| 7 | **PR #9 리뷰 후 머지** | GitHub | = 배포. 머지 전에 [ModelChangeNotice](pages/Main/components/ModelChangeNotice/ModelChangeNotice.tsx) 문구를 읽어보길 권함 |

**⚠️ 이전에 `.env`에 넣었던 `sb_secret_...` 키는 Revoke 하셨는지 확인하세요.** (깃에는 올라가지 않았지만 노출된 적이 있음)

---

## 알아둬야 할 결정과 함정

- **`.env`는 gitignore 대상**이고, `VITE_` 접두사 변수는 **빌드 시 번들에 인라인되어 공개**된다. Supabase `service_role`/`secret` 키를 여기 넣으면 전 세계에 공개된다. 서버(Edge Function/`/api`)에서만 쓴다.
- **테스트는 로컬 `.env`에 영향받지 않는다** — `vitest.config.ts`에서 커뮤니티 변수를 명시적으로 비워 "백엔드 없는 기본 배포" 상태를 고정했다.
- **Vercel Hobby는 비상업적 용도 전용**이다. 숨겨진 커피 후원 버튼([TickerCreation.tsx:446](components/TickerCreation/TickerCreation.tsx#L446), `display:none`)을 살리거나 광고를 붙이면 Pro($20/월)가 필요하다.
- **`vercel.json`에 `cleanUrls: true`를 넣지 마라** — 무한 루프(508). legacy `routes`도 금지(`/api/*`를 삼킨다).
- **티커 데이터의 3분류**를 기억할 것:
  - 가격·배당률·지급주기 = **관측되는 사실** → 크론이 자동 갱신
  - `expectedTotalReturn` = **사람의 가정** → 자동화 금지. 새 티커 추가 시 실질적으로 이것만 정하면 된다
  - `dividendGrowth` = **파생값** (`etr − dy`) → 정합 모델에서는 주가 성장률이기도 하다. 과거 배당 CAGR로 덮어쓰면 안 된다(파이프라인이 이걸 막고 있다)
- **에이전트에게 `git stash`/`reset`을 절대 시키지 말 것.** 이번 세션에서 한 에이전트가 stash로 다른 에이전트의 작업을 날린 사고가 있었다(복구함).

## 자주 쓰는 명령

```sh
npm run dev                    # 개발 서버
npx vitest run                 # 전체 테스트 (797개)
npx tsc -b                     # 타입체크
npm run build                  # 빌드 (ticker:parse → tsc → vite)
npm run search -- runSimulation        # 코드 검색 (인덱서)
npm run search -- kind:pure allocation # 순수 함수만
npm run index                  # 인덱스 재생성 (커밋 시 자동)
npm run ticker:refresh -- --only=SCHD  # 티커 갱신 (dry-run 기본, --write로 반영)
```

## 문서 지도

- [CLAUDE.md](CLAUDE.md) — 코드 지도, `.cursor/rules` 요약, 에이전트 팀
- [shared/styles/README.md](shared/styles/README.md) — 디자인 시스템(토큰·프리미티브)
- [docs/supabase/README.md](docs/supabase/README.md) — 스키마·RLS·OAuth 설정
- [docs/vercel/README.md](docs/vercel/README.md) — 환경변수·OG·미들웨어
- [docs/brand/icon-prompts.md](docs/brand/icon-prompts.md) — 아이콘 생성 프롬프트
- [supabase/migrations/](supabase/migrations/) — DB 스키마 (실행 완료됨)
