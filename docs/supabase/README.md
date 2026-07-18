# Supabase 커뮤니티 레이어 설정

시나리오 갤러리 · 좋아요 · 조회수 · 댓글/대댓글을 위한 백엔드다.
**설정하지 않아도 앱은 지금 그대로 동작한다** — 환경변수가 없으면 커뮤니티 기능만 꺼진다
(IndexedDB 저장과 lz-string 공유 URL은 백엔드와 무관하게 계속 작동한다).

| 항목 | 위치 |
|------|------|
| 마이그레이션 SQL | [`supabase/migrations/20260714000000_community.sql`](../../supabase/migrations/20260714000000_community.sql) |
| DB key 공유 링크(`?s=`) 마이그레이션 | [`supabase/migrations/20260720000000_shared_snapshots.sql`](../../supabase/migrations/20260720000000_shared_snapshots.sql) (설정 절차: §9) |
| 클라이언트 데이터 레이어 | [`shared/lib/supabase/`](../../shared/lib/supabase) |
| 네이버 로그인 서버 브릿지 | [`api/naver-auth.ts`](../../api/naver-auth.ts) (설정 절차: §7) |
| 순수 함수 테스트 | [`test/community/`](../../test/community) |

---

## 1. 프로젝트 생성

1. <https://supabase.com/dashboard> → **New project**
2. Region은 **Northeast Asia (Seoul)** 권장 (한국 사용자 기준 지연 최소).
3. DB 비밀번호는 안전한 곳에 보관 (앱에서는 쓰지 않는다).
4. 생성되면 **Project Settings → API**에서 두 값을 복사한다:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon` / `public` 키 → `VITE_SUPABASE_ANON_KEY`

> ⚠ **`service_role` 키는 절대 쓰지 않는다.** 이 키는 RLS를 통째로 우회한다.
> 프론트엔드 코드·`.env`·문서·커밋 어디에도 넣지 마라. 브라우저에 노출되는 순간
> 누구나 모든 사용자의 데이터를 읽고 지울 수 있다.

---

## 2. 마이그레이션 적용

### 방법 A — SQL Editor (가장 간단)

1. 대시보드 → **SQL Editor** → **New query**
2. `supabase/migrations/20260714000000_community.sql` 전체를 붙여넣고 **Run**
3. 성공하면 **Table Editor**에 `profiles / scenarios / scenario_likes / comments / comment_likes / scenario_views` 6개 테이블이 보인다.

### 방법 B — Supabase CLI

```sh
npx supabase login
npx supabase link --project-ref <프로젝트-ref>
npx supabase db push
```

### 적용 확인

SQL Editor에서:

```sql
-- 6개 테이블 전부 rowsecurity = true 여야 한다.
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public'
 order by tablename;
```

RLS가 하나라도 꺼져 있으면 **그 테이블은 anon 키로 무제한 접근 가능한 상태**다. 즉시 확인할 것.

> 이 마이그레이션은 **멱등**하다 (재실행해도 안전하다). 조회수 해싱 솔트는 최초 1회만 생성되고
> 재실행 시 덮어쓰지 않는다 (덮어쓰면 기존 조회수 dedupe 기록이 전부 무효화되기 때문).

---

## 3. OAuth 설정 (구글 / 카카오)

두 프로바이더 모두 **Supabase가 대신 받아주는 콜백 URL**을 각 콘솔에 등록하는 구조다.
이 URL을 정확히 넣는 것이 설정의 90%다:

```
https://<프로젝트-ref>.supabase.co/auth/v1/callback
```

### 3-1. 구글

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 선택/생성
2. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부(External)**
   - 앱 이름/지원 이메일 입력, 게시 상태를 **프로덕션**으로 (테스트 모드면 등록한 테스터만 로그인된다)
   - 범위(scope)는 기본값(`email`, `profile`)이면 충분하다
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI**에 위 콜백 URL을 추가
4. 발급된 **클라이언트 ID / 클라이언트 보안 비밀**을 복사
5. Supabase 대시보드 → **Authentication → Sign In / Providers → Google** → 활성화 후 두 값 붙여넣기 → Save

### 3-2. 카카오

1. [Kakao Developers](https://developers.kakao.com/) → **내 애플리케이션 → 애플리케이션 추가하기**
2. **앱 설정 → 앱 키**에서 **REST API 키**를 복사 → 이게 Supabase의 **Client ID**다
   (JavaScript 키가 아니다 — 자주 틀리는 부분)
3. **제품 설정 → 카카오 로그인** → **활성화 설정 ON**
4. **제품 설정 → 카카오 로그인 → Redirect URI**에 위 콜백 URL 등록
5. **제품 설정 → 카카오 로그인 → 보안** → **Client Secret** 생성 후 **활성화 상태 ON**
   → 이 값이 Supabase의 **Client Secret**이다
6. **제품 설정 → 카카오 로그인 → 동의항목**
   - `닉네임`(profile_nickname), `프로필 사진`(profile_image) → **필수 동의** 권장
   - **이메일은 받지 않아도 된다.** 이 앱은 이메일을 쓰지 않고, 공개 `profiles` 테이블에도 저장하지 않는다
     (수집하지 않는 게 가장 안전한 개인정보 처리다)
7. Supabase 대시보드 → **Authentication → Sign In / Providers → Kakao** → 활성화 후 REST API 키 / Client Secret 입력 → Save

### 3-3. 리다이렉트 URL 허용목록 (필수)

Supabase 대시보드 → **Authentication → URL Configuration**

| 항목 | 값 |
|------|-----|
| **Site URL** | 배포 도메인 (예: `https://snowball-income.example`) |
| **Redirect URLs** | `http://localhost:5173/**`, `https://<배포도메인>/**` |

