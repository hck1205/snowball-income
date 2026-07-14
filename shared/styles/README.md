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

## 1. 브랜드

**글레이셔 애저(glacier azure, hue ~200).**

눈덩이(스노우볼) 메타포와 금융의 신뢰감이 만나는 지점으로 골랐다.
순수 네이비는 은행 UI에서 너무 흔하고, 더 청록으로 가면 헬스케어처럼 읽힌다.

브랜드 컬러는 **절제해서** 쓴다. 이 앱의 주인공은 데이터다.
브랜드를 진하게 쓰는 곳은 사실상 세 군데뿐이다: primary 버튼, hero 지표의 액센트 바, 로고 타일.

로고 마크(`components/BrandMark`)는 같은 중심에서 커지는 원 세 개 = 복리(누적)의 시각화다.

---

## 2. 토큰 구조 (2계층)

```
primitives.ts   원시 램프/스케일 — 의미 없음. 화면에서 직접 쓰지 마라.
      ↓
semantic.ts     역할 부여 (surface / text / brand / data …). 화면은 이것만 쓴다.
      ↓
tokens.ts       파사드. `@/shared/styles`가 여기서 전부 re-export 한다.
```

색은 전부 `var(--sb-*)` 문자열이다. Emotion `ThemeProvider`를 쓰지 않는다
(공용 컴포넌트 테스트가 Provider 없이 단독 렌더되기 때문). CSS 변수라서 다크 전환에 리렌더가 없다.

`LIGHT_THEME` / `DARK_THEME`(semantic.ts)이 **유일한 진실 공급원**이다.
globalStyles가 이걸로 CSS 변수를 찍고, 대비 검증 테스트도 같은 값을 읽는다.

### 색 램프 (primitive)

| 램프 | 용도 |
|---|---|
| `brand` 50–900 | 브랜드 애저 |
| `neutral` 0–950 | 쿨 슬레이트(파랑 살짝) — 순수 회색은 브랜드 옆에서 누렇게 보인다 |
| `up` / `down` | 데이터 상승/하락 |
| `positive` / `warning` / `danger` | 상태 |

### 시맨틱 토큰

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `color.bg` | `#f4f7f9` | `#0f151c` | 페이지 배경 |
| `color.surface` | `#ffffff` | `#161d26` | 카드 |
| `color.surfaceRaised` | `#ffffff` | `#1e262f` | 떠 있는 것(모달) |
| `color.surfaceSunken` | `#eaeff4` | `#121922` | 한 단계 내려간 영역 |
| `color.border` | `#e2e8ee` | `#2a3542` | 카드 윤곽(장식) |
| `color.borderStrong` | `#828f9c` | `#5c6a7a` | **컨트롤 경계** (input/select) — 3:1 |
| `color.text` | `#161d26` | `#e6edf3` | 본문 |
| `color.textSecondary` | `#4a5663` | `#a7b4c2` | 라벨 |
| `color.textMuted` | `#5f6b78` | `#8b98a6` | 캡션/힌트 |
| `color.brand` | `#136d97` | `#1f7ba5` | primary 채움 |
| `color.brandText` | `#0f587a` | `#88c2de` | 브랜드 톤 텍스트 |
| `color.dataPositive` | `#d92d20` | `#f4776a` | **상승** |
| `color.dataNegative` | `#1668c9` | `#71aaf0` | **하락** |

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

weight: `regular 400` / `medium 500` / `semibold 600` / `bold 700`

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
- 비텍스트(컨트롤 경계, 포커스 링) **3:1** (WCAG 1.4.11)
- 차트 시리즈: 라이트·다크 **양쪽에서** 3:1 + 시리즈끼리 **ΔE ≥ 20**

> 대비비는 **휘도만** 본다. 보라와 올리브는 밝기가 같아 대비 1.0이 나오지만 명백히 다른 색이다.
> 그래서 시리즈 구분은 대비비가 아니라 **ΔE(지각적 거리)** 로 잰다.

그 외:
- 터치 타겟 44×44 — 시각 크기는 유지하고 `::before`로 히트 영역만 넓힌다(밀도 유지).
- 포커스 링은 전역(`globalStyles`)에서 처리한다. 컴포넌트에서 `outline: none` 하지 마라.
- `prefers-reduced-motion` 존중 — 전역에서 transition/animation을 끈다.
- 스위치는 **보이는 방식**이지 시맨틱이 아니다. `role="switch"`로 바꾸지 마라 (네이티브 checkbox 유지).

---

## 5. 차트

`CHART_SERIES` 8색 + `getChartTheme()` / `buildAxisStyle()` / `buildTooltipStyle()`.

캔버스는 `var()`를 못 읽으므로 `getChartTheme()`이 런타임에 실제 값으로 해석한다.
축선·눈금은 껐다 — 격자선만 남긴다(데이터 잉크 비율).

새 시리즈 색이 필요하면 `CHART_SERIES`에 추가하고 `contrast.test.ts`를 돌려라. 실패하면 그 색은 못 쓴다.
