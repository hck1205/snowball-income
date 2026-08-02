# 랜딩(`/`) 시각 언어 리워크 스펙 — 2026-08-01

> **구현 지시서**다. 설계는 `ui-ux-designer`, 집행은 `frontend-engineer`.
> 대상은 **`pages/Landing/**` 과 `test/landing/**` 뿐**이다.
> 🔴 `components/common/PageHero` · `components/common/PageFooter` · `components/MarketIndexStrip` ·
> `components/common/Card` · `shared/styles/**` 를 **한 줄도 고치지 않는다**(다른 트랙이 미커밋 수정 중).
>
> 직전 패스(`docs/landing-design-pass-spec.md`, 516줄)에서 이미 고친 것 — S3 상단 정렬 · S5 subgrid 열 정렬 ·
> S6 막대 `max-width:176px` · S4 2단화 · S3 순서 배지 숫자화 · S5 범례 · S3 화살표 가독 — 은 **다시 손대지 않는다.**
> 단 §D-3(S3)과 §D-6(S8)은 그 산출물의 **일부를 의도적으로 폐기**한다. 폐기 사유를 각 절에 적었다.

---

## A. before 실측표 (도구 출력, 형용사 없음)

측정: dev `http://localhost:5199`, `node tools/dev/uiprobe.mjs --port 9412 --wait 6000`,
`tools/dev/tintscan.mjs --port 9413`. 2026-08-01. 측정 직전 `git status --porcelain` 확인 —
`pages/Landing/**` 은 전부 미추적(신규), `components/common/PageHero/PageHero.styled.ts` 의
작업트리 변경은 `HeroMeta` `p`→`div` 주석/태그 변경뿐이라 아래 좌표에 영향 없음.

### A-1 문서·섹션 기하

`--eval` = `LandingStack` 직계 자식 순회.

```
1280px  stackGap 50.6px · stackW 1040 · docH 3670
 i tag      내용            top    h
 0 DIV      배당, 여기서부터…  113   212   (히어로 140 + 검색 72)
 1 SECTION  주요 지수         376   124
 2 SECTION  배당을 알기 전에   551   250
 3 SECTION  배당을 다시 넣으면 851   208
 4 SECTION  배당이 들어오는 달 1110  441
 5 SECTION  사람들이 많이 쓰는 1601  922
 6 SECTION  시작하기 전에     2574  275
 7 SECTION  자주 묻는 질문    2900  522
 8 FOOTER   이 사이트에 대해   3472  134

 390px  stackGap 32px · docH 5065 · ctaBottom(simulator) 258
 0 DIV 131/282 · 1 SECTION 445/323 · 2 SECTION 800/499 · 3 SECTION 1331/339
 4 SECTION 1702/521 · 5 SECTION 2255/1408 · 6 SECTION 3695/541 · 7 SECTION 4267/514 · 8 FOOTER 4813/188
```

* 9블록 사이 간격은 **8곳 전부 같은 값**(1280 50.6px · 390 32px). `LandingStack` gap 하나가 전부다.
* 히어로 박스 = **1040×140**(패딩 32px, `linear-gradient(135deg, rgb(222,236,246), rgb(230,245,239))`).
  블록 높이 순위: S6 922 > S8 522 > S5 441 > S7 275 > S3 250 > **S1 212** > S4 208 > 푸터 134 > S2 124.
* 히어로 `h1` 잉크 = 478×35. CTA 2개 = `x=851/989, y=143, 130×40`(제목 **오른쪽**).
* 히어로 리드 폭 974px(한 줄). 검색 폼 `min(520px,100%)`, 입력 높이 44px.

### A-2 타입 실측 (computed)

```
1280px  h1  30px / w800 / "Snowball Display" / ls -0.9px / lh 37.5px / rgb(33,37,41)
        h2  18px / w700 / "Snowball Display" / ls -0.36px / lh 25.2px / rgb(33,37,41)   ×6
        h2  13px / w600 / "Snowball Display" / ls -0.13px / rgb(73,80,87)  ← S2 "주요 지수"
        h3  16px / w700 / "Snowball Display" / ls normal / lh 24px        ← S3 ConceptTitle
        h3  14px / w700 / "Snowball Display"                              ← S4·S6 그룹·S7
        p   16px / w400 / "Wanted Sans Variable" / lh 22.4px              ← 히어로 리드

 390px  H2 배당을 알기 전에 | 16px w700 ls-0.32px
        H3 주식            | 16px w700 ls normal
        H3 ETF             | 16px w700 ls normal
        H2 배당을 다시 넣으 | 16px w700 ls-0.32px
        H3 계산에 필요한 값 | 14px w700
        h1 21.42px / ls -0.6426px · 카드 p 13px · SectionLede 12px · 히어로 리드 14px
```

### A-3 서체 굵기 가용성 (canvas, `await document.fonts.ready`, 100px, "배당 계산")

알파 128 초과 픽셀 수:

```
Snowball Display      400:18918  600:18918  700:18918  800:18918     ← 전부 동일
Wanted Sans Variable  400: 8150  600:11264  700:13071  800:14453     ← +77%
advance width @400px  Display 1651.20 (400/500/600/700/800 전부 동일)
                      Wanted  1482.81 / 1481.84 / 1480.66 / 1479.69 / 1478.71
```

### A-4 유채 픽셀 비율 (PNG 디코드, `scratchpad/vlang/chroma.mjs`, `rw-before.1280.png` 1265×3670)

`chroma = max(R,G,B) − min(R,G,B)`.

| 범위 | ≥12 | ≥30 | ≥60 |
|---|---|---|---|
| 첫 뷰포트 y 0–900 | **15.17%** | **1.24%** | 1.15% |
| 문서 전체 y 0–3670 | 5.64% | **0.64%** | 0.59% |

첫 뷰포트 상위 색: `224,256,256` 7.89% · `224,224,256` 3.83%(둘 다 히어로 그라디언트) ·
`0,128,96` 0.38% · `0,96,160` 0.36%.

섹션별(≥12 / ≥30):

```
S1 히어로 50.45 / 4.30   S2 지수 1.35 / 0.75   S3 개념 1.50 / 0.09
S4 복리   1.09 / 0.52    S5 리듬 6.96 / 0.45   S6 프리셋 1.47 / 1.00
S7 준비   8.20 / 0.02    S8 FAQ  0.04 / 0.00   푸터 1.44 / 0.00
```

### A-5 유채 **요소** 개수 (섹션별, `color`/`background`/`border` 중 채도 ≥24, `color(srgb)`·알파 0.25 미만 제외)

1280·390 **동일**:

```
S1 3 · S2 5 · S3 5 · S4 3 · S5 23 · S6 48 · S7 2 · S8 0 · 푸터 0     (합 89)
```

### A-6 면 인벤토리

`main` 안에서 배경/테두리/그림자를 갖고 120×48 이상인 요소 = **29개**.
그중 27개가 `border-radius` 12/16/20px + `1px rgb(233,236,239)` + 흰/`rgb(248,249,250)` 면.
내역: 히어로 1 · 지수 셀 5(202×92) · S3 카드 3(333×194) · S4 FactorCard 1(340×133) ·
S5 카드 1(1040×218) · S6 카드 8(510×127) · S7 카드 1(1040×219) · FAQ 8(1040×51) · 푸터 1.

### A-7 게이트 기준선

```
tintscan --url http://localhost:5199 --route / --width 1280,390
  1280px  ✓ 2개  y=113  1040×140 header  gradient-hero
                 y=2630 1040×219 div     gradient-hero-soft
   390px  ✓ 2개  y=131  358×218 header · y=3743 358×493 div
```

`overflowprobe`/`headerprobe` 는 직전 패스 기준선(새는 요소 0 · `/` @1280 65px, @390 111px)을
그대로 승계한다 — 이 패스에서 재측정 대상이다(§F).

---

## B. 진단 판정 (①확인 / ②반증 / ③이미 고쳐짐)

