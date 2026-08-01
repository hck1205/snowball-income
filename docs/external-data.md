# 외부 데이터 지도 (External Data Map)

> 이 문서의 목적: **어떤 외부 데이터를 · 어디서 받아 · 어디에 저장하고 · 어떻게 최신화하는지** 한 곳에서 본다.
> 새 외부 데이터를 붙이면 반드시 이 문서에 행을 추가한다.
>
> 최초 작성 2026-07-27. 모든 수치·경로는 그 시점의 실측이며, 확인하지 못한 것은 **미확인**으로 남겼다(추측 금지).

---

## 0. 한눈에 보기 (요약 표)

| # | 데이터 | 공급자 | 인증 | 저장 위치 | 갱신 방식·주기 | 실패 시 |
|---|--------|--------|------|-----------|----------------|---------|
| 1 | 티커 시세·배당수익률·지급주기 | Yahoo Finance 비공식 `chart` API (`query1.finance.yahoo.com`) | **불필요**(무키, UA 헤더만) | `shared/constants/marketData/marketData.generated.json` (**커밋되는 생성물**) | GitHub Actions 월간 크론 `0 21 1 * *` → 자동 PR·자동 머지 | 해당 티커의 **이전 값 유지**. 불량률 30% 초과면 CI 실패 |
| 2 | 배당 **지급일**(payoutMonths·지급일) | Alpha Vantage `DIVIDENDS` | **API 키 필요** (`ALPHAVANTAGE_API_KEY`, 무료 25req/day) | 같은 스냅샷 파일(다른 필드만) | GitHub Actions 일간 크론 `30 21 * * *`, 하루 25종목 회전 | 이전 값 유지, 쿼터 도달 시 즉시 중단·다음날 이어감 |
| 3 | 원↔달러 환율(+전일 종가·변동률) | **1순위** Yahoo chart `KRW=X`, 폴백1 `open.er-api.com`, 폴백2 `api.frankfurter.dev`(ECB) | **불필요**(셋 다 무키, Yahoo만 UA 헤더 필요) | **저장 안 함** — 런타임 조회 + 엣지 캐시(6h/24h SWR) | 앱 마운트 시 1회 + 탭 복귀(10분 throttle) | 502 + `no-store`. 클라이언트는 `stale`(직전값) 또는 `error`. **가짜 환율·변동률 생성 금지** |
| 3-1 | 주요 지수 5종(S&P500·나스닥종합·코스피·코스닥·니케이225) 현재가+전일 종가 | Yahoo Finance 비공식 `chart` API(심볼별 개별 요청) | **불필요**(무키, UA 헤더 필요) | **저장 안 함** — 런타임 조회 + 엣지 캐시(완전 성공 15분·부분 성공 5분, 24h SWR) | 표시 부품을 놓은 페이지가 마운트 시 1회 + 탭 복귀(5분 throttle) | 부분 실패는 성공한 지수만 200, 전부 실패는 502+`no-store`. **⚠ 2026-07-28 현재 어떤 페이지에도 마운트되지 않음(미배선)** |
| 4 | 미국 상장 티커 목록(심볼·이름·발행사) | NASDAQ Trader Symbol Directory (`nasdaqtrader.com/dynamic/SymDir/*.txt`) | **불필요** | `utils/TickerParser/output/*.json` (**커밋되는 생성물**, 합계 약 1.19MB) | 수동/빌드 시 `npm run ticker:parse`(=`npm run build` 첫 단계) | 다운로드 실패 시 **커밋된 캐시 파일 사용**(경고 로그) |
| 5 | 커뮤니티 글·댓글·좋아요·프로필·클라우드 저장 | Supabase (PostgREST + Auth) | anon/publishable 키(**공개값, 번들 인라인**) + RLS. 일부 서버 함수만 `SUPABASE_SERVICE_ROLE_KEY` | Supabase Postgres (`posts`·`comments`·`profiles`·`user_app_states`·`shared_snapshots` 등) | 사용자 행동에 따른 실시간 CRUD | env 미설정이면 **커뮤니티 기능 자체가 꺼짐**(앱은 그대로 동작) |
| 6 | 소셜 로그인(카카오·네이버) | `kauth/kapi.kakao.com`, `nid.naver.com`/`openapi.naver.com` | 서버 전용 시크릿(`NAVER_CLIENT_SECRET` 등) | 세션은 Supabase Auth, 프로필은 `profiles` | 로그인 시점 1회 | 실패를 URL에서 걷어내고 배너·GA 이벤트로 표면화 |
| 7 | 사용 행동 계측 | Google Analytics 4 (`googletagmanager.com`) | 측정 ID(공개값 `VITE_GA_MEASUREMENT_ID`) | GA4 서버(우리 저장소 없음) | 런타임 이벤트 전송 | 조용히 비활성(dev·localhost·ID 미설정 시 아예 로드 안 함) |

> **커밋되는 생성물(1·4)과 런타임 조회(3·5·6·7)의 차이가 이 프로젝트 데이터 전략의 핵심**이다 — §9 원칙 참고.

---

## 1. 티커 시장데이터 — Yahoo Finance (무키)

### 무엇을 주는가
한 번의 요청으로 **현재가 + 전체 배당 이력**이 같이 온다.
- `meta.regularMarketPrice` → 시세
- `events.dividends` = `{ "<unixSec>": { amount, date } }` → **ex-date 기준** 배당 이력 (`scripts/tickerRefresh/provider/yahooProvider.ts:24-39`)

### 어디서 호출하는가
- URL 조립 `scripts/tickerRefresh/provider/yahooProvider.ts:86`
  `https://query1.finance.yahoo.com/v8/finance/chart/<티커>?interval=1d&range=10y&events=div`
- 기본 호스트·range 상수 `:17-18` (range `10y` — CAGR 5년 창을 덮으려고 넉넉하게)
- **`User-Agent` 헤더 필수** `:20-22, :151` — 없으면 거부당한다
- 티커당 fetch를 Promise 캐시로 공유해 `fetchQuote`/`fetchDividends`가 요청을 2배로 늘리지 않는다 `:152-161`

### 어떤 필드를 채우는가
스냅샷 엔트리의 필드는 **소유 파이프라인이 갈려 있다**(마음대로 겹쳐 쓰면 안 된다).

| 필드 | 소유 | 파생 방법 | 엔진 입력? |
|------|------|-----------|-----------|
| `initialPrice` | ticker:refresh | `meta.regularMarketPrice` 반올림 | ✅ |
| `dividendYield` | ticker:refresh | TTM 합계 / 가격 (`derive.ts:76 computeTtmYield`) | ✅ |
| `frequency` | ticker:refresh | 지급 간격 추론 (`derive.ts:107 inferFrequency`) | ✅ |
| `observedDividendCagr` | ticker:refresh | 5년 배당 CAGR (`derive.ts:166`) | ❌ **참고 전용** |
| `payoutMonths` | **pay > ex** (아래 §2) | ex-date 또는 지급일에서 추론 (`derive.ts:230`) | ❌ 캘린더용 |
| `payoutMonthsSource` | `'ex'`/`'pay'`/`'none'` | 어느 근거로 월을 정했는지 | ❌ |
| `exToPayLagDays` | **ticker:paydates** | ex→지급일 중앙값 (`derive.ts:295`) | ❌ |
| `estimatedPayDayByMonth` | **ticker:paydates 우선** | 실제 지급일의 월별 중앙일 (`derive.ts:466`) | ❌ 캘린더용 |
| `dividendGrowth` | **파이프라인이 쓰지 않는다** | `expectedTotalReturn - dividendYield`로 **사후 파생** | ✅(파생값) |

