# DESIGN.md — snowball-income

> AI 에이전트와 사람이 **같은 화면을 그리게 하는** 디자인 정본.
> 새 UI를 만들거나 고칠 때 이 문서를 먼저 읽는다. 코드와 어긋나면 **코드가 아니라 이 문서를 고쳐라** —
> 단, 어긋난 이유를 적는다. 근거 없는 규칙은 다음 사람이 지키지 않는다.
>
> 작성 2026-07-30. 형식은 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 9섹션.
> 폴리시 원칙은 `.agents/skills/make-interfaces-feel-better` · `.agents/skills/emil-design-eng` ·
> `.agents/skills/apple-design` 에서 채택했다(채택·이탈 내역은 §10).

---

## 1. Visual Theme & Atmosphere

**무엇인가** — 배당 재투자 시뮬레이터. 사용자가 포트폴리오와 조건을 넣으면 장기 배당 현금흐름과
목표 달성 시점을 계산해 보여주는 프론트엔드 전용 웹앱이다. 백엔드 없이 브라우저에서 계산한다.

**누가 쓰는가** — 대부분 **투자를 처음 해보는 한국인**이다. 배당이 뭔지 모른 채 들어온다.
전문 트레이딩 터미널이 아니라 **처음 온 사람이 겁먹지 않는 화면**이어야 한다.

### 이 제품의 중심 긴장

> **귀여움은 재방문을 만들지만, 돈을 다루는 화면에서 과하면 "장난감"으로 읽힌다.**

사람들은 기능이 필요해서만 서비스를 다시 찾지 않는다. 한 번 더 보고 싶어서 온다. 그래서 성격이 필요하다.
동시에 여기서 사용자는 자산 계획을 세운다. 숫자 옆에서 캐릭터가 움직이면 신뢰가 깎인다.

**해법 — 숫자는 진지하게, 여백은 다정하게.**

| | 성격을 **넣는 곳** | 성격을 **빼는 곳** |
|---|---|---|
| 어디 | 빈 상태 · 목표 달성 · 로딩 · 배지 · 캘린더 여백 · 온보딩 · 에러 카피 | 숫자 · 표 · 입력 폼 · 결과 카드 · 금액 |
| 왜 | 기능이 없는 자리 = 성격이 들어갈 자리 | 판단하는 자리 = 방해하면 안 되는 자리 |

귀여움은 **장식이 아니라 빈 곳을 채우는 재료**다. 이 원칙을 어기는 가장 흔한 실수는
"결과 카드를 더 재밌게 만들자"다. 결과 카드는 사용자가 **판단하는** 지면이다. 건드리지 마라.

### 분위기

차갑고 선명한 파랑(글레이셔 애저)을 축으로, 성장·복리는 틸/그린으로 말한다.
면은 넓고 조용하고, 강조는 적고 분명하다. 그라디언트는 **면 배경**에만 쓰고 글자·버튼에는 쓰지 않는다.

---

## 2. Color Palette & Roles

### 2계층 원칙 (절대)

```
primitives.ts (원시 램프)  →  semantic.ts (역할)  →  화면
   palette.brand[600]           color.brandSolid        var(--sb-brand)
```

**화면·컴포넌트는 `semantic` 계층만 쓴다.** `palette.*` 를 컴포넌트에서 직접 쓰면 프리셋 전환이
따라오지 않고, 대비 검증 테스트(`shared/styles/contrast.test.ts`)의 보호 밖으로 나간다.

색은 `var(--sb-*)` **문자열**이다. Emotion `ThemeProvider` 를 쓰지 않는다 — 공용 컴포넌트 테스트가
Provider 없이 단독 렌더되기 때문이다. CSS 변수는 Provider가 필요 없고 다크 전환도 리렌더 없이 된다.

> ⚠ 캔버스(ECharts)는 `var()` 를 못 읽는다 → `getChartTheme().series`(`chartTheme.ts`)를 쓴다.

### 팔레트 프리셋

8종 × light/dark = 16세트. 기본값 **`velog`**.

`velog` · `forest` · `aurora` · `vivid` · `navy-gold` · `grape` · `sunset` · `ink`

역할 이름은 프리셋이 바뀌어도 그대로다. **컴포넌트는 hex를 모른다.**

### 역할 (요약 — 전체는 `semantic.ts`)

