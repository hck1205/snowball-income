/**
 * 캘린더에서 고른 티커 목록을 브라우저에 남긴다 (IndexedDB).
 *
 * **전용 DB 를 따로 연다.** 시뮬레이터 자동저장(`jotai/snowball/persistence`)이 쓰는
 * `hungryhippo-db` 에 스토어를 추가하려면 그 DB 의 버전을 올려야 하는데, 그건 이미 저장된
 * 사용자 포트폴리오 전체를 마이그레이션 리스크에 태우는 일이다. 화면 하나의 선택값 때문에
 * 감수할 이유가 없다 — 여기는 완전히 분리된, 지워져도 되는 데이터다.
 *
 * 그래서 이 모듈은 **절대 throw 하지 않는다**: 읽기 실패는 `null`, 쓰기 실패는 조용한 no-op.
 * IndexedDB 가 없는 환경(SSR, jsdom, 일부 프라이빗 모드)에서도 그대로 동작한다.
 * 세션 안에서의 선택 유지는 UI 메모리 상태가 책임진다.
 */

const CALENDAR_DB_NAME = 'snowball-dividend-calendar';
const CALENDAR_DB_VERSION = 1;
const CALENDAR_STORE_NAME = 'selection';
/** 스토어에 레코드는 항상 이 키 하나뿐이다(선택 목록은 한 벌). */
const CALENDAR_SELECTION_KEY = 'selection';

/** `v` 는 스키마 버전. 모르는 버전을 만나면 읽지 않고 버린다(= 기본 상태로 시작). */
export type CalendarSelectionRecord = {
  v: 1;
  tickers: string[];
  updatedAt: number;
};

const normalizeTickers = (tickers: readonly string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tickers) {
    const symbol = raw.trim().toUpperCase();
    if (symbol.length === 0 || seen.has(symbol)) continue;
    seen.add(symbol);
    result.push(symbol);
  }

  return result;
};

/**
 * 저장된 레코드를 검증한다. 순수 함수라 IndexedDB 없이 테스트할 수 있다.
 * 모양이 조금이라도 어긋나면 고치려 들지 않고 `null` — 손상된 선택값을 되살릴 가치는 없다.
 */
export const parseCalendarSelectionRecord = (raw: unknown): string[] | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const record = raw as Partial<CalendarSelectionRecord>;
  if (record.v !== 1) return null;
  if (!Array.isArray(record.tickers)) return null;
  if (!record.tickers.every((ticker) => typeof ticker === 'string')) return null;

  return normalizeTickers(record.tickers);
};

export const buildCalendarSelectionRecord = (
  tickers: string[],
  updatedAt: number = Date.now()
): CalendarSelectionRecord => ({
  v: 1,
  tickers: normalizeTickers(tickers),
  updatedAt
});

const getIndexedDb = (): IDBFactory | null => (typeof indexedDB === 'undefined' ? null : indexedDB);

const openCalendarDb = (factory: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = factory.open(CALENDAR_DB_NAME, CALENDAR_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CALENDAR_STORE_NAME)) {
        db.createObjectStore(CALENDAR_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open calendar IndexedDB'));
    // 다른 탭이 잡고 있으면 영원히 pending 이 된다 — 명시적으로 실패시켜 호출자가 계속 가게 한다.
    request.onblocked = () => reject(new Error('Calendar IndexedDB open blocked by another tab'));
  });

/** 예외 경로에서도 핸들을 반드시 닫는다(새면 다음 열기가 blocked 된다). */
const withCalendarDb = async <T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> => {
  const factory = getIndexedDb();
  if (!factory) throw new Error('IndexedDB unavailable');

  const db = await openCalendarDb(factory);
  try {
    return await run(db);
  } finally {
    db.close();
  }
};

export const readCalendarSelection = async (): Promise<string[] | null> => {
  try {
    const raw = await withCalendarDb(
      (db) =>
        new Promise<unknown>((resolve, reject) => {
          const request = db
            .transaction(CALENDAR_STORE_NAME, 'readonly')
            .objectStore(CALENDAR_STORE_NAME)
            .get(CALENDAR_SELECTION_KEY);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error ?? new Error('Failed to read calendar selection'));
        })
    );

    return raw === undefined ? null : parseCalendarSelectionRecord(raw);
  } catch {
    return null;
  }
};

export const writeCalendarSelection = async (tickers: string[]): Promise<void> => {
  try {
    await withCalendarDb(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(CALENDAR_STORE_NAME, 'readwrite');
          transaction
            .objectStore(CALENDAR_STORE_NAME)
            .put(buildCalendarSelectionRecord(tickers), CALENDAR_SELECTION_KEY);

          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error ?? new Error('Calendar selection write aborted'));
          transaction.onerror = () => reject(transaction.error ?? new Error('Failed to write calendar selection'));
        })
    );
  } catch {
    // 저장 실패가 기능 실패가 되면 안 된다. 선택값은 세션 안에서 UI 상태가 들고 있다.
  }
};