| # | 사용자 진단 | 판정 | 근거 |
|---|---|---|---|
| 1 | 8섹션이 전부 같은 무게 | **① 확인** | 9블록 간격이 8곳 전부 50.6px(A-1). 섹션 머리 6개가 전부 18px/w700/36px 배지로 동일(A-2). 무게 등급을 만드는 장치가 코드에 **존재하지 않는다**(`LandingSection` 에 강조 prop 0개). |
| 2 | 히어로가 히어로가 아니다 | **① 확인, 단 목표는 재정의 필요** | 히어로 박스 140px = 문서의 3.8%, 높이 순위 **6위**. 문서 높이 기준으로 1위가 되는 것은 **불가능**하다(S6 922px = 히어로의 6.6배이고 S6 은 13장 카탈로그라 줄일 대상이 아니다). 달성 가능한 목표는 **첫 뷰포트(1280×900) 지배력**이다: 현재 히어로는 첫 화면의 15.6%를 차지하고 같은 화면에 S2(124)·S3 머리가 함께 선다. |
| 3 | 타입 스케일 대비가 거의 없다 | **① 부분 확인 + ② 부분 반증** | **반증**: h1↔h2 는 1280 에서 30/18 = **1.67배**로 충분하고, tracking(-0.03em/-0.02em/normal)·leading(1.25/1.4/1.5)은 **크기에 따라 이미 옳게** 갈려 있다(apple-design §15 기준 통과). **확인**: 진짜 결함은 **h2↔h3** 다 — 1280 에서 18/16 = 1.125배, **390 에서 16/16 = 1.00배**(A-2: `H2 배당을 알기 전에 16px w700` / `H3 주식 16px w700`, 차이는 letter-spacing 0.32px 뿐). 그리고 이 결함은 **굵기로 못 고친다**: A-3 실측상 `Snowball Display` 는 400/600/700/800 의 잉크 픽셀이 **18,918 로 완전히 동일**하다(단일 굵기 페이스). 헤딩 위계에 쓸 수 있는 축은 **크기·색·여백·구조뿐**이다. |
| 4 | 전부 카드다 | **① 확인** | `main` 안 면 29개 중 27개가 같은 어법(1px `#e9ecef` + 흰 면 + 12/16/20px 라운드). A-6. |
| 5 | 색이 거의 없다 | **① 확인, 수치로** | 문서 전체에서 채도 ≥30 인 픽셀이 **0.64%**. 첫 뷰포트의 "색"으로 보이는 15.17%는 거의 전부 히어로의 파스텔 그라디언트이고 채도 ≥30 만 세면 **1.24%** 로 떨어진다(A-4). 유채 **요소**는 89개 중 71개가 S5·S6 두 섹션에 몰려 있고 **S8·푸터는 0개, S7 은 2개**다(A-5). |
| 6 | 섹션 간 여백이 균일해 그룹핑이 안 보인다 | **① 확인** | 8곳 전부 50.6px(1280)·32px(390). 값이 하나뿐이라 그룹이 표현될 수 없다. |
| 7 | S6 이 페이지의 절반, 4묶음이 안 갈린다 | **② 절반 반증 + ① 절반 확인** | **반증**: S6 은 922/3670 = **25.1%**(390 은 1408/5065 = 27.8%)로 "절반"이 아니다. **확인**: 묶음이 안 갈린다 — 4묶음 머리가 전부 14px/w700 이고 묶음 피치가 191·192·191px 로 균일하며, 묶음 사이 28px vs 카드 사이 20px 로 **비율이 1.4배**뿐이다. |
| 8 | S2 "주요 지수"가 두 번째 자리 | **① 확인** | top=376(히어로 바로 다음). **390 에서는 323px** 로 히어로 블록(282px)보다 크다. 덧붙여 `index.html` 의 크롤러 셸 본문은 S1·S3·S4·S5·S7·FAQ 만 담고 **S2 를 애초에 포함하지 않는다** — 서사에서 빠져 있다는 판단이 이미 한 번 내려져 있었다. |
| 9 | FAQ 8개가 하단을 길게 먹고 마무리가 약하다 | **① 확인** | S8 = 522px(문서의 14.2%) · 유채 픽셀 채도 ≥30 **0.00%** · 유채 요소 **0개**. 그 뒤는 곧바로 푸터이고 **닫는 액션이 없다**(페이지의 마지막 인터랙티브 요소는 FAQ 8번째 `summary`). |

> **반증 2건이 이 패스의 방향을 바꾼다.**
> ①진단 2 → "히어로를 페이지 최대 요소로" 는 달성 불가 목표이므로 **첫 뷰포트 지배력 + 상대적 정숙화**로 바꾼다.
> ②진단 3 → 굵기 축이 물리적으로 없으므로 타입만으로는 위계를 못 만든다. **구조(룰·여백)** 가 위계의 주 운반체다.

---

## C. 시각 언어 (이 스펙의 심장)

### C-0 한 문장

> **히어로는 무대(A), 본론 두 장(B)은 페이지 hue 를 입은 챕터, 나머지는 같은 색을 갖되 구조를 갖지 않는다.**
> 위계는 **크기·룰(rule)·여백**으로 만들고, **채도는 등급과 무관하게 전 섹션이 갖는다.**

`bolder.md` 의 *"Commit, then quiet everything around it"* 을 채택하되, **"quiet" 를 채도 제거로 집행하지 않는다.**
그 실행은 `user-profile.md:3`("절제된 단색은 색상이 없어 허접하다")과 정면 충돌하고, 직전 배치에서
색 면적을 줄이는 처방이 그 이유로 기각된 이력이 있다(`decisions.md` 랜딩 §, C-1 막대 삭제안 기각).
이 스펙에서 "조용히"는 **구조를 주지 않는 것**이다.

### C-1 위계 등급표 (섹션 8개 × 등급)

| 섹션 | 등급 | 이름 | 크기(h) | hue 룰 | 배지 | 카드 | 여백 그룹 |
|---|---|---|---|---|---|---|---|
| S1 히어로 | **A 무대** | 무대 | h1 `clamp(24, 0.6rem+3.2vw, 44)` | 상단 4px 리본(기존) | 36px, pageHue(기존) | 틴트 면 1/2 | G1 단독 |
| S4 복리 | **B 챕터** | 왜 하는가 | h2 `sectionTitleFontSize` | **h2 아래 2px `color.identity`** | 36px `identity` | 없음(산문+sunken) | G2 |
| S6 프리셋 | **B 챕터** | 무엇을 고르는가 | h2 `sectionTitleFontSize` | **h2 아래 2px `color.identity`** | 36px `identity` | 카드 8~13 | G3 |
| S3 개념 | **C 보조** | 단어 셋 | h2 동일 | 없음 | 36px `accent` | **없음(구분선 격자)** | G2 |
| S5 리듬 | **C 보조** | 언제 들어오나 | h2 동일 | 없음 | 36px `accentAlt` | 카드 1 | G2 |
| S7 준비 | **C 보조** | 시작 전 확인 | h2 동일 | 없음 | 36px `accent` | 틴트 면 2/2 | G3 |
| S8 FAQ | **D 참조** | 남은 질문 | h2 동일 | 없음 | 36px `accentAlt` | **없음(구분선 목록)** | G4 |
| S2 지수 | **D 참조** | 오늘의 시세 | 자체 h2 13px(불변) | 없음 | 없음(불변) | 셀 5(불변) | G4 |
| 마무리 CTA | A′ 종결 | 다시 무대로 | 헤딩 없음 | **상단 2px `color.identity`** | 없음 | 없음 | G4 |

**등급이 실제로 만드는 차이는 셋뿐이다** — ①제목 크기(A 만 다르다) ②hue 룰의 유무(A·B 만 갖는다)
③여백 그룹 안에서의 위치. 그 외(배지·색·본문 크기)는 전 섹션 동일하다.
등급을 늘리거나 새 장치를 발명하지 마라.

### C-2 타입 램프

| 역할 | 요소 | 서체 | 크기 | 굵기 | 색 | 변경 |
|---|---|---|---|---|---|---|
| **D1 페이지 제목** | 히어로 `h1` | `font.display` | ≥641: `clamp(font.size['3xl'], calc(0.6rem + 3.2vw), font.size['6xl'])` = **24→44px** · ≤640: `heroTitleFontSize` 그대로 | 800 | `color.text` | **신규(랜딩 로컬)** |
| **D2 챕터 제목** | `LandingSection` `h2` | `font.display` | `sectionTitleFontSize`(16→18px) | 700 | `color.text` | **변경 없음** |
| **D3 카드·묶음 제목** | `h3`·`h4` 전부 | `font.display` | **`font.size.base` = 14px 고정** | 700 | `color.text` | ConceptTitle 16→14 |
| B1 리드 | 히어로 lede · `SectionLede` | `font.sans` | 16→14 / 13→12 | 400 | `textSecondary` | 변경 없음 |
| B2 본문 | 카드 `p`·목록 | `font.sans` | 13 | 400 | `textSecondary`/`text` | 변경 없음 |
| M1 메타 | 비중 텍스트·각주·힌트 | `dataNumeric`/`sans` | 11–12 | 400 | `textSecondary`/`textMuted` | 변경 없음 |

실측 기준 단차(after 예상):

```
1280  44 / 18 / 14   →  2.44×  ·  1.29×
 390  21.42 / 16 / 14 → 1.34×  ·  1.14×
before 1280 30/18/16 → 1.67× · 1.125×      before 390 21.42/16/16 → 1.34× · 1.00×
```

* **390 의 h2↔h3 는 1.14배로 여전히 얇다.** 이것은 `sectionTitleFontSize` 하한(16px)과 본문 14px 사이에
  단계가 하나뿐이라 생기는 구조적 한계이고, **크기로 더 벌 수 없다.** 그래서 좁은 폭의 섹션 머리는
  **36px 배지 + (등급 B) 2px 룰**이 위계를 운반한다 — 크기에 기대지 마라.
* **`font.heroNumeric` 은 랜딩에서 쓰지 않는다.** 사유 4가지: ①"화면당 1곳" 규율의 대상은 그 화면의
  대표 **지표값**인데 랜딩에는 자기 지표가 없다 ②화면에 있는 유일한 숫자(지수 시세)는 `MarketIndexStrip`
  소유이고 편집 금지다 ③프리셋 수(13)·티커 수(11)를 크게 세우는 것은 `craft-floor.md:25` 의
  hero-metric 템플릿이고 랜딩이 자랑할 지표가 아니다 ④제목 안의 숫자만 다른 서체로 바꾸는 것은
  mixed-family emphasis 금지에 걸린다. **다음 사람이 이 검토를 반복하지 않도록 스펙에 못박는다.**
* **`font.display` 는 h1~h6 전역 규칙(`globalStyles.ts:138-143`)이 이미 준다.** 랜딩 styled 가 `font-family` 를
  새로 선언할 자리는 없다(기존 선언은 중복이지만 이 패스에서 정리 대상 아님).
* tracking·leading 은 **손대지 않는다** — A-2 실측상 이미 크기별로 옳다.

### C-3 색 배정표 (토큰 이름. 하드코딩 hex 0 · 새 hue 0 · 새 틴트 면 0)

