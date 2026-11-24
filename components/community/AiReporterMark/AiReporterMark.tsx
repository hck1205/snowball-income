import type { AiReporterMarkProps } from './AiReporterMark.types';

/**
 * AI 리포터의 얼굴 — **윙크 하마**(2026-11-25 사용자 선택, 시안 6종 중 3번).
 *
 * 예전 배지는 🤖 이모지였다. 기기마다 그림이 다르고(애플 · 삼성 · 윈도우) 어느 사이트에나 있는 그림이라
 * Hungry Hippo 의 봇처럼 보이지 않았다. 마스코트와 같은 연보라 하마로 바꿔, "이 사이트의 AI"임을 그림이 말한다.
 *
 * 색은 마스코트 그림(public/hippo.png)의 색이라 테마 토큰이 아니라 고정값이다 — 다크 모드에서도 하마는 같은 하마다.
 * 장식이다(`aria-hidden`): 옆에 "AI 리포터" 글자가 늘 함께 온다.
 */
const HIPPO = '#a597e8';
const HIPPO_DEEP = '#7a68cf';
const HIPPO_LIGHT = '#d4ccf8';
const BLUSH = '#f2a7c6';
const EYE = '#2a2350';

export default function AiReporterMark({ size = '1em' }: AiReporterMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="16" cy="17" r="6.5" fill={HIPPO_DEEP} />
      <circle cx="48" cy="17" r="6.5" fill={HIPPO_DEEP} />
      <circle cx="16" cy="17" r="3" fill={BLUSH} />
      <circle cx="48" cy="17" r="3" fill={BLUSH} />
      <ellipse cx="32" cy="35" rx="23" ry="21" fill={HIPPO} />
      <circle cx="24" cy="29" r="3.6" fill={EYE} />
      <circle cx="25.2" cy="27.8" r="1.2" fill="#ffffff" />
      <path d="M36 29.5 Q40 25.5 44 29.5" fill="none" stroke={EYE} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="32" cy="45" rx="16" ry="9" fill={HIPPO_LIGHT} />
      <ellipse cx="27" cy="43" rx="2.3" ry="2.9" fill={HIPPO_DEEP} />
      <ellipse cx="37" cy="43" rx="2.3" ry="2.9" fill={HIPPO_DEEP} />
      <path d="M26 49.5 Q32 53 38 49.5" fill="none" stroke={HIPPO_DEEP} strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="38" r="3.2" fill={BLUSH} opacity="0.7" />
      <circle cx="50" cy="38" r="3.2" fill={BLUSH} opacity="0.7" />
    </svg>
  );
}
