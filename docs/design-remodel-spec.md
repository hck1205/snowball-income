# 전면 페이지 리모델링 설계 스펙 (design-remodel-spec)

> 사용자 요청 원문(2026-07-28): **"각 페이지별로 새로 rework된 디자인으로 전부 재구성해줘 특히 엘리먼트 위치 배치 구성 레이아웃 배치 색상 변경등 전부다 리모델링해줘"**
>
> 이 문서는 `docs/design-refresh-plan.md` **§4 실행 순서 10단계(전면 페이지 리모델링)의 설계 정본**이다(10-0).
> 구현은 이 스펙을 따르고, 스펙과 코드가 어긋나면 **먼저 랜딩한 구현이 정본**이 되므로 그때 이 문서를 고친다.
>
> **작성 범위**: 화면 설계(레이아웃·배치·색·타이포·반응형·상태·카피 규칙)만. 계산 로직·상태 스키마·라우트 경로 변경은 다루지 않는다.
> **코드 미수정**: 이 문서 작성 시점에 소스는 한 줄도 건드리지 않았다.

---

## 0. 읽는 법

| 절 | 내용 | 누가 먼저 읽나 |
|---|---|---|
| §1 | 확정 아이덴티티(재설계 금지) + 토큰 레이어에 필요한 추가 | frontend-engineer / 아이덴티티 패스 담당 |
| §2 | **공통 페이지 셸 패턴** — 이 문서의 핵심. 모든 페이지가 여기서 파생된다 | 전원 |
| §3 | 전역 반응형·접근성·카피 규칙 | 전원 |
| §4 | 라우트 전수 목록 | orchestrator |
| §5~§17 | 페이지별 스펙(현재 진단 → 새 레이아웃 → 근거 → 색 → 타이포 → 반응형 → 삭제·통합) | 해당 페이지 구현자 |
| §18 | 구현 순서(PR 단위) | orchestrator / git-manager |
| §19 | 리스크 | reviewer |
| §20 | 미결 ❓ | 사용자 |

**절대 규칙 3가지**(이 문서 전체에 걸쳐 위반 금지)

1. **숫자에 accent·손익색 금지** — 색은 배지·아이콘·크롬·장식에만. 부호 있는 값에만 `dataPositive/dataNegative`.
   근거 `.claude/knowledge/decisions.md:5`, `components/common/StatTile/StatTile.styled.ts:114`
2. **노랑·골드 전면 금지** — 워드마크·배지·그라디언트 어디에도. 사용자 2회 명시 거부.
3. **"눈덩이/스노우볼" 비유 금지** — 브랜드 워드마크 "스노우볼 인컴"만 예외(그건 비유가 아니라 이름).

---

## 1. 확정 아이덴티티와 토큰 레이어

### 1.1 폰트 4역할 (확정 — 재설계 금지)

| 역할 | 서체 | 토큰(신설) | 쓰이는 곳 |
|---|---|---|---|
| 본문·UI 한글 | **Wanted Sans** | `font.sans` (교체) | 모든 본문·라벨·힌트·버튼·입력 |
| 헤딩·워드마크 | **Gmarket Sans** | `font.display` (신설) | 워드마크, `h1`(PageHero 제목), 카드 제목, 섹션 제목 |
| 히어로 큰 숫자 | **LINE Seed KR** | `font.heroNumeric` (신설) | **화면당 1곳** — hero StatTile의 값, GoalMeter 퍼센트 |
| 표·타일 데이터 숫자 | **Inter + `tabular-nums`** | `font.dataNumeric` (신설) | 그 외 모든 숫자: StatTile default, DataTable, 칩 수치, 차트 축·툴팁 |

```ts
// shared/styles/tokens.ts — font 객체 확장(값은 아이덴티티 패스가 확정)
export const font = {
  sans: "'Wanted Sans Variable', 'Wanted Sans', -apple-system, …, sans-serif",
  display: "'Gmarket Sans', 'Wanted Sans Variable', sans-serif",
  heroNumeric: "'LINE Seed KR', 'Wanted Sans Variable', sans-serif",
  /** ⚠ Inter에는 한글 글리프가 없다 — 표 안 "3종" 같은 한글이 Wanted Sans로 폴백되게 순서 고정 */
  dataNumeric: "'Inter', 'Wanted Sans Variable', sans-serif",
  size, weight, leading,
  numeric: "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;"
} as const;
```

- `shared/styles/chartTheme.ts:97,119`의 `fontFamily: font.sans` → **`font.dataNumeric`** 으로 교체.
  캔버스는 `var()`를 못 읽으므로 문자열 그대로 들어간다. 축 라벨 한글("2028년")은 폴백으로 Wanted Sans가 받는다.
- **hero 숫자를 화면당 2개 이상 두지 마라.** LINE Seed KR이 두 군데 보이는 순간 위계가 죽고, 그 규칙은 `StatTile.types.ts:5`에 이미 명문화돼 있다.

### 1.2 색 — 워드마크·액센트·파스텔 그라디언트

**워드마크 "스노우볼 인컴"** (아이콘 없음, 텍스트 단독)

| 테마 | 스노우볼 | 인컴 |
|---|---|---|
| 라이트 | `#3ba5d3 → #79c5e6` | `#0d9488 → #22a06b` |
| 다크 | `#79c5e6 → #aadcf2` | `#2dd4bf → #6ee7a0` |
| 그라디언트 불가 표면 단색 폴백 | `#3ba5d3` | `#0d9488` |

신설 토큰(프리셋 8종 × light/dark 모두 정의):

```
--sb-gradient-wordmark-snow      (background-clip: text 용)
--sb-gradient-wordmark-income
--sb-wordmark-snow-solid         (OG 이미지·파비콘·플레인 텍스트 폴백)
--sb-wordmark-income-solid
--sb-gradient-hero               (파스텔 히어로 배경 — 블루/틸/그린 축)
--sb-gradient-hero-soft          (빈 상태·프로모 카드용, 더 옅은 버전)
```

**역할 배정**(hex는 아이덴티티 패스 산출물 — 이 스펙은 역할만 정한다)

| 역할 | 토큰 | 쓰임 |
|---|---|---|
| 인터랙션·활성 상태 | `brand*` (기존 블루 램프 `#0a6da3` 계열 **유지**) | 버튼 primary, NavItem 활성 pill, 포커스, 링크 |
| 성장·달성 | `accent*` (틸) | 달성 배지, 진행 리본, 히어로 아이콘 배지 |
| 목표·추천 | `accentAlt*` (**그린으로 재정의** — 구 바이올렛) | 목표 칩, 추천 티커 칩, 프로모 |
| 데이터 방향성 | `dataPositive/dataNegative` (빨강=상승/파랑=하락, **불변**) | 부호 있는 숫자만 |
| 상태 | `success/warning/danger` | 배너, 상태 줄 |

- **파스텔 그라디언트는 장식 표면에만**: PageHero 배경, EmptyState 카드 배경, 프로모/CTA 카드. **콘텐츠 카드(결과·표·글) 배경에는 절대 쓰지 않는다.**
- `gradient-cta`(버튼 채움) ↔ `gradient-aurora`(리본·장식) 교차 사용 금지 규칙은 그대로. `gradient-hero`는 **면 배경 전용**이라 세 번째 계열로 추가된다.
- CTA/브랜드 채움 위 라벨은 반드시 `color.onBrand`. 흰색 하드코딩 금지(velog·sunset·ink 다크에서 반전된다).

### 1.3 브레이크포인트 — 기존 토큰 재사용, 신설 금지

`shared/styles/tokens.ts:27-40` 값은 **변경하지 않는다.** 다만 두 토큰의 *의미*가 바뀐다(주석만 갱신).

| 토큰 | px | 구 의미 | **신 의미** |
|---|---|---|---|
| `mobile` | 560 | 알로케이션 범례 2줄 접힘 | 그대로 + 히어로 타일 1열 |
| `mobileWide` | 640 | 설정 입력 2열 전환 시작 | 그대로 + 헤더 컨트롤 압축 |
| `tabletSm` | 760 | 프리셋 카드 1열 | 그대로 |
| `tablet` | 820 | 데이터 테이블 카드형 전환 | 그대로 + 카드 그리드 2열→1열 |
| `drawer` | 960 | 모바일 드로어 on/off 경계 | **드로어 딤/스크롤락 경계**(드로어 자체는 전 폭 상시) |
| `layout` | 980 | 좌/우 2단 → 1단 | **결과 그리드 12열 → 1열** |

---

## 2. 공통 페이지 셸 패턴 (이 문서의 핵심)

### 2.1 문제: 같은 모양을 3벌 복제하고 있다

`pages/Portfolio/PortfolioPage/PortfolioPage.styled.ts:4-9`에 명시된 결정 —
"히어로·타일 그리드·빈 상태·각주는 배당 캘린더와 같은 모양을 **의도적으로 복제**한 것이다. 페이지 간 styled 를 직접 import 하면 두 화면이 서로의 레이아웃 변경에 묶인다."

그 판단은 **당시엔 옳았다**(페이지 → 페이지 직접 import는 lazy 청크를 섞고 은밀한 결합을 만든다).
하지만 지금 실측 결과는 이렇다:

- `PageStack`/`PageHero`/`HeroTitleRow`/`HeroIconBadge`/`HeroTitle`/`HeroLede`/`AsOfLine`/`LiveRegion`/`EmptyStateCard`/`FootNoteCard`가 **Portfolio·Calendar 두 파일에 완전 중복**
  (`pages/Portfolio/PortfolioPage/PortfolioPage.styled.ts:11-96,230,392` ↔ `pages/DividendCalendar/DividendCalendarPage/DividendCalendarPage.styled.ts:4-96,211,278`)
- 드로어는 **3벌**: `components/common/ConfigDrawer/ConfigDrawer.styled.ts`(좌·시뮬레이터) / `pages/DividendCalendar/components/PickerDrawer`(우) / `pages/Portfolio/components/HoldingPickerDrawer`(우, 주석에 "PickerDrawer의 페이지 로컬 복제"라고 자백)
- 스켈레톤은 **4벌**(갤러리·게시판·Portfolio·Calendar)
- 페이지 셸은 **3벌**: `FeatureLayout`(1200) / `CommunityMain`(1200) / `ShellMain`(1120)

**해법**: 페이지→페이지 import 금지는 유지하되, **`components/common/`(재사용 레이어)에 올린다.** 이건 금지된 패턴이 아니라 원래 있어야 할 자리다 — `StatTile`·`Banner`·`Button`을 공유하는 것과 같은 층이고, 그 배럴은 이미 엔트리 번들에 있어 새 청크가 생기지 않는다.
**전 페이지 일관성이 이번 리모델링의 요구사항 그 자체**이므로, "따로 움직일 자유"보다 "같이 움직이는 보장"이 지금은 더 가치 있다.

### 2.2 신설/승격할 공용 부품 (컴포넌트 분해안)

모든 폴더는 `X.tsx` / `X.styled.ts` / `X.types.ts` / `X.utils.ts`(필요시) / `index.ts` 세트. 외부에서는 폴더 경로로만 import.

| # | 경로 | 역할 | 대체하는 것 |
|---|---|---|---|
| C1 | `components/common/AppShell/` | 헤더(PrimaryNav 2줄) + `<main>` + 푸터 + SkipLink | `FeatureLayout`, `CommunityMain`+`LayoutRoot`, `TickerPageShell` |
| C2 | `components/common/PageHero/` | 히어로 밴드(아이콘·제목·리드·메타·액션·hero 슬롯) | Portfolio/Calendar/Hub의 로컬 히어로 3벌, `HeaderDescription` |
| C3 | `components/common/PageGrid/` | `PageStack`(세로 스택) + `ResultGrid`(12열) + `Cell` | Portfolio/Calendar `PageStack`, `ResultsColumn` |
| C4 | `components/common/CardGrid/` | 카드 피드 그리드(`$min` prop) | 갤러리 `CardGrid`, 허브 `CardGrid`, 프리셋 보드 그리드 |
| C5 | `components/common/TileGrid/` | StatTile 그리드 + hero 슬롯(1/-1) | `SummaryGrid`+`HeroSlot`, Portfolio/GoalCard `TileGrid` 3벌 |
| C6 | `components/common/EmptyState/` | 빈 상태(아이콘·제목·설명·CTA·quickPicks) | `components/community/EmptyState` **승격 이동**, Portfolio/Calendar `EmptyStateCard` |
| C7 | `components/common/SideDrawer/` | 오버레이 드로어(`side`, 포커스 복귀, Esc, 뒤로가기 닫기, 딤 정책) | `ConfigDrawer`+`MobileMenuDrawer`, `PickerDrawer`, `HoldingPickerDrawer` |
| C8 | `components/common/Skeleton/` | `SkeletonBar` / `SkeletonRow` / `SkeletonCard` | 4벌 로컬 스켈레톤 |
| C9 | `components/common/LiveRegion/` | 시각 숨김 `role="status" aria-live="polite"` (항상 마운트) | Portfolio/Calendar `LiveRegion` 2벌 |
| C10 | `components/common/FootNotes/` | 각주 카드(제목 + 줄 목록) | `FootNoteCard` 2벌 |
| C11 | `components/common/PageFooter/` | 데이터 기준일 + 투자 자문 아님 고지 | `MarketDataAsOf` + `LandingDisclaimer` |
| C12 | `components/common/FeedToolbar/` | 정렬 탭 + 검색 + 뷰 토글 + 주 액션 | 갤러리 `ControlBar`, 게시판 `BoardHeader` |

**확장(신설 아님)**

| # | 대상 | 확장 내용 |
|---|---|---|
| E1 | `components/common/Card` | `as?: 'div'\|'section'\|'article'`, `aria-labelledby`, `aria-busy`, `tone?: 'default'\|'sunken'\|'accent'`, `footer?` 슬롯 추가. 페이지들이 각자 만든 `SummaryCard`/`BoardCard`/`HoldingsCard`/`PostCard`(styled)를 흡수 |
| E2 | `components/common/StatTile` | `hero` 값 폰트를 `font.heroNumeric`, default 값을 `font.dataNumeric`으로. props 변화 없음 |
| E3 | `components/common/Chip` | `variant='accentAlt'`가 그린으로 재정의됨(색만, API 불변) |

