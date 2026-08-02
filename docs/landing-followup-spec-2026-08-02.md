# 랜딩 후속 스펙 — 주요 지수 스트립 개선 · 지급월 트랙 대비 강화 (2026-08-02)

> ## 🔴 집행 현황 (2026-08-02 심야 갱신 — 착수 전에 이것부터 읽어라)
> **이 스펙의 전제가 하나 무너졌다: 스트립은 더 이상 랜딩에 없다.** 같은 날 랜딩 → 앱 헤더 →
> **시세가 실제로 쓰이는 세 화면(시뮬레이터·내 포트폴리오·배당 캘린더)의 본문 맨 위**로 최종 이동했고,
> 형태도 카드 격자에서 **가로 한 줄 티커**로 바뀌었다. 경위와 실측 근거는 `.claude/knowledge/decisions.md`
> 의 「주요 지수 스트립의 자리」, 자리 계약은 `test/shared/marketIndexStripPlacement.test.ts`.
>
> | 항목 | 상태 |
> |---|---|
> | §D-1 스트립을 G1 그룹으로 | ⛔ **폐기** — 랜딩에서 빠졌다 |
> | §D-2 셀 압축 92→74px | ⛔ **폐기** — 3열 그리드 셀 자체가 없어졌다(한 줄 티커) |
> | §D-3 방향 글리프 ▲/▼ | ✅ **집행**(글리프만). **우측 정렬은 폐기** — `justify-self` 는 flex 한 줄 티커에서 무시된다 |
> | §D-4 12칸 트랙 링 · §D-5 범례 카피 | ✅ 집행됨(랜딩 `PayoutRhythm`, 이 이동과 무관) |
> | §D-6 스트립 메타 카피 | ✅ **집행** — 최종 문구는 `'전일 대비 · 실시간이 아닌 참고용 시세'` |
>
> §A 의 before/after 수치와 §E 의 폭 계산은 **카드 격자 시절의 것**이라 지금 화면과 대조하지 마라.

> **구현 지시서**다. 설계는 `ui-ux-designer`, 집행은 `frontend-engineer`, 가드는 `qa-tester`.
> 정본 `docs/landing-visual-language-spec.md`(1,014행)의 **§C-1 S2 행 · §C-4 그룹 편성 · §D-7 전체**를
> **이 문서가 덮어쓴다**(사용자 결정으로 S2 를 다시 위로 올렸다). 그 밖의 §C·§D·§E 는 전부 유효하다.
>
> 대상 파일은 **6개뿐**이다:
> `components/MarketIndexStrip/{MarketIndexStrip.tsx, MarketIndexStrip.styled.ts}` ·
> `shared/constants/marketIndex/copy.ts` ·
> `pages/Landing/LandingPage/LandingPage.view.tsx` ·
> `pages/Landing/components/PayoutRhythm/PayoutRhythm.styled.ts` ·
> `pages/Landing/copy/landingCopy.ts`.
> 🔴 `shared/styles/**` · `contrast.test.ts` · `tools/dev/**` · `shared/lib/marketIndices/**` 는 **한 줄도 고치지 않는다**
> (새 토큰 0 · 새 대비 쌍 0 · 새 hue 0 · 하드코딩 hex 0).

---

## 0. 착수 전에 알아야 할 것 — 이 스펙을 쓰는 동안 트리가 두 번 바뀌었다

측정 중 **다른 트랙이 같은 파일을 수정했다.** 착수 전에 아래 두 가지를 눈으로 확인하라.

| # | 사실 | 확인 방법 |
|---|---|---|
| 1 | `shared/lib/marketIndices/registry.ts` 에 **6번째 항목 `KRW=X 원/달러`(`unit: ' 원'`)** 가 추가됐다. 스트립은 이제 **5칸이 아니라 6칸**이다. `MarketIndexRow` 에 `unit: string` 필드가 생겼고 `MarketIndexStrip.tsx:59` 가 `row.unit` 을 읽는다. | `git diff shared/lib/marketIndices/registry.ts components/MarketIndexStrip` |
| 2 | **작업 1-a(스트립을 위로)는 이미 집행됐다** — `LandingPage.view.tsx:124` 의 `<MarketIndexStrip />` 가 **`HeroBlock` 안**, `HeroExtras` 다음에 있다. `test/landing/landingStructure.test.tsx:44` 의 h2 순서 배열도 `'주요 지수'` 를 맨 앞으로 이미 갱신했다. | `grep -n "MarketIndexStrip" pages/Landing/LandingPage/LandingPage.view.tsx` |

⚠ 이 스펙의 §D-1 은 그 배치를 **한 단계만 교정**한다(HeroBlock 안 → G1 `LandingGroup` 안). 되돌리는 것이 아니다.
⚠ §A 의 before 수치는 **위 두 변경이 모두 반영된 라이브 트리**에서 잰 값이다. 5칸 시절의 수치(정본 §A-1 의
`390 SECTION 445/323`)와 우연히 같은 자리가 있으나 근거는 다르다 — 6칸이 2열 3행이 된 결과다.

---

## A. before 실측표 (도구 출력. 형용사 0)

측정 환경: dev `http://localhost:5173`(기존 1개, 새로 띄우지 않았다) ·
`node tools/dev/uiprobe.mjs --port 9414 --wait 7000~8000` · `node tools/dev/tintscan.mjs --port 9415` · 2026-08-02.
기본 프리셋 `velog` / 라이트(별도 표기 없는 한).

### A-1 스크린샷 (전부 실제로 열어서 확인했다)

| 파일 | 내용 |
|---|---|
| `…/scratchpad/before-landing.1280.png` · `.390.png` | 이동 **전** 랜딩 전체(문서 3872 / 5207) |
| `…/scratchpad/before-s2s5.1280.png` · `.390.png` | 이동 **전** S5·S2 만 남긴 격리 컷 |
| `…/scratchpad/live-hero-strip.1280.png` · `.390.png` | **현재 라이브**(HeroBlock 안 배치) 첫 화면 |
| `…/scratchpad/after-C.1280.png` · `.641.png` · `.390.png` | 이 스펙의 처방을 주입한 결과 |
| `…/scratchpad/after-C-dark.png` · `after-C-ink.png` | 다크 · ink(무채 accentAlt) 검증 |
| `…/scratchpad/after-D.641.png` | **기각한 대안**(§E-1 b)이 무너지는 장면 |

`scratchpad` 절대 경로 =
`C:\Users\CkHong\AppData\Local\Temp\claude\c--Workspace-snowball-income\f87d2706-ad19-41bd-83a5-79a8ef68b3de\scratchpad`

### A-2 주요 지수 스트립 — 기하 (현재 라이브, 6칸)

```
1280  HeroBlock h 423 · gap 20px · strip top 412 · strip h 124 · cell 167x92
      ctaBottom 253 · G2(배우기) top 612 · docH 3854 · overflow 0
 390  HeroBlock h 617 · gap 12px · strip top 425 · strip h 323 · cell 175x92
      ctaBottom 258 · G2 top 796 · docH 5195 · overflow 0
```

폭별 스트립 높이 / 셀 폭 (높이는 배치와 무관하다):

| 폭 | 360 | 390 | 641 | 768 | 1024 | 1280 | 1600 |
|---|---|---|---|---|---|---|---|
| 열×행 | 2×3 | 2×3 | 3×2 | 3×2 | 6×1 | 6×1 | 6×1 |
| 셀 폭 | 160 | 175 | 141 | 167 | 148 | 167 | 167 |
| 셀 높이 | **92** | 92 | 92 | 92 | 92 | 92 | 92 |
| 스트립 h | **323** | **323** | **224** | **224** | **124** | **124** | **124** |

셀 내부(computed, 1280):

```
Item      padding 12px · gap 2px · bg rgb(248,249,250)=surface-muted · border 1px rgb(233,236,239)
Name      12px w500 rgb(73,80,87)  "Wanted Sans Variable"
Value     16px w700 rgb(33,37,41)  "Snowball Numeric", Inter   (tabular)
Change    13px w600 rgb(217,45,32) "Snowball Numeric", Inter   (up = data-positive)
List      grid auto-fit minmax(min(140px,100%),1fr) · gap 8px
```

🔴 **셀 면은 사실상 보이지 않는다.** `surface-muted` 대 페이지 `bg` 의 대비비:

```
velog/light  1.000  (둘 다 rgb(248,249,250) — 같은 색이다)
forest 1.072 · aurora 1.114 · vivid 1.095 · navy-gold 1.091 · grape 1.074 · sunset 1.056 · ink 1.054
다크 8종      1.193 ~ 1.244
```

즉 지금 타일을 타일로 보이게 하는 것은 **1px 테두리 하나뿐**이다. (이 사실이 §E-1 d 기각의 근거다.)

### A-3 12칸 지급 트랙 — 기하와 색 (현재 라이브)

```
1280  섹션 h 441 · top 958 · 트랙 x=305 w=819 · 칸 66.4x26 · 칸 사이 2px
 390  섹션 h 521 · 트랙 x=33  w=324 · 칸 25.2x26

지급 칸   bg rgb(231,245,236)=accent-alt-subtle · 글자 rgb(19,118,42)=accent-alt-text · w600 · 11px · radius 4px
미지급 칸 bg rgb(241,243,245)=surface-sunken   · 글자 rgb(95,105,117)=text-muted     · w400 · 11px · radius 4px
```

🔴 **면 대 면 대비 = 1.01 ~ 1.18:1 (16테마 전부).** 사용자 신고("구분이 약하다")의 수치적 실체다.

