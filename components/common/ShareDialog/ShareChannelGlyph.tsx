import type { ShareChannelId } from './ShareDialog.types';

/**
 * 채널 글리프 — **단순한 글자꼴 도형**이다(브랜드 로고 원본이 아니다).
 * 색은 넣지 않는다: `currentColor` 를 채워 테마·다크모드를 그대로 따라가고,
 * 의미는 옆의 이름 텍스트가 말한다(글리프만으로 채널을 구분하게 두지 않는다).
 */
const GLYPH_PATH: Record<ShareChannelId, string> = {
  // X — 두 획이 교차하는 형태.
  x: 'M3 2h4.2l4 5.6L15.8 2H20l-6.4 8.4L20.4 20H16l-4.3-6-4.5 6H3l6.9-9.1z',
  // 페이스북 — 소문자 f.
  facebook: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8z',
  // 네이버 — 대문자 N.
  naver: 'M4 3h5.2l4.4 6.6V3H20v18h-5.2l-4.4-6.6V21H4z'
};

export type ShareChannelGlyphProps = {
  channel: ShareChannelId;
};

export default function ShareChannelGlyph({ channel }: ShareChannelGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={GLYPH_PATH[channel]} />
    </svg>
  );
}
