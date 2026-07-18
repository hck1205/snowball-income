# 구조 지도 — CLAUDE.md 이후 추가분 (2026-07-17 기준)

> CLAUDE.md의 코드 지도가 기본. 여기는 그 이후 생긴 시스템만.

## 테마 프리셋 시스템 (2026-07-17)
- `shared/styles/presets.ts` — THEME_PRESETS 레지스트리 8종(각 light/dark 69키), 라벨·스와치 포함. **모든 색 값의 단일 원천.**
- `shared/constants/palette/` — PALETTE_PRESET_IDS(노출 순서), PalettePresetId, DEFAULT='velog', normalize.
- `jotai/snowball/atoms/ui/` — palettePresetAtom(파생 write: localStorage `snowball:palette` + dataset.palette 동기 반영), useApplyPalettePreset(초기/탭 간 동기화).
- `shared/styles/globalStyles.ts` — `:root[data-palette=…]` 스코프 CSS 변수 블록 생성(레지스트리 순회 — 프리셋 추가 시 자동).
- `shared/styles/chartTheme.ts` — getChartTheme().series (canvas는 var() 불가 → computed style 읽기). 차트 소비처는 palettePresetAtom 구독으로 리빌드.
- `shared/styles/contrast.test.ts` — 레지스트리 자동 순회 WCAG 검증(953+건). 프리셋 추가 시 무수정 확장.
- `components/ThemePresetSwitcher/` — 헤더 팝오버 + 드로어 인라인(2열), radiogroup 접근성 계약.
- index.html — 프리페인트 스크립트(224~) + `html[data-palette]` 스코프 배경(FOUC 방지). **인라인 스크립트 유효값 목록은 수동 동기.**