| 프리셋/모드 | 지급면↔미지급면 | 지급글자↔면 | 미지급글자↔면 | accent-alt↔미지급면 | accent-alt-border↔미지급면 |
|---|---|---|---|---|---|
| velog/light | **1.01** | 5.17 | 5.02 | 3.00 | 1.42 |
| velog/dark | 1.09 | 10.69 | 5.29 | 10.69 | 2.02 |
| forest/light | 1.07 | 4.79 | 4.71 | 2.75 | 1.31 |
| forest/dark | 1.10 | 11.66 | 6.30 | 11.66 | 2.07 |
| aurora/light | 1.04 | 4.88 | 5.06 | 2.84 | 1.34 |
| aurora/dark | 1.11 | 11.62 | 6.74 | 11.62 | 2.07 |
| vivid/light | 1.03 | 4.89 | 5.20 | 2.88 | 1.38 |
| vivid/dark | 1.08 | 12.15 | 6.44 | 12.15 | 2.02 |
| navy-gold/light | 1.04 | 4.91 | 5.01 | 2.86 | 1.35 |
| navy-gold/dark | 1.11 | 11.13 | 6.21 | 11.13 | 2.08 |
| grape/light | 1.11 | **4.60** | 5.08 | 2.69 | 1.27 |
| grape/dark | 1.08 | 11.11 | 5.91 | 11.11 | 2.02 |
| sunset/light | 1.06 | 4.74 | 5.37 | 2.78 | 1.30 |
| sunset/dark | 1.06 | 9.96 | 6.10 | 9.96 | 1.98 |
| ink/light | 1.08 | 6.69 | 5.72 | 4.35 | 1.19 |
| ink/dark | **1.18** | 10.10 | 5.75 | 7.37 | 1.94 |

두 가지를 읽어야 한다.
1. **면은 명도가 같다** — 회색조로 인쇄하거나 색을 못 보면 두 칸은 **같은 칸**이다.
2. **라이트 8종에서는 글자도 명도가 같다**(velog 5.17 vs 5.02). 라이트에서 지급/미지급을 가르는 것은
   사실상 **색상(hue) 하나 + 굵기 600↔400** 뿐이다.

### A-4 굵기 축이 실제로 있는가 (canvas, `await document.fonts.ready`, 100px, `"1 3 9"`, alpha>128 픽셀)

```
Snowball Numeric (Inter 서브셋)  400:3791  500:4549  600:5216  700:5873  800:6613
  advance                        218.95  218.75  218.65  218.46  218.26      (400→800 -0.3%)
Snowball Display (Gmarket 서브셋) 400:7527  500:7527  600:7527  700:7527  800:7527
  advance                        237.70 (전부 동일)
Wanted Sans Variable            400:3605  500:4258  600:4921  700:5555  800:6169
  advance                        214.06 → 225.68                            (400→800 +5.4%)
```

🔴 **브리핑의 전제를 부분 반증한다.** "Snowball Display 는 단일 굵기"는 **참**이지만(위 두 번째 줄),
`RhythmCell` 이 쓰는 서체는 **`font.dataNumeric`(= Snowball Numeric)** 이고 여기엔 **실재하는 굵기 축**이
있다(600 = +37.6%, 700 = +54.9% 잉크). 게다가 **자릿폭이 사실상 불변**(-0.3%)이라 굵기를 올려도
12칸 열이 어긋나지 않는다. → **이 트랙에서는 굵기를 신호로 써도 된다.** (Wanted Sans 로 굵혔다면
자릿폭이 5.4% 늘어 열이 밀렸을 것이다 — 서체 선택이 이미 옳게 되어 있다.)

### A-5 게이트 기준선

```
$ MSYS_NO_PATHCONV=1 node tools/dev/tintscan.mjs --url http://localhost:5173 --route / --width 1280,390 --port 9415
[tintscan] launched · 상한 2개 · 면 기준 >=180x8px · scope='main'
  1280px  ✓  2개  /   y=113  1040x207 header  gradient-hero
                      y=2719 1040x219 div     gradient-hero-soft
   390px  ✓  2개  /   y=131  358x218  header  gradient-hero
                      y=3784 358x493  div     gradient-hero-soft
```

**여유 0개.** 세 번째 면이 하나라도 생기면 즉시 exit 1 이다.

---

## B. 진단 → 처방 요약

| # | 진단(수치) | 처방 | 문서 위치 |
|---|---|---|---|
| 1 | 스트립이 히어로 클러스터에 12/20px 로 붙어 랜드마크가 검색줄로 읽힌다 | G1 `LandingGroup` 으로 한 단계 띄운다(24/38.4px) | §D-1 |
| 2 | 셀 92px × 6칸 → 390 에서 323px(히어로 블록 282px 초과) | 3줄 스택을 압축해 74px(-19.6%) | §D-2 |
| 3 | 등락 방향이 색 + 13px 부호 1글자뿐 | ▲/▼ 마크를 부호 왼쪽에 세운다(색 아님·모양) | §D-3 |
| 4 | 등락 **크기**를 읽는 채널이 없다 | 등락 슬롯을 **셀 우측 정렬** — 6칸의 오른쪽 끝이 한 줄로 서서 잉크 길이가 곧 자릿수 | §D-3 |
| 5 | 지급/미지급 면 대비 1.01~1.18:1(16테마) | 지급 칸에 **사방 1px `accentAltText` 링** + 굵기 600→**700** | §D-4 |
| 6 | 범례가 새 부호를 설명하지 않는다 | `legend` 카피 교체(격식체, 두 상태 모두 명시) | §D-5 |

---

## C. 확정 시각 규칙 (정본 §C 에 대한 델타)

### C-1 §C-1 위계 등급표 — S2 행 교체

| 섹션 | 등급 | 제목 크기 | hue 룰 | 배지 | 카드 | 여백 그룹 |
|---|---|---|---|---|---|---|
| S2 지수 | **D 참조 (불변)** | 자체 h2 13px (불변) | 없음 (불변) | 없음 (불변) | 셀 6 (내부만 변경) | **G4 → G1** |

🔴 **등급은 바뀌지 않는다.** 정본이 "등급이 만드는 차이는 셋뿐"이라고 못박은 세 축 중
**①제목 크기 ②hue 룰**은 그대로이고 **③여백 그룹 위치만** 바뀐다.
자리가 올라갔다고 등급을 올리면(제목을 키우거나 hue 룰을 주면) 히어로 바로 아래에서 챕터 둘이 경쟁한다.
**S2 에 `LandingSection`·`emphasis`·`tone`·배지를 주지 마라** — 자체 `section`+`h2` 를 이미 갖는다
(`MarketIndexStrip.styled.ts:11,29`).

### C-2 §C-4 그룹 편성 — G1 과 G4 교체

```
G1  무대       [HeroBlock(히어로+검색+이어서)] → [S2 주요 지수]     ← LandingGroup 래퍼 신설
G2  배우기     S3 개념 → S4 복리 → S5 리듬                          (불변)
G3  고르기     S6 프리셋 → S7 시작하기 전에                         (불변)
G4  참조·마무리 S8 FAQ → 마무리 CTA                                 (S2 가 빠진다)
    PageFooter                                                      (불변)
```

간격은 **기존 토큰 두 개를 그대로 쓴다**(새 값 0):

| 자리 | 값 | 1280 | 390 |
|---|---|---|---|
| 그룹 경계 `LandingStack` gap | `clamp(48px, 6vw, 88px)` | 75.9 | 48 |
| **G1 안 히어로↔지수** `LandingGroup` gap | `clamp(24px, 3vw, 40px)` | **38.4** | **24** |
| 히어로 안 제목↔검색 `HeroBlock` gap | `clamp(12px, 2vw, 20px)` | 20 | 12 |

### C-3 §C-3 색 배정표 — 두 행 교체

| 섹션 | 색이 붙는 자리 | 토큰 | 중복 단서(색이 유일한 채널이 아님) |
|---|---|---|---|
| S2 | 등락률 글자 + **▲/▼ 마크**(같은 색 상속) | `dataPositive`/`dataNegative`/`textSecondary`(**기존 맵 그대로**) | 부호 `+`/`-` · **글리프 모양 ▲↔▼** · `VisuallyHidden` 문장(`changeAria`) |
| S5 | 지급 칸 면·글자(**기존**) + **사방 1px 링** | `accentAltSubtle` + `accentAltText`(**둘 다 기존**) | **링의 유무(모양)** · **굵기 700↔400** · 행 요약 텍스트 · 행 `aria-label` · 범례 문장 |

🔴 **손익색을 새 표면으로 넓히지 않는다.** `dataPositive`/`dataNegative` 가 칠해지는 것은 **글자와 ▲/▼ 글리프뿐**이고,
배경 틴트·막대·칩 채움 어디에도 가지 않는다. `CHANGE_COLOR` 맵(`MarketIndexStrip.styled.ts:141-145`)의
값은 **한 글자도 바뀌지 않는다** — 적용 지점만 `Change` → `ChangeRow` 로 올라간다(§D-3).

**새로 필요한 대비 쌍 = 0개.**

| 새 신호 | 쌍 | 근거 |
|---|---|---|
| ▲/▼ 마크 | `data-positive`/`surface-muted` · `data-negative`/`surface-muted` | `shared/styles/contrast.test.ts:182,184` (이미 등락률 글자가 쓰던 그 쌍. 마크는 같은 색·같은 면) |
| 지급 칸 링 | `accent-alt-text`/`accent-alt-subtle` (칸 안쪽) | `shared/styles/contrast.test.ts:190` — 4.5:1 등급 |
| 지급 칸 링 | `accent-alt-text`/`surface` (칸 사이 2px 틈 · 카드 면) | `shared/styles/contrast.test.ts:189` — 4.5:1 등급 |
| 지급 칸 링 ↔ 이웃 미지급 칸 면 | (게이트 쌍 아님) | 실측 §A-3 3열: **최저 4.60(grape/light) · 최고 12.15(vivid/dark)** — 16테마 전부 비텍스트 플로어 3:1 을 크게 넘는다 |