**만들지 않는 것**(과도한 추상화 금지)
- `PageTemplate`처럼 페이지 전체를 props로 받는 만능 컴포넌트 ❌
- 색·간격을 prop으로 열어 두는 "테마 가능한" 카드 ❌ — 토큰이 이미 그 일을 한다
- 페이지마다 `XxxPageLayout` 래퍼 ❌ — C1~C3 조합으로 충분하다

### 2.3 셸 골격 (전 페이지 공통)

```
┌──────────────────────────────────────────────────────────────┐
│ AppShell.Header  (sticky, glass, z=headerSurface)            │
│  ┌ ControlsRow ──────────────────────────────────────────┐   │
│  │ [스노우볼 인컴]  {leading}  {status}   ⟶  {actions}    │   │  ← 1줄
│  └───────────────────────────────────────────────────────┘   │
│  ┌ PrimaryNavLinks (가운데 정렬 · 넘치면 가로 스크롤) ───┐   │  ← 2줄
│  │ 시뮬레이터 내포트폴리오 배당캘린더 갤러리 게시판 ETF소개│   │
│  └───────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ <main id="main-content">  max-width: 1200(wide) / 880(reading)│
│  ┌ PageHero ────────────────────────────────────────────┐    │
│  │ [◇] 제목(h1)                          [주 액션들]     │    │
│  │ 리드 문장 한 줄                                       │    │
│  │ 메타(기준일·환율) · (선택) hero 슬롯                  │    │
│  └──────────────────────────────────────────────────────┘    │
│  LiveRegion (시각 숨김, 항상 마운트)                          │
│  [Banner: danger → warning → info 순]                        │
│  PageStack / ResultGrid  ← 페이지 본문                        │
│  FootNotes (각주)                                             │
├──────────────────────────────────────────────────────────────┤
│ PageFooter  데이터 기준 · 투자 자문 아님 고지                 │
└──────────────────────────────────────────────────────────────┘
```

**배치 순서는 전 페이지 동일**하다: 히어로 → 라이브리전 → 배너 → 본문 → 각주 → 푸터.
사용자가 페이지를 옮겨도 "어디를 봐야 하는지"를 다시 배우지 않게 하는 게 이 규칙의 전부다.

### 2.4 PageHero 규격

```tsx
<PageHero
  icon={<Wallet size={20} strokeWidth={1.8} />}   // lucide, 없으면 생략 가능
  title="내 포트폴리오"                            // 페이지의 유일한 <h1>
  lede="보유 종목과 수량만 넣으면 지금 받는 배당을 계산해요."
  meta="시세 2026-07-27 기준 · 환율 1,382원"       // 없으면 사유 표기
  actions={<>…</>}                                  // 최대 2개(primary 1 + secondary 1)
  tone="gradient"                                   // 'gradient' | 'plain'
  stat={<StatTile emphasis="hero" … />}             // 선택 — 화면당 1개
/>
```

| 속성 | 값 |
|---|---|
| 배경 | `tone='gradient'` → `var(--sb-gradient-hero)` / `tone='plain'` → `color.surface` |
| 테두리 | `1px solid ${color.brandBorder}` |
| radius | `radius.xl` |
| padding | `clamp(20px, 3vw, 32px)` |
| 아이콘 배지 | 36×36, `radius.md`, `background: color.surface`, `color: color.accentText`, `border: 1px solid color.accentBorder` (구 brandText/brandBorder → **accent 계열로 교체**: 브랜드 블루는 인터랙션 축이므로 장식 배지에서 물러난다) |
| 제목 | `font.display`, `clamp(font.size['2xl'], 4vw, font.size['4xl'])`, `weight.extrabold`, `letter-spacing: -0.03em` |
| 리드 | `font.sans`, `clamp(base, 2vw, lg)`, `color.textSecondary` |
| 메타 | `font.dataNumeric`, `size.xs`, `color.textMuted` |
| 상단 4px 리본 | **제거** — 그라디언트 배경이 이미 시그니처다(중복 장식) |

**피드형 페이지(갤러리·게시판·내 글)는 `stat` 슬롯을 쓰지 않는다.** 히어로 숫자가 없는 게 정상이고, 그 자리는 `FeedToolbar`가 받는다.

### 2.5 카드 규격 (Card 확장 후 단일 규칙)

| 종류 | radius | 배경 | 테두리 | 그림자 | 예 |
|---|---|---|---|---|---|
| **도구 카드** | `radius.lg` | `color.surface` | `1px color.border` | `shadow.e1` | 결과 카드, 요약 카드, 달력 보드, 폼 패널 |
| **콘텐츠 카드** | `radius.xs` | `color.surface` | `1px color.border` | `shadow.e1` | 갤러리/게시판 글 카드, 글 상세 |
| **부속 카드**(다른 가정) | `radius.md` | `color.surfaceSunken` | `1px color.border` | 없음 | "전량 매도한다면", 첨부 미리보기 |
| **빈 상태** | `radius.xl` | `var(--sb-gradient-hero-soft)` | `1px color.border` | 없음 | EmptyState |

`radius.xs`(콘텐츠) vs `radius.lg`(도구) 구분은 기존 확정 결정이다 — 바꾸지 않는다.

카드 헤더는 항상 `제목(좌) / 액션(우)` 1줄 + 선택적 부제 1줄. 제목은 `font.display`, 부제는 `font.sans`/`textMuted`.

### 2.6 SideDrawer 규격 (드로어 3벌 통합)

```tsx
<SideDrawer
  id={drawerId}
  side="left" | "right"
  isOpen={open}
  title="투자 설정"
  closeLabel="설정 닫기"
  onClose={close}
  width="min(92vw, 400px)"          // 기본값
  dimAbove="drawer"                  // ≤960에서만 딤+스크롤락 (아래 표 참고)
>
```

**통합되는 계약**(3벌이 각자 가지고 있던 것을 모두 보존)

| 계약 | 근거 |
|---|---|
| 패널은 **항상 마운트**, 열림은 CSS transform | `HoldingPickerDrawer.tsx:18` — 언마운트하면 검색어·스크롤이 날아간다 |
| `useDrawerBackClose` — 뒤로가기로 닫기 | `shared/hooks` |
| Escape는 `defaultPrevented` 확인 후에만 닫는다 | `HoldingPickerDrawer.tsx:57` — 안쪽 검색의 "Esc=검색어 지우기"가 먼저 |
| 열릴 때 닫기 버튼 포커스, 닫힐 때 **열었던 요소로 복귀** | 동일 |
| 포커스 이펙트 deps에 `onClose` 금지(ref로 잡기) | `HoldingPickerDrawer.tsx:24-27` — 인라인 핸들러 호출부에서 한 글자마다 포커스가 튄다(qa BUG-1) |
| 드로어 본문에 `container-type: inline-size` | `ConfigInputGrid`(`ConfigForm.styled.ts:15`)의 컨테이너 쿼리가 기댈 컨테이너. `FeatureLayout` 제거 후 이게 유일한 컨테이너가 된다 |
| 포커스 트랩 | ⚠ 현재 3벌 **모두 트랩이 없다**(Esc·바깥클릭·포커스복귀만). `role="dialog" aria-modal`을 선언하지 않는 대신 트랩도 안 만든다 — **지키지 않을 계약을 선언하지 않는다**는 관례(`role="grid"` 금지 결정과 같은 원칙). 신규 `SideDrawer`도 이 상태를 유지하고, 트랩 도입은 별도 결정으로 미룬다(§20 ❓D) |

**딤 정책** — 시뮬레이터의 "조정↔확인 루프"를 살리는 핵심

| 폭 | 백드롭 | body 스크롤 락 | 이유 |
|---|---|---|---|
| ≤960 (`drawer`) | `color.overlay` + `blur(2px)`, 클릭=닫기 | **ON** | 드로어가 화면 대부분을 덮는다 |
| ≥961 | **투명 스크림**(클릭=닫기, 시각 딤 없음) | **OFF** | 결과가 그대로 읽히고 스크롤도 된다 — 오버레이 방식을 택하면서도 루프가 끊기지 않게 |

### 2.7 빈 상태 / 로딩 / 에러 — 표현 규칙 (전 페이지 동일)

| 상태 | 컴포넌트 | 규칙 |
|---|---|---|
| **로딩(첫 진입)** | `Skeleton*` + 컨테이너에 `aria-busy="true"`, 스켈레톤 자체 `aria-hidden` | 스피너 대신 **형태를 미리 보여준다**(레이아웃 점프 방지). 스켈레톤 줄 수는 실제 기대 행 수와 같게 |
| **로딩(더 불러오기)** | `role="status" aria-live="polite"` 줄 + 소형 스피너 | 목록 하단 고정 |
| **빈 상태(데이터 0)** | `EmptyState` | 아이콘 + 제목 + 한 줄 설명 + **CTA 1개** + (선택) quickPick 칩. 파스텔 배경 |
| **빈 상태(검색·필터 결과 0)** | `EmptyState` | 제목에 검색어를 인용, CTA는 **"검색어 지우기"/"필터 초기화"**(새 글쓰기 아님) |
| **검증 실패(zod)** | `InputField`의 `error` + `aria-invalid` + `aria-describedby` | 필드 **바로 아래**, 한국어 완결 문장. 폼 상단 요약 배너는 만들지 않는다(필드가 6개 미만이라 과잉) |
| **작업 실패(저장·네트워크)** | `Banner tone="danger" role="alert"` | 본문 최상단. **재시도 가능하면 버튼, 불가능하면 버튼 없이 사유만**(PDF 실패 2갈래 결정과 동일 원칙) |
| **주의(막지는 않음)** | `Banner tone="warning" role="status"` | 예: 환율 조회 실패, 종합과세 임계 초과 |
| **되돌리기** | `Banner tone="info" role="status" align="center"` + 인라인 버튼 | 삭제 직후 |
| **무음 비활성 금지** | 비활성 컨트롤은 **언제나** `aria-describedby`로 사유 줄을 가리킨다 | 사용자 프로필: "에러/제약은 화면에 이유가 표시돼야 한다" |

**한국어 카피 톤 규칙**

- 추정형: "예상", "닿습니다", "…쯤" — 단정 금지("도달합니다" ❌ → "도달할 것으로 보입니다")
- 값이 없으면 **사유**를 쓴다: "—" 단독 금지 → "환율을 불러오지 못해 원화 환산을 생략했습니다"
- 에러는 **다음 행동**을 준다: "잠시 후 다시 시도해 주세요" / "포트폴리오와 투자 조건을 확인해 주세요"
- 투자 자문 아님 고지는 `PageFooter`가 전 페이지 공통으로 1회. 각주에서 반복하지 않는다.

⚠ **어미 톤이 지금 갈라져 있다 — 이번에 통일해야 한다** (실측):

| 영역 | 현재 어미 | 예 |
|---|---|---|
| 내 포트폴리오 | **격식체 "~습니다"** | "…확인할 수 있습니다." `pages/Portfolio/copy/portfolioCopy.ts:31`, "아직 등록한 보유 종목이 없습니다" :180 |
| 배당 캘린더 | **격식체 "~습니다"** | "…볼 수 있습니다." `pages/DividendCalendar/copy/dividendCalendarCopy.ts:20`, "아직 선택한 종목이 없습니다" :116 |
| 커뮤니티 | **해요체 "~해요"** | "…자유롭게 이야기해요." `shared/constants/community/copy.ts:105`, "첫 글을 남겨보세요." :110 |

같은 앱 안에서 페이지를 옮길 때마다 말투가 바뀌는 건 **레이아웃 불일치보다 더 티가 난다.**
**권장 = 격식체 "~습니다"로 통일**(숫자·추정을 다루는 금융 도구의 신뢰 톤이고, 6개 페이지 중 4개가 이미 그렇다). 커뮤니티만 예외로 남기고 싶다면 그것도 결정으로 못 박는다 — §20-J.
이 문서의 와이어프레임 안 문구는 **배치를 보여주기 위한 예시**이며, 확정 카피는 각 페이지 `copy/` 상수가 정본이다.

---

## 3. 전역 반응형·접근성 규칙

### 3.1 반응형 매트릭스 (전 페이지 공통 골격)

| 요소 | ≥981 | 821–980 | 641–820 | 561–640 | ≤560 |
|---|---|---|---|---|---|
| 셸 max-width | 1200 / 880(reading) | 1200 | 100% | 100% | 100% |
| 셸 좌우 패딩 | `clamp(16,4vw,40)` | ↓ | 20px | 16px | 12px |
| 헤더 | 2줄(브랜드+컨트롤 / 메뉴) | 2줄 | 2줄 | 2줄 | 2줄 |
| 헤더 nav 라벨 | 표시 | 표시 | 표시 | 표시 | **표시(숨김 금지 — 확정 결정)**, 12px + 가로 스크롤 |
| PageHero | 제목·액션 가로 | 가로 | 가로 | **세로 스택** | 세로 스택 |
| 결과/본문 그리드 | 12열 | **1열** | 1열 | 1열 | 1열 |
| 카드 피드 그리드 | `auto-fit minmax(280px,1fr)` | 2열 | 2열 | **1열** | 1열 |
| StatTile 그리드 | `auto-fit minmax(170px,1fr)` | 동일 | 동일 | 2열 | **1열** |
| DataTable | 표 | 표 | 표 | **카드형**(≤820 전환) | 카드형 |
| SideDrawer | 오버레이(딤 없음, 스크롤 유지) | **딤 + 스크롤락** | 딤 + 스크롤락 | 딤 + 스크롤락 | 딤 + 스크롤락, 폭 92vw |
| 터치 타깃 | 32px 허용 | 40px | 44px | 44px | 44px |

`TOUCH_TARGET`(44px)은 `≤820`부터 전 인터랙티브 요소에 하한으로 적용한다.

