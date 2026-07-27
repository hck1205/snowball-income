import {
  normalizePortfolioQuantity,
  normalizePortfolioTaxRatePercent,
  normalizePortfolioTicker
} from '@/shared/lib/portfolio';
import type { PortfolioHolding, PortfolioManualMarketInput } from '@/shared/lib/portfolio';

/**
 * 내 포트폴리오(`/dividend/portfolio`)의 보유 목록 로컬 저장 (IndexedDB).
 *
 * ## 전용 DB 를 새로 연다
 * 시뮬레이터 자동저장(`snowball-income-db`)이나 배당 캘린더(`snowball-dividend-calendar`)에
 * 스토어를 얹으려면 그 DB 의 **버전을 올려야** 하고, 그건 이미 저장된 사용자 데이터 전체를
 * 마이그레이션 리스크에 태우는 일이다. 그래서 이 파일은 완전히 분리된 DB 하나만 만지며,
 * 시뮬레이터의 영속 payload·공유 URL(`?share=`·`?s=`)·클라우드 스키마와 **한 바이트도 겹치지 않는다**.
 *
 * ## 캘린더 저장 모듈과 **다른 계약** — 실패를 삼키지 않는다
 * `calendarStorage` 는 읽기 실패를 `null`, 쓰기 실패를 조용한 no-op 으로 접는다(지워져도 되는
 * 선택값이라서). 여기 데이터는 **사용자가 직접 친 보유 수량**이라 같은 취급을 할 수 없다.
 * - 읽기: `{ ok:false, reason }` 로 실패를 **구분해** 돌려준다 — 화면이 "빈 목록"과 "못 읽음"을
 *   다르게 그려야 하기 때문이다. `{ ok:true, value:null }` 은 **저장 이력 없음**(정상)이다.
 * - 쓰기: reject 를 **그대로 전파**한다 — 훅이 받아 저장 실패를 화면에 띄운다(무음 실패 금지).
 * IndexedDB 가 없는 환경(SSR·jsdom 기본·일부 프라이빗 모드)도 같은 경로로 표면화된다.
 *
 * ## 통화 중립 — 값을 저장하지 않는다
 * 레코드에는 티커·수량·세율만 있다. 가격·환율·계산 결과를 저장하면 시세 스냅샷이 갱신된 뒤에도
 * 낡은 숫자가 되살아난다. 유일한 예외가 유니버스 밖 종목의 `manual`(USD 주가·배당률)인데,
 * 이건 앱이 다시 알아낼 방법이 없는 **사용자 입력**이라 저장한다.
 */

const PORTFOLIO_DB_NAME = 'snowball-portfolio';
const PORTFOLIO_DB_VERSION = 1;
const PORTFOLIO_STORE_NAME = 'holdings';
/** 스토어의 레코드는 항상 이 키 하나뿐이다(보유 목록은 한 벌). */
const PORTFOLIO_RECORD_KEY = 'holdings';

/** 스키마 버전. **모르는 버전은 읽지 않고 버린다**(고쳐 쓰려다 값을 지어내는 것보다 낫다). */
export const PORTFOLIO_RECORD_VERSION = 1;

export type PortfolioPersistedRecord = {
  v: typeof PORTFOLIO_RECORD_VERSION;
  /** 수량 `0` 은 에러가 아니라 **미입력**이다(행은 유지되고 합계에서만 빠진다 — M0 정규화 계약). */
  holdings: PortfolioHolding[];
  /** 배당소득세(%). 0..100 으로 clamp 된 값. */
  taxPercent: number;
  updatedAt: number;
};

/**
 * 저장소 실패 사유. GA 파라미터로 그대로 나가므로 **닫힌 집합**으로 유지한다(카디널리티 폭발 방지).
 * - `unavailable`: 이 환경에 IndexedDB 자체가 없다.
 * - `blocked`: 다른 탭이 DB 를 잡고 있어 열지 못했다.
 * - `read-failed` / `write-failed`: 열기는 됐지만 트랜잭션이 실패했다(용량 초과·프라이빗 모드 등).
 */
export type PortfolioStorageFailureReason = 'unavailable' | 'blocked' | 'read-failed' | 'write-failed';