⚠ **`accentAltBorder` 를 링에 쓰지 마라** — §A-3 마지막 열이 **1.19~2.08:1** 이다(장식 플로어).
⚠ **`accentAlt`(표시색)도 쓰지 마라** — 라이트 8종에서 2.69~3.00 으로 grape/light 가 3:1 **미달**이다.

---

## D. 처방 (파일·줄·토큰·문자열)

> 공통: 하드코딩 hex 0 · 새 토큰 0 · **모션 추가 0** · `role="dialog"` 0 · 폴더 단위 import ·
> Emotion `styled` · 격식체 · ⚠ `styled` 템플릿 **안** 주석에 백틱 금지.

---

### D-1 배치 — `HeroBlock` 안에서 **G1 `LandingGroup`** 으로 한 단계 꺼낸다

**파일** `pages/Landing/LandingPage/LandingPage.view.tsx`

```
   return (
     <LandingStack>
-      <HeroBlock>
-        …PageHero…
-        <HeroExtras>…</HeroExtras>
-        {/* S2 주석 */}
-        <MarketIndexStrip />
-      </HeroBlock>
+      {/* G1 무대 — 히어로 클러스터(제목·CTA·리드·검색·이어서)와 그 아래 오늘의 시세. */}
+      <LandingGroup>
+        <HeroBlock>
+          …PageHero…
+          <HeroExtras>…</HeroExtras>
+        </HeroBlock>
+
+        {/* S2 주석(아래 D-1 주석 본문으로 교체) */}
+        <MarketIndexStrip />
+      </LandingGroup>
```

`LandingGroup` 은 **이미 존재한다**(`LandingPage.styled.ts:32-36`). 새 styled 를 만들지 마라.

**왜 한 단계 꺼내는가 — 근거 3가지**

1. **`HeroBlock` 의 자기 계약을 어긴다.** 그 파일의 주석이 gap 을 이렇게 규정한다:
   *"간격이 섹션 리듬이 아니라 카드 리듬(clamp 12~20px)인 것이 요점이다 — 검색은 독립 섹션이 아니라
   **히어로에 딸린 줄**로 읽혀야 하고"*(`pages/Landing/LandingPage/LandingPage.styled.ts:52-56`).
   그런데 스트립은 **독립 섹션이다** — 자기 `<section aria-labelledby>` 와 `h2("주요 지수")` 를 갖는다
   (`components/MarketIndexStrip/MarketIndexStrip.styled.ts:11,29`). 랜드마크를 "히어로에 딸린 줄"의
   간격으로 붙이면 h2 가 검색 입력의 캡션처럼 읽힌다(실측: 390 에서 검색 하단↔`주요 지수` h2 상단 **12px**,
   1280 에서 **20px**. `live-hero-strip.390.png` 참조).
2. **네 번째 간격값이 생긴다.** 이 페이지의 세로 리듬은 의도적으로 **세 값**이다
   (75.9 그룹경계 / 38.4 그룹내 / 20 섹션내부, 정본 §C-4). 지금 배치는 랜드마크 하나만 20px 대역에 두어
   **랜드마크 간격이 두 벌**이 된다. G1 래핑은 그 값을 이미 있는 38.4/24 로 되돌린다.
3. **`HeroBlock` 의 위험 블록 범위를 좁게 유지한다.** `HeroBlock` 은 `media.up('mobileWide')` 안에서
   `> header > div:first-of-type > div + div` 같은 **PageHero 내부 DOM 을 바깥에서 겨냥하는** 선택자 4개를
   갖고 있다(같은 파일 74-101, 정본 §D-1 이 "취약점 4가지"로 적어 둔 그것). 그 블록이 사는 래퍼에는
   히어로와 히어로에 딸린 줄만 두는 편이 다음 사람에게 안전하다.

**접힘 예산 — 아무것도 나빠지지 않는다.** `LandingGroup` 은 grid 래퍼라 첫 자식의 top 이 그대로다.
실측(§F-2 ①): **`ctaBottom` @390 = 258px, before 와 바이트 단위로 동일.** 스트립은 CTA·리드·검색보다
**아래**이므로 정본 §D-1 의 "CTA 줄 **위**에 새 요소를 넣지 마라"에 걸리지 않는다.

**탭 순서 = 시각 순서**: 스트립에는 **포커서블이 0개**다(`MarketIndexStrip.styled.ts:58-59` — 셀은 링크도
버튼도 아니다). DOM 이동이므로 시각 순서와 자동으로 일치하고, 이동으로 탭 순서에 들어오거나 빠지는
요소는 없다.

**푸터 각주 처리** — 🔴 **지우지 마라.**
`LANDING_COPY.footnotes[1] = '지수 시세와 지급 월은 참고용이며 실시간 정보가 아닙니다.'`
(`pages/Landing/copy/landingCopy.ts:278`)는 **지수 시세와 S5 지급 월 둘 다**를 덮는 문장이다.
S5 는 계속 G2 에 있으므로 이 각주는 여전히 필요하고, 문장을 쪼개면 S5 를 설명하는 문장이 사라진다.
**중복 여부**: 스트립은 자기 헤더에 이미 `MARKET_INDEX_COPY.meta = '전일 대비 · 참고용 시세'` 를 갖는다
(`shared/constants/marketIndex/copy.ts:21`, 실측 헤더 높이 21px = 1줄, 390 에서도 1줄).
"참고용"은 중복이지만 **"실시간 정보가 아니다"는 스트립 안에 없다.** 스트립이 첫 화면으로 올라와
정직성 부담이 커졌으므로 **메타 한 줄을 확장한다**(§D-6). 각주는 그대로 둔다 — 근접 고지(스트립)와
문서 각주(푸터)는 층이 다르고, 둘 다 있는 것이 이 앱의 관례다.

**S2 주석 본문(그대로 붙여라)**

```
{/*
 * S2 — 주요 지수. 🔴 카드로 감싸지 않는다: Root 가 투명이고 셀이 각자 검증된 면을 갖는다.
 * 자체 section + h2("주요 지수")를 이미 갖고 있어 LandingSection 으로 감싸면 랜드마크가 이중이 된다.
 * 조회 드라이버(useMarketIndicesSync)는 컨테이너가 한 번만 부른다 — 여기서 부르면 중복 조회다.
 *
 * 🔴 **자리 이력**: 두 번째 → 2026-08-01 FAQ 뒤 → 2026-08-02 사용자 결정으로 다시 히어로 아래.
 *    다만 HeroBlock **안**이 아니라 G1 그룹의 **두 번째 자식**이다 — 스트립은 자기 h2 를 가진 랜드마크라
 *    "히어로에 딸린 줄"의 간격(12~20px)이 아니라 그룹 안 간격(24~38.4px)을 받아야 한다.
 *    등급은 여전히 D(참조)다: 제목을 키우거나 hue 룰을 주지 마라(스펙 2026-08-02 §C-1).
 * ⚠ 크롤러 셸(index.html)은 이 스트립을 담지 않는다(값이 런타임에 온다) — 위치와 무관하다.
 */}
```

**게이트**: 면 개수 불변(셀은 `surface-muted` = 중립, `tools/dev/tintscan.mjs:432-440`) ·
헤딩 계층 불변 · `data-landing-cta` 2개 불변 · 탭 순서 = 시각 순서.

---

### D-2 셀 압축 — 92px → 74px (3줄 구성은 유지한다)

**파일** `components/MarketIndexStrip/MarketIndexStrip.styled.ts`

```
 export const Item = styled.li`
   display: grid;
-  gap: 2px;
+  grid-template-columns: minmax(0, 1fr);
+  row-gap: 2px;
   align-content: start;
   min-width: 0;
-  padding: ${space[3]};
+  /* 블록 패딩만 한 단계 줄인다(12 -> 8). 인라인 12px 은 유지 - 값이 테두리에 붙으면 표가 아니라 띠로 읽힌다. */
+  padding: ${space[2]} ${space[3]};
   background: ${color.surfaceMuted};
   border: 1px solid ${color.border};
   border-radius: ${radius.md};
 `;
```

`Name`(92-99) · `Value`(107-117) · `ValueMuted`(120-127) · `Change`(147-154) · `ChangeMuted`(157-164)
**다섯 곳 전부**에 한 줄 추가:

```
+  line-height: ${font.leading.tight};
```

**왜 3줄을 유지하는가**: 이름·값·등락을 두 줄로 접는 두 안(§E-1 b·c)은 **실측에서 무너졌다**.
3줄 스택은 각 줄에 요소가 하나뿐이라 **어느 폭에서도 말줄임이 원리적으로 불가능**하다.

**실측 결과(주입 시뮬레이션)**

| 폭 | 셀 h | 스트립 h (before) | Δ | 말줄임 |
|---|---|---|---|---|
| 360 | 74 (92) | **272** (323) | −51 | 0 |
| 390 | 74 | **272** (323) | −51 | 0 |
| 641 | 74 | **189** (224) | −35 | 0 |
| 768 | 74 | **189** (224) | −35 | 0 |
| 1024 | 74 | **107** (124) | −17 | 0 |
| 1280 | 74 | **107** (124) | −17 | 0 |
| 1600 | 74 | **107** (124) | −17 | 0 |

