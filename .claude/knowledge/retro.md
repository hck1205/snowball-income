# 프로세스 회고 (orchestrator가 미션 설계 시 읽는다)

## 잘 작동한 패턴 (유지)
- [2026-07-17][process] **스펙(디자이너 hex 확정+대비 실측) → 구현 → qa+reviewer 병렬 → 수정 → 재검증** 파이프라인. reviewer/qa가 매 미션 실버그를 잡았다(토글 썸 소실, 차트 stale, 진행률 반올림 모순, 에러 무음 삼킴) — 검증 단계 생략 금지.
- [2026-07-17][process] 병렬 트랙은 **파일 경계로 분리**하고, 공유 파일(copy.ts, index.ts 배럴)은 순차 처리 또는 담당 지정. 착수 전 "누가 어떤 파일을 만지는지" 명시.
- [2026-07-17][process] 핸드오프에 **검증 로그 원문 수치**(테스트 개수·대비 값)를 포함하면 취합 신뢰도가 높아진다. "통과했다"만 쓰지 말 것.
- [2026-07-17][process] 대비(contrast)는 스펙 단계에서 **사전 실측**(presets-verify.mjs 패턴) — 구현 후 발견하면 연쇄 조정 비용이 커진다.
- [2026-07-17][process] 같은 도메인 후속 작업은 **이전 작업자를 재개**(컨텍스트 유지)하는 편이 새 에이전트보다 빠르고 정확했다.
- [2026-07-20][process] 시각 스타일 요청은 "1안 코드 적용 + 나머지 안은 **교체 지점 1곳 + CSS 스니펫**으로 설명"이 사용자 취향(여러 버전 비교)과 잘 맞았다 — 대안을 다 구현하지 않고도 비교·전환이 가능. 이때 활성/변형 스타일을 styled 파일 내 **단일 상수 블록**으로 모으는 게 전제(navItemActiveStyle 사례).
- [2026-07-21][process] 단일 UI 도메인 소기능(LoginModal 버튼 1개)도 **frontend → qa → reviewer 순차 위임**이 값을 했다: 브리핑에 pitfalls의 "vi.mock 전체치환 목 누락 크래시"를 발췌해 주입하니 frontend가 이를 명시적 리스크로 넘겼고 qa가 선제 차단 → 전 LoginModal 테스트 붕괴를 예방. 이벤트 핸들러에서만 불리는 새 배럴 import는 목에 없어도 **기존 테스트가 초록이라 무죄로 오인**하기 쉬운데, 브리핑 주입이 그 함정을 건너뛰게 했다.

- [2026-07-21][process] **진단-우선 미션(버그 원인 규명)은 "GA4 정량화 ∥ 코드 근본원인" 2트랙 병렬 → 판정 수렴 확인 → "구조적 한계"면 ui-ux-designer ∥ pm-po로 대응안 도출** 파이프라인이 잘 맞았다. 코드 진단(state-engineer, read-only)과 데이터 진단(analytics-analyst)이 독립이라 병렬로 띄워 시간 절약. **판정이 갈릴 수 있는 지점을 미리 계측 지문으로 정의**해두면(context_switched vs reason=no_session으로 가설 a/b 구분) 실기기·데이터 확인 항목이 명확해진다. ⚠ ui-ux-designer("지금 카피 A 배포")와 pm-po("측정 먼저, blind 빌드 금지")가 **상충 권고**를 냈는데, 이 상충 자체가 사용자에게 넘길 결정의 핵심이었다 — 오케스트레이터가 한쪽으로 성급히 봉합하지 말고 상충을 그대로 드러내 사용자 판단에 넘기는 게 옳다(특히 파괴적/전환영향 있는 로그인 플로우).
- [2026-07-21][process] **GA MCP 인증이 미설정이면 진단 미션의 정량화 트랙이 통째로 blind**가 된다 — analytics-analyst를 띄우기 전에 인증 상태를 알 수 없으니 일단 띄우되, 브리핑에 "인증 미설정이면 지어내지 말고 택소노미만 정리"를 명시하면 헛수고 없이 "무엇을 수집 중인지 + 인증 풀리면 돌릴 쿼리"가 남아 다음 세션이 즉시 재개 가능하다.

