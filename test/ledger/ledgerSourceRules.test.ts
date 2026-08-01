// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `/ledger` **소스 규율** — 렌더로는 잡히지 않는 계약을 소스에서 잠근다.
 *
 * ⚠ 스캔 전에 **주석을 먼저 제거**한다. 이 레포는 설계 메모에 금지어를 그대로 적어 두기 때문에
 * (예: "🔴 `dataPositive` 를 쓰지 마라") 주석을 남긴 채 스캔하면 자기 주석에 걸려 무음으로 틀린다.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const LEDGER_ROOT = resolve(REPO_ROOT, 'pages/Ledger');

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

/** 블록·줄 주석 제거. `https://` 의 `//` 는 URL 이라 남긴다(`copyTone.test.ts` 와 같은 처방). */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

type LedgerFile = { path: string; source: string; raw: string };

const FILES: LedgerFile[] = collect(LEDGER_ROOT).map((full) => {
  const raw = readFileSync(full, 'utf-8');
  return { path: relative(REPO_ROOT, full).split(sep).join('/'), source: stripComments(raw), raw };
});

const hits = (pattern: RegExp): string[] =>
  FILES.flatMap(({ path, source }) => [...source.matchAll(pattern)].map((match) => `${path} :: ${match[0]}`));

describe('/ledger 소스 스캔 — 대상이 실제로 잡히는가', () => {
  it('스캔 대상이 비어 있지 않고 핵심 파일이 들어 있다 (경로가 바뀌면 무음 통과하지 않게)', () => {
    expect(FILES.length).toBeGreaterThan(30);
    for (const anchor of [
      'pages/Ledger/copy/ledgerCopy.ts',
      'pages/Ledger/LedgerPage/LedgerPage.view.tsx',
      'pages/Ledger/LedgerPage/LedgerPage.styled.ts',
      'pages/Ledger/components/LedgerTable/LedgerTable.tsx'
    ]) {
      expect(FILES.map((file) => file.path)).toContain(anchor);
    }
  });

  it('주석 제거가 실제로 동작한다 (자기 주석에 걸려 무음으로 틀리지 않게)', () => {
    // 이 파일들은 주석에 금지어를 그대로 적어 둔다 — 원문에는 있고 스캔본에는 없어야 한다.
    const styled = FILES.find((file) => file.path === 'pages/Ledger/LedgerPage/LedgerPage.styled.ts');
    expect(styled?.raw).toContain('dataPositive');
    expect(styled?.source).not.toContain('dataPositive');
  });
});

describe('/ledger 색 규율(§3.4)', () => {
  it('🔴 손익색을 쓰지 않는다 — 수입·지출은 P&L 이 아니다', () => {
    expect(hits(/dataPositive|dataNegative/g)).toEqual([]);
  });

  it('🔴 하드코딩 hex 가 0개다 (토큰만 쓴다)', () => {
    expect(hits(/#[0-9a-fA-F]{3,8}\b/g)).toEqual([]);
  });

  it('🔴 주역(raised) 카드는 정확히 1개다', () => {
    expect(hits(/cardElevation\('raised'\)/g).length).toBe(1);
  });
});

describe('/ledger 카피 규율', () => {
  it('🔴 "일부 실패" 류 뭉뚱그린 문구가 없다 — 언제나 건별 숫자로 말한다', () => {
    expect(hits(/일부 (?:실패|성공|저장|항목|건)/g)).toEqual([]);
  });

  it('🚫 "눈덩이/스노우볼" 비유가 없다', () => {
    expect(hits(/눈덩이|스노우볼/g)).toEqual([]);
  });

  it('🚫 토스트를 쓰지 않는다 (실패는 화면에 잔류한다)', () => {
    expect(hits(/\btoast\b/gi)).toEqual([]);
  });
});

describe('/ledger 숫자 포맷 규율(§7)', () => {
  it('🔴 억/만 축약 포맷터와 달러 포맷터를 쓰지 않는다 — 원 단위 정확값이 정보다', () => {
    expect(hits(/formatApproxKRW|formatSummaryKRW|formatUSD/g)).toEqual([]);
  });
});

describe('/ledger 스타일 규약', () => {
  it('🔴 [red] `:has()` 를 쓰지 않는다 — jsdom(nwsapi)이 파싱하지 못해 테스트가 깨진다', () => {
    /*
     * 🔴 현재 실패한다(`pages/Ledger/components/LedgerFormModal/LedgerFormModal.styled.ts:169,176`).
     * 이 규약은 이 레포가 이미 못박아 둔 것이다 — `components/common/Toggle/Toggle.styled.ts:134`
     * 의 주석이 정본. 스타일시트에 `:has()` 규칙이 하나라도 들어가면, React `useId` 가 만든
     * **콜론 id**(`:r4:`)를 가진 요소에서 nwsapi 가 잘못된 셀렉터를 만들어 SyntaxError 를 던지고,
     * 그 순간 **접근명 계산·role 질의가 전부 죽는다**(모달 안 role 질의 불가 = 회귀 감지 0).
     */
    expect(hits(/:has\(/g)).toEqual([]);
  });
});
