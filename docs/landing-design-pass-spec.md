# 랜딩(`/`) 디자인 패스 스펙 — 2026-08-01

> **구현 지시서**다. `ui-ux-designer` 가 스킬 원문 + 실측(스크린샷·tintscan·uiprobe)으로 작성했고,
> 집행은 `frontend-engineer` 가 한다. 대상 = `pages/Landing/**` 8섹션.
>
> 🔴 이 문서는 **확정 결정을 하나도 뒤집지 않는다.** 뒤집는 제안은 §D 에 "기각"으로만 적혀 있다.
> 근거 스킬: `.claude/skills/impeccable/reference/{craft-floor,bolder,colorize,operate,delight,layout}.md`

---

## A. before 실측표

측정 환경: dev `http://localhost:5173`, 헤드리스 크롬, `tools/dev/uiprobe.mjs` · `tintscan.mjs` ·
`overflowprobe` · `headerprobe`. 2026-08-01.

### A-1 페이지 전역

| 항목 | 1280px | 390px |
|---|---|---|
| 문서 높이 | 3,750px | 5,036px |
| 본문 컨테이너 폭 | 1,040px | 358px |
| 섹션 간 간격(`LandingStack` gap) | 51.2px | 32px |
| 섹션 머리↔내용 간격(`SectionRoot` gap) | 20px | 12px |
| `h1` / `h2` | 30px(800, -0.9em·tracking) / 18px | — |
| 카드 tier 분포 | `base` ×(3+1+8+8) · `sunken` ×1 · `raised` **0** | 동일 |

섹션별 높이 @1280 — S1 히어로 · S2 지수 124 · S3 개념 250 · S4 복리 317 · S5 리듬 412 ·
**S6 프리셋 922** · S7 준비 275 · S8 FAQ 522 · 푸터 134.

### A-2 게이트 기준선

| 게이트 | 결과 |
|---|---|
| `npm run overflowprobe` | ✅ 전부 통과 — `/` @390·@360 새는 요소 0 (요소 809개 검사, 의도적 스크롤 1개) |
| `npm run headerprobe` | ✅ 전부 통과 — `/` @1280 h=65px, @390 h=111px |
| `npm run tintscan` | ❌ **`/ (랜딩)` @1280 = 3면(상한 2)**. @390 = 2면(통과) |

### A-3 tintscan 실패의 정확한 원인 (실측으로 특정)

@1280 에서 잡힌 3면:

| # | 요소 | 크기 | 배경 | 정체 |
|---|---|---|---|---|
| 1 | `header` | 1040×140 | `linear-gradient(135deg, rgb(222,236,246)…)` | `PageHero` — 확정된 면 |
| 2 | **`span`** | **187×8** | **`rgb(12,166,120)`** | **`AllocationSegment` — 「안정적 배당성장」의 `SCHD 40%` 조각** |
| 3 | `div` | 1040×219 | `linear-gradient(135deg, rgb(237,245,250)…)` | `ChecklistCard` — 확정된 면 |

`--eval` 로 `rgb(12,166,120)` 을 전수 조회해 조상 텍스트가
`"안정적 배당성장…구성 비중 — SCHD 40% · DGRO 25%…"` 임을 확인했다.

**왜 지금 터졌나 — 오늘 들어온 회귀다.**
`pitfalls.md:205` 는 같은 날 "`/` 는 1280·390 둘 다 2면"이라고 실측으로 적었다. 그 뒤
`decisions.md:214`(프리셋 격자 **3열 → 2열**)가 랜딩했다. 산수가 그대로 맞는다:

```
3열: 카드 (1040 − 2×20)/3 = 333 → 콘텐츠 293 → 40% 조각 117px   (<180, 면 아님)
2열: 카드 (1040 − 1×20)/2 = 510 → 콘텐츠 470 → 40% 조각 188px   (≥180, 면 됨) ← 실측 187px
```

즉 **열 수 결정(그 자체로는 옳다)이 장식 막대를 틴트 면 하한 위로 밀어 올렸다.**
`decisions.md:211` 이 "프리셋 비중 막대 8px 라 면 하한(180px)에 걸리지 않는다"고 단언한 것은
3열 시절의 사실이고, 2열 이후 **거짓이 됐다**(하한은 폭 ≥180 **그리고** 높이 ≥8 이고, 막대는
높이가 정확히 8px 라 폭만 넘으면 걸린다).

### A-4 스크린샷에서 읽은 사실 (형용사 없이 수치만)

