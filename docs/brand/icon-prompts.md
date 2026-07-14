# 아이콘 생성 프롬프트 (favicon / 앱 아이콘 / OG 이미지)

이미지 생성 모델(Midjourney, DALL·E, Ideogram, Recraft 등)에 그대로 붙여 넣어 쓰는 프롬프트 모음.
Recraft·Ideogram이 **벡터/플랫 아이콘**에 가장 강하고, SVG로 바로 뽑을 수 있어 favicon에 적합하다.

## 브랜드 컨텍스트 (프롬프트에 반영된 전제)

| 항목 | 값 |
|---|---|
| 제품 | Snowball Income — 배당 재투자(복리) 시뮬레이터 |
| 브랜드 컬러 | 글레이셔 애저 `#136d97` (라이트) / `#1f7ba5` (다크) — hue ~200 |
| 배경 (라이트/다크) | `#f5f8fa` / `#0e141a` |
| 은유 | 눈덩이가 굴러 커진다 = 배당이 재투자되어 복리로 불어난다 |
| 톤 | 신뢰감 있는 금융 도구. 귀엽거나 장난스럽지 않게. 화살표·막대그래프 클리셰 회피 |

## 필요한 산출물

| 파일 | 크기 | 용도 |
|---|---|---|
| `public/favicon.svg` | 벡터 | 브라우저 탭 (다크모드 대응 위해 SVG 권장) |
| `public/favicon-32.png`, `favicon-16.png` | 32/16 | 레거시 폴백 |
| `public/apple-touch-icon.png` | 180×180 | iOS 홈 화면 |
| `public/icon-192.png`, `icon-512.png` | 192/512 | PWA 설치 (`site.webmanifest`가 요구) |
| `public/icon-maskable-512.png` | 512 | 안드로이드 maskable (안전영역 = 중앙 80%) |
| `public/og-image.png` | 1200×630 | 카카오톡·트위터·페이스북 공유 미리보기 |

---

## 1. 파비콘 / 앱 아이콘 — 안 A: 동심원 (현재 브랜드 마크 계열)

> A minimalist app icon for a dividend compounding calculator. Three concentric circles sharing one center, each ring thicker and further out than the last, suggesting growth accumulating outward — like a snowball gaining layers. Flat vector, geometric precision, no gradients on the rings. Deep glacier azure (#136d97) rings on a soft off-white (#f5f8fa) rounded-square tile with a subtle inner shadow. Centered composition with generous padding. Clean, calm, trustworthy — a financial instrument, not a toy. No text, no arrows, no bar charts, no coins. Crisp at 16px.

**다크 변형**: `on a soft off-white (#f5f8fa)` → `on a near-black (#0e141a)`, 링 색 `#1f7ba5`.

## 2. 파비콘 / 앱 아이콘 — 안 B: 눈덩이 궤적

> A minimalist app icon: a solid circle at the lower right, trailed by three progressively smaller circles curving up to the upper left — a snowball rolling downhill and growing, read as a compounding curve. Flat vector, single color, geometric. Deep glacier azure (#136d97) on soft off-white (#f5f8fa), rounded-square tile. The largest circle carries a single subtle highlight arc to read as volume. Restrained and precise, the visual language of a financial tool rather than a game. No text, no arrows, no dollar signs. Legible at 16px.

## 3. 파비콘 / 앱 아이콘 — 안 C: 나선 (복리의 기하)

> A minimalist app icon based on a logarithmic spiral drawn as a series of dots that grow in size along the curve, from a tiny dot at the center to a large one at the outer end — compounding made geometric. Flat vector, dots only, no connecting line. Deep glacier azure (#136d97) on soft off-white (#f5f8fa), rounded-square tile, centered. Mathematical, quiet, premium. No text, no arrows, no chart cliches. Must survive scaling to 16px — keep the dot count low (5 to 7).

## 4. 안드로이드 maskable 512×512

위 프롬프트 중 하나에 다음을 덧붙인다:

> Full-bleed background (no rounded corners, no transparent margin) — the artwork fills the entire square canvas edge to edge, with the mark centered inside the middle 80% so that circular and squircle masks never crop it. Background is a flat #136d97; the mark is off-white (#f5f8fa).

## 5. OG 이미지 1200×630 (카카오톡 · 트위터 · 페이스북 공유 카드)

> A 1200x630 social share card for "Snowball Income", a dividend reinvestment simulator. Left two-thirds: the Korean headline "배당 재투자 시뮬레이터" in a bold Pretendard-like sans, with a smaller subline "월 배당 목표까지 몇 년 걸리는지 계산해 보세요". Right third: a clean line chart curving upward with a soft azure area fill beneath it, plus a small ring of concentric circles as a logo mark in the top left corner. Palette: deep glacier azure (#136d97) accents on a near-white (#f5f8fa) ground, one dark ink tone (#161d26) for type. Flat, generous whitespace, no photographic texture, no stock-photo people, no gradients on text. Reads clearly as a thumbnail at 300px wide.

> ⚠️ 이미지 모델은 **한글을 자주 틀린다.** 텍스트 없이 배경·그래프만 생성한 뒤, 한글 카피는 Figma/Canva에서 얹는 편이 안전하다. (현재 `public/og-image.png`는 DS 팔레트로 직접 생성해 둔 것이니, 마음에 들면 그대로 써도 된다.)

---

## 생성 후 처리 (직접 하거나 저에게 시키세요)

1. SVG로 받았다면 **16px에서 실제로 확인** — 링이 3개 이상이면 뭉개진다. 뭉개지면 링을 2개로 줄인 별도 favicon 버전을 만드는 게 정석이다.
2. PNG 파생본은 원본 SVG에서 뽑는다 (재생성 금지 — 픽셀이 어긋난다).
3. `public/site.webmanifest`의 `icons` 배열에 192/512/maskable 등록.
4. `index.html`의 `<link rel="icon">` / `apple-touch-icon` 갱신.
5. 배경 투명 PNG는 iOS에서 검게 나온다 — `apple-touch-icon`은 **반드시 불투명 배경**.

## 톤 가이드 (모델에 지시할 때 공통으로 붙이면 좋은 문구)

- 넣을 것: `flat vector`, `geometric`, `minimal`, `centered`, `generous padding`, `legible at 16px`
- 뺄 것: `no text`, `no arrows`, `no bar charts`, `no coins`, `no dollar signs`, `no 3D`, `no gradients`, `no drop shadows`, `no mascot`
