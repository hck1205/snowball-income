# 랜딩 페이지 (`/`) — 화면 설계 스펙

> 트랙 ⑦ / 실행 단계 **P3**(`docs/simulator-route-migration-compat.md` §10). pm-po 가 확정한 8섹션을 화면으로
> 옮긴 **구현 스펙**이다. `frontend-engineer` 가 이 문서만 보고 만들 수 있어야 한다.
> 2026-08-01 작성 (ui-ux-designer). 이 문서는 설계만 담는다 — 앱 소스는 한 줄도 고치지 않았다.
>
> **선행 문서(먼저 읽어라)**
> - `docs/simulator-route-migration-compat.md` — §2 북마크 보호, §10 P3 실행 순서, §11 롤백
> - `.claude/knowledge/decisions.md` — 카드 위계 3단 / 페이지 hue / 모션 표준 / 카피 금지 규칙
> - `DESIGN.md` §2-6(틴트 면 상한) · §10(⚠ "채택"은 "적용"이 아니다 — 반드시 호출부 grep)

---

## 0. 이 문서를 읽기 전에 — 조사 중 발견한 사실 정정 2건

**F1. `expectedMonthlyDividend` 는 "소비처 0" 이 아니다 — 지금 시뮬레이터 화면에 렌더되고 있다.**
브리핑은 이 필드가 어느 화면에도 안 나온다고 적었으나, `PortfolioPresetBoard.utils.ts:48-53` 의
`buildPresetMetrics` 가 `{ label: '목표 월배당', value: preset.expectedMonthlyDividend }` 를 만들고
`PortfolioPresetBoard.tsx:115-122` 가 그것을 카드마다 그린다. 즉 **13장의 프리셋 카드가 지금도
"목표 월배당 약 40~50만원"을 화면에 쓰고 있다.**

→ **이 스펙의 지시는 그대로 유지한다**(랜딩은 그 값을 쓰지 않는다). 오히려 근거가 강해졌다 —
랜딩은 SEO·첫인상 지면이고 로그인 없이 크롤러가 읽는다. 다만 **시뮬레이터 쪽 노출은 별건**이며
사용자 결정이 필요하다(§12 리스크 R1).

**F2. `index.html:139` 이 금지된 비유를 쓰고 있다.**
JSON-LD `featureList` 의 `"배당 재투자(스노우볼) 시뮬레이션"` 은 카피 금지 규칙
(decisions.md `[2026-07-22][copy]`)을 정면으로 어긴다. `index.html` 의 메타·JSON-LD 는 마이그레이션
문서 §3 이 **랜딩 PR 소관**으로 명시했으므로 이 PR 에서 함께 고친다(§9-3).

---

## 1. 결정 3건 (D1·D2·D3)

### D1. 히어로 1순위 CTA — 🔴 **사용자 승인 대기**

| | A안 (**권고**) | B안 (RP 5-2 유지) |
|---|---|---|
| primary | **배당 계산 시작하기** → `/simulator` | **내 월배당 확인하기** → `/dividend/portfolio` |
| secondary | 보유 종목으로 계산 → `/dividend/portfolio` | 배당 계산 시작하기 → `/simulator` |
| §2 "첫 화면 시뮬레이터 1클릭" | ✅ primary 로 충족 | ✅ secondary 로 충족(둘 다 접힘 위) |

**두 안 모두 `PageHero` 의 `actions` 슬롯 하나에 버튼 2개를 넣는 같은 마크업이다.**
바뀌는 것은 **배열 순서와 `variant` 뿐**이므로, 카피 상수에 순서를 데이터로 둔다:

```ts
// pages/Landing/copy/landingCopy.ts
export const LANDING_HERO_CTAS = [
  { id: 'simulator', label: '배당 계산 시작하기', to: SIMULATOR_PATH,        variant: 'primary'   },
  { id: 'portfolio', label: '보유 종목으로 계산', to: '/dividend/portfolio', variant: 'secondary' }
] as const;   // ← B안 승인 시 이 배열의 순서와 variant 두 값만 뒤집는다. 마크업 diff 0.
```

**A안을 권고하는 근거 3가지**