클라이언트는 `signInWithOAuth(client, 'google', redirectTo)`로 돌아올 주소를 넘기는데,
**여기 등록되지 않은 주소로는 Supabase가 돌려보내지 않는다.** 로컬 개발 주소를 빼먹으면
개발 중에 로그인이 안 된다.

---

## 4. 환경변수

`.env.example`을 `.env`로 복사하고 값을 채운다:

```sh
VITE_SUPABASE_URL=https://<프로젝트-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon 키>
```

- **둘 다 있어야** 커뮤니티가 켜진다. 하나만 있으면 "반쯤 켜진 상태"를 만들지 않고 **꺼진다**.
- **anon 키는 공개값이다.** 브라우저 번들에 그대로 실려 나가도록 설계된 키이고, 커밋해도 된다.
  이 키의 권한은 전적으로 RLS 정책이 결정한다 — 그래서 RLS가 유일한 방어선이다.
- **`service_role` 키는 어떤 경우에도 `VITE_` 접두사를 붙이면 안 된다.**
  `VITE_`가 붙은 변수는 전부 번들에 인라인되어 공개된다.

CI/호스팅(Vercel, Netlify 등)에서는 같은 이름의 환경변수로 주입하면 된다.
환경변수를 주지 않으면 커뮤니티가 꺼진 채로 빌드된다 — **백엔드 없는 정적 배포가 그대로 유지된다.**

---

## 5. RLS 정책 요약 — 누가 무엇을 할 수 있는가

`anon` = 로그아웃 상태, `authenticated` = 로그인 사용자(남의 데이터), `owner` = 본인 데이터.

| 테이블 | 작업 | anon | authenticated | owner | 비고 |
|--------|------|:----:|:-------------:|:-----:|------|
| `profiles` | select | ✅ | ✅ | ✅ | 닉네임·아바타는 공개. **이메일 등 PII는 이 테이블에 없다** |
| | insert | ❌ | ❌ | ✅ | 보통 가입 트리거가 자동 생성 |
| | update | ❌ | ❌ | ✅ | 남의 닉네임 변경 불가 |
| | delete | ❌ | ❌ | ❌ | 계정 삭제 시 CASCADE로만 |
| `scenarios` | select | ✅ 공개만 | ✅ 공개만 | ✅ 비공개 포함 | 남의 비공개는 안 보인다 |
| | insert | ❌ | — | ✅ | `user_id` 위조 차단 (사칭 불가) |
| | update | ❌ | ❌ | ✅ | **카운터 컬럼은 owner도 불가** (컬럼 GRANT) |
| | delete | ❌ | ❌ | ✅ | |
| `scenario_likes` | select | ✅ | ✅ | ✅ | 좋아요는 공개 정보 |
| | insert | ❌ | ✅ | ✅ | 본인 이름으로만 + 볼 수 있는 시나리오만 |
| | delete | ❌ | ❌ | ✅ | 남의 좋아요 취소 불가 |
| | update | ❌ | ❌ | ❌ | 정책 없음 = 전면 거부 |
| `comments` | select | ✅ | ✅ | ✅ | 단, **보이는 시나리오의 댓글만** |
| | insert | ❌ | ✅ | ✅ | 대댓글은 1단계까지 (트리거) |
| | update | ❌ | ❌ | ✅ | `body`/`deleted_at`만 (컬럼 GRANT) |
| | delete | ❌ | ❌ | ❌ | **하드 삭제 전면 차단** — 소프트 삭제만 |
| `comment_likes` | select | ✅ | ✅ | ✅ | |
| | insert | ❌ | ✅ | ✅ | 삭제된 댓글엔 불가 |
| | delete | ❌ | ❌ | ✅ | |
| `scenario_views` | 전부 | ❌ | ❌ | ❌ | **클라이언트 접근 0** — `register_scenario_view()` RPC 전용 |

