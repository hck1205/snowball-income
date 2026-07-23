---
name: refresh-data
description: >-
  snowball-income 티커 시장데이터 갱신 도메인 워크플로 — Yahoo Finance(무키)로 유니버스의
  가격·배당률·주기를 갱신하고, 검증 → api 번들 재생성 → ship. 배당 3분류를 존중(expectedTotalReturn
  자동갱신 금지)하고, 아웃라이어 가드에 걸려 스킵된 티커를 반드시 로그로 확인한다. "티커 데이터
  갱신 / 시세 새로고침 / marketData 업데이트" 요청에서 트리거. 매월 크론이 자동으로도 돈다.
---

# refresh-data — 티커 시장데이터 갱신 (도메인 반복)

`shared/constants/marketData/marketData.generated.json`을 Yahoo Finance(무료·무키)로 갱신한다. 매월 1일 크론
(`.github/workflows/refresh-tickers.yml`)이 **자동으로** 돌지만, 수동 갱신·재실행·디버깅 때 이 절차를 쓴다.

> ⚠ **가장 조심할 것 = 계산 정확성 + 하위호환.** 이 데이터가 시뮬레이션 기본값이다. 3분류를 어기면 사용자의 가정(expectedTotalReturn)을 자동으로 덮어써 사고가 난다.

## 트리거
"티커 데이터 갱신 / 시세 새로고침 / marketData 업데이트 / 크론이 실패했는데 수동으로".

## 절차

### 1. 갱신 실행 — Yahoo 기본, `--delay`로 살살
- 기본은 **dry-run**(디스크에 안 씀). 먼저 dry-run으로 무엇이 바뀔지 본다:
  `npm run ticker:refresh -- --provider=yahoo`  (report가 변경 예정을 보여준다).
- 실제 기록은 **`--write` 옵트인**(사고 방지): `npm run ticker:refresh -- --write --provider=yahoo --variant=stable --delay=2000`.
  `--delay=2000`은 ~68종을 2초 간격으로 흘려보내 러너 IP 버스트를 막는다(요일분할 대신 요청 딜레이로 레이트리밋 방어).
- 좁히려면 `--only=SCHD,VYM`(대문자, 콤마). `--only`가 `--bucket`을 완전히 대체한다. FMP는 유료 키 보유자만 `--provider=fmp`.

### 2. 스킵된 티커 로그 확인 — 🔴 #43 함정
- 아웃라이어 가드(±50% 가격변동)에 걸린 티커는 **이전 값을 유지하고 스킵**된다 — report의 `WARN` 줄을 반드시 본다.
- 🔴 스킵된 티커는 **가드를 우회하는 CLI 옵션이 없어** 프리셋 baseline이 옛날 값인 한 **매달 계속 리젝트**된다(무한 반복,
  새 이상값이 아니라 구조적 사각). 실측: 최초 성공 갱신에서 68종 중 19종(NVDA·AVGO·LRCX 등, 2024 10:1 액면분할과도 정합)이 걸렸다.
- 해법(이 스킬 범위 밖, 사람 판단): 실제 현재가를 확인해 `shared/constants/presets/*`의 `initialPrice`(필요시 `dividendYield`)를
  **한 번 수기 리베이스**하면 이후 월간 갱신은 정상(<50%) 변동만 본다. 스킵이 반복되면 리포트에 명시하고 사용자에게 리베이스를 제안.

### 3. 3분류 존중 — 무엇이 갱신되고 무엇이 불변인가
- 갱신됨(관측 사실): `initialPrice` · `dividendYield` · `frequency`.
- 🔴 **자동갱신 금지**: `expectedTotalReturn`(=사람의 가정) · `name`(큐레이트). 파이프라인이 절대 건드리지 않는다.
- 파생(쓰지 않음): `dividendGrowth`(=etr−dy). 과거 CAGR로 덮어쓰지 않는다. — 이 규율이 깨지면 계산이 조용히 틀어진다.

### 4. 검증 — tsc + test
- `npx tsc -b tsconfig.build.json` (전체) + `npm run test:ci`(=`SnowballApp.test.tsx` 제외, main에서 무관하게 깨져 있음).
  나쁜 스냅샷이면 이 게이트에서 걸려 아무것도 배포되지 않는다.

### 5. api 번들 재생성 — 🔴 필수 (marketData 임베드)
- 🔴 **`npm run api:bundle` 필수.** `ticker-html.js`가 marketData를 임베드하고(`tickers→presets→marketData`), `og.js`도
  `ogCard` 재시뮬 경로로 **전이 의존**한다(#43 실측: 재번들한 `api/og.js` diff에 새 marketData가 그대로 인라인). 최상위 import grep만 믿지 말 것.
- `npm run verify`가 4·5단계(api:bundle→api:check→build)를 한 번에 해준다 — 갱신 후 `npm run verify`로 마무리하는 게 안전.

### 6. ship
- 트랙 = `ticker-data`. `ship` 스킬로 브랜치·PR.
- ⚠ **승인 경계**: **매월 크론의 자동머지는 [[ask-before-deploy]]의 승인된 예외**(사용자가 티커 데이터에 한해 자동배포 승인).
  하지만 **세션에서 수동으로 돌린 갱신을 배포**할 때는 그 예외가 아니다 — 일반 T4처럼 **사용자 승인 먼저**.

## 검증(요약)
dry-run으로 변경 확인 → `--write` → WARN(스킵) 확인 → tsc+test:ci → `npm run api:bundle`(+verify) → 3분류 불변 확인 → ship(승인).

## 함정 압축
- dry-run 기본·`--write` 옵트인. · 19종 가드 스킵은 프리셋 리베이스 전엔 영구 반복(CLI 우회 없음). · expectedTotalReturn/name 자동갱신 금지. · api:bundle 필수(og 전이의존). · 크론 자동머지만 승인 예외, 수동배포는 승인 필요.

## 진화
이 절차가 현실과 어긋나거나 더 나은 길이 보이면 `.claude/knowledge/retro.md`(또는 pitfalls data)에 근거를 남기고 이 스킬을 고쳐라. 프로세스는 살아있다(dev-process 마스터 §4).
