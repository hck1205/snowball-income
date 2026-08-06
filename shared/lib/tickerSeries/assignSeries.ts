import { CHART_SERIES_VARS } from '@/shared/styles';

/**
 * 종목 → 시리즈 색 배정. **색을 길찾기 단서로 쓰기 위한 단일 원천.**
 *
 * ## 왜 2겹인가 (2026-08-03 D4 승인 — 확정 결정 번복)
 * 종전 규칙은 **이름 해시 한 겹**이었다(`pages/DividendCalendar/utils/tickerColor.ts`).
 * 그 선택의 근거는 "달을 넘기며 같은 종목을 눈으로 추적하니 **안 바뀌는 것**이 색이 겹치지 않는 것보다
 * 중요하다"였고, 8색 순환이라 **충돌은 허용**한다고 명시적으로 적혀 있었다.
 *
 * 개편(컬러 플레이트)이 그 전제를 뒤집는다. 색이 단순한 구분이 아니라 **"이 색이 곧 그 종목"** 이라는
 * 길찾기 단서가 되므로, **한 화면 안에서 같은 색이 두 번 나오면 그 단서가 거짓말이 된다.**
 * 그래서 두 겹으로 간다:
 *
 *  1겹 **안정 해시** — 이름에서 색을 정한다. 집합이 달라져도 되도록 그대로 유지된다.
 *  2겹 **집합 내 충돌 회피** — 이미 쓴 색이면 다음 빈 색으로 비킨다.
 *
 * ## 🔴 대가 — 이걸 모르고 쓰면 놀란다
 * **종목을 추가하면 다른 종목의 색이 최대 1종 이동할 수 있다.** 새 종목이 기존 종목의 해시 자리를
 * 먼저 차지하면 기존 종목이 비켜야 하기 때문이다. 종전 규칙이 지키던 "절대 안 바뀜"은 포기했다.
 * 그 대신 **한 화면 안에서는 절대 겹치지 않는다**.
 *
 * ## 결정성
 * 🔴 입력 순서와 무관하게 같은 결과를 준다 — 내부에서 **정렬한 뒤** 배정하기 때문이다.
 * 그래서 사용자가 보유 종목을 드래그로 재정렬해도 색이 따라 움직이지 않는다. 이건 이 함수의 계약이고
 * 테스트가 잠근다. 정렬을 빼면 "순서를 바꿨더니 색이 전부 바뀌는" 회귀가 조용히 생긴다.
 *
 * ## 색이 모자랄 때
 * 팔레트는 8색이라 9번째부터는 **어쩔 수 없이 겹친다**. 그때는 1겹 해시 값으로 되돌아간다 —
 * 임의로 9번째 색을 만들지 않는다(팔레트 밖 색은 16테마 대비 검증 밖이다).
 */

/** 이름 → 팔레트 인덱스(안정 해시). 집합과 무관하게 이 값이 그 종목의 "고향"이다. */
export const seriesHomeIndex = (symbol: string, paletteSize: number): number => {
  let hash = 0;
  for (let index = 0; index < symbol.length; index += 1) {
    hash = (hash * 31 + symbol.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % Math.max(1, paletteSize);
};

/**
 * 배정 결과를 **인덱스로** 준다 — 이게 1차 산출물이고 색 문자열은 여기서 파생한다.
 *
 * 🔴 인덱스를 노출하는 이유: 같은 종목이 **DOM 과 캔버스에서 같은 색**이어야 하는데 둘이 쓰는
 * 값의 형태가 다르다. DOM 범례는 CSS 변수(`var(--sb-chart-series-N)`)를 쓰고 ECharts 캔버스는
 * hex(`getChartTheme().series[N]`)를 쓴다 — CSS 변수는 캔버스에 못 넣는다.
 * 공유해야 하는 것은 색 문자열이 아니라 **N** 이다.
 *
 * ⚠ 순수·결정적이라 호출부 두 곳이 **각자 불러도 같은 결과**가 나온다(같은 집합을 넣는 한).
 *   그래서 파이와 범례가 맵을 서로 넘겨받을 필요가 없다 — 각자 계산해도 어긋나지 않는다.
 */
export const assignSeriesIndexes = (
  symbols: readonly string[],
  paletteSize: number
): ReadonlyMap<string, number> => {
  const result = new Map<string, number>();
  if (paletteSize <= 0) return result;

  /* 🔴 정렬한 뒤 배정한다 — 입력 순서가 결과를 바꾸면 드래그 정렬이 색을 흔든다. */
  const unique = [...new Set(symbols.filter((symbol) => symbol.length > 0))].sort();
  const taken = new Set<number>();

  for (const symbol of unique) {
    const home = seriesHomeIndex(symbol, paletteSize);

    if (!taken.has(home)) {
      taken.add(home);
      result.set(symbol, home);
      continue;
    }

    /* 고향이 찼다 — 다음 빈 자리로 비킨다(순환). */
    let assigned: number | null = null;
    for (let step = 1; step < paletteSize; step += 1) {
      const candidate = (home + step) % paletteSize;
      if (!taken.has(candidate)) {
        assigned = candidate;
        break;
      }
    }

    /* 팔레트를 다 썼다(9번째부터). 새 색을 만들지 않고 고향으로 되돌아간다 — 겹치지만 정직하다. */
    const index = assigned ?? home;
    taken.add(index);
    result.set(symbol, index);
  }

  return result;
};

/**
 * 한 집합에 색을 배정한다. 반환은 `symbol → CSS 변수` 맵(DOM 용).
 *
 * ⚠ 이 배정을 **호출부마다 다시 구현하지 마라.** 종전에 세 곳(캘린더 해시 · 파이 `index % 8` ·
 * 대가 카드 `index % 8`)이 각자 달라서, 같은 종목이 화면마다 다른 색으로 나왔다.
 */
export const assignSeries = (
  symbols: readonly string[],
  palette: readonly string[] = CHART_SERIES_VARS
): ReadonlyMap<string, string> => {
  /* 🔴 배정 알고리즘을 두 번 쓰지 않는다 — 인덱스 맵에서 파생만 한다(둘이 갈리면 색이 어긋난다). */
  const indexes = assignSeriesIndexes(symbols, palette.length);
  const result = new Map<string, string>();
  for (const [symbol, index] of indexes) result.set(symbol, palette[index]!);
  return result;
};

/**
 * 집합을 모를 때의 단일 조회(1겹만). 종전 `tickerSeriesVar` 와 **완전히 같은 값**을 준다.
 *
 * ⚠ 되도록 쓰지 마라 — 이걸 쓰면 충돌 회피가 없다. 화면이 그릴 종목 목록을 알 수 있으면
 * 언제나 `assignSeries` 를 쓰는 것이 맞다. 목록을 모으기 어려운 자리(단독 배지 등)의 탈출구다.
 */
export const seriesVarFor = (symbol: string, palette: readonly string[] = CHART_SERIES_VARS): string =>
  palette[seriesHomeIndex(symbol, palette.length)] ?? palette[0] ?? '';