**규칙 1 — 틴트 면은 정확히 2개다.** `gradient-hero`(S1) · `gradient-hero-soft`(S7). 세 번째를 만들지 마라.
**규칙 2 — `identity`(= `/` 의 page hue)는 등급 A·B 의 *면·룰*에만 준다.** 등급 C·D 의 hue 는 `accent`↔`accentAlt` 교대다.
**규칙 3 — 중립 면은 자유다.** `tintscan` 은 `--sb-bg`/`surface`/`surface-raised`/`surface-muted`/`surface-sunken`/
`surface-hover`/`progress-track` 을 중립으로 취급해 **크기와 무관하게 세지 않는다**(`tools/dev/tintscan.mjs:432-440`).
**규칙 4 — 높이 8px 미만 요소는 면이 아니다.** 2px 룰·1px 구분선은 몇 개를 그어도 게이트에 안 걸린다
(`tintscan` `--min-height 8`). 테두리(`border-*`)는 `backgroundColor`/`backgroundImage` 만 보는 스캐너에
**애초에 잡히지 않는다**.

| 섹션 | tone(prop) | 색이 붙는 자리 | 토큰 |
|---|---|---|---|
| S1 | (pageHue) | 상단 4px 리본 · 아이콘 배지 · 테두리 · 그라디언트 면 (**전부 기존**) + **검색 돋보기 아이콘** | `pageHue`/`gradientHero` + `color.identityText` |
| S3 | `accent` (was `identity`) | 섹션 배지 · **순서 배지 1·2·3** · **열 사이 세로 구분선 3개** | `accentSubtle`+`accentText` · `accentBorder` |
| S4 | `identity` (was `accentAlt`) | 섹션 배지 · **h2 아래 2px 룰** · **FactorItem 칩 4개 테두리+글자** | `identitySubtle`+`identityText` · `color.identity` · `identityBorder`+`identityText` |
| S5 | `accentAlt` (was `accent`) | 섹션 배지 · 12칸 지급 셀(**기존**) | `accentAltSubtle`+`accentAltText` |
| S6 | `identity` (유지) | 섹션 배지 · **h2 아래 2px 룰** · 묶음 배지 4종(**기존**) · **묶음 머리 아래 1px 톤 룰 4개** · 비중 막대(**기존**) | `color.identity` · 묶음: `identity`/`accentAlt`/`accent`/`borderStrong` · `CHART_SERIES_VARS` |
| S7 | `accent` (was `accentAlt`) | 섹션 배지 · 틴트 면(**기존**) | `accentSubtle`+`accentText` · `gradientHeroSoft` |
| S8 | `accentAlt` (was `neutral`) | 섹션 배지 · **`+`/`−` 마커 8개** | `accentAltSubtle`+`accentAltText` · `color.identity` |
| S2 | — | 등락색(**기존, 불변**) | — |
| 마무리 | — | 상단 2px 룰 · primary 버튼(`gradient-cta`, 기존 `Button`) | `color.identity` |

**대비 근거** — 새로 필요한 대비 쌍은 **0개**다.

* `identity`/`bg`, `identity`/`surface` = 검증됨(`contrast.test.ts:216-217`) → 2px·1px 룰과 FAQ 마커.
* `accent`/`surface`, `accent-alt`/`surface` = 검증됨(210-211) → 묶음 룰.
* `accent-text`/`accent-subtle`, `accent-alt-text`/`accent-alt-subtle`, `identity-text`/`identity-subtle`,
  `identity-text`/`surface` = 검증됨(186-190, 145-146) → 배지·칩.
* `accentBorder`/`identityBorder` 는 **장식 플로어**(1.44~2.70:1)라 3:1 게이트를 통과하지 않는다.
  이 스펙은 그 둘을 **톤을 말하는 유일한 신호로 쓰지 않는다** — 같은 그룹 안에 항상 색 배지(또는 순서 숫자)가
  함께 선다. `decisions.md` 2026-07-31("면을 뺀 뒤에는 테두리가 톤을 말하는 유일한 신호라 장식 급으로는 사라진다")의
  조건이 성립하지 않는 자리다.

**색만으로 정보를 전달하지 않는다** — 각 색 신호의 중복 단서:

| 색 신호 | 중복 단서 |
|---|---|
| S3 세로 구분선(accentBorder) | 순서 배지 숫자 `1`·`2`·`3` |
| S6 묶음 룰(4색) | 묶음 이름(인컴/성장/균형/특화) + 배지 아이콘 |
| S8 마커 색 | 글리프 모양 `+` ↔ `−` + `aria-expanded`(브라우저 제공) |
| S4 칩 테두리 | 칩 안 낱말(배당률·배당 성장률·투자 기간·배당소득세율) |
| 등급 B 의 2px 룰 | 섹션 제목 자체 + 그룹 여백 |

### C-4 여백 리듬표

| 자리 | before | after | 1280 | 390 |
|---|---|---|---|---|
| **그룹 경계**(`LandingStack` gap) | `clamp(32px, 4vw, 56px)` | **`clamp(48px, 6vw, 88px)`** | 50.6 → **76.8** | 32 → **48** |
| **그룹 안 섹션 간**(`LandingGroup` gap, 신설) | (없음) | **`clamp(24px, 3vw, 40px)`** | — → **38.4** | — → **24** |
| 섹션 머리↔내용(`SectionRoot` gap) | `clamp(12px, 2vw, 20px)` | 변경 없음 | 20 | 12 |
| 히어로↔검색(`HeroBlock` gap) | `clamp(12px, 2vw, 20px)` | 변경 없음 | 20 | 12 |
| S6 묶음 사이(`BrowserRoot` gap) | `clamp(16px, 3vw, 28px)` | **`clamp(28px, 3.2vw, 44px)`** | 28 → **41** | 16 → **28** |
| S6 묶음 머리↔격자(`GroupSection` gap) | `space[3]` 12px | **`space[2]` 8px** | 12 → 8 | 12 → 8 |
| S6 카드 사이(`PresetGrid` gap) | `clamp(12px, 2vw, 20px)` | 변경 없음 | 20 | 12 |

경계/내부 비율: 페이지 76.8/38.4 = **2.0배**(before 1.0) · S6 41/8 = **5.1배**(before 2.3).

**그룹 편성**

```
G1  무대       S1 히어로(+검색·이어서)                         ← LandingStack 직계 자식(래퍼 없음)
G2  배우기     S3 개념 → S4 복리 → S5 리듬
G3  고르기     S6 프리셋 → S7 시작하기 전에
G4  참조·마무리 S8 FAQ → S2 주요 지수 → 마무리 CTA
    PageFooter                                                ← LandingStack 직계 자식(불변)
```

---

## D. 섹션별 변경 스펙

> 공통: 하드코딩 hex 0 · 새 토큰 0 · 모션 추가 0(호버·누름·`<details>` 외 전부 금지) ·
> `role="dialog"` 0 · 폴더 단위 import · Emotion `styled` · 격식체 ·
> ⚠ `styled` 템플릿 **안** 주석에 백틱 금지(`node tools/dev/styled-comment-backticks.mjs` 가 잡는다) ·
> `pressable` 을 쓰는 새 블록은 자기 `transition` 목록에 `${pressTransition}` 을 끼운다.

---

### D-1 🔴 S1 히어로를 무대로 — 제목 줄을 세우고 제목을 키운다

**지금** 히어로 = 1040×140 밴드. 제목 30px 이 왼쪽, CTA 2개가 **오른쪽 끝(x=851/989)**, 리드가 974px 한 줄.
"공지 배너"의 기하다.

**바뀐 뒤** ≥641px 에서 제목 줄을 세로로 세워 제목이 히어로 폭 전체를 쓰고(1280 에서 잉크 701px, **1줄 유지**),
CTA 는 제목 **바로 아래 왼쪽**에 선다. 확정 수직 순서(①제목 ②CTA ③리드 ④검색 ⑤이어서)는 **DOM·시각 모두 불변**이다.

**파일** `pages/Landing/LandingPage/LandingPage.styled.ts` — `HeroBlock` **한 블록만** 고친다.

```ts
/**
 * 🔴 이 블록은 PageHero 의 내부를 바깥에서 겨냥한다. 그 대가를 알고 쓴다(스펙 D-1 취약점 4가지).
 * PageHero 파일은 다른 트랙이 미커밋 수정 중이라 편집 금지이고, 히어로를 이 페이지에서만 키울
 * 다른 경로가 없다.
 */
const LANDING_HERO_TITLE_FONT_SIZE = `clamp(${font.size['3xl']}, calc(0.6rem + 3.2vw), ${font.size['6xl']})`;
```

`HeroBlock` 안에 추가(기존 `display:grid; gap; min-width` 는 그대로):

```
  ${media.up('mobileWide')} {
    /* 1) 제목 줄을 세운다 — 제목이 폭 전체를 쓰고 CTA 가 아래 줄로 내려온다(DOM 순서 불변). */
    > header > div:first-of-type {
      flex-direction: column;
      align-items: stretch;
    }

    /* 2) 제목 크기. 히어로 공용 규칙(heroTitleFontSize)을 이 페이지에서만 덮는다. */
    > header h1 {
      font-size: ${LANDING_HERO_TITLE_FONT_SIZE};
    }

    /* 3) 아이콘 배지의 잉크 보정을 새 제목 크기로 다시 계산한다.
       PageHero 는 heroTitleFontSize(상한 30px) 기준으로 -3px 을 걸어 두는데, 제목이 44px 이면
       필요한 값은 -4.4px 다. 안 고치면 배지가 1.4px 낮게 앉는다(0.1em x (44-30)). */
    > header > div:first-of-type > div:first-of-type > span[aria-hidden] {
      transform: translateY(calc(${LANDING_HERO_TITLE_FONT_SIZE} * -0.1));
    }

    /* 4) CTA 는 더 이상 제목 줄이 아니다 — 제목 잉크 보정을 되돌리고 왼쪽에 붙인다. */
    > header > div:first-of-type > div + div {
      justify-content: flex-start;
    }
    > header > div:first-of-type > div + div > * {
      transform: none;
    }
  }
```