- 스키마·경계값: `shared/constants/marketData/marketData.schema.ts:7-13`(bounds), `:22-58`(엔트리 zod)
- 타입 주석에 각 필드의 "참고 전용" 근거가 상세히 적혀 있다: `shared/constants/marketData/marketData.types.ts:14-97`

### 저장 형태
- 단일 파일 `shared/constants/marketData/marketData.generated.json` — 경로는 `scripts/tickerRefresh/snapshotIo.ts:22` **한 곳에만** 정의(두 CLI가 공유)
- 형태: `{ asOf, source, entries: { TICKER: {...} } }`
- **2026-07-27 실측**: `asOf: "2026-07-25"`, `source: "yahoo"`, **엔트리 50종**
- 앱은 빌드 시 이 JSON을 import해 zod로 방어적 파싱한다 — 깨지면 **빈 스냅샷 폴백**(프리셋 값으로 계속 동작): `shared/constants/marketData/index.ts:14-27`
- 화면 표기: `pages/Main/components/MarketDataAsOf/MarketDataAsOf.tsx`가 `MARKET_DATA_AS_OF`를 그대로 보여준다

### 프리셋과의 관계 (오버레이 구조)
```
CURATED_DIVIDEND_UNIVERSE (손큐레이션)
  → applyMarketData(스냅샷 오버레이: initialPrice·dividendYield·frequency 3개만)
  → withCoherentDividendGrowth(dividendGrowth = expectedTotalReturn − dividendYield 재파생)
  → DIVIDEND_UNIVERSE (앱이 쓰는 유니버스)
```
- 오버레이 3필드 화이트리스트: `shared/constants/marketData/applyMarketData.ts:21-25`(명시 나열, 스프레드 아님)
- 순서 고정 이유(오버레이 먼저, 파생 나중): `shared/constants/presets/index.ts:86-103`
- **손입력 값과 생성값의 경계**: `name`·`expectedTotalReturn`·`ticker`는 **큐레이터 소유**로 파이프라인이 절대 못 건드린다(`MarketDataEntry` 타입에 아예 없음 — `marketData.types.ts:14-18`). 스냅샷이 그 키를 실어와도 zod가 strip한다.

### 갱신 트리거
- 워크플로 `.github/workflows/refresh-tickers.yml`
  - 크론 `0 21 1 * *` = **매월 1일 21:00 UTC(2일 06:00 KST)** — `:13`
  - 실행 `npm run ticker:refresh -- --write --provider=yahoo --delay=2000` (`:82`) — 비공식 API 배려로 요청 간 2초
  - 게이트: `npx tsc -b tsconfig.build.json` → `npm run test:ci` → 변경 있을 때만 `chore/refresh-ticker-data` 브랜치 커밋 → PR 생성 → **스케줄 실행은 항상 자동 머지**(= Vercel 프로덕션 배포)
- 수동: `npm run ticker:refresh -- [--write] [--only=SCHD,JEPI] [--provider=yahoo|fmp] ...` (`scripts/tickerRefresh/cli.ts:22`)
  - **쓰기는 opt-in** — `--write` 없으면 dry run (`cli.ts:91-97`)
- 대체 공급자: FMP(`--provider=fmp` + `FMP_API_KEY`). 무료 티어는 이 유니버스에 **사용 불가**로 실측된 이력이 있어 유료 키 보유자 전용이다(`cli.ts:28-44`).

### 아웃라이어 가드
`scripts/tickerRefresh/guards.ts`
- **하드 리젝트**(값을 안 쓰고 이전 값 유지) — `validateEntry:32`
  - zod 위반(필수 필드 결측/NaN, `dividendYield` 0~30% 밖, `observedDividendCagr` ±50% 밖, `initialPrice` ≤ 0, `frequency` 미지 값)
  - **직전 가격 대비 ±50% 초과 이동** `:44-53` (액면분할 또는 불량 데이터 → 사람이 확인해야 한다는 판단)
- **소프트 경고**(값은 쓰되 리포트에 남김) — `checkDerivedDividendGrowth:70`: 갱신된 배당수익률이 큐레이션 `expectedTotalReturn`을 넘어 파생 성장률이 음수가 되는 경우(커버드콜 펀드면 정상, 배당성장 ETF면 데이터/큐레이션 오류)
- 런 전체 판정: 불량률(리젝트+실패) > 30%면 `fail` → CI 중단 (`refresh.ts:98`, `report.ts:26-30`)

### 🔴 함정 — "한 번도 갱신되지 않는 종목"
가드는 **리젝트된 티커의 이전 값을 절대 자동 교체하지 않는다.** 그런데 여기서 "이전 값"은 스냅샷에 엔트리가 없을 때 **프리셋의 손입력 `initialPrice`** 다. 프리셋 가격이 현재가와 50% 이상 벌어져 있으면 **매달 영구히 같은 이유로 리젝트**된다(새로 생긴 이상치가 아니라 구조적 사각지대).

**2026-07-27 실측**: 유니버스 68종 중 스냅샷 엔트리는 50종 → **18종이 단 한 번도 갱신된 적이 없다.**

```
QQQ, VUG, NOBL, CGDV, HDV, SMH, AIQ, JNJ, ENB, AVGO, NVDA, ADI, LRCX, KLAC, AMAT, TSM, ASML, VRT
```

근거 예시(프리셋 값 vs 현실): `NVDA initialPrice: 900` (`shared/constants/presets/aiInfraEtfsAndStocks.ts:59`), `AVGO: 1300` (`:68`), `QQQ: 430` (`shared/constants/presets/coreIndexEtfs.ts:41`) — NVDA·AVGO·LRCX·KLAC은 2024년 액면분할과도 정합한다.

파생 함정 2가지:
1. **화면의 `MARKET_DATA_AS_OF`(2026-07-25)는 이 18종에는 해당하지 않는다.** 사용자는 전 종목이 그 날짜 기준이라고 읽게 된다.
2. CLI에 가드 우회 옵션이 없다 — `--only`로 재실행해도 같은 임계값을 탄다. **해법은 사람이 프리셋 `initialPrice`(필요하면 `dividendYield`)를 한 번 수기 리베이스**하는 것뿐이다. 그 뒤로는 정상적인 월간 변동(<50%)만 보게 된다.
   - 참고: 2026-07-23 기록에는 19종이었고 그 뒤 TXN이 편입돼 현재 18종이다(가격이 가드 안으로 들어오면 자연히 해소된다는 증거).

