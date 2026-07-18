# GA4 계측 설계 (Measurement Plan)

> snowball-income(배당 스노우볼 시뮬레이터 + 커뮤니티)의 제품 의사결정을 위한 GA4 계측 표준.
> 이 문서가 **이벤트·파라미터·유저속성·전환·리포트의 단일 출처**다. 코드(`shared/lib/analytics.ts`)와
> GA4 콘솔 설정은 이 문서를 따른다.

## 0. 설계 원칙
1. **이벤트가 아니라 "결정"에서 출발** — 모든 이벤트/차원은 아래 §1의 질문 중 하나에 매핑된다. 목적 없는 계측 금지.
2. **PII 금지** — 이메일·닉네임·커스텀 티커명·자유 텍스트를 GA로 보내지 않는다. 익명 `client_id` 집계만.
3. **타입 안전 택소노미** — 이벤트명과 파라미터를 코드로 강제(`AnalyticsEventParamMap`). 오타·누락은 컴파일 에러.
4. **3층 구조** — Key Events(전환) + Custom Dimensions(슬라이스) + User Properties(코호트). GA4에서 이 3층을 등록해야 데이터를 쪼개 볼 수 있다.
5. **저카디널리티** — 연속값(금액·기간)은 **버킷**으로 보낸다(예: `target_dividend_bucket="50-100만"`). 카디널리티 폭발·PII화 방지.

## 1. 답할 핵심 질문 (우선순위)

| # | 질문 | 지표 | 관련 이벤트 |
|---|------|------|-------------|
| 1 | 신규가 **시뮬 결과**까지 오나? (Aha) | 활성화율 = `simulation_result_view`/방문 | 활성화 퍼널 |
| 2 | 어떤 **프리셋·티커·설정·차트**가 인기? | 항목별 상위 | preset_applied, ticker_included, investment_setting_changed, chart_view |
| 3 | **익명→로그인** 전환 & 트리거? | 로그인 전환율(게이트별) | login_completed{source,entry_point} |
| 4 | **재방문·저장**의 리텐션 효과? | D1/D7/D30, 코호트 비교 | return_visit + User Props |
| 5 | **커뮤니티**가 참여·유입을 만드나? | 갤러리→상세→시뮬, 참여율 | community_* |
| 6 | 어디서 **마찰·이탈**? | 에러 발생 지점 | validation_error_view, operation_error |
| 7 | **인기 종목/프리셋 트렌드** | 월간 TOP | ticker_included, preset_applied |

## 2. 3층 측정 구조

### 2-1. Key Events (전환) — GA4 "주요 이벤트"로 지정
`simulation_result_view` · `ticker_saved` · `cloud_save_completed` · `community_post_published` · `scenario_shared`

> ✅ **`login_completed` 부활 완료(Phase 1.5, 2026-07-19)** — `login()`이 OAuth 리다이렉트 직전 sessionStorage
> 마커(`snowball:cloud-login-source`)에 `source`(=제공자 google/naver/kakao)를 심고, 복귀 랜딩이 read+clear로
> 1회 발화한다. **메인 랜딩=`useCloudWorkspaceSync`, 커뮤니티 랜딩=`CommunityAuthProvider`** 둘 다 같은 마커를
> 게이팅해 **로그인당 정확히 1회**(이중 계측 없음). 파라미터는 `source`(등록됨). `entry_point`(어느 게이트에서
> 로그인했나)는 openLoginPrompt 호출부 스레딩이 필요해 아직 미배선 — 원하면 추가.

### 2-2. Custom Dimensions (event-scoped)
| 파라미터(=차원) | 붙는 이벤트 | 용도 |
|------|-------------|------|
| `preset_id` | preset_applied | 프리셋 인기·완주율 |
| `ticker` | ticker_included/selected/deleted | 종목 트렌드 |
| `setting_name` | investment_setting_changed, toggle_changed | 어떤 설정을 만지나 |
| `value_bucket` | investment_setting_changed | 목표배당·기간·세율 분포 |
| `chart_type` | chart_view | 차트 관심도 |
| `login_source` | login_completed | google/naver/kakao |
| `entry_point` | login_completed, modal_view | 어디서 로그인 유도됐나 |
| `sync_direction` | cloud_sync_reconciled | 동기화 방향 분포 |
| `scenario_action` | scenario_tab_action | 다중 시나리오 패턴 |
| `reinvest_mode` | simulation_result_view | 재투자 설정별 |
| `target_met` | simulation_result_view | 목표 달성 여부 |
| `error_field` | validation_error_view | 이탈 유발 입력 |
| `operation` | operation_error | 실패 지점 |
| `share_method` | scenario_shared | 링크/이미지 |
| `has_sim` | community_post_view/published | 시뮬 첨부 글 성과 |
| `like_action` | community_like | 좋아요/취소 |