const STORAGE_FAILURE_REASONS: readonly string[] = ['unavailable', 'blocked', 'read-failed', 'write-failed'];

/** 사유를 실은 Error. 클래스 상속 대신 속성만 얹는다(트랜스파일 타깃과 무관하게 안전). */
export type PortfolioStorageError = Error & { reason: PortfolioStorageFailureReason };

const storageError = (reason: PortfolioStorageFailureReason, message: string): PortfolioStorageError =>
  Object.assign(new Error(message), { reason });

/** 알 수 없는 실패는 호출자가 정한 `fallback` 으로 떨어진다 — 사유가 비는 일이 없게. */
export const toPortfolioStorageReason = (
  error: unknown,
  fallback: PortfolioStorageFailureReason
): PortfolioStorageFailureReason => {
  if (typeof error !== 'object' || error === null) return fallback;

  const reason = (error as { reason?: unknown }).reason;

  return typeof reason === 'string' && STORAGE_FAILURE_REASONS.includes(reason)
    ? (reason as PortfolioStorageFailureReason)
    : fallback;
};

export type PortfolioReadResult =
  | { ok: true; value: PortfolioPersistedRecord | null }
  | { ok: false; reason: PortfolioStorageFailureReason };

/** 저장 계층 주입 지점(테스트·대체 구현). 기본값은 아래 실제 IndexedDB 구현이다. */
export type PortfolioRecordReader = () => Promise<PortfolioReadResult>;
export type PortfolioRecordWriter = (
  holdings: readonly PortfolioHolding[],
  taxPercent: number
) => Promise<PortfolioPersistedRecord>;

/**
 * 수동 입력(유니버스 밖 종목)의 정규화. 무효하면 `undefined` — 그 행은 `no-market-data` 가 되어
 * 화면이 사유를 말한다(무효값을 그대로 들여 계산을 오염시키지 않는다).
 */
export const normalizePortfolioManualInput = (raw: unknown): PortfolioManualMarketInput | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined;

  const { price, dividendYield } = raw as Partial<PortfolioManualMarketInput>;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return undefined;
  if (typeof dividendYield !== 'number' || !Number.isFinite(dividendYield)) return undefined;

  // 폼이 0..100 을 검증하지만 저장 데이터는 신뢰할 수 없는 입력이라 여기서도 가둔다.
  return { price, dividendYield: Math.min(100, Math.max(0, dividendYield)) };
};

/**
 * 보유 목록 정규화. **읽기·쓰기 양쪽이 같은 함수를 통과**하므로 왕복이 구조적으로 안정된다.
 * 티커는 대문자·트림, 중복은 먼저 나온 행이 이긴다, 수량은 M0 규칙(소수 4자리·미입력은 0).
 */
const normalizeHoldings = (raw: readonly unknown[]): PortfolioHolding[] => {
  const seen = new Set<string>();
  const holdings: PortfolioHolding[] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;

    const { ticker, quantity, manual } = item as Partial<PortfolioHolding>;
    const symbol = normalizePortfolioTicker(typeof ticker === 'string' ? ticker : '');
    if (symbol.length === 0 || seen.has(symbol)) continue;
    seen.add(symbol);

    const normalizedQuantity = typeof quantity === 'number' ? normalizePortfolioQuantity(quantity) : null;
    const normalizedManual = normalizePortfolioManualInput(manual);

    holdings.push({
      ticker: symbol,
      // 미입력(0)도 그대로 남긴다 — 사용자가 추가만 해 둔 행을 저장이 삼키면 안 된다.
      quantity: normalizedQuantity ?? 0,
      ...(normalizedManual ? { manual: normalizedManual } : {})
    });
  }

  return holdings;
};

/**
 * 저장된 값 → 레코드. 순수 함수라 IndexedDB 없이 테스트할 수 있다.
 *
 * ⚠ **모르는 `v` 는 `null`**(= 저장 이력 없음처럼 시작). 앞으로 v2 를 만든다면 이 함수에
 * v1→v2 승격을 넣어야 하고, **v2 레코드를 구버전 코드가 열면 버려진다**는 점을 함께 고려할 것.
 */