### 그 밖의 주의사항
- **비공식 API라 SLA가 없고 응답 형태가 예고 없이 바뀔 수 있다.** 방어는 zod → `ProviderError('malformed')` → "이전 값 유지"로 감쇠 (`yahooProvider.ts:113-121`).
- ~~**프리셋 파일 간 티커 키 중복 5건**~~ → **2026-07-31 해소.** `AVGO·TSM·ASML·ETN·VRT`는 여전히 두 프리셋(`semiconductorDividendGrowthPortfolio.ts` · `aiInfraEtfsAndStocks.ts`)에 **키로는** 들어 있지만, 정의는 `aiInfraEtfsAndStocks.ts` **한 곳뿐**이고 반도체 쪽은 그 객체를 참조한다. 그래서 "스프레드 순서상 어느 쪽이 이기나"라는 질문 자체가 사라졌고, 수기 리베이스는 **아무 쪽 파일을 열어도 같은 정의로 이어진다**. 재발 방지 가드 = `test/presets/presetTickerSingleSource.test.ts`(중복 키는 반드시 같은 객체 참조). ⚠ 해소 전 두 정의는 값이 실제로 갈라져 있었다(예: `expectedTotalReturn` AVGO 15↔14 · TSM 13↔11 · ASML 14↔11 · ETN 13↔12 · VRT 16↔14, ASML `frequency` 는 `quarterly`↔`annual`) — 죽어 있던 쪽은 **반도체 파일**이다.
- `scripts/tickerRefresh/partition.ts`(월~금 5버킷 분할)와 CLI의 `--bucket` 옵션은 **살아 있지만 현재 워크플로는 쓰지 않는다** — 주간 5버킷 → 월간 단발 + `--delay` 로 설계가 바뀐 잔재다. `partition.ts:12-15`의 "요일→버킷 매핑은 워크플로에 있다"는 주석은 **현행 워크플로와 어긋난다**(문서 드리프트).
- 스냅샷 쓰기(`writeSnapshotFile`)는 **무검증 직렬화**다 — 불량 엔트리 하나가 다음 파스에서 스냅샷 **전체**를 EMPTY 폴백으로 떨어뜨린다(`snapshotIo.ts:34`, `shared/constants/marketData/index.ts:16-19`).

---

## 2. 배당 지급일(pay dates) — Alpha Vantage (키 필요)

### 왜 별도 파이프라인인가
Yahoo `chart`는 **ex-date만** 준다. ex-date와 실제 입금일은 다르고, 월말 ex-date는 **다음 달**에 지급되기도 해서 캘린더가 한 달을 통째로 틀린다. Alpha Vantage `DIVIDENDS`는 이 유니버스 전체에 대해 **payment_date를 주는 유일한 소스**로 확인됐다(Nasdaq 무키 API는 나스닥 상장만 서빙 — SCHD·VYM·VIG·JEPI·O·SPY가 전부 "not available"). 근거 주석 `scripts/tickerRefresh/provider/alphaVantageProvider.ts:6-19`.

### 어디서 호출하는가
- `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=<티커>&apikey=<키>` — `alphaVantageProvider.ts:112`
- 키 읽기: `ALPHAVANTAGE_API_KEY` (환경변수 우선, 없으면 레포 루트 `.env` 직접 파싱) — `scripts/tickerRefresh/snapshotIo.ts:46-69`
  - ⚠ **`VITE_` 접두사를 붙이면 안 된다** — 브라우저 번들에 인라인돼 키가 공개된다. vite-node가 non-`VITE_` 변수를 `process.env`에 안 올려서 `.env`를 손파싱하는 이유가 이것이다.

### 쿼터가 곧 설계 제약
- 무료 티어 **하루 25요청** — `ALPHA_VANTAGE_FREE_DAILY_LIMIT = 25` (`alphaVantageProvider.ts:41`)
- ⚠ **키가 아니라 IP 기준으로도 걸린다**(실측: 키 2개를 한 머신에서 써도 합계 25에서 멈춤). "키를 더 만들면 된다"는 이미 시도됐고 **안 통한다**.
- Alpha Vantage는 쿼터 초과·잘못된 키를 **HTTP 200 + `Information`/`Note`/`Error Message` 필드**로 알린다 → 파싱 **전에** 잡아야 한다(`advisoryOf:63`). 안 잡으면 "이 티커는 배당이 없다"로 오인해 **정상 데이터를 빈 값으로 덮어쓴다**.
- 로그에 키가 새지 않게 벤더 메시지에서 키를 제거한다(`redactKey:80`) — 쿼터 안내문이 **API 키를 그대로 본문에 적어 보내기** 때문이다.

### 크론 순회 방식 (하루 25개를 누구에게 쓰나)
`scripts/tickerRefresh/payDatesQueue.ts`
1. **미정착(unsettled) 우선** — `payoutMonthsSource`가 `'pay'`도 `'none'`도 아닌 티커 (`isSettled:9`)
2. 각 그룹 안에서 **UTC 날짜 기준 1칸씩 회전**(`rotationDayOf:33`, `prioritize:53`) — 회전이 없으면 그룹이 25개를 넘는 순간 알파벳 앞쪽만 영원히 이기고 뒤쪽은 절대 조회되지 않는다. 상태 파일 없이 날짜만으로 결정(무상태).
3. `--only`(사람이 지목)는 회전을 건너뛰고 준 순서를 지킨다
4. 예산만큼 자르고(`payDatesCli.ts:128-129`) 실행 — 요청 간 400ms(`:37`)
5. **첫 쿼터 에러에서 즉시 중단**하고 남은 개수를 보고 → 내일 이어감 (`:161-165`)

### `'none'` 마커
배당 이력이 정말 하나도 없는 티커는 `payoutMonthsSource: 'none'`으로 **한 번만** 기록한다(`payDates.ts:68-83`). 없으면 그 종목이 미정착 그룹 맨 앞에 영원히 앉아 매일 쿼터를 먹는다. `'none'`은 **`payoutMonths`가 없는 엔트리에만** 붙는다는 불변식이 있다(`marketData.types.ts:70-76`).

### 데이터 보호 규칙 (전부 "좋은 데이터를 잃지 않기" 위한 것)
- 빈 응답이 **실제 월을 덮어쓰지 못한다** (`payDates.ts:68-72` → `skipped`)
- 월 추론 실패 = `skipped`, 값 변화 없음 = `unchanged` — 둘 다 파일을 쓰지 않는다(`payDatesCli.ts:200-203`: `updated`+`marked-none`만 쓰기 트리거)
- 스냅샷에 없는 티커(`--only` 오타/신규)는 **fetch 전에** 걸러낸다(`isKnownTicker`, `payDatesQueue.ts:22`) — 안 그러면 가격·주기 필수 필드가 빠진 반쪽 엔트리가 기록돼 **다음 읽기에서 스냅샷 전체가 EMPTY로 떨어진다**. 신규 티커는 **`ticker:refresh`가 엔트리를 먼저 만들어야** paydates 대상이 된다.
- 반대 방향 보호: 월간 가격 갱신이 `'pay'` 소스 데이터를 **ex 추론값으로 덮어쓰지 않는다**(`refresh.ts:221-239`), `estimatedPayDayByMonth`도 그대로 이월한다(`refresh.ts:246-267`).

### 갱신 트리거
`.github/workflows/refresh-paydates.yml`
- 크론 `30 21 * * *` = **매일 21:30 UTC(06:30 KST)** — 월간 가격 갱신(21:00 UTC)과 **30분 차이**를 둬 같은 파일을 두고 경합하지 않게 했다(`:19-21`)
- 시크릿 `ALPHAVANTAGE_API_KEY` (`:78`), 실행 `npm run ticker:paydates -- --write` (`:89`)
- 이 워크플로는 **가격을 절대 건드리지 않는다**(`ticker:refresh` 미실행) — `:13-16`
- 게이트·자동 머지 방식은 §1과 동일

### 커버리지 (2026-07-27 실측)
| `payoutMonthsSource` | 종목 수 |
|---|---|
| `'pay'` (실제 지급일 기반, 권위 있음) | 21 |
| `'ex'` (ex-date 추론 — 월 경계에서 한 달 틀릴 수 있음) | 28 |
| `'none'` (배당 이력 없음 확인) | 0 |
| 필드 없음 (`payoutMonths` 자체가 없음 — ANET) | 1 |