| 섹션 | 실측 사실 |
|---|---|
| **S3 개념** | 카드 3장 top=607·height=194 로 동일. 그런데 `h3` top = **646 / 641 / 636**(10px 어긋남), `p` top = **688 / 678 / 668**(20px 어긋남), `p` bottom 은 셋 다 772. → 내용이 **아래에 붙어 있다**. 원인: `ConceptItem` 이 2행 그리드인데 `align-content: normal`(=stretch) 이라 남는 높이가 행 사이로 배분된다. |
| **S3 순서 배지** | 배지 24px, 글자 `①②③`(유니코드 원문자) 12px `font.dataNumeric`. 2.2배 확대 캡처에서 확인 — 실제 크기에서는 **동그라미 안 동그라미**가 되어 숫자가 읽히지 않는다. |
| **S3 화살표** | `::before content:'→'`, 13px, `rgb(95,105,117)`(=`textMuted`), 폭 20px 갭 안. |
| **S4 복리** | 섹션 폭 1040, 본문·`FactorCard` 폭 **600**. → **440px(42%)가 빈 칸**. 섹션 안 시각 요소 0. |
| **S5 리듬** | 12칸 트랙 시작 x: SCHD **272** · VIG **272** · O **305**. 칸 폭 69/69/**66**. 3월 칸 x = 414/414/**441**(27px 어긋남). → **세로로 같은 달을 비교할 수 없다.** 원인: `RhythmRow` 가 flex 이고 `RhythmSummary` 가 `flex:0 0 auto; white-space:nowrap` 이라 "연 4회 지급"과 "매월 지급(연 12회)"의 폭 차이가 트랙 시작점을 민다. @390 은 라벨이 윗줄로 올라가 **정렬이 맞다 — 데스크톱 전용 결함**이다. |
| **S5 범례** | 칠해진 칸이 무엇인지 말하는 문장이 화면에 없다(각주는 "지급 월은 과거 지급 이력에서 확인한 값"만 말한다). 행 `aria-label` 은 있으므로 **스크린리더에는 있고 눈으로는 없다.** |
| **S6 프리셋** | 8장(초기 노출) × 비중 막대 1개 × 조각 4~6개 = **채도 높은 색 조각 40여 개**. `buildAllocationSegments` 가 `CHART_SERIES_VARS[index % n]` 로 **자리 순서**에 색을 준다 → 같은 SCHD 가 「안정적 배당성장」에선 초록(1번), 「방어형 배당 ETF」에선 파랑(3번). |
| **S6 중복** | 막대(`aria-hidden`)와 바로 아래 `"구성 비중 — SCHD 40% · DGRO 25% …"` 가 **같은 사실을 두 번** 말한다. |
| **S7 준비** | `gradientHeroSoft` 면 1040×219. 2열(순서 `ol` / 확인 `ul`). 결함 없음. |
| **S8 FAQ** | `details` 8개, 마커 `+`/`−`. `pages/Ticker/TickerDetailPage/TickerDetailPage.styled.ts:775-788` 과 **같은 어휘** — 일관됨, 손대지 않는다. |

---

## B. 진단 목록 (심각도순)

### 🔴 D1 — 프리셋 비중 막대가 틴트 면 상한을 깬다 (게이트 실패)

- **① 증상(실측)**: §A-3. `/ (랜딩)` @1280 = 3면(상한 2), `npm run tintscan` exit 1.
- **② 위반 원칙**:
  - `colorize.md:42` — *"Let the strongest color own a deliberate region or role instead of scattering tiny accents."*
    이 페이지에서 **가장 채도 높은 색**이 히어로가 아니라 중반 섹션의 40여 개 조각에 흩어져 있다.
  - `colorize.md:51` — *"Decoration without a relationship to hierarchy, state, content, or the visual world is not a color strategy."*
    색이 **자리 순서**에서 나오므로(§A-4) 카드 사이에 아무 관계가 없다.
  - `craft-floor.md:36` — *"Sparklines, progress rings, and soft-shadowed rounded rectangles standing in for content."*
  - `colorize.md:47` — *"For data, use distinct lightness, chroma, shape, label, or pattern so color is not the only code."*
- **③ 위치**: `pages/Landing/components/PresetBrowser/PresetBrowser.styled.ts:174-195`(`AllocationBar`/`AllocationSegment`/`AllocationText`) · `PresetBrowser.tsx:97-109` · `PresetBrowser.utils.ts:15-24`

### 🔴 D2 — S3 카드 3장의 제목·본문이 서로 다른 높이에서 시작한다

- **① 증상(실측)**: `h3` top 646/641/636, `p` top 688/678/668, `p` bottom 셋 다 772(§A-4).
- **② 위반 원칙**:
  - `layout.md:63` — *"The squint test still reveals the primary, secondary, and major groups in order."*
    3열 비교에서 제목이 세 높이에 있으면 "세 개를 비교하라"는 구조가 무너진다.
  - `craft-floor.md:11` — *"Spacing: ... Read the computed values."* (의도가 아니라 계산값을 보라)
  - `layout.md:57` — *"Make optical corrections only after inspecting the rendered result."*
- **③ 위치**: `pages/Landing/components/ConceptLadder/ConceptLadder.styled.ts:29-56`(`ConceptItem`)

### 🔴 D3 — S5 12칸 트랙이 행마다 다른 x 에서 시작한다

- **① 증상(실측)**: 트랙 시작 272/272/**305**, 칸 폭 69/69/**66**, 3월 칸 27px 어긋남(§A-4). @1280·@1024 등 `>tabletSm` 전 폭에서 발생, @390 은 정상.
- **② 위반 원칙**:
  - `layout.md:23` — *"Adaptation: ... Does DOM and focus order still agree with the visual order?"* 의 형제 요구.
    이 표의 **유일한 존재 이유**가 "종목마다 지급 달이 다르다"를 세로로 비교시키는 것인데 열이 어긋나 있다.
  - `operate.md:36` — *"Consistent affordances across the surface."*
- **③ 위치**: `pages/Landing/components/PayoutRhythm/PayoutRhythm.styled.ts:37-77`(`RhythmRow`/`RhythmSummary`/`RhythmMonths`)

### 🟠 D4 — S4(복리)가 페이지의 42%를 비워 두고, 이 페이지에서 가장 평평하다

- **① 증상(실측)**: 섹션 폭 1040 / 내용 폭 600 → 440px 공백. 섹션 안 구조 요소 0(문단 2 + 부속 카드 1 + 링크 1).
  이웃 S5 는 12칸 격자를, S6 는 카드 8장을 갖는다.
- **② 위반 원칙**:
  - `bolder.md:11` — *"A flat section is typically one that quietly opts out of the system's own strongest moves."*
    **정확히 이 문장의 사례다.** 이 섹션이 설명하는 복리는 이 제품의 존재 이유인데, 표현 밀도가 이웃보다 낮다.
  - `layout.md:21` — *"Density: Does the amount of information per region fit use frequency, decision complexity, and visitor mode?"*
- **③ 위치**: `pages/Landing/components/CompoundExplainer/CompoundExplainer.styled.ts:14-19`(`ExplainerBody`)

### 🟠 D5 — S3 순서 배지가 유니코드 원문자다

- **① 증상(실측)**: `①` 12px 을 24px 배지 안에 넣어 **원 안의 원**이 된다. 2.2× 확대 캡처에서 숫자 미판독 확인.
- **② 위반 원칙**:
  - `craft-floor.md:39` — *"Unicode glyphs or emoji standing in for an icon system. Icons are drawn, from a real library or authored SVG, in one consistent stroke and weight."*
  - `craft-floor.md:12` — *"Type: ... obvious scale and weight steps."*
- **③ 위치**: `pages/Landing/copy/landingCopy.ts:96,102,108`(`order: '①'|'②'|'③'`)

### 🟡 D6 — S5 의 색 부호에 눈으로 읽는 범례가 없다

- **① 증상(실측)**: 화면에 "칠해진 칸 = 지급 달"을 말하는 문장 0. 행 `aria-label`(`monthsAria`)은 있음.
- **② 위반 원칙**:
  - `colorize.md:63` — *"Information conveyed by color also needs text, shape, iconography, or position."*
  - `craft-floor.md:15` — *"Copy: the product's own language."*
  - 이 레포의 확정 규칙 "색만으로 정보를 전달하지 않기"(`PayoutRhythm.styled.ts:8-10` 이 스스로 선언).
    굵기·글자색이 함께 바뀌긴 하지만 **그 규칙이 무엇인지 말해 주는 문장이 없다.**
- **③ 위치**: `pages/Landing/copy/landingCopy.ts:127-140`(`payout`) · `PayoutRhythm.tsx`

### 🟡 D7 — S3 진행 화살표가 사실상 보이지 않는다

- **① 증상(실측)**: 13px `textMuted`(`rgb(95,105,117)`), 20px 갭 안. 전체 페이지 캡처에서 판독 불가.
- **② 위반 원칙**: `bolder.md:22`(스켈레톤 테스트) — *"Strip the copy out ... Does the skeleton still say what this section is?"*
  화살표를 지우면 S3 는 "사다리"가 아니라 "같은 카드 3장"이 된다. 그 유일한 장치가 안 보인다.
- **③ 위치**: `ConceptLadder.styled.ts:38-49`

### ✅ 확인했고 **고치지 않는다** (엔지니어가 헛수고하지 않도록 명시)

| 항목 | 판정 |
|---|---|
| S2 "주요 지수" `h2` 가 13px `textSecondary` 라 다른 h2(18px display)와 급이 다름 | **의도**다. 데이터 스트립이지 콘텐츠 섹션이 아니고, `ExchangeRateWidget` 과 공유하는 어휘다(`MarketIndexStrip.styled.ts:29-36`). 격을 올리면 S3 와 경쟁한다. |
| S8 FAQ 마커 `+`/`−` 가 유니코드 | **일관성이 이긴다.** `TickerDetailPage.styled.ts:775-788` 과 문자 단위로 같다. 한쪽만 바꾸면 두 벌이 된다. |
| S7 `gradientHeroSoft` 위 `textSecondary` | **안전 확인됨.** 위험했던 것은 `textMuted`(velog 다크 4.04:1)이고 `textSecondary` 는 그 판정을 이미 통과했다(`LandingPage.styled.ts:70-76`). |
| 섹션 배지 톤이 페이지 hue(identity)를 따르지 않고 4종을 순환 | **유지.** 사용자 취향이 확정 입력이다 — `user-profile.md:3` *"절제된 단색을 '색상이 없어 허접하다'고 느낀다."* 단색화는 그 취향의 정반대다. |
| 카드 `raised` 0개 | **확정**(`decisions.md:211` "이 화면의 주역은 히어로다"). 주역 카드를 만들지 마라. |
| 히어로 · 검색 · CTA 배치 | **확정**(`decisions.md:213,218`). 이 스펙은 히어로 파일을 **한 줄도** 건드리지 않는다 — 390×664 접힘 예산 258px 불변. |
| 섹션 리듬(51.2/20) | `layout.md:11` *"more space above a heading than below it"* 충족. 변경 없음. |

---

## C. 변경 스펙

> 공통 규칙: 하드코딩 hex 0 · 기존 토큰만 · Emotion `styled` · 폴더 단위 import ·
> `Card` 안 `Card` 금지 · 격식체 · 모션 추가 0(호버·누름·`<details>` 외 전부 금지).

### C-1 🔴 S6 비중 막대 → **색 견본 + 라벨 한 줄** (D1 해결 · tintscan 해결)

**무엇을**: 468px 짜리 연속 막대(`AllocationBar`) 와 그 아래 중복 텍스트(`AllocationText`)를
**하나의 목록**으로 합친다. 각 보유 종목 = `[8×8 색 견본][티커][비중%]`.

**왜 이것이 tintscan 을 해결하나**:
가장 큰 유채색 요소가 **187×8 → 8×8** 이 된다. tintscan 의 면 판정은 `폭 ≥180px && 높이 ≥8px` 이므로
**어떤 뷰포트·어떤 비중·어떤 열 수에서도 다시 걸리지 않는다.** 폭 상한(`max-width`)으로 누르는 안은
비중 40% 기준으로만 성립해 프리셋이 50% 를 갖는 순간 되터진다 — 그래서 기하로 끊는다.

**파일**: `pages/Landing/components/PresetBrowser/PresetBrowser.styled.ts`

```
삭제: AllocationBar (174-181) · AllocationSegment (183-186) · AllocationText (188-195)
신설:
  AllocationList  = styled.ul
    display: flex; flex-wrap: wrap;
    gap: ${space[1]} ${space[3]};
    margin: 0; padding: 0; list-style: none; min-width: 0;

  AllocationItem  = styled.li
    display: inline-flex; align-items: center; gap: ${space[1]};
    font-family: ${font.dataNumeric};
    font-size: ${font.size['2xs']};
    line-height: ${font.leading.snug};
    color: ${color.textSecondary};
    ${font.numeric}
    white-space: nowrap;

  AllocationSwatch = styled.span<{ $color: string }>
    flex: 0 0 auto; width: 8px; height: 8px;
    border-radius: ${radius.xs};
    background: ${({ $color }) => $color};

  AllocationLabel = styled.span      /* "구성 비중" 접두 */
    font-family: ${font.sans};
    font-size: ${font.size['2xs']};
    color: ${color.textMuted};
