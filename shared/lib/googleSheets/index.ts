/**
 * 가계부(구글 시트) **데이터 계층**. 화면·라우트·상태(atom) 배선은 여기 없다.
 *
 * 사용법:
 *   import { isGoogleSheetsEnabled, requestAccessToken, openSpreadsheetPicker,
 *            connectSpreadsheet, readLedgerSnapshot, appendLedgerEntries } from '@/shared/lib/googleSheets';
 *
 *   if (!isGoogleSheetsEnabled) return null;              // 진입점을 아예 렌더하지 않는다
 *   const token = await requestAccessToken();             // ⚠ 반드시 클릭 핸들러 안에서 (팝업이 열린다)
 *   if (!token.ok) return;                                // 실패는 코드로 온다 — 예외가 아니다
 *   const picked = await openSpreadsheetPicker({ accessToken: token.value.value });
 *   const context = { accessToken: token.value.value };
 *   const connection = await connectSpreadsheet(context, { spreadsheetId: … });
 *
 * ⚠ 이 폴더는 `shared/lib/index.ts` 에서 재export 하지 **않는다** — `@/shared/lib` 는 앱 전역에서
 *   import 되므로, 여기 물리면 가계부를 쓰지 않는 사용자의 초기 번들에 딸려 들어간다.
 *   반드시 `@/shared/lib/googleSheets` 폴더 경로로 직접 import 할 것.
 *
 * 🔴 데이터 소유권 — 가계부 행은 **사용자의 구글 시트에만** 산다. 로컬에 남는 것은 시트 ID·탭 ID·열 인덱스뿐이다.
 * 🔴 액세스 토큰은 **메모리에만** 산다.
 * 🔴 시트 ID·파일명·탭 제목·열 이름·금액은 준PII 다 — GA 파라미터·로그로 내보내지 마라.
 */

export * from './config';
export * from './types';
export * from './a1';
export * from './schema';
export * from './format';
export * from './parse';
export * from './mapping';
export * from './writeSafety';
export * from './auth';
export * from './picker';
export * from './sheetsApi';
export * from './ledger';
