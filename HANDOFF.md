# HANDOFF — 2026-07-25 (표시 통화 토글 · 카카오 계정 분리 · 내가 쓴 글 · 닉네임 중복 · 갤러리 발행 도구)

> 다음 세션은 이 문서부터. 이번 세션 산출물은 **PR #48 main 머지 · Vercel 프로덕션 배포 완료**.
> main = `6bf38b4`, 작업트리 클린, `npm run verify` 5단계 그린.
> 이전 핸드오프(2026-07-24 — ETF SEO·리컨사일·환율 위젯)는 git 히스토리 참고. 그 문서의 열린
> 사용자 액션(네이버 검수 등)이 아직 유효하면 계속 유효하다.

## 🔴 먼저 볼 것 — 사용자 액션 필요

| # | 할 일 | 왜 |
|---|---|---|
| 1 | **카카오 커스텀 로그인 활성화 여부 결정** | 코드는 라이브인데 **env 미설정으로 비활성**. §2 |
| 2 | 프로덕션 스모크 1회 | 공유 링크 OG 이미지 · 로그인 · 시뮬 결과. 특히 OG는 이번에 장애를 잡은 경로다(§7) |
| 3 | 비공개 포폴 글 검토 후 공개 여부 결정 | `/community/my-posts` → "비공개" 배지 글(id `70754f60-1601-4ac2-8646-87a270b11f6b`) |
| 4 | (선택) 카카오 identity 병합 해제 | 사용자 계정은 여전히 email+google+kakao 3개가 한 계정. §2 하단 |

---

## 1. 결과 표시 통화 원↔달러 토글

투자 설정 카드의 "배당 재투자" **아래**에 있다. **계산은 항상 원화**이고 토글은 결과 표시만 바꾼다.

- **원화 고정 표면(의도적 제외)**: 입력 필드, PDF 리포트, 커뮤니티 전 표면, OG 카드, 세법 상수 문구.
  앞의 셋은 다른 사용자에게 보이거나 게시 시점에 값이 굳는 곳이라 로컬 토글을 따라가면 안 된다.
- **`$NaN` 구조적 차단**: 선호(`displayCurrencyAtom`)와 실제 적용(`effectiveDisplayCurrencyAtom`)을
  분리했다. 환율이 없으면 적용이 원화로 떨어지므로 달러 포맷터가 `rate == null` 로 불릴 수 없다.
  **이 분리를 합치지 마라** — 합치는 순간 `$NaN` 경로가 열린다.
- **저장은 로컬 전용**(`snowball:display-currency`). 공유 URL·영속 payload 스키마 **무변경**.
  왕복 테스트가 스키마 동결 리터럴로 이를 단정한다(`test/main/displayCurrencyCompat.test.ts`).
- 달러 표기는 **K/M**. 원화의 억/만(10^8·10^4)을 달러(10^3·10^6)에 얹으면 자릿수 감각이 깨진다.
- 토글 스타일은 같은 카드의 다른 토글과 **동일한 기본 스위치**다. `onText`/`offText`/`controlWidth`
  를 다시 주면 그 줄만 넓어져 혼자 튄다(사용자가 두 번 지적한 지점). 라벨이 "달러로 표시"인 이유도
  이것 — 트랙에 글자가 없으니 명사 라벨("표시 통화")로는 켜짐이 원인지 달러인지 알 수 없다.
- ⚠ **모바일(≤960px) 트레이드오프**: 좌패널이 드로어로 접히므로 드로어를 열어야 전환할 수 있다.
  사용자가 알고 내린 결정이다(원래는 결과 컬럼 최상단에 있었다).

## 2. 카카오 커스텀 로그인 — **라이브지만 비활성 상태**

### 문제와 원인 (확정)

같은 이메일의 구글·카카오 로그인이 **한 계정으로 병합**된다. 실측:

