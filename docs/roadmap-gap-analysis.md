# 로드맵 통합 갭 분석 — Layer 1~8 기준

> 작성 2026-07-29. **기획 문서 4종을 Layer 1~8 축으로 재배치**하고 현재 코드와 1:1 대조한 결과다.
>
> | 약칭 | 문서 | 항목 수 |
> |---|---|---|
> | **[OS]** | 외부 `Investment_Cash_Flow_OS_Roadmap.md` — Layer 1~8 + MVP/V2/V3 | 레이어별 상이 |
> | **[v1]** | [`ROADMAP.md`](./ROADMAP.md) (2026-07-17) | 11 |
> | **[v2]** | [`ROADMAP-v2.md`](./ROADMAP-v2.md) (2026-07-27 사용자 확정) | 10 |
> | **[RP]** | [`design-refresh-plan.md`](./design-refresh-plan.md) — **실행 계획 정본** (트랙 ①~⑯) | 16 |
>
> 근거: [`router/routes.tsx`](../router/routes.tsx) · `shared/constants/tickers/registry.ts` ·
> `shared/constants/marketData`(2026-07-29 기준 **68종**)
>
> 표기: ✅ 있음 · ⚠️ 부분 · ❌ 없음

---

## 한눈에

| Layer | 기능 수 | ✅ | ⚠️ | ❌ |
|---|---:|---:|---:|---:|
| 1. Discover (SEO) | 12 | 4 | 3 | 5 |
| 2. Portfolio | 7 | 3 | 0 | 4 |
| 3. Dashboard | 8 | 1 | 3 | 4 |
| 4. Analytics | 9 | 0 | 0 | 9 |
| 5. Progress | 8 | 0 | 0 | 8 |
| 6. Visualization | 5 | 0 | 0 | 5 |
| 7. Viral | 8 | 1 | 0 | 7 |
| 8. Premium | 5 | 0 | 0 | 5 |
| **0. 기반·인프라** (레이어 밖) | 10 | 7 | 2 | 1 |

**네 문서가 공통으로 가리키는 공백 셋** — `Dashboard(허브)` · `ETF 비교` · `Dividend Journey`.
그중 **Dashboard 만 새 데이터 0으로** 만들 수 있다.

---

## Layer 1. Discover — SEO 유입

| 기능 | 출처 | 현황 | 근거 / 비고 |
|---|---|---|---|
| **ETF Detail** | OS🔥 · v1★★★★☆ · v2§6 | ✅ | `/ticker/:name` 11종 · 크롤러 서버렌더(`api/ticker-html.js`) · JSON-LD · 사이트맵 · 허브 `/ticker/all`. ⚠️ v2 는 `/etf/*` 경로를 제안 — **전환 여부 미결정** |
| **Future Dividend Simulator** | OS🔥 · v2§2 | ✅ | `/` · `runSimulation` |
| **Dividend Calendar** | OS(4) · v1★★★★★ · v2§7 | ✅ | `/dividend/calendar`. ⚠️ v2 가 말한 "이번 달 예상 입금" 단독 KPI 는 없음(RP B-7 로 보류됨) |
| 실시간 환율 반영 | v1★★★★☆ · RP⑩-1 | ✅ | `ExchangeRateWidget` + `api/fx.js` · 변동률까지 |
| 주요 지수 5종 | RP⑩-2 | ⚠️ | 부품·API 완성. **어느 페이지에도 미배선** — 5단계 랜딩에서 꽂을 예정 |
| Dividend Calculator | OS🔥 | ⚠️ | 시뮬레이터가 계산은 하나 **"1억 투자하면?" 단독 SEO 랜딩이 없다** |
| Ex-Dividend Calendar | OS(9) | ⚠️ | 배당락일 데이터는 `marketData` 에 있으나 전용 화면 없음 |
| **ETF Compare** | OS(5) · v1★★★★★ · v2§5 | ❌ | **세 문서가 모두 요구** |
| 새 랜딩 페이지 (ETF쇼핑형) | RP⑦ | ❌ | 트랙⑥(`/`→`/simulator`)이 선행 |
| **통합 검색** (랜딩 히어로) | RP⑧ | ❌ | 트랙⑨(해시태그)가 선행 |
| ETF Screener | OS(6) | ❌ | |
| Dividend History | OS(7) | ❌ | |

## Layer 2. Portfolio — 사용자 입력

