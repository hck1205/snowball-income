import { MARKET_INDICES } from '@/shared/lib/marketIndices';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { MarketIndicesSnapshot, MarketIndicesView } from '@/shared/lib/marketIndices';
import { marketIndicesViewAtom } from '@/jotai';
import MarketIndexStrip from './MarketIndexStrip';
import { formatIndexValue } from './MarketIndexStrip.utils';

/**
 * 이 파일은 **사용 예시**를 겸한다 — 스트립은 프롭이 없고 `marketIndicesViewAtom` 만 본다.
 * 그래서 상태별 화면은 fetch 를 흉내 낼 필요 없이 **atom 을 미리 세팅**해 확인한다(아래 renderStrip).
 * 조회 경로(서버 응답 파싱·실패·stale 승격)는 test/api/marketIndices.test.ts 와
 * test/shared/marketIndices.test.ts 가 이미 덮으므로 여기서 중복하지 않는다.
 *
 * 색은 단정하지 않는다(Emotion 내부 구현 기반 테스트 금지 + 대비는 shared/styles/contrast.test.ts 담당).
 * 방향은 **부호 문자**와 **스크린리더 문장**으로 단정한다 — 그 자체가 "색 단독 채널 금지"를 강제하는 장치다.
 */

const TITLE = '주요 지수';

/**
 * 실측(2026-07-27) 기준 픽스처. `previousClose` 는 기대 변동률에서 역산한 값이다
 * (예: 7419.65 − 7408.54 = 11.11 → 0.1500% → 표시 +0.15%).
 * `currency` 를 일부러 하나 실어 둔다 — 지수는 포인트라 화면에 통화기호가 나오면 안 된다.
 */
const SNAPSHOT: MarketIndicesSnapshot = {
  asOf: '2026-07-27T21:05:00.000Z',
  requested: ['^GSPC', '^IXIC', '^KS11', '^KQ11', '^N225', 'KRW=X'],
  indices: [
    { symbol: '^GSPC', price: 7419.65, previousClose: 7408.54, currency: 'USD' },
    { symbol: '^IXIC', price: 24953.08, previousClose: 25136.58, currency: 'USD' },
    { symbol: '^KS11', price: 6755.75, previousClose: 7097.12, currency: 'KRW' },
    { symbol: '^KQ11', price: 764.86, previousClose: 790.31, currency: 'KRW' },
    { symbol: '^N225', price: 64931.19, previousClose: 64608.15, currency: 'JPY' },
    // 지수가 아니라 환율(원/달러) — 스크린리더 단위가 '원' 인 유일한 항목이다.
    { symbol: 'KRW=X', price: 1436.6, previousClose: 1420.6, currency: 'KRW' }
  ]
};

/** 스펙 §4.6 표 — 라벨/값/변동률/스크린리더 문장. 레지스트리 순서와 같아야 한다. */
const EXPECTED = [
  { label: 'S&P 500', value: '7,419.65', change: '+0.15%', aria: '전일 대비 0.15% 상승' },
  { label: '나스닥 종합', value: '24,953.08', change: '-0.73%', aria: '전일 대비 0.73% 하락' },
  { label: '코스피', value: '6,755.75', change: '-4.81%', aria: '전일 대비 4.81% 하락' },
  { label: '코스닥', value: '764.86', change: '-3.22%', aria: '전일 대비 3.22% 하락' },
  { label: '니케이225', value: '64,931.19', change: '+0.50%', aria: '전일 대비 0.50% 상승' },
  // 환율이라 스크린리더 단위가 '원' 이다(나머지는 '포인트') — 그 계약은 아래 단위 테스트가 따로 잠근다.
  { label: '원/달러', value: '1,436.60', change: '+1.13%', aria: '전일 대비 1.13% 상승' }
] as const;

/**
 * 조회 드라이버(`useMarketIndicesSync`)는 이 부품이 아니라 **부품을 놓는 페이지**가 부른다.
 * 표시만 확인하는 이 테스트는 드라이버 없이 atom 값을 직접 심는다(매 테스트 새 store 로 격리).
 */
const renderStrip = (view: MarketIndicesView) => {
  const store = createStore();
  store.set(marketIndicesViewAtom, view);
  return render(
    <Provider store={store}>
      <MarketIndexStrip />
    </Provider>
  );
};

const strip = () => screen.getByRole('region', { name: TITLE });

