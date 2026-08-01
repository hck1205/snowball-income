/**
 * 구글 시트 가계부 — **환경변수가 없으면 기능이 존재하지 않는다.**
 *
 * 이 앱의 기본 배포 형태는 "백엔드 없이 정적 배포"다. 가계부는 그 위에 **덧붙이는** 기능이라
 * `VITE_GOOGLE_*` 3개가 전부 있을 때만 켜지고, 없으면 앱은 지금과 100% 동일하게 동작한다.
 * 게이트 구조는 커뮤니티(`shared/lib/supabase/client.ts`)와 같은 패턴이다.
 *
 * 🔴 데이터 소유권 — 가계부 행은 **사용자의 구글 시트에만** 산다. 우리 DB·IndexedDB·localStorage 에
 *    가계부 행을 저장하지 않는다(로컬에 두는 것은 시트 ID + 열 매핑뿐 → `mapping.ts`).
 */

/**
 * 요청하는 OAuth 스코프 — **이 하나뿐이다.**
 *
 * `drive.file` 은 "사용자가 이 앱으로 만들었거나, 피커로 직접 고른 파일"에만 접근한다. Sheets API v4 의
 * `spreadsheets.create` · `spreadsheets.batchUpdate` · `values.get/update/batchUpdate` 레퍼런스가 각각
 * 허용 스코프로 `drive.file` 을 직접 나열한다(확인 완료).
 *
 * 🚫 `spreadsheets` / `spreadsheets.readonly` 를 요청하지 마라 — 민감 스코프라 앱 검증(수 주)에 걸린다.
 *    이 상수 외의 스코프 문자열이 폴더에 등장하면 소스 가드가 실패한다.
 */
export const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** 기능을 켜는 데 필요한 환경변수 3종. 하나라도 없으면 "반쯤 켜진 상태"를 만들지 않고 전부 끈다. */
export type GoogleSheetsEnv = {
  /** OAuth 클라이언트 ID(공개값). GIS 토큰 클라이언트가 쓴다. */
  clientId: string;
  /** Picker developer key(공개값). */
  apiKey: string;
  /** Picker `setAppId` 용 Cloud 프로젝트 **번호**(숫자 문자열). 프로젝트 **ID** 가 아니다. */
  projectNumber: string;
};

/** 문자열이고, 공백 제거 후 비어 있지 않을 때만 값으로 인정한다. */
const readString = (source: Record<string, unknown>, key: string): string | undefined => {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * 순수 함수 — 환경변수 소스에서 가계부 설정을 읽는다.
 * (`import.meta.env` 를 직접 읽지 않고 주입받아서 테스트 가능하게 만든다)
 *
 * 셋 중 하나라도 없으면 `null` → 기능 전체 비활성. 특히 `VITE_GOOGLE_PROJECT_NUMBER` 누락은
 * Picker 가 조용히 안 뜨는 가장 흔한 실패 지점이라, 여기서 "설정 실수"로 잡아 아예 끈다.
 */
export const readGoogleSheetsEnv = (source: Record<string, unknown>): GoogleSheetsEnv | null => {
  const clientId = readString(source, 'VITE_GOOGLE_CLIENT_ID');
  const apiKey = readString(source, 'VITE_GOOGLE_API_KEY');
  const projectNumber = readString(source, 'VITE_GOOGLE_PROJECT_NUMBER');
  if (!clientId || !apiKey || !projectNumber) return null;
  return { clientId, apiKey, projectNumber };
};

/** 꺼져 있는데 호출했을 때. UI 가 이걸 볼 일은 없어야 정상이다(진입점을 렌더하지 않으면 된다). */
export class GoogleSheetsDisabledError extends Error {
  constructor() {
    super(
      '가계부 연동이 비활성화되어 있습니다 (VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_API_KEY / VITE_GOOGLE_PROJECT_NUMBER 미설정)'
    );
    this.name = 'GoogleSheetsDisabledError';
  }
}

const GOOGLE_SHEETS_ENV = readGoogleSheetsEnv(import.meta.env as unknown as Record<string, unknown>);

/** UI 가 읽는 플래그. false 면 가계부 진입점(메뉴·라우트·버튼)을 아예 렌더하지 않으면 된다. */
export const isGoogleSheetsEnabled: boolean = GOOGLE_SHEETS_ENV !== null;

/** 설정을 읽는다. 꺼져 있으면 `null`. */
export const getGoogleSheetsEnv = (): GoogleSheetsEnv | null => GOOGLE_SHEETS_ENV;

/** 설정이 반드시 있어야 하는 호출부용. 없으면 던진다. */
export const requireGoogleSheetsEnv = (): GoogleSheetsEnv => {
  if (!GOOGLE_SHEETS_ENV) throw new GoogleSheetsDisabledError();
  return GOOGLE_SHEETS_ENV;
};