```
user_id a83d3328-9537-4de9-88db-d213594b35f4   ← 하나
  · email  / headtotoe1205@gmail.com / verified=False / 2026-07-15
  · google / headtotoe1205@gmail.com / verified=True  / 2026-07-17
  · kakao  / headtotoe1205@gmail.com / verified=True  / 2026-07-17
```

GoTrue는 처음 보는 identity를 **새 계정으로 팔지 기존 계정에 붙일지**를 이메일로만 판단한다.
`auth.users.email` 이 유일 키이고, 공급자 id는 네임스페이스가 달라 서로 대조할 수 없기 때문이다.
카카오 콘솔에서 이메일 동의항목을 끄면 막히지만 **카카오가 이메일 없는 로그인을 허용하지 않는다**.

`profiles` 는 `auth.users` 와 1:1이라 계정이 하나면 닉네임·글·댓글도 하나를 공유한다.
(참고: Supabase 카카오 프로바이더의 "Allow users without an email" 옵션은 이 병합과 **무관**하다 —
카카오가 이메일을 **안 줄 때**만 관여한다.)

### 구현 (네이버 방식 승계)

`/api/kakao-auth` 커스텀 플로우 — 카카오 id 기반 **결정론적 합성 이메일**(`kakao_<id>@…`)로 계정을
만들어 실제 이메일과 구조적으로 겹치지 않게 한다. 세션은 `admin.generateLink(magiclink)` →
클라이언트 `verifyOtp`(네이버가 확립한 규약).

### ⚠ 활성화 절차 (지금은 꺼져 있다)

`VITE_KAKAO_CLIENT_ID` 가 없으면 `signInWithOAuth` 가 가로채지 않고 **기존 Supabase 카카오 플로우로
폴백**한다(설정 전 배포에서 로그인이 죽지 않게 한 안전장치). 그래서 **이번 배포로 카카오 로그인
동작은 바뀌지 않았다.**

켜려면:

1. **카카오 개발자 콘솔** → 앱 키의 **REST API 키**(JavaScript 키 아님) 복사
2. **Redirect URI 등록**: `<도메인>/community/auth/kakao/callback`
   (로컬은 `http://localhost:5173/community/auth/kakao/callback` — **포트가 다르면 KOE006**)
3. `.env` + **Vercel 환경변수**에 `VITE_KAKAO_CLIENT_ID` 추가.
   콘솔에서 Client Secret을 "사용함"으로 켰다면 `KAKAO_CLIENT_SECRET` 도(🚫 `VITE_` 금지)
4. **Supabase 대시보드에서 카카오 기본 프로바이더를 끈다** — 안 끄면 두 경로가 공존해 어느 쪽으로
   로그인했는지에 따라 계정이 갈린다
5. 로그인 1회 성공 확인 후 배포

### 미검증 — end-to-end 성공을 못 봤다

합성 계정은 실제로 생성됐다(`kakao_4995106957@kakao-oauth.snowball.invalid`, 세션 확립까지 확인).
그런데 반복 테스트 중 **KOE237(카카오 요청 허용 횟수 초과)** 에 걸려 마지막 성공 확인을 못 했다.
진단 과정에서 더미 code로 엔드포인트를 두 번 호출한 것도 한도에 포함됐다.

**다음 세션에서 할 일**: 한도가 풀린 뒤(몇 분) **딱 한 번** 시도. 연속 재시도는 창을 갱신해 역효과.

### 진단 인프라 (이번에 만든 것 — 다음 사고에서 바로 쓴다)

- 실패 사유가 **URL에 남는다**: `?kakaoLogin=failed&kakaoLoginReason=<단계>:<카카오코드>`
  (리다이렉트로 콘솔이 지워져 콘솔만으로는 진단이 안 됐다)
- 단계 6종: `state_mismatch` / `client_unavailable` / `server_error` / `no_token` / `verify_failed` / `unknown`
- 카카오 코드까지: `KOE006`(redirect_uri 불일치) `KOE320`(코드 재사용·만료) `KOE237`(한도) `KOE010`(secret)
- **서버 로그**에 카카오·네이버 **모든 실패**가 남는다(`shared/lib/server/authLog.ts`).
  성공(2xx)은 찍지 않는다 — 본문에 `token_hash` 가 있다.