`estimatedPayDayByMonth`를 가진 엔트리는 21종(= pay 소스 종목과 일치). 나머지 29종은 캘린더에서 **"지급일 미상"** 으로 다뤄야 한다.

### 소비처
- 배당 캘린더: `pages/DividendCalendar/utils/calendarSchedule.ts:30`
- 포트폴리오 시장정보: `shared/lib/portfolio/PortfolioMarketInfo.ts:29-32, :118` — ⚠ Portfolio 도메인은 2026-07-27 현재 다른 트랙에서 수정 중이라 **행 번호가 이동했을 수 있다**
- ⚠ **엔진은 이 필드들을 읽지 않는다.** 시뮬레이션은 `frequency`만으로 지급을 분산한다 — 여기를 엔진 입력으로 바꾸면 **기존 결과가 전부 이동**한다(`marketData.types.ts:41-49`).

### 🔴 함정 — 문서화 공백 (키 자체는 존재함)
**운영 중인 레포 루트 `.env`에는 `ALPHAVANTAGE_API_KEY`·`FMP_API_KEY`가 둘 다 들어 있다**(2026-07-27 확인). 문제는 **어디에도 그 사실이 적혀 있지 않다**는 것 — `.env.example`·`docs/vercel/README.md`·`docs/supabase/README.md` 전부 0건(grep 실측)이었다. `.env`는 gitignore 대상이라 새로 클론한 사람에게는 전달되지 않으므로, 코드를 읽어야만 이 키의 존재를 알 수 있었다.

→ **2026-07-27 조치**: `.env.example`에 두 키를 주석과 함께 추가했다. 신규 환경 세팅 시 `npm run ticker:paydates`가 조용히 실패하는 경로를 막는다.

---

## 3. 환율(FX) — Yahoo Finance 1순위 + open.er-api.com·frankfurter 폴백 (무키, **표시 전용**)

### 무엇을 주는가
USD→KRW 환율 1개, **실제 갱신 시각**, 그리고 (있으면) **전일 종가**. 응답 계약:
`{ rate, base: 'USD', quote: 'KRW', asOf, previousClose? }` (`server/handlers/Fx/Fx.ts:64-74`).
- `previousClose`는 **선택 필드**다 — 전일 종가를 안 주는 폴백 공급자가 이겼거나, 이 필드가 없던 구버전 응답이 엣지 캐시에 최대 24시간(SWR) 남아 있으면 없다. 없어도 실패가 아니라 **정상 경로**이고, 소비자는 변동률만 생략한다(`exchangeRate.ts:21-27`).
- **하위 호환**: 기존 필드(`rate`/`base`/`quote`/`asOf`)는 그대로이고 `previousClose`는 **추가만** 됐다 — 구버전 캐시 응답도 그대로 정상 파싱된다.

### 어디서 호출하는가 (서버 프록시)
`server/handlers/Fx/Fx.ts` → 배포 경로 `/api/fx`
1. **1순위 Yahoo chart `KRW=X?range=2d&interval=1d`** (`:138, :145-161`) — `meta.regularMarketPrice`(당일)와 `meta.chartPreviousClose`(전일 종가)를 **한 응답**으로 준다(두 번째 요청 불필요). as-of는 `meta.regularMarketTime`(unix초). `User-Agent` 헤더 필수(`:134-136`, 없으면 거부당한다).
2. **폴백1 `open.er-api.com/v6/latest/USD`** (`:164-174`) — `result: 'success'` 요구, as-of는 `time_last_update_utc`. **전일 종가는 주지 않는다**(rate-only).
3. **폴백2 `api.frankfurter.dev/v1/latest?base=USD&symbols=KRW`**(ECB, `:177-184`) — as-of는 `date`(YYYY-MM-DD). 역시 rate-only.
   - ⚠ 구 도메인 `api.frankfurter.app`은 **301 리다이렉트**라 서버 fetch에서 위험 → **신 도메인을 직접** 부른다
4. 셋 다 실패 → **가짜 환율을 지어내지 않는다.** `{ error: 'fx_unavailable' }` + HTTP 502 + `no-store` (`:202-205`)

**채택 순서(`:197-200`)**: ①전일 종가까지 완비된 Yahoo → ②er-api(rate only) → ③전일 종가 없는 Yahoo(rate only) → ④frankfurter(그때만 추가 4초를 쓴다).

**공급자 순위가 바뀐 근거(2026-07-28 확정)**: 변동률의 두 값(당일·전일)은 **같은 출처·같은 스냅샷**이어야 한다. 공급자를 섞으면 상시 오차(mid-market vs close, 0.1~0.3%p)가 하루치 변동폭과 같은 자릿수라 **없는 변동을 지어내게 된다**(§9 원칙 3·4 위반). 그래서 전일 종가까지 함께 주는 Yahoo가 1순위로 올라갔고, 기존 두 rate-only 공급자는 폴백으로 강등됐다 — 가용성은 오히려 3중으로 늘었다(폴백이 이기면 전일 종가만 없고 환율은 정상 표시).

- **1순위(Yahoo)·폴백1(er-api)은 `Promise.allSettled` 병렬**(`:192-193`) — 순차로 쌓으면 4초×3=12초라 함수 한도 위험. 병렬 + 필요할 때만 폴백2를 순차로 붙여 **worst case 8초 유지**(기존과 동일).
- upstream 타임아웃 각 4초(`UPSTREAM_TIMEOUT_MS = 4000`, `:83`) — 하나가 매달려도 함수 전체가 매달리지 않게
- **브라우저가 직접 부르지 않는 이유**: CORS 무보장 / 방문자 수만큼 upstream을 때림 (`:9-16`)

### 캐시 (변경 없음)
`Cache-Control: public, max-age=0, s-maxage=21600, stale-while-revalidate=86400` (`CACHE_SUCCESS`, `:79`, 적용부 `:207`)
- `s-maxage=21600`(6시간): 방문자 트래픽과 무관하게 upstream 조회를 6시간당 1회로 묶는다
- `stale-while-revalidate=86400`(24시간): upstream이 흔들려도 하루 동안 마지막 성공본을 즉시 서빙
- **실패 응답만 `no-store`**(`CACHE_FAILURE`, `:80`) — 실패를 엣지에 박제하지 않는다(다음 요청이 즉시 재시도)

### 전일 대비 변동률 (계산·표시)
- 순수 계산 `computeFxChange(rate, previousClose)` — `shared/lib/fx/fxChange.ts:49-58`. `previousClose`가 없거나 유한 양수가 아니면 `null`(변동률 생략, 0%로 위장 금지). **반올림하지 않은 원값**을 돌려주고, 보합(`flat`) 판정만 표시 정밀도 기준으로 한다 — `Math.abs(percent) < 0.005`(`10 ** -2 / 2`). 부호는 숫자가 아니라 `direction`에서만 뽑으므로(`formatChangePercent`) 보합인데 `-0.00%`로 찍히는 일이 없다. ⚠ `percent`를 직접 `toFixed(2)`하면 보합 하락(-0.0027 등)이 `"-0.00"`이 되니 반드시 포맷터를 쓸 것.
- 문자열화는 공용 포맷터 `formatChangePercent`(`shared/utils/percent.ts:18-21`)가 맡는다 — §3-1(지수)의 `computeIndexChange`도 같은 포맷터를 쓴다(표기 중복 방지).
- 위젯 렌더링: `components/ExchangeRateWidget/ExchangeRateWidget.tsx:60` — "전일 대비" 라벨 고정(국내 증권 앱 관용 표기, `:34`), 스크린리더용 문장은 `changeAria`(`:37-40`)가 별도로 읽는다.

