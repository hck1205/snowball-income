/**
 * 텔레그램 보내기 — 스크립트 공용(2026-11-25 정리).
 *
 * 예전엔 GA 리포트(TS) · 시장 기사 발행 알림(워크플로 bash) 두 곳에 따로 있었고, bash 쪽에서 실제 버그가 났다
 * (상대 경로 require 로 죽어 발행 흐름이 끊겼다 — #392). 보내는 코드는 이것 하나로 두고, 워크플로는 부르기만 한다.
 * ⚠ `notify-refresh-failure.yml` 은 예외로 curl 을 직접 쓴다 — 코드를 내려받지 않아야 깨질 곳이 적은 워크플로다.
 *
 * 비밀값은 환경변수 TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID(워크플로가 저장소 비밀값 이름을 여기로 옮긴다).
 */

export type TelegramTarget = { readonly botToken: string; readonly chatId: string };

/** 환경변수에서 보낼 곳을 읽는다. 하나라도 없으면 null — 부르는 쪽이 "건너뜀"으로 다룬다. */
export const telegramTargetFromEnv = (env: Record<string, string | undefined>): TelegramTarget | null => {
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  return botToken && chatId ? { botToken, chatId } : null;
};

export type TelegramOptions = {
  /** 'HTML' 이면 <b> 같은 태그를 쓴다 — 바깥 값은 반드시 이스케이프해서 넣는다. 없으면 일반 텍스트. */
  readonly parseMode?: 'HTML';
};

/** 한 통 보낸다. 실패하면 던진다(메시지에 토큰 · 본문을 넣지 않는다 — 로그가 공개다). */
export const sendTelegram = async (
  target: TelegramTarget,
  text: string,
  { parseMode }: TelegramOptions = {},
  fetchImpl: typeof fetch = fetch
): Promise<void> => {
  const response = await fetchImpl(`https://api.telegram.org/bot${target.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: target.chatId, text, disable_web_page_preview: true, ...(parseMode ? { parse_mode: parseMode } : {}) })
  });
  if (!response.ok) throw new Error(`텔레그램 전송 실패 (HTTP ${response.status}) — 봇 토큰 · 채팅 ID, 봇에게 먼저 말을 걸었는지 확인`);
};