### 3.2 접근성 체크리스트 (페이지마다 검수)

1. **랜드마크**: `AppShell`이 `header`/`nav`/`main`/`footer`를 정확히 1개씩. `<footer>`는 `<main>` **밖**(자손이면 contentinfo가 안 된다 — `Main.view.tsx:208` 주석 참고).
2. **h1은 페이지당 1개** = `PageHero.title`. 헤더 워드마크는 `brandAs='span'`(시뮬레이터만 `h1`이던 관례는 PageHero 도입과 함께 **span으로 통일**).
3. **키보드 순서**: SkipLink → 헤더 브랜드 → 컨트롤 → nav 링크 → 히어로 액션 → 본문. 드로어가 열리면 닫기 버튼으로 이동, 닫히면 **연 버튼으로 복귀**.
4. **라벨-입력 연결**: 모든 입력은 `<label for>` 또는 `aria-label`. 시각 라벨과 접근명이 달라야 하면 `ToggleField`의 `accessibleName`처럼 **명시 prop**을 쓴다.
5. **색 단독 정보 전달 금지**: 상태는 항상 (아이콘 + 텍스트) 또는 (색 + 텍스트). 진행률 바는 반드시 문장 병기(`StatTile.tsx:12`).
6. **LiveRegion은 언마운트 금지** — 시각적으로만 숨기고 텍스트만 바꾼다(`PortfolioPage.styled.ts:82-96`).
7. **포커스 링을 컴포넌트에서 끄지 않는다.** 전역 `:focus-visible` 규칙이 정본. (유일 승인 예외 = 글쓰기 제목 입력, decisions.md 2026-07-20)
8. **`prefers-reduced-motion`**: 진입 애니메이션·진행률 채움은 `no-preference` 미디어 안에서만 정의. 전이는 duration만 남기고 delay 금지.

---

## 4. 라우트 전수 목록 (`router/routes.tsx` 실측, 2026-07-28)

| # | 경로 | 컴포넌트 | 로딩 | 이 문서 절 |
|---|---|---|---|---|
| R1 | `/` | `MainPage` (시뮬레이터) | eager | §5 |
| R2 | `/dividend/portfolio` | `PortfolioPage` | lazy | §6 |
| R3 | `/dividend/calendar` | `DividendCalendarPage` | lazy | §7 |
| R4 | `/community` | → `/community/portfolio` 리다이렉트 | — | — |
| R5 | `/community/portfolio` | `CommunityGalleryPage` | lazy | §8 |
| R6 | `/community/board` | `CommunityBoardPage` | lazy | §9 |
| R7 | `/community/portfolio/write`, `/community/board/write`, `…/:id/edit` | `CommunityWritePage` | lazy | §10 |
| R8 | `/community/portfolio/:id`, `/community/board/:id` | `CommunityDetailPage` | lazy | §11 |
| R9 | `/community/profile` | `CommunityProfilePage` | lazy | §12 |
| R10 | `/community/my-posts` | `CommunityMyPostsPage` | lazy | §12 |
| R11 | `/ticker/all` | `TickerHubPage` | lazy | §13 |
| R12 | `/ticker/:name` | `TickerDetailPage` | lazy | §14 |
| R13 | `/community/auth/naver/callback` | 인라인 `NaverAuthCallback` | eager | §15 |
| R14 | `/community/auth/kakao/callback` | 인라인 `KakaoAuthCallback` | eager | §15 |
| R15 | `*` | `<Navigate to="/" replace />` | — | §16 |
| R16 | (예정) `/` 랜딩 · `/simulator` | 미구현 | — | §17 |

`/dividend/goal`은 **존재하지 않는다**(2026-07-27 Portfolio가 흡수, 라우트 제거 완료 — `routes.tsx` 실측).

---

## 5. `/` — 시뮬레이터 (가장 큰 변경)

### 5.1 현재 구조 진단

```
FeatureLayout(max 1200, container-type)         pages/Main/Main.shared.styled.ts:50
└ MainContent (display: contents)                Main.shared.styled.ts:66
  └ MobileMenuDrawer                             components/MobileMenuDrawer/MobileMenuDrawer.tsx:69
    ├ HeaderDescription (본문 최상단 설명 한 줄)
    ├ DrawerBackdrop (≤960에서만)
    └ ContentLayout  grid: minmax(250,320) 1fr   components/common/ContentLayout/ContentLayout.styled.ts:6
      ├ ConfigDrawerColumn ← left  (≥981 정적 컬럼 / ≤960 fixed 드로어)
      │   TickerCreation → ExchangeRateWidget → InvestmentSettings
      └ right → MainRightPanel (ResultsColumn: 세로 1열 스택)
          ScenarioTabs → SimulationResult → PortfolioComposition
          → ChartPanel(월평균배당) → [분할 시 자산/누적] → MonthlyCashflow
          → YearlyResult → PostInvestmentProjectionPanel
```

문제:

1. **결과가 세로 1열로 끝없이 쌓인다.** `ResultsColumn`(`MainRightPanel.styled.ts:8`)은 `display:grid` 1열이다. 데스크톱에서 우측 컬럼 폭이 ~860px인데 차트 카드 8개가 세로로만 늘어서 **스크롤 깊이가 4~5 화면**이 된다. "한눈에 비교"가 불가능하다.
2. **좌측 320px 컬럼이 항상 화면의 27%를 먹는다.** 그런데 사용자가 설정을 만지는 시간은 전체 체류의 일부다.
3. **`container-type` 함정을 안고 산다.** `FeatureLayout`이 컨테이너라 그 안의 `position:fixed` 드로어가 뷰포트가 아니라 이 박스 기준으로 배치되는 문제를 `media.down('drawer')`에서 컨테인먼트를 끄는 방식으로 우회 중(`Main.shared.styled.ts:31-49`). 전 폭 드로어가 되면 이 우회가 무의미해진다.
4. **정보 위계 붕괴**: `SimulationResult` 카드 하나에 hero + 5타일 + "전량 매도한다면" sunken 박스 + 종합과세 경고 배너가 전부 들어 있다(`SimulationResult.tsx:92-240`). "지금 이 조건의 결론"과 "만약 다 팔면"이 같은 카드에 있다.
5. **조건이 어디에도 요약돼 있지 않다.** 어떤 조건(기간·월적립·세율·재투자)으로 나온 숫자인지 보려면 좌패널을 봐야 하고, ≤960에선 드로어를 열어야 한다.
6. `HeaderDescription`("장기 배당 투자 전략을 설계하고…")이 본문 최상단에 떠 있는데 히어로가 아니라 그냥 문장 한 줄이다 — 다른 페이지엔 제대로 된 `PageHero`가 있어 **시뮬레이터만 격이 다르게 보인다.**

### 5.2 새 레이아웃 — 데스크톱 (≥981)

```
┌─ AppShell.Header ────────────────────────────────────────────────────────┐
│ [스노우볼 인컴]  [⚙ 투자 설정] [동기화]        [로그인] [⋯]              │
│         시뮬레이터 · 내 포트폴리오 · 배당 캘린더 · 갤러리 · 게시판 · ETF소개│
└──────────────────────────────────────────────────────────────────────────┘
┌─ PageHero (tone=gradient) ───────────────────────────────────────────────┐
│ [◈] 배당 시뮬레이터                        [⚙ 투자 설정]  [PDF 리포트]   │
│ 포트폴리오와 조건을 넣으면 장기 배당 현금흐름을 계산해요.                 │
│ 시세 2026-07-27 기준 · 표시 통화 원화                                     │
└──────────────────────────────────────────────────────────────────────────┘
  ScenarioTabs   [ 기본 ][ 배당성장 ][ 고배당 ][+]            [간략히 ⬤]
┌─ ResultGrid (12열) ──────────────────────────────────────────────────────┐
│ ┌ span 12 · 결과 요약 카드 ─────────────────────────────────────────────┐│
│ │  ┌ hero (span 1/-1) ───────────────────────────────────────────────┐ ││
│ │  │ 최종 자산 가치                                                   │ ││
│ │  │  12억 4,300만원                        ← LINE Seed KR, 화면 유일 │ ││
│ │  └──────────────────────────────────────────────────────────────────┘ ││
│ │  [월배당 312만] [최근실지급 340만] [누적순배당 4.1억] [누적세금 7,400만]││
│ │  [목표 월배당 도달 2039년 / 투자 14년차]                              ││
│ │  ── 조건 스트립 ───────────────────────────────────────────────────  ││
│ │  20년 · 월 150만원 · 세율 15.4% · 재투자 ON · 5종목      [조건 수정 ↗]││
│ └───────────────────────────────────────────────────────────────────────┘│
│ [!] 금융소득종합과세 안내 배너 (해당 시 span 12)                          │
│ ┌ span 7 · 월 평균 배당 ─────────┐ ┌ span 5 · 포트폴리오 구성 ─────────┐│
│ │  선그래프 + 목표선 + 도달 마커  │ │  파이 + 범례 슬라이더 + 고정 핀    ││
│ └────────────────────────────────┘ └───────────────────────────────────┘│
│ ┌ span 12 · 월별 현금흐름 (지급 스케줄·카드/표 전환) ───────────────────┐│
│ └───────────────────────────────────────────────────────────────────────┘│
│ ┌ span 12 · 연도별 결과 (막대 + DataTable) ─────────────────────────────┐│
│ └───────────────────────────────────────────────────────────────────────┘│
│ ┌ span 6 · 자산 가치 ───────────┐ ┌ span 6 · 누적 배당 ─────────────────┐│  ← 분할 보기 ON일 때만
│ └───────────────────────────────┘ └────────────────────────────────────┘│
│ ┌ span 12 · 투자 종료 후 추정 ──────────────────────────────────────────┐│
│ └───────────────────────────────────────────────────────────────────────┘│
│ ┌ span 12 · [부속] 전량 매도한다면 (surfaceSunken, 접힘 가능) ──────────┐│
│ └───────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
  FootNotes (계산 가정 3줄)
  PageFooter (데이터 기준 · 투자 자문 아님)

[투자 설정 드로어] ← 좌측 오버레이, 딤 없음(≥981), 결과 계속 보임/스크롤 가능
 ┌ 400px ─────────────────────┐
 │ 투자 설정              [×] │
 │ ── 포트폴리오 ───────────  │
 │ [티커 칩들] [+ 종목 추가]  │
 │ [공유하기]                 │
 │ ── 환율 ─────────────────  │
 │ 1,382원  ▲0.32%            │
 │ ── 투자 조건 ────────────  │
 │ 초기 투자금 / 월 적립      │
 │ 기간 / 세율 / 목표 월배당  │
 │ 재투자 · 표시 통화 · 간이  │
 └────────────────────────────┘
```

### 5.3 새 레이아웃 — 모바일 (≤820)

```
┌ Header (2줄) ─────────────────────┐
│ [스노우볼 인컴]  [⚙]     [⋯]      │
│ 시뮬레이터 내포폴 캘린더 …(스크롤) │
└───────────────────────────────────┘
┌ PageHero ─────────────────────────┐
│ [◈] 배당 시뮬레이터                │
│ 포트폴리오와 조건을 넣으면 …       │
│ [⚙ 투자 설정]  (전폭 버튼)         │
└───────────────────────────────────┘
 ScenarioTabs (가로 스크롤)
┌ 결과 요약 ────────────────────────┐
│ 최종 자산 가치                     │
│  12억 4,300만원                    │
│ [월배당 312만] [최근실지급 340만]  │   ← 2열
│ [누적순배당]   [누적세금]          │
│ [목표 도달 2039년]                 │
│ 20년 · 월150만 · 15.4% · 재투자ON  │   ← 2줄 wrap
│                        [조건 수정] │
└───────────────────────────────────┘
 월 평균 배당(차트)
 포트폴리오 구성(파이 + 범례)
 월별 현금흐름
 연도별 결과 (≤820 카드형 표)
 투자 종료 후 추정
 [접힘] 전량 매도한다면
 각주 / 푸터
```

### 5.4 엘리먼트 재배치 근거

| 순서 | 무엇 | 왜 여기 |
|---|---|---|
| 1 | PageHero | 다른 5개 페이지와 같은 자리에 같은 모양. **시뮬레이터만 격이 다른 문제**를 해소하고, 설정 진입점을 항상 보이는 곳에 둔다 |
| 2 | ScenarioTabs | 결과 전체의 맥락(어느 시나리오인가). 요약보다 위여야 "지금 보는 게 무엇인지"가 먼저다 |
| 3 | **결과 요약(hero)** | 사용자가 이 앱을 켠 이유. 스크롤 없이 보이는 첫 숫자 |
| 4 | 조건 스트립 | 3의 숫자가 **어떤 가정에서 나왔는지** 바로 아래에서 답한다. 지금은 이 답이 화면 어디에도 없다 |
| 5 | 종합과세 배너 | 결론에 붙는 경고라 결론 바로 뒤 |
| 6 | 월 평균 배당 + 포트폴리오 구성 (7:5) | "얼마 받나(시계열)"와 "무엇으로 받나(구성)"는 **함께 봐야 의미가 생긴다.** 지금은 세로로 떨어져 있어 비중을 만지며 차트를 볼 수 없다 |
| 7 | 월별 현금흐름 | "이번 달/올해 얼마"가 장기 추이보다 먼저 읽혀야 한다는 2026-07-25 결정 유지 |
| 8 | 연도별 결과 | 표가 있어 전 폭 필요 |
| 9 | 자산/누적(분할 시) | 보조 관점 |
| 10 | 투자 종료 후 추정 | 다른 시간대(추가 납입 없음) |
| 11 | 전량 매도한다면 | **다른 가정의 세계**. 계속 보유하면 내지 않는 세금이므로 결론 카드에서 분리해 맨 끝 sunken 카드로 |