### 클라이언트 상태 (4종)
`shared/lib/fx/exchangeRate.ts:31-44`
| status | 의미 | 화면 |
|---|---|---|
| `loading` | 첫 조회 중 | 스켈레톤 + `aria-busy` |
| `success` | 최신값 | 값 + as-of (+ 변동률, 있으면) |
| `stale` | 직전 성공값 있음, 최근 갱신 실패 | 값 + **실제** as-of + 옅은 '업데이트 실패' 표식 |
| `error` | 보여줄 값 없음 | 중립 안내(**가짜 환율 금지**) |

- 응답 정규화 `parseFxRate:56-69` — 형태가 어긋나면 `null`. `previousClose`는 유한 양수일 때만 실리고, 아니면 조용히 키를 뺀다(환율 자체는 버리지 않는다).
- 상태 원자 `jotai/snowball/atoms/fx/index.ts:15`(비영속 in-memory), 결과 반영 `:23-31`(직전 성공값을 atom에서 되읽어 stale 강등을 방지)
- 조회 드라이버 `useFxRateSync:47` — **동시에 마운트되는 곳이 하나여야 한다.** 현재 마운트 지점은 `pages/Main/Main.tsx:12`와 `pages/Portfolio/PortfolioPage/PortfolioPage.tsx:52` 둘이지만 **라우트가 배타적**이라 동시에 살지 않는다.
- 탭 복귀 시 재조회 최소 간격 10분(`:34`), 실패는 GA `OPERATION_ERROR{operation:'fx_fetch'}`로 남긴다(`:72-77`)
- 위젯: `components/ExchangeRateWidget/ExchangeRateWidget.tsx:53` — 조회하지 않고 구독만 한다

### 🔴 표시 전용 원칙 (절대 규칙)
환율과 전일 대비 변동률은 **시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.**
근거: `shared/lib/fx/exchangeRate.ts:8`, `jotai/snowball/atoms/fx/index.ts:13`, `server/handlers/Fx/Fx.ts:14-16`.
이 규칙을 깨면 (a) 같은 저장 데이터를 나중에 열었을 때 결과가 달라지고 (b) 공유 링크가 환율 시점에 종속된다. 달러 표시는 `rate`가 있는 상태(`success`/`stale`)에서만 가능하도록 단일 지점(`canUseUsdAtom`)에서 판정한다.

### 주의사항
- `/api/fx`는 **앱 배럴을 일절 import하지 않는다.** 모듈 스코프에서 `import.meta.env`를 읽는 코드를 끌어오면 Vercel Node 런타임에서 **모듈 평가 단계에 즉사**(try/catch로도 못 잡음)한다 — `Fx.ts:1-6`.
- 웹 표준 `handler`를 그냥 default export하면 `res.end()`가 없어 **무응답 타임아웃**이 된다. `toNodeHandler` 어댑터가 필수(`:211`).

---

## 3-1. 주요 지수 5종 — Yahoo Finance (무키, **표시 전용, 2026-07-28 현재 미배선**)

### 무엇을 주는가
국내외 주요 지수 5종의 현재가 + (있으면) 전일 종가. 레지스트리(`shared/lib/marketIndices/registry.ts:20-26`)가 심볼·표시 순서·라벨의 **단일 출처**다 — 서버·클라이언트·표시 부품 세 곳이 이 배열 하나에서 파생된다.

| 심볼(Yahoo 표기) | 라벨 |
|---|---|
| `^GSPC` | S&P 500 |
| `^IXIC` | 나스닥 종합 |
| `^KS11` | 코스피 |
| `^KQ11` | 코스닥 |
| `^N225` | 니케이225 |

응답 계약(`shared/lib/marketIndices/quotes.ts:36-43`): `{ asOf, requested: MarketIndexSymbol[], indices: MarketIndexQuote[] }`. 지수 한 종의 시세는 `{ symbol, price, previousClose?, currency?, asOf? }`(`:20-28`) — `previousClose`·`currency`·`asOf`는 **upstream이 준 경우에만** 실린다(없으면 키 자체가 없다).

### 어디서 호출하는가 (서버 프록시)
`server/handlers/MarketIndices/MarketIndices.ts` → 배포 경로 `/api/market-indices`
- 심볼별로 `https://query1.finance.yahoo.com/v8/finance/chart/<심볼>?range=2d&interval=1d`(`CHART_BASE_URL`, `:52`)를 개별 호출 — `meta.regularMarketPrice`(현재가) + `meta.chartPreviousClose`(전일 종가)를 **한 번의 요청**으로 얻는다(`readQuote:88-106`).
- 심볼의 `^`는 `encodeURIComponent`로 `%5E` 인코딩된다(`:111`).
- `User-Agent` 헤더 필수(`:55-56`, 브라우저 형태가 아니면 거부당한다) — 티커 갱신 파이프라인(`yahooProvider.ts`)과 동일 제약.
- **5심볼 `Promise.allSettled` 병렬**(`:132`) — 순차면 최악 5×4초=20초라 함수 실행 한도에 닿는다.
- upstream 타임아웃 심볼당 4초(`UPSTREAM_TIMEOUT_MS = 4000`, `:63`)
- 이 모듈이 import하는 것은 어댑터(`@/shared/lib/server`)와 순수 레지스트리(`@/shared/lib/marketIndices`) 둘뿐이다 — Fx.ts와 같은 이유로 앱 배럴·`import.meta.env`를 끌어오면 Vercel Node 런타임이 모듈 평가 단계에서 즉사한다(`MarketIndices.ts:1-8`). 이 순수성은 `test/api/marketIndices.test.ts`가 기계적으로 검증한다.

### 캐시
- **완전 성공** `public, max-age=0, s-maxage=900, stale-while-revalidate=86400`(`CACHE_SUCCESS`, `:58`) — 15분. 용도가 랜딩의 **참고 시세 스트립**이지 트레이딩 도구가 아니라서, 15분이면 장중 갱신감은 주면서 upstream 부담을 하루 96 invocation × 5심볼 = 480 요청으로 묶는다(5분이면 1,440). 장이 닫힌 시간엔 값이 안 움직이므로 15분은 상한이지 낭비가 아니다. FX가 6시간인 것과의 차이는 **지수는 장중에 계속 움직인다**는 점.
- **부분 성공** `public, max-age=0, s-maxage=300, stale-while-revalidate=86400`(`CACHE_PARTIAL`, `:59`) — 5분. 빠진 심볼이 15분간 엣지에 박제되지 않고 빨리 자가치유되게.
- **실패** `no-store`(`CACHE_FAILURE`, `:60`) — 실패를 엣지에 박제하지 않는다(다음 요청이 곧바로 재시도).

### 실패 처리
- **하나라도 성공하면 200**이고, 성공한 지수만 싣는다(`indices`) — 실패한 심볼은 **키 자체를 생략**한다(§9 원칙 4 "모르면 비운다"). `requested`(조회를 시도한 전체 심볼)와 `indices`(실제로 값을 받은 심볼)의 차이로 클라이언트가 결손을 안다(`MarketIndices.ts:143-154`).
- **전부 실패 → 502 + `no-store` + `{ error: 'market_indices_unavailable' }`**(`:138-141`) — FX의 `fx_unavailable`과 동형.
- **저장하지 않는다** — 런타임 조회 + 엣지 캐시일 뿐, `marketData.generated.json`(티커 파이프라인의 커밋 생성물)과는 무관하다.

