// @vitest-environment node — DOM 없는 순수 테스트는 node 에서 돈다 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';

/**
 * 환경 분리 자체의 회귀 방지판.
 *
 * node 환경으로 내린 테스트가 **jsdom 과 같은 조건**에서 도는지 못 박는다. 특히 TZ 고정이
 * 빠지면 배당 지급일·'오늘' 판정이 UTC 로 하루 어긋나는데, 그 회귀는 순수 계산 테스트에서
 * 조용히 먼저 터진다 — 여기서 먼저 잡는다.
 */
describe('테스트 환경 분리', () => {
  it('node 환경이라 window 가 없다', () => {
    expect(typeof window).toBe('undefined');
  });

  it('TZ 고정이 node 환경에도 적용된다', () => {
    expect(process.env.TZ).toBe('Asia/Seoul');
    expect(new Date('2026-01-01T00:00:00Z').getHours()).toBe(9);
  });

  it('VITE_SUPABASE_* 는 비어 있다', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe('');
  });
});
