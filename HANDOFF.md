# HANDOFF — 2026-07-21 (api 인프라 복구 · SEO ISR 완성 · 싱크/카카오 버그 · 지식그래프 도구)

> 다음 세션은 이 문서부터. 이번 세션 산출물은 **전부 main 머지·배포·검증 완료**(PR #17~#32). 프로덕션 전 경로 200.

## 배포 상태 (먼저 확인)
- **main = 배포 최신.** 오늘 PR #17~#32 전부 머지됨. 로컬 브랜치는 `main`만 남김.
- 프로덕션 헬스: `/` · `/community/board` · `/community/portfolio` · `/community/*/write` · `/api/sitemap` · `/api/og` · `/sitemap-posts.xml` 전부 **200**.
- DB 상태(운영자가 SQL 에디터로 실행 완료): `profiles.is_admin` / `posts.category`(3종→5종). ⚠ **아직 안 한 것**: 운석 계정 관리자 지정(아래 §DB 참고).

## 🔴 이번 세션 최대 사건 — api/* 6개 전멸과 복구
프로덕션에서 `api/*`(sitemap·post-html·share-html·og·naver-auth·account-delete) **전부 500**이었다(공유 OG 미리보기·이미지가 조용히 깨져 있었음). **배포 6번을 태운 뒤** 원인 규명:

```
ERR_UNSUPPORTED_DIR_IMPORT: Directory import '/var/task/shared/lib/og'
ERR_MODULE_NOT_FOUND: '/var/task/pages/Main/hooks/persistence/shareLink'
```
Vercel은 `api/*`를 **번들하지 않고** 네이티브 ESM으로 실행 → `"type":"module"` 때문에 **배럴(디렉터리 import)·확장자 생략이 불법**. 이 레포의 폴더 단위 import 규칙과 정면 충돌.

**해법 (확정·배포됨)**: 소스는 `server/handlers/*/index.ts`, esbuild로 **번들한 `api/*.js`를 커밋**. `npm run build`가 재생성 후 **바이트 대조 → 불일치 시 빌드 실패**(드리프트 방어). `server/handlers/` 수정 시 **반드시 `npm run api:bundle` 후 함께 커밋**. 자세한 전말·배제한 시도는 pitfalls.md.
- ⚠ 재시도 금지: **전면 Edge 전환**(번들러가 `@/` alias 미해석), **`"type":"module"` 제거**(import0 함수까지 죽음).
- `.gitattributes`에 `api/*.js -text` 필수(CRLF 변환되면 바이트 대조가 Windows에서 영구 실패).

## SEO ISR — 4단계 전부 완성 (프로덕션 검증됨)
| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | `/api/sitemap` 공개 글 동적 사이트맵 | ✅ HIT |
| 2 | `/api/post-html` 상세 메타 치환 | ✅ HIT |
| 3 | 상세 **본문 주입** + 서버 sanitize | ✅ 배포·검증 |
| 4 | 목록 페이지 ISR(제목·링크) | ✅ 배포·검증 |

- **서버 sanitize**: dompurify가 Node에서 안 돌아 **jsdom window 주입**. 서버·클라이언트가 **같은 허용목록+훅 공유**(`shared/lib/richtext`) → 파리티 코드 레벨 보장. jsdom은 external이라 `api/post-html.js`에만 실림.
- **XSS 3중 검증**: reviewer+qa+메인 세션. mXSS·DOM clobbering·인코딩 우회 등 **56개+ 페이로드 무력화, 우회 0**. 프로덕션 위험 유출 0, 클로킹 아님.
- **⚠ 표 태그 파리티**: `table/tbody/tr/th/td`+`colspan/rowspan`이 허용목록에 있음. 여기 손대면 서버 sanitize도 자동 반영(단일 출처).

## 버그 수정 (배포됨)
- **탭 삭제→새로고침 거짓 충돌 루프** (PR #31, **실환경 확인됨**): 로컬 autosave(120ms) vs 클라우드 push(4초 디바운스) 레이스. ① 이탈 flush ② 로컬⊂클라우드일 때 타임스탬프로 "이 기기 삭제 vs 다른 기기 추가" 구분. 유실 방지 유지.
- **iOS 카카오 로그인 루프** (PR #28): 원인=카카오톡 인앱 브라우저 세션 격리. 루프 차단 + GA4 `login_failed` 계측 + 안내. ⚠ 근본 한계: implicit도 인앱 세션 격리는 못 고침 → GA4로 빈도 보고 판단.
- **게시판 첨부 제거·관리자 전용 비공개·글 종류 5종** / **`<select>` DS 통합**(6곳→`components/common/Select`) / **조건부 훅 크래시**(React #311).

## 🧭 지식 그래프 도구 (신규 — 3층 탐색)
`CLAUDE.md`에 문서화:
1. **`npm run search`** (`.index/`) — 심볼·위치, 가장 가벼움
2. **codegraph** (`.codegraph/`, MCP) — 호출 관계·변경 영향
3. **graphify** (`graphify-out/`, MCP, `/graphify` 스킬) — 코드+문서 전체 지식 지도·`GRAPH_REPORT.md`
- pre-commit 훅이 `codegraph sync`+`graphify update` 자동(선택 도구). 셋 다 gitignore. ⚠ MCP는 **세션 재시작 후** 연결.

## 📦 DB 접근 (이번에 확인)
- `.env`에 anon 키·service_role 키. **anon으로 공개 데이터 읽기 가능**. 현재 공개 글 3건(전부 운석), 프로필 3건(운석=사용자, 스노우볼러415bf2, 정현우 — 셋 다 is_admin=false).
- ⚠ **service_role REST 쓰기는 막힘**: `42501 permission denied`(마이그레이션이 anon/authenticated에만 GRANT). **서버 특권 쓰기 경로 없음** → CLI 시딩 불가, SQL 에디터/앱 UI로만.

## 남은 것 / 사용자 액션
1. **운석 관리자 지정** (SQL): `update public.profiles set is_admin=true where display_name='운석';` (id `a83d3328-9537-4de9-88db-d213594b35f4`)
2. **비공개 글 시딩**: 관리자 된 뒤 앱에서 갤러리·게시판 각 1건 비공개 작성.
3. **네이버 검수 재제출**: 소명 자료 완료(`docs/naver-login-review.md`). 로그인 화면 캡처는 사용자 몫.
4. **유입 전략**: 별도 문서 `docs/GROWTH.md` 참고(이번 세션 작성).
5. **iOS 카카오** — GA4 `login_failed` 분석.
6. **파비콘** — 배포됨, 구글 반영은 크롤 주기.

## 배포 규칙 (기억)
- **main push = 프로덕션 배포.** 배포는 사용자 승인 후.
- **머지 전 `gh pr checks`로 빌드 pass 확인 → 머지 후 실 URL curl 검증.** api/*는 유닛 통과가 실행을 증명 못 함.
- 서브에이전트 전언은 승인이 아니다.