| 그룹 | 역할 | 쓰임 |
|---|---|---|
| 면 | `bg` `surface` `surfaceRaised` `surfaceMuted` `surfaceSunken` `surfaceHover` | 배경 사다리 |
| 선 | `border` `borderStrong` | 구조·상태 |
| 글자 | `text` `textSecondary` `textMuted` `textInverse` | 위계 |
| 브랜드 | `brand` `brandHover` `brandSubtle` `brandBorder` `brandText` `onBrand` | 주 액션·아이덴티티 |
| 액센트 | `accent`(틸=성장·복리·달성) `accentAlt`(그린=목표·추천·프로모) | **크롬 전용** |
| 데이터 | `dataPositive` `dataNegative` (+`*Surface`) | **숫자 전용** |
| 상태 | `success` `warning` `danger` (+`*Surface`) | 시스템 피드백 |
| 시그니처 | `gradientAurora`(리본·장식) `gradientCta`(버튼 채움) `gradientHero`/`gradientHeroSoft`(면 배경) | 교차 사용 금지 |

### 색 규칙 — 어기면 오독이 생긴다

1. **상승=적색, 하락=청색.** 한국 증권 관례다. 서구권(상승=녹색)과 반대이며 **의도된 결정**이다.
   국내 증권사 앱이 전부 적색 상승이고, 숫자 옆 색은 학습된 반사신경이라 여기서 뒤집으면 오독을 부른다.
2. **액센트(틸·그린)를 숫자에 쓰지 마라.** 크롬(장식·배지·리본) 전용이다. 숫자는 `dataPositive`/`dataNegative` 만.
3. **`danger` 와 상승 적색은 겹쳐도 된다.** 하나는 크롬, 하나는 데이터라 맥락이 충돌하지 않는다.
   대신 **크롬에 up/down 램프를 쓰지 마라** — 그 순간 충돌한다.
4. **그라디언트 3계열은 교차 사용 금지.** `gradientCta`(버튼) · `gradientAurora`(리본) ·
   `gradientHero*`(면 배경). 섞으면 위계가 무너진다.
5. **대비 하한은 테스트가 강제한다.** 새 색을 넣으면 `contrast.test.ts` 를 돌린다.
   비텍스트 3:1(WCAG 1.4.11), 작은 글씨 4.5:1.

---

## 3. Typography Rules

### 서체 = 역할 4종 (전부 셀프호스팅, CDN 금지)

| 역할 | 서체 | 어디에 |
|---|---|---|
| `sans` | Wanted Sans | 본문·라벨·힌트·버튼·입력 **(기본값)** |
| `display` | Snowball Display (원본 Gmarket Sans) | 워드마크, 헤딩 h1~h6 |
| `heroNumeric` | LINE Seed Sans KR | **화면당 딱 한 곳** — hero StatTile 값 |
| `dataNumeric` | Snowball Numeric (원본 Inter+tabular) | 그 외 모든 숫자 |

> ⚠ 컴포넌트에서 `font-family` 문자열을 직접 쓰지 마라. 반드시 `font.*` 토큰을 거친다.

### 위계는 굵기가 아니라 크기로 만든다

`display` 는 **Bold 한 벌만** 싣는다. 600/700/800 중 무엇을 적어도 같은 굵기로 그려진다.
이건 버그가 아니라 수용된 상태다 — 굵기 범위를 넓히려면 헤딩 일부를 `sans` 로 내려야 하고,
그러면 같은 화면의 헤딩끼리 서체가 갈려 더 나쁘다.

### 스케일

크기 `2xs 11 / xs 12 / sm 13 / base 14 / md 15 / lg 16 / xl 18 / 2xl 20 / 3xl 24 / 4xl 30 / 5xl 38 / 6xl 44`
굵기 `regular 400 / medium 500 / semibold 600 / bold 700 / extrabold 800`
행간 `tight 1.25 / snug 1.4 / normal 1.5 / relaxed 1.6`

본문 14px 은 **의도**다. 금융 대시보드는 정보 밀도가 높아 본문을 키우면 화면이 터진다.
위계는 지표 값 쪽 큰 단계(4xl~6xl)로 만든다.

### 숫자

- **런타임에 바뀌는 숫자는 전부 `font.numeric`**(`tabular-nums`). 안 그러면 값이 바뀔 때마다 폭이 흔들린다.
- `heroNumeric` 은 **화면당 1곳**. 두 곳에 쓰면 위계가 죽는다.

### 줄바꿈 (2026-07-30 채택)