### 어뷰징 방어 요약

| 공격 | 막는 방법 |
|------|-----------|
| 좋아요 여러 번 누르기 | `(scenario_id, user_id)` **복합 PK** — 경쟁 조건에서도 중복 불가 |
| 새로고침으로 조회수 뻥튀기 | `scenario_views`에 **(시나리오, 뷰어해시, 1시간 버킷)** 유니크 → 뷰어당 1시간에 1회 |
| 조회수 토큰 갈아끼우기 | 익명은 **IP 우선**(해시) — localStorage를 지워도 무의미 |
| 좋아요/조회수 숫자 직접 조작 | 카운터 컬럼에 **UPDATE 권한 없음**. 트리거(SECURITY DEFINER)로만 갱신 |
| 댓글 도배 | **1분 10개** 레이트리밋 트리거 |
| 거대 JSON 업로드 | `payload` **64KB** CHECK + 티커 50개 상한 |
| 시나리오 무한 생성 | 1인 **30개** quota 트리거 |
| 대댓글의 대댓글로 트리 붕괴 | `enforce_comment_rules` 트리거가 2단계 중첩 거부 |
| 댓글 하드 삭제로 트리 붕괴 | DELETE 권한/정책 자체를 주지 않음 |
| 남의 글/댓글 수정·삭제 | RLS (`auth.uid() = user_id`) |

> **조회수 IP 해싱과 개인정보**: IP는 개인정보라 **원본을 저장하지 않는다.**
> 비밀 솔트(`private.app_config`, 클라이언트 접근 불가)와 함께 `sha256`으로 해싱한 값만 남긴다.
> 솔트 없이 해싱하면 IPv4는 43억 개뿐이라 레인보우 테이블로 즉시 역산된다 — 솔트가 핵심이다.

---

## 6. (선택) 조회수 원본 테이블 정리

`scenario_views`는 dedupe 용도라 1시간 지난 기록은 쓸모없다. 무료 티어(500MB) 보호를 위해
하루 1번 정리하는 걸 권장한다. SQL Editor에서:

```sql
-- pg_cron 확장 활성화 후 (Database → Extensions에서 pg_cron 켜기)
select cron.schedule(
  'prune-scenario-views',
  '0 4 * * *',                       -- 매일 04:00 UTC
  $$select public.prune_scenario_views()$$
);
```

안 해도 동작에는 문제없다 (테이블이 서서히 커질 뿐이고, 24시간 지난 행은 언제 지워도 안전하다).

---

## 7. 네이버 로그인 설정

**Supabase Auth의 기본 소셜 프로바이더 목록에는 네이버가 없다.** 구글·카카오는 대시보드에서
스위치만 켜면 되지만, 네이버는 이 앱이 자체 서버 브릿지(Vercel 함수)로 직접 구현했다 — 그래서
설정 위치가 다르다: **Supabase 대시보드가 아니라 네이버 개발자센터 + Vercel 환경변수**.

### 동작 방식 (설정 전에 알아두면 실패했을 때 어디를 볼지 알 수 있다)

1. 브라우저 → 네이버 authorize 페이지로 풀 리다이렉트 (`client_id`, `redirect_uri`, `state`)
2. 네이버 → `<origin>/community/auth/naver/callback?code=&state=` 로 되돌아옴
3. 클라이언트가 `code`를 `POST /api/naver-auth`(Vercel 서버 함수)로 전달
4. 서버가 `client_secret`으로 네이버 토큰 교환 → 프로필 조회 → Supabase Admin API로
   사용자 find-or-create → magiclink `token_hash` 발급