⚠ **`List` 의 `grid-template-columns` 를 건드리지 마라**(`MarketIndexStrip.styled.ts:67`).
`repeat(auto-fit, minmax(min(140px, 100%), 1fr))` 의 `min(...,100%)` 는 좁은 컨테이너에서 트랙이
밖으로 삐져나가는 것을 막는 장치이고(같은 파일 60-63 주석), 최소 트랙을 올리면 1024·641 에서
**고아 칸**이 생긴다(§E-1 c).

---

### D-3 방향 글리프와 우측 정렬 — 색이 아닌 두 채널을 더한다

**파일** `shared/constants/marketIndex/copy.ts` — `dash` 아래에 키 하나 추가

```ts
  /**
   * 등락 방향의 **모양** 신호. 색(data-positive/negative)과 부호(+/-)에 더하는 세 번째 채널이라
   * 색을 못 보는 사용자에게도 방향이 남는다(색 단독 채널 금지).
   *
   * 🔴 `flat` 키를 만들지 마라 — 보합에는 마크를 그리지 않는다. `formatChangePercent` 가
   * 보합에 부호를 붙이지 않으므로(shared/utils/percent.ts:19) 표기가 "0.00%" 하나로 충분하고,
   * 가운뎃줄(`–`) 글리프는 구분자 용도의 en-dash 금지 규칙과 겹친다.
   * ⚠ 등락률 자체는 aria-hidden 이고 방향은 changeAria 문장이 말한다 — 이 마크도 화면 전용이다.
   */
  directionMark: { up: '▲', down: '▼' },
```

**파일** `components/MarketIndexStrip/MarketIndexStrip.styled.ts`

`CHANGE_COLOR` 맵(141-145)은 **값을 바꾸지 않는다.** 적용 지점만 올린다.

```
-export const Change = styled.span<{ $direction: IndexChange['direction'] }>`
-  color: ${({ $direction }) => CHANGE_COLOR[$direction]};
+/**
+ * 등락 한 덩어리(마크 + 숫자). 색은 여기 한 곳에서만 정해지고 자식은 상속받는다 —
+ * 마크와 숫자가 따로 색을 고르면 언젠가 갈라진다.
+ * justify-self: end 가 이 부품의 **크기 채널**이다: 6칸의 오른쪽 끝이 한 줄로 서서
+ * 잉크가 길수록 큰 변동이라는 것이 눈으로 비교된다(자릿수 정렬).
+ */
+export const ChangeRow = styled.span<{ $direction: IndexChange['direction'] }>`
+  display: inline-flex;
+  align-items: baseline;
+  justify-self: end;
+  gap: 2px;
+  min-width: 0;
+  color: ${({ $direction }) => CHANGE_COLOR[$direction]};
+  white-space: nowrap;
+`;
+
+/**
+ * 방향 마크. 숫자 서체(Snowball Numeric)에는 U+25B2/25BC 글리프가 없어 어차피 폴백으로 그려지므로
+ * 스택을 본문 서체로 **명시**해 폴백 경로를 앱의 다른 한글과 같게 고정한다(실측 근거: 스펙 §E-2).
+ * 색은 부모에서 상속받는다 — 여기에 color 를 쓰지 마라.
+ */
+export const ChangeMark = styled.span`
+  flex: 0 0 auto;
+  font-family: ${font.sans};
+  font-size: 0.8em;
+  line-height: 1;
+`;
+
+export const Change = styled.span`
+  color: inherit;
   font-family: ${font.dataNumeric};
   font-size: ${font.size.sm};
   font-weight: ${font.weight.semibold};
+  line-height: ${font.leading.tight};
   white-space: nowrap;
   ${font.numeric}
 `;
```

`ChangeMuted`(157-164)에도 같은 정렬을 준다(값이 없는 칸도 오른쪽 끝이 맞아야 표가 흔들리지 않는다):

```
 export const ChangeMuted = styled.span`
+  justify-self: end;
   overflow: hidden;
   ...
+  line-height: ${font.leading.tight};
```

`SkeletonBar`(207-218)에 정렬 플래그 하나:

```
-export const SkeletonBar = styled.span<{ w: string }>`
+export const SkeletonBar = styled.span<{ w: string; $end?: boolean }>`
   display: block;
+  justify-self: ${({ $end }) => ($end ? 'end' : 'start')};
   height: 1em;
```

⚠ 141-145 위의 긴 주석 블록에서 되돌림 안내 문장을 한 곳만 고쳐라:
`"아래 CHANGE_COLOR 맵의 up·down 을 color.textSecondary 로 바꾸는 2줄"` → 여전히 정확하다(맵은 그대로다).
다만 `"styled 의 color 만 중립으로 고치면"` 이 가리키는 styled 는 이제 **`ChangeRow`** 다 — 그 단어만 바꿔라.

**파일** `components/MarketIndexStrip/MarketIndexStrip.tsx` — `IndexCell`(32-76)

```
   if (isLoading) {
     return (
       <Item>
         <Name>{row.label}</Name>
         <SkeletonBar w="4.5em" aria-hidden="true" />
-        <SkeletonBar w="3em" aria-hidden="true" />
+        <SkeletonBar w="3em" $end aria-hidden="true" />
       </Item>
     );
   }
```

```
       {row.change ? (
         <>
-          <Change aria-hidden="true" $direction={row.change.direction}>
-            {formatChangePercent(row.change)}
-          </Change>
+          {/* 색·부호·모양 세 채널이 같은 덩어리 안에 있다. 보합엔 마크가 없다(0.00% 로 충분하다). */}
+          <ChangeRow aria-hidden="true" $direction={row.change.direction}>
+            {row.change.direction === 'flat' ? null : (
+              <ChangeMark>{MARKET_INDEX_COPY.directionMark[row.change.direction]}</ChangeMark>
+            )}
+            <Change>{formatChangePercent(row.change)}</Change>
+          </ChangeRow>
           <VisuallyHidden>{MARKET_INDEX_COPY.changeAria(row.change)}</VisuallyHidden>
         </>
       ) : (
```

🔴 **`Change` 의 textContent 를 오염시키지 마라.** `MarketIndexStrip.test.tsx:89` 가
`expect(screen.getByText(change).textContent).toBe(change)` 로 **정확일치**를 단정한다.
마크를 `Change` 안에 넣거나 `::before content` 로 넣으면(전자는 실패, 후자는 통과하지만
복사·번역 경로에서 사라진다) 계약이 깨진다. **형제 요소가 유일한 정답이다.**

**import 정리**: `Change` 가 더 이상 `$direction` 을 받지 않으므로 `IndexChange` 타입 import 는
`ChangeRow` 가 계속 쓴다(그대로 둔다). `MarketIndexStrip.tsx` 는 `ChangeRow`·`ChangeMark` 를
styled import 목록에 **알파벳 순으로** 추가하라(기존 목록이 정렬돼 있다).

---

### D-4 🔴 12칸 트랙 — 지급 칸에 링을 두르고 굵기를 한 단계 올린다

**파일** `pages/Landing/components/PayoutRhythm/PayoutRhythm.styled.ts` — `RhythmCell`(107-120)

```
 export const RhythmCell = styled.span<{ $paid: boolean }>`
   display: flex;
   align-items: center;
   justify-content: center;
   min-width: 0;
   height: 26px;
   border-radius: ${radius.xs};
+  /*
+   * 🔴 링이 이 표의 **모양 채널**이다. 면색만으로는 못 가른다 - 실측상 지급 면(accent-alt-subtle)과
+   * 미지급 면(surface-sunken)의 대비비가 16테마 전부에서 1.01~1.18:1 이다(같은 명도, 색상만 다름).
+   * 미지급 칸도 같은 두께의 투명 테두리를 갖는다: box-sizing 이 border-box 라 크기는 어차피 같지만,
+   * 선언을 맞춰 두어야 다음 사람이 한쪽만 고쳐 12칸 열을 어긋내지 않는다.
+   * accent-alt-border(1.19~2.08:1)나 accent-alt(2.69~3.00:1, grape/light 3:1 미달)로 낮추지 마라.
+   */
+  border: 1px solid ${({ $paid }) => ($paid ? color.accentAltText : 'transparent')};
   background: ${({ $paid }) => ($paid ? color.accentAltSubtle : color.surfaceSunken)};
   color: ${({ $paid }) => ($paid ? color.accentAltText : color.textMuted)};
   font-family: ${font.dataNumeric};
   font-size: ${font.size['2xs']};
-  font-weight: ${({ $paid }) => ($paid ? font.weight.semibold : font.weight.regular)};
+  font-weight: ${({ $paid }) => ($paid ? font.weight.bold : font.weight.regular)};
   ${font.numeric}
 `;
```

**왜 굵기를 올려도 열이 안 밀리는가**: `font.dataNumeric`(Snowball Numeric)은 400→700 에서
잉크가 **+54.9%** 늘지만 자릿폭은 **−0.2%** 다(§A-4 실측). 같은 처방을 `font.sans` 로 했다면
자릿폭이 +4.0% 늘어 12칸 열이 밀렸을 것이다.

**파일 상단 주석(5-14)** 을 아래로 교체한다 — 지금 주석은 "면색+글자색+굵기 세 가지"라고 적고 있는데,
그중 면색이 실제로는 1.01:1 이라는 사실을 다음 사람이 알아야 한다.