**왜 이게 먹히나(특이도)**: Emotion 은 이 블록을 `.css-heroBlock > header h1`(0-1-2)로 컴파일한다.
`HeroTitle` 자신의 클래스는 0-1-0 이라 **부모 클래스를 포함한 자손 선택자가 이긴다**
(`pitfalls.md` §I 2026-08-01 "Emotion 부모 styled 의 자손 선택자는 자식 컴포넌트 클래스를 항상 이긴다").
`!important` 는 쓰지 마라 — 필요 없고, 필요해졌다면 그건 선택자가 틀렸다는 신호다.

**🔴 이 방법의 취약점 4가지(정직하게)**

1. **PageHero 의 DOM 구조에 묶인다.** `header > div:first-of-type > div + div` 는 "히어로 제목 줄에
   자식이 정확히 둘(제목 그룹 · 액션)"임을 전제한다. 랜딩은 `titleAction` prop 을 넘기지 않으므로
   지금은 참이지만, PageHero 가 슬롯을 하나 더 렌더하면 **조용히 어긋난다**(에러 없음).
2. **정본 파일에서 안 보인다.** `PageHero.styled.ts` 만 읽는 사람은 `heroTitleFontSize` 를 믿는다.
   `HeroBlock` 주석에 "이 페이지의 h1 크기는 여기서 결정된다"를 반드시 남겨라.
3. **잉크 보정이 두 곳으로 갈린다.** 위 (3)은 `INK_ABOVE_LINE_BOX.display = 0.1` 을 **손으로 복제**한 값이다.
   `heroTitleRow.ts` 가 그 상수를 바꾸면 여기만 낡는다. 주석에 출처(`shared/styles/heroTitleRow.ts`)를 적어라.
4. **영구 해법이 아니다.** 옳은 해법은 `PageHero` 에 크기 변형(예: `scale='page' | 'landing'`)을 주는 것이고,
   그건 이번 트랙의 범위 밖이다 → §G-1.

**실측 검증(주입 시뮬레이션, 클래스 접두 선택자로 검증)**

| 폭 | h1 크기 | 줄 수 | 히어로 h | 시뮬레이터 CTA 하단 | 가로 오버플로 |
|---|---|---|---|---|---|
| 390 | 21.42px(**before 동일**) | 2 | 218(동일) | **258(동일)** | 0 |
| 641 | 30.11px | 1 | 183 | 247 | 0 |
| 768 | 33.70px | 1 | 195 | 253 | 0 |
| 1024 | 41.89px | 1 | 201 | 241 | 0 |
| 1280 | 44px | 1 | **140 → 207** | 253 | 0 |
| 1600 | 44px | 1 | 207 | 253 | 0 |

🔴 **≤640 은 선언 자체가 없다** — `media.up('mobileWide')` = `min-width: 641px`. 390×664 접힘 예산
(시뮬레이터 CTA 하단 258px)이 **바이트 단위로 동일**하다. 이 경계를 내리지 마라.
⚠ 상한 44px 을 올리지 마라 — 1280 에서 제목이 2줄이 되고(46px 부터), 2줄이 되는 순간 `HeroTitleGroup` 의
`align-items:center` 때문에 아이콘 배지가 **두 줄의 한가운데**로 내려간다(첫 줄 옆이 아니다).

**함께** `pages/Landing/components/LandingSearch/LandingSearch.styled.ts` `SearchInputWrap`:

```
-  color: ${color.textMuted};
+  /* 히어로에 딸린 줄이므로 페이지 정체색을 글리프 하나로 받는다(면·테두리는 중립 유지). */
+  color: ${color.identityText};
```

(입력 테두리는 `color.border` 유지 · `:focus-within` 의 `brandBorder` 유지 — 컨트롤 경계를
장식 플로어 토큰으로 바꾸지 않는다.)

**게이트**: 새 면 0(제목은 텍스트) · 새 대비 쌍 0(`identity-text`/`surface` 검증됨) · 모션 0 ·
`dialog` 0 · 오버플로 0(실측) · `data-landing-cta` 불변.

---

### D-2 여백 리듬을 그룹으로 바꾼다

**파일** `pages/Landing/LandingPage/LandingPage.styled.ts`

```
 export const LandingStack = styled.div`
   display: grid;
-  gap: clamp(32px, 4vw, 56px);
+  /* 그룹 경계. 그룹 안 간격(LandingGroup, 24~40px)의 정확히 2배 대역이라 "묶음"이 보인다. */
+  gap: clamp(48px, 6vw, 88px);
   min-width: 0;
 `;

+/**
+ * 서사 한 묶음. 랜드마크가 아니라 리듬 장치라 순수 div 다(heading·role 을 주지 마라 —
+ * 섹션마다 이미 <section aria-labelledby> 가 있고 여기에 이름을 붙이면 랜드마크가 이중이 된다).
+ */
+export const LandingGroup = styled.div`
+  display: grid;
+  gap: clamp(24px, 3vw, 40px);
+  min-width: 0;
+`;
```

**파일** `pages/Landing/LandingPage/LandingPage.view.tsx` — 래핑(§C-4 그룹 편성 그대로).
`HeroBlock` 과 `PageFooter` 는 `LandingStack` 직계 자식으로 남는다.

**게이트**: 면 0 · 모션 0 · 헤딩 계층 불변(div 는 접근성 트리에 영향 없음) ·
탭 순서 불변(DOM 순서 그대로).

---

### D-3 🔴 S3 개념 — 카드 3장을 구분선 격자로

**지금** `cardElevation('base')` 카드 3장(333×194), 카드 사이 갭 20px 안에 `→` 의사요소.
`design-taste-frontend` §9.C 가 금지하는 *"three identical cards horizontally"* 의 정확한 사례이고,
`craft-floor.md:24` 의 *"Same-size cards of icon plus heading plus text as the page structure"* 이기도 하다.

**바뀐 뒤** 상자를 지우고 **격자가 비교를 만든다**. 상단 1px 가로선 + 열 사이 1px 세로선.
`→` 의사요소는 **삭제**한다(세로선이 그 자리를 대신하고, 순서는 배지 숫자 1·2·3 이 말한다).

⚠ **직전 패스의 C-7(화살표를 16px `textSecondary` 로 키움)을 여기서 폐기한다.** 사유: 그 처방은
"카드 사이 갭에 놓인 타이포 연결자"를 전제했는데 갭 자체가 사라진다. 폐기는 의도이며 회귀가 아니다.
직전 패스의 C-2(`align-content: start`)는 **그대로 유지**한다.

**파일** `pages/Landing/components/ConceptLadder/ConceptLadder.styled.ts`

```
 export const ConceptGrid = styled.ol`
   display: grid;
-  gap: clamp(12px, 2vw, 20px);
   margin: 0;
   padding: 0;
   list-style: none;
   min-width: 0;
-  grid-template-columns: repeat(3, minmax(0, 1fr));
+  border-top: 1px solid ${color.border};
+
+  ${media.up('tablet')} {
+    grid-template-columns: repeat(3, minmax(0, 1fr));
+    column-gap: 0;
+  }

   ${media.down('tablet')} {
     grid-template-columns: minmax(0, 1fr);
+    row-gap: 0;
   }
 `;

 export const ConceptItem = styled.li`
   position: relative;
   display: grid;
   align-content: start;
   gap: ${space[2]};
   min-width: 0;
-  padding: clamp(16px, 2.4vw, 28px);
-  border-radius: ${radius.xl};
-  ${cardElevation('base')}
-
-  & + &::before { ... }            /* 화살표 의사요소 전체 삭제 */
+  padding: ${space[5]} clamp(16px, 2vw, 24px) 0;
+
+  ${media.up('tablet')} {
+    /* 열을 가르는 1px. 색이 유일한 신호가 아니다 - 같은 카드 안에 순서 배지 숫자가 있다. */
+    & + & {
+      border-left: 1px solid ${color.accentBorder};
+    }
+  }
+
+  ${media.down('tablet')} {
+    & + & {
+      border-top: 1px solid ${color.border};
+    }
+  }
 `;
```

`cardElevation`·`radius` import 가 이 파일에서 미사용이 되면 **지워라**(`noUnusedLocals` 로 빌드가 깨진다).
`media` 는 이미 import 되어 있다.

**순서 배지 톤 교체**(§C-3 tone 재배정과 짝):

```
 export const ConceptOrder = styled.span`
-  background: ${color.identitySubtle};
-  color: ${color.identityText};
+  background: ${color.accentSubtle};
+  color: ${color.accentText};
```

**실측(주입 시뮬레이션)**: S3 섹션 높이 **250 → 188**(@1280) · **499 → 422**(@390).

**게이트**: 카드 3개 제거(면 29 → 26) · 새 면 0 · `accent-text`/`accent-subtle` 검증됨 ·
`accentBorder` 는 중복 단서(숫자) 있음 · 모션 0 · 세로선은 `border` 라 tintscan 비대상.

---

### D-4 S4 복리 · S6 프리셋 — 등급 B 의 hue 룰

**파일** `pages/Landing/components/LandingSection/LandingSection.types.ts`

```ts
/** 이 섹션의 무게 등급. 스펙 C-1. 'chapter' 만 페이지 hue 룰을 갖는다. */
export type LandingSectionEmphasis = 'chapter' | 'support' | 'reference';
```
`LandingSectionProps` 에 `emphasis: LandingSectionEmphasis` 추가(**필수 prop** — 기본값을 두면 다음 사람이
등급을 정하지 않고 섹션을 추가한다).

**파일** `pages/Landing/components/LandingSection/LandingSection.styled.ts`

```
-export const SectionHead = styled.div`
+export const SectionHead = styled.div<{ $emphasis: LandingSectionEmphasis }>`
   display: flex;
   align-items: center;
   gap: ${space[3]};
   min-width: 0;