## 커뮤니티 (Stage 2, 2026-07-16~)
- `pages/Community/` — CommunityLayout / GalleryPage(카드=velog 포맷 ScenarioCard, 리스트=ScenarioRow) / DetailPage(CommentSection 포함) / WritePage(라우트 `/community/write`, 첨부 3상태 UX).
- `components/community/` — ScenarioCard·Row, SimBadge, CommunityHeader(sticky 글래스), LoginModal, AuthControl, Avatar, LikeButton, RichText 에디터/컨텐츠 등.
- `shared/lib/supabase/` — queries(시나리오·댓글·좋아요·조회수 RPC), comments(buildCommentTree 순수), pagination(keyset), auth, payload 검증. 게시/수정 뮤테이션이 sim_summary를 payload 변경 시에만 (재)계산해 저장, 목록·상세 쿼리가 싣는다(payload는 목록 계속 제외).
- `shared/lib/snowball/SnowballScenarioSummary.ts` — buildScenarioSimSummary/parseScenarioSimSummary (sim_summary jsonb 계약 v1, 게시 시점 고정). 갤러리 뷰가 파서 경유로 카드/행에 주입.
- DB: `supabase/migrations/` 2개 실행 완료(실 Supabase). ⚠ **미실행** 마이그레이션 4개 — 20260717000000_scenario_sim_summary.sql(sim_summary 컬럼+GRANT), **20260717000001_scenario_search_facets.sql**(정밀 검색 G1: sim_summary 파생 generated STORED 컬럼 final_monthly_dividend/target_monthly_dividend/duration_years + 부분 B-tree 인덱스, GRANT 불필요), 20260718000000_user_app_states.sql(클라우드 저장 테이블), 20260719000000_profile.sql(avatars 버킷+storage 정책, insufficient_privilege 가드=실패 시 대시보드 수동). 실행 전 배포 시 해당 컬럼/테이블 select·insert가 즉사한다(실행 후 이 경고 삭제). 댓글 레이트리밋(1분 10개)·대댓글 1단계·소프트 삭제는 DB 트리거가 강제.
- 갤러리 정밀 검색 G1 데이터 레이어(2026-07-17): 갤러리 조회는 **PostgREST 쿼리빌더**(RPC 아님)라 필터는 클라이언트 `.gte/.lte`로 얹는다. 순수 `buildGalleryFacetFilters`(pagination.ts)가 `GalleryFacetFilters`(원/년 단위, monthlyMin/Max·targetMin(≥ 단일)·durationMin/Max — types.ts) → 범위 경계 목록을 만들고 `fetchGalleryPage({facets})`가 적용(검색·키셋·정렬과 AND 공존). 티커 필터는 G2(후속). generated facet 3컬럼은 `ScenarioDbRow`(=ScenarioRow+ScenarioSearchFacets)에만 얹어 `.gte` 타입만 통과시키고 앱 프로젝션(ScenarioListItem/WithAuthor)은 무변경.
- 갤러리 정밀 검색 **UI 랜딩**(2026-07-18): `components/community/PrecisionSearch`(폴더경로 import, 자기완결형 팝오버/인라인) + 순수 URL↔필터 계약 `shared/constants/community/galleryFilters.ts`(`GalleryFilters` 원·년 + parse/serialize/countActiveFilters/hasAnyFilter/`toFacetFilters`). URL 파라미터 mdmin/mdmax/tgtmin/durmin/durmax + `TICKER_FILTER_ENABLED=false`(config.ts). `CommunitySearchBar`에 `variant='desktop'|'mobile'` 추가(SearchCluster로 감싸 폼+트리거, PrecisionSearch layout=popover/inline 분기), CommunityHeader의 MobileSearchBar 인스턴스가 `variant="mobile"`. `useGallery`: URL→facets 조회 배선(loadFirst/loadMore, 의존성=필터 원시값) + `filteredEmpty` status + `clearFilters`(sort/q 보존, filteredEmpty CTA용). copy.ts gallery에 `filter*` 키. `CommunityIcons`에 `FilterIcon`(SlidersHorizontal)·`AlertIcon`. 헤더 로고는 BrandMark→`/app_icon.png` `<img>`(BrandMark 파일은 api/og.tsx 소비로 존치).
- `shared/constants/community/copy.ts` — 커뮤니티 전 카피의 단일 원천.
- 소셜 로그인 버튼: `components/community/SocialLoginButton`(provider prop=google/kakao/naver, 규정색·인라인 SVG 마크·정본 카피 조립, **폴더 경로 import**·배럴 미등록, 포커스 링은 전역 :focus-visible 상속=버튼별 재정의 없음). 네이버는 **2026-07-17 실연동 랜딩** — **config-gated 실동작**: `isNaverEnabled`(=isCommunityEnabled && VITE_NAVER_CLIENT_ID 존재)이면 구글·카카오와 **같은 경로**(onSelectProvider/onLogin→login→signInWithOAuth→auth.ts가 'naver'를 startNaverLogin으로 가로챔)로 보낸다. ⚠ **미설정이어도 버튼을 숨기지 않는다**(사용자 리포트 "네이버 버튼이 사라졌어" 반영, 2026-07-17 정정): env 없으면 **`pending={!isNaverEnabled}`로 "준비 중"(aria-disabled + 배지) 노출 + 클릭 무동작 가드**. 구글/카카오는 늘 보이는데 네이버만 사라지면 회귀로 인지하기 때문. 즉 `pending` prop 은 이제 **네이버 미설정 상태 표시**로 게이트에서 쓰인다(계약 불변). **`copy.login.{google,kakao,naver}`는 로그인 게이트가 공유**(2026-07-18 MySavePanel 제거로 **3곳**): LoginModal·CommunityWritePage·CommunityProfilePage 딥링크 전부 **구글 → 네이버 → 카카오** 순(네이버 항상 렌더). 구 중립톤 `ProviderButton` styled는 레포에서 전부 제거. login.google 한 글자 바꾸면 3곳 다 바뀐다. 라벨 assert는 리터럴 말고 `COMMUNITY_COPY.login.*` 참조(writeAttach·CommunityProfileView·LoginModal 테스트 모두 참조 방식).