```
/**
 * S5 "배당이 들어오는 달은 종목마다 다릅니다" — 12칸 리듬.
 *
 * 🔴 **색만으로 말하지 않는다.** 지급 달 칸은 네 가지가 함께 바뀐다 —
 * 면색 · 글자색 · **사방 1px 링** · 굵기(700 대 400). 그 위에 행마다 텍스트 요약(연 몇 회 지급인지)과
 * 행 접근명(몇 월에 지급인지), 그리고 범례 한 문장이 붙는다.
 *
 * ⚠ **면색은 신호로 치지 마라.** accent-alt-subtle 대 surface-sunken 은 8프리셋 x 라이트/다크
 * 16조합에서 대비비 **1.01~1.18:1** 이다 — 명도가 같고 색상만 다르다. 회색조로 보면 두 칸은 같은 칸이고,
 * 라이트 8종에서는 글자 명도까지 거의 같다(velog 5.17 대 5.02). 실제로 가르는 것은 **링과 굵기**다.
 * ink 프리셋은 accentAlt 가 무채라 링과 굵기가 **유일한** 신호다 — 그 프리셋에서 눈으로 확인하라.
 *
 * 칸 폭은 25~67px 라 tintscan 의 면 하한(180px, tools/dev/tintscan.mjs:63,363)에 걸리지 않고,
 * 트랙(RhythmMonths)은 배경이 없어 스캐너의 대상 자체가 아니다(같은 파일 365-367).
 * 테두리는 backgroundColor/backgroundImage 만 보는 스캐너에 **애초에 안 잡힌다** — 이 섹션은 랜딩의
 * 틴트 면 2개(히어로 그라디언트 · 시작 준비 wash)에 세 번째를 더하지 않는다.
 */
```

**🔴 tintscan 통과 증명(추측 아님, 소스 인용 + 실측)**

| 스캐너 규칙 | 소스 | 이 처방이 통과하는 이유 |
|---|---|---|
| 폭 < 180 또는 높이 < 8 이면 면이 아니다 | `tools/dev/tintscan.mjs:63-64`(`minWidth=180`,`minHeight=8`), `:363`(`if (rect.width < OPT.minWidth ‖ rect.height < OPT.minHeight) continue;`) | 칸 = **66.4×26 @1280 · 25.2×26 @390** (§A-3). 폭이 상한의 1/3 미만이다. |
| 배경이 없으면 면이 아니다 | `:365-367` (`const image = cs.backgroundImage !== 'none'; const colored = !neutral.has(cs.backgroundColor); if (!image && !colored) continue;`) | **트랙 전체가 하나의 면으로 잡히는 경로가 없다** — `RhythmMonths`(`PayoutRhythm.styled.ts:93-104`)는 `background` 선언이 0개다. 819×26 짜리 요소가 있어도 스캐너는 `backgroundColor` 만 보고 `rgba(0,0,0,0)` 이면 건너뛴다. |
| 테두리는 세지 않는다 | 같은 `:365-366` — `borderColor` 를 읽는 코드가 **없다** | 새로 추가하는 것은 **오직 border** 다. |
| 중립 면은 크기 무관 제외 | `:432-440` NEUTRAL_VARS 에 `--sb-surface-sunken` 포함 | 미지급 칸은 지금도 앞으로도 `surfaceSunken`. |

**실측 증명**: 주입 시뮬레이션 후 `main` 안 면 개수를 스캐너와 **같은 규칙으로 다시 세어**
**1280·1024·768·641·390·360 전부 `tintFaceCount: 2`**(히어로 그라디언트 · 시작 준비 wash)를 확인했다.
`O`(매월 지급)의 12칸이 전부 링을 갖는 최악 상태에서도 그대로다.

**시각 확인**: `after-C.1280.png`(라이트) · `after-C-dark.png`(다크) · `after-C-ink.png`(**ink = accentAlt 무채**).
ink 컷에서 색이 전혀 없는데도 지급 달이 한눈에 갈린다 — 이 처방이 색에 의존하지 않는다는 증거다.

**높이 불변**: `box-sizing: border-box` 가 전역이라(`shared/styles/globalStyles.ts:84`) 26px 는 그대로다.
실측: 칸 26px · S5 섹션 높이 **441 @1280 / 521 @390 불변**.

---

### D-5 범례 카피 — 새 부호를 정확히 설명한다

**파일** `pages/Landing/copy/landingCopy.ts:151`

```
-    legend: '진하게 표시된 칸이 배당을 지급한 달입니다.',
+    legend: '테두리가 둘린 진한 칸이 배당을 지급한 달이고, 나머지 옅은 칸은 지급이 없었던 달입니다.',
```

- 격식체 유지. **약속형 아님** — 과거형("지급한"·"없었던")은 바로 아래 각주가 "과거 지급 이력에서 확인한 값"
  이라고 말하기 때문이다(기존 주석 143-150 의 규칙 그대로).
- **두 상태를 모두 말한다** — 사용자의 요구가 "들어오는 달 / 안 들어오는 달"의 구분이므로 범례도 둘 다 짚는다.
- 기존 주석 143-150 은 그대로 두되 마지막에 한 줄 추가: `2026-08-02: 링과 굵기가 더해져 "진하게"만으로는 부족해졌다.`
- ⚠ `index.html` 정적 셸에 **복제하지 마라**(기존 주석 148-149 의 이유 그대로 유효 — 셸에는 12칸이 없다).

---

### D-6 스트립 메타 한 줄 — 첫 화면으로 올라온 값이 실시간이 아님을 그 자리에서 말한다

**파일** `shared/constants/marketIndex/copy.ts:21`

```
-  meta: '전일 대비 · 참고용 시세',
+  meta: '전일 대비 · 실시간이 아닌 참고용 시세',
```

- **근거**: 정본 §D-7 이 스트립을 아래로 내린 이유 중 하나가 "푸터 각주와 인접해진다"였다. 자리가 다시
  위로 왔으므로 그 인접성이 사라진다. 각주는 S5 도 덮으므로 **남기고**(§D-1), 스트립은 자기 자리에서
  자기 한계를 말한다.
- **폭 실측**: 헤더는 `flex-wrap` 이고 현재 1줄(높이 21px @1280·@390). 추가 6글자(12px, ≈66px)를 더해도
  390 에서 제목(≈55) + 메타(≈209) + gap 12 = **276 < 358** 이라 1줄이 유지된다.
  🔴 **§F-2 ④ 에서 헤더 높이 21px 을 반드시 재확인하라** — 2줄이 되면 스트립이 16px 더 커진다.
- ⚠ `MarketIndexStrip.test.tsx:162` 가 `toHaveTextContent('전일 대비 · 참고용 시세')` 로 **부분 일치**를
  단정한다. 새 문자열은 그 부분 문자열을 포함하지 않으므로 **테스트가 빨개진다** — `qa-tester` 가
  상수 동어반복이 아닌 형태로 갱신한다(§G).

---

### D-7 반응형 규칙 (변경 후 최종 상태)

| 폭 | G1 히어로↔지수 간격 | 지수 스트립 | 12칸 트랙 |
|---|---|---|---|
| ≥1334 | 40px(clamp 상한) | 6열 1행 · 셀 74px · 스트립 107 | 3열 subgrid · 12칸 전폭 |
| 1024–1333 | 30.7–40 | 6열 1행 · 107 | 동일 |
| 981–1023 | 29.4–30.7 | 5–6열 1–2행 | 동일 |
| 769–980 | 24–29.4 | 4–5열 2행 | 동일 |
| 641–768 | 24 | 3열 2행 · 189 | 라벨 윗줄 + 12칸 전폭(`tabletSm`↓) |
| ≤640 | 24 | **2열 3행 · 272** | 라벨 윗줄 + 12칸 전폭 |

**접히는 것** = 스트립의 열 수(6→3→2)와 12칸 트랙의 라벨 위치.
**사라지는 콘텐츠는 어느 폭에서도 0개다.** 지수 6종은 어느 폭에서도 6칸 전부 렌더된다
(`MarketIndexStrip.types.ts:21-22` 의 계약: 값이 없어도 행을 지우지 않는다).

---

### D-8 상태 6종 — 새 레이아웃에서 어떻게 보이나 (전부 명시)

`MarketIndexStrip.tsx:98-102` 가 규정한 6종을 새 3줄 그리드에 그대로 매핑한다.
**세 줄(이름 / 값 / 등락)의 자리는 어느 상태에서도 비지 않는다** — 이것이 이 부품의 핵심 계약이다.

| # | 상태 | 1줄(이름) | 2줄(값) | 3줄(등락, 우측 정렬) | 셀 높이 |
|---|---|---|---|---|---|
| 1 | **loading** | 지수명 실제 텍스트 | `SkeletonBar w="4.5em"` (좌) | `SkeletonBar w="3em" $end` (**우**) | 74 — 스켈레톤이 `height: 1em` 이라 담는 요소의 font-size 를 따라간다. `Value` 16px·`Change` 13px 이 그대로라 **도착 시 점프 0**. `aria-busy="true"`. |
| 2 | **success** | 지수명 | `formatIndexValue` + SR 단위(`row.unit`) | `▲`+`+2.37%` (data-positive) 또는 `▼`+`-0.73%` (data-negative) + SR 문장 | 74 |
| 3 | **stale** | 동일 | **직전 성공값 유지** | 동일 | 74 — 헤더 메타 뒤에 `StaleMark(' · 업데이트 실패')` 만 붙는다(중립 muted). 셀은 아무것도 안 바뀐다. |
| 4 | **error** | — | — | — | 목록 자체가 없다. `Message('지수 시세를 불러오지 못했습니다.')` 한 줄. **제목·메타는 남는다.** 스트립 높이 ≈ 21+12+20 = **53** |
| 5 | **부분 실패**(이 지수만) | 지수명 유지 | `ValueMuted('—')` — `Value` 와 같은 크기라 행 높이 유지 | `ChangeMuted('불러오지 못함')` **우측 정렬** + SR `'시세를 불러오지 못했습니다'` | 74 — 칸이 사라지지 않는다(`MarketIndexStrip.types.ts:21-22`) |
| 6 | **전일값만 없음** | 지수명 | 실제 값 | `ChangeMuted('—')` **우측 정렬** + SR `'전일 대비 정보가 없습니다'` | 74 — 0% 로 위장하지 않는다 |