### 클라이언트 (상태 4종, FX와 동형)
- 상태 계약 `MarketIndicesView`(`shared/lib/marketIndices/quotes.ts:52-56`) — `loading`/`success`/`stale`/`error`.
- 비영속 in-memory atom `marketIndicesViewAtom`(`jotai/snowball/atoms/marketIndices/index.ts:19`), 결과 반영 `applyMarketIndicesFetchResultAtom`(`:27-41`, 직전 성공값을 atom에서 되읽어 stale 강등 방지).
- 조회 드라이버 `useMarketIndicesSync`(`:60`) — 탭 복귀 시 재조회 최소 간격 5분(`REFRESH_MIN_INTERVAL_MS`, `:47`, FX의 10분보다 짧다 — 엣지 캐시가 15분이라 그보다 촘촘히 물어도 얻는 게 없다는 판단과는 별개로 탭 복귀 자체는 더 자주 허용). 실패는 GA `OPERATION_ERROR{operation:'market_indices_fetch'}`로 남긴다(`:85-89`).
- 순수 변동률 계산 `computeIndexChange(price, previousClose)`(`shared/lib/marketIndices/change.ts:36-45`) — `previousClose`가 없으면 `null`(생략), **반올림하지 않은 원값**을 돌려주고 보합만 표시 정밀도(`Math.abs(percent) < 0.005`)로 판정한다. FX의 `computeFxChange`와 **문자 그대로 같은 규칙**이다(엡실론 `10 ** -2 / 2`·원값 저장·부호는 `direction`에서만) — 서버 핸들러가 import하는 이 모듈의 순수성을 지키려고 두 벌로 **의도적 중복**을 유지하므로, 규칙이 갈리지 않는지는 `test/shared/changeDirectionParity.test.ts`가 두 함수의 `direction`·`percent`·`formatChangePercent` 결과 동등성으로 강제한다(보합 경계 `±0.005%` 동률 포함).
- 표시 부품 `components/MarketIndexStrip/MarketIndexStrip.tsx:105` — 프롭 없이 `marketIndicesViewAtom`만 구독, 조회는 하지 않는다. 지수는 금액이 아니라 포인트라 `currency`를 화면에 쓰지 않는다(`MarketIndexStrip.utils.ts:7-9`).

### 🔴 주의사항 — 현재 마운트 지점 0곳(미배선)
표시 부품(`components/MarketIndexStrip`)과 조회 드라이버(`useMarketIndicesSync`)는 완성됐지만, **이 스트립을 실제로 그리는 페이지가 아직 없다** — 최종 자리인 **5단계 랜딩 히어로 하단**이 만들어지지 않았다(`MarketIndexStrip.tsx:93` 주석에 명시). 그래서 2026-07-28 현재 이 데이터는 어떤 사용자에게도 보이지 않는다. 붙일 때는 그 페이지가 `useMarketIndicesSync()`를 **한 번만** 호출해야 한다(둘 이상 마운트하면 중복 조회, FX와 동일 규약).

---

## 4. 상장 티커 목록 — NASDAQ Trader Symbol Directory (무키)

### 무엇을 주는가
미국 상장 심볼 → `{ name, issuer }` 매핑. 자동완성 검색용 사전이다.

### 어디서 호출하는가
`utils/TickerParser/generate.mjs:6-7`
- `https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt`
- `https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt`

파싱은 `utils/TickerParser/parser.mjs`(파이프 구분 TXT), 발행사 추출 규칙은 `issuerRules.mjs`.

### 저장 형태 (커밋되는 생성물)
| 파일 | 크기(2026-07-27 실측) |
|---|---|
| `utils/TickerParser/output/nasdaq-listed.json` | 512,725 B |
| `utils/TickerParser/output/other-listed.json` | 706,832 B |

### 갱신 트리거
- `npm run ticker:parse` (= `node utils/TickerParser/generate.mjs`)
- **`npm run build`의 첫 단계로 항상 실행된다** (`package.json` scripts: `ticker:parse && tsc -b … && api:check && vite build`)
  → 즉 **빌드할 때마다 이 두 JSON이 새로 써진다.** 커밋 시 의도치 않은 diff가 보이면 이것이 원인이다.
- 크론 없음(별도 워크플로 없음)

### 실패·한계
다운로드 실패 시 **커밋된 캐시 파일을 그대로 읽어 계속 진행**한다(경고 2줄 출력, `generate.mjs:31-50`). 캐시도 없으면 그때만 에러. → 오프라인·CI 네트워크 장애에서 빌드가 죽지 않는다.

### 앱에서 lazy 로드되는 이유
합계 약 1.19MB라 **프리셋만 쓰는 사용자가 첫 로드에 받을 이유가 없다.**
- 소비처: `pages/Main/components/TickerModal/TickerModal.view.tsx:4-5`, 검색 행 사전 구축 `:43`
- 지연 로딩: `pages/Main/Main.view.tsx:47` `lazy(() => import("./components/TickerModal"))`
- ⚠ **함정(주석에 박제됨)**: 예전에 `MODE === "test" ? StaticImport : lazy(...)` 형태였는데, 그 정적 import 한 줄이 코드 스플리팅을 **통째로 무력화**했다(롤업은 정적·동적으로 동시 import되는 모듈을 부모 청크에 넣는다). 같은 이유로 `./components` 배럴에서도 TickerModal re-export를 뺐다 — `Main.view.tsx:33-46`.
- ⚠ **현재 검색 탭은 꺼져 있다**: `SHOW_SEARCH_TAB = false` (`TickerModal.view.tsx:41`). 그런데 `SEARCH_ROWS`는 **모듈 스코프에서 무조건 구축**된다(`:43`) — 즉 모달을 열면 검색 UI가 없어도 1.19MB JSON과 사전 구축 비용이 발생한다.

---

## 5. Supabase — 커뮤니티 + 클라우드 동기화

### 서버에 실제로 있는 데이터
`supabase/migrations/` 실측 (2026-07-23 마이그레이션에서 `scenarios*` → `posts*`로 개명):

| 테이블 | 내용 |
|---|---|
| `public.posts` | 커뮤니티 글(제목·본문·공개여부·카테고리·`sim_summary`·payload) |
| `public.post_likes` / `public.post_views` | 좋아요 / 조회수 |
| `public.comments` / `public.comment_likes` | 댓글 트리 / 댓글 좋아요 |
| `public.profiles` | 표시 이름·아바타·관리자 플래그 |
| `public.user_app_states` | **클라우드 자동저장 슬롯**(1인 1개, payload ≤ 128KB) |
| `public.shared_snapshots` | `?s=` 공유 스냅샷(jsonb, ≤ 64KB) |
| `private.app_config` | 서버 전용 설정 |

### 클라이언트 키 노출 방식
- `VITE_SUPABASE_URL` + (`VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY`) — `shared/lib/supabase/client.ts:43-49`
- anon/publishable 키는 **설계상 공개값**이다(번들에 인라인). 이 키로 무엇을 할 수 있는지는 **전적으로 RLS가 정한다**.
- 🚫 `SUPABASE_SERVICE_ROLE_KEY`는 **절대 `VITE_` 금지** — RLS를 통째로 우회한다. 서버 함수(`api/account-delete.js`, `api/naver-auth.js`)만 `process.env`로 읽는다.
- **둘 다 없으면 커뮤니티가 통째로 꺼지고 앱은 100% 동일하게 동작한다**(`isCommunityEnabled`, `client.ts:55`). 이게 이 앱의 기본 배포 형태다 — 백엔드 없이 IndexedDB + 공유 URL.
- `@supabase/supabase-js`는 **동적 import만** — 커뮤니티를 안 쓰는 사용자의 초기 번들에 SDK가 들어가지 않게(`client.ts:11-14`).