- ⚠ **dev 서버는 `/api/*` 핸들러를 메모리에 캐시**한다(`vite.config.ts` `apiHandlerCache`).
  서버 코드를 고치면 **반드시 dev 서버를 재시작**해야 한다. HMR로는 반영되지 않는다 —
  이것 때문에 "고쳤는데 왜 옛 에러가 나오나"로 한 바퀴 돌았다.

### 병합 해제는 아직 못 했다

`DELETE /auth/v1/admin/users/{id}/identities/{identity_id}` 가 이 GoTrue 버전에서 **404**다
(`identity_id`(UUID)를 정확히 넣어도 — 처음엔 공급자 id를 넣는 실수도 있었다). 남은 길:

- **Supabase 대시보드**에서 직접 해제 시도 (Authentication → Users → 상세)
- 클라이언트 API `supabase.auth.unlinkIdentity()` — 설치된 supabase-js 2.110.5에 **있다**.
  단 대시보드에서 **"Enable Manual Linking"** 이 켜져 있어야 하고, 사용자 세션으로 호출해야 하며,
  identity가 2개 이상이어야 한다. 켜져 있으면 프로필 화면에 "연결된 로그인 수단 + 해제" UI를
  만들 수 있다(미착수 — 가장 값싼 다음 수).

### 이관 부담은 거의 없다 (실측)

전체 사용자 **5명**: email만 2 / google만 1 / **kakao만 1** / email+google+kakao 1(사용자 본인).
커스텀 플로우로 전환하면 kakao만 쓰는 1명이 새 빈 계정을 받는다 — 이관 스크립트를 만들 규모가 아니다.

## 3. "내가 쓴 글" 화면 (`/community/my-posts`)

비공개 글이 **어디에도 안 보이던** 문제. RLS는 본인 비공개 글을 허용하는데
(`using (is_public or user_id = auth.uid())`), 갤러리·게시판 목록 쿼리가 partial index를 태우려
`is_public = true` 를 명시적으로 건다(`shared/lib/supabase/queries.ts`). 갤러리로서는 옳은 동작이다.

- 프로필 드롭다운의 "프로필 설정" **바로 아래** 메뉴. 독립 라우트.
- 정의만 있고 호출처가 **하나도 없던** `fetchMyPosts` 를 처음 배선했다.
- 공개 전환 버튼은 **두지 않았다** — 되돌리기 어려운 동작이라 상세/수정의 기존 토글로 유도.
  (요청이 오면 그때 추가. 지금은 의도적 부재다.)
- `PostCard`/`PostRow` 재사용 안 함: 공개/비공개 배지가 없고, **공유 버튼이 항상 붙어 비공개 글의
  열리지 않는 URL을 공유**하게 된다.
- 섹션에 보이는 제목이 없다 — 페이지 h1과 중복돼 제거했고 랜드마크 이름은 `aria-label` 로 남겼다.
- 페이지네이션 없음 — 글이 수백 개가 되면 `useBoard` 의 keyset 패턴을 얹어야 한다.

## 4. 닉네임 중복 확인

- 입력이 멎으면 **400ms 디바운스** 후 조회, 통과했을 때만 저장 버튼이 열린다.
- **대소문자 무시**(`ilike`) — `Foo`/`foo` 공존은 목록·댓글에서 사칭처럼 읽힌다.
- **와일드카드 이스케이프** 필수: `%` 한 글자를 그대로 넘기면 **모든 닉네임이 중복으로 판정**된다.
- **저장 직전 재확인**: `display_name` 에 UNIQUE 제약이 없어 디바운스 검사 이후 선점될 수 있고
  DB가 막아주지 않는다. 여기가 마지막 방어선이다.
