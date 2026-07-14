import { defineConfig } from 'vitest/config';

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