### 서버 함수는 SDK를 안 쓴다
`api/post-html.js`·`api/post-list.js`·`api/sitemap.js`는 supabase-js를 끌어오지 않고 **anon 키로 PostgREST를 직접 REST 호출**한다(`shared/lib/og/postsRest.ts:4-16`). 이유는 §8과 같다 — 앱 배럴을 끌어오면 서버 함수가 죽는다.
- 사이트맵: 공개 글 목록을 조회해 `urlset` 생성. **조회 실패 시 5xx가 아니라 빈 urlset을 200으로** 반환하고 `no-store`를 건다 — 서치콘솔이 "가져올 수 없음"으로 표시하고 재시도 간격을 늘리는 것을 피하려고(`server/handlers/Sitemap/Sitemap.ts:96-108`).

### 클라우드 동기화(cloudWorkspaceSync)와의 관계
- 로컬(IndexedDB) autosave가 **정본**이고, `user_app_states`는 그 미러다. payload 스키마는 **로컬과 동일**(`PersistedAppStatePayload`).
- 세션 시작 시 3-way(로컬/클라우드/로컬 base 해시) 판정으로 FF 적용·FF push·충돌 모달을 가른다. base 해시는 DB가 아니라 **localStorage에 per-user로** 산다(`snowball:cloud-sync-base:<userId>`).
- ⚠ **저장 payload·공유 URL은 사용자 자산**이다 — 스키마를 바꾸면 로컬↔클라우드↔JSON↔공유링크 **왕복 테스트가 필수**다.
- ⚠ 이 영역은 함정이 많다(계정 전환 시 조용한 FF push로 인한 데이터 소실 등). 손대기 전 `.claude/knowledge/pitfalls.md` "클라우드 동기화 충돌 화해" 절을 읽을 것.

---

## 6. 소셜 로그인 OAuth (외부 호출)

| 공급자 | 엔드포인트 | 근거 |
|---|---|---|
| 카카오 | `https://kauth.kakao.com/oauth/token`, `https://kapi.kakao.com/v2/user/me` | `shared/lib/community/kakaoAuth.ts:57, :60` |
| 네이버 | `https://nid.naver.com/oauth2.0/token`, `https://openapi.naver.com/v1/nid/me` | `shared/lib/community/naverAuth.ts:47, :50` |

- 서버 함수 `server/handlers/KakaoAuth/KakaoAuth.ts:170, :205` / `server/handlers/NaverAuth/NaverAuth.ts:119, :129`에서 호출 → Supabase 세션 발급
- 필요한 서버 전용 시크릿: `NAVER_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (`.env.example`에 기재됨). 공개값 `VITE_NAVER_CLIENT_ID`가 없으면 네이버 버튼은 "준비 중"으로 표시된다.
- ⚠ **카카오가 주는 프로필 이미지 URL은 `http://`(비-https)** 라 `profiles.avatar_url ~ '^https://'` CHECK를 위반해 가입 트리거가 실패한 사고 이력이 있다 → 지금은 아바타를 저장하지 않는다(`KakaoAuth.ts:218`, 마이그레이션 `20260728000000_fix_kakao_profile_avatar.sql`).

---

## 7. GA4 애널리틱스

### 수집 방식
- 측정 ID: `VITE_GA_MEASUREMENT_ID`(공개값, `.env.example`에 실제 값이 커밋돼 있다 — 측정 ID는 브라우저에 노출되는 공개 값이다)
- 로더: `shared/lib/analytics.ts:210-231` — `googletagmanager.com/gtag/js`를 동적 `<script>`로 주입, `send_page_view: false`(수동 전송)
- **활성 조건**(`:20-21`): 측정 ID 존재 **AND** `!import.meta.env.DEV` **AND** localhost 계열 호스트가 아님 → 즉 **Vercel 프로덕션 도메인에서만** 전송된다(로컬 테스트로 지표가 오염되지 않게)
- 페이지뷰 `sendPageView:233`(`page_type`에 pathname을 실어 라우트별 분석), 이벤트 `trackEvent:250`

### 수집 항목
`ANALYTICS_EVENT` 택소노미(`shared/lib/analytics.ts:39`, **44개 이벤트** — 이벤트마다 "용도" 주석이 붙어 있는 게 이 파일의 규약이다). 예: `modal_view`, `cta_click`, `ticker_create_started`, `ticker_saved`, `preset_applied`, `investment_setting_changed`, `operation_error`(환율 조회 실패도 여기로) 등.

### 주의사항
- `analytics.ts`는 **모듈 최상단에서 `import.meta.env`를 읽는다.** 서버 번들(`api/og.js` 등)에 실릴 수 있는 경로에서는 **정적 import 금지, 동적 import만** — Node ESM에서 `import.meta.env`는 undefined라 핸들러 호출 전에 TypeError로 죽는다(= 모든 공유 링크 OG 이미지 500). 실제 사례와 회피 코드: `jotai/snowball/atoms/fx/index.ts:66-72`.
- 커스텀 파라미터(`login_failed`의 `provider`/`reason` 등)는 **GA4 콘솔에 커스텀 차원으로 등록해야만** 분해 조회가 된다. 미등록이면 총량만 보이고 분포는 `(not set)`.
- 분석 조회는 `analytics-analyst` 에이전트 + Google Analytics MCP를 쓴다(설정 절차는 `CLAUDE.md` MCP 절).

---

## 8. `api/*.js`는 커밋되는 **번들 생성물**이다 (전 외부 데이터 공통 함정)

### 구조
```
server/handlers/<PascalCase>/<Entry>.ts   ← 소스 (여기를 고친다)
        │  esbuild (tools/apiBundle/build.mjs)
        ▼
api/<kebab-case>.js                        ← 커밋되는 산출물 = 공개 URL
```
- 매핑 정본: `tools/apiBundle/manifest.mjs:10-21` (현재 **11개**: account-delete·fx·kakao-auth·**market-indices**·naver-auth·og·post-html·post-list·share-html·sitemap·ticker-html)
- external 유지 패키지: `@vercel/og`·`@supabase/supabase-js`·`@vercel/functions`·`jsdom` (`:35`)
- 신선도 검사: `npm run api:check`(빌드 게이트), 재생성 `npm run api:bundle`

### 🔴 왜 이 구조인가 (막다른 길 기록)
`package.json`의 `"type": "module"`이 엄격 ESM을 켜서 **디렉터리 import(배럴)와 확장자 생략이 둘 다 불법**이 된다. 앱 코드를 깊게 재사용하는 `api/*` 파일은 원본 그대로는 **절대 못 돈다**(`ERR_UNSUPPORTED_DIR_IMPORT`). 시도했다가 실패한 길 3개: 상대경로 전환(동일 실패 — 진짜 원인은 확장자), 전면 Edge 전환(Edge 번들러가 tsconfig `paths` 미해석), `"type":"module"` 제거(더 악화).