- [2026-07-21][process] **외부 심사(네이버 검수) 대응은 "코드는 보조, 제출자료·캡처가 실제 통과요인"임을 브리핑·최종보고 양쪽에 못박는다** — 확정 스펙(카피·배치·톤까지 사용자가 정함)이 오면 ui-ux-designer 왕복을 생략하고 frontend에 디자인결정을 주입해 A(게이트 flip)+B(상시 고지) 한 에이전트로 묶으면 빠르다. 문서 이관(C)은 파일 경계가 완전 분리라 프론트와 병렬. reviewer를 "blocking만, 없으면 통과"로 게이팅하니 대기 없이 커밋까지 완주했다. 최종 핸드오프에 **사용자가 직접 해야 하는 제출 체크리스트**(캡처 순서·상수 되돌리기 시점)를 포함하는 게 이런 "코드로 못 끝나는" 미션의 핵심 산출물이다.
- [2026-07-21][process] **OAuth/서버 연동 실패는 클라이언트 UX 를 만지기 전에 서버 콜백 상태코드·프로바이더 로그부터 본다** — "카카오만 로그인 실패" 증상이 "카톡 인앱 저장소 격리"라는 그럴듯한 가설과 맞아떨어져 여러 세션(선제 배너·외부열기 버튼·2FA 카피 3커밋)을 UI 쪽으로 태웠으나, 실원인은 Supabase Auth Logs 의 콜백 500(profiles avatar_url CHECK 위반)이었다 — 로그 한 줄이면 첫 세션에 끝났을 일. **위임 브리핑에 "확정된 근본원인 + 로그 원문"을 주니** frontend/qa/docs 가 헛다리 코드를 정확히 도려내고(선제 배너 제거) 실재하는 안전망(실패 후 배너)은 남기는 경계를 한 번에 맞췄다 — 진단이 끝난 정리 미션은 "무엇이 오진이었고 무엇이 진짜였나"를 브리핑에 명시하는 게 재작업을 없앤다. ⚠ 서브에이전트(frontend)가 학습 프로토콜대로 pitfalls.md 를 **먼저 수정**해 orchestrator 큐레이션과 편집 충돌(파일 변경 감지)이 났다 — 지식파일을 만질 서브에이전트에겐 담당 항목을 지정하거나 "knowledge 는 orchestrator 전담"을 브리핑에 명시해 이중편집을 피할 것.

- [2026-07-22][process] **"UX 배치를 고민 중"인 설계-전 요청은 구현 금지 미션으로 명시**하고 코드구조(frontend-engineer)∥데이터가용성(ticker-data-curator)을 read-only 병렬로 먼저 돌린 뒤, 그 사실을 주입해 ui-ux-designer에 위임하니 설계가 데이터 현실 위에 앉았다(요청 5필드가 프리셋 73종에만 존재·검색탭 상장 1만2천종엔 수치 0 → 필터 모집단 제약이 설계 전제로 확정). 미션 도중 coordinator가 배치 방향(접이식 패널)을 확정해 왔는데, **확정을 designer 브리핑의 "이미 선택됨" 전제로 못박고 대안 비교는 짧게만** 요구하니 재설계 왕복이 없었다. ⚠ 파생필드 중복(expectedTotalReturn=yield+growth)은 데이터 조사에서 먼저 잡아 designer에 넘겨야 "3중 슬라이더 모순"을 설계가 선제 회피한다.