**히어로 값 1개 = `최종 자산 가치`** (간이 추정 모드에서는 `최종 자산 추정`).
근거: 이 화면은 "가정의 숫자"를 다루는 도구다. 월배당은 `/dividend/portfolio`(실보유)가 hero로 갖고 있으므로 두 화면이 다른 주인공을 갖는 게 맞다. 기존 결정(`SimulationResult.tsx:135` "사용자가 이 앱을 켠 이유. 유일한 hero 지표다") 유지.

### 5.5 색 적용

| 요소 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `color.bg` (프리셋 틴트) | `color.bg` + `bgGlow` |
| PageHero | `--sb-gradient-hero`(파스텔 블루→틸), `brandBorder` | 같은 토큰의 다크 값(채도↓ 명도↓) |
| 히어로 아이콘 배지 | `surface` 면 + `accentText` 글리프 + `accentBorder` | 동일 토큰 |
| hero StatTile | `brandSubtle` 면 + `brandBorder` + 좌측 `gradientAurora` 4px 리본 (**기존 유지**) | 동일 |
| hero 값 숫자 | `color.text` — **그라디언트 텍스트·accent 금지** | 동일 |
| default StatTile | `surfaceMuted` + `border` | 동일 |
| 조건 스트립 | `surfaceSunken` 면, 텍스트 `textSecondary`, 값만 `text` | 동일 |
| 차트 카드 | `surface` + `border` + `shadow.e1` | 동일 |
| 차트 시리즈 | `getChartTheme().series` (프리셋별 8색) | 동일 세트(라이트/다크 양쪽 3:1 보장) |
| 목표선 | `theme.accent` 파선 + 라벨 칩 | 동일 |
| 도달 마커 | `success` × `successSurface` 상태 칩(핀 밖, 전 뷰포트 상시) — **기존 결정 유지** | 동일 |
| 전량 매도 카드 | `surfaceSunken` + `border`, 그림자 없음 | 동일 |
| 드로어 | `color.surface`(구 `bgGlow`에서 변경 — 오버레이가 전 폭에서 상시라 배경과 구별돼야 한다) + `shadow.e3` | 동일 |
| 백드롭 | ≤960 `color.overlay`+blur / ≥981 `transparent` | 동일 |

### 5.6 타이포 적용

| 요소 | 서체 | 크기 |
|---|---|---|
| 워드마크 | `font.display` + 2색 그라디언트 텍스트 | 13px×2줄 → **한 줄 15px**(한글 4자+2자라 2줄 스택 불필요) |
| PageHero 제목(h1) | `font.display` extrabold | `clamp(2xl, 4vw, 4xl)` |
| 카드 제목 | `font.display` bold | `lg` |
| hero StatTile 값 | **`font.heroNumeric`** | `clamp(28px, 4vw, 6xl)` |
| default StatTile 값 | `font.dataNumeric` + `tabular-nums` | `lg` |
| 조건 스트립 값 | `font.dataNumeric` | `sm` |
| 표 셀 숫자 | `font.dataNumeric` + `tabular-nums` | `sm` |
| 차트 축·툴팁 | `font.dataNumeric` (chartTheme) | 11–12px |
| 본문·라벨·힌트 | `font.sans` | `xs`~`base` |

**숫자 포맷**은 `shared/utils/format.ts` 관례를 그대로 따른다:
`formatKRW`(정확) / `formatApproxKRW`("약 187만") / `formatSummaryKRW`("187만원"·"9.2억", 커뮤니티 표면) / `formatUSD`·`formatApproxUSD`. 새 포맷터를 만들지 않는다.
차트 축은 기존 `formatChartCompact`/`formatChartValue`(표시 통화 인식) 유지 — 원화 고정 포맷터를 차트 표면에 쓰면 달러 모드에서 단위가 어긋난다.

### 5.7 반응형

| 폭 | 규칙 |
|---|---|
| **≥981** | `ResultGrid` 12열. 7:5, 6:6 페어 유효. 드로어 = 좌측 400px 오버레이, **딤 없음·스크롤 유지**. 설정 진입점 = 헤더 `leading` + 히어로 액션 + 조건 스트립 "조건 수정" 3곳 |
| **821–980** | `ResultGrid` 1열(모든 카드 전폭). 드로어 딤 + 스크롤락 ON. 히어로 액션 가로 유지 |
| **641–820** | 위와 동일 + `DataTable` **카드형 전환**, 터치 타깃 44px, 카드 패딩 축소 |
| **561–640** | PageHero 세로 스택(제목 아래 액션 전폭 버튼), StatTile 그리드 2열, 드로어 폭 92vw |
| **≤560** | StatTile 1열, 조건 스트립 2줄 wrap, ScenarioTabs 가로 스크롤 + 스크롤 힌트, nav 라벨 12px |

### 5.8 삭제·통합 대상

| 대상 | 조치 | 근거 |
|---|---|---|
| `components/common/ContentLayout/` | **삭제** | 소비처가 `MobileMenuDrawer` 하나뿐(실측). 2단 그리드가 사라지면 존재 이유가 없다 |
| `components/MobileMenuDrawer/` | **삭제** → `SideDrawer` + PageHero로 분해 | 드로어 껍데기 + `HeaderDescription` + 2단 그리드의 잡탕 |
| `components/common/ConfigDrawer/`의 `ConfigColumn`(정적 컬럼 분기) | **삭제** | ≥981 정적 컬럼이 없어진다 |
| `components/common/HeaderDescription/` | **삭제** → `PageHero.lede` | 다른 페이지는 이미 lede를 히어로 안에 갖고 있다 |
| `FeatureLayout`(`Main.shared.styled.ts:50`) | **삭제** → `AppShell` | `container-type` 우회 주석 40줄도 함께 소멸 |
| `DrawerToggleButton`(`Main.shared.styled.ts:85`) | **삭제** → 공용 `Button variant="secondary" startIcon={<Settings/>}` | 자체 스타일 유지 이유가 없어진다(`media.down('drawer')` 게이트도 제거) |
| `MarketDataAsOf` + `LandingDisclaimer` | **통합** → `PageFooter` | 둘 다 "이 화면의 근거와 한계" 정보인데 따로 렌더 중 |
| `SimulationResult`의 `TaxSection`(내부 sunken 박스) | **분리** → 독립 카드(맨 끝) | 다른 가정의 세계를 같은 카드에 두지 않는다 |
| `SimulationResult`의 종합과세 `WarningSlot` | **분리** → 요약 카드 **밖** 전폭 Banner | 결론에 대한 경고는 카드 안에 갇히면 안 된다 |
| `ResultsColumn`(1열 grid) | **교체** → `PageGrid.ResultGrid` | |
| 중복 "결과 간략히" 토글 위치 | 요약 카드 헤더 → **ScenarioTabs 줄 우측**으로 이동 | 요약 카드가 hero를 위해 헤더를 비워야 한다 |
| 빈 결과 시 `PortfolioPresetBoard` | **유지**하되 `EmptyState` 규격으로 감싼다 | 지금은 자체 보드라 다른 페이지 빈 상태와 언어가 다르다 |

### 5.9 컴포넌트 분해안 (구현자용)

```
pages/Main/
  Main.tsx                      (컨테이너 — 변화 없음)
  Main.view.tsx                 AppShell + PageHero + SideDrawer + ResultGrid 조립만
  Main.styled.ts                globalStyle만 유지
  components/
    SimulatorHero/              PageHero 래핑 + 설정/PDF 액션 (X.tsx/.styled/.types)
    SettingsDrawer/             SideDrawer + MainLeftPanel 내용 (구 MobileMenuDrawer 대체)
    ResultSummaryCard/          hero + 타일 + 조건 스트립  ← SimulationResult에서 분리
    ConditionStrip/             조건 요약 + "조건 수정" (X.tsx/.styled/.types/.utils)
    SaleTaxCard/                "전량 매도한다면"          ← SimulationResult에서 분리
    MainResultGrid/             ResultGrid 배치 + span 규칙 (뷰 전용)
    (기존) MainLeftPanel · MainRightPanel · ChartPanel · TickerModal · HelpModal …
```

- `ConditionStrip.utils.ts` = 폼 값 → 표시 문자열 배열(순수, 테스트 대상).
- `MainRightPanel`은 **차트/표 카드의 데이터 조립**만 남기고, 배치는 `MainResultGrid`가 갖는다(현재 572줄 → 분해 목표 300줄 이하).
- 계산·상태 로직은 이동 금지 — 이번 작업은 **배치와 표면**만이다.

---

## 6. `/dividend/portfolio` — 내 포트폴리오

### 6.1 현재 구조 진단

`pages/Portfolio/PortfolioPage/PortfolioPage.view.tsx:216-476` 실측:

```
PageStack
 ├ PageHero(로컬)          아이콘+제목+리드+기준일
 ├ LiveRegion
 ├ Banner(storageError/fxError/undo)
 ├ [빈 상태] EmptyStateCard + GoalCard
 └ [보유 있음]
    ├ SummaryCard   제목 → hero(월배당 세후) → TileGrid → 노트 → CTA 2개 → 사유
    ├ GoalCard      제목/목표수정 → GoalMeter → 타일 → 근거노트 → 상태줄 → CTA
    └ HoldingsCard  제목/추가 → 로컬전용 고지 → HoldingsTable
 ├ AssumptionsDetails(details)   세율 입력 + 조건 목록 + 목표 조건 그룹
 └ FootNoteCard  4줄
 └ HoldingPickerDrawer(우측)
```

문제:

1. **세로 1열 스택**이라 데스크톱 1200px에서 카드가 전부 전폭으로 늘어나 **한 줄에 정보가 3~4개뿐**이다. 요약 타일이 가로로 흩어져 스캔이 오히려 어렵다.
2. **CTA가 요약 카드 바닥에 묻혀 있다**(`view.tsx:330-343`). "시뮬레이터로"·"캘린더로"는 이 페이지의 출구인데 스크롤해야 보인다.
3. **목표 카드가 요약과 보유 사이에 끼어** 세 카드가 같은 시각 무게로 경쟁한다. 목표는 요약의 *해석*이지 별개 주제가 아니다.
4. `AssumptionsDetails` 안에 **세율 입력(인터랙티브)** 과 **조건 목록(읽기)** 과 **목표 조건 그룹**이 한 `<details>`에 섞여 있다(`view.tsx:398-446`).
5. 각주 4줄이 페이지 맨 아래 카드로 있고, 그 위 `details`와 역할이 겹친다.

### 6.2 새 레이아웃 — 데스크톱 (≥981)

```
┌ PageHero (tone=gradient) ────────────────────────────────────────────────┐
│ [◈] 내 포트폴리오                    [시뮬레이터로 계산] [배당 캘린더]   │
│ 보유 종목과 수량만 넣으면 지금 받는 배당을 계산해요.                      │
│ 시세 2026-07-27 기준 · 환율 1,382.4원 · 기기에만 저장                     │
│ ┌ hero StatTile (span 1/-1) ────────────────────────────────────────┐   │
│ │ 월 배당 (세후)                                                     │   │
│ │  312,400원                            ← LINE Seed KR, 화면 유일    │   │
│ │ 연 3,748,800원 · 세율 15.4% 적용                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
 ※ CTA 비활성 사유 줄 (있을 때만, aria-describedby 대상)
┌ ResultGrid 12열 ─────────────────────────────────────────────────────────┐
│ ┌ span 7 · 지금 받는 배당 ───────┐ ┌ span 5 · 목표 달성 ────────────────┐│
│ │ [평가금액] [연 배당(세후)]     │ │ 목표 달성           [목표 수정]    ││
│ │ [배당수익률] [이번 달 예상]    │ │ ┌ GoalMeter ─────────────────────┐││
│ │ [다음 지급일]                  │ │ │ ████████░░░░░░  62%            │││
│ │ ⓘ 이번 달 예상은 균등 분배…    │ │ │ 목표 월 50만원까지 62% 왔어요  │││
│ │ (제외 종목 사유 줄)            │ │ └────────────────────────────────┘││
│ └────────────────────────────────┘ │ [남은 금액 187,600원] [예상 달성]││
│                                    │ ⓘ 기준: 시뮬레이터 조건            ││
│                                    │ ✓ 2039년쯤 닿을 것으로 보여요      ││
│                                    └────────────────────────────────────┘│
│ ┌ span 12 · 보유 종목 (N)                          [+ 종목 추가] ───────┐│
│ │ 기기에만 저장돼요. 다른 기기에서는 보이지 않아요.                      ││
│ │ ┌─────────┬────────┬──────────┬────────┬────────┬──────────┬───┐    ││
│ │ │ 종목    │ 수량   │ 평가금액 │ 배당률 │ 연배당 │ 다음지급 │ ✕ │    ││
│ │ └─────────┴────────┴──────────┴────────┴────────┴──────────┴───┘    ││
│ └───────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
 ▸ 계산 가정 (details — 세율 입력 · 포트폴리오 조건 · 목표 조건)
 FootNotes (추정 · 지급일 · 목표 기준 차이 · 자문 아님은 PageFooter로 이동)
 PageFooter
 [종목 추가 드로어 — 우측]
```

**빈 상태(보유 0)**

```
┌ PageHero (hero 슬롯 없음 — 값이 없으면 hero도 없다) ──────────┐
│ [◈] 내 포트폴리오                                              │
│ 보유 종목과 수량만 넣으면 지금 받는 배당을 계산해요.            │
└────────────────────────────────────────────────────────────────┘
┌ EmptyState (파스텔 배경, span 12) ─────────────────────────────┐
│ [◇ Wallet]                                                     │
│ 아직 등록한 종목이 없어요                                       │
│ 티커와 수량만 넣으면 30초 만에 내 월배당이 나와요.               │
│ [ + 종목 추가 ]                                                 │
│ 이런 종목은 어때요?  [SCHD] [JEPI] [O] [VIG]                    │
└────────────────────────────────────────────────────────────────┘
┌ span 12 · 목표 달성 (이미 목표가 있으면 유지) ─────────────────┐
```

### 6.3 모바일 (≤820)