- 검사 실패(네트워크)를 "사용 가능"으로 **위장하지 않는다** — 저장을 막고 사유를 알린다.

⚠ **남은 한계**: UNIQUE 제약이 없어 동시 저장은 여전히 통과한다. 진짜 보장은 DB unique index인데
**기존 중복 데이터 정리가 선행**돼야 해서 별도 결정 사항으로 남겼다.

## 5. 갤러리 비공개 발행 도구 + RPC

### `publish_private_post` (마이그레이션 `20260729000000`)

**이미 프로덕션에 적용됨**(사용자가 대시보드에서 실행). 커밋은 레포에 기록을 남긴 것 — 없으면 새
환경 재구성 때 이 함수만 빠진다.

왜 테이블 GRANT가 아니라 RPC인가: **service_role은 RLS는 우회하지만 GRANT는 우회하지 못한다.**
이 프로젝트의 GRANT는 anon/authenticated에만 있어 service_role로는 posts에 쓸 수 없다(실측 42501).
테이블 권한을 열면 "아무 계정 명의로, 공개로도" 쓸 수 있게 되므로, **행위 하나**만 여는
SECURITY DEFINER 함수를 뒀다 — `is_public=false`·`kind='portfolio'` 가 **함수 본문에 하드코딩**돼
호출자가 무엇을 보내도 공개될 수 없다. payload CHECK·1인 30개 쿼터 트리거는 그대로 적용된다.

### `tools/gallery/` (표준 라이브러리만, 의존성 0)

```sh
python tools/gallery/check_account.py <email>          # 계정·프로필·쿼터·연결된 identity (읽기 전용)
python tools/gallery/validate_post.py <post.json>      # DB 제약 로컬 미러 검증
python tools/gallery/publish_post.py <post.json>       # 예행연습(기본 — 아무것도 쓰지 않는다)
python tools/gallery/publish_post.py <post.json> --commit   # 실제 발행(비공개 강제)
python tools/gallery/check_rpc.py publish_private_post # RPC 존재·시그니처 (호출하지 않는다)
python tools/gallery/unlink_identity.py <email> kakao   # identity 해제 (현재 admin 라우트 404)
```

키는 반환·출력·기록하지 않는다. Windows 콘솔(cp949) UTF-8 강제 포함.

### 발행된 글

`gallery-publisher` 에이전트(신설, `model: fable`)가 "인컴×성장 바벨" 포트폴리오를 설계해
**비공개로 발행**했다 — id `70754f60-1601-4ac2-8646-87a270b11f6b`.
월배당 55%(JEPI·JEPQ·O) × 배당성장 45%(SCHD·DGRO), 목표 월 200만원이 15년차 달성(앱 계산 검증).
직접 생성 티커 없음(전부 프리셋). 공개 여부는 사용자 판단 대기.

## 6. 그 외

- **`/ticker/all` 스크롤 리빌 제거**: `animation-timeline: view()` 로 opacity를 매어 아래 카테고리가
  반투명하게 비쳤다. 상세 페이지 blur를 같은 이유로 걷어낸 선례(2026-07-22)와 동일 판단.
  ⚠ **상세 페이지(`/ticker/<종목>`)에는 아직 같은 리빌이 남아 있다**(`TickerDetailPage.styled.ts`).
  사용자에게 물었으나 답을 못 받았다 — 거슬린다면 같은 방식으로 제거.
- **에이전트 모델 명시 지정**: 11개가 `inherit` 이라 병렬 실행 시 전부 Opus로 돌았다.
  brain(orchestrator·pm-po·reviewer·etf-seo-page-builder) → `fable`,
  실행자 → `claude-opus-4-8`(별칭이 아닌 명시 고정), 일부 `sonnet` 유지.
  ⚠ 명시 고정이라 **더 높은 Opus가 나와도 자동으로 따라가지 않는다** — 그때 `.claude/agents/*.md` 수정.