🔴 **보합(flat)** 은 6종 밖의 갈래다: `direction === 'flat'` 이면 **마크를 렌더하지 않고**
`formatChangePercent` 가 부호 없이 `'0.00%'` 을 준다(`shared/utils/percent.ts:19`).
색은 `textSecondary`(중립). 우측 정렬이라 마크가 없어도 오른쪽 끝은 그대로 맞는다.

⚠ **6번 셀(원/달러)이 현재 dev 에서 5번 상태다** — `after-C.1280.png` 오른쪽 끝이 그 모습이다.
스켈레톤·결손 자리가 새 레이아웃에서 안 무너지는 것을 그 컷으로 눈으로 확인했다.

---

## E. 대안 비교 (기각표) — 각 처방마다 왜 이 안인가

### E-1 주요 지수 스트립

| # | 대안 | 판정 | 사유(수치) |
|---|---|---|---|
| a | 6개 타일을 지우고 **하나의 `surface-muted` 계기판 패널 + 1px 세로 구분선** | **기각** | ①`auto-fit` 은 열 수를 CSS 가 모르므로 줄바꿈된 행의 **첫 칸에 세로선이 남는다**(2열이 되는 390 에서 매 행). ②그 선을 gap 으로 그리려면 패널 배경이 `color.border` 여야 하는데 `--sb-border` 는 **NEUTRAL_VARS 에 없다**(`tools/dev/tintscan.mjs:432-440`) → **즉시 세 번째 면**이고 게이트가 빨개진다(여유 0). |
| b | **이름 + 등락률을 한 줄에**(2줄 셀, 57px) | **실측 기각** | 셀이 **148px(@1024)** 이면 지수명 2건, **141px(@641)** 이면 3건이 말줄임된다. 말줄임 대신 줄바꿈을 허용하면 `"S&P / 500"`·`"나스닥 / 종합"` 으로 접히고 `"니케이225▲+4.03%"` 처럼 간격이 붙는다 — **`after-D.641.png`** 에 그대로 찍혀 있다. 얻는 것은 390 에서 51px 뿐이다. |
| c | b 를 살리려고 `auto-fit` 최소 트랙을 140→155px 이상으로 | **기각** | 1024 에서 5열 + **고아 칸 1개**, 641 에서 3열 + 고아 1개가 생긴다(`design-taste-frontend:250` BENTO CELL COUNT RULE). 게다가 1024 가 1행→**2행**이 되어 스트립이 107→155px 로 **더 커진다**. |
| d | 셀 면을 `surface-muted` → `surface` 로 (타일을 보이게) | **기각** | velog/light 의 `muted/bg` 가 **1.000:1**(같은 색)이라 개선처럼 보이지만 `surface/bg` 도 **1.054** 로 사실상 같다. 반대로 **다크 8종에서는 muted(1.193~1.244)가 surface(1.116~1.156)보다 낫다** — 8테마를 나쁘게 만들고 8테마를 0.05 개선한다. 타일을 보이게 하는 것은 지금도 1px 테두리다. |
| e | ▲/▼ 대신 **lucide `ArrowUp`/`ArrowDown`** | **기각** | ①13px tabular 숫자 옆 12px 스트로크 아이콘은 이 레포의 **재발 결함**(한글 라인박스 중심 ↔ 아이콘 기하 중심 어긋남)을 정확히 불러온다. ②이 부품은 현재 아이콘을 **0개** import 한다. ③마크는 부호 `+`/`-` 와 같은 **표기 층**이지 아이콘 시스템이 아니다. |
| f | 등락 **크기**를 미니 막대로 | **기각(재확인)** | `design-taste-frontend:678`("filled background track 금지") + 손익색을 새 표면(막대)으로 번지게 하지 말라는 확정 결정. 대신 **우측 정렬 + tabular 자릿수**가 크기 채널이다. |
| g | 스트립에 섹션 배지·hue 를 줘서 화려하게 | **기각** | 등급 D 유지(§C-1). 히어로(identity hue) 바로 아래에 두 번째 hue 를 세우면 첫 화면이 두 색으로 말한다. 이 스트립의 색은 **등락색 하나로 충분**하다. |

### E-2 ▲/▼ 글리프 — `craft-floor:39` 와의 충돌을 정직하게 기록한다

`impeccable/reference/craft-floor.md:39` 는 *"Unicode glyphs or emoji standing in for an icon system"* 를 금지한다.
**부분 기각한다.** 사유: 이 마크는 아이콘 시스템의 대용이 아니라 **수치 표기**다(부호 `+`/`-` 와 같은 층이고,
`LandingFaq` 의 `+`/`−` 마커가 이미 같은 층의 선례다). 대안(§E-1 e)은 더 큰 결함을 부른다.

**잔여 리스크(실측으로 확인했다)**: U+25B2/25BC 는 `Snowball Numeric` 에도 `Wanted Sans Variable` 에도 **없다** —
canvas advance 가 네 스택(`numeric` / `numeric` 단독 / `sans` / 맨몸 `sans-serif`)에서 전부 **100.0/100px** 로
동일하다 = 전부 **시스템 폴백**이 그린다. Windows/Chrome 에서는 문제없이 그려지지만 **macOS·iOS 에서
글리프 크기·두께가 다를 수 있다.** 그래서 `ChangeMark` 에 `font-family: ${font.sans}` 를 **명시**해
폴백 경로를 앱의 다른 한글과 같게 고정하고, `font-size: 0.8em`·`line-height: 1` 로 크기를 우리가 정한다.
리뷰어는 **macOS/Safari 에서 한 컷**을 확인하라(§G-3).

### E-3 12칸 트랙

| # | 대안 | 판정 | 사유(수치) |
|---|---|---|---|
| a | 지급 칸을 `accentAlt` **솔리드**로 채우기 | **기각** | `accent-alt-text`/`accent-alt` 는 검증된 쌍이 아니고, decisions.md 2026-07-31 이 "hue 채움은 솔리드 금지 · 파생 면 위 텍스트 금지"를 확정했다. |
| b | 미지급 칸의 면을 **없애서** 대비를 벌기 | **기각** | ①12칸 리듬이 안 읽힌다(브리핑 명시 요구). ②실이득이 0이다 — 미지급 칸을 지우면 그 자리는 카드 면(`surface`)이 되는데 `accent-alt-subtle` 대 `surface` 는 **1.00~1.14:1**(16테마 실측, 최저 sunset/dark 1.00 · 최고 ink/light 1.14)로 `surface-sunken` 과 **다를 바 없다**. `*Subtle` 토큰에서는 **명도 분리를 얻을 수 없다**는 것이 이 트랙의 근본 제약이고, 그래서 답이 면이 아니라 **모양**이다. |
| c | **굵기만** 600→700 | **부분 채택** | 잉크 +37.6%→+54.9%(§A-4)이지만 **11px** 에서 단독 신호로는 약하다. 링과 함께 쓴다. |
| d | 링 색을 `accentAltBorder` 로 | **기각** | 미지급 면 대비 **1.19~2.08:1**(16테마) — 장식 플로어다. 정본 §C-3 이 "테두리가 톤을 말하는 유일한 신호가 되지 않게"라고 한 조건을 여기서는 만족시킬 수 없다(링이 곧 그 신호다). |
| e | 링 색을 `accentAlt`(표시색)로 | **기각** | 라이트 8종 **2.69~3.00**, grape/light 가 **3:1 미달**. `accent-alt-text` 는 최저 4.60 이다. |
| f | 미지급 칸을 **점선** 테두리로 (모양 대비 극대화) | **기각** | 칸 폭이 **25.2px @390** 이라 1px 점선이 4~5개 점으로 쪼개져 노이즈가 된다. 그리고 신호를 미지급 쪽에 걸면 "없음"이 "있음"보다 시끄러워진다. |
| g | 지급 칸에 **아래 3px 바** 추가 | **기각** | 링과 중복이고(같은 모양 채널), 26px 칸의 1/9 를 먹어 숫자 baseline 이 위로 밀린다. |

### E-4 배치

| # | 대안 | 판정 | 사유 |
|---|---|---|---|
| a | **현행 유지**(HeroBlock 안, 12/20px) | **기각** | §D-1 근거 3가지. 특히 `HeroBlock` 주석 자신이 "검색은 **독립 섹션이 아니라** 히어로에 딸린 줄"이라고 그 gap 의 뜻을 규정한다(`LandingPage.styled.ts:52-56`) — 스트립은 독립 섹션이다. |
| b | `LandingStack` **직계 자식**으로(래퍼 없이 히어로와 G2 사이) | **기각** | 위아래가 전부 **75.9px** 그룹 경계가 되어 스트립이 "챕터 하나"로 승격된다. 등급 D 와 정면충돌한다. |
| c | G2(배우기) 맨 앞 | **기각** | G2 의 서사는 "단어 → 원리 → 시간"이다. 시세는 학습이 아니다. |
| d | 히어로 **안**(`PageHero` 의 슬롯) | **기각(재확인)** | `MarketIndexStrip.tsx:93-94` 가 명시 금지("히어로 안에 넣으면 390px 접힘 예산이 무너진다"). |

### E-5 `dataviz` 스킬 — 🔴 **이 워크스페이스에 존재하지 않는다**