```
PageHero (제목 → 리드 → 기준 → hero 타일 → CTA 2개 전폭 세로)
요약 카드   (타일 2열)
목표 달성   (미터 전폭 → 타일 2열)
보유 종목   (≤820 카드형 행: 종목/수량 위, 나머지 라벨-값 쌍)
▸ 계산 가정
각주 / 푸터
[+ 종목 추가]  ← 하단 고정 액션은 만들지 않는다(스크롤 방해). 카드 헤더 버튼 유지
```

### 6.4 재배치 근거

- **hero를 요약 카드에서 PageHero 안으로 올린다.** 이 페이지의 답("지금 내 월배당")은 스크롤 0에서 보여야 한다. 지금은 히어로 밴드 아래 카드 안에 있어 한 번 스크롤해야 나온다.
- **CTA를 히어로 우측으로 승격**: 요약 카드 바닥(`view.tsx:330`)에서 이동. "계산해 봤으니 다음은 어디로"가 첫 화면에서 보인다. 비활성 사유 줄은 히어로 바로 아래에 그대로 유지(`aria-describedby` 연결 불변).
- **요약(7) : 목표(5) 2열** — 목표는 요약의 해석이므로 **같은 눈높이에서 나란히**. 세로로 쌓으면 "따로 있는 기능"으로 읽힌다.
- 보유 목록은 표라서 전폭(12).
- **히어로 값 1개 = `월 배당(세후)`**. `GoalCard`는 hero StatTile을 갖지 않고 `GoalMeter`가 시각 주인공을 맡는다(`GoalCard.tsx:28-29` 기존 주석과 정합).

### 6.5 색·타이포

- PageHero: `gradient-hero`. hero StatTile은 히어로 밴드 위에 얹히므로 면색을 `color.surface`(밴드보다 위로 뜨게) + `brandBorder` + 좌측 `gradientAurora` 리본으로. **밴드 위에 `brandSubtle`을 얹으면 두 틴트가 겹쳐 탁해진다.**
- `GoalMeter` 채움 = `gradientAurora`, 트랙 = `progressTrack`. 퍼센트 숫자는 `font.heroNumeric`을 쓰되 **크기를 hero StatTile보다 작게**(24px) 두어 화면 유일 hero 규칙과 충돌하지 않게 한다.
- 상태 줄: 달성 = `success` 아이콘 + `successSurface` 칩 / 진행 중 = `accentText` + `accentSubtle`. **색 단독 금지 — 아이콘+문장 병기.**
- 신선도 배지(`FreshnessBadge`): 미갱신 = `warning`/`warningSurface`, 수동 입력 = `textMuted`/`surfaceMuted`.
- 종목 티커 열은 **6ch 고정폭**(캘린더가 세운 관례를 따른다) + `font.dataNumeric`.

### 6.6 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 7:5 2열, 보유 표 6열, 히어로 액션 가로 |
| 821–980 | 1열 스택, 표 유지 |
| 641–820 | 표 → **카드형 행**(`DataTable` 전환 관례), 타일 2열 |
| 561–640 | 히어로 세로 스택, CTA 전폭, 드로어 92vw |
| ≤560 | 타일 1열, 기준일 줄 2줄 wrap, quickPick 칩 가로 스크롤 |

### 6.7 삭제·통합

| 대상 | 조치 |
|---|---|
| 로컬 `PageStack`/`PageHero`/`HeroTitleRow`/`HeroIconBadge`/`HeroTitle`/`HeroLede`/`AsOfLine`/`LiveRegion`/`EmptyStateCard`/`FootNoteCard`/`SkeletonBar`/`SkeletonRow` | **삭제** → 공용(C2·C3·C6·C8·C9·C10) |
| `HoldingPickerDrawer/` | **삭제** → `SideDrawer side="right"` |
| `SummaryCard`/`HoldingsCard`/`CardHead`/`CardTitle`/`CardSubtitle` styled | **삭제** → 확장된 `Card`(E1) |
| `TileGrid`/`HeroSlot` styled (Portfolio·GoalCard 2벌) | **삭제** → 공용 `TileGrid`(C5) |
| `copy.footnote.notAdvice` | **이동** → `PageFooter` 공통 고지(페이지마다 반복 금지) |
| `AssumptionsDetails` 안의 목표 조건 그룹 | **유지**(근거는 한 곳에만 있어야 한다 — `view.tsx:426-430` 주석 존중) |
| `ManualTickerForm` | 드로어 안 유지, 단 **`forceOpen` 조건 그대로** |

---

## 7. `/dividend/calendar` — 배당 캘린더

### 7.1 현재 구조 진단

`pages/DividendCalendar/DividendCalendarPage/DividendCalendarPage.view.tsx:107-280` 실측:

```
PageStack
 ├ PageHero(로컬) + HeroDisclaimer + AsOfLine
 ├ LiveRegion / Banner(unknownTickers)
 ├ BoardCard   [필터 버튼(N)] → CalendarToolbar(월 네비) → [빈상태 or 경고]
 │              → MonthSummaryLine → MonthCalendar(6주 고정) → BoardHint
 ├ DetailCard  [아젠다 ↔ 날짜 미정 전환] → AgendaList / UndatedSection
 │              → ScheduleLegendTable
 ├ FootNoteCard 2줄
 └ PickerDrawer(우측) + 사용 불가 섹션
```

문제:

1. **달력과 아젠다가 세로로 떨어져 있다.** 데스크톱 1200px에서 달력 표는 폭이 남고, 아젠다는 그 아래 한참 스크롤해야 나온다. 두 뷰는 **같은 달의 같은 데이터**라 나란히 봐야 한다.
2. **히어로에 값이 없다.** 이 페이지에 들어온 사람이 가장 먼저 알고 싶은 건 "이번 달에 몇 건 들어오나"인데, 그 정보는 `MonthSummaryLine`(달력 위 작은 줄)에 묻혀 있다.
3. 필터 버튼이 `BoardCard` **안쪽 좌상단**이라 페이지 액션인지 카드 액션인지 모호하다.
4. `HeroDisclaimer` + `FootNoteCard` 2줄 + `unknownTickers` 배너가 각각 다른 자리에서 비슷한 말(추정·한계)을 한다.

### 7.2 새 레이아웃 — 데스크톱 (≥981)

```
┌ PageHero ────────────────────────────────────────────────────────────────┐
│ [◈] 배당 지급 캘린더                        [종목 선택 (5)]              │
│ 보유 종목의 배당 지급일을 달력으로 확인해요. 날짜는 과거 지급 이력에서     │
│ 추정한 값이라 실제와 다를 수 있어요.                                      │
│ 실지급일 데이터 2026-07-25 기준                                           │
│ ┌ hero StatTile ──────────────────────────────────────────────────────┐ │
│ │ 2026년 8월 지급 예정                                                 │ │
│ │  7건 · 4종목                        ← LINE Seed KR, 화면 유일        │ │
│ │ 날짜 미정 1건은 아래 탭에서 확인                                      │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
┌ ResultGrid 12열 ─────────────────────────────────────────────────────────┐
│ ┌ span 8 · 월간 달력 ──────────────┐ ┌ span 4 · 이 달의 일정 ──────────┐│
│ │ [‹] 2026년 8월 [›] [이번 달]     │ │ [일정] [날짜 미정 (1)]           ││
│ │ 일 월 화 수 목 금 토             │ │ 8/1 (금)  SCHD  배당            ││
│ │  … 6주 고정 그리드 …             │ │ 8/12(화)  JEPI  배당            ││
│ │  칩 = 티커 시리즈 색             │ │ 8/15(금)  O     배당            ││
│ │  오늘 = aria-current + "오늘"    │ │ …                               ││
│ │ 날짜를 누르면 오른쪽 일정으로     │ │ ── 범례 ──────────────────────  ││
│ └──────────────────────────────────┘ │ ● SCHD  분기 · 3/6/9/12월       ││
│                                      │ ● JEPI  월 · 매월                ││
│                                      └─────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
 FootNotes (지급월 출처 · 날짜 미정 안내)
 PageFooter
 [종목 선택 드로어 — 우측]
```

### 7.3 모바일 (≤820)

```
PageHero (hero 타일 포함)
[종목 선택 (5)]  ← 전폭 버튼
┌ 월간 달력 ─────────────┐
│ [‹] 2026년 8월 [›]     │
│ 7열 유지, 셀 칩은 숨김  │   ← 기존 결정 유지(DOM 동일, CSS로만 감춤)
│ 점 표시로 지급일만 표시 │
└────────────────────────┘
┌ 이 달의 일정 ──────────┐
│ [일정] [날짜 미정(1)]   │
│ 날짜순 목록 (전폭)      │
│ 범례 표                 │
└────────────────────────┘
각주 / 푸터
```

### 7.4 재배치 근거

- **hero = "이번 달 지급 예정 건수·종목 수"**. 금액이 아니라 건수인 이유: 금액 표시는 별도 미션(`design-refresh-plan.md` B-7)이고, **없는 숫자를 지어내지 않는다**. 건수·종목 수는 이미 `month.datedCount`/선택 종목 수로 계산돼 있다.
- 달력(8) : 일정(4) — 달력은 7열 표라 폭이 필요하고, 아젠다는 세로 목록이라 좁아도 된다. **날짜를 클릭 → 우측 일정이 그 날로 점프**하는 기존 `onDayJump` 동선이 두 뷰가 나란할 때 비로소 자연스러워진다.
- 범례를 일정 카드 하단에 유지(선택 종목의 주기·색을 일정과 같은 시선축에서 확인).
- 필터(종목 선택)를 **히어로 액션으로 승격** — 페이지 전체 스코프를 정하는 컨트롤이므로 카드 안이 아니라 페이지 레벨.
- 빈 상태(선택 0종)여도 **월간 달력 표는 항상 렌더**한다(2026-07-25 확정 결정) — 빈 달력이 화면의 뼈대다. hero 타일 값은 "선택한 종목이 없어요"로 대체하고 EmptyState는 달력 위가 아니라 **일정 카드 자리**에 넣는다.

### 7.5 색·타이포

- 티커 시리즈 색(`utils/tickerColor.ts`)을 달력 칩·아젠다 점·범례 점·미정 카드까지 **일관 확장**(기존 결정 유지).
- 오늘 셀: `brandSubtle` 면 + `brandBorder` + "오늘" 배지(**색 단독 금지**).
- 날짜 미정: 점선 테두리 + `textMuted`/`surfaceMuted` 배지.
- 배지 톤은 대비 검증된 쌍만: `success/successSurface`, `accentAltText/accentAltSubtle`, `textMuted/surfaceMuted`.
- 티커 열 6ch 고정폭 + `font.dataNumeric`. 날짜 숫자도 `font.dataNumeric`(달력 격자 정렬의 핵심).
- 달력 헤더 요일: `font.sans` medium `textMuted`.

### 7.6 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 8:4 2열 |
| 821–980 | 1열(달력 → 일정) |
| 641–820 | 달력 셀 칩 → **점 표시**, 일정 목록이 주 뷰 |
| 561–640 | 월 네비 버튼 44px, 히어로 세로 스택 |
| ≤560 | 요일 헤더 1글자, 셀 최소 높이 44px, 범례 2열 |

### 7.7 삭제·통합

| 대상 | 조치 |
|---|---|
| 로컬 히어로/각주/라이브리전/빈상태/스켈레톤 styled | **삭제** → 공용 |
| `PickerDrawer/` | **삭제** → `SideDrawer side="right"` |
| `HeroDisclaimer` | **통합** → PageHero `lede` 2문장 또는 `meta` 줄 |
| `BoardHint`("날짜를 누르면…") | **유지**하되 달력 카드 하단 1줄로(현재 위치 유지) |
| `BoardCard` 안 `FilterButton` | **이동** → PageHero 액션 |
| `copy.footnote` 중 자문 고지 | **이동** → `PageFooter` |
| 아젠다/미정 `aria-pressed` 전환 버튼 | **유지**(role=tab 아님 — 기존 결정) |

---

## 8. `/community/portfolio` — 포트폴리오 갤러리

### 8.1 현재 진단

`pages/Community/CommunityGalleryPage/CommunityGalleryPage.view.tsx:104-233`:

```
<section aria-label>
 ├ ControlBar   [정렬 탭(최신/인기)]  ...  [카드/목록 뷰 토글]
 ├ 상태별: 스켈레톤 / 에러 배너 / EmptyState ×3(빈·검색빈·필터빈)
 └ CardGrid 또는 InlineList → Sentinel → LoadStatus
```

문제:

1. **PageHero가 없다.** 이 페이지가 무엇인지, 왜 여기 왔는지 알려주는 요소가 0이다. 다른 페이지에는 전부 있다.
2. **글쓰기 버튼이 빈 상태에만 있다**(`view.tsx:161`). 글이 하나라도 있으면 쓰기 진입점이 사라진다 — 게시판(`CommunityBoardPage.view.tsx:70`)에는 항상 있는데 갤러리엔 없어 **두 형제 페이지의 규칙이 다르다.**
3. 검색바는 **헤더 안**(`CommunityHeader.tsx:91`)에 있고 정렬·뷰 토글은 **본문**에 있어 필터 컨트롤이 두 층에 흩어져 있다.
4. `EmptyState`가 3종인데 각각 다른 CTA를 갖는 건 맞지만, 셋 다 `components/community` 소유라 다른 페이지가 못 쓴다.

### 8.2 새 레이아웃 — 데스크톱