- [2026-07-22][process] **기능 제안 미션에서 오케스트레이터 브리핑의 "현재 코드 사실관계"조차 최신이 아닐 수 있다** — "진행률 게이지는 없음/약함"이라 브리핑했으나 pm-po·ui-ux-designer 둘 다 코드에서 이미 있는 StatTile 진행바(role=progressbar+그라데이션+"목표의 N%")를 찾아냈고, 나아가 target=0 미설정 시 "0원 목표 첫해 달성"으로 읽히는 무근거 표시 버그까지 잡았다. 교훈: **제안 미션에도 pm-po∥ui-ux-designer를 read-only로 병렬 위임하면 브리핑의 갭분석을 코드로 교차검증**해 "이미 있는 걸 새로 만들자"는 중복 제안과 숨은 버그를 동시에 걸러낸다. 두 에이전트에게 각각 "npm run search로 사실 교차확인"을 명시한 게 주효했다.

- [2026-07-22][process] **제안→승인→구현 전환 시 "확정 결정"을 이미 컨텍스트를 가진 designer에게 SendMessage로 재개시켜 구현스펙(hex·게이지옵션·카피 문자열)까지 뽑고, 그 스펙을 그대로 frontend 브리핑에 인라인**하니 designer→frontend 핸드오프 손실이 0이었다(retro의 "동일 도메인 재개" 패턴 재확인). 파이프라인 ui-ux(재개)→frontend→qa→reviewer 순차가 매끄럽게 완주. ⚠ **백그라운드 재개 에이전트의 완료 판정은 output 파일 크기·mtime 만으로는 오판한다** — 긴 thinking/tool 스텝 중 크기가 잠시 정체돼 "IDLE"로 오인했다(실제론 작업 중). 정답은 **파싱해서 마지막 assistant record의 `stop_reason==='end_turn'`을 확인**하는 것. output 파일이 JSONL(전체 transcript)이라 통째 Read는 256KB 초과로 실패 → python으로 text 블록만 추출해 파일로 저장 후 Read가 안전(콘솔 mojibake 회피). ⚠ **frontend가 스펙을 넘는 최소 이탈(스펙은 success/warning 2토큰, 실제 markPoint/게이지가 onBrand/progressTrack도 필요)**을 자율 판단해 기존 토큰만 readVar로 추가했고, reviewer가 이를 명시 검증항목으로 받아 "새 hex 0·5곳 정합·additive 무파손"으로 승인 — **브리핑에 "스펙 이탈 발생 시 reviewer가 판정"을 미리 심으면 이런 필연적 이탈이 무음으로 지나가지 않는다**. reviewer가 잡은 신규 함정(onBrand×success 대비 사각지대)은 pitfalls에 기록.

- [2026-07-23][process] **"구현 금지, 검토만" 미션은 pm-po + 전문가 3인(state/sim/ticker)을 read-only 병렬로 띄우니 오케스트레이터 브리핑의 전제 오류 3건을 코드·실측으로 교차반증**했다: ①"한 API로 KR+US 배당 못 준다"는 전제를 ticker-curator가 Yahoo `.KS` 실호출로 반증 ②"Supabase Edge Function/Cron 필요"를 pm-po가 "기존 GitHub Actions 월간 크론 + Yahoo 무키라 불필요"로 반박 ③"도달예상일은 findTargetYear로 이미 있음"을 sim-engineer가 "연 해상도라 월단위 예상일엔 부적합, runSimulation 본체는 정수주·실캘린더·월해상도 3가지로 재사용 불가, 헬퍼만 재사용"으로 정밀화. 교훈: **검토 미션에서도 브리핑의 "현재 사실"을 그대로 믿지 말고 각 전문가에게 "npm run search/실호출로 교차확인"을 명시**하면 서브에이전트가 오케스트레이터의 오진을 잡아준다. 상충이 아니라 서로를 정밀화하는 방향이라 종합이 수월했다. ⚠ 서브에이전트가 실측한 "코드만으론 모르는 발견"(Yahoo KR 커버)은 편집권 없어 핸드오프 텍스트로만 넘겼고, orchestrator가 architecture.md 토대B에 기록했다 — 검토 미션에서도 지식 반영은 orchestrator 전담 원칙 유지.