```

**파일**: `PresetBrowser.tsx:97-109` — 마크업 교체

```tsx
<AllocationList aria-label={copy.allocationLabel}>
  {segments.map((segment) => (
    <AllocationItem key={segment.ticker}>
      <AllocationSwatch $color={segment.colorVar} aria-hidden />
      {segment.ticker} {segment.weight}%
    </AllocationItem>
  ))}
</AllocationList>
```

**파일**: `PresetBrowser.utils.ts` — `formatAllocationText`(22-24) **삭제**.
`noUnusedLocals` 가 켜져 있으므로 남기면 빌드가 깨진다. `buildAllocationSegments` 는 그대로 쓴다.
`PresetBrowser.types.ts` 의 `PresetAllocationSegment` 도 그대로다.

**카드 tier**: `PresetCard` 는 `cardElevation('base')` 유지. **주역 승격 금지**(§B ✅표).

**접근성**: 견본은 `aria-hidden`, 사실은 목록 텍스트가 갖는다 →
스크린리더가 "구성 비중, 목록, 항목 4개 / SCHD 40% / …" 로 읽는다. 지금(한 문자열 낭독)보다 낫다.

**판정 근거**: `colorize.md:47` — 색 옆에 라벨이 붙는 순간 색은 "유일한 부호"가 아니게 되고,
`utils` 가 자리 순서로 색을 주는 것도 **더 이상 거짓말이 아니게 된다**(색이 자기 라벨과 인접하므로
카드 사이 일관성이 요구되지 않는다). 동시에 `colorize.md:42` 의 "강한 색은 한 영역/역할을" 이
회복된다 — 페이지에서 가장 큰 유채 면은 다시 히어로 하나다.

⚠ 카피 변경 없음. `copy.allocationLabel`(`'구성 비중'`) 을 `aria-label` 로 그대로 쓴다.
카드 위에 **금액·기간을 새로 쓰지 않는다**(`decisions.md:207,219`).

---

### C-2 🔴 S3 카드 내용 상단 정렬 (D2)

**파일**: `pages/Landing/components/ConceptLadder/ConceptLadder.styled.ts:29-37`(`ConceptItem`)

```
+  align-content: start;
```

한 줄이다. 결과: 세 `h3` 가 같은 y 에, 세 `p` 도 같은 y 에서 시작한다.
**판정 근거**: `layout.md:63` 스퀸트 테스트 — 3열 비교의 전제가 "같은 자리에서 시작"이다.

---

### C-3 🔴 S5 12칸 트랙 열 정렬 (D3)

**파일**: `pages/Landing/components/PayoutRhythm/PayoutRhythm.styled.ts:25-77`

`RhythmList` 가 3열 트랙을 소유하고 `RhythmRow` 가 `subgrid` 로 물려받는다.
(`display: contents` 는 **쓰지 마라** — `li` 가 접근성 트리에서 사라지는 브라우저가 있다.)

```
RhythmList (25-31)
    display: grid;