```
┌ PageHero (tone=gradient, stat 없음) ─────────────────────────────────────┐
│ [◈] 포트폴리오 갤러리                                    [+ 글쓰기]      │
│ 다른 사람이 짠 배당 포트폴리오를 구경하고, 시뮬레이터로 바로 계산해 보세요.│
└──────────────────────────────────────────────────────────────────────────┘
┌ FeedToolbar (sticky, top = 헤더 높이) ───────────────────────────────────┐
│ [최신][인기]        [🔍 검색어…]  [⚙ 정밀 검색 (2)]      [▦][☰]        │
└──────────────────────────────────────────────────────────────────────────┘
┌ CardGrid  auto-fit minmax(280px, 1fr) ───────────────────────────────────┐
│ ┌ 글 카드 ────────┐ ┌ 글 카드 ────────┐ ┌ 글 카드 ────────┐              │
│ │ 제목             │ │                 │ │                 │              │
│ │ 본문 발췌 2줄    │ │                 │ │                 │              │
│ │ ┌ 요약 블록 ───┐ │ │                 │ │                 │              │
│ │ │ 월 배당(세후)│ │ │                 │ │                 │              │
│ │ │  187만원     │ │ │                 │ │                 │              │
│ │ │ [n년차 달성] │ │ │                 │ │                 │              │
│ │ │ 최종자산·투입│ │ │                 │ │                 │              │
│ │ └──────────────┘ │ │                 │ │                 │              │
│ │ 조건 컨텍스트 1줄│ │                 │ │                 │              │
│ │ ─────────────── │ │                 │ │                 │              │
│ │ 닉네임      ♥ 12│ │                 │ │                 │              │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│  … 무한 스크롤 …                                                          │
└──────────────────────────────────────────────────────────────────────────┘
 Sentinel + LoadStatus(role=status)
 PageFooter
```

### 8.3 모바일

```
PageHero (제목 → 리드 → [+ 글쓰기] 전폭)
FeedToolbar (sticky):
  1줄: [최신][인기]              [▦][☰]
  2줄: [🔍 검색어…]        [⚙ (2)]
CardGrid 1열 (≤640)
```

### 8.4 재배치 근거

- **히어로 신설**: 커뮤니티 두 페이지에 제목·설명이 없으면 첫 방문자는 "여기서 뭘 하는 곳인가"를 못 읽는다. 게시판에는 `BoardHeading`이 이미 있으므로 **갤러리를 게시판 쪽에 맞춘다**(둘 다 PageHero로).
- **글쓰기 버튼 상시 노출**: 두 형제 페이지의 규칙을 같게. 위치는 히어로 우측(게시판과 동일 자리).
- **FeedToolbar로 필터 컨트롤 1층화**: 정렬 + 검색 + 정밀 검색 + 뷰 토글을 한 줄에. 검색바는 헤더에서 **본문 툴바로 내린다**(헤더 검색은 §17 랜딩·통합 검색 미션이 가져갈 자리라 지금 두 곳에 있을 이유가 없다). ❓ §20-B 참고.
- 툴바 `sticky`: 긴 피드에서 정렬·뷰 전환이 항상 닿게. `top` = 헤더 높이 CSS 변수 재사용.
- 카드는 **velog 글 카드 포맷 3층 위계 유지**(제목 → 발췌 → 요약 블록 → 컨텍스트 → 구분선 → 닉네임|♥). 이 포맷은 확정 결정이라 **변경하지 않는다.** 바뀌는 건 그리드·툴바·히어로뿐.

### 8.5 색·타이포

- 카드 = **콘텐츠 카드**(`radius.xs`, `surface`, `border`, `shadow.e1`). 파스텔 그라디언트 금지.
- 요약 블록(`SimSummaryStats card`) 배경 = `surfaceSunken`.
- "n년차 달성" 배지 = `accent`/`accentSubtle`(성장·달성 계열).
- 행(`PostRow`) hover = 좌측 `accentBorder` 레일(평상시 transparent) + `surfaceHover` — 기존 결정 유지.
- 카드 제목 = `font.display` bold `lg`. 요약 블록 hero 값 = `font.dataNumeric`(**LINE Seed KR 아님** — 화면당 1 hero 규칙: 카드가 여러 개인 피드에서 hero 서체를 쓰면 규칙이 무너진다).
- 좋아요 수·조회수 = `font.dataNumeric` + `tabular-nums`.

### 8.6 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 카드 3열(auto-fit 280), 툴바 1줄 |
| 821–980 | 카드 2열, 툴바 1줄 |
| 641–820 | 카드 2열, 툴바 2줄 |
| 561–640 | 카드 **1열**, 툴바 2줄, 히어로 세로 |
| ≤560 | 카드 1열, 정밀 검색 = 인라인 패널(팝오버 아님 — 기존 variant 분기 유지) |

### 8.7 삭제·통합

| 대상 | 조치 |
|---|---|
| `ControlBar` styled | **삭제** → `FeedToolbar`(C12) |
| `SkeletonCard`/`SkeletonRow`/`SkeletonLine` | **삭제** → 공용 `Skeleton`(C8) |
| `components/community/EmptyState` | **이동** → `components/common/EmptyState`(community 배럴은 re-export만) |
| `CardGrid`/`InlineList` styled | **삭제** → 공용 `CardGrid`(C4) + `Stack` |
| 헤더 `CommunitySearchBar` | **이동** → FeedToolbar (❓ §20-B) |

---

## 9. `/community/board` — 자유게시판

### 9.1 현재 진단

`CommunityBoardPage.view.tsx:63-133`. 갤러리와 거의 같은 구조인데:
- 제목/부제가 `BoardHeader`(카드도 히어로도 아닌 flex 줄)로 되어 있어 갤러리와 모양이 다르다.
- **뷰 토글이 없다**(항상 행 목록). 갤러리엔 있다.
- 정렬 탭이 없다(최신순 고정).

### 9.2 새 레이아웃

갤러리(§8.2)와 **완전히 같은 골격**을 쓰되 툴바 구성만 다르다.

```
┌ PageHero ────────────────────────────────────────────────────────────────┐
│ [◈] 자유게시판                                             [+ 글쓰기]    │
│ 배당 투자에 대해 자유롭게 이야기해요.                                      │
└──────────────────────────────────────────────────────────────────────────┘
┌ FeedToolbar ─────────────────────────────────────────────────────────────┐
│ (정렬 탭 없음 — 최신순 고정)      [🔍 검색어…]                  (뷰 토글 없음)│
└──────────────────────────────────────────────────────────────────────────┘
┌ 목록(행) — 구분선 피드 ──────────────────────────────────────────────────┐
│ 제목                                            닉네임 · 3시간 전 · ♥ 4  │
│ ────────────────────────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────────────────────────┘
```

- `FeedToolbar`는 **슬롯 기반**이라 없는 슬롯은 렌더하지 않는다(정렬 없음 = 좌측 슬롯 비움). 페이지마다 다른 툴바 컴포넌트를 만들지 않는 게 요점.
- 게시판은 시뮬 첨부가 없으므로 행에 요약 칩이 없다 — `PostRow`의 기존 폴백(텍스트 행) 그대로.
- 공개/비공개 선택은 **게시판에서만 운영자 전용**(확정 결정) — 목록 UI 변화 없음.

**반응형·색·타이포·삭제 대상은 §8과 동일.** (같은 규칙을 두 번 쓰지 않는 것이 이 스펙의 목적이다.)

---

## 10. `/community/{portfolio|board}/write`, `…/:id/edit` — 글쓰기

### 10.1 현재 진단

`CommunityWritePage.view.tsx` + `.styled.ts:` — `WriteForm`이 surface 패널로 card화돼 있고(2026-07-18 결정), 제목 입력은 전역 포커스 링을 끄는 유일 승인 예외다.

문제:
- **페이지 제목(h1)이 없다.** 폼만 덩그러니 있다.
- 폼 폭이 셸 max-width(1200)를 그대로 받아 **에디터 줄 길이가 과도하다**(가독 한계 ~75자 초과).
- 저장/게시 액션이 폼 하단에만 있어 긴 글에서 멀다.

### 10.2 새 레이아웃

```
AppShell width="reading" (max-width 880)
┌ PageHero (tone=plain, 얇게) ─────────────────────────────────────────────┐
│ 새 글 쓰기 · 포트폴리오 갤러리                    [임시 상태]  [게시하기] │
└──────────────────────────────────────────────────────────────────────────┘
┌ WriteForm (도구 카드) ───────────────────────────────────────────────────┐
│ ┌ 제목 입력 (전폭 언더라인, 포커스=언더라인 2px + surfaceSunken) ───────┐│
│ └───────────────────────────────────────────────────────────────────────┘│
│ ── 본문 ────────────────────────────────────────────────────────────────│
│ [ RichTextEditor ]                                                       │
│                                                                          │
│ ── 시뮬레이션                                     [첨부 ⬤] ─────────────│
│ (ON일 때만) 시나리오 피커 그리드 — 카드 선택 즉시 커밋                    │
│ ── 게시 설정 ───────────────────────────────────────────────────────────│
│ [비공개 ⬤]  공개하면 갤러리에 보여요.       ← 게시판은 운영자만 노출     │
└──────────────────────────────────────────────────────────────────────────┘
┌ 하단 액션 바 (sticky bottom, 폼 폭) ─────────────────────────────────────┐
│                                            [취소]        [게시하기]      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 10.3 근거

- **`reading` 폭(880)** 으로 줄 길이를 잡는다. 글쓰기·읽기 화면은 도구 화면과 다른 폭이 맞다.
- **게시 버튼을 상단(히어로)과 하단(sticky) 두 곳**에: 짧은 글은 상단, 긴 글은 하단이 가깝다. 두 버튼은 같은 핸들러·같은 `disabled` 조건을 공유한다.
- 섹션 순서(제목 → 본문 → 시뮬레이션 → 게시 설정)는 **바꾸지 않는다** — 첨부 토글 1단계 커밋 계약이 여기 걸려 있다.
- 검증 실패 표현: 제목 미입력 등은 **필드 아래 인라인 문장** + `aria-invalid`. 게시 버튼이 비활성이면 **버튼 옆에 사유 줄**(무음 비활성 금지).

### 10.4 색·타이포

- `WriteForm` = 도구 카드(`radius.lg`, `surface`, `border`, `shadow.e1`), 옵션 카드 = `surfaceSunken`. 기존 결정 유지.
- 제목 입력 포커스 = 언더라인 `inset 0 -2px` + `color.brand` + `surfaceSunken`(전역 링 예외 — **되돌리기 전 decisions.md 2026-07-20 확인**).
- 제목 입력 폰트 = `font.display` bold `2xl`(글의 제목이므로 헤딩 서체).
- 본문 에디터 = `font.sans`, `leading.relaxed`, 16px 이상(모바일 확대 방지).
- sticky 하단 바 = `surfaceGlass` + `border-top`.

### 10.5 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 880 폭 중앙, 상단+하단 액션 |
| 641–980 | 폭 100%, 좌우 패딩 20px |
| ≤640 | 히어로 액션 숨김(하단 sticky만), 피커 그리드 1열, 하단 바 `env(safe-area-inset-bottom)` 반영 |

### 10.6 삭제·통합

- `AttachSection` 로컬 헤더 조립(`FormSection`이 title 우측 슬롯 미지원이라 만든 것) → **`FormSection`에 `titleRight` 슬롯 추가**해 로컬 조립 제거.
- `WriteForm` 자체 styled 카드 → 확장된 `Card`(E1) `tone="default"`.

---

## 11. `/community/{portfolio|board}/:id` — 글 상세

### 11.1 현재 진단

`CommunityDetailPage.view.tsx` — `PostCard`(본문) + `CommentsCard`(댓글) 2개 surface 패널. 첨부는 `AttachUnit` 한 덩어리(CTA 배너 + 미리보기 아코디언).

문제: 폭이 1200이라 본문 줄 길이가 길다. 목차·공유 같은 부속이 본문 흐름에 섞인다.

### 11.2 새 레이아웃

```
AppShell width="reading" (880)
┌ 본문 카드 (콘텐츠 카드 radius.xs) ───────────────────────────────────────┐
│ ‹ 목록으로                                                    [공유]     │
│ 제목 (h1, font.display)                                                  │
│ 닉네임 · 3시간 전 · 조회 42                          [수정] [삭제]       │
│ ────────────────────────────────────────────────────────────────────────│
│ 본문 (RichTextContent)                                                   │
│ ┌ AttachUnit (surfaceSunken + brandBorder, 한 덩어리) ─────────────────┐│
│ │ [배너] 이 시나리오를 시뮬레이터에서 열어보기                    →     ││
│ │ ────────────────────────────────────────────────────────────────────││
│ │ ▸ 미리보기 (기본 접힘)                                               ││
│ │   [숫자 요약]        [파이 차트]          ← 펼칠 때만 마운트          ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                         [♥ 12]           │
└──────────────────────────────────────────────────────────────────────────┘
┌ 댓글 카드 ───────────────────────────────────────────────────────────────┐
│ 댓글 4                                                                   │
│ (1단계 평면 스레드)                                                      │
│ ────────────────────────────────────────────────────────────────────────│
│ [댓글 입력]                                            [등록]            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 11.3 근거·색·타이포

- **`reading` 폭(880)** — 읽기 화면의 줄 길이. 첨부 미리보기 파이는 그 폭 안에서 2열(숫자|차트), ≤640에서 세로.
- 두 카드 구조·seam 처리(`CommentsCard > section` 상쇄)는 **기존 결정 그대로**.
- 제목 = `font.display` extrabold `clamp(xl, 3vw, 3xl)`. 본문 = `font.sans` `leading.relaxed` 17px.
- 첨부 요약 숫자 = `font.dataNumeric`. 파이 = `buildAllocationPieOption` 재사용(비주얼 동일성이 요구의 본질).
- 좋아요·조회 = `font.dataNumeric` + `tabular-nums`.
- 상단 "‹ 목록으로"는 **헤더의 BackSlot에서 본문 카드 안으로 이동**(헤더는 전 페이지 공통이어야 하므로 페이지 전용 컨트롤을 넣지 않는다).

### 11.4 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 880 중앙, 첨부 미리보기 2열 |
| 641–980 | 100% 폭 |
| ≤640 | 첨부 미리보기 1열, 메타 줄 2줄 wrap, 수정/삭제는 `⋯` 메뉴로 접기 |

### 11.5 삭제·통합

- `CommunityHeader`의 `BackSlot`/`DesktopOnly` → 삭제(§11.3).
- 로컬 `PostCard`/`CommentsCard` styled → 확장된 `Card`(E1) `variant="content"`.

---

## 12. `/community/profile` · `/community/my-posts`