export const parsePortfolioRecord = (raw: unknown): PortfolioPersistedRecord | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const record = raw as Partial<PortfolioPersistedRecord>;
  if (record.v !== PORTFOLIO_RECORD_VERSION) return null;
  if (!Array.isArray(record.holdings)) return null;

  return {
    v: PORTFOLIO_RECORD_VERSION,
    holdings: normalizeHoldings(record.holdings),
    taxPercent: normalizePortfolioTaxRatePercent(
      typeof record.taxPercent === 'number' ? record.taxPercent : undefined
    ),
    updatedAt: typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt) ? record.updatedAt : 0
  };
};

export const buildPortfolioRecord = (
  holdings: readonly PortfolioHolding[],
  taxPercent: number,
  updatedAt: number = Date.now()
): PortfolioPersistedRecord => ({
  v: PORTFOLIO_RECORD_VERSION,
  holdings: normalizeHoldings(holdings),
  taxPercent: normalizePortfolioTaxRatePercent(taxPercent),
  updatedAt
});

const getIndexedDb = (): IDBFactory | null => (typeof indexedDB === 'undefined' ? null : indexedDB);

const openPortfolioDb = (factory: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = factory.open(PORTFOLIO_DB_NAME, PORTFOLIO_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PORTFOLIO_STORE_NAME)) db.createObjectStore(PORTFOLIO_STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(storageError('blocked', request.error?.message ?? 'Failed to open portfolio IndexedDB'));
    // 다른 탭이 잡고 있으면 영원히 pending 이 된다 — 명시적으로 실패시켜 호출자가 계속 가게 한다.
    request.onblocked = () => reject(storageError('blocked', 'Portfolio IndexedDB open blocked by another tab'));
  });

/** 예외 경로에서도 핸들을 반드시 닫는다(새면 다음 열기가 blocked 된다). */
const withPortfolioDb = async <T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> => {
  const factory = getIndexedDb();
  if (!factory) throw storageError('unavailable', 'IndexedDB unavailable');

  const db = await openPortfolioDb(factory);
  try {
    return await run(db);
  } finally {
    db.close();
  }
};

/**
 * 보유 목록을 읽는다. **절대 throw 하지 않고** 성공/실패를 구분해 돌려준다.
 * `{ ok:true, value:null }` = 저장한 적 없음(빈 화면), `{ ok:false }` = 못 읽음(에러 화면).
 */
export const readPortfolioRecord = async (): Promise<PortfolioReadResult> => {
  try {
    const raw = await withPortfolioDb(
      (db) =>
        new Promise<unknown>((resolve, reject) => {
          const request = db
            .transaction(PORTFOLIO_STORE_NAME, 'readonly')
            .objectStore(PORTFOLIO_STORE_NAME)
            .get(PORTFOLIO_RECORD_KEY);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(storageError('read-failed', request.error?.message ?? 'Failed to read portfolio holdings'));
        })
    );

    return { ok: true, value: raw === undefined ? null : parsePortfolioRecord(raw) };
  } catch (error) {
    return { ok: false, reason: toPortfolioStorageReason(error, 'read-failed') };
  }
};

/**
 * 보유 목록을 저장한다. **실패는 reject 로 전파**한다 — 호출자(훅)가 화면에 알린다.
 * 저장된 레코드를 돌려주므로 호출자가 `updatedAt` 을 그대로 쓸 수 있다.
 */
export const writePortfolioRecord = async (
  holdings: readonly PortfolioHolding[],
  taxPercent: number
): Promise<PortfolioPersistedRecord> => {
  const record = buildPortfolioRecord(holdings, taxPercent);

  await withPortfolioDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
        transaction.objectStore(PORTFOLIO_STORE_NAME).put(record, PORTFOLIO_RECORD_KEY);

        transaction.oncomplete = () => resolve();
        transaction.onabort = () =>
          reject(storageError('write-failed', transaction.error?.message ?? 'Portfolio holdings write aborted'));
        transaction.onerror = () =>
          reject(storageError('write-failed', transaction.error?.message ?? 'Failed to write portfolio holdings'));
      })
  );

  return record;
};
