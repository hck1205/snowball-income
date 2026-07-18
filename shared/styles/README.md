# Snowball Income 디자인 시스템

새 화면을 만들 때 이 문서만 보고 일관되게 만들 수 있어야 한다.
**규칙 하나만 기억하면 된다: 값을 직접 쓰지 말고 토큰을 쓴다.**

```ts
// ❌ 하드코딩
color: #2f6f93;
padding: 14px;

// ✅ 토큰
import { color, space } from '@/shared/styles';
color: ${color.brand};
padding: ${space[4]};
```

---

## 1. 브랜드 — "빙하 위의 오로라"

> 팔레트 프리셋 도입 후 이 절의 색 이야기는 **aurora 프리셋**의 정체성이다(§2 프리셋 참고 —
> 기본 프리셋은 velog). 단, "시그니처는 여섯 곳뿐" 같은 **역할 규칙은 전 프리셋 공통**이다.

**글레이셔 애저(glacier azure, hue ~200)** + 오로라 리본(glacier→teal→violet).

눈덩이(스노우볼) 메타포와 금융의 신뢰감이 만나는 지점으로 hue ~200을 골랐다.
순수 네이비는 은행 UI에서 너무 흔하고, 더 청록으로 가면 헬스케어처럼 읽힌다.

**내러티브**: 스노우볼이 구르는 곳은 극지의 밤이다. 페이지 배경은 빙하(ice-white/polar-night)로
차분하게 두고, 배당이 쌓여 목표에 다가가는 지점에서만 오로라 리본이 빛난다.

### 오로라 시그니처 — 적용처는 이 여섯 곳뿐

| # | 적용처 | 토큰 |
|---|---|---|
| 1 | hero 지표의 좌측 액센트 바 | `gradient-aurora` |
| 2 | 목표 달성 진행률 바 채움 | `gradient-aurora` (트랙은 `progress-track`) |
| 3 | 활성 탭 하단 인디케이터 | `gradient-aurora` |
| 4 | primary CTA 버튼 채움 | `gradient-cta` |
| 5 | 카드 hover 액센트 바 (프리셋·ScenarioCard·TourPopover) | `gradient-aurora` |
| 6 | BrandMark(로고) | `--sb-ribbon-stop-1~3` |

여기에 페이지 상단의 배경 글로우(`bg-glow`, body 한 곳)가 앰비언트로 깔린다.
**이 목록 밖에 리본/글로우를 추가하지 마라** — 시그니처는 희소해야 시그니처다.
작은 유틸리티 버튼·상태 토글은 솔리드 `color.brand`를 유지한다.

### 리본이 2종인 이유 (표시용 vs CTA용)

- **표시용 `gradient-aurora`** — 그 자체가 보이는 요소(액센트 바·진행률·탭 인디케이터).
  기준은 놓이는 서피스 대비 **3:1** (WCAG 1.4.11).
- **CTA용 `gradient-cta`** — 위에 라벨이 얹히는 요소(primary 버튼).
  기준은 모든 stop이 **`on-brand` 라벨** 대비 **4.5:1** (WCAG 1.4.3).
  라벨 색은 프리셋마다 다르다(velog/sunset/ink 다크는 어두운 라벨) — **#fff 하드코딩 금지, 반드시 `color.onBrand`**.

