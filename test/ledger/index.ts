/**
 * `test/ledger/` 배럴 — 폴더마다 `index.ts`(`.cursor/rules`).
 *
 * 테스트 파일은 vitest 가 직접 수집하므로 여기서 내보내는 것은 **픽스처뿐**이다.
 */
export {
  SUMMARY_WITH_ROWS,
  TWO_ROWS,
  ZERO_SUMMARY,
  baseViewModel,
  ledgerRow,
  renderLedgerView
} from './ledgerFixtures';
export type { LedgerHandlers } from './ledgerFixtures';
