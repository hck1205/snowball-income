# 브랜드 원본 자산

사용자가 준 **원본 그림**이다. 여기서 파생물을 만들어 `public/` 에 넣는다.

| 원본 | 파생물 | 쓰는 곳 |
|------|--------|---------|
| `app_icon.png` (아기 하마, 1.3MB) | `public/hippo-mark.png` (256px, 62KB) | `BrandGlyph` — 앱 전역 심볼 |
| | `public/hippo.png` (720px, 510KB) | `HippoCoinScene` 무대의 하마 |
| | `public/favicon.ico` · `favicon-16/32.png` · `apple-touch-icon.png` · `icon-192/512.png` | 파비콘·홈화면·PWA |
| | `public/og-image.png` | 공유 카드(네이비 + 금색 괘선 + 하마) |
| `coin_icon.png` (금화, 2.2MB) | `public/coin.png` (512px, 326KB) | `HippoCoinScene` 의 금화 |

## 🔴 왜 `public/` 이 아니라 여기인가

`public/` 은 **빌드가 통째로 배포에 싣는 폴더**다. 원본 두 장이 거기 있으면 아무 코드도 부르지
않는 **3.4MB** 가 매 배포마다 따라간다(실측: app_icon 1,284,579B + coin_icon 2,150,239B).
파생물만 `public/` 에 두고 원본은 레포에만 남긴다 — 원본이 없으면 크기·크롭을 다시 뽑을 수 없다.

⚠ 그러니 **여기 있는 파일을 코드에서 import 하지 마라.** import 하는 순간 번들에 들어가
같은 낭비가 다시 시작된다. 크기를 다시 뽑아야 하면 스크립트로 `public/` 파생물을 재생성하라.