5. 클라이언트가 그 `token_hash`로 `verifyOtp` 호출 → Supabase 세션 확립
   (이후는 구글·카카오와 완전히 같은 흐름에 합류한다)

이 흐름은 Supabase의 OAuth 리다이렉트(위 §3-3 Redirect URLs 허용목록)를 타지 않는다 — 그래서
**Supabase 대시보드에는 네이버 관련 설정이 전혀 없다.**
코드: [`shared/lib/supabase/naver.ts`](../../shared/lib/supabase/naver.ts)(클라이언트) ·
[`api/naver-auth.ts`](../../api/naver-auth.ts)(서버).

### 7-1. 네이버 개발자센터 앱 등록

1. [Naver Developers](https://developers.naver.com/apps/#/register) → **애플리케이션 등록**
2. 사용 API에 **네이버 로그인** 추가
3. 로그인 오픈 API 서비스 환경: **PC웹**(필요하면 모바일웹도) 체크 → 서비스 URL에 배포 도메인 입력
4. **Callback URL**을 아래 표대로 정확히 등록 (경로가 틀리면 콜백이 조용히 실패한다)
5. 등록 완료 후 **Client ID / Client Secret** 발급

| 환경 | Callback URL |
|------|--------------|
| 로컬 | `http://localhost:5173/community/auth/naver/callback` |
| 배포 | `<VITE_SITE_URL>/community/auth/naver/callback` |

경로 `/community/auth/naver/callback`은 코드에 상수(`NAVER_CALLBACK_PATH`)로 고정돼 있다 —
다른 경로를 등록하면 안 된다.

### 7-2. 환경변수

| 이름 | 값 | 어디에 | 비고 |
|------|-----|--------|------|
| `VITE_NAVER_CLIENT_ID` | 7-1에서 발급받은 Client ID | Vercel + 로컬 `.env`(`.env.local`) | 공개값 — 없으면 버튼이 "준비 중"으로 표시(사라지지 않는다) |
| `NAVER_CLIENT_SECRET` | 7-1에서 발급받은 Client Secret | Vercel만(Production/Preview/Development) | 🚫 절대 `VITE_` 접두사 금지 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API의 service_role 키 | Vercel만 | 네이버 로그인·회원 탈퇴(`api/account-delete.ts`)가 공용으로 쓴다. 🚫 `VITE_` 접두사 금지 |
| `NAVER_SYNTHETIC_EMAIL_DOMAIN` | (선택) 합성 이메일 도메인 | Vercel만 | 안 넣으면 기본값 사용 |

각 변수의 자세한 설명·주의문은 [`.env.example`](../../.env.example)에도 있다.

- 커뮤니티 자체가 꺼져 있으면(위 §4의 `VITE_SUPABASE_URL`/키 미설정) 네이버도 함께 꺼진다 —
  네이버는 독립 기능이 아니라 커뮤니티 로그인의 한 방법이다
  (`isNaverEnabled = isCommunityEnabled && VITE_NAVER_CLIENT_ID`).
- `.env` 값을 바꾼 뒤에는 `npm run dev`(또는 `vercel dev`)를 **재시작**해야 반영된다.

### 7-3. 로컬에서 실제로 로그인 테스트하기

`npm run dev`(순수 Vite)에는 `/api` 라우트가 없다 — `api/naver-auth.ts`가 뜨지 않아 콜백이
항상 실패한다. 로컬에서 실제 로그인을 확인하려면:

```sh
npx vercel dev
```

Vercel CLI가 `/api` 함수까지 함께 띄운다(최초 실행 시 프로젝트 연결을 묻는다). 또는 Vercel Preview
배포에서 확인해도 된다.

---

## 8. 클라이언트에서 쓰는 법

```ts
import { isCommunityEnabled, getSupabaseClient, fetchGalleryPage } from '@/shared/lib/supabase';

// 1) 커뮤니티가 꺼져 있으면 진입점 자체를 렌더하지 않는다
if (!isCommunityEnabled) return null;

// 2) SDK는 이 시점에 처음 내려받는다 (별도 청크 — 초기 번들에 없다)
const client = await getSupabaseClient();
if (!client) return null;

const page = await fetchGalleryPage(client, { sort: 'popular' });
```

- `isCommunityEnabled`는 **환경변수만 보는 동기 플래그**라 렌더 분기에 바로 쓸 수 있다.
- `@supabase/supabase-js`(gzip 약 56KB)는 **동적 import**로만 로드된다.
  갤러리를 열지 않는 사용자는 SDK를 내려받지 않는다 — 초기 번들 크기가 그대로 유지된다.
- 이 폴더는 `shared/lib/index.ts`에서 재export하지 **않는다**. `@/shared/lib/supabase`로 직접 import할 것
  (`@/shared/lib`는 앱 전역에서 쓰여서, 거기 물리면 커뮤니티 코드가 초기 번들로 딸려 들어간다).

---

## 9. DB 공유 링크(`?s=`) — `shared_snapshots`

시뮬레이터 툴바의 **Share 버튼**이 만드는 공유 링크 중 하나다. 커뮤니티(갤러리·좋아요·댓글)와는 별개
기능이지만, **같은 Supabase 프로젝트·같은 환경변수**(`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`/
`VITE_SUPABASE_ANON_KEY`)를 쓴다 — 위 §4를 채우지 않으면(커뮤니티가 꺼져 있으면) 이 기능도 함께 꺼지고,
Share 버튼은 기존 lz-string `?share=` 링크(서버 저장 없이 URL에 데이터를 압축해 싣는 방식)로 폴백한다.

### 왜 이 테이블이 필요한가

lz-string `?share=` 링크는 payload 전체를 URL 쿼리로 실어 보내기 때문에 시나리오가 크면 URL이 길어져
브라우저·카카오톡 등의 링크 길이 한계에 부딪힐 수 있다. `shared_snapshots`는 payload를 서버에 저장하고
짧은 랜덤 key(`?s=<key>`)만 URL에 남기는 대안이다. **구 `?share=` 링크는 그대로 계속 동작한다** — 완전
병존이며, 어느 쪽도 폐기되지 않았다.

### 스키마 요약 (`supabase/migrations/20260720000000_shared_snapshots.sql`)

- `public.shared_snapshots(key text primary key, payload jsonb not null, created_at timestamptz, expires_at timestamptz null)`
  - `payload`는 `{ v: 1, scenario: PersistedScenarioState }` 형태이고 **64KB 상한**(CHECK 제약).
  - `key`는 서버가 `gen_random_uuid()`로 생성하는 ~22자 base64url 문자열(122bit 엔트로피) — 클라이언트가
    직접 정하거나 열거할 수 없다.
  - `expires_at`은 기본 `null`(무만료). 지금은 만료 정책을 쓰지 않지만, 조회 RPC가 이미 만료분을 걸러내도록
    설계돼 있어 나중에 만료를 켜도 하위 호환이 깨지지 않는다.
- 테이블 **직접 접근은 전부 차단**(RLS 활성 + 정책 0개). 오직 두 `SECURITY DEFINER` RPC로만 노출:
  - `create_shared_snapshot(p_payload jsonb) → text` — payload를 저장하고 새 key를 반환.
  - `get_shared_snapshot(p_key text) → jsonb` — key로 payload를 조회(부재·만료면 `null`, 예외 아님).
- 두 RPC 모두 **`anon`(비로그인)에게 실행 권한이 있다** — 구 `?share=` 링크가 로그인 없이 익명 공유를
  지원했으므로 동등한 UX를 유지하기 위해서다. `service_role`은 필요 없다.

### 마이그레이션 적용

§2와 같은 방법(SQL Editor에 전체 붙여넣고 Run, 또는 `npx supabase db push`)으로
`supabase/migrations/20260720000000_shared_snapshots.sql`을 실행한다. **스키마만 생성한다 — 백필
데이터는 없다.** 실행 전에는 Share 버튼이 DB key 생성에 실패해 조용히 lz-string 링크로 폴백한다(앱이
죽지는 않지만, 실행 전까지는 짧은 링크 기능을 못 쓴다).

### 서버 측 OG 미리보기와의 관계

`api/og.tsx`와 `api/share-html.ts`(Vercel 서버 함수, 카카오톡/페이스북/X/네이버 크롤러가 `?s=<key>` 링크를
펼칠 때 실제 시뮬레이션 요약을 채운 카드/HTML을 만든다)도 이 테이블을 `get_shared_snapshot` RPC로 조회한다.
**anon/publishable 키만 쓰고 새 서버 전용 환경변수는 없다** — 자세한 흐름은
[`docs/vercel/README.md` §3](../vercel/README.md#3-동적-og-미리보기가-동작하는-방식) 참고.
