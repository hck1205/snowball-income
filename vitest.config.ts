import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname
    }
  },
  test: {
    /*
     * 기본값은 jsdom 이다 — **분류를 못 하겠으면 그대로 두면 된다**(느릴 뿐 절대 틀리지 않는다).
     *
     * 다만 환경 준비(jsdom 인스턴스 생성)가 이 스위트에서 가장 비싼 항목이라(전체 실행 CPU
     * 1,300초 규모), DOM 을 전혀 쓰지 않는 테스트는 파일 **첫 줄**에
     *   // @vitest-environment node
     * 를 붙여 node 에서 돌린다. 같은 파일들을 node 로 돌리면 3배 빠르다(실측 52.2s → 17.4s).
     *
     * node 로 내려도 되는 기준 — 셋 다 만족할 때만:
     *   1) 렌더·이벤트가 없다(render/renderHook/user-event/document/window 를 쓰지 않는다).
     *   2) 테스트 대상이 **환경에 따라 분기하지 않는다**. `typeof window !== 'undefined'` 같은
     *      가드를 가진 코드(스토리지·클라우드 동기화·계측·OAuth·리치텍스트 sanitize 계열)는
     *      node 에서 **다른 분기를 타고도 통과**할 수 있다 — 조용히 약해진 테스트가 되므로 jsdom 에 남긴다.
     *   3) node 단독으로 실제로 통과한다(폴더가 아니라 파일 단위로 판단한다 — 같은 폴더에
     *      순수 테스트와 렌더 테스트가 섞여 있어 글롭으로는 나눌 수 없다).
     * 판단이 서지 않으면 붙이지 마라. 잘못 붙이면 실패로 드러나지만, 안 붙인 대가는 몇 밀리초다.
     */
    environment: 'jsdom',
    /*
     * vitest 2 의 기본값은 `forks`(파일마다 자식 **프로세스**)다. 스레드로 바꾸면 프로세스 spawn
     * 비용이 사라져 이 스위트에서 212초 → 188초였다(실측 2026-08-09, 403파일 전부 통과).
     *
     * ⚠ 스레드는 **한 프로세스를 공유**한다. 그래서 `process.env` 를 직접 대입하는 테스트가
     *   하나라도 있으면 동시에 도는 다른 파일로 오염이 샌다(실패가 파일 순서에 따라 나타났다
     *   사라지는 종류다). 전환 시점에 확인했고 0건이었다 — 앞으로도 환경변수는 `vi.stubEnv`
     *   로만 만져라(그건 스코프가 끝나면 되돌아간다).
     * ⚠ `env.TZ` 는 괜찮다. 모든 워커에 **같은 값**이 들어가므로 공유돼도 다툴 일이 없다.
     */
    pool: 'threads',
    globals: true,
    // setup 은 양쪽 환경에서 모두 로드된다 — DOM 준비물은 test/setup.ts 가 window 유무로 갈라서 넣는다.
    setupFiles: './test/setup.ts',
    /*
     * `.claude/worktrees/*` 는 다른 세션이 만든 **git worktree**(레포 안에 체크아웃된 별도 브랜치)다.
     * 자기 `node_modules` 를 갖고 있어 그 안의 테스트를 여기서 돌리면 React 인스턴스가 둘이 되어
     * 전부 실패한다 — 우리 코드와 무관한 노이즈라 검증 게이트가 의미를 잃는다. 워크트리는 남기고
     * 테스트 수집에서만 제외한다.
     */
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
    /*
     * RTL asyncUtilTimeout 을 4초로 올렸으므로(test/setup.ts), 대기 2번이면 기본 5초를 넘는다.
     * 부하 시 테스트 자체가 타임아웃으로 오인되지 않게 여유를 둔다.
     *
     * 🔴 15초 → 30초 (2026-08-23). 15초는 **경합 폭을 감당하지 못했다.**
     *    실측: `dividendCalendarDayJump` 의 한 케이스가 단독 실행 **4.3초**인데 전체 실행에서
     *    15초를 넘겨 죽었다(약 3.5배). 447파일이 스레드로 동시에 도는 동안 무거운 jsdom 테스트는
     *    이만큼 늘어난다 — 즉 4초짜리 테스트가 이미 한도의 3분의 1을 쓰고 있었다.
     *
     *    증상이 **무작위로 자리를 옮긴다**는 것이 이 진단의 근거다: 연속 두 실행의 실패 목록이
     *    서로 겹치지 않았고(4건 → 1건), 실패한 파일은 전부 단독 실행에서 통과했다. 실패 사유도
     *    단정(assertion)이 아니라 `Test timed out in 15000ms` 하나뿐이었다.
     *
     * ⚠ 이건 **숨기는 게 아니라 한도를 실제 필요에 맞춘 것**이다. 진짜로 멈춘 테스트는 여전히
     *   죽는다 — 30초 뒤에 죽을 뿐이다. 반대로 15초를 유지하면 검증 게이트가 무작위로 빨개져
     *   "빨간 건 무시해도 된다"를 학습하게 되는데, 그쪽이 훨씬 비싸다.
     * ⚠ 한 테스트가 정말 30초를 쓰기 시작하면 한도를 또 올리지 말고 **그 테스트를 쪼개라**.
     */
    testTimeout: 30000,
    // 테스트는 개발자의 로컬 .env 에 좌우되면 안 된다.
    // Vite 가 .env 를 읽어오므로, 커뮤니티 변수는 명시적으로 비워서 "백엔드 없는 기본 배포"
    // 상태를 고정한다. 커뮤니티가 켜진 경로는 readCommunityEnv 에 값을 주입해 테스트한다.
    env: {
      /*
       * 이 앱의 날짜 계산(배당 지급일·'오늘' 판정)은 KST 기준이다. 개발자 PC는 대개 KST라
       * 로컬에서는 통과하고 UTC로 도는 CI에서만 하루 어긋나는 회귀가 생긴다.
       *
       * 🔴 **이 값만으로는 부족하다**(2026-08-11 실측). 여기 적혀 있던 "Node 는 process.env.TZ
       *    대입 시 타임존 캐시를 무효화한다"는 설명은 **사실이 아니었다** — V8 은 첫 Date 사용
       *    시점에 타임존을 캐시하고, 프로세스가 뜬 뒤 넣은 값은 반영되지 않는 경우가 있다.
       *    그래서 CI 에서 `process.env.TZ === 'Asia/Seoul'` 인데
       *    `new Date('2026-01-01T00:00:00Z').getHours()` 가 0(UTC)으로 나왔고, 데이터 갱신
       *    워크플로 둘이 그 테스트에서 며칠간 멈춰 있었다.
       * 🔴 진짜 방어선은 **프로세스 시작 전 환경변수**다 — `.github/workflows/*.yml` 의
       *    워크플로 레벨 `TZ: Asia/Seoul`. 이 값은 그 위에 얹는 2차 방어선으로 남긴다
       *    (환경이 이미 KST 면 아무 일도 안 하고, 아니면 최소한 `process.env.TZ` 는 맞춘다).
       * ⚠ 로컬이 초록인 것은 설정 덕이 아니라 **PC 시간대가 KST 라서**일 수 있다. 그 차이를
       *   `test/shared/testEnvironmentSplit.test.ts` 가 실제 Date 값으로 확인한다.
       */
      TZ: 'Asia/Seoul',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      // 가계부(구글 시트)도 같은 이유로 고정한다 — 개발자가 로컬 .env 에 실제 키를 넣어 두면
      // "꺼진 상태" 계약 테스트가 조용히 뒤집힌다. 켜진 경로는 readGoogleSheetsEnv 에 주입해 테스트한다.
      VITE_GOOGLE_CLIENT_ID: '',
      VITE_GOOGLE_API_KEY: '',
      VITE_GOOGLE_PROJECT_NUMBER: ''
    }
  }
});