+   ${media.up('tabletSm')} {
+     grid-template-columns: 6ch max-content minmax(0, 1fr);
+     column-gap: ${space[3]};
+   }

RhythmRow (37-47)
+   ${media.up('tabletSm')} {
+     display: grid;
+     grid-column: 1 / -1;
+     grid-template-columns: subgrid;
+     align-items: center;
+   }
    /* ≤tabletSm 은 지금 그대로 — flex + wrap. @390 은 이미 정렬이 맞다(§A-4). */
```

`RhythmSymbol` 의 `width: 6ch`, `RhythmSummary` 의 `flex: 0 0 auto` 는 그리드 자식이 되면 무해하다
(원하면 `RhythmSymbol` 의 `width` 는 지워도 된다 — 트랙이 6ch 를 소유한다).

**검증값**: 세 행의 트랙 `left` 가 **모두 같아야** 하고 칸 폭도 같아야 한다(현재 272/272/305, 69/69/66).

**판정 근거**: `layout.md:20` — *"Do tight and generous intervals create a deliberate cadence?"*
격자의 리듬은 **열이 맞아야** 존재한다.

---

### C-4 🟠 S4 를 2단으로 — 42% 공백 회수 (D4)

**파일**: `pages/Landing/components/CompoundExplainer/CompoundExplainer.styled.ts`

```
ExplainerBody (14-19)  ← 산문 폭 제한을 자식으로 내리고, 자신은 2단 그리드가 된다
    display: grid;
    gap: ${space[3]};
    min-width: 0;