- [2026-07-24][process] **적응형 개발 프로세스 스킬 4종(ship·feature·new-ticker-page·refresh-data) + `verify` 도구를 구축**하며 얻은, 코드만 봐선 모를 것 3가지: ①dev CLI 3종(tracks·devstatus·predeploy)은 `chore/dev-cli-tools` 브랜치(worktree)에만 있고 **main엔 없다** — `tools/dev/verify.mjs`는 그 관례(predeploy의 `runNodeBin`·`findNodeModulesRoot`·정션 node_modules 탐색)를 **참고**하되 `trackConfig.mjs` import 없이 **standalone**으로 짜야 main에서 돈다. `ship` 스킬도 tracks/predeploy를 "있으면"으로 참조해 이 브랜치 분리를 정직하게 반영했다(없으면 `git status`+`verify` 폴백). ②verify의 단계 순서 **api:bundle→api:check는 의도적**이다 — `npm run build`는 api:check만 돌려 CI에서 stale이면 실패시키지만, verify는 **로컬 pre-ship** 도구라 소스 변경을 산출물에 **재생성 후 확인**한다(그래서 verify 후 `git status`로 바뀐 api/*.js 스테이징 안내가 필요). ③마스터 문서(dev-process SKILL.md)만으론 절차를 못 짠다 — 실제 도구 소스·#41~#43 커밋·pitfalls 실측(19종 가드 스킵·pathspec `--only` 커밋·og→marketData 전이의존)을 읽어야 스킬이 현실과 맞았다. 스킬을 "지어내지 말고 실측으로"가 이 미션의 핵심이었다. 근거 tools/dev/verify.mjs, .claude/skills/{ship,feature,new-ticker-page,refresh-data}/SKILL.md, CLAUDE.md "개발 프로세스(적응형)".

## 사고·마찰에서 배운 것
- [2026-07-17][process] 에이전트 간 **계약(어트리뷰트명·저장 키·함수명)은 먼저 랜딩한 구현이 정본** — 스펙 문서가 다르게 쓰면 취합자가 즉시 조정 지시. (data-preset vs data-palette / buildSimSummary vs buildScenarioSimSummary 사례)
- [2026-07-17][process] 병렬 작업 중 관측된 테스트 실패는 상대 작업자의 중간 상태일 수 있다 — 보고는 하되 **자기 변경과의 인과를 교차 확인**(파일 스왑·재실행)한 뒤 판단. (Button.styled 일시 오류, TS2551 사례)
- [2026-07-17][process] 서브에이전트는 wmux 브라우저를 못 쓴다 — 시각 QA 항목은 "자동화 근거 병기 + 수동 확인 필요"로 분류해 사용자/메인 세션에 넘긴다.
- [2026-07-16][process] 사용자 요청의 진짜 의도를 확인하라 — "velog 참조"가 팔레트가 아니라 **글 카드 포맷**이었던 사례. 모호하면 이행 전에 1회 확인이 재작업보다 싸다.
- [2026-07-17][process] 세션 중단(API 529) 후 백그라운드 에이전트 생사는 **output 파일 mtime + 워킹트리 변경 흔적**으로 판별하고 SendMessage로 확인·재개한다("queued"=실행 중 / "no active task; resumed"=정지였음). 0바이트 output은 완료 여부 판별 근거가 못 된다(완료돼도 0바이트).
- [2026-07-17][process] 재개된 에이전트에 추가 지시를 보냈을 때 "완료" 보고만 오면 **산출물을 grep으로 실검증**하라 — 기존 핸드오프만 재발행하고 추가 작업을 안 한 사례(제안서 면책 § 누락) 있음.

## 사용자 확인이 필요한 결정 유형 (독단 금지)
- 기본값 변경(기본 테마, 라우트 등), 기능 제거, 스키마·저장 형식 변경, 타사 브랜드명 노출, 파괴적 플로우(탈퇴 등).
