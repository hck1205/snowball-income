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
    // RTL asyncUtilTimeout 을 4초로 올렸으므로(test/setup.ts), 대기 2번이면 기본 5초를 넘는다.
    // 부하 시 테스트 자체가 타임아웃으로 오인되지 않게 여유를 둔다.
    testTimeout: 15000,
    // 테스트는 개발자의 로컬 .env 에 좌우되면 안 된다.
    // Vite 가 .env 를 읽어오므로, 커뮤니티 변수는 명시적으로 비워서 "백엔드 없는 기본 배포"
    // 상태를 고정한다. 커뮤니티가 켜진 경로는 readCommunityEnv 에 값을 주입해 테스트한다.
    env: {
      /*
       * 이 앱의 날짜 계산(배당 지급일·'오늘' 판정)은 KST 기준이다. 개발자 PC는 대개 KST라
       * 로컬에서는 통과하고 UTC로 도는 CI에서만 하루 어긋나는 회귀가 생긴다 — 실행 타임존을
       * 고정해 어디서 돌려도 같은 날짜를 보게 한다. (Node 는 process.env.TZ 대입 시 타임존
       * 캐시를 무효화하므로 워커에 주입되는 이 값이 Date/Intl 에 실제로 반영된다.)
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