+
+  /* 등급 B(chapter)만 페이지 hue 룰을 갖는다. 2px 이라 tintscan 의 면 하한(높이 8px)에 걸리지 않고,
+     border 는 backgroundColor 만 보는 스캐너의 대상이 아니다(이중 안전). */
+  ${({ $emphasis }) =>
+    $emphasis === 'chapter'
+      ? `padding-bottom: ${space[3]}; border-bottom: 2px solid ${color.identity};`
+      : ''}
 `;
```

`LandingSection.tsx` 는 `<SectionBadge $tone={tone} …>` 옆에 `<SectionHead $emphasis={emphasis}>` 를 넘긴다.

**파일** `pages/Landing/LandingPage/LandingPage.view.tsx` — prop 배정(§C-1 표 그대로):

| 섹션 | `emphasis` | `tone` (before → after) |
|---|---|---|
| S3 concept | `support` | `identity` → **`accent`** |
| S4 compound | **`chapter`** | `accentAlt` → **`identity`** |
| S5 payout | `support` | `accent` → **`accentAlt`** |
| S6 presets | **`chapter`** | `identity` (유지) |
| S7 checklist | `support` | `accentAlt` → **`accent`** |
| S8 faq | `reference` | `neutral` → **`accentAlt`** |

**S4 칩에 색 주기** — `pages/Landing/components/CompoundExplainer/CompoundExplainer.styled.ts`

```
 export const FactorItem = styled.li`
   padding: ${space[1]} ${space[3]};
-  border: 1px solid ${color.border};
+  border: 1px solid ${color.identityBorder};
   border-radius: ${radius.pill};
   background: ${color.surface};
   font-size: ${font.size.xs};
-  color: ${color.textSecondary};
+  color: ${color.identityText};
 `;
```
(`identity-text`/`surface` 검증됨. 칩 안 낱말이 중복 단서.)

**게이트**: 새 면 0 · 새 대비 쌍 0(`identity`/`bg`·`identity`/`surface`·`identity-text`/`surface` 검증됨) ·
모션 0 · `neutral` 톤은 `LandingSection` 에서 소비처 0이 되지만 **TONE 맵에서 지우지 마라**
(`PresetBrowser` 의 '특화' 묶음이 같은 이름을 쓴다 — 두 파일은 별개 맵이다).

---

### D-5 🔴 S6 프리셋 — 4묶음을 갈라 놓는다

**지금** 묶음 머리 14px/w700 + 24px 배지, 묶음 사이 28px vs 카드 사이 20px(1.4배). 4묶음의 피치가
191·192·191px 로 균일해 "카드 8장 한 덩어리"로 읽힌다.

**바뀐 뒤** ①묶음 머리 아래 **1px 톤 룰** ②묶음 머리를 자기 격자에 **붙이고**(8px) 묶음 사이를 **41px** 로 벌린다
(비율 1.4 → **5.1배**). `layout.md:46` *"Group by meaning. Use proximity before adding containers."*

**파일** `pages/Landing/components/PresetBrowser/PresetBrowser.styled.ts`

```
 export const BrowserRoot = styled.div`
   display: grid;
-  gap: clamp(16px, 3vw, 28px);
+  gap: clamp(28px, 3.2vw, 44px);
   min-width: 0;
 `;

 export const GroupSection = styled.section`
   display: grid;
-  gap: ${space[3]};
+  gap: ${space[2]};
   min-width: 0;
 `;
```

`TONE` 맵 옆에 룰 색 맵을 추가하고 `GroupHead` 에 톤을 넘긴다.

```ts
/** 묶음 머리 아래 1px. 색이 유일한 신호가 아니다 - 묶음 이름과 배지 아이콘이 같은 줄에 있다. */
const RULE = {
  identity: color.identity,
  accent: color.accent,
  accentAlt: color.accentAlt,
  neutral: color.borderStrong
} as const satisfies Record<PresetGroupTone, string>;
```

```
-export const GroupHead = styled.div`
+export const GroupHead = styled.div<{ $tone: PresetGroupTone }>`
   display: flex;
   align-items: center;
   flex-wrap: wrap;
   gap: ${space[2]};
   min-width: 0;
+  padding-bottom: ${space[2]};
+  border-bottom: 1px solid ${({ $tone }) => RULE[$tone]};
 `;
```

`PresetBrowser.tsx:71` → `<GroupHead $tone={group.tone}>`.

⚠ 프리셋 카드(`PresetCard`)는 **카드로 남는다.** 각 항목이 독립 선택지라 상자가 정당한 유일한 자리다.
⚠ 초기 노출 2장 · 2열 · `ALLOCATION_BAR_MAX_WIDTH = 176px` 은 **확정**이다. 되돌리지 마라.

**게이트**: 새 면 0(1px 테두리) · `identity`/`accent`/`accent-alt` 는 전부 3:1 검증 대상 토큰이고
여기서는 배지가 중복 단서다 · 모션 0 · `MoreButton` 의 `pressTransition` 불변.

---

### D-6 🔴 S8 FAQ — 상자 8개를 구분선 목록으로, 그리고 마커에 색을

**지금** `details` 8개가 각자 1px 테두리 + 12px 라운드 + 흰 면. 섹션 522px, 유채 요소 **0개**.

**바뀐 뒤** 컨테이너 하나 + 행 사이 1px. 마커 `+`/`−` 가 `color.identity` 를 입어 섹션 오른쪽 끝에
8개의 색 점이 세로로 선다. 펼침 표시는 **글리프 모양**(`+`↔`−`)이 계속 1급 신호다.

⚠ **`[open]::before` 3px 좌측 레일을 삭제한다.** `craft-floor.md:34` 가 *"A colored `border-left`
above 1px on cards, list items, callouts, or alerts"* 를 금지하고, 상자가 사라지면 그 레일은 본문 왼쪽에
떠 있는 막대가 된다.

**파일** `pages/Landing/components/LandingFaq/LandingFaq.styled.ts`

```
 export const FaqList = styled.div`
   display: grid;
-  gap: ${space[2]};
+  gap: 0;
   min-width: 0;
+  border-top: 1px solid ${color.border};
 `;

 export const FaqItem = styled.details`
-  position: relative;
-  overflow: hidden;
-  border: 1px solid ${color.border};
-  border-radius: ${radius.md};
-  background: ${color.surface};
-
-  &[open] { border-color: ${color.borderStrong}; }
-  &[open]::before { ... }          /* 3px 레일 전체 삭제 */
+  border-bottom: 1px solid ${color.border};
 `;

 export const FaqSummary = styled.summary`
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: ${space[3]};
-  padding: ${space[3]} ${space[4]};
+  padding: ${space[3]} 0;
+  min-height: 44px;
   ...
   &::after {
     content: '+';
     ...
-    color: ${color.textMuted};
+    color: ${color.identity};
   }
 `;

 export const FaqAnswer = styled.div`
-  padding: 0 ${space[4]} ${space[4]};
+  padding: 0 0 ${space[4]};
 `;
```

`radius`·`pageHue` import 가 미사용이 되면 지워라.

**실측(주입 시뮬레이션)**: S8 **522 → 459**(@1280) · **514 → 451**(@390).

**게이트**: 카드 8개 제거(면 26 → 18) · 새 면 0 · `identity`/`bg` 검증됨(214-217) ·
마커는 글리프라 3:1 아이콘 플로어 적용 · 모션 0(`::after` 의 기존 `transform` 전이는 유지) ·
`<details>/<summary>` 네이티브 유지(커스텀 아코디언 금지) · 기본 전부 접힘 유지.

---

### D-7 S2 주요 지수 — 두 번째 자리에서 참조 구역으로

**지금** 히어로 바로 다음(top 376). 390 에서 **323px** 로 히어로 블록(282px)보다 크다.

**바뀐 뒤** G4(참조·마무리) 안, **FAQ 다음 · 마무리 CTA 앞**.

**근거 3가지**
1. 배당을 처음 접하는 사람에게 S&P 500 수치는 다음 행동을 만들지 않는다. 이 스트립의 역할은
   **"이 사이트는 살아 있는 데이터를 본다"는 신뢰 신호**이고, 그 신호는 서사가 끝난 뒤에 필요하다.
2. `index.html` 의 크롤러 셸 본문은 S1·S3·S4·S5·S7·FAQ 로 구성되고 **S2 를 포함하지 않는다** —
   "서사에서 빠진다"는 판단이 이미 한 번 내려져 있었다(`decisions.md` 2026-08-01 seo 항목).
3. 푸터 각주 `'지수 시세와 지급 월은 참고용이며 실시간 정보가 아닙니다.'` 와 **인접**하게 된다.
   지금은 그 각주가 3,300px 떨어진 곳에서 스트립을 설명한다.

**파일** `pages/Landing/LandingPage/LandingPage.view.tsx` — JSX 이동만. 컴포넌트·훅·조회 드라이버
(`useMarketIndicesSync`, 컨테이너 소유)는 **손대지 않는다**.

🔴 **가드 동반 수정** `test/landing/landingStructure.test.tsx:42-50` — h2 순서 배열에서 `'주요 지수'` 를
맨 앞에서 **맨 뒤**로 옮긴다:

```ts
const expected = [
  LANDING_COPY.concept.title,
  LANDING_COPY.compound.title,
  LANDING_COPY.payout.title,
  LANDING_COPY.presets.title(PORTFOLIO_PRESET_PLACEHOLDERS.length),
  LANDING_COPY.checklist.title,
  LANDING_COPY.faq.title,
  '주요 지수'
];
```

**게이트**: 면 개수 불변(스트립 셀은 `surfaceMuted` = 중립) · 탭 순서 = 시각 순서 유지 ·
`MarketIndexStrip` 파일 무변경.

---

### D-8 마무리 CTA — 페이지를 닫는다

**지금** 페이지의 마지막 인터랙티브 요소는 FAQ 8번째 `summary` 이고, 그 뒤는 곧바로 면책 푸터다.
닫는 액션이 **없다**.

**바뀐 뒤** 상단 2px `color.identity` 룰 + 한 줄 + primary 버튼 하나.
히어로의 4px hue 리본으로 열고 2px hue 룰로 닫는다(같은 어휘의 수미상관).

**신규 폴더** `pages/Landing/components/ClosingCta/`(`ClosingCta.tsx` · `ClosingCta.styled.ts` · `index.ts`),
`pages/Landing/components/index.ts` 에서 재수출.

```
ClosingRow = styled.div
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[4]};
  min-width: 0;
  padding-top: clamp(16px, 2.4vw, 24px);
  border-top: 2px solid ${color.identity};

