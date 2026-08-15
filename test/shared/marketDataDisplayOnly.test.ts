// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFxRate } from '@/shared/lib/fx';
import { parseMarketIndicesSnapshot } from '@/shared/lib/marketIndices';

/**
 * 🔴 **표시 전용 경계** — 환율·주요 지수 값은 시뮬레이션 입력·저장 payload·공유 URL 어디에도
 * 들어가지 않는다(`shared/lib/fx`·`shared/lib/marketIndices` 의 계약 주석이 정본이다).
 *
 * 왜 테스트로 못 박나: 이 경계는 "지금 안 쓰니까 괜찮다"로 지켜지고 있어 **한 줄이면 샌다**.
 * 새는 순간 사용자 자산(저장 슬롯·공유 링크)에 시세가 굳어, 나중에 열면 과거 환율이 오늘 값처럼
 * 되살아난다(하위 호환·날조 금지 원칙 동시 위반). grep 은 사람이 기억해야 하지만 이 테스트는
 * 매 실행 자동이다.
 *
 * ⚠ **주석은 검사 대상에서 뺀다.** 이 경계를 *설명*하는 주석("환율은 저장하지 않는다")이
 * 영속 계층 곳곳에 있어서, 원문을 통째로 훑으면 설명 문장에 걸려 거짓 실패한다.
 */

/**
 * 폴더 안의 소스 파일을 **하위 폴더까지** 모은다.
 *
 * `readdirSync` 는 기본이 비재귀라, 영속 계층이 자라 `…/persistence/sub/x.ts` 가 생기는 순간 그 파일이
 * 조용히 검사 밖에 남는다 — 가드는 초록인데 커버리지만 줄어드는, 가장 나쁜 실패 방식이다.
 * 윈도우는 `\` 로 돌려주므로 `/` 로 정규화해 경로 조립·누출 메시지를 플랫폼과 무관하게 만든다.
 */
const sourceFilesIn = (directory: string): string[] =>
  readdirSync(directory, { encoding: 'utf8', recursive: true })
    .map((name) => name.replace(/\\/g, '/'))
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => `${directory}/${name}`);

/** 영속·공유 계층 — 사용자 자산이 만들어지는 곳 전부. */
const PERSISTENCE_SOURCES = [
  ...sourceFilesIn('jotai/snowball/persistence'),
  ...sourceFilesIn('jotai/snowball/cloud'),
  ...sourceFilesIn('pages/Main/hooks/persistence')
];

/**
 * 시세가 새면 반드시 등장하는 식별자들. 표시 통화 **모드**(`displayCurrency: 'KRW'|'USD'`)는
 * 시세가 아니라 UI 취향이라 저장 대상이고, 그래서 여기 없다 — 금지 대상은 **숫자 값**과
 * 그 값을 나르는 모듈이다.
 */
const FORBIDDEN = [
  'previousClose',
  'marketIndices',
  'MarketIndex',
  'computeFxChange',
  'computeIndexChange',
  'fxViewAtom',
  'FxRate',
  '/api/fx',
  '/api/market-indices'
];

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('표시 전용 경계 — 환율·지수는 저장/공유되지 않는다', () => {
  it('영속·공유 계층 소스 어디에도 시세 식별자가 없다', () => {
    expect(PERSISTENCE_SOURCES.length).toBeGreaterThan(10);

    const leaks: string[] = [];
    for (const path of PERSISTENCE_SOURCES) {
      const source = stripComments(readFileSync(path, 'utf8'));
      for (const token of FORBIDDEN) {
        if (source.includes(token)) leaks.push(`${path} → ${token}`);
      }
    }

    expect(leaks).toEqual([]);
  });

  it('계산 엔진(shared/lib/snowball)도 시세 모듈을 import 하지 않는다', () => {
    const engineFiles = sourceFilesIn('shared/lib/snowball');
    expect(engineFiles.length).toBeGreaterThan(0);

    for (const file of engineFiles) {
      const source = stripComments(readFileSync(file, 'utf8'));
      expect(source, `${file} 이 shared/lib/fx 를 끌어온다`).not.toContain('shared/lib/fx');
      expect(source, `${file} 이 shared/lib/marketIndices 를 끌어온다`).not.toContain('shared/lib/marketIndices');
    }
  });

  /**
   * 위 두 가드는 정적이라 "이름을 바꿔 우회"에 약하다. 그래서 값 자체가 계산 계층으로 흘러갈 수 있는
   * 유일한 통로인 **파서 출력**이 무엇을 담는지도 못 박는다 — 시세 파서는 계약에 없는 키를 만들지 않고,
   * 통과한 값은 오직 표시용 필드뿐이다(신뢰 못 할 응답의 임의 키가 payload 로 새지 않는다).
   */
  it('시세 파서는 계약에 있는 키만 통과시킨다 (임의 필드가 payload 로 새지 않는다)', () => {
    const fx = parseFxRate({
      rate: 1469.98,
      asOf: '2026-07-27T00:00:00.000Z',
      previousClose: 1474.04,
      // upstream 이 덧붙일 수 있는 잡동사니 — 계약 밖이므로 통과하면 안 된다.
      portfolio: [{ ticker: 'SCHD', shares: 10 }],
      __proto__hack: 'x'
    });
    expect(Object.keys(fx ?? {}).sort()).toEqual(['asOf', 'base', 'previousClose', 'quote', 'rate']);

    const snapshot = parseMarketIndicesSnapshot({
      asOf: '2026-07-27T09:00:00.000Z',
      requested: ['^GSPC'],
      indices: [{ symbol: '^GSPC', price: 7419.65, previousClose: 7408.3, currency: 'USD', shares: 999 }],
      scenario: { tabs: [] }
    });
    expect(Object.keys(snapshot ?? {}).sort()).toEqual(['asOf', 'indices', 'requested']);
    expect(Object.keys(snapshot?.indices[0] ?? {}).sort()).toEqual([
      'currency',
      'previousClose',
      'price',
      'symbol'
    ]);
  });
});