| 기능 | 출처 | 현황 | 근거 / 비고 |
|---|---|---|---|
| **Portfolio 등록** | OS🔥 · v2§1 | ✅ | `/dividend/portfolio` · IndexedDB `snowball-portfolio` · 계산 7종 |
| **Dividend Goal** | OS🔥 · v1★★★★★ · v2§3 | ✅ | Portfolio 에 흡수 · 목표 칩 50/100/200/300만원 |
| 월 투자금 입력 | OS🔥 | ✅ | 시뮬레이터 입력 |
| **월급 입력** | OS(4) | ❌ | Layer 3 대체율 · Layer 7 카드의 **선행 조건** |
| 생활비 입력 | OS(5) | ❌ | FIRE 의 선행 조건 |
| Watchlist | OS(6) | ❌ | |
| 평단가 입력 | RP B-1 | ❌ | 보류 |

## Layer 3. Dashboard — 허브

| 기능 | 출처 | 현황 | 근거 / 비고 |
|---|---|---|---|
| Portfolio Value | OS(4) | ✅ | 포트폴리오 화면 |
| **Dashboard (허브)** | OS🔥 · v2§3 | ❌ | **MVP 최대 공백.** 새로 수집할 데이터 0 |
| Goal Progress | OS🔥 · v2§3 | ⚠️ | 달성률은 있으나 **"현재↔미래를 잇는 허브"** 역할 미완성 |
| 이번 달 예상 배당 | OS🔥 · v2§7 | ⚠️ | 캘린더에 월별은 있으나 단독 KPI 없음 |
| 올해 예상 배당 | OS(8) | ⚠️ | 시뮬레이션 연도별 표에 포함 |
| **월급 대체율** | OS(5) | ❌ | 입력 1개로 지표+바이럴 카드가 동시에 나오는 **ROI 최고 지점** |
| 다음 배당 D-Day | OS(6) | ❌ | 지급일 데이터는 있음 — 표시만 없음 |
| **FIRE Progress / Dashboard** | OS(7) · v1★★★★★ · v2§4 | ❌ | 생활비 입력 선행 |

## Layer 4. Analytics — **전부 없음, 데이터가 병목**

| 기능 | 출처 | 현황 | 막는 것 |
|---|---|---|---|
| Dividend Gap | OS🔥 | ❌ | **월별 데이터는 있어 유일하게 지금 구현 가능** |
| Portfolio Health | OS🔥 | ❌ | 섹터·국가·중복 노출 데이터 없음 |
| ETF X-Ray | OS🔥 | ❌ | **ETF 구성종목 데이터 전무** |
| Compare Portfolio / Stress Test / Drift | OS(4·5·6) | ❌ | 벤치마크·과거 시계열 없음 |
| Sector / Country Distribution | OS(7·8) | ❌ | 섹터·국가 데이터 없음 |
| Income Stability | OS(9) | ❌ | 시계열 없음 |
| AI 포트폴리오 분석 | v1★★★★☆ | ❌ | 프리미엄 성격 |

> 🔥 표시와 무관하게 **데이터 소스 확보 전에는 착수 불가**. 현재 시세는 Yahoo(무키),
> 지급일은 Alpha Vantage 무료 **25req/day** 회전이다.

## Layer 5. Progress — 기록·성취

| 기능 | 출처 | 현황 | 비고 |
|---|---|---|---|
| **Dividend Journey** | OS🔥 · v1★★★★☆ · v2§9 | ❌ | **세 문서가 모두 요구** |
| **배당 가계부** (실제 입금 기록) | v1★★★★☆ · RP⑬ | ❌ | Portfolio 보유·지급월에서 **행 자동 프리필** → 예상 vs 실측 비교. 실측이 쌓이면 Goal "현재 월배당"의 **최종 정본** |
| Monthly Report | OS🔥 | ❌ | |
| **Milestone / 배지** | OS🔥 · v1★★★★☆ · v2§10 | ❌ | 🥉첫 배당 ~ 🏆FIRE 6단계 |
| 추정 vs 실측 벤치마크 인사이트 | RP⑪ | ❌ | 가계부의 프레이밍 지면 |
| Portfolio Replay / Streak / Heatmap | OS(4·5·6) | ❌ | |
| Year Wrapped | OS(7) | ❌ | Layer 7 과 중복 항목 |

## Layer 6. Visualization — 전부 없음

Income Tree · Dividend Passport · Financial Freedom Island · Level System · Investment DNA — **5종 모두 ❌** (전부 OS 전용 항목)

> 브랜딩 실험 성격. 리텐션 검증 전에는 근거 없이 비용이 크다.

