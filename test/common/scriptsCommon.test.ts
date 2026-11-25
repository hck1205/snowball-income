import { describe, expect, it, vi } from 'vitest';
import {
  escapeHtmlAttribute,
  escapeHtmlText,
  isKstMonday,
  kstIsoDate,
  kstToday,
  sendTelegram,
  telegramTargetFromEnv
} from '@/scripts/common';

/**
 * 스크립트 공용 모듈(2026-11-25 정리 — aiReporter · gaReport 에 흩어져 있던 것을 모았다). 잠그는 것:
 * ① 한국시간 날짜는 PC 시간대와 무관하다(러너는 UTC) ② 텔레그램 비밀값이 하나라도 없으면 "보낼 곳 없음"
 * ③ 이스케이프 두 종류의 차이(따옴표).
 */
describe('한국시간 날짜', () => {
  it('UTC 15:00 = 한국 다음 날 00:00', () => {
    const utc = new Date('2026-11-24T15:00:00Z');
    expect(kstIsoDate(utc)).toBe('2026-11-25');
    expect(kstToday(utc).getDate()).toBe(25);
    expect(kstIsoDate(new Date('2026-11-24T14:59:00Z'))).toBe('2026-11-24');
  });

  it('월요일 판정도 한국시간', () => {
    expect(isKstMonday(new Date('2026-11-15T15:00:00Z'))).toBe(true);
    expect(isKstMonday(new Date('2026-11-15T14:59:00Z'))).toBe(false);
  });
});

describe('텔레그램', () => {
  it('비밀값이 둘 다 있어야 보낼 곳이 생긴다(공백은 없는 것)', () => {
    expect(telegramTargetFromEnv({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' })).toEqual({ botToken: 't', chatId: '1' });
    expect(telegramTargetFromEnv({ TELEGRAM_BOT_TOKEN: 't' })).toBeNull();
    expect(telegramTargetFromEnv({ TELEGRAM_BOT_TOKEN: ' ', TELEGRAM_CHAT_ID: '1' })).toBeNull();
  });

  it('HTML 모드는 요청했을 때만, 실패는 던지되 토큰을 메시지에 넣지 않는다', async () => {
    const ok = vi.fn(async () => new Response('{}', { status: 200 }));
    await sendTelegram({ botToken: 'SECRET', chatId: '1' }, '안녕', { parseMode: 'HTML' }, ok as unknown as typeof fetch);
    const body = JSON.parse((ok.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ chat_id: '1', text: '안녕', parse_mode: 'HTML' });

    const plain = vi.fn(async () => new Response('{}', { status: 200 }));
    await sendTelegram({ botToken: 'SECRET', chatId: '1' }, '안녕', {}, plain as unknown as typeof fetch);
    expect(JSON.parse((plain.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).not.toHaveProperty('parse_mode');

    const fail = vi.fn(async () => new Response('', { status: 401 }));
    await expect(sendTelegram({ botToken: 'SECRET', chatId: '1' }, 'x', {}, fail as unknown as typeof fetch)).rejects.toThrow(/HTTP 401/);
    await expect(sendTelegram({ botToken: 'SECRET', chatId: '1' }, 'x', {}, fail as unknown as typeof fetch)).rejects.not.toThrow(/SECRET/);
  });
});

describe('HTML 이스케이프', () => {
  it('본문용은 따옴표를 두고, 속성용은 따옴표까지', () => {
    expect(escapeHtmlText('a&<b>"')).toBe('a&amp;&lt;b&gt;"');
    expect(escapeHtmlAttribute('a&<b>"')).toBe('a&amp;&lt;b&gt;&quot;');
  });
});
