# Vercel 배포 가이드

이 앱은 Vercel **Hobby** 플랜에 배포한다. 구성은 세 조각이다.

| 조각 | 파일 | 런타임 | 언제 도는가 |
| --- | --- | --- | --- |
| 정적 SPA | `dist/` (Vite 빌드) | — (CDN) | 항상 |
| 동적 OG 이미지 | `api/og.tsx` | **Node.js** | 크롤러/스크래퍼가 미리보기를 만들 때 |
| 메타태그 주입 | `middleware.ts` | Edge | `/?share=…` 요청일 때만 (그 외에는 즉시 통과) |

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

### ⚠️ 하면 안 되는 것

- **`"cleanUrls": true` 를 켜지 마라.** `middleware.ts` 는 `/index.html` 을 fetch 해서 메타태그를 갈아끼우는데,
  `cleanUrls` 는 `/index.html` → `/` 로 308 리다이렉트한다. 그 요청이 미들웨어로 되돌아와 **무한 루프**
  (Vercel `INFINITE_LOOP_DETECTED`, HTTP 508)가 된다.
- **legacy `routes` 를 쓰지 마라.** `rewrites` 와 달리 파일시스템을 먼저 확인하지 않아서 `/api/*` 를 삼킨다.

---

## 3. 동적 OG 이미지가 동작하는 방식

```
카카오톡/페북/트위터 크롤러
      │  GET /?share=N4IgbiBcDMA0…
      ▼
middleware.ts (Edge)  ── share 코드 있음 → dist/index.html 을 가져와
      │                   og:image 를 /api/og?share=… 로 갈아끼운 HTML 반환
      ▼
크롤러가 og:image 를 다시 요청
      │  GET /api/og?share=N4IgbiBcDMA0…
      ▼
api/og.tsx (Node)  ── 공유 코드 디코드 → 앱과 같은 엔진으로 시뮬레이션
                       → Pretendard 로 1200×630 PNG 렌더 (1년 immutable 캐시)
```

**왜 미들웨어인가?** 크롤러는 JS를 실행하지 않으므로 React가 런타임에 메타태그를 바꿔도 소용없다.
그리고 `vercel.json` 의 `rewrites` 는 **파일시스템 조회 다음**에 평가되는데, `/?share=…` 는 경로가 `/` 라서
`dist/index.html` 에서 즉시 히트해 **rewrite 단계에 도달하지 못한다**. 캐시·파일시스템보다 앞에서 돌면서
커스텀 HTML을 반환할 수 있는 건 미들웨어뿐이다.

**폰트**: Satori(=`@vercel/og`)는 시스템 폰트를 못 쓰고 **ttf/otf/woff만** 읽는다(**woff2 불가**).
npm `pretendard` 의 `dist/public/static/*.otf` 를 빌드 때 `dist/fonts/` 로 복사하고(`vite.config.ts` 의
`ogFontsPlugin`), 함수가 **런타임에 같은 도메인에서 fetch** 해 모듈 스코프에 캐시한다.
레포에 폰트 바이너리를 커밋하지 않고, 외부 CDN에도 의존하지 않는다.

**실패해도 5xx를 내지 않는다.** 크롤러는 미리보기 요청이 실패하면 카드를 아예 포기하기 때문이다.
공유 코드가 깨졌으면 브랜드 기본 카드를, 폰트를 못 받으면 정적 `/og-image.png` 로 302 한다.

---

## 4. 배포 후 확인

```bash
# 1) 정적 셸에 실제 콘텐츠가 있는가 (네이버 Yeti·다음은 JS를 실행하지 않는다)
curl -s https://<도메인>/ | grep -o '<h1>.*</h1>'

# 2) 공유 링크의 og:image 가 그 share 코드를 가리키는가
curl -s 'https://<도메인>/?share=<코드>' | grep 'og:image'

# 3) OG 이미지가 실제로 PNG로 나오는가
curl -sI 'https://<도메인>/api/og?share=<코드>'   # → 200, content-type: image/png

# 4) 도메인이 제대로 주입됐는가 (.example 이 남아 있으면 VITE_SITE_URL 미설정)
curl -s https://<도메인>/robots.txt
```

미리보기 캐시는 각 플랫폼에서 강제로 갱신할 수 있다.

- 카카오톡: 채팅방에 링크를 다시 붙여넣기 전 [카카오 디벨로퍼스 캐시 초기화](https://developers.kakao.com/tool/clear/og)
- 페이스북: [Sharing Debugger](https://developers.facebook.com/tools/debug/) → *Scrape Again*
- 트위터/X: [Card Validator](https://cards-dev.twitter.com/validator)
