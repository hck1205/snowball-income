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
  /**
   * 🔴 **금액에는 손익색을 쓰지 않는다.**
   *
   * ⚠ 2026-08-09 사용자 결정으로 **구분 칸 하나만** 예외다 — 지출이 빨강, 수입이 파랑이다
   *   (통장 표기의 관습). 규칙의 핵심은 "색 하나에 기대지 않는다" 였고, 그 칸은 아이콘과
   *   글자를 그대로 둔 채 색을 **덧붙였을 뿐**이라 색을 못 보는 사람에게도 정보가 남는다.
   *
   * 🔴 예외를 그 한 파일로 못 박는 이유: 금액(`AmountText`)까지 물들면 화면이 손익표처럼 읽힌다.
   *    월세를 냈다고 손해를 본 것이 아니다. 다른 파일에 번지면 이 검사가 먼저 빨개진다.
   */
  const KIND_COLOR_EXCEPTION = 'pages/Ledger/components/LedgerTable/LedgerTable.styled.ts';

  it('🔴 손익색은 구분 칸 한 곳에만 있다 — 금액·나머지 표면은 중립색이다', () => {
    const offenders = hits(/dataPositive|dataNegative/g).filter((hit) => !hit.startsWith(KIND_COLOR_EXCEPTION));
    expect(offenders).toEqual([]);
  });

  it('⭐ 그 예외가 실제로 살아 있다 — 가드만 남고 색이 사라지면 사용자 결정이 조용히 되돌려진다', () => {
    const table = FILES.find((file) => file.path === KIND_COLOR_EXCEPTION);
    expect(table?.source).toContain('dataPositive');
  });

  /**
   * B-4 AC4-8 — 배당 카드에도 같은 규율이 적용된다. 토큰 이름(`dataPositive`)뿐 아니라 **DOM 에
   * 찍히는 어트리뷰트 형태**(`data-positive`)와 값 방향 prop(`tone="positive"`)까지 막는다.
   * 위 검사만으로는 `<StatTile tone="positive">` 같은 우회가 통과한다 — 그러면 배당만 색을 갖고
   * "이건 이익"이라는 없는 의미가 생긴다.
   */
  it('🔴 손익 방향을 어트리뷰트·prop 으로도 넣지 않는다 (배당 카드 포함)', () => {
    expect(hits(/data-positive|data-negative|tone=["']positive["']|tone=["']negative["']/g)).toEqual([]);
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

/**
 * B-1 AC1-7 — **탭 제목은 준PII 다.** 화면에 그리는 것 말고는 어디에도 남기지 않는다.
 * (저장 페이로드에 실제로 무엇이 들어가는지는 `test/ledger/ledgerTabSwitch.test.tsx` 가 왕복으로 본다.
 *  여기서는 "그런 경로를 만들 수 있는 코드가 아예 없다"를 소스에서 잠근다.)
 */
describe('/ledger 준PII 규율 — 탭 제목·시트 정보', () => {
  /**
   * 🔴 **가계부 데이터의 저장 창구는 데이터 계층 하나다.** 화면 계층이 스토리지를 직접 만지면
   * 금액·분류·시트 정보가 로컬에 남는 경로가 열린다.
   *
   * ⚠ 선언된 예외 **1건**. 둘 다 "저장하는 값의 형태"를 아래에서 함께 잠근다 — 예외를 열되 넓히지 않는다.
   *  1) B-4 배당 겹쳐 보기 토글(`ledgerDividend.ts`) — 값이 `'on' | 'off'` 닫힌 열거형뿐이다.
   *
   * 데이터 계층(`shared/lib/googleSheets`)은 시트 **연결 정보**를 소유하는 곳이라 화면 취향 토글이 그쪽에 갈 자리가 아니다.
   */
  const DIVIDEND_OVERLAY_STORAGE = 'pages/Ledger/utils/ledgerDividend.ts';

  it('🔴 화면 계층에서 localStorage 를 만지는 파일은 선언된 예외 1개뿐이다', () => {
    const files = [...new Set(hits(/localStorage|sessionStorage/g).map((hit) => hit.split(' :: ')[0]))].sort();
    expect(files).toEqual([DIVIDEND_OVERLAY_STORAGE]);
  });

  it('🔴 배당 토글이 저장하는 값은 닫힌 열거형뿐이다 (가계부 값이 들어갈 자리가 없다)', () => {
    const file = FILES.find((entry) => entry.path === DIVIDEND_OVERLAY_STORAGE);
    const setItems = [...(file?.source ?? '').matchAll(/setItem\(([^)]*)\)/g)].map((match) => match[1].trim());
    // 호출부가 사라지면(=이름이 바뀌면) 이 가드는 아무것도 안 보게 된다 — 정확히 1건이어야 한다.
    expect(setItems).toEqual(["LEDGER_DIVIDEND_OVERLAY_KEY, isOn ? 'on' : 'off'"]);
  });

  it('🔴 GA 이벤트를 보내지 않는다 — 시트·탭 이름이 파라미터로 새는 유일한 경로다', () => {
    expect(hits(/trackEvent|ANALYTICS_EVENT|gtag\(/g)).toEqual([]);
  });

  it('🔴 로컬 저장 호출(saveSheetLink)의 인자에 탭 제목(sheetTitle)이 없다', () => {
    const calls = FILES.flatMap(({ path, source }) =>
      [...source.matchAll(/saveSheetLink\(\{[\s\S]*?\}\)/g)].map((match) => ({ path, text: match[0] }))
    );
    // 호출부가 사라지면(=이름이 바뀌면) 이 가드는 아무것도 안 보게 된다 — 최소 1건은 잡혀야 한다.
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter((call) => call.text.includes('sheetTitle')).map((call) => call.path)).toEqual([]);
  });
});

describe('/ledger 숫자 포맷 규율(§7)', () => {
  it('🔴 억/만 축약 포맷터를 쓰지 않는다 — 원 단위 정확값이 정보다', () => {
    expect(hits(/formatApproxKRW|formatSummaryKRW|formatApproxUSD/g)).toEqual([]);
  });

  /**
   * ⚠ 선언된 예외 **1건**: B-4 의 환율 미가용 폴백(`ledgerDividend.ts`).
   *
   * 이 규율의 대상은 **가계부 금액**이고 그것은 여전히 원 단위 정확값뿐이다. 배당은 포트폴리오
   * 도메인의 값이라 원천이 USD 이고, 환율을 못 받았을 때 그 값을 **원화인 척 그리지 않으려면**
   * 달러로 적어야 한다(날조 금지). 자체 달러 포맷터를 새로 만드는 대신 앱의 정본 포맷터를 쓴다 —
   * 소액이 `$0` 으로 뭉개지지 않는 규칙이 거기 이미 들어 있다.
   */
  it('🔴 달러 포맷터를 쓰는 파일은 배당 환율 폴백 하나뿐이다', () => {
    const files = [...new Set(hits(/formatUSD/g).map((hit) => hit.split(' :: ')[0]))];
    expect(files).toEqual(['pages/Ledger/utils/ledgerDividend.ts']);
  });
});

/**
 * B-1 — **탭 전환을 막는 판단은 화면에 하나뿐이다.**
 *
 * 지금 소비처는 탭 피커 하나다. 판단을 두 벌로
 * 만들면 한쪽만 고쳐지는 순간 다른 쪽이 우회로가 되고, 저장 실패 대기열의 재시도가 다른 탭에 행을
 * **추가**한다(추가에는 행 참조가 없어 `guardRowRef` 가 못 막는다 · 2026-08-02 리뷰).
 *
 * ⚠ `switchTab` 을 부르는 새 호출부가 생기면 **반드시 이 값을 받게 하라** — 값이 갈라진
 * 두 번째 판단은 렌더 테스트로는 잡히지 않는다(2026-08-02 에 제거된 블렌딩이 그 우회로였다).
 */
describe('/ledger 탭 전환 차단 — 단일 출처', () => {
  const CONTAINER = 'pages/Ledger/LedgerPage/LedgerPage.tsx';

  it('🔴 컨테이너의 판단 호출은 정확히 1건이다', () => {
    const file = FILES.find((entry) => entry.path === CONTAINER);
    expect(file).toBeDefined();
    expect([...(file?.source ?? '').matchAll(/tabSwitchBlockedReason\(/g)]).toHaveLength(1);
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