1. **대상이 맞지 않는다.** 이번 랜딩의 독자는 "주식도 배당도 모르는 사람"이다.
   `/dividend/portfolio` 의 빈 상태는 `종목 추가` + 빠른 선택 4종(`portfolioCopy.ts:195-201`)으로
   잘 만들어져 있지만, 그 화면이 요구하는 것은 **보유 수량**이다(`hero.lede`: "종목과 보유 수량만
   넣으면"). 아직 아무것도 사지 않은 사람에게 "몇 주 갖고 계신가요"는 **답이 없는 질문**이다.
   반대로 시뮬레이터는 "매달 얼마씩 넣으면"을 묻는다 — 비보유자도 답할 수 있는 유일한 질문이다.
2. **§4.5 Hook 정의를 부정하지 않는다.** 그 정의는 "**정착** hook 은 Portfolio, 시뮬레이터는 유입용"
   이다. 랜딩은 정의상 **유입 지면**이다. Portfolio 를 서사 후반(S5·S7)과 히어로 secondary 에
   두 번 배치하면 "이미 투자 중인 사람"은 여전히 1클릭이고, 비보유자는 막다른 길을 만나지 않는다.
3. **북마크 재방문자 보호와 정합한다**(마이그레이션 §2). `/` 를 북마크한 사람은 **시뮬레이터를
   쓰던 사람**이다. 그 사람이 첫 화면에서 가장 크게 보는 버튼이 시뮬레이터여야 사고가 나지 않는다.

🔴 **이 판단은 `docs/design-refresh-plan.md:357`(5-2)의 확정을 뒤집는 것이므로 사용자 승인 전에는
구현하지 마라.** 승인 전 기본값은 **A안**으로 두되(§2 불변 요구를 어느 쪽도 깨지 않으므로 위험이
대칭이다), 승인 결과가 B안이면 위 배열 두 값만 바꾼다.

### D2. 랜딩 페이지 hue = **`identity`** (코드 변경 0)

`shared/hooks/usePageHue/usePageHue.utils.ts:27` 은 이미 `pathname === '/'` → `identity` 다.
**랜딩이 `/` 를 가져가도 이 줄은 그대로 둔다.** 그리고 `/simulator` 도 `identity` 를 유지한다(line 28).

**근거**

- `identity` 는 **섹션 색이 아니다.** decisions.md `[2026-07-31]` 가 못 박았듯 identity 4토큰은
  `COMMON_LIGHT`/`COMMON_DARK` 라 **ink 를 포함한 8프리셋에서 값이 같다** — 스킨을 따라가지 않는
  "이 제품 자체의 색"이고, 워드마크 첫 단어와 같은 색이다. 랜딩은 **워드마크가 가리키는 페이지**
  (마이그레이션 §8: "워드마크가 홈=랜딩 역할")이므로 배정이 동어반복일 만큼 자연스럽다.
- **hue 는 라우트마다 유일할 필요가 없다.** `/ledger` 와 `/dividend/portfolio` 가 의도적으로 같은
  `accentAlt` 인 선례가 있고, 그 근거는 "둘이 한 축이고 사용자가 오가는 짝"이었다. 랜딩과
  시뮬레이터는 **정문과 그 안의 도구**로 정확히 같은 관계다.
- **차별화 손실이 0이다.** hue 소비처는 둘 — ①히어로 크롬 ②활성 내비 알약의 링. 랜딩에서는
  **활성 알약이 존재하지 않는다**(nav "시뮬레이터"는 `/simulator` 를 가리키고, 랜딩은 nav 항목이
  아니다). 즉 랜딩의 hue 는 히어로 한 곳에만 쓰이고, 어느 nav 항목과도 색을 다투지 않는다.
- **다른 셋은 전부 더 나쁘다.** `brand` = 커뮤니티(사람이 모이는 곳)와 충돌 · `accent` = 캘린더
  (흐름·일정) · `accentAlt` = 내 실측 데이터 축. 미배정(`null`)은 폴백이 `brand` 라 결국
  커뮤니티와 같아진다.

**`usePageHue.utils.ts` 주석에 남길 문장(그대로 복사)**

```
 *  - `/` 랜딩 · `/simulator` 시뮬레이터 = **identity**(쿨 블루). 🔴 **같은 색인 것이 의도다.**
 *    identity 는 섹션 색이 아니라 제품 자신의 색이고(전 프리셋 공통값 = 스킨을 안 따라간다),
 *    랜딩은 워드마크가 가리키는 정문, 시뮬레이터는 그 문 안의 도구라 한 축이다
 *    (`/ledger`↔`/dividend/portfolio` 가 같은 accentAlt 인 것과 같은 근거).
 *    차별화 손실도 없다 — 랜딩에서는 활성 내비 알약이 없어 hue 소비처가 히어로 하나뿐이다.
```

### D3. `h1` 충돌 — **충돌하지 않는다. 코드 변경 0.**

`AppHeader` 의 `brandAs` **기본값이 `'span'`**(`AppHeader.tsx:49`)이고, `'h1'` 을 넘기는 곳은
`pages/Main/Main.view.tsx:122` **단 한 곳**이다. 랜딩은 `TickerPageShell`(→ `AppHeader` 기본값)을
쓰므로 **워드마크는 `span`**, 히어로 제목이 문서의 유일한 `h1` 이 된다.

- 랜딩: `<PageHero titleAs="h1" …/>` — 티커 상세·404·법무 문서와 **같은 처방**이다.
- 시뮬레이터(`/simulator`)의 워드마크 `h1` 은 **그대로 둔다** — decisions.md:19 의 확정이고,
  span 강등은 "10단계 R6"으로 미뤄 둔 별건이다. 두 페이지는 다른 문서라 서로 간섭하지 않는다.
- 가드: `test/landing/landingHeadings.test.tsx` — 랜딩 렌더 시 `getAllByRole('heading', { level: 1 })`
  가 **정확히 1개**이고 그 접근명이 히어로 제목일 것. (워드마크가 실수로 `h1` 로 돌아오면 즉시 빨감.)

---

## 2. 페이지 골격 · 컨테이너

```
<TickerPageShell>                       ← AppHeader(공용) + <main> 셸. 404·법무 문서와 같은 재사용.
  <LandingStack>                        ← 8섹션 + 푸터의 세로 리듬
    S1 <PageHero titleAs="h1" …/>       ← 히어로(+CTA·검색·이어서 계산하기)
    S2 <MarketIndexStrip />             ← 🔴 최초 배선. 자체 <section>+<h2> 를 갖는다.
    S3 <ConceptLadder />                ← 주식 → ETF → 배당주
    S4 <CompoundExplainer />            ← 재투자와 시간
    S5 <PayoutRhythm />                 ← 매달 들어오는 현금
    S6 <PresetBrowser />                ← 전략·대가 포트폴리오
    S7 <StartChecklist />               ← 시작 준비 (Card tone='wash')
    S8 <LandingFaq />                   ← 아코디언(details/summary)
    <PageFooter notes={…} />            ← 공용 푸터(법무 링크 포함)
  </LandingStack>
</TickerPageShell>
```

**컨테이너 실측치** (`TickerPageShell.styled.ts:21-23` — `max-width:1120px`, `padding: clamp(20px,4vw,48px) clamp(16px,4vw,40px) 64px`)

| 뷰포트 | 좌우 패딩 | 콘텐츠 폭 | 상단 패딩 |
|---|---|---|---|
| 1280 | 40px | **1120px** | 48px |
| 768 | 30.7px | **706px** | 30.7px |
| 390 | 16px | **358px** | 20px |

**`LandingStack` 세로 간격** — `gap: clamp(32px, 4vw, 56px)`
(페이지 안 카드 리듬 `clamp(16,3vw,28)`보다 한 단 크다. 8섹션짜리 문서는 섹션 경계가 카드 경계보다
확실히 커야 "한 덩어리 카드밭"으로 읽히지 않는다. 1280=51.2px · 768=30.7→32px · 390=32px.)

---

## 3. S1 히어로 — 배치 확정 + 390px 높이 예산

### 3-1. 수직 순서 (확정)

```
① 아이콘 배지 + 제목(h1)        ← HeroTitleGroup
② CTA 2개                       ← HeroActions  (≤640 에서 제목 아래 전폭, 두 버튼 나란히)
③ 리드 한 문장                  ← HeroLede
④ 종목 검색 폼                  ← 신규 슬롯(히어로 카드 안, HeroMeta 자리 대신)
⑤ (조건부) 이어서 계산하기      ← 마커가 있을 때만
⑥ ─── 히어로 카드 끝 ───
⑦ 주요 지수 스트립(S2)          ← 히어로 **밖**, 형제 섹션
```

🔴 **②가 ③보다 위인 것이 이 배치의 핵심이다.** `PageHero` 는 이미 `HeroTitleRow`(제목+actions) →
`lede` → `notice` → `meta` 순서이므로 **컴포넌트를 고치지 않고 그대로 얻어진다.** 리드를 CTA 위에
두면 390px 에서 CTA 가 리드 2줄만큼(40px) 아래로 밀린다 — 예산이 남더라도 **"버튼이 접힘 아래로
갈 수 있는 구조"를 만들지 않는다**는 것이 §2 요구의 취지다.

🔴 **④·⑤는 `PageHero` 에 새 prop 을 만들지 않는다.** 두 요소는 `PageHero` 의 **`meta` 슬롯**에
`<HeroExtras>` 한 덩어리로 들어간다. 이유: ①`PageHero` 는 앱의 유일 히어로라 랜딩 전용 슬롯을
뚫으면 다른 4화면이 그 prop 을 영원히 지고 간다 ②`meta` 는 `justify-self:start` + hue 밑줄을 갖는데,
`<HeroExtras>` 가 `width:100%`·`border-bottom:none` 으로 그 둘을 무력화한다.

> **대안 검토(기각)**: `notice` 슬롯 사용 — `role="note"` 가 붙어 검색 폼이 "주석"으로 읽힌다.
> `actions` 안에 검색 넣기 — 잉크 보정 `transform` 이 걸린 컨테이너라 포커스 링이 어긋난다.

### 3-2. 🔴 390px 접힘 예산 (스크롤 0)

**기준 뷰포트 390 × 664** — iOS Safari 의 `100svh`(툴바가 모두 보이는 최소 상태). 844px 짜리
`lvh` 를 쓰면 예산이 거짓이 된다.

| # | 요소 | 높이 | 산출 근거 |
|---:|---|---:|---|
| 1 | `AppHeader` (**2줄**) | **111** | ≤1023 은 2줄이다(`BREAKPOINT.headerStack=1023`). 실측 105–111, 상한 120(`headerprobe.mjs:50`). 🔴 **브리핑의 65px 은 ≥1024 값이다** |
| 2 | `ShellMain` padding-top | 20 | `clamp(20px, 4vw=15.6px, 48px)` → 20 |
| 3 | `HeroRoot` padding-top | 20 | `clamp(20px, 3vw=11.7px, 32px)` → 20 |
| 4 | 제목 줄 | 36 | 배지 36px vs 제목 `clamp(20, 0.9rem+1.8vw=21.4, 30)`×1.25 = 26.8 → **max = 36** |
| 5 | `HeroTitleRow` gap | 12 | `space[3]` (≤640 은 column) |
| 6 | **CTA 줄** | **40** | `Button size='md'` = 40px. 두 버튼이 `flex:1 1 auto` 로 나란히 |
| | **🔴 시뮬레이터 CTA bounding box 하단** | **239** | **664 − 239 = 여유 425px** ✅ |
| 7 | `HeroRoot` gap | 12 | |
| 8 | 리드 2줄 | 40 | 14px × `leading.snug`(1.4) × 2 |
| 9 | `HeroRoot` gap | 12 | |
| 10 | 검색 입력 | 44 | 터치 타깃 하한 |
| 11 | (조건부) gap + 이어서 줄 | 44 | 12 + `Button size='sm'` 32 |
| 12 | `HeroRoot` padding-bottom | 20 | |
| | **히어로 카드 하단(조건부 포함)** | **371** | 664 − 371 = 여유 **293px** — 히어로 통째로 접힘 위 ✅ |

**최악값 검증**

| 시나리오 | CTA 하단 | 여유 |
|---|---:|---:|
| 헤더 상한 120 + 제목 2줄(53.6) | **265.6** | 664 − 265.6 = **398** ✅ |
| 360 × 640 (구형 안드로이드, 헤더 120) | **248** | 640 − 248 = **392** ✅ |
| CTA 가 두 줄로 감김(라벨 길어짐) | **287** | 664 − 287 = **377** ✅ |

**버튼 라벨 폭 검산** — 콘텐츠 폭 358 − 히어로 좌우 패딩 40 = **318px**, 두 버튼 + gap 8 →
**155px/개**. `Button md` = 좌우 패딩 16×2 + `font.size.sm`(13px). 한글 8자 ≈ 104px + 공백 4px
+ 패딩 32px = **140px ≤ 155px** ✅ (두 안의 라벨 4종 모두 8자 이하로 설계했다.)

🔴 **예산을 지키는 단 하나의 규칙: 히어로 CTA 줄 *위*에 새 요소를 넣지 마라.** 제목 위 배지 줄,
"NEW" 리본, 소개 문구 한 줄 — 이런 것이 들어오는 순간 예산이 깨진다. 리드·검색·지수는 전부 CTA
**아래**다.

### 3-3. 가드 (🔴 "0건이라 통과"를 막는다)

`tools/dev/headerprobe.mjs` 의 `ROUTES` 에 `/`(랜딩)와 `/simulator` 를 둘 다 넣고,
**랜딩 전용 5번 검사**를 추가한다.

```
5. 접힘 위 CTA — 스크롤 0 에서 [data-landing-cta="simulator"] 의
   getBoundingClientRect().bottom ≤ window.innerHeight
   🔴 요소를 찾지 못하면 통과가 아니라 실패다.
      (마이그레이션 §8 이 경고한 "게이트가 장식이 되는 전형" — 4번 검사가 랜딩에서 조용히 0건이
       되어 통과하던 바로 그 함정을 여기서 반복하지 않는다.)
```

`data-landing-cta="simulator"` 속성은 **CTA 배열의 `id` 에서 파생**한다(D1 로 순서가 뒤집혀도
같은 요소를 가리킨다).

---

## 4. 8섹션 와이어프레임 — 1280 / 768 / 390

### 공통 규약

- 각 섹션 = `<section aria-labelledby={id}>` + `<h2 id={id}>`. **예외: S2** — `MarketIndexStrip` 이
  자기 `<section>`+`<h2>`("주요 지수")를 이미 갖는다(`MarketIndexStrip.styled.ts:11,29`).
  래퍼 섹션을 덧대면 랜드마크와 제목이 이중이 된다.
- 섹션 제목 크기는 **`sectionTitleFontSize`**(clamp 16~18px) 전 페이지 공통 규칙을 따른다.
  섹션마다 다른 축소 곡선 금지.
- 섹션 제목 왼쪽에 36px 아이콘 배지. 색은 **`*Subtle` 면 + `*Text` 글리프** 쌍만
  (`PORTFOLIO_PRESET_GROUPS.tone` 과 같은 어법 — `color-mix` 파생 면 금지).

### S1 히어로

```
1280 ┌──────────────────────────────────────────────────────────────┐
     │▔▔▔▔▔ 4px hue 리본 ▔▔▔▔▔                                       │
     │ [◆36] 배당, 여기서부터 이해하고 계산합니다      [Primary][Sec]│  ← 한 줄
     │ 리드 한 문장                                                  │
     │ ┌ 🔍 [ SCHD, JEPI 같은 종목을 검색해 보세요        ] ┐        │  ← 폭 min(520px,100%)
     │ (조건부) 이 기기에 저장된 계산이 있습니다  [이어서 계산하기]  │
     └──────────────────────────────────────────────────────────────┘
768  동일 구조. CTA 는 제목과 같은 줄 유지(>640). 검색 폭 min(520px,100%).
390  ┌───────────────────────────────┐
     │▔▔▔ 리본 ▔▔▔                    │
     │ [◆36] 제목(1~2줄)              │
     │ [ Primary  ][  Secondary  ]    │  ← 전폭 2분할 (HeroActions 의 ≤640 규칙)
     │ 리드(2줄)                      │
     │ 🔍 [ 검색 …             ] 전폭 │
     │ (조건부) 이어서 계산하기       │
     └───────────────────────────────┘
```

- `PageHero` props: `icon` = lucide `Sprout`(성장·시작 / 클리셰 아님), `titleAs="h1"`,
  `tone="gradient"`(기본), `actions` = CTA 2개, `meta` = `<HeroExtras>`(검색 + 조건부 줄).
- `notice` 슬롯은 **쓰지 않는다** — 랜딩의 고지는 푸터가 받는다.

### S2 지금 시장 (`MarketIndexStrip` 최초 배선)

```
1280 [주요 지수]                                  전일 대비 · 참고용 시세
     ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐          ← auto-fit minmax(min(140px,100%),1fr)
     │S&P  ││나스닥││코스피││코스닥││니케이│          1120px → 5칸 한 줄
     └─────┘└─────┘└─────┘└─────┘└─────┘
768  706px  → 5칸 (140×5 + gap 8×4 = 732 > 706) → **4칸 + 1칸** 2줄
390  358px  → 2칸 × 3줄
```

- **배선은 두 줄이다**(부품 주석 `MarketIndexStrip.tsx:81-94`):
  `useMarketIndicesSync()` 를 **`LandingPage` 컨테이너에서 한 번만** 호출 + `<MarketIndexStrip />` 배치.
  🔴 부품 안에서 부르면 중복 조회, 안 부르면 **영원히 스켈레톤**이다.
- 카드로 감싸지 마라 — `Root` 가 투명이고 셀이 각자 `surfaceMuted` 면을 갖는다(대비 검증된 쌍).
  카드 안에 넣으면 "카드 안 카드"이고 셀 면이 검증 밖 조합 위에 앉는다.
- 히어로 **바깥** 형제다. 히어로 안에 넣으면 390px 예산이 +301px 늘어나 접힘이 깨진다.

### S3 주식 → ETF → 배당주 (한 섹션, 3단)

```
1280 [◆] 배당을 알기 전에, 세 단어
     ┌───────────┐ → ┌───────────┐ → ┌───────────┐     3열 · gap clamp(12,2vw,20)
     │①주식      │   │②ETF       │   │③배당주    │     Card tone='default'
     │본문 3~4줄 │   │본문 3~4줄 │   │본문 3~4줄 │     h3 = 각 카드 제목
     └───────────┘   └───────────┘   └───────────┘
768  1열 스택 (≤820 = media.down('tablet')). 순서 번호 ①②③ 가 세로 흐름을 대신한다.
390  1열 스택. 카드 패딩 clamp(16,2.4vw,28) → 16px.
```

- 🔴 **3개로 쪼개지 않는다**(투어 금지). 하나의 `<section>` + 하나의 `<h2>` + `h3` 3개.
- 화살표(→)는 **CSS 의사요소 장식**이고 1열에서는 사라진다. `aria-hidden`.
- 카드에 순서 배지(①②③) — 숫자는 `font.dataNumeric`, 배지 면은 `identitySubtle`+`identityText`.

### S4 왜 배당인가 — 재투자와 시간

```
1280 [◆] 배당을 다시 넣으면 무엇이 달라지나
     본문 문단 2개 (max-width: 60ch)
     ┌──────────────────────────────────────────┐  Card tone='sunken'
     │ 계산에 필요한 값 4가지                    │  ← 라벨 4개 나열(배당률/배당 성장률/기간/세율)
     └──────────────────────────────────────────┘
     → 인라인 링크: "배당 시뮬레이터에서 직접 계산해 보기"
768 / 390  동일(단일 열). 문단 폭이 컨테이너에 맞춰 줄어든다.
```

- **비유 금지.** 문단은 "받은 배당으로 다시 산다 → 주식 수가 는다 → 다음 배당이 는다"는 **절차**로만 쓴다.
- 진입은 **문장 안 인라인 링크**(pm-po 지시: "문장 안에서 알림"). 큰 버튼을 또 두지 않는다 —
  히어로 CTA 와 경쟁한다.

### S5 매달 들어오는 현금

```
1280 [◆] 배당이 들어오는 달은 종목마다 다릅니다
     리드 1~2줄
     ┌────────────────────────────────────────────────────────────┐  Card tone='default'
     │ SCHD  분기 지급(연 4회)   1 2 [3] 4 5 [6] 7 8 [9]10 11[12] │  ← 12칸 리듬
     │ VIG   분기 지급(연 4회)   1 2 [3] 4 5 6 [7] 8 9 [10]11[12] │
     │ O     매월 지급(연 12회) [1][2][3][4][5][6][7][8][9][10][11][12]│
     └────────────────────────────────────────────────────────────┘
     → 인라인 링크: "내 종목의 지급 예정일은 배당 캘린더에서 확인하실 수 있습니다"
768  동일. 티커명 열 6ch 고정(캘린더 관례), 12칸 셀 폭 자동.
390  라벨(티커+주기)이 **셀 위 줄로 승격**, 12칸은 그 아래 전폭.
     셀 폭 = 318 / 12 ≈ 26px, 숫자 font.size['2xs'](11px).
```

- 🔴 **숫자를 지어내지 않는다.** 12칸은 `DIVIDEND_UNIVERSE[ticker].payoutMonths` 를 **런타임에**
  읽어 그린다. 지급 월은 월 1회 크론이 갱신하므로 카피에 "SCHD 는 3·6·9·12월"이라고 **쓰지 않는다**
  (`decisions.md` 티커 SEO 의 "숫자를 문자열에 박지 마라"와 같은 근거).
- 🔴 **색만으로 말하지 않는다.** 지급 달 셀 = `accentAltSubtle` 면 + `accentAltText` 숫자 **+ 굵기
  semibold**, 비지급 달 = `surfaceSunken` + `textMuted` regular. 여기에 **행마다 텍스트 요약**
  ("분기 지급(연 4회)")과 행 `aria-label`("SCHD, 3월·6월·9월·12월 지급")을 함께 둔다.
  셀 폭 26~40px 이라 `tintscan` 의 틴트 면 하한(180px)에 걸리지 않는다 ✅
- 🔴 **약속형 금지.** 리드는 "지급 달이 다른 종목을 함께 담으면 배당이 들어오는 달이 촘촘해집니다"
  까지만 말하고, **금액을 말하지 않는다**. 뒤에 정직한 한 문장을 붙인다(§5 카피 참조).

### S6 전략·대가 포트폴리오 둘러보기

```
1280 [◆] 사람들이 많이 쓰는 구성 13가지
     ┌ 인컴 · 지금부터 매달 현금이 들어오는 쪽 ─────────────────────┐  ← 그룹 헤더(h3) + 배지
     │ ┌─────────┐┌─────────┐┌─────────┐                            │  3열
     │ │제목     ││제목     ││제목     │                            │  Card tone='default'
     │ │hook 1줄 ││hook     ││hook     │                            │
     │ │▮▮▮▮▮▯▯▯ ││▮▮▮▮▯▯▯▯ ││▮▮▮▮▮▯▯▯ │  ← 비중 누적 막대(장식)     │
     │ │SCHD 30%·││…        ││…        │  ← 비중 텍스트(사실)        │
     │ └─────────┘└─────────┘└─────────┘                            │
     │ [ 인컴 2개 더 보기 ]   ← aria-expanded 디스클로저             │
     └──────────────────────────────────────────────────────────────┘
     … 성장 / 균형 / 특화 3그룹 반복 …
     [ 시뮬레이터에서 골라 적용하기 ]  ← 섹션 끝 단일 CTA(secondary)
768  2열 (761~1023).
390  1열 (≤760 = media.down('tabletSm') — 기존 프리셋 보드와 같은 경계).
```

**🔴 데이터 규율 (반드시 지켜라)**

| 필드 | 랜딩 | 이유 |
|---|---|---|
| `title` | ✅ | |
| `hook` | ✅ | |
| `allocations` → **비중 텍스트**("SCHD 30% · VIG 20% · …") | ✅ | 사실이고, 화면과 막대가 **같은 배열**에서 나온다 |
| `coreType` | ❌ **쓰지 않는다** | `allocations` 의 티커 목록을 손으로 적은 사본이다. 둘을 나란히 두면 어긋날 때 어느 쪽이 맞는지 알 수 없다 |
| `expectedMonthlyDividend` · `monthlyInvestment` · `targetInvestment` · `investmentPeriod` | 🔴 **절대 금지** | 엔진 계산이 아니라 손으로 적은 큐레이션 문구다. 랜딩에 쓰면 **근거 없는 수익 약속**이다 |

- 비중 **막대는 장식**(`aria-hidden`)이고 색은 `var(--sb-chart-series-N)`(`% 8`) —
  도넛·슬라이더와 같은 카테고리 색 규칙. 🔴 **막대 위에 텍스트를 얹지 마라**
  (시리즈 색은 16조합에서 명암이 갈린다). 정보는 그 아래 **비중 텍스트**가 전부 말한다.
- 그룹 헤더 배지 색 = `PORTFOLIO_PRESET_GROUPS[].tone`(`identity`/`accentAlt`/`accent`/`neutral`)의
  `*Subtle`+`*Text` 쌍. 이미 검증된 조합이라 새로 만들 것이 없다.
- 초기 노출 = **그룹당 2개**(`groupPortfolioPresets(2)`), 나머지는 디스클로저.
  `<button aria-expanded aria-controls>` + 라벨 `"{그룹명} {N}개 더 보기"` / 펼침 시 `"접기"`.
  높이 애니메이션 없음(아코디언 펼침은 허용 모션이지만 랜딩에서는 **즉시 표시**로 둔다 — §7).
- **카드는 링크가 아니다.** 프리셋 딥링크 적용(`/simulator` 로 특정 프리셋 전달)은 새 프리필
  계약이 필요하고, 마이그레이션 §6 이 "랜딩에 복제 금지 — 하이드레이션 순서 계약이 깨진다"고
  경고한 영역이다. v1 은 **섹션 끝 CTA 하나**로 `/simulator` 에 보낸다(빈 포트폴리오로 도착하면
  시뮬레이터가 온보딩 프리셋 보드를 그대로 띄운다 = 착지가 정확하다). 딥링크는 §12 R3.

### S7 시작하려면 무엇을 준비하나

```
1280 [◆] 시작하기 전에                                Card tone='wash' (🔴 틴트 면 #2)
     ┌───────────────────────────┬───────────────────────────┐
     │ 앱에서 해보는 순서 (h3)   │ 실제 투자 전에 스스로     │   2열 (≥821)
     │ ① 종목을 고릅니다         │ 확인할 것 (h3)            │
     │ ② 조건을 정합니다         │ · 증권 계좌와 해외 주식   │
     │ ③ 결과를 봅니다           │ · 환전과 환율             │
     │                           │ · 세금                    │
     │ 가입 없이 바로 시작…      │ · 손실 가능성             │
     └───────────────────────────┴───────────────────────────┘
768 / 390  1열 스택(≤820). 왼쪽 목록이 먼저, 오른쪽이 뒤.
```

- 🔴 **두 목록의 성격이 다르다는 것이 시각적으로 읽혀야 한다.** 왼쪽 = 번호 있는 순서(`<ol>`),
  오른쪽 = 점 목록(`<ul>`) + 각 항목 앞 `AlertCircle` 글리프(`textSecondary`, 경고색 아님).
  ⚠ 오른쪽을 `Banner tone='warning'` 으로 만들지 마라 — 틴트 면이 3개가 된다.
- 🔴 **특정 증권사·상품·매수 시점을 절대 언급하지 않는다.** 외부 금융사 링크 0건.

### S8 자주 묻는 질문

```
1280 [◆] 자주 묻는 질문
     ┌ Q. 이 사이트는 무료인가요?                              + ┐  ← <details>/<summary>
     ├ Q. 가입해야 쓸 수 있나요?                               + ┤
     … 8문항 …
768 / 390  동일(항상 1열). 질문이 2줄로 감기면 + 표식은 첫 줄 오른쪽 유지.
```

- **`<details>`/`<summary>` 를 쓴다** — 티커 상세 FAQ(`TickerDetailPage.styled.ts:734-796`)와 같은
  부품 구조. 네이티브라 키보드(Enter/Space)·`aria-expanded` 가 **브라우저가 준다**.
  🔴 커스텀 아코디언을 새로 만들지 마라.
- 펼친 항목 왼쪽 3px 레일 — 티커 상세는 `--tk-gradient` 를 쓰지만 랜딩은 **`pageHue`** 를 쓴다.
  (3px 폭이라 틴트 면 하한 미달 ✅)
- 기본 상태 = **전부 접힘**. 첫 항목 자동 펼침 금지(자동 오케스트레이션이다).

### 푸터

`<PageFooter notes={LANDING_COPY.footnotes} notesTitle="이 사이트에 대해" />`
사이트 공통 고지(무료·비자문·비영리)와 `/privacy`·`/terms` 링크는 컴포넌트가 이미 갖고 있다.
`notes` 에는 **랜딩에서만 참인 문장**만 넣는다(§5 카피).

---

## 5. 전 섹션 카피 초안 (합니다체)

> 정본 위치 = **`pages/Landing/copy/landingCopy.ts`** 한 파일.
> 법무 문서(`pages/Legal/copy/*`)와 같은 근거 — 문장만 바뀌는 개정이 마크업 diff 와 섞이면
> "무엇이 바뀌었나"가 안 읽힌다. FAQ 는 JSON-LD 로 색인되므로 특히 그렇다.

### S1 히어로

- **제목(h1)**: `배당, 여기서부터 이해하고 계산합니다`
- **리드**: `주식과 ETF가 무엇인지부터, 배당을 다시 넣으면 얼마가 되는지까지 한 화면에서 확인하실 수 있습니다. 가입은 필요하지 않습니다.`
  (57자 → 390px 에서 2줄. §3-2 예산과 일치.)
- **CTA A안**: primary `배당 계산 시작하기` / secondary `보유 종목으로 계산`
- **CTA B안**: primary `내 월배당 확인하기` / secondary `배당 계산 시작하기`
- **검색 라벨(시각 숨김)**: `종목 검색`
- **검색 placeholder**: `SCHD, JEPI 같은 종목을 검색해 보세요`
- **이어서 계산하기(조건부)**: 안내 `이 기기에 저장된 계산이 있습니다` / 버튼 `이어서 계산하기`

### S3 주식 → ETF → 배당주

- **섹션 제목**: `배당을 알기 전에, 세 단어`
- **①주식**: `주식은 회사의 지분입니다. 한 주를 사면 그 회사의 아주 작은 일부를 갖게 됩니다. 회사의 가치가 오르면 주가도 오르고, 내리면 주가도 함께 내립니다.`
- **②ETF**: `ETF는 여러 종목을 한 바구니에 담아 주식처럼 사고팔 수 있게 만든 상품입니다. 한 주만 사도 수십에서 수백 개 종목에 나눠 담는 효과가 있어, 한 회사에 문제가 생겨도 전체가 같은 폭으로 흔들리지는 않습니다.`
- **③배당주**: `배당은 회사가 번 이익의 일부를 주주에게 현금으로 나눠 주는 것입니다. 배당주와 배당 ETF는 그 지급을 오래 이어 온 종목을 모은 것입니다. 다만 배당은 약속이 아니라 회사의 결정이라, 줄어들거나 멈출 수 있습니다.`

### S4 왜 배당인가 — 재투자와 시간 (🔴 비유 0)

- **섹션 제목**: `배당을 다시 넣으면 무엇이 달라지나`
- **문단 1**: `받은 배당으로 같은 종목을 다시 사면 보유 주식 수가 늘어납니다. 주식 수가 늘어난 만큼 다음 배당도 늘어나고, 그 배당으로 또 사면 주식 수가 다시 늘어납니다. 이 되풀이가 오래 이어질수록 새로 넣는 돈이 없어도 배당이 늘어나는 폭이 커집니다. 이것을 복리라고 부릅니다.`
- **문단 2**: `얼마나 늘어나는지는 배당률, 배당이 해마다 늘어나는 속도, 투자 기간, 세율에 따라 전부 달라집니다. 재투자는 자동으로 일어나지 않고, 배당을 받을 때마다 다시 사겠다고 결정해야 합니다.`
- **sunken 카드 제목**: `계산에 필요한 값 네 가지` / 항목: `배당률` `배당 성장률` `투자 기간` `배당소득세율`
- **인라인 링크**: `배당 시뮬레이터에서 직접 계산해 보실 수 있습니다.`

### S5 매달 들어오는 현금 (🔴 조건부·예시형)

- **섹션 제목**: `배당이 들어오는 달은 종목마다 다릅니다`
- **리드**: `미국 배당 ETF는 대체로 세 달에 한 번, 일부는 매달 배당을 지급합니다. 지급하는 달이 서로 다른 종목을 함께 담으면 배당이 들어오는 달이 촘촘해집니다.`
- **정직 한 문장(필수)**: `다만 배당을 자주 받는 것과 자산이 많이 늘어나는 것은 다른 이야기입니다. 어느 쪽을 원하시는지는 직접 계산해 보고 정하시는 편이 좋습니다.`
- **행 요약**: `분기 지급(연 4회)` / `매월 지급(연 12회)`
- **각주(카드 안 마지막 줄)**: `지급 월은 과거 지급 이력에서 확인한 값이며, 실제 지급 여부와 날짜는 달라질 수 있습니다.`
- **인라인 링크**: `내 종목의 지급 예정일은 배당 캘린더에서 확인하실 수 있습니다.`

### S6 전략·대가 포트폴리오

- **섹션 제목**: `사람들이 많이 쓰는 구성 13가지`
- **리드**: `아래 구성은 시뮬레이터에 그대로 넣어 볼 수 있는 예시입니다. 특정 종목의 매수를 권하는 것이 아니며, 결과는 입력하신 조건에 따라 달라집니다.`
- **그룹 제목·설명**: `PORTFOLIO_PRESET_GROUPS` 의 `label`·`hint` 를 **그대로** 쓴다(중복 작성 금지).
- **디스클로저**: `{label} {N}개 더 보기` / `접기`
- **섹션 CTA**: `시뮬레이터에서 골라 적용하기`

### S7 시작하려면 무엇을 준비하나

- **섹션 제목**: `시작하기 전에`
- **왼쪽 제목**: `앱에서 해보는 순서`
  1. `관심 있는 종목을 고릅니다. 위 구성 중 하나를 골라도 되고, 직접 검색해 담아도 됩니다.`
  2. `매달 얼마를 몇 년 동안 넣을지, 세율은 얼마로 볼지 정합니다.`
  3. `자산과 월 배당이 해마다 어떻게 달라지는지 결과 화면에서 확인합니다.`
  - 마무리: `가입은 필요하지 않습니다. 입력하신 값은 사용하시는 기기에 저장되고, 원하실 때 링크로 공유하실 수 있습니다.`
- **오른쪽 제목**: `실제 투자 전에 스스로 확인할 것`
  - `해외 주식을 사려면 증권 계좌와 해외 주식 거래 신청이 필요합니다.`
  - `원화를 달러로 바꾸는 과정과 환율 변동이 실제 결과에 영향을 줍니다.`
  - `배당에는 세금이 붙고, 금액이 커지면 금융소득종합과세 대상이 될 수 있습니다.`
  - `여기 숫자는 입력하신 가정을 계산한 결과일 뿐 수익을 보장하지 않으며, 원금 손실이 발생할 수 있습니다.`

### S8 FAQ — 🔴 문항별 승인 표시

> ⚠ **이 8문항은 `FAQPage` JSON-LD 로 색인된다. 검색 결과에 그대로 인용되므로 문장이 곧 공개 약속이다.**
> `승인 필요` 표시된 항목은 사용자 확인 전에는 **JSON-LD 에 넣지 마라**(화면에만 두거나 문항을 뺀다).

| # | 질문 | 답변 | 상태 |
|---|---|---|---|
| 1 | 이 사이트는 무료인가요? | 네, 전부 무료입니다. 유료 기능이나 광고가 없는 개인 프로젝트입니다. | 🔴 **승인 필요** — 유료화·광고 도입 시 이 문장이 거짓이 된다. 다만 `PageFooter` 의 사이트 공통 고지가 이미 같은 주장을 한다(정합 ✅) |
| 2 | 가입해야 쓸 수 있나요? | 아니요. 시뮬레이터, 종목 소개, 배당 캘린더는 로그인 없이 이용하실 수 있습니다. 로그인은 여러 기기에서 같은 내용을 이어 보거나 커뮤니티에 글을 쓰실 때만 필요합니다. | 🔴 **승인 필요**(사실 확인) — 커뮤니티가 꺼진 배포에서도 참인 문장인지 확인 |
| 3 | 입력한 내용은 어디에 저장되나요? | 로그인하지 않으시면 사용하시는 기기의 브라우저에만 저장됩니다. 로그인하시면 저장한 내용이 계정에 함께 보관되어 다른 기기에서도 이어서 보실 수 있습니다. 자세한 내용은 개인정보처리방침에 있습니다. | 🔴 **승인 필요** — 방침 본문과 어긋나면 안 된다(`pages/Legal/copy/privacyCopy.ts` 대조 필수) |
| 4 | 계산은 어디에서 이루어지나요? | 계산은 사용하시는 브라우저 안에서 이루어지며, 입력하신 조건이 계산을 위해 서버로 전송되지는 않습니다. | 🔴 **승인 필요** — `llms.txt` 정정 이력과 정합해야 한다(계산=브라우저 ✅ / "서버가 없다"는 거짓 ❌). 문장이 "계산"에 한정돼 있는지 검토 |
| 5 | 배당률이나 주가 같은 숫자는 어디서 오나요? | 공개된 시세 정보를 정기적으로 받아 갱신합니다. 화면의 숫자는 그 갱신 시점을 기준으로 하며 실시간 시세가 아닙니다. | 🔴 **승인 필요** — "정기적으로"의 실제 주기(월 1회 크론)를 밝힐지 결정 |
| 6 | 계산 결과대로 배당을 받게 되나요? | 아니요. 결과는 입력하신 가정을 그대로 계산한 값입니다. 실제 배당은 회사와 운용사의 결정에 따라 줄어들거나 멈출 수 있고, 주가도 오르내립니다. | ✅ 승인 불요(면책 강화 방향, 기존 고지와 동일 주장) |
| 7 | 투자 자문인가요? | 아닙니다. 특정 종목이나 상품의 매수를 권하지 않으며, 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다. | ✅ 승인 불요(`PageFooter`·약관과 동일 주장) |
| 8 | 세금은 어떻게 계산되나요? | 입력하신 배당소득세율을 배당에 적용해 계산하며, 기본값은 15.4%입니다. 금융소득종합과세처럼 개인 상황에 따라 달라지는 부분은 계산에 포함하지 않고 안내만 표시합니다. | 🔴 **승인 필요**(엔진 동작 확인) — 15.4% 기본값은 `portfolioCopy.ts:206` 과 일치하나, 시뮬레이터 세율 기본값·`FinancialIncomeNotice` 동작을 `simulation-engineer` 가 확인해야 한다 |

### 푸터 `notes` (랜딩 전용)

- `이 화면의 설명은 배당 투자를 처음 접하시는 분을 위한 일반적인 소개이며, 특정 상품에 대한 권유가 아닙니다.`
- `지수 시세와 지급 월은 참고용이며 실시간 정보가 아닙니다.`

---

## 6. 종목 검색 — 인라인 패널 설계

### 6-1. 동작 계약

| 항목 | 값 | 근거 |
|---|---|---|
| 쿼리 파라미터 | 🔴 **`q`** | `s`·`share` 는 `RootRoute` 가 `/simulator` 로 튕긴다(마이그레이션 §1-C ⚠) |
| URL 반영 | `setSearchParams(…, { replace: true })` | 타이핑마다 히스토리가 쌓이면 뒤로가기가 망가진다 |
| 디바운스 | 300ms (`LANDING_SEARCH_DEBOUNCE_MS`) | `CommunitySearchBar` 와 같은 값이지만 **상수는 따로 둔다**(커뮤니티 상수를 랜딩이 import 하면 도메인이 섞인다) |
| IME | `compositionstart/end` 가드 — 조합 중에는 URL 을 갱신하지 않는다 | 한글 조합이 깨진다(`CommunitySearchBar.tsx:41,72`) |
| 엔터 | 즉시 반영(디바운스 건너뜀). 폼 기본 제출 막음 | |
| 빈 입력 | `q` 삭제 + **패널 미렌더** | 첫 로드 히어로 높이가 흔들리지 않는다(§3-2 예산) |

🔴 **드롭다운 오버레이가 아니다.** 결과는 검색 입력 **바로 아래, 히어로 카드 흐름 안**에 in-flow 로
들어온다. 포털·`position:absolute`·백드롭·포커스 트랩 **전부 없다**. 랜딩에 `role="dialog"` 는 **0개**여야 한다.

### 6-2. 데이터 — 경량 티커 인덱스 (신규)

🔴 **랜딩은 `shared/constants/tickers` 를 직접 import 하면 안 된다.** 그 폴더는 최상위 배럴에서
의도적으로 끊겨 있고(`decisions.md [2026-07-22][seo]`), 11종 한국어 서사만으로 서버 번들이 **416KB** 다.

```ts
// shared/constants/tickerPages/index.ts  (신규 · 의존성 0)
/**
 * `/ticker/:slug` SEO 소개 페이지가 **실재하는** 종목의 경량 인덱스.
 * 🔴 이 배열이 `shared/constants/tickers` 의 레지스트리와 어긋나면 랜딩 검색이 죽은 링크를 만든다.
 *    가드: test/landing/tickerPageIndexParity.test.ts (양방향 1:1).
 * ⚠ 한글명은 여기 복제하지 않는다 — `PRESET_TICKER_KOREAN_NAME_BY_TICKER`(shared/constants/presets)가
 *    단일 출처이고, 그 맵은 시뮬레이터가 이미 엔트리로 끌고 있어 추가 비용이 0이다.
 */
export const TICKER_PAGE_INDEX = [
  { symbol: 'SCHD', slug: 'schd' }, { symbol: 'VIG',  slug: 'vig'  },
  { symbol: 'DGRO', slug: 'dgro' }, { symbol: 'DGRW', slug: 'dgrw' },
  { symbol: 'SCHY', slug: 'schy' }, { symbol: 'HDV',  slug: 'hdv'  },
  { symbol: 'VYM',  slug: 'vym'  }, { symbol: 'SPYD', slug: 'spyd' },
  { symbol: 'JEPI', slug: 'jepi' }, { symbol: 'JEPQ', slug: 'jepq' },
  { symbol: 'O',    slug: 'o'    }
] as const;
```

**가드 테스트** `test/landing/tickerPageIndexParity.test.ts`
1. `TICKER_PAGE_INDEX` 의 `{symbol, slug}` 집합 === `TICKER_CONTENT_LIST` 의 `{ticker, slug}` 집합(양방향).
2. 모든 `symbol` 이 `PRESET_TICKER_KOREAN_NAME_BY_TICKER` 에 있다(한글명 결손 0).
   ✅ 11종 전수 확인 완료(`shared/constants/presets/index.ts:152,153,154,155,169,172,181,192,…`).
3. `shared/constants/tickerPages/index.ts` 소스에 `import` 문이 **0건**이다(리프 유지 — 이 파일이
   무거워지면 격리의 의미가 사라진다).

**매칭 규칙** (`Landing.search.utils.ts`, 순수 함수)
- 입력 정규화: `trim()`. 2자 미만이면 검색하지 않는다(1글자면 11종 중 절반이 걸린다).
- 심볼: `symbol.includes(query.toUpperCase())` — 부분일치.
- 한글명: `koreanName.includes(query)` — 부분일치(공백 무시하지 않는다, 과설계 회피).
- 정렬: ①심볼 **완전일치** ②심볼 **접두일치** ③심볼 부분일치 ④한글명 일치. 동순위는 배열 순서.
- 표시 상한 **6건**. 초과 시 마지막 줄에 `종목 전체 보기 (11종)` → `/ticker/all`.

### 6-3. 상태 4종

```
[A] 미입력 (q 없음 / 2자 미만)
    → 패널 자체를 렌더하지 않는다. aria-live 도 비운다.

[B] 결과 있음 (1~6건)
    ┌ 검색 결과 3건 ─────────────────────────────┐   ← 시각 텍스트 + aria-live 가 같은 문장
    │ ▸ SCHD   슈왑 미국 배당주 ETF          →   │   ← <Link to="/ticker/schd">, 행 높이 46px
    │ ▸ JEPI   JP모건 에쿼티 프리미엄 인컴 ETF → │
    │ ▸ …                                        │
    └────────────────────────────────────────────┘
    · 1열 · 행 높이 46px 균일 · gap 구분 (배당 캘린더 검색 결과 관례, decisions 2026-07-25 ④)
    · 심볼 = font.dataNumeric · 6ch 고정폭(캘린더 티커 열 관례) / 한글명 = textSecondary

[C] 결과 없음
    ┌───────────────────────────────────────────────────────────┐
    │ '테슬라'와 일치하는 종목 소개가 없습니다.                  │   ← 사유를 말한다(무음 실패 금지)
    │ 소개 글이 준비된 종목                                      │   ← 🔴 "추천"이 아니다
    │ ▸ SCHD  슈왑 미국 배당주 ETF                               │
    │ ▸ VYM   뱅가드 고배당 수익 ETF                             │
    │ ▸ O     리얼티 인컴                                        │
    │ 찾으시는 종목이 없다면 시뮬레이터에서 직접 만드실 수 있습니다. → │
    └───────────────────────────────────────────────────────────┘
    🔴 폴백 3종 = SCHD(배당성장) · VYM(고배당) · O(월배당) — 성격이 겹치지 않는 셋.
       카피는 "**소개 글이 준비된 종목**"이다. "추천 종목"이라고 쓰면 투자 권유가 된다.
       상수 `LANDING_SEARCH_FALLBACK = ['SCHD','VYM','O']`, 가드 테스트가 셋 다
       `TICKER_PAGE_INDEX` 에 있음을 단정한다(죽은 폴백 방지).

[D] 검색 대상 밖 (해당 없음)
    이 검색은 로컬 배열 11종을 훑는 동기 함수다 — **로딩도 실패도 없다.**
    🔴 스피너·스켈레톤을 만들지 마라(있지도 않은 비동기를 흉내 내는 것이다).
```

### 6-4. 접근성

```html
<form role="search" aria-labelledby={searchLabelId}>
  <label id={searchLabelId} for={inputId} class="sr-only">종목 검색</label>
  <input id={inputId} type="search" placeholder="SCHD, JEPI 같은 종목을 검색해 보세요"
         aria-describedby={statusId} autocomplete="off" />
</form>
<p id={statusId} role="status" aria-live="polite">검색 결과 3건</p>   <!-- 항상 마운트, 텍스트만 교체 -->
<ul aria-labelledby={statusId}> … </ul>
```

- 🔴 **`role="status"` 노드는 처음부터 끝까지 마운트 상태를 유지**하고 텍스트만 바꾼다.
  조건부 언마운트하면 이후 변경이 낭독되지 않는다(`PortfolioPage.styled.ts:38-41` 의 `LiveRegion` 주석).
- placeholder 는 접근명이 **아니다** — 시각 숨김 `<label>` 이 필수다.
- `<input type="search">` 의 브라우저 기본 × 버튼은 그대로 둔다(추가 지우기 버튼을 만들지 마라).
- 🔴 **`aria-activedescendant` combobox 패턴을 쓰지 마라.** 이건 팝업이 아니라 in-flow 목록이고,
  combobox 를 선언하면 지키지 않을 키보드 계약(↑↓ 이동·Esc 닫기)을 약속하는 것이 된다
  (캘린더가 `role="grid"` 를 거부한 것과 같은 근거).

### 6-5. 재방문자 — "이어서 계산하기"

```ts
// 🔴 IndexedDB 를 읽지 않는다. 동기 localStorage 마커 한 개.
const HAS_WORKSPACE_KEY = 'snowball:has-workspace';
const [hasWorkspace] = useState(() => {        // ← useEffect 가 아니다(한 프레임 깜빡임 방지)
  try { return window.localStorage.getItem(HAS_WORKSPACE_KEY) === '1'; } catch { return false; }
});
```

- **쓰기는 `state-engineer` 담당** — `jotai/snowball/persistence/appStateStorage.ts:107`
  `writePersistedAppState` 성공 직후 `setItem('1')`, `recoverCorruptedPortfolioDb`(line 139) 등
  DB 를 비우는 경로에서 `removeItem`. 🔴 **이 키는 새로 만드는 것이다**(현재 레포에 없음 —
  기존 키는 `snowball:palette`·`snowball:color-scheme`·`snowball:cloud-local-owner` 등).
- **마커가 없어도 안전하다.** 사파리 프라이빗·localStorage 차단·첫 방문 모두 `false` 로 떨어지고,
  **항상 보이는 시뮬레이터 CTA** 가 안전망이다(§2 대응 1·2).
- 🔴 **마커를 "데이터가 있다"의 증거로 쓰지 마라.** "이어서 계산하기"는 그냥 `/simulator` 로 가는
  링크이고, 데이터가 없으면 시뮬레이터가 평소의 빈 상태를 그린다. 마커가 틀려도 사고가 없다.

---

## 7. 모션 예산

### ✅ 허용 (전부 기존 토큰 안)

| 대상 | 값 |
|---|---|
| 버튼·링크 호버/누름 | 기존 `pressable` · `motion.ease` 200ms 이하 |
| FAQ `<summary>` 의 `+` → `×` 회전 | `transform ${motion.fast}(150ms) ${motion.ease}` (티커 상세와 동일) |
| S6 "더 보기" 디스클로저 | **모션 없음** — 즉시 표시 |
| `MarketIndexStrip` 스켈레톤 펄스 | 부품이 이미 갖고 있음. `prefers-reduced-motion` 에서 정지(의도) |
| 검색 결과 패널 등장 | **모션 없음** |

### ❌ 금지 (확정 결정 — 뒤집으려면 사용자 승인)

- **스크롤 진입 애니메이션 전면 금지** — IntersectionObserver 리빌, fade-in-on-scroll, 스태거 등장.
- 패럴랙스 · 스크롤 스냅 · 스크롤 진행률 바 · sticky 진행 표시.
- 자동 재생(캐러셀·슬라이드쇼·루프 배경) · 숫자 카운트업 · 타이핑 애니메이션.
- 자동 스크롤(`scrollIntoView`) · 모달 · 오버레이 · `components/TourGuide` 재사용.
- 페이지 로드 오케스트레이션(W3 첫 결과 등장 같은 연출을 랜딩에 복제하는 것).

> ⚠ **"승인하면 이렇게 살릴 수 있다"** — 사용자가 나중에 "너무 정적이다"라고 하면,
> **IO 리빌은 제안하지 마라.** 초기 `opacity:0` 이 테스트 스텁·reduced-motion 에서 콘텐츠를
> **영영 숨긴** 사고 이력이 있다. 대신 안전한 선택지는 ①S6 프리셋 카드 호버 시 비중 막대의
> 200ms 밝기 전이 ②S5 12칸 리듬의 호버 강조 ③FAQ 펼침에만 `motion.easeInOut` 높이 전이 —
> 셋 다 **사용자 동작이 발동시키고, 초기 상태가 이미 보이는 것**이다.

---

## 8. 색 · 토큰 배정

🔴 **하드코딩 hex 0건. 새 토큰 0건. `color-mix` 파생 면 위 텍스트 0건.**

| 자리 | 토큰 | 비고 |
|---|---|---|
| 히어로 배경 | `color.gradientHero` | `PageHero tone='gradient'` 기본. **틴트 면 #1** |
| 히어로 상단 4px 리본 · 아이콘 배지 · 테두리 | `pageHue` / `pageHueMix(14)` / `pageHueMix(38,'transparent')` | `PageHero` 가 이미 그린다. hue = `identity`(D2) |
| 섹션 아이콘 배지 (S3~S8) | `identitySubtle`+`identityText` / `accentSubtle`+`accentText` / `accentAltSubtle`+`accentAltText` | 36px → 틴트 면 하한(180px) 미달 ✅. 검증된 쌍만 |
| S3·S5·S6 카드 | `cardElevation('base')` = `surface` + 1px `border` | 테두리·그림자 **둘 중 하나만** |
| S4 "계산에 필요한 값" | `Card tone='sunken'` | 곁가지 |
| **S7 시작 준비 카드** | `Card tone='wash'` | **틴트 면 #2 — 랜딩의 마지막 틴트다** |
| S5 지급 달 셀(채움) | `accentAltSubtle` 면 + `accentAltText` 숫자 + semibold | 26~40px → 틴트 면 미달 ✅ |
| S5 비지급 달 셀 | `surfaceSunken` + `textMuted` | |
| S6 비중 막대 세그먼트 | `var(--sb-chart-series-N)` (`index % 8`) | 카테고리 색. 🔴 막대 위 텍스트 금지 |
| S6 그룹 배지 | `PORTFOLIO_PRESET_GROUPS[].tone` → `*Subtle`+`*Text` | 기존 매핑 재사용 |
| S8 펼친 항목 왼쪽 3px 레일 | `pageHue` | 선(3px)이라 면이 아니다 |
| 지수 변동률 | `dataPositive`/`dataNegative`/`textSecondary` | 부품이 이미 소유. 🔴 값 본체는 `color.text` 중립 |
| 본문 · 보조 · 약한 텍스트 | `color.text` / `textSecondary` / `textMuted` | ⚠ 히어로 면(`gradient-hero`) 위에는 **`textMuted` 금지**(velog 다크 4.04:1) |

**🔴 랜딩의 틴트 면 = 정확히 2개**(히어로 그라디언트 + S7 wash). `tools/dev/tintscan.mjs` 의
기준선을 `/`(랜딩) = **2** 로 설정한다. 3개째를 넣고 싶어지면 대신 **글리프·1px 테두리·작은 배지**로
색을 쓴다(decisions.md `[2026-07-31]` "약한 톤은 중립 면 + 1px 톤 테두리 + 색 아이콘").

**"단색은 허접하다"에 대한 답** — 이 랜딩의 채도는 면이 아니라 ①hue 리본·배지 ②섹션마다 도는
3계열 아이콘 배지 ③S5 의 12칸 리듬(accentAlt) ④S6 의 8색 시리즈 비중 막대 13장 ⑤지수 등락색이
만든다. 면을 늘리지 않고도 화면당 **5개 색 계열**이 돈다.

---

## 9. 접근성 · SEO

### 9-1. 헤딩 트리 (D3 결론)

```
h1  배당, 여기서부터 이해하고 계산합니다            ← PageHero titleAs="h1" (문서 유일)
├ h2  주요 지수                                     ← MarketIndexStrip 자체 h2 (S2)
├ h2  배당을 알기 전에, 세 단어                     ← S3
│ ├ h3 주식 / h3 ETF / h3 배당주
├ h2  배당을 다시 넣으면 무엇이 달라지나            ← S4
│ └ h3 계산에 필요한 값 네 가지
├ h2  배당이 들어오는 달은 종목마다 다릅니다        ← S5
├ h2  사람들이 많이 쓰는 구성 13가지                ← S6
│ └ h3 인컴 / h3 성장 / h3 균형 / h3 특화
├ h2  시작하기 전에                                 ← S7
│ └ h3 앱에서 해보는 순서 / h3 실제 투자 전에 스스로 확인할 것
└ h2  자주 묻는 질문                                ← S8 (문항은 <summary> — 헤딩 아님, 티커 상세 관례)
```

- 워드마크는 `span`(AppHeader 기본값). **레벨을 건너뛰지 않는다**(h1→h2→h3).

### 9-2. 포커스 순서 · 키보드

1. (건너뛰기 링크가 있다면 그것) → AppHeader: 워드마크 → nav 6개 → 테마/로그인/⋯
2. 히어로: **primary CTA → secondary CTA → 검색 입력** → (조건부) 이어서 계산하기
3. 검색 결과 링크 N개 → S3 → … → S6 디스클로저 버튼 → S8 `<summary>` 8개 → 푸터 링크
- 🔴 **탭 순서 = DOM 순서.** `tabindex` 양수 금지, `autoFocus` 금지(랜딩에 도착하자마자 포커스를
  가져가면 스크린리더 사용자가 제목을 못 듣는다).
- FAQ: `<summary>` 가 네이티브 포커서블 + Enter/Space 로 토글 + `aria-expanded` 자동.
- S6 디스클로저: `<button aria-expanded aria-controls={panelId}>`. 펼친 뒤 **포커스를 옮기지 않는다**
  (자동 이동은 오케스트레이션이다). 접을 때도 트리거에 그대로 남는다.
- 🔴 **포커스 트랩 0개** — 랜딩에 모달이 없으므로 트랩을 만들 이유도 없다. `role="dialog"` 0개.

### 9-3. SEO (🔴 `index.html` 은 이 PR 소관)

| 대상 | 조치 |
|---|---|
| `index.html` `<title>`·`description`·`og:*` | 시뮬레이터 문구 → **랜딩 문구**로 교체. 랜딩은 `useDocumentMeta` 를 **쓰지 않는다**(정적 메타가 곧 이 페이지의 메타다) |
| `index.html` JSON-LD `@graph` | ①`WebSite`·`WebApplication` 유지 ②**`FAQPage` 추가**(S8 8문항) ③🔴 **`featureList` 의 `"배당 재투자(스노우볼) 시뮬레이션"` → `"배당 재투자 시뮬레이션"`**(§0 F2) |
| FAQ 드리프트 가드 | `test/seo/landingFaqStructuredData.test.ts` — `index.html` 의 `FAQPage` 문항이 `landingCopy.faq` 와 **문자열 단위로 일치**함을 단정. 두 곳에 같은 문장이 사는 것은 피할 수 없다(런타임 JSON-LD 는 크롤러가 못 읽는다) — 대신 어긋나면 빨개지게 한다 |
| `vite.config.ts` `ROUTES` | `/` priority 1.0 유지(이제 랜딩), `/simulator` 0.9 추가 |
| `.app-shell-fallback` | 랜딩 문구로 교체(JS 미실행 크롤러가 보는 유일한 본문) |
| canonical | `/` 는 정적 canonical 과 일치 ✅ (`/simulator` 의 canonical 부채는 별도 트랙 — 마이그레이션 §3) |

---

## 10. 반응형 규칙 — 무엇이 접히고 무엇이 남는가

| | **≥1024 (데스크톱)** | **761~1023 (태블릿)** | **≤760 (모바일)** |
|---|---|---|---|
| AppHeader | 한 줄 65px | **두 줄 105~111px** (`headerStack`=1023) | 두 줄 |
| S1 CTA | 제목과 같은 줄, 우측 | 제목과 같은 줄(>640) | **제목 아래 전폭 2분할**(≤640) |
| S1 검색 | `min(520px, 100%)` | 동일 | **전폭** |
| S2 지수 | 5칸 한 줄 | **4+1 두 줄** | **2칸 × 3줄** |
| S3 3단 | **3열** | 1열(≤820) | 1열 |
| S3 화살표(→) | 표시 | 숨김 | 숨김 |
| S4 | 1열, 문단 `max-width:60ch` | 동일 | 동일 |
| S5 리듬 | 티커명 6ch + 12칸 한 줄 | 동일 | **라벨이 윗줄로 승격**, 12칸 전폭 |
| S6 프리셋 | **3열** | **2열** | **1열**(`tabletSm`=760) |
| S6 초기 노출 | 그룹당 2 + 더 보기 | 동일 | 동일 |
| S7 두 목록 | **2열** | 1열(≤820) | 1열 |
| S8 FAQ | 1열 | 1열 | 1열 |
| 푸터 | 좌측 2px 레일 + 링크 한 줄 | 동일 | 링크 줄바꿈 |

**항상 남는 것(어느 폭에서도 사라지지 않는다)**
- 헤더 nav 6개(넘치면 `NavScroller` 안에서 가로 스크롤 — 문서는 절대 넓어지지 않는다)
- **시뮬레이터 CTA**(§2 안전망)
- 8섹션 전부 · 푸터의 법무 링크

**접히는 것 = 열 수뿐이다.** 🔴 **어떤 폭에서도 콘텐츠를 `display:none` 으로 지우지 마라.**
장식(S3 화살표)만 숨긴다.

---

## 11. `frontend-engineer` 에게 넘길 파일 구조

```
pages/Landing/
├─ index.ts                                  export { default as LandingPage } from './LandingPage';
├─ LandingPage/
│  ├─ index.ts
│  ├─ LandingPage.tsx           컨테이너: useMarketIndicesSync() · 검색 상태(q) · 마커 읽기
│  ├─ LandingPage.view.tsx      순수 뷰(8섹션 조립)
│  ├─ LandingPage.styled.ts     LandingStack · HeroExtras · SectionRoot · SectionHead …
│  ├─ LandingPage.types.ts      LandingViewModel · LandingSearchState
│  ├─ LandingPage.utils.ts      searchTickerPages() 등 순수 함수
│  └─ LandingPage.test.tsx
├─ components/
│  ├─ index.ts
│  ├─ LandingSearch/            { .tsx .styled.ts .types.ts .utils.ts index.ts }
│  ├─ ConceptLadder/            S3
│  ├─ CompoundExplainer/        S4
│  ├─ PayoutRhythm/             S5  (.utils.ts = payoutMonths → 12칸 모델)
│  ├─ PresetBrowser/            S6
│  ├─ StartChecklist/           S7
│  └─ LandingFaq/               S8
└─ copy/
   ├─ index.ts
   └─ landingCopy.ts            🔴 전 섹션 문자열 + FAQ 단일 지점
```

**규칙 준수 체크**: 폴더마다 `index.ts` ✅ · 외부는 폴더 경로로만 import ✅ ·
`X.tsx`/`X.styled.ts`/`X.types.ts`/`X.utils.ts`/`X.test.tsx` 세트 ✅ · 폴더명 = 파일 prefix ✅

### 11-1. 🔴 프리셋 데이터 이전 (구조 규칙 위반 회피)

지금 프리셋 데이터는
`pages/Main/components/MainRightPanel/components/PortfolioPresetBoard/PortfolioPresetBoard.constants.ts`
안에 있다. **랜딩이 이것을 직접 import 하면 페이지 간 import 로 구조 규칙 위반**이다.

**권고 이전**

```
shared/constants/portfolioPresets/
├─ index.ts
├─ portfolioPresets.constants.ts   ← PORTFOLIO_PRESET_GROUPS · PORTFOLIO_PRESET_PLACEHOLDERS
│                                     PORTFOLIO_PRESET_VISIBLE_PER_GROUP · PRESET_ICON_* · 타입
└─ portfolioPresets.utils.ts       ← groupPortfolioPresets · buildPresetMetrics
```

`PortfolioPresetBoard` 는 이 폴더에서 re-export 하거나 직접 import 한다(폴더 경로로).

**🔴 동반 갱신 필수 — 이걸 빼먹으면 테스트가 파일을 못 찾아 실패한다**

| 위치 | 무엇을 |
|---|---|
| `test/main/portfolioPresetGroups.test.ts:10` | `import … from '@/pages/Main/components/MainRightPanel/components'` → `'@/shared/constants/portfolioPresets'` |
| `test/main/portfolioPresetGroups.test.ts:24-31` | `componentSource()` 가 **fs 경로 문자열을 하드코딩**해 소스를 스캔한다 — 새 경로로 |
| `test/main/portfolioPresetGroups.test.ts:58` | 🔴 **`as unknown as PortfolioPresetPlaceholder` 캐스트를 그대로 두어라.** 이번 세션에 고친 것이다. 되돌리지 마라 |
| `pages/Main/components/MainRightPanel/components/index.ts` | 배럴에서 계속 re-export 할지 결정(호출부 파급 최소화 쪽 권장) |

⚠ `PRESET_ICON_BY_ID` 는 lucide 를 import 한다. `shared/constants/` 에 두어도 시뮬레이터가 이미
엔트리로 끌고 있어 추가 비용이 0이지만, **최상위 배럴(`shared/constants/index.ts`)에는 연결하지 마라**
(`shared/constants/marketIndex`·`community`·`tickers` 와 같은 격리).

### 11-2. 라우팅 (마이그레이션 §10 P3 와 한 커밋)

```tsx
// router/routes.tsx
{ path: '/', element: <RootRoute /> }        // ← RootRoute 가 resolveShareRedirectPath 를 연결
{ path: SIMULATOR_PATH, element: <MainPage /> }
```
- `MainPage` **eager import 유지**(마이그레이션 §10 ⚠).
- `LandingPage` 는 **lazy** 로 둔다(404·법무 문서와 같은 관례). 🔴 단 `RootRoute` 자체는 동기이고
  `resolveShareRedirectPath` 는 랜딩 청크를 받기 **전에** 판정한다 — 그래야 공유 링크 방문자가
  랜딩을 한 번 그린 뒤 튕기지 않는다(마이그레이션 §1-D "랜딩 내부 `useEffect` 분기" 기각 사유).
- 🔴 **P3 만 revert 하면 P2 상태로 안전하게 돌아가도록 커밋을 분리하라.**

### 11-3. 계측 (새 이벤트 0개)

기존 `ANALYTICS_EVENT.CTA_CLICK` 만 쓴다.

| 위치 | `cta_name` |
|---|---|
| 히어로 primary/secondary | `landing_hero_simulator` / `landing_hero_portfolio` |
| 이어서 계산하기 | `landing_resume` |
| 검색 결과 클릭 | `landing_search_result`(+`ticker`) |
| 무결과 폴백 클릭 | `landing_search_fallback`(+`ticker`) |
| S4·S5 인라인 링크 | `landing_inline_simulator` / `landing_inline_calendar` |
| S6 섹션 CTA | `landing_preset_browse` |

🔴 **논리 페이지명을 새로 만들지 마라**(마이그레이션 §4 ❌). GA4 쪽 신구 매핑은 P4 사후 작업이다.

### 11-4. 도구 기준선 갱신

| 도구 | 조치 |
|---|---|
| `tools/dev/headerprobe.mjs` | `ROUTES` 에 `/simulator` 추가 → **6라우트 × 5폭 = 30/30**. + 랜딩 전용 5번 검사(§3-3) |
| `tools/dev/tintscan.mjs` | `/`(랜딩) 기준선 **2**, `/simulator` 시나리오 추가. `GOAL_REACHED_SHARE='/?share=…'` 는 그대로 두되 라벨만 수정(리다이렉트 실환경 스모크가 된다) |
| `tools/dev/overflowprobe.mjs` · `shotset.mjs` | 라우트 목록에 `/simulator` 추가 |

---

## 12. 리스크 · 미결정

| # | 항목 | 상태 |
|---|---|---|
| **R1** | 🔴 **시뮬레이터 프리셋 카드가 `expectedMonthlyDividend`("목표 월배당 약 40~50만원")를 지금 렌더 중이다**(§0 F1). 랜딩에서는 막았지만 시뮬레이터 쪽은 그대로다 — 손으로 적은 큐레이션 문구를 "목표 월배당"이라는 라벨로 보여 주는 것이 맞는지 | **사용자 결정 필요** (이 미션 범위 밖) |
| **R2** | 🔴 **D1 히어로 1순위 CTA** — `docs/design-refresh-plan.md:357` 을 뒤집는 제안 | **사용자 승인 대기**(기본값 A안) |
| **R3** | S6 프리셋 **딥링크 적용**(카드 클릭 → 시뮬레이터에 그 구성 프리필). v1 은 섹션 CTA 로 대체. 하려면 새 프리필 계약 + 하이드레이션 게이트 검증이 필요하다(마이그레이션 §6) | **후속 미션** |
| **R4** | 🔴 **FAQ 6문항이 사용자 승인 대기**(§5 표: #1·2·3·4·5·8). JSON-LD 는 공개 약속이라 승인 전 색인 금지 | **사용자 승인 필요** |
| **R5** | `snowball:has-workspace` **마커는 아직 존재하지 않는다.** 쓰기가 배선되기 전까지 "이어서 계산하기"는 아무에게도 안 보인다(안전한 실패) | `state-engineer` 선행 |
| **R6** | `index.html` 메타·JSON-LD 교체는 **랜딩 콘텐츠와 반드시 같은 PR**이어야 한다. 따로 하면 그 사이 `/` 가 자기 내용과 다른 것을 광고한다(마이그레이션 §3) | 구현 순서 제약 |
| **R7** | `/simulator` 의 **정적 canonical 부재**(JS 미실행 크롤러가 `/` 의 중복으로 본다)는 기존 부채의 확산이다. 랜딩 PR 로 해결되지 않는다 | 별도 트랙(마이그레이션 §3) |
| **R8** | S5 의 12칸 리듬은 `payoutMonths` 를 읽는다. 월 1회 크론이 이 값을 바꾸므로 **스냅샷 테스트로 특정 월을 고정하지 마라** — 형태(칸 12개·채움 개수 = `payoutMonths.length`)만 단정 | 테스트 설계 제약 |
| **R9** | 랜딩이 `shared/constants/presets`(한글명·프리셋)를 읽는다. `MainPage` 가 eager 인 지금은 비용 0 이지만, 나중에 시뮬레이터를 lazy 로 내리면 이 의존이 랜딩 청크로 따라온다 | 번들 최적화 시 재평가 |

---

## 13. 구현 순서 제안 (frontend-engineer)

1. **`shared/constants/tickerPages` + parity 가드** — 의존성 0, 단독 머지 가능.
2. **프리셋 데이터 이전**(§11-1) + `test/main/portfolioPresetGroups.test.ts` 3곳 갱신. 화면 변화 0.
3. **`pages/Landing` 골격** — `TickerPageShell` + `PageHero` + 8섹션 빈 껍데기 + `landingCopy.ts`.
   이 시점에 `test/landing/landingHeadings.test.tsx`(h1 정확히 1개) 통과.
4. **S1 히어로 완성**(CTA·검색·이어서) + `headerprobe` 5번 검사. §3-2 예산 실측 확인.
5. **S2 `MarketIndexStrip` 배선**(`useMarketIndicesSync()` 한 줄) — 상태 6종 눈으로 확인.
6. **S3~S8** 순서대로.
7. **라우팅 전환 + SEO 일괄 + 프로브 갱신** — 🔴 마이그레이션 §10 P3(⑨~⑫)는 **한 PR**.

---

## 부록 A. 이 스펙이 지킨 절대 제약 체크리스트

- [x] 스크롤 진입 애니메이션 0건 (§7)
- [x] "눈덩이/스노우볼" 비유 0건 — 오히려 `index.html:139` 의 기존 위반을 찾아 수정 지시(§0 F2)
- [x] 투자 권유 0건 — 조건부·예시형, "추천 종목" 대신 "소개 글이 준비된 종목"(§6-3), 외부 금융사 링크 0
- [x] 지어낸 수치 0건 — 지수(API) · 지급 월(marketData 런타임) · 비중(`allocations`) · 종목 11종만
- [x] 격식체 통일 (§5)
- [x] 하드코딩 hex 0 · 새 토큰 0 (§8)
- [x] `Card` 안 `Card` 0 · 한 카드는 테두리/그림자 중 하나 · **주역 `raised` 0개**(랜딩의 주역은 히어로다)
- [x] hue 솔리드 채움 0 · 파생 면 위 텍스트 0 · `gradient-hero` 는 히어로 배경에만
- [x] 모달·오버레이·자동 스크롤 0 · `role="dialog"` 0 · `TourGuide` 미사용
- [x] 헤더 nav 6개 불변 · 랜딩을 nav 항목으로 넣지 않음 · `MainPage` eager 유지
- [x] 섹션 **정확히 8개**(푸터 제외)
- [x] 틴트 면 **2개** (`tintscan` 기준선)
