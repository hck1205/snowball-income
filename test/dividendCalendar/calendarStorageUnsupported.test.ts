/**
 * IndexedDB 가 **없는** 환경(jsdom, SSR, 일부 프라이빗 모드)에서의 동작을 고정한다.
 * 이 파일은 일부러 `fake-indexeddb` 를 import 하지 않는다 — import 하면 검증 대상이 사라진다.
 * (vitest 는 파일마다 환경을 격리하므로 같은 폴더의 다른 테스트가 심은 전역이 넘어오지 않는다.)
 */
import { describe, expect, it } from 'vitest';
import { readCalendarSelection, writeCalendarSelection } from '@/pages/DividendCalendar/utils';

describe('calendarStorage — IndexedDB 미지원 환경', () => {
  it('전제: 이 환경에는 indexedDB 가 없다', () => {
    expect(typeof indexedDB).toBe('undefined');
  });

  it('읽기는 던지지 않고 null 을 준다', async () => {
    await expect(readCalendarSelection()).resolves.toBeNull();
  });

  it('쓰기는 조용한 no-op 이다 — 저장 실패가 기능 실패가 되면 안 된다', async () => {
    await expect(writeCalendarSelection(['SCHD', 'O'])).resolves.toBeUndefined();
  });
});