- 헤딩 → `text-wrap: balance`
- 본문·설명 → `text-wrap: pretty` (외톨이 낱말 방지)

> ⚠ 한국어 주의: CJK 는 어절 단위로 끊기므로 `balance` 의 체감이 영문보다 작다.
> 짧은 헤딩(1줄)에는 효과가 없고, **2~3줄 헤딩에서만** 의미가 있다. 남발하지 말 것.

---

## 4. Component Stylings

### 파일 규약 (`.cursor/rules` — 요청보다 우선)

- **모든 폴더에 `index.ts` 필수.** 외부에서는 **폴더 경로로만** import.
  ✅ `import { Card } from '@/components/common'`  ❌ `from '@/components/common/Card/Card'`
- 폴더명 = 파일 prefix(PascalCase). 재사용 컴포넌트는
  `X.tsx` / `X.styled.ts` / `X.types.ts` / `X.utils.ts` / `X.test.ts` 세트.
- 스타일은 Emotion `styled`(`*.styled.ts`). **두 번째 스타일 시스템 도입 금지**(Tailwind 등).
- 시맨틱 HTML. 거대 atom 금지. 과도한 추상화 금지.
- `{Name}.view.tsx` 가 길어지면 하위 `components/` 폴더로 분리해 같은 세트 패턴으로 만들고
  `index.ts` 배럴로 내보내 `<X />` 로 조립한다.

### 주요 컴포넌트

| 컴포넌트 | 규칙 |
|---|---|
| `Card` | 톤 `default` / `sunken` / `wash`(파스텔 면). 카드 안에 카드 금지 |
| `Button` | 변형 `primary`(gradientCta) / `secondary` / `ghost` / `danger`. 크기 `sm`/`md`/`lg` |
| `InputField` | 라벨은 **입력 위**. 비활성이면 사유를 hint 로 말한다(무음 비활성 금지) |
| `DataTable` | 820px 아래 카드형 전환. 숫자 열은 우측 정렬 + `font.numeric` |
| `StatTile` | `hero` 변형은 화면당 1개 |
| `Banner` | 톤 `info`/`warning`/`danger`. 해결책 없는 불안 문구 금지 |

### 아이콘

`lucide-react`. 크기 계단 `xs 12 / sm 14 / md 16 / lg 18 / xl 20 / xxl 24`, **획 굵기 1.8 고정**.

- 굵기는 크기와 무관하게 고정한다 — 크기별로 바꾸면 같은 아이콘이 자리마다 달라 보인다.
- 아이콘은 `currentColor` 로 상태(hover/선택/비활성)를 받는다. 상태별 별도 에셋 금지.
- 외곽선이 기본, **채움은 활성 상태 표시 전용**.
- 한 면에 두 아이콘 세트를 섞지 마라.
- 예외를 둘 때는 그 자리에 이유를 적는다(현재 유일한 예외: `ThemePresetSwitcher` 선택 체크마크 2.4).

가드: `test/shared/iconConsistency.test.ts`

---

## 5. Layout Principles

- **4px 베이스라인 그리드.** 간격은 `space.*` 만 쓴다(0/4/8/12/16/20/24/28/32/40/48/64).
- 브레이크포인트 — `mobile 560 / mobileWide 640 / tabletSm 760 / tablet 820 / drawer 960 / layout 980`.
  `media.down(key)` · `media.up(key)` 로만 접근한다.
- **컨테이너 쿼리**는 5곳에서만 켜져 있다. 새로 켤 때는 아래를 반드시 확인한다:
  > ⚠ `container-type` 은 레이아웃 컨테인먼트를 함께 적용해 그 요소가 `position: fixed` 자손의
  > 컨테이닝 블록이 된다 — **fixed 오버레이(드로어·토스트)를 품는 요소에는 켜지 마라.**
- 층위(`zIndex`)는 숫자만으로 결정되지 않는다. `transform`·`filter`·`backdrop-filter`·`opacity<1`·
  `contain` 이 스태킹 컨텍스트를 만들어 자식 팝오버를 가둔다. **팝오버를 품는 요소에 함부로 얹지 마라.**

---

## 6. Depth & Elevation

### 그림자는 높이, 테두리는 구조