### 2-3. User Properties (코호트)
| 속성 | 값 | 설정 시점 |
|------|----|-----------|
| `has_account` | true | 최초 로그인 완료 시 |
| `has_saved` | true | 최초 저장(로컬/클라우드) 시 |
| `is_returning` | true | 2회차+ 방문(return_visit) 시 |
| `preferred_theme` | preset_id | 테마 변경 시 |
| `community_active` | true | 최초 커뮤니티 참여(글/좋아요/댓글) 시 |

## 3. 이벤트 택소노미

> ★ = 신규/보강 필요. 나머지는 이미 배선됨(§6 감사 참고).

### A. 온보딩
| 이벤트 | 발화 시점 | 파라미터 |
|--------|-----------|----------|
| tutorial_started | 투어 시작 | step_count, first_step |
| tutorial_step_view | 각 단계 노출 | step_id, step_index, step_count |
| tutorial_completed | 완주 | step_count |
| tutorial_dismissed | 중도 이탈 | reason, step_id, step_index |

### B. 시뮬레이션 코어 (활성화 퍼널)
| 이벤트 | 시점 | 파라미터 |
|--------|------|----------|
| preset_applied | 프리셋 적용 | preset_id |
| ticker_included | 포트폴리오 편입 | ticker, source(preset/custom) |
| investment_setting_changed | 설정 변경 | setting_name, value_bucket |
| toggle_changed | 토글 변경 | setting_name, value |
| portfolio_config_completed | 유효 구성 완료 | ticker_count |
| **simulation_result_view** ⭐ | 결과 노출 | reinvest_mode, target_met |
| chart_view | 차트 노출 | chart_type |

### C. 시나리오 / 공유
| 이벤트 | 시점 | 파라미터 |
|--------|------|----------|
| scenario_tab_action | 탭 생성/선택/이름변경/삭제 | scenario_action |
| **scenario_shared** ⭐신규 | 공유 링크 생성/복사 | share_method |

### D. 저장 · 동기화 · 계정
| 이벤트 | 시점 | 파라미터 |
|--------|------|----------|
| **ticker_saved** ⭐KE | 티커 저장 | source |
| **cloud_save_completed** ⭐KE | 클라우드 저장 성공 | — |
| cloud_sync_reconciled | 세션 시작 동기화 | sync_direction |
| **login_completed** ⭐KE | 로그인 완료 | login_source, entry_point |
| account_delete_started / account_deleted | 탈퇴 흐름 | — |
| return_visit | 재방문 | — |

### E. 커뮤니티 ★신규 (최대 갭)
| 이벤트 | 시점 | 파라미터 |
|--------|------|----------|
| community_gallery_view | 갤러리 진입 | — |
| community_post_view | 상세 진입 | has_sim |
| **community_post_published** ⭐KE | 글 발행 | has_sim |
| community_like | 좋아요/취소 | like_action |
| community_comment | 댓글 작성 | — |
| community_to_simulator | 상세→시뮬레이터 유입("이 시나리오로 열기") | — |

### F. 공통 / 품질
| 이벤트 | 시점 | 파라미터 |
|--------|------|----------|
| cta_click | 주요 CTA | id |
| modal_view | 모달 노출 | modal, entry_point |
| validation_error_view | 검증 에러 | error_field |
| operation_error | 동작 실패 | operation, reason |

## 4. 퍼널 & 탐색 리포트 (GA4 Explore — 대시보드 작업)
1. **활성화 퍼널**: page_view(/) → (preset_applied ∪ ticker_included) → portfolio_config_completed → **simulation_result_view**
2. **저장→계정 퍼널**: simulation_result_view → (저장 CTA) → login_completed → cloud_save_completed
3. **온보딩 퍼널**: tutorial_started → step별 → tutorial_completed
4. **커뮤니티 퍼널**: community_gallery_view → community_post_view → community_to_simulator
5. **write 퍼널**: (로그인 게이트) → community_post_published
6. **정적 리포트**: 인기 preset_id·ticker TOP / value_bucket 분포 / error_field·operation 랭킹 / 채널별 활성화율

## 5. 프라이버시
- PII 0. IP 익명화(GA4 기본). `send_page_view:false` + SPA 수동 page_view(구현됨).
- 익명 도구라 초기엔 Consent Mode 기본 granted + 처리방침 링크. 이후 필요 시 배너.

## 6. 현재 코드 감사 (2026-07-19)
- **잘 배선됨**: 온보딩(TourGuide), 테마, 시뮬 코어(MainRightPanel: preset_applied/simulation_result_view/portfolio_config_completed), 티커·비중(useTickerActions), 설정(useSnowballForm/InvestmentSettings), 시나리오(useScenarioTabs), 동기화·로그인source(useCloudWorkspaceSync), 클라우드저장(useCloudSyncAnalytics), 에러·재방문(usePortfolioPersistence), 프로필·탈퇴.
- **갭(Phase 1에서 추가)**: ① 커뮤니티 이벤트 전무 ② User Properties 전무 ③ scenario_shared 미계측 ④ login entry_point 파라미터 ⑤ 파라미터 타입 계약·value_bucket 버킷팅 ⑥ consent.

