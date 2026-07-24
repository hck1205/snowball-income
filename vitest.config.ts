import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    /*
     * `.claude/worktrees/*` 는 다른 세션이 만든 **git worktree**(레포 안에 체크아웃된 별도 브랜치)다.
     * 자기 `node_modules` 를 갖고 있어 그 안의 테스트를 여기서 돌리면 React 인스턴스가 둘이 되어
     * 전부 실패한다 — 우리 코드와 무관한 노이즈라 검증 게이트가 의미를 잃는다. 워크트리는 남기고
     * 테스트 수집에서만 제외한다.
     */
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
    // 테스트는 개발자의 로컬 .env 에 좌우되면 안 된다.
    // Vite 가 .env 를 읽어오므로, 커뮤니티 변수는 명시적으로 비워서 "백엔드 없는 기본 배포"
    // 상태를 고정한다. 커뮤니티가 켜진 경로는 readCommunityEnv 에 값을 주입해 테스트한다.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: ''
    }
  }
});
