# public/fonts — 셀프호스팅 웹폰트 (생성물)

이 폴더의 `.woff2` 는 **자동 생성물**이다. 직접 편집하지 말고 아래로 다시 만든다.

```sh
node tools/fonts/build.mjs
```

CDN 을 쓰지 않는 이유는 셋이다 — 서드파티 요청(프라이버시), 렌더 블로킹, 오프라인 실패.
전부 `font-display: swap` 이라 폰트가 늦어도 글은 먼저 읽힌다.

## 역할 4종

폰트 스택과 역할은 [`shared/styles/tokens.ts`](../../shared/styles/tokens.ts) 의 `font` 토큰이 정한다.
`@font-face` 선언은 빌드 스크립트가 [`shared/styles/selfHostedFonts.css`](../../shared/styles/selfHostedFonts.css)
에 생성하고 `main.tsx` 가 import 한다.

| 역할 | 서체 | 조달 | 이 폴더의 산출물 |
|---|---|---|---|
| `font.sans` — 본문·라벨·버튼·입력 | Wanted Sans Variable | npm `wanted-sans` (92분할 동적 서브셋 CSS 를 그대로 import) | 없음(node_modules 에서 번들) |
| `font.display` — 워드마크·헤딩(h1~h6) | Gmarket Sans Bold | 공식 zip → 92분할 동적 서브셋 | `gmarket/GmarketSans-Bold.split.<n>.<해시>.woff2` (91개) |
| `font.heroNumeric` — 화면당 1곳의 주인공 숫자 | LINE Seed Sans KR Bold | 공식 zip → 숫자·기호·단위 서브셋 | `line-seed/LINESeedSansKR-Bold.subset.<해시>.woff2` |
| `font.dataNumeric` — 표·칩·차트의 모든 숫자 | Inter Variable | 공식 릴리스 → opsz 16 고정 + 라틴/기호 서브셋 | `inter/InterVariable.subset.<해시>.woff2` |

`gmarket/` 이 91조각인 이유: 헤딩에는 **커뮤니티 글 제목 같은 사용자 입력**이 들어온다. 앱 코퍼스만
잘라 두면 예상 못 한 음절이 조용히 폴백돼 **한 제목 안에서 서체가 섞인다**. 한글 11,172자를 전부
담되 unicode-range 로 92분할해, 브라우저가 실제로 그리는 글자에 해당하는 조각만 내려받게 했다
(분할 경계는 Wanted Sans 동적 서브셋의 표를 그대로 쓴다).

## 파일명의 8자 해시 — 지우거나 손으로 고치지 마라

파일명 끝의 `.b1e2754f` 같은 8자는 **그 파일 내용의 sha256 앞자리**다. `vercel.json` 이 `/fonts/(.*)` 에
`max-age=31536000, immutable` 을 걸기 때문에, 이름이 그대로면 내용이 바뀌어도 **재방문자는 최대 1년간
낡은 조각을 쓴다**(immutable 은 재검증 자체를 하지 않아 강제 새로고침으로도 안 풀린다). 그러면 원본
폰트 버전이나 split 경계가 달라졌을 때 그 조각에 없는 음절이 생겨 **헤딩 일부가 폴백 서체·두부(□)로
섞인다.** 해시가 붙어 있으면 내용이 바뀐 조각만 이름이 바뀌어 그 조각만 다시 받는다.

`node tools/fonts/build.mjs` 를 다시 돌리면 해시는 자동으로 다시 계산되고
[`shared/styles/selfHostedFonts.css`](../../shared/styles/selfHostedFonts.css) 도 같은 실행에서 다시 생성되므로
파일과 선언이 어긋날 수 없다. 빌드는 **결정적**이다 — 입력이 같으면 같은 해시가 나온다(연속 2회 실행
93개 파일 바이트 동일 확인). 그래서 실제로 내용이 바뀐 파일만 diff 에 뜬다.

> ⚠ OG 용 `WantedSans-{Regular,Bold}.otf` 는 여기 규칙 밖이다 — 아래 "OG 이미지용 폰트" 참고.

## 원본 출처