### 외부 데이터와의 접점 — **재번들이 필요한 순간**
`marketData.generated.json`을 바꾸면 **`api/ticker-html.js`와 `api/og.js`가 stale이 된다.**
- `ticker-html.js`: `TickerHtml.ts → shared/constants/tickers → resolveTickerEngineFacts → DIVIDEND_UNIVERSE → marketData` (명시적 경로)
- `og.js`: `Og.tsx → pages/Main/utils/ogCard`가 공유 시나리오를 재시뮬레이션하며 티커 기본값까지 닿는다 — **핸들러 최상위 import만 봐서는 안 보이는 전이 의존**(실측: 재번들 diff에 marketData JSON이 그대로 인라인됨)
- ⚠ 즉 **크론이 만든 스냅샷 갱신 PR은 이 두 번들의 재생성을 함께 요구한다.** 워크플로는 `tsc`·`test:ci`만 돌리고 `api:check`는 돌리지 않으므로(`refresh-tickers.yml:88-98`), 스냅샷 PR이 머지된 뒤 `api/*.js`가 뒤처져 있을 수 있다 — **미확인**: 실제로 드리프트가 남아 있는지는 이번에 `api:check`를 실행해 확인하지 않았다.
- 판별 요령: 핸들러의 최상위 import grep은 **필요조건일 뿐 충분조건이 아니다**. 의심되면 격리 환경에서 재번들해 바이트 diff를 직접 볼 것.

### 그 밖
- `.gitattributes`에 `api/*.js -text`가 **필수**다 — esbuild는 항상 LF를 쓰는데 이 레포는 `core.autocrlf=true`라, 없으면 "내 PC에서만 깨지는 빌드"가 된다.
- 소스맵을 켜거나 배너에 타임스탬프를 넣으면 바이트 대조가 즉시 깨진다.

---

## 9. 원칙 (이 프로젝트의 외부 데이터 규칙)

코드에서 **실제로 관찰되는** 규칙만 적는다.

1. **무키·무료 우선.** 스케줄 실행이 유료 키에 의존하지 않는다. 기본 공급자는 Yahoo(무키)이고 FMP는 옵션으로만 남았다. 유일한 키 의존(Alpha Vantage)은 **무료 티어 안에서 돌도록 파이프라인 자체를 설계**했다(하루 25개 회전).
2. **표시 전용 vs 계산 입력을 타입으로 가른다.** `MarketDataEntry`(엔진 입력 3필드)와 `MarketDataSnapshotEntry`(+ 참고 전용 필드)가 다른 타입이고, 오버레이 함수는 스프레드가 아니라 **명시 나열**로 참고 필드를 차단한다(`applyMarketData.ts:21-25`). 환율도 같은 원칙 — 표시만, 계산·저장·공유 URL 진입 금지.
3. **관측값과 가정을 섞지 않는다.** 파이프라인은 관측 가능한 사실만 쓴다. `expectedTotalReturn`은 큐레이터의 가정이라 자동 갱신 대상이 아니고, `dividendGrowth`는 그로부터 **사후 파생**된다(`dividendYield + dividendGrowth === expectedTotalReturn` 불변식).
4. **날조 금지 — 모르면 비운다.** 환율 실패 시 가짜 값 대신 502/`error`, `asOf`는 API가 준 실제 시각(오늘 날짜로 위장하지 않음), 파생 불가 필드는 **생략**(`undefined` 대신 키 자체를 뺀다), 지급일을 모르면 캘린더가 "미상"으로 표시.
5. **실패는 항상 "이전 값 유지"로 감쇠한다.** 리젝트·에러·빈 응답 어느 것도 좋은 데이터를 지우지 못한다. 나쁜 upstream 응답의 최악 결과는 "변화 없음"이지 "손상"이 아니다.
6. **커밋되는 생성물 vs 런타임 조회를 구분한다.**
   - 커밋(빌드에 박힘): 티커 스냅샷, 상장 티커 목록, `api/*.js` → 재현 가능·오프라인 빌드 가능·PR diff로 리뷰 가능. 대신 **최신화가 크론/빌드에 묶인다.**
   - 런타임: 환율, 커뮤니티 데이터 → 항상 신선. 대신 **실패 상태 UI가 반드시 필요**하다.
7. **크론은 자동 머지되지만, 게이트를 통과해야 한다.** 타입체크 → 테스트 → 변경 있을 때만 커밋. 변경이 없으면 빈 PR을 만들지 않는다.
8. **파이프라인 간 필드 소유권을 명시한다.** 같은 파일을 두 크론이 쓰지만 서로의 필드를 덮지 않는다(가격 갱신은 pay 소스 지급일을 이월만, 지급일 갱신은 가격을 안 만짐). 새 필드를 넣을 땐 **zod 스키마 + `refresh.ts`의 candidate 이월 분기 + api 번들 재생성** 3곳이 함께 가야 한다.
9. **서버 전용 시크릿에 `VITE_` 접두사 금지.** 붙는 순간 번들에 인라인돼 공개된다.

---

## 10. 예정 (미구현 — 계획만)

> 아래는 **아직 코드가 없다.** 구현하면 해당 항목을 위 섹션으로 옮기고 실제 `path:line`·캐시 시간을 기록할 것.
>
> (2026-07-28: 지수 5종 위젯·환율 전일 대비 변동률 두 항목은 구현돼 §3·§3-1로 옮겼다. 번호는 남은 항목 기준으로 정리했다.)

### 10.1 한국 시장 티커 (실행 순서 7단계)

**시세** — Yahoo에 `.KS`(코스피)·`.KQ`(코스닥) 접미사로 조회 가능. **2026-07-27 실측**: 삼성전자 `005930.KS` 254,000 KRW / KODEX 200 `069500.KS` 107,730 KRW (둘 다 `currency: "KRW"`).

**개별주 목록** — KIND(한국거래소 전자공시) `https://kind.krx.co.kr/corpgeneral/corpList.do`, POST `method=download&searchType=13`.
2026-07-27 실측: 무인증 다운로드 성공(약 1.26MB, **EUC-KR 인코딩** — UTF-8로 읽으면 깨진다).

**한국 ETF 목록** — **미확정**. KRX 정보데이터시스템의 JSON 직접 호출은 세션(OTP)이 필요하다. 후보 두 가지:
- 공공데이터포털 금융위원회 API(무료 키 발급 필요) → §9 원칙 1(무키 우선)과 어긋나므로 트레이드오프 판단 필요
- KRX OTP 발급 스크립트 → 세션 의존이라 크론 안정성이 떨어짐

**미해결 과제**
- **배당 이력 품질 검증 미완** — 한국 종목에 대해 Yahoo `events=div`가 쓸 만한 배당 이력을 주는지 확인하지 않았다(위 실측은 `events` 파라미터 없이 시세만 확인). 배당 시뮬레이터인 만큼 **이게 확인되기 전에는 한국 시장 지원을 약속할 수 없다.**
- 통화 혼재 — 유니버스가 USD/KRW를 섞으면 §3의 "환율은 표시 전용" 원칙과 정면으로 부딪힌다(계산에 환율이 들어가는 순간 저장 데이터의 재현성이 깨진다). **설계 결정 필요.**
- 지급주기·지급월 소스 — Alpha Vantage가 한국 종목을 서빙하는지 **미확인**.

---

## 부록: 관련 문서

| 문서 | 내용 |
|---|---|
| `docs/supabase/README.md` | Supabase 프로젝트 설정·마이그레이션 절차 |
| `docs/vercel/README.md` | Vercel 대시보드에 등록할 환경변수 목록 |
| `.env.example` | 로컬 개발 환경변수 (⚠ `ALPHAVANTAGE_API_KEY`·`FMP_API_KEY` 누락 — §2 참고) |
| `utils/TickerParser/README.md` | 티커 파서 소스 URL·출력 형식 |
| `.claude/knowledge/pitfalls.md` §데이터 소스 | 이 문서에 요약된 함정들의 1차 기록 |