## Layer 7. Viral — **인프라는 이미 완성**

| 기능 | 출처 | 현황 | 비고 |
|---|---|---|---|
| **공유 인프라** | — | ✅ | ShareDialog(중앙 창 + 채널 3종) · **결과 PNG 캡처** · OG 카드(`api/og.js`) · lz-string 공유 URL |
| 월급 대체율 카드 | OS🔥 | ❌ | 월급 입력(L2) 선행 |
| Future Me Card | OS🔥 | ❌ | |
| Dividend Journey Card | OS🔥 | ❌ | |
| 포트폴리오 복사 + 내 조건으로 시뮬 | v1★★★★☆ · v2§8 | ⚠️→❌ | 갤러리 시나리오 첨부·미리보기는 ✅ / **"내 조건으로 계산" 버튼 ❌** |
| Year Wrapped / FIRE / Milestone / Monthly Report Card | OS(4~7) | ❌ | |
| 게시판 해시태그 | RP⑨ | ❌ | 통합 검색(⑧)의 선행 |

> 카드 7종은 없지만 **만들 수단은 다 있다.** 남은 것은 콘텐츠 디자인이다.

## Layer 8. Premium — 전부 없음

Retirement Simulator · Advanced Stress Test · Tax Simulator · Currency Analysis · Advanced Compare — **5종 모두 ❌**.
**과금 인프라도 없다.** 무료 리텐션 증명 후에 볼 영역.

---

## Layer 0. 기반·인프라 (레이어 밖 — [RP] 고유)

외부 기획서에는 없지만 실행에 필요한 것들. **[RP] 트랙 16개 중 레이어에 안 들어가는 항목**이다.

| 기능 | 출처 | 현황 |
|---|---|---|
| 폰트 교체 (4역할 셀프호스팅) | RP① | ✅ |
| 세컨더리 액센트 (골드 폐기 → 그린/틸) | RP② | ✅ |
| 브랜드 워드마크 (C5 쿨 그라디언트) | RP④ | ✅ |
| 시뮬레이터 설정 = 상시 오버레이 드로어 | RP⑭ | ✅ |
| Portfolio 도메인 + Goal 흡수 | RP 0단계 | ✅ |
| **미갱신 18종 가격 리베이스** | RP B-4 | ✅ **2026-07-29 완료** — marketData 50→**68종**, 캘린더 "준비 중" **19종→ANET 1종** |
| 아이콘 일관성 감사 | RP⑤ | ⚠️ 정렬 유틸 승격까지 |
| 콘텐츠 공동 작성 (상시) | RP S-1 | ⚠️ 티커 11종 작성됨 · 해시태그 미구현으로 부착 불가 |
| 파스텔 그라디언트 배경 | RP③ | ❌ |
| **라우팅 개편 `/`→`/simulator`** | RP⑥ | ❌ **5단계 랜딩의 선행 조건** |
| 한국 티커 확장 | RP⑩-3 | ❌ |
| **클라우드 충돌 판정 탭 단위** | RP⑯ | ❌ 설계 확정 · 미착수 (아래 참조) |
| 전면 페이지 리모델링 | RP⑮ | ❌ 순서상 마지막 |

### RP⑫ Lab 콘텐츠 — Layer 1(SEO) + Layer 5(재방문) 겸용, **5종 전부 ❌**

> 다른 어느 문서에도 없는 [RP] 고유 영역. 데이터 소스 가용성은 **이미 실측 완료**돼 있다.

| 소재 | 데이터 소스 (전부 무료) | 비고 |
|---|---|---|
| **투자 대가 포트폴리오** (버핏·캐시 우드 등 8인) | SEC EDGAR **13F** — 공식 JSON, 무키, 분기+45일 지연 | |
| S&P500 섹터별/연도별 수익률 | Yahoo — 섹터 ETF 11종(XLK·XLF·XLV·XLE …) | |
| 미국 **배당킹** (50년+ 연속 증배) | 정적 목록 ~55종 + Yahoo 자동 갱신 | **가장 싼 항목 — 착수 1순위 제안** |
| **한국 국회의원 주식보유** | 국회공보 「정기재산변동신고 공개목록」 — **공공저작물, 출처 표시 하 이용 가능** | 연 1회 PDF 파싱 |
| **미국 의원 주식보유** | House Clerk PTR · Senate eFD (STOCK Act, 45일 내) | **경쟁 서비스에 없는 소재 — 선점 가치** |
| Lab 허브 (`/lab`) | — | 소재 2개 이상 생기면 신설 |

