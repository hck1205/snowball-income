# Vercel 배포 가이드

이 앱은 Vercel **Hobby** 플랜에 배포한다. 구성은 네 조각이다.

| 조각 | 파일 | 런타임 | 언제 도는가 |
| --- | --- | --- | --- |
| 정적 SPA | `dist/` (Vite 빌드) | — (CDN) | 항상 |
| 동적 OG 이미지 | `api/og.tsx` | **Node.js** | 크롤러/스크래퍼가 미리보기를 만들 때 (`?share=`/`?s=` 둘 다 지원) |
| DB key 공유 진입 HTML | `api/share-html.ts` | **Node.js** | `/?s=<key>` 요청일 때만 — og:title/description까지 실제 시뮬레이션 값으로 채운 HTML을 반환 |
| 메타태그 주입/라우팅 | `middleware.ts` | Edge | `/?share=…`(구, 문자열 치환) 또는 `/?s=…`(신규, `api/share-html`로 rewrite)일 때만 (그 외에는 즉시 통과) |

---

## 1. 환경변수 — Vercel 대시보드에 넣어야 하는 값

> **Vercel 대시보드 경로**
> `Project → Settings → Environment Variables → Add New`
> 각 변수를 **Production / Preview / Development 3개 환경 모두**에 체크해서 저장한 뒤,
> **`Deployments → 최신 배포 → ⋯ → Redeploy`** 를 눌러야 값이 반영된다.
> (환경변수는 **빌드 타임**에 번들로 인라인된다. 저장만 하고 재배포하지 않으면 아무것도 바뀌지 않는다.)

### 필수

| 이름 | 값 | 왜 필요한가 |
| --- | --- | --- |
| `VITE_SITE_URL` | 실제 배포 도메인 (예: `https://snowball-income.vercel.app`, 뒤에 `/` 없이) | **지금 반드시 넣어야 한다.** 기본값 `https://snowball-income.example` 은 RFC 2606이 예약한 **절대 해석되지 않는 테스트용 TLD**다. 이 값이 틀리면 canonical·og:url·`sitemap.xml`·`robots.txt`가 전부 존재하지 않는 도메인을 가리켜 **SEO와 SNS 미리보기가 통째로 무효**가 된다. |

`VITE_SITE_URL` 하나가 canonical / og:url / hreflang / JSON-LD / sitemap / robots의 **단일 소스**다
(`vite.config.ts`의 `DEFAULT_SITE_URL` 참고).

### 선택 — 커뮤니티(Supabase)를 켤 때만

| 이름 | 값 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (구형 프로젝트는 `VITE_SUPABASE_ANON_KEY` 에 anon 키) |

- **둘 다** 있어야 커뮤니티가 켜진다. 비워 두면 커뮤니티만 꺼지고 앱은 100% 그대로 동작한다.
- 이 키들은 브라우저 번들에 그대로 실리도록 설계된 **공개값**이다. 권한은 전적으로 RLS가 결정한다.
- 🚫 `service_role` 키는 절대 넣지 마라. `VITE_` 접두사가 붙은 값은 전부 공개된다.
- 자세한 절차: [`docs/supabase/README.md`](../supabase/README.md)
- ⚠ **이 두 값은 커뮤니티 전용이 아니다.** `api/og.tsx`·`api/share-html.ts`(DB key 공유 미리보기, 아래 §3)가
  같은 `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`(또는 `VITE_SUPABASE_ANON_KEY`)를 `process.env`로
  **서버에서도** 읽는다 — Vercel은 `VITE_` 접두 변수도 Node 함수 런타임에 그대로 노출하기 때문이다.
  **이 조회 전용으로 추가해야 하는 서버 변수는 없다.** anon/publishable 키만 쓰고, `SUPABASE_SERVICE_ROLE_KEY`는
  필요 없다(`get_shared_snapshot` RPC가 anon 실행 권한을 가진 `SECURITY DEFINER`로 설계돼 있어서다).

### 선택 — 네이버 로그인을 켤 때만

| 이름 | 값 |
| --- | --- |
| `VITE_NAVER_CLIENT_ID` | 네이버 개발자센터에서 발급받은 Client ID |

- 위 커뮤니티(Supabase) 변수가 없으면 네이버 로그인도 함께 꺼진다
  (`isNaverEnabled = isCommunityEnabled && VITE_NAVER_CLIENT_ID`).
- 없다고 버튼이 사라지지는 않는다 — "준비 중"으로 표시되고 클릭이 무시된다.
- 자세한 절차(네이버 개발자센터 앱 등록 · Callback URL): [`docs/supabase/README.md`](../supabase/README.md) §7

### 서버 전용 — 회원 탈퇴 · 네이버 로그인 함수가 쓰는 값

`api/account-delete.ts`, `api/naver-auth.ts`가 Node 런타임에서 `process.env`로 직접 읽는다.
**아래 값에는 `VITE_` 접두사를 붙이면 안 된다** — 붙는 순간 클라이언트 번들에 노출된다.