## 7. 구현 (Phase 1)
- `shared/lib/analytics.ts`: `AnalyticsEventParamMap`(이벤트→파라미터 타입) + 타입 `track()` + `setUserProperties()` + `bucketValue()` 헬퍼 + 신규 이벤트 상수. 기존 `trackEvent`는 하위호환 유지.
- 배선: 커뮤니티 이벤트 + User Properties + scenario_shared + login entry_point.
- 검증: `npx tsc -b tsconfig.build.json` + `npm run test`.

## 8. ✅ 사용자(대시보드)가 할 일 — Phase 1 배포 후 체크리스트

> 코드(Phase 1)는 배선 완료. 아래는 **GA4 콘솔에서 1회** 설정하면 데이터가 "쪼개 볼 수 있게" 쌓인다.
> **순서 중요**: 먼저 배포 → 실제로 몇 번 클릭해 이벤트를 발생 → **DebugView/실시간에서 파라미터 철자 확인** → 그 이름으로 등록.
> (GA4는 이벤트가 처음 도착한 뒤라야 그 파라미터를 차원으로 등록할 수 있다.)

### 8-1. 발화 확인 (5분)
- GA4 → **관리 → DebugView**. 브라우저에서 사이트를 열고(개발자모드/GA debug) 시뮬 돌리기·프리셋·커뮤니티 글/좋아요·테마변경·공유를 클릭 → 이벤트가 뜨는지 확인.

### 8-2. Custom Dimensions 등록 (관리 → 맞춤 정의 → **측정기준 만들기**, 범위=이벤트)
아래 **이벤트 매개변수는 코드가 실제로 보내는 철자 그대로**다(검증 완료 2026-07-19). 측정기준 이름은 자유.

| 측정기준 이름(제안) | 범위 | 이벤트 매개변수 | 붙는 이벤트 |
|------|------|------|------|
| Preset ID | 이벤트 | `preset_id` | preset_applied |
| Ticker | 이벤트 | `ticker` | ticker_included/selected/deleted, allocation_changed |
| Source | 이벤트 | `source` | ticker_included/saved/selected, login_completed |
| Setting Field | 이벤트 | `field_name` | investment_setting_changed, toggle_changed |
| Setting Value Bucket | 이벤트 | `value_bucket` | investment_setting_changed |
| Action | 이벤트 | `action` | scenario_tab_action, allocation_changed |
| Mode | 이벤트 | `mode` | ticker_saved/deleted, modal_view, chart_view |
| CTA Name | 이벤트 | `cta_name` | cta_click |
| CTA Placement | 이벤트 | `placement` | cta_click |
| Modal Type | 이벤트 | `modal_type` | modal_view |
| Chart Name | 이벤트 | `chart_name` | chart_view |
| Sync Direction | 이벤트 | `direction` | cloud_sync_reconciled |
| Operation | 이벤트 | `operation` | operation_error |
| Tour Step | 이벤트 | `step_id` | tutorial_step_view/dismissed |
| Has Sim | 이벤트 | `has_sim` | community_post_view/published |
| Like Action | 이벤트 | `like_action` | community_like |
| Share Method | 이벤트 | `share_method` | scenario_shared |

> ⚠ 무료 GA4는 이벤트 범위 맞춤 측정기준 **50개** 한도. 숫자 파라미터(`included_ticker_count`·`duration_years`·`weight_percent`·`error_count`)는 필요하면 **맞춤 측정항목(metric)** 으로 따로 등록.

### 8-3. User Properties 등록 (맞춤 정의 → **사용자 속성 만들기**)
`has_account` · `has_saved` · `is_returning` · `preferred_theme` · `community_active`

### 8-4. Key Events 지정 (관리 → **주요 이벤트**, 또는 이벤트 목록에서 토글)
`simulation_result_view` · `ticker_saved` · `cloud_save_completed` · `community_post_published` · `scenario_shared` · **`login_completed`**
> `login_completed`은 이제 발화된다(§2-1 부활 완료) — **주요 이벤트로 토글**만 하면 전환으로 집계된다. 파라미터 `source`는 §8-2에 이미 등록.

### 8-5. Explore 퍼널/리포트 구축 (§4)
활성화 퍼널 · 저장→계정 · 온보딩 · 커뮤니티 · 인기 preset/ticker · value_bucket 분포 · error/operation 랭킹.

### 8-6. (완료) login_completed 부활 — Phase 1.5 ✅
`source`(제공자)로 되살림. 남은 선택 확장: `entry_point`(저장/글쓰기 등 어느 게이트에서 로그인 유도됐나)를
넣으면 게이트별 전환율 퍼널이 가능 — 그때 `entry_point` 커스텀 측정기준 1개 추가 등록.