**공통 차별화**: 모든 리스트·포트폴리오에 **"시뮬레이터로 계산" CTA** — 경쟁 서비스에 없는 루프.

**정치 중립 원칙 (문서에 이미 확정)**: 정당 정보 미표시 · "평가 도구가 아니라 시장 흐름 참고 데이터셋" 프레이밍 ·
신고일 대비 수익률의 한계 명시(실제 매수가 무관·배당/환율 미반영) · 채권 제외.

---

## [RP] 실행 순서 — 0~10단계

```
[1 아이덴티티]✅ ─┬─ [3 시뮬 대개편]⚠️ ─→ [5 랜딩+검색] ─→ [6 가계부] ─→ [9 광택] ─→ [10 리모델링]
[2 지수/환율]✅  ─┘      [4 해시태그]  ──↗   [7 한국 티커](병렬)  [8 Lab](상시)          ↑ 마지막
```

| 단계 | 내용 | 현황 |
|---|---|---|
| 0 | Portfolio 도메인 + Goal 흡수 | ✅ |
| 1 | 아이덴티티 패스 (①+④+②+③) | ✅ — ③ 그라디언트 배경만 미적용 |
| 2 | 데이터 위젯 (⑩-1·2) | ✅ — ⚠️ 지수 스트립 미배선 |
| 3 | 시뮬레이터 대개편 (⑭+⑥) | ⚠️ **절반** — ⑭ ✅ / **⑥ `/simulator` 라우팅 ❌** |
| 3.5 | 클라우드 충돌 탭 단위 (⑯) | ❌ |
| 4 | 게시판 해시태그 (⑨) | ❌ |
| 5 | 랜딩 + 통합 검색 (⑦+⑧) | ❌ |
| 6 | 배당 가계부 (⑬) | ❌ |
| 7 | 한국 티커 확장 (⑩-3) | ❌ |
| 8 | Lab 콘텐츠 (⑫) | ❌ |
| 9 | 마감 광택 | ❌ |
| 10 | 전면 리모델링 (⑮) | ❌ |

**11단계 중 3 완료 · 1 부분.** 다음은 **3.5 또는 4**(둘 다 착수 준비 완료).

⚠️ **3단계가 "완료"로 알려졌지만 절반이다** — 트랙⑥이 빠졌고 그건 5단계의 선행 조건이다(`⑥→⑦`).

---

## MVP / Version 대조 [OS]

| 구분 | 항목 | 현황 |
|---|---|---|
| **MVP** | ETF Detail · Portfolio 등록 · Dividend Goal · Future Simulator | ✅ 4 |
| | Dividend Calculator | ⚠️ SEO 랜딩 없음 |
| | **Dashboard · Dividend Journey** | ❌ 2 |
| **V2** | Dividend Calendar | ✅ 1 |
| | Portfolio Health · Dividend Gap · ETF X-Ray · Monthly Report · 월급 대체율 | ❌ 5 |
| **V3** | Income Tree · Year Wrapped · Future Me · FIRE Card · Milestone · Passport | ❌ 6 |
| **Premium** | 5종 | ❌ 5 |

---

## 결론 — 무엇부터

1. **Dashboard 가 1순위다.** 네 문서가 공통으로 가리키고, MVP 중 유일한 허브이며,
   **새로 수집할 데이터가 0**이다(Portfolio + Simulator + Calendar 를 잇기만 하면 Layer 3 🔥 3개가 한 번에).
2. **월급 대체율이 ROI 최고다.** Layer 2(입력) → Layer 3(지표) → Layer 7(카드)이 **한 줄로 이어지는 유일한 축**.
   입력 한 개로 지표 1 + 바이럴 카드 1.
3. **트랙⑥(`/`→`/simulator`)이 숨은 선행 조건이다.** 3단계가 절반만 끝나 5단계 랜딩이 막혀 있다.
   Dashboard 를 `/` 에 놓는 설계와 함께 풀면 두 문제가 한 번에 정리된다.
4. **레이어 번호는 실행 순서가 아니다.** 실제 의존은 `Portfolio(완) → Dashboard → Journey/Report → Viral Card`,
   Layer 1 SEO 와 Lab 콘텐츠는 **병렬 트랙**이다.
5. **미루는 게 맞는 것**: Layer 4 전체(데이터 병목) · Layer 6(검증 전 실험) · Layer 8(과금 인프라 없음).
