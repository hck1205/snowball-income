---
name: new-ticker-page
description: >-
  snowball-income에 ETF·티커 SEO 소개 페이지를 하나 추가하는 도메인 워크플로. 데이터 파일 1개
  (schd.ts 패턴) + registry 한 줄이면 페이지·크롤러 서버렌더·사이트맵·JSON-LD·내부링크가 전부
  자동 파생된다. 수치는 curator 검증(날조 금지)·카피는 눈덩이 금지. "티커 페이지 추가 / ETF 소개
  글 / 종목 랜딩" 요청에서 트리거. 실제 11종을 이 절차로 만들었다.
---

# new-ticker-page — 티커 SEO 페이지 추가 (도메인 반복)

`shared/constants/tickers/`는 **레지스트리 파생** 구조라, 티커 하나 추가는 거의 데이터 입력이다. 페이지 컴포넌트·
서버렌더(`api/ticker-html.js`)·사이트맵·JSON-LD·목차는 레지스트리를 순회해 자동 생성된다. **위험은 코드가 아니라
숫자 정확성과 카피**다.

> ⚠ 전제: 그 티커가 **계산 유니버스(`PresetTickerKey`)에 이미 있어야** 한다. 없으면 프리셋 추가가 선행(다른 작업).
> 콘텐츠 레지스트리는 유니버스의 **부분집합**이다(SEO 콘텐츠 있는 티커가 소수라는 전제).

## 트리거
"이 ETF/종목 소개 페이지 만들어줘 / 티커 랜딩 추가 / `/ticker/<X>` 페이지".

## 절차

### 1. 데이터 파일 1개 — `schd.ts` 패턴 복제
`shared/constants/tickers/<slug>.ts`에 `export const <X>_TICKER_CONTENT: TickerContent = { ... }`.

- 🔴 **엔진 6필드(가격·배당률·성장률·기대수익·주기·이름)를 콘텐츠에 복제하지 마라.** 문단엔 `{{dividendYield}}`
  같은 **토큰**만 담고, `resolveTickerEngineFacts` → `renderTickerContentTemplate`가 렌더 시점에 치환한다.
  이유: 티커 자동갱신 크론이 배당률·주가를 주기적으로 덮어써, 숫자를 문자열에 박으면 갱신 후 "옛 숫자 = 날조"가 된다.
- 정적 사실(운용보수·상장연도·추종지수)은 토큰 없이 리터럴로 적어도 된다(과설계 회피 — 전부 토큰화하지 않는다).
- `reference.asOfNote`는 **모든 엔트리 필수**(옵셔널 아님) — 근사치의 기준시점·한계를 고지한다.
- 개별종목(리츠 등)은 ETF 6섹션 템플릿을 **id는 유지하고 navLabel/heading/본문만 재해석**(`expense-ratio`→비용구조,
  `selection-criteria`→보유 분산). 커버드콜은 `dividendGrowth: 0` 가정 자체를 콘텐츠의 핵심 메시지로(왜 0인지 정직하게).
- 액티브·개별종목이라 없는 필드(`trackedIndex`·`expenseRatioPercent`·`holdingsCountApprox`)는 **비운다** →
  JSON-LD의 `buildFinancialProductSchema`가 conditional spread로 해당 PropertyValue를 자동 생략(추가 분기 불필요, 확인만).

### 2. registry 한 줄 + 배럴 한 줄
- `registry.ts`의 `TICKER_CONTENT_REGISTRY`에 `<X>: <X>_TICKER_CONTENT,` 추가 + import 한 줄. `index.ts` 배럴에 한 줄.
- 이게 전부다 — 페이지(`pages/Ticker`)·서버렌더(`server/handlers/TickerHtml`)·사이트맵(`vite.config.ts`가 `TICKER_CONTENT_LIST` 파생)·
  JSON-LD·`/ticker/all` 허브·관련 링크는 **손대지 않는다**(레지스트리 순회로 자동).

### 3. 숫자·카피 규율 — 여기가 진짜 리스크
- 🔴 **수치 날조 금지.** 변동성 큰 필드(`topHoldings`·리밸런싱 비중)는 신뢰할 단일 현재값을 못 얻으면 **비운다**.
  채우려면 `ticker-data-curator`가 발행사 공식 소스로 스팟체크(실측: VYM 605종·JEPI 129종 등 공식 팩트시트로 확정).
  "의도적으로 비웠다"는 확정 선언이 아니라 "그 시점에 확인 못 함" — 다음에 소스가 생기면 채운다.
- 🔴 **눈덩이 금지(전 콘텐츠 공통 카피 규칙).** "눈덩이/스노우볼/굴린다" 비유를 제목·본문·CTA·메타·FAQ에 **쓰지 않는다.**
  같은 개념은 **복리·시간·재투자**라는 직접적 언어로. (브랜드 워드마크/타이틀 suffix "Snowball Income"만 예외 = 사이트 이름.)
- 배당 3분류를 존중: 가격·배당률·주기=관측사실 / expectedTotalReturn=사람의 가정 / dividendGrowth=파생(etr−dy) — 콘텐츠가 이를 왜곡하지 않게.

### 4. api 번들 재생성 — 필수
`shared/constants/tickers/` 수정이므로 **`npm run api:bundle` 필수**. `ticker-html.js`가 `TickerHtml → tickers →
resolveTickerEngineFacts → DIVIDEND_UNIVERSE(presets) → marketData` 경로로 실제 의존한다. `npm run verify`가 재생성+체크를 대신한다.

### 5. 검증 → ship
- `npm run verify`(tsc→test→api:bundle→api:check→build) 그린. 빌드 확인: 서사 문자열이 entry 청크에 없고 `registry-*.js` lazy 청크에만 있어야 한다(격리 유지 — 최상위 배럴 미연결).
- 그린이면 `ship` 스킬(트랙 = `ticker-seo`). ⚠ [[ask-before-deploy]] 승인.

## 검증(요약)
`npm run verify` 그린 + 수치는 curator 검증(비운 필드 명시) + 눈덩이 카피 0 + api 번들 재생성 포함.

## 함정 압축
- 엔진 6필드 문자열 박제 = 갱신 후 날조 → 토큰. · `asOfNote` 필수. · 변동성 필드는 비우고 curator 검증. · 눈덩이 금지. · api:bundle 필수. · 크롤러 셸: 콘텐츠 없는 티커는 404 아니라 무치환 셸 200+no-store(서버 계약).

## 진화
이 절차가 현실과 어긋나거나 더 나은 길이 보이면 `.claude/knowledge/retro.md`(또는 pitfalls seo)에 근거를 남기고 이 스킬을 고쳐라. 프로세스는 살아있다(dev-process 마스터 §4).