-   max-width: 60ch;
+   ${media.up('layout')} {                       /* 981px 이상 */
+     grid-template-columns: minmax(0, 60ch) minmax(260px, 340px);
+     column-gap: clamp(24px, 3vw, 40px);
+     align-items: start;
+   }

+ ExplainerProse = styled.div      /* 신설: 문단 2개 + 인라인 링크 */
+   display: grid;
+   gap: ${space[3]};
+   max-width: 60ch;
+   min-width: 0;
```

**파일**: `CompoundExplainer.tsx` — 마크업

```
<ExplainerBody>
  <ExplainerProse>
    <ExplainerParagraph/>×2
    <InlineLinkLine><InlineLink/></InlineLinkLine>
  </ExplainerProse>
  <FactorCard>…</FactorCard>        ← 그대로. sunken 유지
</ExplainerBody>
```

- ≥981px: 왼쪽 산문(600px 유지) · 오른쪽 `FactorCard`. 공백 440 → **약 100px**.
- ≤980px: 1단, 순서 = 산문 → 링크 → `FactorCard`. (현재는 산문 → 카드 → 링크. 링크가 산문 끝에
  붙는 쪽이 문맥상 더 맞다 — "직접 계산해 보실 수 있습니다"는 설명 문단의 마무리다.)
- `FactorCard` tier·토큰 **변경 없음**(`cardElevation('sunken')`). 카드 안 카드 아님(부모는 면이 없다).
- 새 토큰 0 · 새 색 0 · 모션 0.

**판정 근거**: `bolder.md:15` — *"Amplify what the system already owns."*
새 장치를 발명하지 않고 **이미 있는 `FactorCard` 를 제자리에 놓았을 뿐**이다.
`bolder.md:18` — *"Give it its own rhythm ... a shift in density."* 이웃 S3(3열)·S5(격자)·S6(2열) 사이에서
S4 만 1열 산문이던 리듬 구멍이 메워진다.

⚠ 문단 폭 60ch 는 **줄이지 마라** — `craft-floor.md:12` 의 65–75ch 대역 안이고, 이 섹션은 랜딩에서
가장 긴 산문이다.

---

### C-5 🟠 S3 순서 배지 = 평범한 숫자 (D5)

**파일**: `pages/Landing/copy/landingCopy.ts:96,102,108`

| 키 | before | after |
|---|---|---|
| `concept.items[0].order` | `'①'` | `'1'` |
| `concept.items[1].order` | `'②'` | `'2'` |
| `concept.items[2].order` | `'③'` | `'3'` |

**파일**: `ConceptLadder.styled.ts:66-79`(`ConceptOrder`) — 토큰 변경 없음(24px · `identitySubtle`
면 + `identityText` 글자 · `font.dataNumeric` · `font.weight.bold`). 배지가 원을 그리고 있으므로
글자는 숫자만 있으면 된다.

**판정 근거**: `craft-floor.md:39` 유니코드 글리프 금지 + 원 안의 원 제거.
숫자 자체는 유지한다 — `craft-floor.md:27` 은 *"Section numbers ... unless the sequence itself carries
information the reader needs"* 라고 예외를 두는데, 여기 순서는 **선수 지식의 순서**라 내용이다
(`ConceptLadder.tsx:14-16` 이 이미 그 근거를 적어 두었다).

---

### C-6 🟡 S5 범례 한 줄 (D6)

**파일**: `pages/Landing/copy/landingCopy.ts` — `payout` 객체에 키 1개 추가

```ts
/** 🔴 색 부호를 눈으로 읽는 유일한 문장. 지우면 이 표는 색만으로 말하게 된다. */
legend: '진하게 표시된 칸이 배당을 지급한 달입니다.',
```

**파일**: `PayoutRhythm.tsx` — `RhythmFootnote` **바로 위**(=격자 바로 아래)에 한 줄로 렌더.
스타일은 기존 `RhythmFootnote`(`font.size.xs` · `textSecondary`)를 **그대로 재사용**한다.
새 styled 컴포넌트를 만들지 마라.

⚠ 카피 규율 — 숫자 0 · 격식체 · 지급 월을 문자열에 박지 않는다(`landingCopy.ts:14-16`).
"지급한"(과거)인 이유는 각주가 "과거 지급 이력에서 확인한 값"이라고 이미 말하기 때문이다.
"지급하는"(현재/미래)으로 쓰면 약속형이 된다.

---

### C-7 🟡 S3 진행 화살표를 읽히게 (D7)

**파일**: `ConceptLadder.styled.ts:38-49`

```
-   font-size: ${font.size.sm};      /* 13px */
-   color: ${color.textMuted};
+   font-size: ${font.size.lg};      /* 16px */
+   color: ${color.textSecondary};
```

갭이 `clamp(12px, 2vw, 20px)`(1280 에서 20px)이므로 16px 글리프가 넘치지 않는다.
`≤tablet` 에서 사라지는 동작은 그대로.

**판정 근거**: `bolder.md:22` 스켈레톤 테스트 — 이 섹션이 "사다리"인 유일한 시각 장치다.
`craft-floor.md:39`(유니코드 아이콘 금지)와의 긴장은 **의도적으로 감수한다**: 이것은
아이콘 시스템의 자리가 아니라 두 카드 **사이 갭의 타이포 연결자**이고, lucide SVG 로 바꾸려면
`::before` 를 실제 요소로 승격해야 하는데 그 순간 `ol` 안에 목록 항목이 아닌 형제가 끼어
목록 시맨틱이 깨진다. 시맨틱 > 글리프 출처.

---

### C-8 반응형 규칙 (변경 후 최종 상태 — 이대로 유지)

| 폭 | S3 | S4 | S5 | S6 | S7 |
|---|---|---|---|---|---|
| ≥981 (`layout`) | 3열 + 화살표 | **2단**(산문 / FactorCard) | 3열 subgrid 정렬 | 2열 | 2열 |
| 821–980 | 3열 + 화살표 | 1단 | 3열 subgrid 정렬 | 2열 | 2열 |
| 761–820 (`tablet`) | **1열**, 화살표 제거 | 1단 | 3열 subgrid 정렬 | 2열 | **1열** |
| ≤760 (`tabletSm`) | 1열 | 1단 | **라벨 윗줄 + 12칸 전폭**(현행) | **1열** | 1열 |

접히는 것 / 남는 것: 어떤 폭에서도 **사라지는 콘텐츠는 없다.** 접히는 것은 열 수와 S3 화살표뿐이고,
화살표는 세로 배치에서 방향이 거짓이 되므로 제거가 정답이다(`ConceptLadder.styled.ts:10-11` 의 기존 근거).

---

## D. 기각한 처방 (스킬이 권했으나 확정 결정과 충돌)

| 스킬·처방 | 판정 | 이유 |
|---|---|---|
| `craft-floor.md:26` **eyebrow/kicker 금지**를 뒤집는 `high-end-visual-design` 의 "H2 위 소문자 라벨 필수" | **기각(재확인)** | 이미 판정 끝(`rework-spec.md` §3 충돌 1). 한국어에 대문자 트래킹 라벨은 성립하지 않는다. |
| `craft-floor.md:24` *"Same-size cards of icon plus heading plus text as the page structure"* → S3·S6 카드 격자 해체 | **부분 기각** | S6 열 수는 **오늘 실측으로 확정**됐다(`decisions.md:214`, 3열이면 4묶음 전부 빈 칸). 열 수를 다시 만지지 않는다. S3 은 카드를 유지하되 정렬·배지·연결자만 고친다(C-2·C-5·C-7). |
| `craft-floor.md:43` *"Card radii stay at 12–16px"* → `radius.xl`(20px) 축소 | **기각** | 이 레포는 `surfaces.ts` 의 동심 반경 체계로 **의도적 초과**를 이미 문서화했다. 랜딩만 다른 반경을 쓰면 `design-taste-frontend` 의 SHAPE CONSISTENCY LOCK 을 깬다. |
| `bolder.md` 를 근거로 한 "S4 에 큰 CTA 버튼 추가" | **기각** | `design-taste-frontend` **CTA 중복 금지** + `CompoundExplainer.styled.ts:11` 이 이미 판정("여기에 큰 버튼을 또 두면 히어로 CTA 와 경쟁한다"). 인라인 링크 유지. |
| `delight.md` 계열의 "첫 방문 환영 연출 / 숫자 카운트업 / 스크롤 리빌" | **기각** | 사용자 확정 금지 + `delight.md:10` 스스로 *"Operate + Read: concentrate delight at ... first use, completion, recovery, or mastery"* 라고 제한하고 `delight.md:23` 은 *"Do not manufacture a celebration for an ordinary click."* 랜딩 스크롤은 그 어느 순간도 아니다. `operate.md:43` *"No orchestrated page-load sequences."* |
| `colorize.md` 를 근거로 한 "섹션 배지를 페이지 hue(identity) 단색으로 통일" | **기각** | `user-profile.md:3` 사용자는 절제된 단색을 "허접"으로 느낀다. 취향은 확정 입력이고 스킬보다 위다. |
| `bolder.md:17` *"Commit, then quiet everything around it"* → S7 `gradientHeroSoft` 제거해 틴트 면 2→1 | **기각** | 그 면은 `decisions.md:211` 이 이름을 찍어 확정한 2면 중 하나다. tintscan 은 **불청객 3번째 면**(C-1)을 없애서 푼다. |
| `bolder.md` → 랜딩에 `raised` 주역 카드 신설 | **기각** | `decisions.md:211` "주역 `raised` 카드는 0개 — 이 화면의 주역은 히어로다". |
| `craft-floor.md:39` 를 S8 FAQ `+`/`−` 에 적용 | **기각** | `TickerDetailPage.styled.ts:775-788` 과 같은 어휘. 한쪽만 바꾸면 어휘가 두 벌이 된다(`operate.md:36`). |
| `operate.md:14` *"Fixed rem scale, not fluid"* → `sectionTitleFontSize` clamp 제거 | **기각(재확인)** | `decisions.md` 2026-07-29 확정. |
| `high-end-visual-design` 의 `py-24~40` 매크로 여백 · Tailwind 전제 · 그레인/글래스/mesh | **기각(재확인)** | `rework-spec.md` §3 에서 이미 판정. |
| tintscan 의 면 하한(180px)이나 상한(2)을 조정 | **기각** | 3라우트가 공유하는 계약이다. 도구를 화면에 맞추는 것은 게이트를 없애는 것과 같다. |
| `AllocationBar { max-width }` 로 조각을 180px 아래로 누르기 | **기각(대안으로 검토했음)** | 최대 비중 40% 기준으로만 성립한다. 프리셋이 50% 를 갖는 순간 되터지고, 그때 아무도 이 계산을 기억하지 못한다. **기하로 끊는 C-1 을 쓴다.** |
| `AllocationBar` 높이 8px → 6px 로 낮춰 하한 회피 | **기각** | 디자인 논거가 아니라 **도구 임계값에 맞춘 수치**다. 그런 값은 다음 사람이 이유 없이 되돌린다. |

---

## E. 검증 계획 (after 에 무엇을 어떻게 재는가)

### E-1 게이트 (전부 exit 0 이어야 한다)

```sh
npm run tintscan            # ← 이번 패스의 주 목표
npm run overflowprobe
npm run headerprobe
node tools/dev/archclip.mjs
npm run verify              # tsc → test → api번들 → api체크 → build
```

| 지표 | before | after 기대 |
|---|---|---|
| `tintscan` `/ (랜딩)` @1280 | **3면 (실패)** | **2면 (통과)** — 히어로 + S7 만 |
| `tintscan` `/ (랜딩)` @390 | 2면 | 2면 (불변) |
| `overflowprobe` `/` @390·@360 | 새는 요소 0 | 0 (불변) |
| `headerprobe` `/` @1280 / @390 | 65px / 111px | 불변 |

### E-2 실측 회귀 (uiprobe `--eval`)

```sh
# ① S3 정렬 — 세 h3 top 이 같아야 한다 (before 646/641/636)
node tools/dev/uiprobe.mjs --width 1280 --eval "[...document.querySelectorAll('main ol > li h3')].slice(0,3).map(e=>Math.round(e.getBoundingClientRect().top))"