ClosingNote = styled.p
  margin: 0;
  min-width: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;

ClosingLink = styled(Link)        /* S6 의 BrowserCta 와 같은 부품 어법 */
  display: inline-flex; align-items: center; gap: ${space[2]};
  flex: 0 0 auto;
  height: 44px; padding: 0 ${space[5]};
  border-radius: ${radius.sm};
  background: ${color.gradientCta};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.onBrand};
  text-decoration: none;
  transition: filter ${motion.fast} ${motion.ease}, ${pressTransition};
  ${pressable}
```

🔴 `color.onBrand` **필수**(흰색 하드코딩 금지 — velog·sunset·ink 다크에서 라벨이 반전된다).
🔴 `gradient-cta` 는 **버튼 채움 전용**이다(`gradient-aurora`·`gradient-hero` 와 교차 사용 금지).
🔴 이 요소는 `button, a` 안에 있으므로 tintscan 이 **누를 수 있는 것을 먼저 제외**한다(`tintscan.mjs:358`) —
전폭이 되어도 세 번째 면이 되지 않는다. 단 390 에서 전폭 CTA 가 면으로 잡힌 이력이 있으므로 §F 에서 반드시 재라.

**확정 카피** — `pages/Landing/copy/landingCopy.ts` 에 키 추가:

```ts
/**
 * 페이지를 닫는 한 줄. 🔴 라벨은 새로 만들지 않는다 — 한 의도에 한 라벨이라
 * 히어로 CTA 와 **같은 문자열**을 배열에서 읽는다(문구가 갈라질 수 없다).
 */
closing: {
  note: '지금까지 본 내용을 직접 계산해 보실 수 있습니다.'
},
```
버튼 라벨 = `LANDING_HERO_CTAS.find((cta) => cta.id === 'simulator')!.label`(= `'배당 계산 시작하기'`).

**계측** `trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_closing_simulator' })` — S6 `BrowserCta` 와 같은 방식.

🔴 **`data-landing-cta` 를 붙이지 마라.** `test/landing/landingStructure.test.tsx:88` 이 그 앵커가
정확히 2개임을 단정하고, 접힘 프로브가 그 속성으로 요소를 찾는다. 필요하면 `data-landing-closing-cta="simulator"`.
🔴 **헤딩을 주지 마라** — h2 순서 계약(D-7)과 헤딩 레벨 계약이 깨진다.

**게이트**: 면 0(버튼은 제외 대상, 그래도 §F 에서 실측) · `on-brand`/`cta-stop-*` 검증됨(193-195) ·
모션 = 누름·호버뿐 · 헤딩 계층 불변 · `dialog` 0.

---

### D-9 타입 램프 마감 — 카드 제목 한 크기

**파일** `pages/Landing/components/ConceptLadder/ConceptLadder.styled.ts`

```
 export const ConceptTitle = styled.h3`
-  font-size: ${font.size.lg};      /* 16px */
+  font-size: ${font.size.base};    /* 14px - 랜딩의 카드 제목은 한 크기다(스펙 C-2 D3) */
 `;
```

이 한 줄로 랜딩의 `h3`/`h4` 가 **전부 14px** 이 된다(`GroupTitle`·`PresetTitle`·`FactorTitle`·
`ChecklistTitle` 은 이미 `font.size.base`). 390 의 `h2 16 / h3 16` 붕괴가 `16 / 14` 로 풀린다.

**게이트**: 색·면·모션 무관. `index.html` 셸에는 `h3` 크기 선언이 없어 동반 수정 불필요.

---

### D-10 반응형 규칙 (변경 후 최종 상태)

| 폭 | S1 히어로 | S3 개념 | S5 리듬 | S6 프리셋 | S7 준비 | S8 FAQ | S2 지수 |
|---|---|---|---|---|---|---|---|
| ≥1281 | 제목 44px · CTA 아랫줄 | **3열 + 세로 구분선** | 3열 subgrid | 2열 | 2열 | 1열 구분선 | auto-fit |
| 981–1280 | 제목 30→44 유동 · CTA 아랫줄 | 3열 + 세로 구분선 | 3열 subgrid | 2열 | 2열 | 1열 구분선 | auto-fit |
| 821–980 | 동일 | 3열 + 세로 구분선 | 3열 subgrid | 2열 | 2열 | 1열 구분선 | auto-fit |
| 761–820 (`tablet`↓) | 동일 | **1열 + 가로 구분선** | 3열 subgrid | 2열 | **1열** | 1열 구분선 | auto-fit |
| 641–760 (`tabletSm`↓) | 동일 | 1열 + 가로 구분선 | **라벨 윗줄 + 12칸 전폭** | **1열** | 1열 | 1열 구분선 | auto-fit |
| ≤640 (`mobileWide`↓) | **before 그대로**(제목 clamp 20–30 · CTA 전폭 · 접힘 예산 258px) | 1열 + 가로 구분선 | 라벨 윗줄 | 1열 | 1열 | 1열 구분선 | 2열 |

**접히는 것** = 열 수, S3 구분선의 방향(세로→가로), 히어로 제목 줄의 배치.
**사라지는 콘텐츠는 어느 폭에서도 0개다.**

### D-11 접근성 체크리스트 (구현자가 확인할 것)

- **키보드 이동**: 새 포커서블은 `ClosingCta` 하나. DOM 순서 = 시각 순서 = 탭 순서. S2 이동으로
  탭 순서도 함께 내려간다(시각과 계속 일치).
- **포커스 표시**: `ClosingCta` 는 전역 `:focus-visible` 규칙을 받는다 — 로컬에서 `outline: none` 을 쓰지 마라.
- **라벨-입력 연결**: 검색은 기존 `VisuallyHiddenLabel` 유지(placeholder 는 접근명이 아니다).
- **포커스 트랩**: 이 화면에 모달이 없으므로 트랩도 없다. `role="dialog"` 0 유지.
- **색만으로 정보 전달 금지**: §C-3 하단 중복 단서 표의 5행을 전부 확인.
- **헤딩 계층**: h1 1개 → h2 7개 → h3 → h4. `LandingGroup`(div)·`ClosingCta`(heading 없음)는 무영향.
- **터치 타깃**: `FaqSummary` 에 `min-height: 44px` 를 명시(상자를 지우면서 패딩만으로는 44px 이 보장되지 않는다).
- **`prefers-reduced-motion`**: 새 애니메이션이 0건이라 추가 분기 없음.

---

## E. 기각한 처방 (§3 판정표에 **없던** 새 판정만)