| 이름 | 값 | 비고 |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API의 service_role 키 | RLS를 통째로 우회하는 키 — 절대 커밋 금지, Vercel 대시보드에만 |
| `NAVER_CLIENT_SECRET` | 네이버 개발자센터에서 발급받은 Client Secret | 네이버 로그인 전용 |
| `NAVER_SYNTHETIC_EMAIL_DOMAIN` | (선택) 합성 이메일 도메인 | 안 넣으면 기본값 사용 |

이 값들은 브라우저로 내려가지 않지만, **로컬 `npm run dev`로도 동작을 확인할 수 있다** — `vite.config.ts`의
`apiDevPlugin`이 `/api/*`를 dev 서버에서 서빙하며 `.env`의 이 값들을 `process.env`로 주입한다.
`.env`에 위 값을 채우고 `npm run dev`를 쓰면 된다(`vercel dev`는 SPA rewrite 충돌로 실패하니 쓰지 말 것 —
자세한 건 [docs/supabase/README.md §7-3](../supabase/README.md)).

### 선택

| 이름 | 값 |
| --- | --- |
| `VITE_GA_MEASUREMENT_ID` | GA4 측정 ID (없으면 GA를 아예 로드하지 않는다) |

---

## 2. 빌드 설정

Vercel의 **Vite 프리셋이 자동 감지**한다. 대시보드에서 따로 바꿀 것이 없다.

- Build Command: `npm run build`
- Output Directory: `dist`
- `api/` 디렉터리는 **제로 컨피그**로 함수가 된다 (`vercel.json`에 `functions` 런타임 설정 불필요).

`vercel.json`이 하는 일은 세 가지뿐이다.

```jsonc
{
  // SPA 폴백. rewrites 는 "파일시스템 조회 실패 시"에만 동작하므로
  // /api/og 나 /assets/*.js 를 잡아먹지 않는다. (legacy `routes` 를 쓰면 잡아먹는다 — 쓰지 마라.)
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],

  // OG 함수가 런타임에 가져가는 폰트. 내용이 바뀌지 않으므로 1년 immutable.
  "headers": [{ "source": "/fonts/(.*)", "headers": [...] }],

  // 콜드 스타트에 Pretendard(1.5MB×2) 파싱이 들어가므로 기본 10초보다 여유를 준다.
  "functions": { "api/og.tsx": { "maxDuration": 30 } }
}
```

`api/share-html.ts`도 같은 제로 컨피그로 함수가 되지만, 별도 `maxDuration` 설정은 없다 — Supabase REST 조회
1회뿐이라 Pretendard 폰트 로딩이 있는 `api/og.tsx`만큼 여유가 필요하지 않았다(Vercel 기본값을 그대로 쓴다).

### ⚠️ 하면 안 되는 것

- **`"cleanUrls": true` 를 켜지 마라.** `middleware.ts` 는 `/index.html` 을 fetch 해서 메타태그를 갈아끼우는데,
  `cleanUrls` 는 `/index.html` → `/` 로 308 리다이렉트한다. 그 요청이 미들웨어로 되돌아와 **무한 루프**
  (Vercel `INFINITE_LOOP_DETECTED`, HTTP 508)가 된다.
- **legacy `routes` 를 쓰지 마라.** `rewrites` 와 달리 파일시스템을 먼저 확인하지 않아서 `/api/*` 를 삼킨다.

---

## 3. 동적 OG 미리보기가 동작하는 방식

공유 링크는 **두 포맷이 병존**한다 — 파라미터 이름으로 구분한다.

- **`?share=<lz-string 코드>`(구, 클라이언트 인코딩)** — payload가 URL에 통째로 실려 있어 서버 조회가
  필요 없다. `middleware.ts`가 og:image/twitter:image/og:url **만** 문자열 치환한다. og:title/description은
  정적 기본값으로 남는다(미들웨어가 시뮬레이션 엔진을 끌고 오지 않으려는 의도적 설계 — 아래 참고).
- **`?s=<key>`(신규, DB key)** — 툴바의 "Share" 버튼이 활성 시나리오 payload를 Supabase
  `shared_snapshots`에 저장하고 받은 key를 URL에 싣는다. `middleware.ts`는 key 형식만 확인해
  **`api/share-html`로 rewrite**하고, 그 Node 함수가 payload를 조회해 **og:title/description까지 실제
  숫자로 채운** HTML을 반환한다.

```
카카오톡/페북/트위터/네이버 크롤러
      │  GET /?share=N4IgbiBcDMA0…
      ▼
middleware.ts (Edge)  ── share 코드 있음 → dist/index.html 을 가져와
      │                   og:image/twitter:image/og:url 만 /api/og?share=… 로 갈아끼운 HTML 반환
      ▼
크롤러가 og:image 를 다시 요청
      │  GET /api/og?share=N4IgbiBcDMA0…
      ▼
api/og.tsx (Node)  ── 공유 코드 디코드 → 앱과 같은 엔진으로 시뮬레이션
                       → Pretendard 로 1200×630 PNG 렌더 (1년 immutable 캐시)
```