- **`vitest.config.ts` 에서 `.claude/worktrees/**` 제외**: 다른 세션이 남긴 워크트리가 자체
  `node_modules` 를 가져 React 이중 인스턴스로 테스트 499건을 깨뜨렸다.

## 7. 🔥 이번에 잡은 실제 장애 — 반드시 기억할 것

**`api/og.js` 가 Node에서 모듈 평가 단계에 죽었다** = 모든 공유 링크·포폴 글의 OG 이미지 500.
(배포 전에 잡았다 — 프로덕션에 나가지 않았다.)

원인: 새 fx atom이 `@/shared/lib/analytics` 를 **정적 import** 했고, 그 모듈이 최상단에서
`import.meta.env.VITE_*` 를 읽는다. Node ESM에서 `import.meta.env` 는 `undefined` 라
**핸들러가 호출되기도 전에** TypeError로 죽는다. `@/jotai` 배럴 → `shareLink` → `Og` 핸들러 경로로
딸려 들어갔다.

**왜 게이트가 못 잡았나**: `api:check` 는 바이트 일치만 보고 **실행하지 않는다**. Vitest는 Vite
환경이라 `import.meta.env` 가 **늘 정의돼 있어** 영원히 초록이다. 3300개 테스트 통과가 무죄
증거가 못 됐다.

**대응**: analytics를 catch 안에서 동적 import로 미뤘고, `api:check` 에 **전 번들 `import()` 스모크**
를 추가했다(일부러 되돌려 가드가 실패를 잡는 것까지 확인). 이제 이 부류는 자동으로 잡힌다.

**교훈**: `api/*` 번들에 들어가는 경로에 **모듈 최상단에서 `import.meta.env` 를 읽는 모듈**을
끌어들이지 마라. 브라우저 전용 모듈은 사용 지점에서 `await import(...)` 로 미룬다.

## 8. 알려진 간헐 현상

- **Supabase `403 bad_jwt`** ("unrecognized JWT kid `<nil>` for algorithm ES256"): 같은 admin API
  요청이 몇 초 뒤엔 성공한다. 세션 중 여러 번 재현됐고 원인 미확인. service_role 키를 쓰는
  경로(`api/account-delete`, `api/naver-auth`, `api/kakao-auth`, `tools/gallery/*`)가 이걸 맞으면
  각자의 실패 코드로 떨어진다. 프로덕션에서 로그인·탈퇴 실패가 보고되면 이걸 먼저 의심할 것.

## 9. 미검증 / 남은 일

- **실브라우저 반응형** — jsdom은 `@media` 를 평가하지 않는다. 표시 통화 토글의 모바일 드로어,
  "내가 쓴 글" 좁은 화면, 긴 제목 clamp는 눈으로 봐야 한다.
- **카카오 커스텀 로그인 end-to-end** (§2).
- **정밀 모드 달러 정렬**: `$3.42` 와 `$270,636` 이 한 표에 오면 소수점 정렬이 어긋날 수 있다.
- **`formatApproxUSD(999,999)` → `약 $1,000K`** 경계 quirk. 원화(`99,999,999원 → 약 10,000만`)와
  동형이라 의도적으로 수용했다 — 뒤집으려면 원화도 같이 바꿔야 한다.
- **달러 축 눈금이 "예쁜 수"가 아니다** — ECharts가 원화 데이터로 눈금을 고르고 라벨만 나눈다.
  ⚠ 이걸 고치려고 **시리즈 데이터 자체를 달러로 바꾸는 유혹을 경계**할 것(스택 합계 정확성이 무너진다).
- **닉네임 UNIQUE 제약** (§4).
- **`unlinkIdentity` 기반 로그인 수단 관리 UI** (§2) — 미착수, 가장 값싼 다음 수.
- **표시 통화 카피 재검토**: 원화 사용자에게도 환율 실패 문구가 결과 영역에 상주한다.
  사양 준수 상태지만 노이즈일 수 있다(pm-po 판단 사항으로 남겨둠).