브리핑은 `dataviz` 스킬을 읽고 채택/기각표를 만들라고 지시했다. **그 스킬은 없다.**
`.claude/skills/` 는 23개 심링크 + 5개 로컬 폴더이고(`.agents/skills/` 실체), 목록에 `dataviz` 가 없다.
가장 이름이 가까운 `impeccable/reference/visualize.md`(47행)는 **이미지 생성 comp 워크플로**라 데이터 표시와 무관하다.
→ 실재하는 스킬에서 **데이터 표시를 규정하는 조항만** 뽑아 표를 만든다.

| 출처 | 조항 | 판정 | 사유 |
|---|---|---|---|
| `design-taste-frontend:678` | scoring/progress bar with filled track 금지 | **채택(적용 0)** | 등락 크기를 막대로 그리지 않는다. 우측 정렬 + tabular 자릿수로 대신한다(§D-3). |
| `design-taste-frontend:646,683` | 장식용 컬러 점 금지, **실제 의미 상태만 예외** | **채택** | ▲/▼ 는 방향이라는 실제 상태이고 셀당 1개다. 예외 조항에 정확히 해당한다. |
| `design-taste-frontend:250` | BENTO CELL COUNT RULE(빈 칸 금지) | **채택** | §E-1 c 기각의 근거. |
| `design-taste-frontend:693` | en-dash `–` 를 구분자로 쓰지 마라 | **채택** | 보합에 `–` 마크를 두지 않는다(마크 미렌더, §D-3). |
| `design-taste-frontend:216` | VISUAL_DENSITY>7 이면 카드 컨테이너 금지, 데이터는 평면에서 | **기각(실측)** | 타일 면이 `bg` 와 **1.000:1**(velog/light)이라 테두리를 빼면 타일이 통째로 사라진다(§E-1 d). |
| `design-taste-frontend:568` | Cockpit: 모든 숫자에 `font-mono` | **기각(재확인)** | "monospace as costume" 은 확정 기각 목록이고, 이 앱의 숫자 서체는 `dataNumeric` + `tabular-nums` 로 이미 정렬 문제를 푼다. |
| `design-taste-frontend:190` | COLOR CONSISTENCY LOCK | **채택** | 새 hue 0. 스트립은 등락색, 트랙은 accentAlt — 둘 다 **기존 배정 그대로**다. |
| `craft-floor:24` | same-size cards as the page structure | **부분 기각** | 6칸 수치 readout 은 페이지 **구조**가 아니라 한 부품의 표다. 다만 3줄 스택을 92→74 로 압축해 "카드밭" 인상을 줄였다. |
| `craft-floor:34` | 1px 초과 컬러 `border-left` 금지 | **채택** | 지급 칸 링은 **사방 1px** 이고 좌측 레일이 아니다. |
| `craft-floor:39` | 유니코드 글리프를 아이콘 대용으로 | **부분 기각** | §E-2 에 사유·잔여 리스크·검증 항목까지 기록. |
| `craft-floor:43` | elevation 은 테두리 **또는** 그림자 하나만 | **채택(현행 유지)** | 타일은 테두리만, 그림자 0. 지급 칸도 테두리만. |
| `layout:47` | Group by meaning. 컨테이너보다 근접(proximity)을 먼저 | **채택** | G1 래퍼는 컨테이너가 아니라 **간격**이다 — 면·테두리·배경 0인 순수 grid div. |
| `apple-design §15` | tracking 은 크기별로 다르다 | **채택(변경 0)** | 스트립·트랙의 글자 크기를 바꾸지 않으므로 tracking 도 손대지 않는다. |

---

## F. 검증 계획

### F-1 게이트 (전부 exit 0)

```sh
npx tsc -b tsconfig.build.json
npx vitest run test/landing components/MarketIndexStrip
npx vitest run shared/styles/contrast.test.ts
node tools/dev/styled-comment-backticks.mjs
MSYS_NO_PATHCONV=1 node tools/dev/tintscan.mjs --url http://localhost:5173 --route / --width 1280,390 --port <빈포트>
MSYS_NO_PATHCONV=1 node tools/dev/overflowprobe.mjs --base http://localhost:5173 --routes "/" --port <빈포트>
MSYS_NO_PATHCONV=1 node tools/dev/headerprobe.mjs --base http://localhost:5173 --port <빈포트>
```

⚠ `npm run api:bundle` · `npm run verify` 는 **트랙 작업 중에 돌리지 마라**(배치 종료 후 오케스트레이터가 한 번).
⚠ 프로브 첫 줄이 `launched` 인지 `attached` 인지 확인하라 — `attached` 면 남의 브라우저다.
⚠ `tintscan` 만 `--url`, 나머지는 `--base`.

| 지표 | before(실측) | after 목표 |
|---|---|---|
| `tintscan /` @1280 | **2개** (1040×207 header · 1040×219 div) | **2개** — 같은 둘. 3개가 나오면 §D-4 의 링이 아니라 **다른 것**을 의심하라(링은 border 라 스캐너 대상이 아니다) |
| `tintscan /` @390 | **2개** (358×218 · 358×493) | **2개** |
| `overflowprobe /` @390·@360 | 새는 요소 0 | **0** |
| `headerprobe /` @1280 / @390 | 65px / 111px | **불변** |
| `contrast.test.ts` | 16조합 통과 | **새 쌍 0개 추가하고 그대로 통과** |

### F-2 실측 회귀 (`uiprobe --eval`, 복붙 가능)

```sh
# ① 배치와 접힘 예산 — G1 래퍼가 CTA 예산을 건드리지 않았는가
#    before(라이브): @1280 heroBlockGap 20px · stripTop 412 · ctaBottom 253 · G2top 612
#                    @390  heroBlockGap 12px · stripTop 425 · ctaBottom 258 · G2top 796
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280,390 --port 9414 --wait 7000 \
  --eval "(()=>{const st=document.querySelector('main').firstElementChild;const g1=st.children[0];const strip=[...document.querySelectorAll('main section')].find(s=>/주요 지수/.test(s.querySelector('h2')?.textContent||''));const cta=document.querySelector('[data-landing-cta=simulator]').getBoundingClientRect();return {w:innerWidth,stackGap:getComputedStyle(st).gap,g1Gap:getComputedStyle(g1).gap,g1Kids:[...g1.children].map(e=>e.tagName),stripParentIsG1:strip.parentElement===g1,stripTop:Math.round(strip.getBoundingClientRect().top+scrollY),ctaBottom:Math.round(cta.bottom+scrollY),g2Top:Math.round(st.children[1].getBoundingClientRect().top+scrollY),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()"
```
**목표** @1280: `g1Gap "37.95px"`(또는 38.4) · `g1Kids ["DIV","SECTION"]` · `stripParentIsG1 true` ·
`ctaBottom 253` · `overflow 0`.
@390: `g1Gap "24px"` · **`ctaBottom 258`(before 와 정확히 같아야 한다)** · `overflow 0`.
🔴 `ctaBottom` 이 1px 이라도 커지면 되돌려라 — 390×664 접힘 예산이다.

```sh
# ② 스트립 압축 — 셀 74px · 스트립 높이  (before 셀 92 · 스트립 107/124… 아래 표)
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 360,390,641,768,1024,1280,1600 --port 9414 --wait 7000 \
  --eval "(()=>{const s=[...document.querySelectorAll('main section')].find(x=>/주요 지수/.test(x.querySelector('h2')?.textContent||''));const li=[...s.querySelectorAll('li')];const b=li[0].getBoundingClientRect();const clipped=li.map(l=>[...l.children].filter(c=>c.scrollWidth>c.clientWidth+1).length).reduce((a,c)=>a+c,0);return {w:innerWidth,cells:li.length,cell:[Math.round(b.width),Math.round(b.height)],stripH:Math.round(s.getBoundingClientRect().height),headerH:Math.round(s.firstElementChild.getBoundingClientRect().height),clipped};})()"
```
**목표**: 모든 폭에서 `cells 6` · `cell[1] 74` · `clipped 0` · `headerH 21`.

| 폭 | 360 | 390 | 641 | 768 | 1024 | 1280 | 1600 |
|---|---|---|---|---|---|---|---|
| stripH before | 323 | 323 | 224 | 224 | 124 | 124 | 124 |
| **stripH 목표** | **272** | **272** | **189** | **189** | **107** | **107** | **107** |

🔴 `headerH` 가 21 을 넘으면 §D-6 의 메타 문구가 2줄이 된 것이다 — 그때만 카피를 되돌려라.

```sh
# ③ 방향·크기 채널 — 마크가 서고 오른쪽 끝이 한 줄로 맞는가  (before: 마크 0개, 좌측 정렬)
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280 --port 9414 --wait 7000 \
  --eval "(()=>{const s=[...document.querySelectorAll('main section')].find(x=>/주요 지수/.test(x.querySelector('h2')?.textContent||''));return [...s.querySelectorAll('li')].map(li=>{const row=li.children[2];const r=row.getBoundingClientRect();const cell=li.getBoundingClientRect();return {name:li.children[0].textContent,text:row.textContent,rightGap:+(cell.right-r.right).toFixed(1),color:getComputedStyle(row).color,mark:(row.children[0]||{}).textContent||null};});})()"
```
**목표**: 상승 셀은 `mark "▲"`, 하락 셀은 `"▼"`, 보합·결손은 `null`.
**`rightGap` 이 6칸 전부 같은 값**(= 셀 인라인 패딩 12 + 테두리 1 = **13.0**)이어야 한다 —
이것이 "크기를 자릿수로 읽는다"의 성립 조건이다.