```
카카오톡/페북/트위터/네이버 크롤러
      │  GET /?s=<key>
      ▼
middleware.ts (Edge)  ── key 형식(16~64자 [A-Za-z0-9_-])만 확인 →
      │                   api/share-html 로 rewrite (브라우저 URL은 /?s=<key> 그대로, 실사용자도 이 경로를 탄다)
      ▼
api/share-html.ts (Node)  ── get_shared_snapshot RPC(anon 키, plain REST) 로 payload 조회
      │                       → 시뮬레이션 요약 → og:title/description/url/image + twitter:* 를
      │                       실제 숫자로 채운 dist/index.html 을 200 으로 반환
      │                       (canonical·og:type 등 나머지 메타는 불변, 조회 실패는 메타 무치환 셸을 그대로 200)
      ▼
크롤러가 og:image 를 다시 요청
      │  GET /api/og?s=<key>
      ▼
api/og.tsx (Node)  ── 같은 payload 조회를 재사용해 1200×630 PNG 렌더
                       (조회 성공 시 1년 immutable, 실패 시 기본 카드로 하루 캐시)
```

**왜 미들웨어인가?** 크롤러는 JS를 실행하지 않으므로 React가 런타임에 메타태그를 바꿔도 소용없다.
그리고 `vercel.json` 의 `rewrites` 는 **파일시스템 조회 다음**에 평가되는데, `/?share=…`·`/?s=…` 는 경로가
`/` 라서 `dist/index.html` 에서 즉시 히트해 **rewrite 단계에 도달하지 못한다**. 캐시·파일시스템보다 앞에서
돌면서 커스텀 `Response`(문자열 치환 또는 내부 rewrite)를 반환할 수 있는 건 미들웨어뿐이다.

**`?s=`는 왜 미들웨어에서 직접 조회하지 않는가?** 미들웨어(Edge)는 **모든 `/` 요청**에 대해 실행되므로,
Supabase 조회·시뮬레이션 요약 코드를 미들웨어 번들에 넣으면 그 무게(모듈 파싱·평가 비용)를 일반 방문자에게도
지우게 된다. 그래서 미들웨어는 key 형식 검증(정규식 1개)만 하고, 무거운 조회·계산은 별도 Node 함수
(`api/share-html.ts`)로 격리해 `rewrite()` 한다 — "일반 방문자 비용 0" 원칙은 그대로 유지된다.

**폰트**: Satori(=`@vercel/og`)는 시스템 폰트를 못 쓰고 **ttf/otf/woff만** 읽는다(**woff2 불가**).
npm `pretendard` 의 `dist/public/static/*.otf` 를 빌드 때 `dist/fonts/` 로 복사하고(`vite.config.ts` 의
`ogFontsPlugin`), 함수가 **런타임에 같은 도메인에서 fetch** 해 모듈 스코프에 캐시한다.
레포에 폰트 바이너리를 커밋하지 않고, 외부 CDN에도 의존하지 않는다.

**실패해도 5xx를 내지 않는다.** 크롤러는 미리보기 요청이 실패하면 카드를 아예 포기하기 때문이다.
공유 코드/key가 깨졌거나 조회에 실패하면 `api/og.tsx`는 브랜드 기본 카드(또는 폰트를 못 받으면 정적
`/og-image.png` 로 302)를, `api/share-html.ts`는 메타 치환 없는 셸(=정적 기본 메타)을 그대로 200으로 낸다.

---

## 4. 배포 후 확인

```bash
# 1) 정적 셸에 실제 콘텐츠가 있는가 (네이버 Yeti·다음은 JS를 실행하지 않는다)
curl -s https://<도메인>/ | grep -o '<h1>.*</h1>'

# 2) 공유 링크의 og:image 가 그 share 코드를 가리키는가 (구 ?share=, 문자열 치환만)
curl -s 'https://<도메인>/?share=<코드>' | grep 'og:image'

# 2-1) DB key 공유 링크는 og:title/description 까지 실제 값으로 채워지는가 (신규 ?s=)
curl -s 'https://<도메인>/?s=<key>' | grep -E 'og:title|og:description|og:image'

# 3) OG 이미지가 실제로 PNG로 나오는가 (두 포맷 모두)
curl -sI 'https://<도메인>/api/og?share=<코드>'   # → 200, content-type: image/png
curl -sI 'https://<도메인>/api/og?s=<key>'         # → 200, content-type: image/png

# 4) 도메인이 제대로 주입됐는가 (.example 이 남아 있으면 VITE_SITE_URL 미설정)
curl -s https://<도메인>/robots.txt
```

미리보기 캐시는 각 플랫폼에서 강제로 갱신할 수 있다.

- 카카오톡: 채팅방에 링크를 다시 붙여넣기 전 [카카오 디벨로퍼스 캐시 초기화](https://developers.kakao.com/tool/clear/og)
- 페이스북: [Sharing Debugger](https://developers.facebook.com/tools/debug/) → *Scrape Again*
- 트위터/X: [Card Validator](https://cards-dev.twitter.com/validator)
