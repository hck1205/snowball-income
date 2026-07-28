import type { ShareChannel, ShareChannelId } from './ShareDialog.types';

/**
 * 공유 창의 문구. 이 부품은 커뮤니티 전용이 아니므로(시뮬레이터·티커 화면도 쓸 수 있다)
 * 커뮤니티 카피 모듈에 기대지 않고 자기 문구를 자기가 갖는다.
 */
export const SHARE_DIALOG_COPY = {
  title: '공유하기',
  linkLabel: '공유 주소',
  copy: '링크 복사',
  copied: '복사했습니다',
  copyFailed: '복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.',
  channelsLabel: '다른 곳으로 보내기',
  close: '닫기',
  /**
   * 채널 버튼의 접근명. 조사는 **`에`** 를 쓴다 — `(으)로` 는 세 이름(X·페이스북·네이버)에서
   * 받침이 갈려 스크린리더가 괄호를 그대로 읽는다("엑스 열고 으로").
   */
  channelAria: (label: string) => `${label}에 공유하기`
} as const;

/**
 * 창구별 공유 주소 생성기.
 *
 * SDK 를 붙이지 않는다 — 전부 **주소 하나로 끝나는 공개 인텐트**만 쓴다(추가 스크립트 0,
 * 추적 픽셀 0, 로그인 상태와 무관). 카카오톡은 자바스크립트 SDK 와 앱 키가 있어야 해서
 * 여기 없다(링크 복사가 그 자리를 대신한다).
 */
export const SHARE_CHANNELS: readonly ShareChannel[] = [
  {
    id: 'x',
    label: 'X',
    buildUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    id: 'facebook',
    label: '페이스북',
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    id: 'naver',
    label: '네이버',
    buildUrl: (url, title) =>
      `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  }
];

/** 채널 id 로 정의를 찾는다. 모르는 id 면 `null`(호출부가 조용히 무시할 수 있게). */
export const findShareChannel = (id: ShareChannelId): ShareChannel | null =>
  SHARE_CHANNELS.find((channel) => channel.id === id) ?? null;

/** 채널 공유 주소. 모르는 채널이면 `null`. */
export const buildShareChannelUrl = (id: ShareChannelId, url: string, title: string): string | null =>
  findShareChannel(id)?.buildUrl(url, title) ?? null;

/**
 * **네이티브 공유 시트를 쓰는 게 맞는 기기인가.**
 *
 * `navigator.share` 존재 여부만 보면 안 된다 — 데스크톱 Chrome/Edge(Windows)도 이 API 를 갖고 있고,
 * 호출하면 OS 공유 창(윈도우 공유 플라이아웃)을 연다. 그 창은 브라우저가 그리는 것이 아니라서
 * 우리가 크기·위치를 손볼 수 없고, 실제로 잘려 보인다는 신고가 이 변경의 출발점이었다.
 * 그래서 **터치가 주 입력인 기기**(호버가 없고 포인터가 굵은 기기)에서만 OS 시트에 위임하고,
 * 마우스가 있는 화면에서는 우리가 그린 공유 창(링크 복사 + 채널)을 쓴다.
 *
 * `matchMedia` 가 없는 환경(SSR·아주 오래된 브라우저)은 **거짓**으로 본다 — 확신이 없으면
 * 우리가 통제할 수 있는 경로로 내려가는 쪽이 안전하다.
 */
export const isNativeShareIdiomatic = (): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

  try {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch {
    return false;
  }
};