```sh
# ④ 12칸 트랙 — 링과 굵기가 실제로 갈리는가  (before: 링 0개, paid w600 / unpaid w400, 면 대비 1.01:1)
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280,390 --port 9414 --wait 7000 \
  --eval "(()=>{const sec=[...document.querySelectorAll('main section')].find(s=>/들어오는 달/.test(s.querySelector('h2')?.textContent||''));const cells=[...sec.querySelectorAll('span[aria-hidden] > span')];const g=(c)=>{const cs=getComputedStyle(c);const b=c.getBoundingClientRect();return {t:c.textContent,w:+b.width.toFixed(1),h:Math.round(b.height),bg:cs.backgroundColor,bd:cs.borderTopWidth+' '+cs.borderTopColor,fw:cs.fontWeight};};const paid=cells.filter(c=>getComputedStyle(c).borderTopColor!=='rgba(0, 0, 0, 0)');const unpaid=cells.filter(c=>getComputedStyle(c).borderTopColor==='rgba(0, 0, 0, 0)');return {w:innerWidth,total:cells.length,paidN:paid.length,unpaidN:unpaid.length,paid:g(paid[0]),unpaid:g(unpaid[0]),secH:Math.round(sec.getBoundingClientRect().height)};})()"
```
**목표**: `total 36`(3행×12) · `paid.bd "1px rgb(19,118,42)"`(velog/light) · `paid.fw "700"` ·
`unpaid.bd "1px rgba(0, 0, 0, 0)"` · `unpaid.fw "400"` ·
**`paid.h === unpaid.h === 26`**(border-box 확인) ·
**`secH 441 @1280 / 521 @390`(불변)**.

```sh
# ⑤ 틴트 면 재계산 — tintscan 과 같은 규칙을 페이지 안에서 다시 센다(게이트 실행 전 조기 경보)
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280,390 --port 9414 --wait 7000 \
  --eval "(async()=>{scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,900));scrollTo(0,0);await new Promise(r=>setTimeout(r,300));const V=['--sb-bg','--sb-surface','--sb-surface-raised','--sb-surface-muted','--sb-surface-sunken','--sb-surface-hover','--sb-progress-track'];const p=document.createElement('span');p.style.display='none';document.body.appendChild(p);const rgb=(v)=>{p.style.color='';p.style.color=v;return getComputedStyle(p).color;};const n=new Set(['rgba(0, 0, 0, 0)','transparent']);for(const k of V){const raw=getComputedStyle(document.documentElement).getPropertyValue(k).trim();if(raw)n.add(rgb(raw));}p.remove();const m=document.querySelector('main');const f=[];for(const el of [m,...m.querySelectorAll('*')]){if(el.closest('button, a, input, select, textarea, summary, [role=\"button\"], [role=\"tab\"]'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)continue;const b=el.getBoundingClientRect();if(b.width<180||b.height<8)continue;if(cs.backgroundImage==='none'&&n.has(cs.backgroundColor))continue;const a=b.width*b.height;const par=f.find(x=>x.el.contains(el));if(par&&a>=par.area*0.9)continue;f.push({el,area:a,sel:el.tagName.toLowerCase(),w:Math.round(b.width),h:Math.round(b.height),top:Math.round(b.top+scrollY)});}return {w:innerWidth,count:f.length,faces:f.map(({el,area,...r})=>r)};})()"
```
**목표**: `count 2` (양쪽 폭). 3 이 나오면 `faces` 가 범인을 바로 알려 준다.

```sh
# ⑥ 문서 높이  (before @1280 3854 · @390 5195)
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280,390 --port 9414 --wait 7000 \
  --eval "({w:innerWidth,docH:document.documentElement.scrollHeight})"
```
**목표** @1280 **3,840~3,875**(스트립 −17 · G1 간격 +18.4 = 거의 상쇄) · @390 **5,140~5,175**(−51 +12).
이 대역을 벗어나면 G1 래핑이 잘못됐거나 셀 패딩이 안 먹었다.

### F-3 눈으로 (필수 — 안 보고 쓴 검증은 무효)

```sh
node tools/dev/uiprobe.mjs --url http://localhost:5173/ --width 1280,390 --port 9414 --wait 7000 --shot <scratchpad>/impl-after.png
```
⚠ `--shot` 경로에는 `MSYS_NO_PATHCONV=1` 을 **붙이지 마라**(드라이브 루트에 조용히 떨어진다).
이미지를 **열어서** 아래 6개를 확인하고, 이 스펙의 `after-C.*.png` 와 비교하라.

1. 히어로 클러스터와 "주요 지수" 사이가 검색줄 간격(20/12)이 아니라 그룹 간격(38.4/24)으로 벌어졌는가.
2. 6칸의 등락률이 **오른쪽 끝 한 줄**로 맞는가. `+16.46%` 가 `+2.37%` 보다 눈에 띄게 긴가.
3. ▲/▼ 가 숫자와 같은 baseline 에 앉는가(위아래로 튀지 않는가).
4. 12칸 트랙에서 지급 달이 **한눈에** 갈리는가. 미지급 칸이 여전히 칸으로 읽히는가(사라지지 않았는가).
5. **다크 모드**로 바꿔도 1~4가 유지되는가(`after-C-dark.png` 비교).
6. **ink 프리셋(라이트)** 에서도 지급 달이 갈리는가 — ink 는 accentAlt 가 **무채**라 색이 0인 상태에서
   링과 굵기만으로 갈려야 한다(`after-C-ink.png` 비교). 🔴 여기서 안 갈리면 처방이 실패한 것이다.

---

## G. 다음 담당

- **구현**: `frontend-engineer` — §D-1 ~ §D-6 전부. 상태(atom) 변경 0건이라 `state-engineer` 불필요.
- **가드**: `qa-tester`
  - `components/MarketIndexStrip/MarketIndexStrip.test.tsx:162` — §D-6 카피 변경으로 빨개진다.
    **상수를 기대값으로 쓰는 동어반복 금지**(축약 회귀가 무음 통과한다). 문장을 직접 적되
    `'실시간'`·`'참고용'` 두 낱말이 모두 있는지 단정하라.
  - 새 단정 3개: ①상승 셀에 `▲`, 하락 셀에 `▼` 가 있고 **보합 셀에는 마크가 없다**
    ②`Change` 의 textContent 는 여전히 `formatChangePercent` 결과와 **정확일치**(현행 89행 유지)
    ③6종 상태 전부에서 `listitem` 이 **6개**(개수를 하드코딩하지 말고 `MARKET_INDICES.length` 에서 파생).
  - `test/landing/landingStructure.test.tsx:44` 의 h2 순서 배열은 **이미 맞다**(`'주요 지수'` 맨 앞).
    G1 래핑으로 바뀌지 않는다 — 그대로 두라.
  - 좌표·색·대비는 jsdom 이 못 본다. §F-2 를 테스트로 옮기지 마라.
- **리뷰**: `reviewer` — 특히 ①`tintscan` 이 1280·390 둘 다 **2개**인가 ②새 대비 쌍이 **0개**인가
  (`shared/styles/contrast.test.ts` diff 가 비어 있어야 한다) ③`ctaBottom @390 = 258` 이 바이트 단위로
  같은가 ④`CHANGE_COLOR` 맵의 값이 안 바뀌었는가(손익색이 새 표면으로 안 번졌는가)
  ⑤§E-2 의 잔여 리스크(macOS 글리프)를 한 컷이라도 봤는가.

---

## H. 🔴 사용자 판단이 필요한 것 (실행하지 않았다)

1. **`'주요 지수'` 라는 제목이 이제 부정확하다.** 다른 트랙이 6번째 항목으로 **`원/달러`(환율, `KRW=X`)** 를
   넣었는데 환율은 지수가 아니다(`shared/lib/marketIndices/registry.ts:32`). 화면 첫 줄이 사실과 어긋난다.
   후보: `'오늘의 시장'` · `'주요 지수와 환율'`. **실행하지 않았다** — 이 문자열은
   `MARKET_INDEX_COPY.title`·`MarketIndexStrip.test.tsx:20`·`test/landing/landingStructure.test.tsx:44`
   세 곳의 계약이고, 6번째 항목을 넣은 트랙의 의도(임시인지 확정인지)를 모른다.
2. **390 에서 서사가 늦게 시작한다.** 스트립을 위로 올린 대가는 이 스펙의 처방을 다 적용해도 남는다 —
   "배우기" 그룹(S3 개념)의 시작점이 @390 에서 **461px**(스트립이 맨 아래였던 2026-08-01 상태)
   → **796px**(현행) → **757px**(이 스펙 적용 후, +296px)이다.
   §D-2 의 압축이 −51px 을 되돌리고 §D-1 의 간격 정리가 +12px 을 쓴다(순 −39px). 더 줄이려면 좁은 폭에서 지수를 6개 다 보이지 않게 하거나
   히어로를 줄여야 하고 **둘 다 확정 결정**이라 손대지 않았다. 첫 화면 우선순위가 "시세"가 맞는지
   사용자에게 한 번 더 확인할 가치가 있다(스크린샷 `live-hero-strip.390.png`).
3. **배치 A/B.** §D-1(G1 그룹, 38.4/24px) ↔ 현행(HeroBlock 안, 20/12px)은 **JSX 두 줄 차이**다.
   두 컷을 나란히 보고 고르는 것이 가장 싸다.
4. **`MarketIndexStrip` 은 지금 다른 트랙이 만지고 있다**(§0). 이 스펙과 그 트랙의 변경이 같은 파일에서
   만난다 — 오케스트레이터가 **순서를 정해** 한 트랙씩 들어가게 하라. 동시 편집은 `.tsx`/`.styled.ts`
   양쪽에서 충돌한다.
5. **정본 문서 동기화.** `docs/landing-visual-language-spec.md` 의 §C-1 S2 행 · §C-4 그룹 편성 · §D-7 은
   이 문서가 덮어쓴 상태다. 정본을 고칠지(권장) 두 문서를 함께 둘지는 오케스트레이터 판단이다.