## 클라우드 저장 (Stage 1, 2026-07-17~ / cloud-save-proposal.md)
- 개인 워크스페이스 동기화. 커뮤니티 scenarios와 **분리 테이블**(user_app_states) — 게시는 스냅샷 복사라 자동저장이 게시물을 건드리지 않는다.
- `supabase/migrations/20260718000000_user_app_states.sql` — owner-only RLS, autosave 1인1개(partial unique, name is null), 이름 체크포인트 20개 쿼터, payload≤128KB. **미실행**(위 경고).
- `shared/lib/supabase/userAppStates.ts` — IO(client 주입): fetchCloudAutosave/pushCloudAutosave(자동 슬롯 select→update/insert upsert)만. **구 이름슬롯 IO(list/fetch/delete)는 2026-07-18 제거**(MySavePanel 삭제, 사용자 승인). payload는 로컬과 **같은 스키마**(PersistedAppStatePayload) — 읽기는 반드시 normalizePersistedAppState 통과.
- `jotai/snowball/cloud/` — 순수 엔진(createCloudSyncScheduler 디바운스 4s + createAutosavePush 게이팅 / **syncCloudWorkspaceAtSessionStart** 조용한로드+안전마이그레이션 IO주입) / 마이그레이션 플래그(cloudMigrationFlag: user id별 localStorage) / 상태 atom(cloudSyncStateAtom — 구 cloudSavedStatesAtom·CloudSavedStateSummary는 2026-07-18 제거) / 훅(useCloudSync=scheduleCloudSave·flush, useCloudSavedStates=pullAutosave·**pushAutosave**(마이그레이션 즉시 push) — **saveCheckpoint·refresh·load·remove는 2026-07-18 삭제**, 명시 체크포인트·이름슬롯 관리 폐기). ⚠ **`jotai/snowball` 배럴에 미연결**(supabase 초기번들 격리). 소비는 `@/jotai/snowball/cloud` 폴더 경로.
- `jotai/snowball/persistence/appStatePayloadDiff.ts` — **공용** payload 비교(배럴 → `@/jotai`, supabase 무관): isSamePersistedPayload(조용한로드/read-back) + **의미있는 부분집합**(serializeMeaningfulPayload/isSameMeaningfulPayload — activeScenarioId·최상위미러·뷰토글·selectedTickerId 배제). no-op 게이트가 usePortfolioPersistence 자동저장 effect에서 ref로 직전 예약과 비교(동일=클라우드 스킵). autosave 슬롯 단독 삭제=`deletePersistedAppStateAutosave`(appStateStorage).
- 하위 호환: 로컬 IndexedDB 자동저장·이름 슬롯·?share= URL·JSON 가져오기 **전부 무변경**. 클라우드는 추가 계층. 비로그인은 클라우드 skip(로컬만).
- **Stage 1 UI**: `components/CloudSyncIndicator`(저장 상태 아이콘+문장, describeCloudSyncState 순수 매퍼). 자동저장 배선·buildPayload/applyPersistedPayload/retryCloudSave 노출은 usePortfolioPersistence에 추가.
- ⚠ **2026-07-18 MySavePanel(데이터 저장 패널) 완전 제거** — 자동저장이 대체(decisions.md). `components/MySavePanel/` 폴더·툴바 "데이터 저장" 버튼·`onOpenMySave`·usePortfolioPersistence의 이름슬롯/JSON 함수·`savedName.ts`·`appStateStorage.ts` 이름슬롯 IO(list/read/write/delete-ByName) 삭제. **CloudSyncIndicator는 헤더로 이전**(`header` variant: idle 미렌더, 실패에서만 라벨+재시도). 재시도는 MainLeftPanel이 소유+`onRegisterRetryCloudSave`로 Main.view ref에 등록(훅 hoist 금지). 구 정보(클라우드/이 기기 탭·데이터관리·body 포털·LOGIN_NUDGE_TEXT·MySavePanel 로그인 게이트)는 전부 소멸.
- ⚠ **2026-07-17 클라우드 중심 전환**: 충돌 모달 폐기 → `components/CloudConflictPrompt` **삭제**, `useCloudWorkspaceSync`는 이제 `conflict` 반환 없이 **조용한 로드+안전 마이그레이션**만 배선(반환 void, MainLeftPanel에서 렌더 제거).
- 세션 배선: MainPage를 **CommunityAuthProvider로 감싸 재사용**(Provider 파일 수정 없이 consume-only) → 헤더 AuthControl(§8.2, isCommunityEnabled 게이트)이 세션 atom을 읽는다. 툴바 퀵액션 = **[Share] 하나**(Coffee 숨김) — 데이터 저장은 자동저장으로 대체 제거, **Capture는 2026-07-18 전면 삭제**(capture/*·capturePage.ts·html2canvas 제거), 로컬 이름 슬롯은 IO 코드까지 제거.

## 소셜 로그인 (2026-07-17 표준화 / social-login-spec.md)
- `components/community/SocialLoginButton/` — 공용 컴포넌트(provider=google/kakao/naver). 브랜드 규정색 **하드코딩**(테마 토큰 예외 — 8프리셋 무관 고정: 구글 흰+4색G+회색테두리, 카카오 #FEE500, 네이버 #03C75A). 로고 **인라인 SVG**(CSP). pending prop(딤+"준비 중" 배지)은 네이버 config-gated 실연동에서 **`pending={!isNaverEnabled}`로 미설정 상태 표시**에 쓰인다(2026-07-17 정정 — 버튼 숨김 금지, 위 §커뮤니티 소셜 로그인 항목). 카피 정본 = copy.ts login 섹션(구글 "Google 계정으로 계속하기").
- **로그인 게이트 3곳 모두 이 컴포넌트 사용**(2026-07-18 MySavePanel 제거로 4→3, pitfalls 참조): LoginModal / CommunityWritePage / CommunityProfilePage. 구 ProviderButton은 레포에서 완전 제거됨. 네이버 실연동 seam: `shared/lib/supabase/naver.ts`(startNaverLogin/completeNaverCallback/isNaverEnabled/NAVER_CALLBACK_PATH), 서버 `api/naver-auth.ts`, 엔트리 배선 main.tsx(isNaverCallbackPath 분기), 콜백 라우트 router/routes.tsx(isNaverEnabled 게이트).

## 글쓰기 첨부 (2026-07-18 "첨부" 토글 + 1단계 피커 / 구 write-attach-picker-spec.md 2단계·"첨부 안 함 라디오" 폐기)
- CommunityWritePage: 섹션 제목 "시뮬레이션" 우측 **"첨부" 토글**(common ToggleField, 뷰 로컬 `attachEnabled`)이 첨부 활성/해제를 쥔다. 토글 ON이면 **워크스페이스 시나리오 탭 전부를 radiogroup 카드로 택1**(useScenarioCandidates → composer.attachScenario), 카드를 고르면 **1단계 즉시 첨부**(별도 버튼 없음). 토글 OFF(기본)=미첨부·피커 숨김(optional). 무효 payload=비활성 카드+사유. 수정 모드 외부 첨부(후보와 매칭 안 되는 서버 payload)는 effect로 토글 자동 ON + 요약 카드만(해제=헤더 토글). 요약은 SimSummaryStats 재사용. 게시 저장 스키마·sim_summary·publish·검증 **무변경**. UI는 **surface 패널 card화**(WriteForm surface+shadow.e1+radius.lg, 옵션 카드 surfaceSunken, PickerGrid 스크롤/gutter 제거로 폼 폭 정렬), 게시 설정 공개/비공개 안내는 토글 옆(VisibilityRow flex). FormSection은 title 우측 슬롯 미지원이라 이 섹션 헤더만 로컬(AttachSection*). 상세는 decisions.md 2026-07-18.

## 기타
- 아이콘: lucide-react 1.24.0 (기설치), strokeWidth 1.8 관례. 프리셋 카드 매핑 = MainRightPanel.tsx PRESET_ICON_BY_ID.
- `api/og.tsx` + middleware.ts + **api/share-html.ts**(트랙 F) — 공유 링크의 동적 OG 카드. `?share=`(lz-string, middleware inline 치환)·`?s=`(DB key, middleware→api/share-html rewrite) 양쪽 지원. `shared/lib/og/`(metaHtml 순수치환 + shareKey 패턴 + sharedSnapshotRest anon REST 조회)를 middleware(Edge)·api(Node)가 공유. OG 텍스트 조립(og:title 3분기+target 가드)은 `pages/Main/utils/ogCard.ts` buildOgShareText(shared/lib은 pages import 불가라 여기). 실 미리보기 검증=사용자 배포 몫. (sim_summary와의 표기 일치는 백로그.)
- 파비콘/PWA 아이콘: public/app_icon.png(1024²)이 단일 원본 — 재생성 시 전부 여기서.

## 프로필 기능 (2026-07-17 완료 / profile-ui-spec.md)
- `pages/Community/CommunityProfilePage/` — `/community/profile` 전용 페이지. **2단 레이아웃**: 좌=프로필 편집 통합 카드(아바타+닉네임, **이메일 미노출** — 사용자 지시), 우=위험 영역(회원 탈퇴). 모바일 세로 스택은 편집→탈퇴 순(위험 아래로). AuthControl 드롭다운 "프로필 설정"로 진입.
- `components/community/DeleteAccountDialog` — 재확인 "탈퇴" 입력해야 활성, 기본 포커스=취소, danger. **POST /api/account-delete(Bearer)는 200일 때만 로그아웃**(성공 위장 금지). CommunityModal.initialFocusRef 옵셔널 확장(기존 트랩 테스트 그린).
- `shared/lib/community/{profile,avatar,accountDelete}.ts`(profile=닉네임 검증, avatar=**서버 탈퇴 청소용 AVATAR_BUCKET·avatarStorageFolder만** — v2에서 클라 리사이즈/업로드/MIME 제거, accountDelete=분기), `api/account-delete.ts`(Vercel, SERVICE_ROLE_KEY admin, 탈퇴 시 avatars 폴더 청소), CommunityAuthProvider.refreshProfile()(저장 성공 후 호출 — 낙관적 갱신 금지). analytics: profile_updated(**field=nickname만**)/account_delete_started/account_deleted.
- ⚠ 탈퇴 서버 삭제 E2E는 Vercel preview 필요(로컬 유닛은 분기만). **v2: 아바타 업로드/제거 UI·훅·auth IO(uploadMyAvatar/removeMyAvatarFile/AvatarStorageUnavailableError·updateMyProfile.avatarUrl) 삭제** — profiles.avatar_url 컬럼·avatars 버킷은 역가역 유지(표시만 이니셜로 통일).
- 카카오 로그인: auth.ts OAUTH_SCOPES 카카오 = **`profile_nickname` 만**(이메일 KOE205 회피 + v2에서 profile_image 제거).

## GA4 계측 (analytics.ts)
- 로그인 계측 이원화 주의: login_completed 정본 발화점은 CommunityAuthProvider SIGNED_IN(프로필 트랙 소유)인데, 클라우드 트랙은 sessionStorage 마커로 OAuth 리다이렉트 넘어 귀속(useCloudSyncAnalytics). **auth 트랙이 SIGNED_IN에 직접 login_completed를 넣으면 이중 계측** — 단일화 필요(백로그).

## 진행 중 (완료 시 이 파일 갱신할 것)
- 없음 (이번 세션 기능 트랙 전부 랜딩). 남은 것은 전부 사용자 배포 액션(마이그레이션 3개 실행·Storage 버킷·Vercel 환경변수)과 Stage 2(공유/OG 통합 — Capture는 폐기 완료), 백로그 항목.