### 12.1 현재 진단

- 프로필: 닉네임 카드 + 회원 탈퇴 아코디언(기본 접힘, danger 톤). 아바타는 폐기됨.
- 내 글: 독립 라우트, 자체 로그인 게이트, `MyPostsSection`이 목록을 소유(PostCard/PostRow 재사용 안 함 — 의도).

문제: 둘 다 PageHero가 없고, 로그인 게이트 화면이 페이지마다 따로 그려진다.

### 12.2 새 레이아웃 (두 페이지 공통 골격)

```
AppShell width="reading" (880)
┌ PageHero (tone=plain) ───────────────────────────────────────────────────┐
│ [◈] 프로필 설정            /            [◈] 내가 쓴 글                    │
│ 닉네임을 바꾸거나 계정을 정리해요.  /  공개·비공개 글을 모두 볼 수 있어요. │
└──────────────────────────────────────────────────────────────────────────┘
[비로그인] EmptyState
   [◇ 자물쇠] 로그인이 필요해요
   로그인하면 내 프로필과 글을 볼 수 있어요.
   [구글] [네이버] [카카오]        ← SocialLoginButton (브랜드 규정색, 토큰 예외)
[로그인]
 ┌ 닉네임 카드 ──────────────────┐   ┌ 내 글 목록 ─────────────────────┐
 │ 닉네임  [입력]      [저장]     │   │ 제목            [비공개] 3일 전 │
 └────────────────────────────────┘   │ ─────────────────────────────── │
 ┌ ▸ 회원 탈퇴 (danger, 접힘) ────┐   └─────────────────────────────────┘
 └────────────────────────────────┘   ⓘ 공개로 바꾸려면 글 상세에서 …
```

- **로그인 게이트 = 공용 `EmptyState`** 로 통일. 두 페이지가 지금 각자 그리는 게이트를 한 부품으로.
- 비공개 배지 = `textMuted`/`surfaceMuted` + **"비공개" 텍스트**(색 단독 금지).
- 탈퇴 아코디언 = `danger`/`dangerSurface`/`dangerBorder`, 헤더 `button` + `aria-expanded`/`aria-controls` 유지.
- 반응형: ≤640에서 닉네임 입력·저장 버튼 세로 스택, 목록 메타 2줄 wrap.
- 삭제: 로컬 게이트 마크업 2벌 → `EmptyState`; 로컬 스켈레톤 → 공용.

---

## 13. `/ticker/all` — ETF 소개 허브

### 13.1 현재 진단

`TickerHubPage.view.tsx:27-80`: `HubHero`(제목+리드+카테고리 앵커) → 카테고리 섹션 × N → `CardGrid`(티커 카드).

문제:
- 히어로가 다른 페이지의 `PageHero`와 다른 로컬 구현.
- 카테고리 앵커가 히어로 안에 있어 스크롤하면 사라진다(항목이 늘수록 더 필요해지는데).
- 카드에 "이 종목으로 계산" 다리 CTA가 없다(§4.5 심리 루프의 필수 요소).

### 13.2 새 레이아웃

```
┌ PageHero (tone=gradient) ────────────────────────────────────────────────┐
│ [◈] 배당 ETF·종목 소개                                                    │
│ 배당 ETF와 개별 종목의 구조·배당 방식을 정리했어요.                        │
│ 11종 · 2026-07 기준                                                       │
└──────────────────────────────────────────────────────────────────────────┘
┌ 카테고리 칩 바 (sticky, top=헤더 높이) ──────────────────────────────────┐
│ [배당성장 4] [고배당 3] [커버드콜 2] [리츠·월배당 1]                      │
└──────────────────────────────────────────────────────────────────────────┘
 ── 배당성장  4종 ────────────────────────────────────────────────────────
┌ CardGrid auto-fit minmax(280px,1fr) ─────────────────────────────────────┐
│ ┌ SCHD ──────────────┐ ┌ VIG ───────────────┐ ┌ DGRO ──────────────┐    │
│ │ SCHD               │ │                    │ │                    │    │
│ │ 슈왑 US 디비던드…  │ │                    │ │                    │    │
│ │ 태그라인 2줄       │ │                    │ │                    │    │
│ │ 배당률 3.5% · 분기 │ │                    │ │                    │    │
│ │ ───────────────── │ │                    │ │                    │    │
│ │ 소개 보기 →        │ │                    │ │                    │    │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
 ── 고배당  3종 ──────────────────────────────────────────────────────────
 …
 PageFooter
```

### 13.3 근거·색·타이포

- **카테고리 칩 바를 히어로 밖 sticky 로 분리** — 목록이 길어질수록(11종 → 수십 종) 항상 닿아야 한다. `FeedToolbar`와 같은 sticky 규칙 재사용.
- 카드는 **콘텐츠 카드**(radius.xs). 히어로만 파스텔.
- **히어로 값 없음**(목록 페이지) — hero StatTile 두지 않는다.
- 카드 티커 심볼 = `font.display` bold, 배당률·주기 = `font.dataNumeric`.
- 카테고리 개수 배지 = `accentAltText`/`accentAltSubtle`.
- 카드 hover = `borderStrong` + `shadow.e2`(상승 1단계). 색으로만 말하지 않게 화살표 글리프가 함께 이동.

### 13.4 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 카드 3열, 칩 바 1줄 |
| 821–980 | 카드 2열 |
| 641–820 | 카드 2열, 칩 바 가로 스크롤 |
| ≤640 | 카드 1열, 칩 바 가로 스크롤 |

### 13.5 삭제·통합

- `HubHero`/`HubTitle`/`HubLede`/`EmptyState`(로컬) → 공용.
- `CategoryNav`(히어로 안 앵커) → sticky 칩 바로 이동.
- `CardGrid`(로컬) → 공용 `CardGrid`.

---

## 14. `/ticker/:name` — ETF 상세

### 14.1 현재 진단

`TickerDetailPage.view.tsx:110-210`: `AccentScope`(티커별 `--tk-*` 액센트) → `Hero`(브레드크럼·티커 배지·태그라인·HeroStatGrid·CTA) → `Layout`(TocAside | Content) → 섹션 6개 + 참고 지표 + FAQ.

여기는 **이미 가장 잘 설계된 페이지**다. 문제는 두 가지뿐:
1. 앱의 다른 페이지와 **히어로 언어가 다르다**(자체 Hero, PageHero 아님).
2. CTA가 "다른 티커 보기" 하나뿐 — **"이 종목으로 내 배당 계산" 다리 CTA가 없다**(§4.5 필수).

### 14.2 새 레이아웃

