// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_CLOUD_VERSION,
  buildPortfolioRecord,
  decidePortfolioSync,
  hasPortfolioContent,
  parseCloudPayload,
  toCloudPayload
} from '@/pages/Portfolio/utils';
import type { PortfolioHolding } from '@/shared/lib/portfolio';

/**
 * 내 포트폴리오 ↔ 클라우드 정책.
 *
 * 이 파일이 지키는 것은 **"클라우드가 이긴다"** 와 **"못 믿을 payload 로 로컬을 지우지 않는다"** 둘이다.
 * 시뮬레이터(탭 단위 3-way 병합)와 정책이 다르므로, 나중에 둘을 같게 만들려는 시도가 있으면
 * 이 테스트가 먼저 빨개진다.
 */

const holding = (ticker: string, quantity: number): PortfolioHolding =>
  ({ ticker, quantity }) as PortfolioHolding;

const record = (tickers: [string, number][], taxPercent = 15.4, updatedAt = 1000) =>
  buildPortfolioRecord(
    tickers.map(([ticker, quantity]) => holding(ticker, quantity)),
    taxPercent,
    updatedAt
  );

describe('포트폴리오 클라우드 정책', () => {
  it('클라우드에 있으면 **로컬을 덮는다** — 병합하지 않는다', () => {
    const outcome = decidePortfolioSync({
      cloud: { record: record([['SCHD', 10]]), calendarTickers: ['SCHD'] },
      local: record([['VIG', 99]]) // 이 기기에서 다르게 편집해 둔 상태
    });

    expect(outcome.type).toBe('applied-cloud');
    if (outcome.type !== 'applied-cloud') return;
    // 로컬의 VIG 는 살아남지 않는다 — 이것이 이 정책의 대가이고, 화면이 그 사실을 말해야 한다.
    expect(outcome.record.holdings.map((h) => h.ticker)).toEqual(['SCHD']);
    expect(outcome.calendarTickers).toEqual(['SCHD']);
  });

  it('내용이 같으면 아무 것도 하지 않는다 (불필요한 쓰기 없음)', () => {
    const same = record([['SCHD', 10]]);
    // 저장 시각만 다른 것은 "같다"로 본다 — 시각 때문에 매번 올리면 안 된다.
    const cloudSame = record([['SCHD', 10]], 15.4, 9999);

    expect(decidePortfolioSync({ cloud: { record: cloudSame, calendarTickers: [] }, local: same }).type).toBe('noop');
  });

  it('클라우드가 비어 있고 로컬에 내용이 있으면 올린다 (첫 로그인)', () => {
    expect(decidePortfolioSync({ cloud: null, local: record([['SCHD', 10]]) }).type).toBe('pushed-local');
  });

  it('양쪽 다 비어 있으면 빈 슬롯을 만들지 않는다', () => {
    expect(decidePortfolioSync({ cloud: null, local: null }).type).toBe('noop');
    expect(decidePortfolioSync({ cloud: null, local: record([]) }).type).toBe('noop');
  });

  it('새 기기: 로컬이 비어도 클라우드가 있으면 가져온다', () => {
    const outcome = decidePortfolioSync({
      cloud: { record: record([['O', 5]]), calendarTickers: [] },
      local: null
    });

    expect(outcome.type).toBe('applied-cloud');
  });
});

describe('클라우드 payload 왕복·방어', () => {
  it('왕복한다 (캘린더 선택 포함)', () => {
    const source = record([['SCHD', 10]]);
    const parsed = parseCloudPayload(toCloudPayload(source, ['SCHD', 'VIG']));

    expect(parsed).not.toBeNull();
    expect(parsed?.record.holdings.map((h) => h.ticker)).toEqual(['SCHD']);
    expect(parsed?.calendarTickers).toEqual(['SCHD', 'VIG']);
  });

  it('캘린더 선택이 없으면 payload 에 키 자체를 넣지 않는다 (빈 배열로 자리 차지하지 않음)', () => {
    expect(toCloudPayload(record([['SCHD', 10]]), [])).not.toHaveProperty('calendarTickers');
  });

  /*
   * 🔴 서버는 이 모양을 검증하지 않는다(jsonb). 여기서 막지 못하면 구버전·손상된 값이 그대로
   * 화면에 오고, 더 나쁘게는 **그것으로 로컬을 덮는다.** 못 믿을 값은 전부 null 이어야 한다.
   */
  it('못 믿을 payload 는 null — 그것으로 로컬을 덮지 않는다', () => {
    expect(parseCloudPayload(null)).toBeNull();
    expect(parseCloudPayload('문자열')).toBeNull();
    expect(parseCloudPayload([])).toBeNull();
    expect(parseCloudPayload({})).toBeNull();
    expect(parseCloudPayload({ v: 999, holdings: [] })).toBeNull(); // 미래 버전
    expect(parseCloudPayload({ v: PORTFOLIO_CLOUD_VERSION, holdings: '배열아님' })).toBeNull();
  });

  it('숫자가 아닌 세율·시각은 안전한 기본값으로 떨어진다', () => {
    const parsed = parseCloudPayload({
      v: PORTFOLIO_CLOUD_VERSION,
      holdings: [],
      taxPercent: 'NaN',
      updatedAt: null
    });

    expect(parsed?.record.taxPercent).toBe(0);
    expect(parsed?.record.updatedAt).toBe(0);
  });

  it('캘린더 티커 목록에서 문자열이 아닌 것은 걸러낸다', () => {
    const parsed = parseCloudPayload({
      v: PORTFOLIO_CLOUD_VERSION,
      holdings: [],
      taxPercent: 0,
      updatedAt: 0,
      calendarTickers: ['SCHD', 123, null, '', 'VIG']
    });

    expect(parsed?.calendarTickers).toEqual(['SCHD', 'VIG']);
  });
});

describe('내용 게이트', () => {
  it('빈 보유는 올릴 내용이 아니다', () => {
    expect(hasPortfolioContent(null)).toBe(false);
    expect(hasPortfolioContent(record([]))).toBe(false);
    expect(hasPortfolioContent(record([['SCHD', 10]]))).toBe(true);
  });
});