| 출처 | 처방 | 판정 | 사유 |
|---|---|---|---|
| `design-taste-frontend` §9.G | **em-dash(`—`) 전면 금지** → `구성 비중 — SCHD 40% …`, 스펙 문서 전반 | **기각** | 한국어 조판에서 줄표는 LLM 표식이 아니라 정상 문장부호이고, 이 레포는 카피·주석·지식 기반 전역이 그 관례다. 게다가 `formatAllocationText` 문자열은 카피 정확일치 계약의 대상이라 바꾸면 가드가 함께 흔들린다. 이득 0, 위험 있음. |
| `design-taste-frontend` §9.F | **"scoring/progress bars with filled background tracks 금지"** → S6 비중 막대 삭제 | **기각(재확인·강한 금지)** | 이 페이지에서 색 면적을 가장 크게 줄이는 안이고 `user-profile.md:3` 과 정면 충돌한다. 같은 처방이 2026-08-01 에 이미 사용자 취향 우선으로 기각됐다(`decisions.md` 랜딩 §, C-1). **다시 꺼내지 마라.** |
| `design-taste-frontend` §4.7 | **HERO STACK DISCIPLINE — 히어로 텍스트 요소 최대 4개, CTA 아래 부가 요소 금지** | **기각** | 랜딩 히어로는 제목·CTA·리드·검색·(조건부)이어서 = 5요소다. 그러나 히어로 수직 순서와 검색의 위치는 **확정 결정**(`decisions.md` 2026-08-01)이고, 검색은 장식 태그라인이 아니라 이 지면의 **두 번째 진입 경로**다. |
| `design-taste-frontend` §4.8 | **"Hero needs a real visual / 텍스트 전용 페이지는 미완성"** → 히어로 이미지·생성 이미지 도입 | **기각** | 이 앱에는 이미지 표면이 0개이고(아바타도 이니셜), 금융 계산기의 히어로에 스톡 사진을 넣는 것은 신뢰를 깎는다. `craft-floor.md:44` 의 "Real illustration or none" 과도 충돌하지 않는 쪽 = none. |
| `design-taste-frontend` §4.4 / `craft-floor.md:43` | **Card radii 12–16px 상한** → `radius.xl`(20px) 축소 | **기각(재확인)** | `surfaces.ts` 의 동심 반경 체계가 의도적 초과를 이미 문서화했다. 랜딩만 다른 반경을 쓰면 SHAPE CONSISTENCY LOCK 이 깨진다. |
| `make-interfaces-feel-better` §3 / `surfaces.md` | **"Shadows instead of borders"** → 카드 1px 테두리를 3겹 그림자로 | **기각** | `decisions.md` 2026-07-31 "한 카드는 테두리와 그림자 중 하나만 갖는다"의 정본은 `cardElevation(tier)` 이고 `base` 는 테두리다. 랜딩만 그림자로 가면 전 페이지가 두 어법이 된다. |
| `make-interfaces-feel-better` §11 / `surfaces.md` | **이미지 1px outline** | **무관** | 랜딩에 `<img>` 가 0개다. |
| `apple-design` §15 | **"Tracking is size-specific — a fixed letter-spacing is wrong somewhere"** | **채택했으나 변경 0** | 실측(A-2)상 h1 −0.03em · h2 −0.02em · h3 normal 로 **이미 크기별로 옳다**. 진단하고 손대지 않는 것이 결론이다. |
| `apple-design` §12 · `high-end-visual-design` §4A | **translucent material · Double-Bezel(중첩 면)** | **기각** | `Card` 의 `contain` 에 잘리고, 중첩 면은 "Card 안 Card 금지"와 충돌한다. |
| `emil-design-eng` 전반 | **spring · 인터럽터블 · stagger · clip-path 연출** | **기각(범위)** | 랜딩 모션 예산 = 호버·누름·`<details>` 뿐(확정). 이 스킬의 채택분은 "Before/After 표로 보고한다"는 형식과 *"unseen details compound"* 관점뿐이다. |
| `impeccable/bolder.md` | **"quiet everything around it"** 을 채도 제거로 집행 | **부분 기각** | "조용히"는 **구조(룰·여백)** 로 집행하고 채도는 전 섹션에 준다. 사용자 확정 취향이 스킬보다 위다(§C-0). |
| `impeccable/onboard.md` | 첫 사용 안내·툴팁·"Skip" 등 온보딩 장치 | **기각** | 랜딩은 온보딩 화면이 아니라 첫인상 지면이고, 오버레이·투어는 확정 금지다. 이 스킬에서 살아남은 것은 *"Empty states are onboarding opportunities"* 뿐인데 랜딩에 빈 상태가 없다(검색 무결과 폴백은 이미 3종 구현됨). |
| `impeccable/delight.md` | 축하·발견 연출 | **기각(재확인)** | *"Do not manufacture a celebration for an ordinary click."* 스크롤은 first use/completion/recovery/mastery 중 무엇도 아니다. |
| `impeccable/operate.md` §Typography | **"One family is often right"** → display 폐지 | **기각** | 서체 4역할은 확정(라이선스·서브셋 파이프라인 포함). 또한 랜딩은 Operate 표면이 아니라 **Persuade** 표면이다(§G-3 참고). |
| — | S6 '특화' 묶음의 `neutral` 톤을 `brand` 로 승격해 4묶음 모두 유채로 | **기각** | `brand` 램프는 **인터랙션·활성 축**으로 확정돼 있어 장식 배지에 쓰면 "브랜드색 = 누를 수 있는 것"이 흐려진다. 게다가 `/` 의 page hue(identity)와 같은 쿨 블루라 한 섹션에 파랑이 둘이 된다. `neutral` 묶음의 룰은 `borderStrong` 으로 두되, 톤 자체의 변경은 `shared/constants/portfolioPresets` 소관이라 §G-4. |
| — | 섹션 배지를 페이지 hue 단색으로 통일 | **기각(재확인)** | `user-profile.md:3`. |
| — | `tintscan` 의 면 하한·상한 조정 | **기각(재확인)** | 3라우트가 공유하는 계약이다. |

---

## F. 검증 계획

### F-1 게이트 (전부 exit 0)

```sh
npx tsc -b tsconfig.build.json
npx vitest run test/landing test/seo
node tools/dev/styled-comment-backticks.mjs
MSYS_NO_PATHCONV=1 node tools/dev/tintscan.mjs --url http://localhost:5199 --route / --width 1280,390 --port <빈포트>
MSYS_NO_PATHCONV=1 node tools/dev/overflowprobe.mjs --base http://localhost:5199 --routes "/" --port <빈포트>
MSYS_NO_PATHCONV=1 node tools/dev/headerprobe.mjs --base http://localhost:5199 --port <빈포트>
```

⚠ `npm run api:bundle` · `npm run verify` 는 **트랙 작업 중에 돌리지 마라**(다른 트랙 산출물을 되돌린다).
⚠ 프로브 첫 줄이 `launched` 인지 `attached` 인지 확인하라 — `attached` 면 남의 브라우저다.
⚠ `tintscan` 만 `--url`, 나머지는 `--base` 다. 출력 첫 줄의 베이스 URL 이 5199 인지 눈으로 확인하라.

| 지표 | before | after 기대 |
|---|---|---|
| `tintscan /` @1280 | **2개**(header 1040×140 gradient-hero · div 1040×219 gradient-hero-soft) | **2개**(같은 둘. 히어로는 1040×**207**) |
| `tintscan /` @390 | **2개**(358×218 · 358×493) | **2개** — 🔴 마무리 CTA 가 전폭이 되므로 여기서 3개가 나오면 `ClosingLink` 를 `flex: 0 0 auto` 로 묶어라 |
| `overflowprobe /` @390·@360 | 새는 요소 0 | 0 |
| `headerprobe /` @1280 / @390 | 65px / 111px | 불변 |

### F-2 실측 회귀 (`uiprobe --eval`, 복붙 가능)

```sh
# ① 히어로 지배력 — 히어로 높이와 h1 크기·줄 수  (before @1280: heroH 140 · 30px · 1줄)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 390,641,1024,1280 --port 9412 --wait 6000 \
  --eval "(()=>{const h=document.querySelector('main header');const t=document.querySelector('main h1');const r=document.createRange();r.selectNodeContents(t);const c=document.querySelector('[data-landing-cta=simulator]').getBoundingClientRect();return {w:innerWidth,heroH:Math.round(h.getBoundingClientRect().height),fs:getComputedStyle(t).fontSize,lines:r.getClientRects().length,ctaBottom:Math.round(c.bottom+scrollY),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()"
```
기대: 390 → `heroH 218 · 21.42px · 2줄 · ctaBottom 258 · overflow 0`(**before 와 완전 동일**) ·
641 → `183 · 30.11px · 1줄` · 1024 → `201 · 41.89px · 1줄` · 1280 → `207 · 44px · 1줄 · overflow 0`.

```sh
# ② 여백 리듬 — 그룹 경계와 그룹 안 간격이 갈리는가  (before: 8곳 전부 50.6px @1280 / 32px @390)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280,390 --port 9412 --wait 6000 \
  --eval "(()=>{const s=document.querySelector('main').firstElementChild;const g=[...s.children].map(e=>({tag:e.tagName,h:Math.round(e.getBoundingClientRect().height)}));return {w:innerWidth,stackGap:getComputedStyle(s).gap,groupGaps:[...s.children].filter(e=>e.tagName==='DIV'&&e.children.length>1).map(e=>getComputedStyle(e).gap),children:g};})()"
```
기대 @1280: `stackGap "76.8px"` · 그룹 내부 gap `"38.4px"` ×3 · `LandingStack` 자식 5개(HeroBlock·G2·G3·G4·FOOTER).
기대 @390: `48px` / `24px`.

```sh
# ③ 타입 램프 — h1/h2/h3 단차  (before @1280 30/18/16 · @390 21.42/16/16)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280,390 --port 9412 --wait 6000 \
  --eval "[...document.querySelectorAll('main h1,main h2,main h3')].map(e=>{const c=getComputedStyle(e);return e.tagName+' '+e.textContent.trim().slice(0,8)+' | '+c.fontSize+' w'+c.fontWeight+' ls'+c.letterSpacing;}).slice(0,12)"
```
기대: `H1 … 44px`(@1280) / `21.42px`(@390) · `H2 … 18px`/`16px` · **`H3 … 14px`(전부)** —
`H3` 에 16px 이 하나라도 남으면 D-9 미적용이다.

```sh
# ④ 카드 탈출 — main 안 상자 개수  (before 29)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280 --port 9412 --wait 6000 \
  --eval "[...document.querySelectorAll('main *')].filter(e=>{const c=getComputedStyle(e);const b=e.getBoundingClientRect();const bg=c.backgroundColor!=='rgba(0, 0, 0, 0)';const bd=parseFloat(c.borderTopWidth)>0&&parseFloat(c.borderLeftWidth)>0;const sh=c.boxShadow!=='none';return (bg||bd||sh)&&b.width>=120&&b.height>=48;}).length"
```
기대: **29 → 18**(S3 카드 3 · FAQ 8 제거. 남는 것 = 히어로 1 · 지수 셀 5 · S4 FactorCard 1 ·
S5 카드 1 · S6 카드 8 · S7 카드 1 · 푸터 1 = 18).

