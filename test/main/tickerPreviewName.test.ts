// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트
import { describe, expect, it } from 'vitest';
import { toPreviewDisplayName } from '@/pages/Main/components/TickerModal/TickerModal.utils';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

/**
 * 티커 이름 칸의 **표시 규칙**을 잠근다.
 *
 * 🔴 이 규칙이 없으면 이름 칸이 조용히 공란이 된다. 원인은 저장 정책이다 — 프리셋에서 만든 티커는
 *    `name` 을 **일부러 비운다**(칩이 심볼로 보이게). 그 대가로 두 화면이 빈칸을 보였고 둘 다
 *    사용자 지적으로 발견됐다(2026-08-11):
 *      ① 프리셋을 눌렀을 때의 미리보기
 *      ② **수정 모드** — 이쪽은 화면이 아니라 저장된 값 자체가 빈 문자열이라, 선택된 프리셋이
 *         없어도(수정 모드는 항상 `'custom'`) **심볼로** 이름을 되찾아야 한다.
 * ⚠ 이 함수의 결과를 `name` 으로 **저장하면 안 된다** — 그러면 칩 표시가 다시 망가진다.
 *   그 계약은 여기서 검증할 수 없으므로(순수 함수라 저장 경로를 모른다) 주석으로 못 박아 둔다.
 */

const draft = (over: Partial<TickerDraft> & { ticker: string }): TickerDraft => ({
  name: '',
  initialPrice: 100,
  dividendYield: 5,
  dividendGrowth: 2,
  expectedTotalReturn: 7,
  frequency: 'monthly',
  ...over
});

/** 실제 상수의 모양만 흉내 낸 최소 맵 — 이 테스트는 규칙을 보고 데이터를 보지 않는다. */
const PRESET_TICKERS = {
  O: draft({ ticker: 'O', name: 'Realty Income' }),
  JEPQ: draft({ ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF' })
} as unknown as Record<PresetTickerKey, TickerDraft>;

const KOREAN_NAMES = { O: '리얼티 인컴' } as unknown as Record<PresetTickerKey, string>;

const nameOf = (tickerDraft: TickerDraft, selectedPreset: 'custom' | PresetTickerKey = 'custom') =>
  toPreviewDisplayName({
    tickerDraft,
    selectedPreset,
    presetTickers: PRESET_TICKERS,
    koreanNameByTicker: KOREAN_NAMES
  });

describe('toPreviewDisplayName — 이름 칸에 보여 줄 이름', () => {
  it('사용자가 적은 이름이 있으면 그것이 이긴다', () => {
    expect(nameOf(draft({ ticker: 'O', name: '내 월배당' }))).toBe('내 월배당');
  });

  it('공백만 적은 이름은 없는 것으로 본다', () => {
    expect(nameOf(draft({ ticker: 'O', name: '   ' }))).toBe('리얼티 인컴');
  });

  it('프리셋을 고르면 그 프리셋의 한글 이름을 보여 준다', () => {
    expect(nameOf(draft({ ticker: 'O' }), 'O' as PresetTickerKey)).toBe('리얼티 인컴');
  });

  it('🔴 수정 모드(선택된 프리셋 없음)에서도 심볼로 이름을 되찾는다 — 여기가 공란이던 자리다', () => {
    // 프리셋으로 만든 프로필은 저장된 name 이 빈 문자열이다. selectedPreset 은 항상 'custom'.
    expect(nameOf(draft({ ticker: 'O' }), 'custom')).toBe('리얼티 인컴');
  });

  it('심볼의 대소문자·공백이 달라도 찾는다', () => {
    expect(nameOf(draft({ ticker: ' o ' }))).toBe('리얼티 인컴');
  });

  it('한글 이름이 없는 프리셋은 영문 이름으로 떨어진다', () => {
    expect(nameOf(draft({ ticker: 'JEPQ' }))).toBe('JPMorgan Nasdaq Equity Premium Income ETF');
  });

  it('프리셋에 없는 심볼은 빈 문자열이다 — 없는 이름을 지어내지 않는다', () => {
    expect(nameOf(draft({ ticker: 'ZZZZ' }))).toBe('');
  });
});
