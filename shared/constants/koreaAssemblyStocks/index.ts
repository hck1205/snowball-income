import snapshot from './koreaAssemblyStocks.generated.json';
import type { KoreaAssemblyStocksSnapshot } from './koreaAssemblyStocks.types';

export * from './koreaAssemblyStocks.types';

/**
 * 대한민국 국회의원 주식 보유 스냅샷 — **커밋된 생성물**을 읽는 유일한 문.
 *
 * 갱신: `npm run korea:assembly` (국회공보 목록 → 재산공개 호 PDF → 파싱).
 * 자료의 한계는 `koreaAssemblyStocks.types.ts` 머리말이 여섯 항목으로 못 박아 두었다 —
 * **화면은 그 여섯 개를 반드시 말해야 한다.**
 *
 * 🔴 `as` 단언을 쓰는 이유는 형제 스냅샷(`congressTrades`)과 같다 — JSON import 는 리터럴을
 * 넓은 타입으로 추론해 `position` 같은 유니온과 맞지 않는다. 값의 모양은 생성 스크립트가
 * 보장하고, 여기서는 그 계약을 한 줄로 선언한다.
 * ⚠ 스크립트의 출력 형태를 바꾸면 이 타입도 함께 고쳐야 한다 — 컴파일러가 못 잡는다.
 */
export const KOREA_ASSEMBLY_STOCKS = snapshot as unknown as KoreaAssemblyStocksSnapshot;

/**
 * 주식 수를 읽을 수 있는 문자열로.
 *
 * 🔴 **금액으로 바꾸지 않는다.** 공보는 종목별 금액을 주지 않고, 기준일 주가도 이 앱에 없다.
 * 주식 수는 주식 수로만 말한다.
 * ⚠ 소수점 매수 때문에 정수가 아닐 수 있다 — 소수는 최대 두 자리까지만 보여 준다.
 */
export const formatShares = (shares: number): string => {
  const rounded = Math.round(shares * 100) / 100;
  return `${rounded.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}주`;
};

/**
 * 본인 명의만인가.
 *
 * 배우자·자녀 명의가 섞였는지는 이 자료를 읽는 데 **중요한 맥락**이라 화면이 표시한다.
 * 관계 목록이 비면(있을 수 없지만) 본인으로 읽지 않고 `false` 다 — 모르는 것을 단정하지 않는다.
 */
export const isSelfOnly = (relations: readonly string[]): boolean =>
  relations.length === 1 && relations[0] === '본인';