# ② S5 열 정렬 — 세 트랙의 left 와 칸 폭이 같아야 한다 (before left 272/272/305, w 69/69/66)
node tools/dev/uiprobe.mjs --width 1280 --eval "[...document.querySelectorAll('main li')].filter(li=>/^(SCHD|VIG|O)/.test(li.textContent.trim())&&li.textContent.includes('12')).map(li=>{const t=li.children[2].getBoundingClientRect();return {left:Math.round(t.left), cell:Math.round(t.width/12)};})"

# ③ S6 유채 요소 최대 폭 — 8px 이하여야 한다 (before 187px)
node tools/dev/uiprobe.mjs --width 1280 --eval "Math.max(...[...document.querySelectorAll('main span')].filter(e=>{const b=getComputedStyle(e).backgroundColor;return b!=='rgba(0, 0, 0, 0)'&&/^rgb/.test(b);}).map(e=>Math.round(e.getBoundingClientRect().width)))"

# ④ S4 공백 — 섹션 폭 대비 내용 폭 (before 1040 vs 600)
node tools/dev/uiprobe.mjs --width 1280 --eval "(()=>{const s=document.querySelector('main').firstElementChild.children[3];const b=s.querySelector('div');return {section:Math.round(s.getBoundingClientRect().width), body:Math.round(b.getBoundingClientRect().width)};})()"
```

| 지표 | before | after 기대 |
|---|---|---|
| ① S3 `h3` top 3개 | 646 / 641 / 636 | **셋 다 동일** |
| ② S5 트랙 left / 칸폭 | 272·272·305 / 69·69·66 | **셋 다 동일 / 셋 다 동일** |
| ③ S6 최대 유채 요소 폭 | 187px | **≤8px** |
| ④ S4 내용 폭 | 600 / 1040 (42% 공백) | **≥900 / 1040** (공백 ≤14%) |

### E-3 눈으로 (필수 — 안 보고 쓴 검증은 무효)

```sh
node tools/dev/uiprobe.mjs --shot tmp/after.png --width 1280,390
```

전체 페이지 + 섹션별(§A 와 같은 방식으로 형제 `display:none`) 캡처를 **직접 열어** 확인:

- S3 세 카드의 제목·본문이 같은 줄에서 시작하는가 / 숫자 1·2·3 이 읽히는가 / 화살표가 보이는가
- S5 3월 칸이 세 행에서 세로로 정렬되는가 / 범례 문장이 격자 아래에 있는가
- S6 카드가 색 조각 밭이 아니라 **읽히는 목록**인가 / 페이지에서 가장 큰 유채 면이 다시 히어로인가
- S4 오른쪽에 `FactorCard` 가 앉고 문단 폭이 그대로 600px 인가
- 다크 + 프리셋 2~3종 전환 후에도 위가 유지되는가

### E-4 기존 가드 (깨지면 안 된다)

```sh
npx vitest run test/landing test/seo
```

- `test/landing/landingDataDiscipline.test.ts` — C-1 이 `formatAllocationText` 를 지워도 이 테스트는
  금지 필드 목록만 본다(확인함). `expectedMonthlyDividend` 류를 **되살리지 마라**.
- `test/landing/tickerPageIndexParity.test.ts` · `test/seo/landingFaqStructuredData.test.ts` —
  이 패스는 FAQ 카피·티커 인덱스를 건드리지 않으므로 불변이어야 한다.
- `index.html` 의 `.app-shell-fallback` 은 S1·S3·S4·S5·S7 본문의 **사본**이다(`decisions.md:212`).
  C-5(`①`→`1`)·C-6(범례 추가)이 셸 본문에 같은 문장을 요구하는지 확인하라 —
  셸이 순서 글리프를 담고 있으면 함께 고친다.

---

## 다음 담당

- **구현**: `frontend-engineer` — C-1 ~ C-7 전부. 상태(atom) 변경 0건이라 `state-engineer` 불필요.
- **검증**: `qa-tester` — E-2 의 ①②③④ 를 RTL 이 아니라 **uiprobe 실측**으로 남길지 판단.
  (jsdom 은 레이아웃을 계산하지 않아 ①②④ 를 볼 수 없다.)
- **리뷰**: `reviewer` — 특히 C-1 이 `decisions.md:207,219`(적용 전 금액 금지)를 침범하지 않는지.
</content>
</invoke>