```
AccentScope (--tk-* 유지)
┌ PageHero (tone=gradient, 배경만 --tk-gradient로 오버라이드) ─────────────┐
│ ETF 소개 › 배당성장 › SCHD                              (브레드크럼)      │
│ ┌──────┐  SCHD                                                           │
│ │ SCHD │  슈왑 US 디비던드 에쿼티 ETF                                     │
│ └──────┘  10년 넘게 배당을 늘려온 미국 기업을 모아 담는 대표 ETF예요.      │
│ ┌ hero ──────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │ 배당률          │ │ 운용보수│ │ 지급주기│ │ 보유종목│                     │
│ │  3.52%          │ │ 0.06%  │ │ 분기   │ │ 103종  │                     │
│ └─────────────────┘ └────────┘ └────────┘ └────────┘                     │
│ [이 종목으로 내 배당 계산 →]   [다른 티커 보기]                          │
└──────────────────────────────────────────────────────────────────────────┘
┌ Layout ──────────────────────────────────────────────────────────────────┐
│ ┌ TocAside (sticky) ┐ ┌ Content (reading 폭) ──────────────────────────┐ │
│ │ 목차               │ │ 섹션 1~6 (SectionHeading + Paragraph)          │ │
│ │ • 한눈에            │ │ ┌ 참고 지표 패널 ────────────────────────────┐│ │
│ │ • 운용보수          │ │ │ FactGrid (라벨|값 2열) · 섹터 칩 · asOf    ││ │
│ │ • 구성 기준         │ │ └────────────────────────────────────────────┘│ │
│ │ • 배당 성장         │ │ ┌ FAQ (아코디언) ────────────────────────────┐│ │
│ │ • …                 │ │ └────────────────────────────────────────────┘│ │
│ │                     │ │ ┌ 관련 티커 ─────────────────────────────────┐│ │
│ │ [계산하기]  ← sticky│ │ └────────────────────────────────────────────┘│ │
│ └────────────────────┘ └───────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 14.3 근거

- **hero 값 1개 = 배당률**. 이 페이지에 온 사람의 첫 질문이다. 나머지 3개는 default 타일로 내린다(현재는 4개가 같은 무게).
- **다리 CTA를 히어로에 primary로** — 유입(SEO)을 정착(Portfolio/시뮬레이터)으로 넘기는 다리가 §4.5의 필수 요소다. 목차 하단에 sticky로 한 번 더(긴 글이라 끝까지 읽은 사람에게도).
- 목차·섹션·FAQ 구조는 **유지**(SEO·JSON-LD가 이 구조에 물려 있다).

### 14.4 색·타이포

- **`--tk-*` 액센트 스코프는 그대로 유지**하되, `PageHero` 배경만 `var(--tk-gradient, var(--sb-gradient-hero))`로 오버라이드한다. 앱 팔레트 토큰(`--sb-*`)은 절대 덮어쓰지 않는다(기존 결정).
- 티커 심볼 배지 = `font.display`, hero 배당률 = `font.heroNumeric`, 나머지 스탯 = `font.dataNumeric`.
- 섹션 제목 = `font.display`. 본문 = `font.sans` `leading.relaxed`.
- 목차 활성 항목 = `--tk-active-bg` + 좌측 2px 레일(색 단독 금지).

### 14.5 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 목차 | 본문 2열(현행 `media.down('layout')` 분기 유지) |
| 821–980 | 목차 → 본문 위 가로 스크롤 칩 바 |
| 641–820 | hero 스탯 2열 |
| ≤640 | hero 스탯 1열, CTA 전폭 세로, FactGrid 1열 |

### 14.6 삭제·통합

- 로컬 `Hero`/`HeroHead`/`HeroTagline` → `PageHero`(액센트 오버라이드 prop).
- `HeroStatGrid` → 공용 `TileGrid` + `StatTile`(hero 1 + default 3).
- `CtaRow` → `PageHero.actions`.

---

## 15. OAuth 콜백 (`/community/auth/{naver|kakao}/callback`)

### 15.1 현재

`routes.tsx:90-96,111-117` — `<p role="status" aria-live="polite">{copy}</p>` 한 줄. 의도적으로 초경량(lazy·supabase-js 미로드).

### 15.2 새 설계 — **최소 변경**

```
┌ 화면 중앙 ───────────────────────────┐
│        [스노우볼 인컴]               │  ← 워드마크(그라디언트 텍스트)
│        ◐ 로그인 중이에요…            │  ← role=status aria-live=polite
│        잠시만 기다려 주세요.          │
└──────────────────────────────────────┘
```

- **AppShell을 쓰지 않는다.** 이 라우트는 eager 번들이고 순간만 보이므로 헤더·nav를 붙이면 그 순간에 nav 링크가 깜빡인다.
- 필요한 것: 중앙 정렬 래퍼 + 워드마크 + 스피너(`prefers-reduced-motion`에서 점 3개 정적) + 문장. `color.bg` 배경.
- 스피너는 `aria-hidden`, 낭독은 문장이 담당.
- 새 컴포넌트 1개: `components/common/AuthCallbackScreen/`(styled 포함 30줄 이하). routes.tsx의 인라인 두 함수가 이걸 쓴다.

---

## 16. `*` — 없는 페이지

### 16.1 현재 진단

`routes.tsx:197-200` — `<Navigate to="/" replace />`. 즉 **404 화면이 없다.**
오타 URL·죽은 링크로 들어온 사용자가 아무 설명 없이 시뮬레이터로 튕긴다. SEO·분석에서도 "없는 페이지"가 관측되지 않는다.

### 16.2 새 설계 — 404 페이지 신설

```
AppShell width="reading"
┌ EmptyState (파스텔 배경) ────────────────────────────────────────────────┐
│ [◇ Compass]                                                              │
│ 찾는 페이지가 없어요                                                      │
│ 주소가 바뀌었거나 삭제된 글일 수 있어요.                                   │
│ [ 시뮬레이터로 가기 ]                                                     │
│ 이런 곳은 어때요?                                                         │
│ [내 포트폴리오] [배당 캘린더] [포트폴리오 갤러리] [ETF 소개]              │
└──────────────────────────────────────────────────────────────────────────┘
```

- `pages/NotFound/NotFoundPage/`(컨테이너 없이 뷰 1개 + styled). eager여도 무게가 없다.
- ⚠ **리다이렉트 → 404 렌더로 바꾸면 기존 동작이 바뀐다.** 공유 URL·OAuth 잔여 경로가 `*`에 걸리던 경우가 있는지 확인이 필요하다(§19 R4).
- GA: `page_view`가 404로 잡히도록 `applySeoRuntimeMetadata`에 noindex 힌트.

---

## 17. (예정) 랜딩 `/` · `/simulator`

**이번 스펙의 대상이 아니다.** `design-refresh-plan.md` 5단계(랜딩+통합 검색)와 3단계(라우팅 개편)의 산출물이다.
이 문서는 **경로 변경을 전제하지 않는다** — §5의 시뮬레이터 설계는 `/`에 있든 `/simulator`에 있든 그대로 성립한다.

다만 랜딩이 생길 때 **이 문서의 §2 공통 셸을 그대로 따라야 한다**는 것만 못 박는다:
- 랜딩 히어로 = `PageHero tone="gradient"`의 확대판(검색 입력 슬롯 추가)
- 소개 섹션 = `Card` + `CardGrid`
- FAQ = 상세 페이지 FAQ 아코디언과 **같은 부품**
- Footer = `PageFooter`

---

## 18. 구현 순서 (PR 단위)

> **원칙**: 한 번에 다 바꾸면 리뷰도 롤백도 불가능하다. **페이지 1개 = PR 1개**, 앞에 공통 토대 2개.
> 각 PR의 완료 조건: `npm run verify` 그린 + 8프리셋 라이트/다크 대비 테스트 + 해당 페이지 행동 테스트 갱신.

| # | PR | 내용 | 의존 | 위험 |
|---|---|---|---|---|
| **P0** | `chore(tokens)` | 폰트 4역할 토큰 + 워드마크/파스텔 그라디언트 토큰 + `chartTheme.fontFamily` | 아이덴티티 패스(1단계)에서 이미 끝났으면 생략 | 낮음 |
| **P1** | `feat(common-shell)` | C1~C12 신설/승격 + E1~E3 확장. **소비처는 아직 안 바꾼다**(부품만 추가, 기존 코드 무변경) | P0 | 낮음 — 순수 추가 |
| **P2** | `refactor(portfolio)` | 내 포트폴리오를 공통 셸로 이관 + §6 레이아웃 | P1 | 중 — 가장 최근 페이지라 테스트가 신선하다. **첫 이관 대상으로 최적** |
| **P3** | `refactor(calendar)` | 배당 캘린더 §7 | P2(패턴 검증됨) | 중 |
| **P4** | `feat(simulator-layout)` | **시뮬레이터 대개편** — 전 폭 드로어 + ResultGrid + 카드 분해 | P1~P3 | **높음** — 아래 §19 참고. 단독 PR 필수 |
| **P5** | `refactor(community-feed)` | 갤러리 + 게시판(§8·§9) — 형제라 같이 | P1 | 중 |
| **P6** | `refactor(community-write-detail)` | 글쓰기 + 상세(§10·§11) | P5 | 중 |
| **P7** | `refactor(community-profile)` | 프로필 + 내 글(§12) | P5 | 낮음 |
| **P8** | `refactor(ticker)` | 허브 + 상세(§13·§14) | P1 | 중 — 서버렌더(`api/ticker-html`) 동기화 확인 |
| **P9** | `feat(not-found)` | 404 페이지 + 콜백 화면(§15·§16) | P1 | 낮음 |
| **P10** | `chore(cleanup)` | 죽은 styled·폴더 일괄 삭제(`ContentLayout`·`MobileMenuDrawer`·중복 스켈레톤…) + 전 페이지 육안 검수 | P2~P9 전부 | 낮음 |

**왜 P2(Portfolio)를 먼저 하나**: 방금 랜딩해 테스트가 가장 촘촘하고, 로컬 복제 styled가 가장 많아 공통 셸의 값어치를 즉시 증명한다. 여기서 셸 API가 틀렸다는 게 드러나면 P1을 싸게 고칠 수 있다.
**왜 P4(시뮬레이터)를 뒤로 미루나**: 구조 변경(드로어·2단 제거)이 가장 크고 테스트 파급이 가장 넓다. 셸이 3개 페이지에서 검증된 뒤에 들어가야 한다.

---

## 19. 리스크

| # | 리스크 | 근거 | 완화 |
|---|---|---|---|
| **R1** | **드로어 관련 테스트 대량 실패** — jsdom 테스트가 "≤960에서만 드로어" 전제로 짜여 있다. 전 폭 드로어가 되면 데스크톱 테스트도 "설정 열기" 스텝이 필요해진다 | `MobileMenuDrawer.tsx:17-47`(matchMedia 분기), `test/main/*` | P4에서 드로어 열기 헬퍼를 하나 만들어 일괄 적용. `design-refresh-plan.md` 3-11에 이미 예고돼 있다 |
| **R2** | **`container-type` 제거 파급** — `FeatureLayout`이 사라지면 `ConfigInputGrid`의 컨테이너 쿼리가 기댈 컨테이너가 없어진다 | `ConfigForm.styled.ts:15`, `Main.shared.styled.ts:31-49` | `SideDrawer` 본문에 `container-type: inline-size` 부여(§2.6). 400px 드로어에서 1열이 되는 것이 정답 |
| **R3** | **`accentAlt`를 그린으로 재정의**하면 바이올렛을 정체성으로 쓰는 프리셋(grape)과 기존 accentAlt 소비처(목표 칩·추천 칩·"n년차 달성" 배지)의 인상이 바뀐다 | `Chip.types.ts:7`, presets.ts | 아이덴티티 패스에서 8프리셋 × 라이트/다크 대비 테스트로 게이트. 프리셋별로 "그린 계열이되 그 프리셋의 색상군에 맞춘 값"을 잡는다 |
| **R4** | **`*` → 404 렌더 전환**이 기존 리다이렉트에 기대던 경로를 깬다 | `routes.tsx:197` | 전환 전에 `/community` 계열·OAuth 잔여 경로가 `*`로 떨어지는 케이스를 실측. 애매하면 P9를 보류하고 리다이렉트 유지 |
| **R5** | **헤더 검색바 이동**(갤러리 툴바로)이 커뮤니티 헤더 테스트·모바일 검색 토글을 깬다 | `CommunityHeader.tsx:91-134` | §20-B 사용자 결정 전까지 **이동하지 않는다**. 결정 전이면 헤더 유지 + 툴바에는 정렬/뷰만 |
| **R6** | **워드마크 `<h1>` 강등**(시뮬레이터가 `brandAs='h1'`이었다) → 문서 개요 변화 | `SimulatorHeader.tsx:22`, `PrimaryNav.tsx:98` | PageHero 제목이 `h1`을 가져가므로 총 개수는 그대로 1개. SEO 스냅샷 테스트가 있으면 갱신 |
| **R7** | **hero 서체(LINE Seed KR)를 카드 피드에 잘못 적용**하면 화면당 1 hero 규칙이 조용히 무너진다 | `StatTile.types.ts:5` | `StatTile emphasis="hero"`만 heroNumeric을 쓰게 컴포넌트 안에 가둔다. 페이지가 직접 `font.heroNumeric`을 쓰지 못하게 코드리뷰 항목화 |
| **R8** | **결과 카드 2열 배치가 ECharts 리사이즈를 유발** — 폭이 좁아지며 라벨 겹침 | `ResponsiveEChart` | `ChartPanel`에 최소 폭 가드(`span 5`≈440px @1200). ≤980에서 1열로 접히므로 그 아래는 안전 |
| **R9** | **PageHero에 hero StatTile을 넣으면** 히어로 밴드 그라디언트 위에 카드가 얹힌다 — 두 틴트가 겹쳐 탁해질 수 있다 | §6.5 | hero 타일 면색을 `surface`로(밴드보다 위로 뜨게). 8프리셋 육안 검수 항목 |
| **R10** | **공유·저장 스키마 무관** — 이번 작업은 표시층만 건드리지만, `PortfolioComposition`·`ScenarioTabs` 같은 컴포넌트를 옮기다 props 계약을 흔들면 자동저장·공유가 깨진다 | decisions.md §클라우드 저장 | 이동은 **JSX 위치만**, props·핸들러 시그니처 변경 금지. 로직 변경이 필요하면 `frontend-engineer`→`state-engineer`로 넘긴다 |
| **R11** | **`components/common` 비대화** — C1~C12가 한 번에 들어오면 배럴이 커진다 | `components/common/index.ts` | 각 부품은 자기 폴더 + 배럴 1줄. 엔트리 번들 크기를 P1 전후로 실측해 기록(허용 상한 ❓ §20-E) |

---

## 20. 미결 ❓ (사용자 결정 필요)

| # | 항목 | 선택지 | 설계자 권장 |
|---|---|---|---|
| **A** | **드로어 딤 정책** — ≥981에서 백드롭을 딤 없이(투명 스크림) 둘까? | ⓐ 전 폭 동일하게 딤 / ⓑ ≥981만 투명 스크림 + 스크롤 유지 | **ⓑ** — 오버레이 방식(확정)을 지키면서 "조정↔확인 루프"를 살리는 유일한 방법. §2.6 |
| **B** | **커뮤니티 검색바 위치** — 헤더 vs 본문 툴바 | ⓐ 헤더 유지(현행) / ⓑ 본문 FeedToolbar로 이동 / ⓒ 둘 다 | **ⓑ** — 헤더 검색은 랜딩의 통합 검색(5단계)이 가져갈 자리다. 지금 두 곳에 두면 나중에 셋이 된다 |
| **C** | **시뮬레이터 첫 방문 시 설정 드로어 기본 열림?** | ⓐ 닫힘(현행) / ⓑ 포트폴리오가 비었을 때만 열림 | **ⓑ** — 빈 결과 화면에서 다음 행동이 명확해진다. 단 `TourGuide`와 겹치지 않게 순서 조정 필요 |
| **D** | **SideDrawer에 포커스 트랩을 넣을까?** | ⓐ 현행 유지(Esc·바깥클릭·복귀만, `aria-modal` 미선언) / ⓑ 트랩 + `role="dialog" aria-modal="true"` | **ⓐ 유지** — 트랩을 넣으면 ≥981에서 결과를 탭으로 못 훑는다(루프 단절). 모달이 아니라 사이드 패널이라는 성격을 지킨다 |
| **E** | **`*` catch-all을 404 페이지로 바꿀까?** | ⓐ 현행 리다이렉트 유지 / ⓑ 404 렌더 | **ⓑ** — 다만 R4 실측 후. 리다이렉트는 사용자에게 아무것도 설명하지 않는다 |
| **F** | **`AppShell` max-width** — `wide` 1200 / `reading` 880 | ⓐ 제안대로 / ⓑ reading을 760으로 더 좁게 | **ⓐ** — 첨부 미리보기(숫자+파이 2열)가 880 아래에서 좁아진다 |
| **G** | **캘린더 hero 값** — "건수·종목 수" vs "이번 달 예상 입금액" | ⓐ 건수(지금 가능) / ⓑ 금액(별도 미션 B-7 선행) | **ⓐ 먼저**, B-7 완료 후 ⓑ로 승격. 없는 숫자를 만들지 않는다 |
| **H** | **워드마크 줄 처리** — 현재 "Snowball / Income" 2줄 스택 | ⓐ "스노우볼 인컴" 한 줄 / ⓑ 2줄 유지 | **ⓐ** — 한글 4+2자라 한 줄이 자연스럽고, 아이콘이 사라져 높이를 맞출 이유도 없다 |
| **I** | **파비콘·OG 이미지·webmanifest** 갱신 범위 | 아이덴티티 패스 1-6의 미결 그대로 | 이 스펙 범위 밖 — 다만 워드마크에서 아이콘을 빼도 **파비콘·PWA 아이콘은 남는다**(브라우저 탭엔 이미지가 필요). 단색 폴백 `#3ba5d3`/`#0d9488` 기준으로 별도 제작 |
| **J** | **어미 톤 통일** — 지금 포폴·캘린더는 "~습니다", 커뮤니티는 "~해요" | ⓐ 전부 격식체 "~습니다" / ⓑ 전부 해요체 / ⓒ 도구=격식체·커뮤니티=해요체로 **명시적 이원화** | **ⓐ** — 6개 중 4개가 이미 격식체이고, 숫자·추정을 다루는 화면의 신뢰 톤이다. ⓒ도 방어 가능하지만 "왜 여기만 다르지"를 매번 설명해야 한다 |
| **K** | **카드 그리드 최소 폭 280px** — 1200 폭에서 3열 | ⓐ 280(3열) / ⓑ 320(3열이지만 여백↑) / ⓒ 260(4열 가능) | **ⓐ** — 갤러리 카드가 요약 블록(숫자 3개)을 품어야 해서 260은 좁고, 4열은 카드 밀도가 과해진다 |

---

## 부록 A. 페이지 × 히어로 값 대조표

| 페이지 | hero StatTile | 서체 | 없으면 이유 |
|---|---|---|---|
| 시뮬레이터 | 최종 자산 가치 (간이 모드: 최종 자산 추정) | LINE Seed KR | — |
| 내 포트폴리오 | 월 배당 (세후) | LINE Seed KR | — |
| 배당 캘린더 | 이번 달 지급 예정 건수·종목 수 | LINE Seed KR | — |
| 포트폴리오 갤러리 | 없음 | — | 피드 — 카드마다 값이 있어 페이지 hero가 성립 안 함 |
| 자유게시판 | 없음 | — | 피드 |
| 글쓰기 | 없음 | — | 폼 |
| 글 상세 | 없음(첨부 요약의 월배당은 카드 내부 hero) | dataNumeric | 읽기 화면 |
| 프로필 · 내 글 | 없음 | — | 설정·목록 |
| ETF 허브 | 없음 | — | 목록 |
| ETF 상세 | 배당률 | LINE Seed KR | — |
| 404 · 콜백 | 없음 | — | — |

## 부록 B. 공통 부품 소비 대조표

| 부품 | 시뮬 | 포폴 | 캘린더 | 갤러리 | 게시판 | 글쓰기 | 상세 | 프로필 | 허브 | 티커 | 404 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AppShell(C1) | ● | ● | ● | ● | ● | ●r | ●r | ●r | ● | ● | ●r |
| PageHero(C2) | ● | ● | ● | ● | ● | ● | ○ | ● | ● | ● | ○ |
| PageGrid(C3) | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| CardGrid(C4) | ○ | ○ | ○ | ● | ○ | ● | ○ | ○ | ● | ○ | ○ |
| TileGrid(C5) | ● | ● | ● | ○ | ○ | ○ | ● | ○ | ○ | ● | ○ |
| EmptyState(C6) | ● | ● | ● | ● | ● | ○ | ○ | ● | ● | ○ | ● |
| SideDrawer(C7) | ●L | ●R | ●R | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Skeleton(C8) | ● | ● | ● | ● | ● | ○ | ● | ● | ○ | ○ | ○ |
| LiveRegion(C9) | ● | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ |
| FootNotes(C10) | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| PageFooter(C11) | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| FeedToolbar(C12) | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ●칩 | ○ | ○ |

`●`=사용 / `○`=미사용 / `r`=reading 폭 / `L`·`R`=드로어 방향
