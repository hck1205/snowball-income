// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * ## 이 테스트가 막는 사고
 *
 * `CURATED_DIVIDEND_UNIVERSE` 는 프리셋 파일들을 **스프레드로 합친다**. 같은 티커 키가 두 파일에
 * 있으면 뒤에 오는 쪽만 살고 앞의 정의는 **영원히 죽은 값**이 된다. 그런데 파일만 봐서는 어느 쪽이
 * 사는 값인지 알 수 없다 — 배당률·주가를 갱신하러 온 사람이 죽은 쪽을 고치고 "왜 화면이 안 바뀌지"
 * 하게 되고, 두 정의의 숫자가 갈라져도 아무도 모른다(2026-07-31 이전 실제 상태: AVGO·TSM·ASML·
 * ETN·VRT 5종의 `expectedTotalReturn` 이 두 파일에서 서로 달랐다).
 *
 * 그래서 규칙은 **"한 티커의 정의는 레포에 하나"** 다. 두 프리셋이 같은 티커를 담는 것 자체는
 * 정상적인 구성이므로(반도체 ∩ AI 인프라), 금지하는 것은 "키 중복"이 아니라 **"정의 중복"** 이다 —
 * 한쪽이 다른 쪽의 객체를 그대로 참조하면(`AI_INFRA_ETFS_AND_STOCKS.AVGO`) 값이 하나뿐이라
 * "어느 쪽이 이기나"라는 질문 자체가 사라진다. 그것을 **참조 동일성(`===`)** 으로 검사한다.
 *
 * 파일 목록을 손으로 적지 않고 `import.meta.glob` 으로 훑는 이유: 새 프리셋 파일이 추가되면
 * 그 파일도 자동으로 검사 대상이 된다(허용 목록 유지보수 0).
 */
type PresetEntry = Record<string, unknown>;
type PresetFile = Record<string, PresetEntry>;

// ⚠ `import.meta.glob` 은 `@/` alias 를 해석하지 않는다(조용히 0개를 반환한다 — 아래 첫 케이스가
//    그 상태를 실패로 만든다). 상대 경로만 쓴다.
const modules = import.meta.glob<Record<string, unknown>>('../../shared/constants/presets/*.ts', { eager: true });

/** `index.ts`(배럴 + 합성 유니버스)는 프리셋 정의 파일이 아니다. */
const PRESET_FILES: [file: string, presets: PresetFile][] = Object.entries(modules)
  .filter(([path]) => !path.endsWith('/index.ts'))
  .map(([path, mod]) => {
    const exports = Object.values(mod).filter(
      (value): value is PresetFile => typeof value === 'object' && value !== null
    );
    expect(exports, `${path} 는 프리셋 객체를 정확히 하나 export 해야 한다`).toHaveLength(1);
    return [path.split('/').pop() as string, exports[0]];
  });

/** 티커 → 그 티커를 담은 파일들 */
const filesByTicker = new Map<string, string[]>();
for (const [file, presets] of PRESET_FILES) {
  for (const ticker of Object.keys(presets)) {
    filesByTicker.set(ticker, [...(filesByTicker.get(ticker) ?? []), file]);
  }
}

describe('프리셋 티커는 한 곳에서만 정의된다', () => {
  it('프리셋 파일을 실제로 수집했다 (글롭이 조용히 0개를 반환하면 이 스위트 전체가 무의미해진다)', () => {
    expect(PRESET_FILES.length).toBeGreaterThanOrEqual(10);
    expect(filesByTicker.size).toBe(Object.keys(CURATED_DIVIDEND_UNIVERSE).length);
  });

  it('두 파일에 같은 티커가 있으면 두 곳이 동일한 정의(같은 객체)를 가리킨다', () => {
    const redefined = [...filesByTicker.entries()]
      .filter(([, files]) => files.length > 1)
      .filter(([ticker, files]) => {
        const [first] = files;
        const definition = PRESET_FILES.find(([file]) => file === first)?.[1][ticker];
        return files.some((file) => PRESET_FILES.find(([name]) => name === file)?.[1][ticker] !== definition);
      })
      .map(([ticker, files]) => `${ticker} (${files.join(' ↔ ')})`);

    expect(
      redefined,
      '같은 티커를 두 파일에서 각각 정의하면 스프레드 순서상 뒤쪽만 살고 앞쪽은 죽은 값이 된다. ' +
        '한 파일에서만 정의하고 다른 파일은 그 정의를 참조하라 (예: `AVGO: AI_INFRA_ETFS_AND_STOCKS.AVGO`).'
    ).toEqual([]);
  });

  it('합쳐진 유니버스의 각 항목은 그 티커를 담은 모든 파일의 정의와 같은 객체다 (승자 없음)', () => {
    for (const [ticker, files] of filesByTicker) {
      for (const file of files) {
        expect(
          PRESET_FILES.find(([name]) => name === file)?.[1][ticker],
          `${ticker}: ${file} 의 정의가 유니버스에 반영되지 않았다 (다른 파일의 정의에 덮였다)`
        ).toBe((CURATED_DIVIDEND_UNIVERSE as Record<string, unknown>)[ticker]);
      }
    }
  });
});