- 깊이를 흉내내려고 쓰는 테두리 → **여러 겹 투명 `box-shadow`** 로 바꾼다.
- 구조·상태를 말하는 테두리는 **남긴다**: 구분선, 레이아웃 분리, 선택/포커스 상태.
- 엘리베이션은 `shadow.e1..e3`(=`elevation`) 토큰만. 생 `box-shadow` 리터럴로 우회하지 마라.
- 라이트는 그림자가, 다크는 **면 밝기**가 실제 위계를 만든다.

### 동심원 반경 (2026-07-30 채택 — 이 레포에 없던 규칙)

> **바깥 반경 = 안쪽 반경 + 패딩**

중첩된 면의 반경이 어긋난 것이 "인터페이스가 어딘가 이상하다"의 가장 흔한 원인이다.
부모와 자식에 같은 반경을 주면 안쪽 모서리가 **찌그러져 보인다**.

스케일 `xs 4 / sm 8 / md 12 / lg 16 / xl 20 / pill 999`

```
카드(padding 8) 안에 버튼(radius sm=8)  →  카드 radius = 8 + 8 = 16 (lg)
패널(padding 12) 안에 입력(radius sm=8) →  패널 radius = 8 + 12 = 20 (xl)
```

계산 결과가 스케일에 없으면 **스케일에 단계를 추가할 후보**다 — 임의 값을 박지 마라.

---

## 7. Design Do's and Don'ts

### Do

- 상태를 **말한다**. 로딩·빈 상태·실패·부분 실패 8종을 뷰 모델에 명시한다. 빈 화면으로 넘어가는 경로를 만들지 마라.
- 비활성 컨트롤은 **사유를 함께** 준다(무음 비활성 금지).
- 실패는 **되돌릴 길**을 함께 준다. 재시도 수단 없는 실패 배너는 사용자를 가둔다.
- 무언가를 덮어썼으면 화면이 **그 사실을 말한다**.
- 잘 되고 있을 때는 **아무 것도 그리지 않는다**. "동기화됨" 같은 말은 자리를 차지할 가치가 없다.
- 모션에는 **정적 단서를 함께** 준다(색·아이콘·라벨). 모션이 유일한 피드백 채널이면 안 된다.

### Don't

- ❌ **"눈덩이 / 스노우볼" 비유 전면 금지.** 앱 이름과 콘텐츠를 연관 짓지 마라(브랜드명 suffix는 예외).
  마스코트·일러스트·카피 어디에도 눈덩이 모티프를 쓰지 않는다.
- ❌ 해시 라우팅(`HashRouter`, `#` 상태 전달) 도입 금지. 경로 기반 라우팅을 유지한다.
- ❌ 페이지마다 다른 헤더. 전 페이지 같은 `Header` 를 쓰고, 차이는 조건부 추가로만 만든다.
- ❌ `transition: all` — 항상 속성을 명시한다. (현재 위반 **0건**, 지켜라)
- ❌ 고빈도 상호작용에 커스텀 애니메이션 — 주의 비용이 매번 반복된다.
- ❌ 숫자를 읽는 걸 지연시키는 모션.
- ❌ className/Emotion 내부 구현에 기댄 테스트. 테스트는 **사용자 행동** 기반.
- ❌ 저장 데이터·공유 URL 스키마를 왕복 테스트 없이 바꾸기. 사용자 자산이다.

---

## 8. Responsive Behavior

- 모바일 우선은 아니지만 **모바일에서 깨지지 않는 것이 하한**이다.
- 터치 타겟 최소 **44×44**(`TOUCH_TARGET`, WCAG 2.5.5 / iOS HIG).
  밀집한 데스크톱 UI라면 최소 40×40. 보이는 요소가 작으면 의사요소로 넓힌다.
  **두 요소의 히트 영역이 겹치게 두지 마라.**
- 960px 아래에서 설정은 드로어로 간다.
- 820px 아래에서 표는 카드형으로 전환한다.
- 넓은 콘텐츠(표·차트·코드)는 **자기 안에서** 가로 스크롤한다. 본문이 가로로 밀리면 안 된다.

---

## 9. Agent Prompt Guide

새 화면·컴포넌트를 만들 때 이 문장들을 그대로 쓴다.