```sh
# ⑤ 색 분포 — 섹션별 유채 요소 개수  (before  S1 3 · S2 5 · S3 5 · S4 3 · S5 23 · S6 48 · S7 2 · S8 0 · 푸터 0)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280 --port 9412 --wait 6000 \
  --eval "(()=>{const p=(s)=>{if(!s)return null;let m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:[,/]\s*([\d.]+))?\)/.exec(s);if(m){const a=m[4]===undefined?1:+m[4];return a<0.25?null:[+m[1],+m[2],+m[3]];}m=/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/.exec(s);if(m){const a=m[4]===undefined?1:+m[4];return a<0.25?null:[+m[1]*255,+m[2]*255,+m[3]*255];}return null;};const ch=(s)=>{const v=p(s);return v?Math.max(...v)-Math.min(...v):0;};const st=document.querySelector('main').firstElementChild;const secs=[...st.querySelectorAll(':scope > section, :scope > div, :scope > footer')];return secs.map((sec,i)=>{let n=0;for(const el of [sec,...sec.querySelectorAll('*')]){const c=getComputedStyle(el);const b=el.getBoundingClientRect();if(b.width===0||b.height===0)continue;const ink=(el.textContent||'').trim()!==''||el.querySelector(':scope > svg');if((ink&&ch(c.color)>=24)||ch(c.backgroundColor)>=24||(parseFloat(c.borderTopWidth)>0&&ch(c.borderTopColor)>=24)||(parseFloat(c.borderLeftWidth)>0&&ch(c.borderLeftColor)>=24)||(parseFloat(c.borderBottomWidth)>0&&ch(c.borderBottomColor)>=24))n++;}return {i,name:(sec.textContent||'').trim().slice(0,9),chromatic:n};});})()"
```
🔴 **합격 조건: 유채 요소 0개인 섹션이 하나도 없을 것**(before 2개: S8·푸터).
기대 최소치 — S3 ≥8(배지 1 + 순서 3 + 세로선 2 + 카드 텍스트) · S4 ≥7(배지 1 + 룰 1 + 칩 4) ·
S7 ≥2 · **S8 ≥9**(배지 1 + 마커 8) · S6 ≥52(before 48 + 룰 4). 푸터는 여전히 0이나
`PageFooter` 는 편집 금지라 대상 밖이다.

```sh
# ⑥ S6 묶음 갈림 — 묶음 사이 vs 카드 사이 비율  (before 28 / 20 = 1.4배)
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280 --port 9412 --wait 6000 \
  --eval "(()=>{const sec=[...document.querySelectorAll('main section')].find(s=>/많이 쓰는/.test(s.querySelector('h2')?.textContent||''));const root=sec.querySelector('section').parentElement;const grid=sec.querySelector('ul');const heads=[...sec.querySelectorAll('h3')].map(h=>{const hd=h.parentElement;const c=getComputedStyle(hd);return {t:h.textContent.trim(),rule:c.borderBottomWidth+' '+c.borderBottomColor};});return {groupGap:getComputedStyle(root).gap,headToGrid:getComputedStyle(sec.querySelector('section')).gap,cardGap:getComputedStyle(grid).gap,heads};})()"
```
기대: `groupGap "40.96px"` · `headToGrid "8px"` · `cardGap "20px"` · 묶음 룰 4개가 **서로 다른 색**.

```sh
# ⑦ 문서 높이 (before @1280 3670 · @390 5065) — 크게 어긋나면 어딘가 의도치 않은 여백이 생긴 것
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280,390 --port 9412 --wait 6000 \
  --eval "({w:innerWidth,docH:document.documentElement.scrollHeight})"
```
기대 @1280: **3,650~3,760**(히어로 +67 · S3 −62 · FAQ −63 · 리듬 +94 의 합).
이 대역을 벗어나면 그룹 래핑이 잘못됐거나 남은 카드 패딩이 있다.

### F-3 눈으로 (필수 — 안 보고 쓴 검증은 무효)

```sh
node tools/dev/uiprobe.mjs --url http://localhost:5199/ --width 1280,390 --port 9412 --wait 6000 --shot C:/…/scratchpad/rw-after.png
```
⚠ `--shot` 경로에는 `MSYS_NO_PATHCONV=1` 을 **붙이지 마라**(드라이브 루트에 조용히 떨어진다).
반드시 이미지를 **열어서** 확인:

1. 첫 화면에서 제일 먼저 읽히는 것이 히어로 제목인가. CTA 가 제목 바로 아래에 있는가.
2. S4·S6 의 제목 아래 2px 파란 룰이 보이는가. 나머지 섹션에는 **없는가**.
3. S3 이 상자가 아니라 격자로 읽히는가. 세로선이 보이는가(너무 옅으면 §G-2).
4. S6 의 네 묶음이 눈으로 갈리는가.
5. FAQ 가 목록으로 읽히는가. 마커 8개의 색이 보이는가.
6. 페이지가 CTA 로 닫히는가.
7. **다크 모드 + 프리셋 2~3종 전환** 후에도 1~6이 유지되는가(특히 `identity` 룰과 FAQ 마커).

---

## G. 사용자·오케스트레이터 판단이 필요한 것 (실행하지 않았다)

1. **`PageHero` 에 크기 변형 prop 을 주는 것**(예: `scale='page' | 'landing'`). D-1 의 자손 선택자 override 는
   **정본에서 안 보이는 결합**이고 PageHero 의 DOM 구조에 묶인다. 영구 해법은 히어로 자신이 크기를 소유하는
   것인데 `components/common/PageHero` 는 이번 트랙 편집 금지다. **배치 종료 후 별도 트랙 권고.**
2. **`accentBorder` / `identityBorder`(장식 플로어 1.44~2.70:1)를 구분선에 쓰는 것.** 이 스펙은 항상 색 배지·
   숫자라는 중복 단서를 함께 두어 "테두리가 톤을 말하는 유일한 신호"가 되지 않게 했다. 리뷰어가 그래도
   3:1 을 요구하면 표시색(`accent`/`identity`)으로 올리거나 `contrast.test.ts` 에 `['accent','bg']`·
   `['accent-alt','bg']` 두 쌍을 추가해야 하는데, **후자는 `shared/styles` 편집이라 이 트랙 범위 밖**이다.
3. **`sectionTitleFontSize`(전 페이지 공통 h2 규칙)를 랜딩에서 키우지 않았다.** 390 의 h2↔h3 단차가
   1.14배에 머무는 근본 원인이다. 랜딩은 이 앱의 유일한 **Persuade 표면**(나머지는 Operate)이라
   챕터 제목에 더 큰 램프를 줄 근거가 있지만, 그 규칙은 2026-07-29 확정 결정이므로 **뒤집지 않았다.**
   뒤집는다면 랜딩 전용 `landingChapterFontSize`(같은 clamp 형태, 상한 22~24px)를 랜딩 로컬에 두는 형태를 권고.
4. **헤딩에 `font.sans` 를 쓰는 것.** A-3 실측상 `Snowball Display` 는 400~800 잉크가 **완전히 동일**해
   헤딩 위계에서 굵기 축을 쓸 수 없다. 카드 제목(`h3`)만 `font.sans` 600 으로 내리면 위계가 즉시 살아나지만,
   `globalStyles.ts:130-143` 이 "페이지별 styled 가 font-family 를 박기 시작하면 역할이 흩어진다"고
   명시 금지하고 `decisions.md` 2026-07-28 이 "h1~h6 전역 1지점"을 확정으로 적었다. **뒤집지 않았다.**
5. **S6 '특화' 묶음의 `neutral` 톤.** 네 묶음 중 하나만 무채라 새 룰에서도 회색 선을 갖는다. 톤은
   `shared/constants/portfolioPresets/*.constants.ts` 소유(랜딩 범위 밖)이고 시뮬레이터 보드와 공유한다.
   유채로 바꾸려면 그 파일과 시뮬레이터 화면을 함께 판단해야 한다.
6. **S2 의 새 자리 — FAQ 뒤 vs 마무리 CTA 뒤.** 이 스펙은 `FAQ → S2 → 마무리 CTA`(페이지가 액션으로 닫힌다)를
   택했다. 대안은 `FAQ → 마무리 CTA → S2`(액션 뒤에 시세가 잔향처럼 남는다). **JSX 한 줄 이동이라 A/B 가 싸다** —
   사용자가 두 스샷을 보고 고르는 것을 권고.
7. **문서 높이 +약 30px(1280 기준 3670 → 약 3700).** 여백 리듬 강화(+94)가 카드 제거(−125)와 히어로 확대(+67)를
   상쇄한 결과다. 랜딩이 더 짧아야 한다는 요구가 있으면 S6 의 초기 노출 2장(확정) 또는 FAQ 문항 수를
   건드려야 하고 **둘 다 확정 결정**이라 이 스펙에서는 손대지 않았다.

---

## 다음 담당

- **구현**: `frontend-engineer` — D-1 ~ D-9 전부. 상태(atom) 변경 0건이라 `state-engineer` 불필요.
- **가드**: `qa-tester` — D-7 의 `landingStructure.test.tsx` h2 순서 배열 갱신,
  마무리 CTA 의 **풀 카피 정확일치** 계약(부분일치는 축약 회귀를 무음 통과시킨 이력),
  `data-landing-cta` 가 여전히 2개임을 단정. 좌표·색은 jsdom 이 못 보므로 §F-2 를 uiprobe 로 남길지 판단.
- **리뷰**: `reviewer` — 특히 ①D-1 의 자손 선택자가 `!important` 없이 실제로 이기는지 ②새 대비 쌍이
  0개인지 ③틴트 면이 1280·390 둘 다 2개인지 ④`landingDataDiscipline.test.ts` 의 금지 필드가 늘지 않았는지.
