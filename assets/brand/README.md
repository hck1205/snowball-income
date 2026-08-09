# 브랜드 원본 자산

사용자가 준 **원본 그림**이다. 여기서 파생물을 만들어 `public/` 에 넣는다.

| 원본 | 파생물 | 쓰는 곳 |
|------|--------|---------|
| `app_icon.png` (아기 하마, 1.3MB) | `public/hippo-mark.png` (256px, 62KB) | `BrandGlyph` — 앱 전역 심볼 |
| | `public/hippo.png` (720px, 510KB) | `HippoCoinScene` 무대의 하마 |
| | `public/favicon.ico` · `favicon-16/32.png` · `apple-touch-icon.png` · `icon-192/512.png` | 파비콘·홈화면·PWA |
| | `public/og-hungry-hippo.png` | 공유 카드(네이비 + 금색 괘선 + 하마) |
| | `public/og-image.png` | ⚠ 옛 주소. 같은 그림이고, 옛 HTML 을 캐시한 수집기용으로만 남겨 뒀다 |
| `coin_icon.png` (금화, 2.2MB) | `public/coin.png` (512px, 326KB) | `HippoCoinScene` 의 금화 |

## 재생성

```sh
npm run brand:assets   # 원본 → public/ 파생물 전종 재생성(하마·금화·파비콘·터치·PWA·OG)
npm run brand:check    # 알파 건전성 검사 — npm run verify 의 1단계이기도 하다
```

🔴 **손으로 만들지 마라.** 2026-08-03 에 배경을 "흰색"으로 키잉해 지우다가 이빨·눈 흰자·물
하이라이트까지 함께 뚫었다(밝은 픽셀의 알파 255 비율 **1%**). 원인은 `app_icon.png` 이 원본이 아니라
**투명 체커보드 위에 합성된 스크린샷**이라 "흰색을 지운다"가 곧 "체커보드의 밝은 타일을 지운다"였던
것이다. 지금 스크립트는 테두리에서 **연결성(flood-fill)** 으로 바깥 배경만 지워 내부 흰색을 지킨다.
복구 후: hippo-mark 16.7%→99.2% · hippo 41.1%→98.0%.

## 🔴 왜 `public/` 이 아니라 여기인가

`public/` 은 **빌드가 통째로 배포에 싣는 폴더**다. 원본 두 장이 거기 있으면 아무 코드도 부르지
않는 **3.4MB** 가 매 배포마다 따라간다(실측: app_icon 1,284,579B + coin_icon 2,150,239B).
파생물만 `public/` 에 두고 원본은 레포에만 남긴다 — 원본이 없으면 크기·크롭을 다시 뽑을 수 없다.

⚠ 그러니 **여기 있는 파일을 코드에서 import 하지 마라.** import 하는 순간 번들에 들어가
같은 낭비가 다시 시작된다. 크기를 다시 뽑아야 하면 스크립트로 `public/` 파생물을 재생성하라.
