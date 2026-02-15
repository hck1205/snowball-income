import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname
    }
  },
  server: {
    open: true, // dev 서버 실행 시 자동으로 브라우저 오픈
  },
});