describe('MarketIndexStrip — 주요 지수 스트립 (표시 전용)', () => {
  it('로딩 중엔 aria-busy 로 스켈레톤을 보이되 지수명 5개는 실제 텍스트로 그린다', () => {
    renderStrip({ status: 'loading' });

    expect(strip()).toHaveAttribute('aria-busy', 'true');
    // 무엇을 기다리는지 보이고, 값이 도착해도 레이아웃이 그대로다.
    for (const { label } of EXPECTED) expect(screen.getByText(label)).toBeInTheDocument();
    // 아직 값이 없으니 숫자·변동률은 그리지 않는다(가짜 시세 금지).
    for (const { value, change } of EXPECTED) {
      expect(screen.queryByText(value)).not.toBeInTheDocument();
      expect(screen.queryByText(change)).not.toBeInTheDocument();
    }
    expect(strip()).not.toHaveTextContent('%');
  });

  it('성공하면 레지스트리 전 항목의 값과 전일 대비 변동률을 그리고 방향을 문장으로도 말한다', () => {
    renderStrip({ status: 'success', snapshot: SNAPSHOT });

    expect(strip()).toHaveAttribute('aria-busy', 'false');
    // 🔴 개수를 하드코딩하지 않는다 — 레지스트리에 한 줄 추가하면 자동으로 따라온다(2026-08-02 원/달러 합류).
    expect(screen.getAllByRole('listitem')).toHaveLength(MARKET_INDICES.length);

    for (const { label, value, change, aria } of EXPECTED) {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
      // 부호는 색과 무관하게 언제나 남는다(색 단독 채널 금지).
      expect(screen.getByText(change).textContent).toBe(change);
      // 색·부호를 못 읽는 사용자를 위한 문장.
      expect(screen.getByText(aria)).toBeInTheDocument();
    }

    // 지수는 금액이 아니라 포인트다 — 통화기호·통화코드를 쓰지 않는다.
    expect(strip()).not.toHaveTextContent('$');
    expect(strip()).not.toHaveTextContent('USD');
    expect(strip()).not.toHaveTextContent('업데이트 실패');
  });

  it('일부 지수만 못 받으면 그 칸을 지우지 않고 결손을 말한다 (부분 실패)', () => {
    const partial: MarketIndicesSnapshot = {
      ...SNAPSHOT,
      indices: SNAPSHOT.indices.slice(0, 3) // ^KQ11 · ^N225 누락
    };
    renderStrip({ status: 'success', snapshot: partial });

    // 칸이 사라지면 다른 지수가 자리를 옮겨 "이 지수는 원래 없다"로 읽힌다.
    // 🔴 개수를 하드코딩하지 않는다 — 레지스트리에 한 줄 추가하면 자동으로 따라온다(2026-08-02 원/달러 합류).
    expect(screen.getAllByRole('listitem')).toHaveLength(MARKET_INDICES.length);
    expect(screen.getByText('코스닥')).toBeInTheDocument();
    expect(screen.getByText('니케이225')).toBeInTheDocument();

    // 결손 개수도 파생시킨다 — 앞의 3종만 받았으므로 나머지 전부가 결손이다.
    const missingCount = MARKET_INDICES.length - 3;
    expect(screen.getAllByText('불러오지 못함')).toHaveLength(missingCount);
    expect(screen.getAllByText('시세를 불러오지 못했습니다')).toHaveLength(missingCount);
    // 받아온 지수는 그대로 보인다.
    expect(screen.getByText('6,755.75')).toBeInTheDocument();
  });

  /**
   * 🔴 **단위는 항목마다 다르다.** 지수는 "포인트", 원/달러는 "원"이다.
   * 전부 '포인트'로 낭독하면 환율이 "1,436.60 포인트"가 되어 **거짓**이 된다.
   * 화면 표시는 어느 쪽도 숫자뿐이므로 이 계약은 **스크린리더 텍스트로만** 확인할 수 있다.
   */
  it('스크린리더 단위가 항목마다 맞다 — 지수는 포인트, 원/달러는 원', () => {
    renderStrip({ status: 'success', snapshot: SNAPSHOT });

    // ⚠ RTL 은 텍스트를 정규화해 앞뒤 공백을 지운다 — 선행 공백째로 찾으면 못 만난다(트리밍 후 비교).
    const exact = (label: string) => (content: string) => content.trim() === label;

    const pointUnits = screen.getAllByText(exact('포인트'));
    expect(pointUnits).toHaveLength(MARKET_INDICES.filter((item) => item.unit === undefined).length);
    expect(screen.getAllByText(exact('원'))).toHaveLength(1);
  });

  it('전일 종가만 없으면 값은 그대로 보이고 변동률만 "정보 없음"으로 비운다 (0% 위장 금지)', () => {
    // 코스피만 전일 종가가 빠진 응답(폴백 공급자가 이겼을 때 실제로 생긴다).
    const noPrevious: MarketIndicesSnapshot = {
      ...SNAPSHOT,
      indices: SNAPSHOT.indices.map((quote) =>
        quote.symbol === '^KS11' ? { symbol: quote.symbol, price: quote.price } : quote
      )
    };
    renderStrip({ status: 'success', snapshot: noPrevious });

    expect(screen.getByText('6,755.75')).toBeInTheDocument();
    // 변동률 자리는 대시로 남기고(자리 유지) 모른다는 사실을 문장으로 말한다.
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('전일 대비 정보가 없습니다')).toBeInTheDocument();
    // 값 자체는 멀쩡하므로 "불러오지 못함"을 붙이지 않는다.
    expect(screen.queryByText('불러오지 못함')).not.toBeInTheDocument();
    // 나머지 지수의 변동률은 그대로다.
    expect(screen.getByText('+0.15%')).toBeInTheDocument();
  });

  it('갱신에 실패해도 직전 값을 유지하고 옅은 "업데이트 실패" 표식만 붙인다 (stale)', () => {
    renderStrip({ status: 'stale', snapshot: SNAPSHOT });

    expect(screen.getByText('6,755.75')).toBeInTheDocument();
    expect(screen.getByText('-4.81%')).toBeInTheDocument();
    expect(strip()).toHaveTextContent('업데이트 실패');
  });

  it('보여줄 값이 하나도 없으면 목록 대신 안내 한 줄만 남기고 제목은 유지한다 (error)', () => {
    renderStrip({ status: 'error' });

    expect(screen.getByText('지수 시세를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    // 값이 없어도 부품 정체성(제목)은 남는다.
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    expect(strip()).not.toHaveTextContent('%');
  });

  it('제목 heading 과 목록 시맨틱으로 개수·경계를 알린다', () => {
    renderStrip({ status: 'success', snapshot: SNAPSHOT });

    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    // 무엇 대비인지는 헤더가 한 번만 말한다(셀마다 라벨을 반복하지 않는다).
    // 🔴 "실시간이 아닌" 이 문장에서 빠지면 이 화면은 지연된 값을 실시간 시세처럼 보이게 한다.
    expect(strip()).toHaveTextContent('전일 대비 · 실시간이 아닌 참고용 시세');
  });

  /**
   * 🔴 **색은 단독 채널이 될 수 없다.** 방향은 색 말고도 ①부호(+/-) ②모양(▲/▼) ③스크린리더 문장
   * 셋으로 남는다. 여기서는 그중 **모양**을 잠근다.
   *
   * ⚠ 마크는 반드시 **형제 요소**다 — 변동률 텍스트 안에 넣으면 위 성공 테스트의 정확일치
   * (`getByText('+0.15%').textContent === '+0.15%'`)가 깨지고, `::before content` 로 넣으면
   * 통과는 하지만 복사·번역 경로에서 조용히 사라진다.
   */
  it('상승·하락에 방향 글리프(▲/▼)를 부호 옆에 세우되 변동률 텍스트는 오염시키지 않는다', () => {
    renderStrip({ status: 'success', snapshot: SNAPSHOT });

    const ups = EXPECTED.filter(({ change }) => change.startsWith('+'));
    const downs = EXPECTED.filter(({ change }) => change.startsWith('-'));
    expect(screen.getAllByText('▲')).toHaveLength(ups.length);
    expect(screen.getAllByText('▼')).toHaveLength(downs.length);

    for (const { change } of EXPECTED) {
      const percent = screen.getByText(change);
      // 마크는 변동률의 **형제**이고, 둘을 감싼 덩어리에서만 함께 읽힌다.
      expect(percent.textContent).toBe(change);
      expect(percent.parentElement?.textContent).toBe(
        `${change.startsWith('+') ? '▲' : '▼'}${change}`
      );
    }
  });

  it('보합(0.00%)에는 방향 글리프를 그리지 않는다 — 있지도 않은 방향을 만들지 않는다', () => {
    // S&P 만 현재가 = 전일 종가(완전 보합), 나머지는 그대로.
    const flat: MarketIndicesSnapshot = {
      ...SNAPSHOT,
      indices: SNAPSHOT.indices.map((quote) =>
        quote.symbol === '^GSPC' ? { ...quote, price: quote.previousClose as number } : quote
      )
    };
    renderStrip({ status: 'success', snapshot: flat });

    expect(screen.getByText('0.00%').parentElement?.textContent).toBe('0.00%');
    expect(screen.getByText('전일 대비 변동 없음')).toBeInTheDocument();
    // 보합이 된 S&P 만큼 상승 마크가 하나 줄어든다(니케이·원/달러는 그대로 상승).
    const remainingUps = EXPECTED.filter(({ change }) => change.startsWith('+')).length - 1;
    expect(screen.getAllByText('▲')).toHaveLength(remainingUps);
  });
});

describe('MarketIndexStrip.utils — 순수 표기', () => {
  it('formatIndexValue: 소수 2자리 고정 + ko-KR 콤마, 통화기호 없음', () => {
    expect(formatIndexValue(764.86)).toBe('764.86');
    expect(formatIndexValue(64931.19)).toBe('64,931.19');
    expect(formatIndexValue(7419.65)).toBe('7,419.65');
    // 정수로 와도 자릿수를 맞춘다(표에서 소수점이 흔들리지 않게).
    expect(formatIndexValue(764)).toBe('764.00');
  });
});