| 서체 | 배포처 (스크립트가 받는 URL) | 원본 크기 |
|---|---|---|
| Wanted Sans 1.0.3 | npm `wanted-sans` — https://github.com/wanteddev/wanted-sans | — |
| Gmarket Sans | https://corp.gmarket.com/fonts/GmarketSansOTF.zip | 1,627,786B |
| LINE Seed Sans KR (2023.09.06) | https://seed.line.me/src/images/fonts/LINE_Seed_Sans_KR.zip | 12,466,705B |
| Inter 4.1 | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | 33,707,794B |

## 라이선스 — 4종 모두 SIL Open Font License 1.1

OFL 1.1 조건 2 는 **배포본마다 저작권 고지와 라이선스 사본을 동봉할 것**을 요구한다. 그래서 서브셋
woff2 옆에 아래 4개 파일을 함께 커밋한다. 서브셋 woff2 자신도 name 테이블에 저작권 고지(ID0)와
라이선스 URL(ID14)을 유지하고 있고, 단독으로 쓸 수 있는 파일(LINE Seed·Inter)에는 전문(ID13)까지
남겼다. Gmarket 91조각은 어느 하나도 단독으로 쓸 수 없는 파편이라 전문을 조각마다 복사하지 않는다
(그렇게 하면 배포 총량이 190KB, 첫 화면이 21KB 늘어난다 — 전문은 아래 파일이 정본이다).

| 서체 | 고지 파일 | 근거(원문 인용) |
|---|---|---|
| Wanted Sans | [`OFL-WantedSans.txt`](OFL-WantedSans.txt) | 패키지 동봉 `fonts/OFL.txt`: "Copyright 2024 The Wanted Sans Project Authors … This Font Software is licensed under the SIL Open Font License, Version 1.1." |
| Gmarket Sans | [`OFL-Gmarket.txt`](OFL-Gmarket.txt) | 폰트 name ID13(영문+한글 전문)에서 추출: "Copyright © < 2019.>, <eBay Korea Co., Ltd.> … This Font Software is licensed under the SIL Open Font License, Version 1.1." / "[요약] 가능: 상업적 목적의 사용 (사용범위: 인쇄물,광고물, 온라인, 영상 포함 / 수정 및 배포)" |
| LINE Seed Sans KR | [`OFL-LINESeed.txt`](OFL-LINESeed.txt) | 폰트 name ID13: "© LY Corporation … This Font Software is licensed under the SIL Open Font License, Version 1.1." ⚠ 배포 zip·폰트 어디에도 **전문이 없어** 표준 OFL 1.1 전문을 이어 붙였다(전문은 폰트별로 다르지 않은 고정 텍스트) |
| Inter | [`OFL-Inter.txt`](OFL-Inter.txt) | 릴리스 동봉 `LICENSE.txt`: "Copyright (c) 2016 The Inter Project Authors … This Font Software is licensed under the SIL Open Font License, Version 1.1." |

웹 임베딩·상업적 사용·서브셋(수정본) 재배포는 4종 모두 허용된다. 공통으로 금지되는 것은 **폰트 자체를
단독으로 판매**하는 것과, 다른 라이선스로 재배포하는 것이다.

### ⚠ Gmarket 만 Reserved Font Name 이 선언돼 있다 (미해결 · 법률 자문 아님)

**사실관계부터.**

- `OFL-Gmarket.txt:5-6` 은 저작권 문구 뒤에 RFN 을 **실제로 선언한다**:
  "Copyright © < 2019.>, <eBay Korea Co., Ltd.> (<www.gmarket.co.kr>), **with Reserved Font Name
  \<Gmarket Sans Font\>**." → 선언된 이름은 `Gmarket Sans Font` 다.
- 이 앱이 `@font-face` 로 선언하는 family 명은 **`Gmarket Sans`** 다(`Font` 없음) — **완전 일치가 아니다**.
- 나머지 3종(Wanted Sans · LINE Seed · Inter)은 저작권 문구에 **RFN 선언이 없다**(각 OFL 파일 1행 확인).
  그 3종에는 이 논점 자체가 성립하지 않는다.