```
DESIGN.md 를 따른다. 색은 semantic 토큰(color.*)만, 간격은 space.*, 반경은 radius.*,
그림자는 shadow.e1..e3 만 쓴다. 하드코딩 hex·px 금지.
```
```
중첩 면의 반경은 동심원 규칙(바깥 = 안쪽 + 패딩)을 지킨다.
스케일에 없는 값이 나오면 임의 값을 쓰지 말고 보고한다.
```
```
런타임에 바뀌는 숫자에는 font.numeric 을 적용한다.
헤딩에는 text-wrap: balance, 본문에는 text-wrap: pretty.
```
```
상태를 전부 명시한다: 로딩 / 빈 상태 / 정상 / 부분 실패 / 실패 / 실행취소.
비활성에는 사유를, 실패에는 재시도 수단을 함께 준다.
```
```
"눈덩이·스노우볼" 비유를 쓰지 않는다. 숫자·표·입력·결과 카드에는 성격을 넣지 않는다.
성격은 빈 상태·달성·로딩·배지·온보딩에만.
```

---

## 10. 폴리시 원칙 — 채택과 이탈

`.agents/skills/make-interfaces-feel-better` 의 19개 원칙 대비 이 레포의 상태다.
**이탈에는 반드시 이유가 있다** — 이유 없이 다시 "고치지" 마라.

| # | 원칙 | 상태 |
|---|---|---|
| 1 | 동심원 반경 | 🆕 **채택** (§6) — 규칙 자체가 없었다 |
| 2 | 광학 정렬 우선 | ⚠ **반복 결함 영역** — 한글 라인박스 중심 어긋남. 공용 유틸로 보정한다 |
| 3 | 그림자=높이 / 테두리=구조 | ✅ 토큰 존재 |
| 4 | 중단 가능한 애니메이션 | ✅ CSS 전환 위주 |
| 5 | 진입 애니메이션 분할·스태거 | 🆕 채택 — 드문 등장에만, ~100ms 간격 |
| 6 | 부드러운 퇴장 | 🆕 채택 — 높이 대신 작은 고정 `translateY`, 진입보다 약하게 |
| 7 | 맥락 있는 아이콘 전환 | 🆕 채택 — `scale .25→1`, `opacity 0→1`, `blur 4px→0`, `cubic-bezier(0.2,0,0,1)` |
| 8 | 폰트 스무딩 | ✅ 적용됨 |
| 9 | tabular-nums | ✅ 86곳 |
| 10 | text-wrap | 🆕 **채택** — 종전 0건 |
| 11 | 이미지 아웃라인 | 🆕 채택 — 순수 흑/백 10%. **틴트 금지**(면 색을 받아 때처럼 보인다) |
| 12 | 누를 때 `scale(0.96)` | 🆕 채택 — 종전 7곳뿐 |
| 13 | 첫 렌더 애니메이션 생략 | — 모션 라이브러리 없음(해당 없음) |
| 14 | `transition: all` 금지 | ✅ **위반 0건** |
| 15 | `will-change` 절제 | ✅ 2곳 |
| 16 | 최소 히트 영역 | ✅ 토큰 존재 · 적용 감사 필요 |
| 17 | 아이콘 획 = 글자 굵기 | 🔸 **의도적 이탈** — 원칙은 400 옆 1.5 / 600 옆 2 를 말하지만 이 레포는 **1.8 고정**이다. 한 줄에 굵기가 다른 아이콘이 섞이면 정돈돼 보이지 않고, 2 는 14~16px 에서 획이 뭉친다. 되돌리지 마라 |
| 18 | 하나의 SVG, 상태는 CSS | ✅ lucide + `currentColor` |
| 19 | 모션 절제 | ✅ 전역 `prefers-reduced-motion` 처리 |

### 모션 토큰

`fast 150ms` / `base 200ms` / `slow 450ms`(오케스트레이션 전용) / `ease cubic-bezier(0.2, 0, 0, 1)`

모션 라이브러리는 **없다**. 스프링이 필요하면 먼저 CSS로 되는지 본다 — 의존성 추가는 별도 판단 사항이다.

---

## 참고

- 토큰 — [`shared/styles/`](shared/styles/) (`primitives` → `semantic` → `tokens` 파사드)
- 대비 검증 — [`shared/styles/contrast.test.ts`](shared/styles/contrast.test.ts)
- 폴더·파일 규약 — [`.cursor/rules`](.cursor/rules) (**요청보다 우선**)
- 개발 프로세스 — [`.claude/skills/dev-process`](.claude/skills/dev-process/SKILL.md)
- 실물 확인 — `npm run uiprobe -- --url <u> --shot <path>` (실제 렌더를 찍는다. 코드만 보고 판단하지 마라)
