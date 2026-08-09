import type { PulseAxis } from './marketPulse.types';

/**
 * 축 이름과 출처 표기 — **화면과 서버가 같은 문자열을 본다.**
 *
 * 출처를 상수로 두는 이유: 이 화면의 숫자는 전부 남의 것이다. 어디서 왔는지가 값 자체만큼
 * 중요하고, 카드마다 손으로 적으면 한 곳만 고쳐지고 나머지가 낡는다.
 */

export const PULSE_AXIS_LABEL: Record<PulseAxis, string> = {
  valuation: '밸류에이션',
  sentiment: '심리',
  volatility: '변동성',
  breadth: '시장 폭',
  credit: '신용',
  macro: '거시'
};

export const PULSE_SOURCE = {
  fred: 'FRED (세인트루이스 연은)',
  cboe: 'Cboe',
  cnn: 'CNN Business'
} as const;