- OFL 1.1 의 정의(`OFL-Gmarket.txt:20`): *"**Modified Version** refers to any derivative made by adding
  to, **deleting**, or substituting in part or in whole any of the components of the Original Version,
  **by changing formats** or by porting the Font Software to a new environment."* 우리는 **글리프
  삭제(서브셋)** 와 **OTF→WOFF2 포맷 변환** 을 둘 다 했다 — 정의상 Modified Version 으로 읽히는 쪽에 가깝다.
- 조건 3(`OFL-Gmarket.txt:51-53`): *"No Modified Version of the Font Software may use the Reserved Font
  Name(s) unless explicit written permission is granted by the corresponding Copyright Holder. This
  restriction only applies to the primary font name as presented to the users."*
- 같은 파일의 지마켓 공식 요약(`OFL-Gmarket.txt:73-89`)은 **"가능: 상업적 목적의 사용 (사용범위:
  인쇄물,광고물, 온라인, 영상 포함 / 수정 및 배포)"** 로 수정·배포를 허용하면서, 동시에
  **"필수조건: … 수정 시 명칭 변경"**, **"수정은 가능하나, 수정 시 'G마켓산스 폰트'라는 명칭은 사용할 수
  없습니다."** 라고 적는다.

**판단.** 위를 종합하면 이 앱의 서브셋은 "글리프를 고치지 않았다"는 이유만으로 RFN 조항을 확실히 벗어난다고
**단정할 수 없다**. 벗어난다고 볼 여지(선언명 `Gmarket Sans Font` ≠ 사용명 `Gmarket Sans`, 원본 디자인 무변형,
조건 3 이 "사용자에게 제시되는 주 폰트명"에만 적용된다는 단서)와, 걸린다고 볼 여지(서브셋+포맷 변환 =
Modified Version, 한글 요약의 "수정 시 명칭 변경") 가 **둘 다 있다. 회색지대다 — 이 문서는 법률 자문이 아니다.**

**해소 방법(미결 · 사용자 결정 대기).** family 명을 앱 고유명(예: `Snowball Display`)으로 바꾸면 논점이 통째로
사라진다 — OFL 이 요구하는 것은 **이름 변경**이지 사용 금지가 아니기 때문이다. 저작권 고지(ID0)·라이선스
동봉·OFL 유지는 그대로 두면 된다. 지금 바꾸지 않은 이유는 폰트 family 명 변경이 확정 스펙과 토큰
문자열(`shared/styles/tokens.ts` 의 `font.display`)을 함께 건드리는 결정이라 **사용자 승인 대기 항목**이기
때문이다. 다른 선택지는 지마켓에 서면 허가를 요청하는 것이다(조건 3 이 명시하는 예외 경로).

## OG 이미지용 폰트는 여기가 아니다

`/api/og` 는 Satori 로 PNG 를 그리는데 **Satori 는 woff2 를 읽지 못한다(ttf/otf/woff 만)**. 그래서 OG 용
Wanted Sans **otf** 는 이 폴더가 아니라 빌드 때 `node_modules/wanted-sans/fonts/otf/` 에서
`dist/fonts/` 로 복사된다(`vite.config.ts` 의 `ogFontsPlugin`). 레포에 약 1.35MB 바이너리 2개를 커밋하지
않기 위해서다.

그 두 파일(`WantedSans-Regular.otf` · `WantedSans-Bold.otf`)에는 **일부러 해시를 붙이지 않았다.** 소비자가
브라우저 캐시가 아니라 **서버리스 콜드 컨테이너**이고(`server/handlers/Og/Og.tsx` 가 고정 파일명으로 런타임
fetch → 모듈 스코프 캐시), 낡은 사본을 받아도 피해가 "OG PNG 가 한 버전 낡은 서체로 그려짐"(육안 무차)에
그친다. 반대로 해시를 붙이면 서버 핸들러가 빌드 산출물의 해시를 런타임에 알아야 해서, 어긋나는 순간
**OG 가 정적 이미지로 조용히 폴백**한다 — 실패 모드가 더 나쁘다.