teal의 물리 특성상 두 조건을 한 색으로 만족 못 한다(다크 리본 teal #2dd4bf는 흰 라벨 1.9:1).
그래서 stop이 다르다 — 하나로 합치려는 시도가 곧 회귀다. `contrast.test.ts`가 stop별로 강제한다.

### accent는 크롬 전용 — 숫자 데이터에 금지

`accent`(오로라 teal, 성장·복리·달성)와 `accentAlt`(violet, 목표·추천·하이라이트)는
아이콘·배지·장식 같은 **크롬에만** 쓴다. **숫자(금액·퍼센트)에 칠하면 안 된다** —
부호 있는 숫자의 색은 오직 `dataPositive`/`dataNegative`(up/down 램프)다.
teal이 상승처럼, violet이 하락처럼 오독되는 순간 데이터 색 체계가 무너진다.

로고 마크(`components/BrandMark`)는 같은 중심에서 커지는 원 세 개 = 복리(누적)의 시각화다.

---

## 2. 토큰 구조 (2계층 + 프리셋)

```
primitives.ts   원시 램프/스케일 — 의미 없음. 화면에서 직접 쓰지 마라.
      ↓
presets.ts      팔레트 프리셋 레지스트리(THEME_PRESETS) — 역할 → hex 의 유일한 진실 공급원.
      ↓         8프리셋(velog/forest/aurora/vivid/navy-gold/grape/sunset/ink) × light/dark. globalStyles가 이걸로
semantic.ts     CSS 변수를 찍고, 대비 검증 테스트(contrast.test.ts)도 같은 값을 읽는다.
      ↓         semantic.ts는 `color` 파사드(var 참조)와 하위 호환 별칭(LIGHT/DARK_THEME=aurora)만 남는다.
tokens.ts       파사드. `@/shared/styles`가 여기서 전부 re-export 한다.
```

색은 전부 `var(--sb-*)` 문자열이다. Emotion `ThemeProvider`를 쓰지 않는다
(공용 컴포넌트 테스트가 Provider 없이 단독 렌더되기 때문). CSS 변수라서 다크·프리셋 전환에 리렌더가 없다.

### 팔레트 프리셋 — "이름은 역할, 값은 프리셋"

CSS 변수 이름과 `color.*` 파사드는 **역할**이고, 프리셋은 **값만** 바꾼다.
velog에서 `gradient-aurora`는 "오로라"가 아니라 틸그린 duotone이고 `bg-glow`는 단색이다 —
이름을 역할("시그니처 그라데이션", "페이지 배경")로 읽으면 모순이 없다.
**컴포넌트는 프리셋을 몰라야 한다** — 컴포넌트에 프리셋 분기가 생기면 설계 실패다.

| id | 표시명 | 성격 |
|---|---|---|
| `velog`(기본) | 미니멀 그린 | open-color, 플랫·콘텐츠 우선. **라이트 bg 의도적 무틴트**. 다크 on-brand가 **어두운 라벨**(#121212) |
| `forest` | 포레스트 | 딥 그린/세이지 + 우디 브라운. 그린 brand ↔ success는 사용처 분리(배너 vs 컨트롤) |
| `aurora` | 오로라 | 기존 "빙하 위의 오로라" (glacier azure + teal/violet 리본), 라이트 bg 아이스블루 틴트 |
| `vivid` | 비비드 | 라벤더 화이트 + 일렉트릭 블루 + 민트/퍼플, 컬러 섀도 |
| `navy-gold` | 네이비 골드 | 크림 골드 + 딥 네이비. 골드는 장신구 전용 — **CTA 채움 금지** |
| `grape` | 그레이프 | 퍼플 + 오키드 + 인디고의 모노크로매틱. 다크 brand 3.19 knife-edge — 더 어둡게 금지 |
| `sunset` | 선셋 | 웜 코랄/앰버. 다크 on-brand **어두운 라벨**(#1e1410). CTA에 로즈 금지(danger 혼동) |
| `ink` | 잉크 | 고대비 모노크롬 — 크롬 완전 무채, **차트만 유채**(aurora 8색). 다크 on-brand #111111 |

배선: `html[data-palette='<id>']` 어트리뷰트가 프리셋을 정한다(없으면 velog — no-JS 폴백).
선택값은 jotai `palettePresetAtom`(localStorage `snowball:palette`)이 들고,
`useApplyPalettePreset`이 어트리뷰트로 반영한다. 첫 페인트 전에는 index.html의 인라인
스크립트가 박는다(FOUC 방지). id 계약은 `@/shared/constants/palette`.

**프리셋 추가 절차 (3줄)**
1. `shared/constants/palette`의 `PALETTE_PRESET_IDS`에 id 추가 + index.html 인라인 스크립트의 유효값 목록·프리페인트 배경 갱신.
2. `presets.ts`에 light/dark 전체 토큰 맵(키 집합은 기존과 동일해야 함 — 테스트가 강제)과 label·swatch를 등록.
3. `npx vitest run shared/styles` — 새 프리셋까지 자동 순회되는 대비·ΔE·키 동등성 전부 그린이어야 출시 가능.

### 색 램프 (primitive)

| 램프 | 용도 |
|---|---|
| `brand` 50–900 | 브랜드 애저 (오로라 리스타일에서 채도 증폭 — 구 500 대비 ΔE 7.8) |
| `auroraTeal` 50–900 | 오로라 teal — 성장·복리 **크롬** (데이터 상승색 아님) |
| `auroraViolet` 50–900 | 오로라 violet — 목표·하이라이트 **크롬** |
| `neutral` 0–950 | ice-white / polar-night — 파랑 틴트 쿨 슬레이트 |
| `up` / `down` | 데이터 상승/하락 (**불변** — 오로라와 분리) |
| `positive` / `warning` / `danger` | 상태 (**불변**) |

### 시맨틱 토큰

> 아래 표의 hex는 **aurora 프리셋** 값이다(역할 설명용 예시). 다른 프리셋의 값은 `presets.ts`가
> 진실 공급원이고, 역할(토큰 이름)과 용도 열은 전 프리셋 공통이다.

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `color.bg` | `#e4f0fc` | `#0a1220` | 페이지 배경 (아이스블루 틴트 / polar-night) |
| `color.surface` | `#ffffff` | `#131f33` | 카드 |
| `color.surfaceRaised` | `#ffffff` | `#1b2a44` | 떠 있는 것(모달) |
| `color.surfaceSunken` | `#e6eef7` | `#0e1727` | 한 단계 내려간 영역 |
| `color.border` | `#dbe6f0` | `#26354e` | 카드 윤곽(장식) |
| `color.borderStrong` | `#75859a` | `#5f7291` | **컨트롤 경계** (input/select) — 3:1 |
| `color.text` | `#131f33` | `#e8eef8` | 본문 |
| `color.textSecondary` | `#43556b` | `#a9b7cc` | 라벨 |
| `color.textMuted` | `#536679` | `#8fa0b8` | 캡션/힌트 |
| `color.brand` | `#0a6da3` | `#0c7cb3` | primary 채움(솔리드) |
| `color.brandText` | `#085a88` | `#79c5e6` | 브랜드 톤 텍스트 |
| `color.accent` | `#0d9488` | `#2dd4bf` | 오로라 teal 표시(비텍스트 크롬) |
| `color.accentText` | `#0b6b5d` | `#2dd4bf` | teal 텍스트 (4.5:1 검증) |
| `color.accentSubtle` / `accentBorder` | teal 틴트 | teal 틴트 | 배지/칩 서피스·경계 |
| `color.accentAlt` | `#6d5ae6` | `#818cf8` | 오로라 violet 표시 |
| `color.accentAltText` | `#4f46cf` | `#a7b0fb` | violet 텍스트 (4.5:1 검증) |
| `color.accentAltSubtle` / `accentAltBorder` | violet 틴트 | violet 틴트 | 배지/칩 서피스·경계 |
| `color.gradientAurora` | glacier→teal→violet | (밝은 stop) | 표시용 리본 |
| `color.gradientCta` | 흰 라벨 4.5:1 stop | (동) | primary CTA 채움 |
| `color.bgGlow` | radial×2+bg | (동) | body 배경 전용 |
| `color.surfaceGlass` / `surfaceGlassFallback` | `rgba(255,255,255,0.78)` / `#ffffff` | `rgba(27,42,68,0.85)` / `#1b2a44` | 서리유리 (다크 알파 0.85 미만 금지) |
| `color.progressTrack` | `#e6eef7` | `#0e1727` | 진행률 트랙 |
| `color.dataPositive` | `#d92d20` | `#f4776a` | **상승** (불변) |
| `color.dataNegative` | `#1668c9` | `#71aaf0` | **하락** (불변) |

> 그라데이션 stop의 진실 공급원은 스칼라 토큰(`--sb-ribbon-stop-1~3`, `--sb-cta-stop-1~3`)이고,
> 그라데이션 문자열은 semantic.ts 안에서 그 스칼라로 조립된다. stop을 바꾸면 문자열도 따라온다.

> **다크에서 위계 만드는 법**: 그림자가 안 보이므로 **서피스가 밝아질수록 위로 뜬다**.
> `sunken < base < raised`. 라이트에서는 그림자(`elevation`)가 그 역할을 한다.

### 상승/하락은 왜 빨강/파랑인가 (의도적 결정)

한국 증권 관례를 따른다: **상승 = 적색, 하락 = 청색**. 서구권과 반대다.
사용자가 한국 배당 투자자이고 국내 증권사 앱이 전부 적색 상승이라, 여기서 뒤집으면 오독을 유발한다.

**이 램프는 숫자(데이터)에만 쓴다.** 버튼·에러 같은 크롬에는 절대 쓰지 않는다.
그래서 `danger`(파괴적 액션/에러)와 적색이 겹쳐도 맥락이 충돌하지 않는다.

### 타이포

Pretendard를 npm으로 셀프호스팅한다(CDN 금지 — 프라이버시·렌더블로킹·오프라인 실패).
동적 서브셋이라 브라우저는 **실제로 그리는 글자의 조각만** 내려받는다.

| 단계 | px | 쓰는 곳 |
|---|---|---|
| `2xs` | 11 | 칩, 마이크로 라벨 |
| `xs` | 12 | 캡션, 지표 라벨, 표 |
| `sm` | 13 | 버튼, 탭, 보조 본문 |
| `base` | 14 | **본문 기본** |
| `lg` | 16 | 지표 값(default) |
| `xl` | 18 | 카드 제목 |
| `2xl` | 20 | 모달 제목 |
| `3xl`–`5xl` | 24–38 | hero 지표 |
| `6xl` | 44 | hero 지표 값의 clamp 상한 |

weight: `regular 400` / `medium 500` / `semibold 600` / `bold 700` / `extrabold 800`(hero 값 전용)

> **숫자에는 반드시 `${font.numeric}`** (tabular-nums). 표에서 자릿수가 안 맞으면 눈이 흐른다.

### 간격 · 라운드

4px 베이스라인. `space[1]`=4 … `space[4]`=16 … `space[12]`=48
라운드: `xs`4 / `sm`8 / `md`12 / `lg`16 / `pill`999 (칩·스위치는 항상 `pill`)

---

## 3. 프리미티브 (`@/components`)

| 컴포넌트 | variant / props | 언제 |
|---|---|---|
| `Button` | `primary` `secondary` `ghost` `danger` × `sm` `md`, `loading` `fullWidth` `iconOnly` | 앱의 **모든** 버튼 |
| `Toggle` | `onText`/`offText` 주면 모드 스위치 | 스위치 컨트롤만 |
| `ToggleField` | 라벨 줄 + `Toggle` + 도움말 | 설정 한 줄 |
| `Chip` | `selected` `onClick` `onRemove` | 티커/프리셋 조각 |
| `StatTile` | `emphasis: hero \| default`, `tone: neutral \| positive \| negative` | 지표 |
| `Card` | `title` `subtitle` `titleRight` `elevation 1\|2\|3` | 카드 |
| `Banner` | `info` `warning` `danger`, `onDismiss`, `role` | 공지/경고/에러 |
| `Tabs` | `items` `activeId` `onChange` | 탭 |
| `Modal` | `title` `actions` `onBackdropClick` | 모달 |

### 지켜야 할 것

- **`primary` 버튼은 화면당 하나.** 둘이면 사용자는 뭘 눌러야 할지 모른다.
- **`hero` StatTile도 화면당 하나.** 둘을 hero로 만들면 0개가 된다.
- 위계는 **크기·무게·서피스**로 만든다. **색으로 만들지 마라** — 색은 방향성(상승/하락)에 남겨둔다.
- `tone`은 **부호가 있는 값**에만. 그냥 큰 숫자에 색을 칠하면 의미가 죽는다.

---

## 4. 접근성 (자동 검증됨)

`shared/styles/contrast.test.ts`가 토큰을 바꿀 때마다 **숫자로** 강제한다:

- 본문 텍스트 **4.5:1** (WCAG 1.4.3 AA) — 모든 텍스트 × 모든 서피스 조합
- 비텍스트(컨트롤 경계, 포커스 링, 액센트, 리본 stop) **3:1** (WCAG 1.4.11)
- CTA 리본: 모든 stop × **on-brand 라벨** **4.5:1** — 그라데이션의 가장 밝은 구간까지 (라벨 색은 프리셋 소관 — 흰색 가정 금지)
- 서리유리: 최악 배경 4건을 `compositeOver`로 알파 합성해 실제 화면 대비로 검증
  (다크 글래스 알파를 0.85 밑으로 내리면 여기서 탈락한다)
- 차트 시리즈: 라이트·다크 **양쪽에서** 3:1 + 시리즈끼리 **ΔE ≥ 20**

> 그라데이션/글로우/글래스 **문자열 토큰**은 `contrastRatio()`에 넣으면 throw 된다.
> 검증 쌍에는 스칼라 stop 토큰만 넣는다.

> 대비비는 **휘도만** 본다. 보라와 올리브는 밝기가 같아 대비 1.0이 나오지만 명백히 다른 색이다.
> 그래서 시리즈 구분은 대비비가 아니라 **ΔE(지각적 거리)** 로 잰다.

그 외:
- 터치 타겟 44×44 — 시각 크기는 유지하고 `::before`로 히트 영역만 넓힌다(밀도 유지).
- 포커스 링은 전역(`globalStyles`)에서 처리한다. 컴포넌트에서 `outline: none` 하지 마라.
- `prefers-reduced-motion` 존중 — 전역에서 transition/animation을 끈다.
- 스위치는 **보이는 방식**이지 시맨틱이 아니다. `role="switch"`로 바꾸지 마라 (네이티브 checkbox 유지).

---

## 5. 차트

시리즈 8색은 프리셋별 시맨틱 토큰(`--sb-chart-series-0..7`)이다. 색 공급원 규칙:

- **캔버스(ECharts 옵션)**: `getChartTheme().series` — 옵션 빌드 시점에 실제 hex로 해석.
  jsdom/SSR 폴백은 기본 프리셋(velog) 라이트 값이라 테스트가 결정적이다.
- **DOM(범례 점 등)**: `CHART_SERIES_VARS` (`var(--sb-chart-series-N)`) — 프리셋 전환 자동 추종.
- `CHART_SERIES` 상수는 aurora 고정 hex — **deprecated**, 프리셋을 따라가지 않는다.

⚠ 캔버스는 CSS 변수를 다시 읽지 않는다 — 프리셋 전환 시 차트 옵션 `useMemo` 의존성에
`palettePresetAtom` 값이 들어 있어야 한다(useMainComputed / ChartPanel / MonthlyCashflow 참고).
축선·눈금은 껐다 — 격자선만 남긴다(데이터 잉크 비율).

새 시리즈 색이 필요하면 각 프리셋의 `chart-series-*`에 추가하고 `contrast.test.ts`를 돌려라.
실패하면 그 색은 못 쓴다(각 프리셋의 라이트·다크 surface 양쪽 3:1 + 세트 내 ΔE ≥ 20).
