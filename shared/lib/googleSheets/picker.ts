/**
 * 구글 드라이브 피커 — **필수다.**
 *
 * `drive.file` 스코프에서는 앱이 "내 드라이브 목록"을 스스로 나열할 수 없다(앱이 만들었거나 사용자가
 * 피커로 고른 파일만 보인다). 시트 URL 을 붙여넣게 하는 우회도 **안 된다** — 붙여넣은 ID 에 접근권이
 * 생기지 않는다. 즉 기존 시트를 고르는 유일한 길이 피커다.
 *
 * 🔴 누락이 가장 흔한 실패 지점 세 가지를 **계획 단계에서** 잡는다:
 *    `setOAuthToken` · `setDeveloperKey` · `setAppId`(Cloud 프로젝트 **번호**, 숫자).
 * 🔴 **토큰을 먼저 받고 피커를 연다.** 순서가 뒤바뀌면 조용히 실패한다 — 그래서 `accessToken` 은
 *    선택 인자가 아니라 필수 인자이고, 빈 문자열이면 계획이 만들어지지 않는다.
 */
import { getGoogleSheetsEnv } from './config';
import type { GoogleSheetsEnv } from './config';
import type { LedgerResult } from './types';
import { ledgerErr, ledgerOk, ledgerError } from './types';

/** gapi 로더. 지연 로드한다. */
export const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';

/** 피커가 보여 줄 것 — 스프레드시트만. */
export const PICKER_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';

/** 피커를 띄우는 데 필요한 값 3종. 하나라도 비면 피커가 조용히 안 뜬다. */
export type PickerRequirements = {
  readonly oauthToken: string;
  readonly developerKey: string;
  /** Cloud 프로젝트 **번호**(숫자 문자열). 프로젝트 ID(문자 포함)를 넣으면 동작하지 않는다. */
  readonly appId: string;
  readonly mimeTypes: string;
};

/**
 * 순수 함수 — 피커 파라미터를 검증해 만든다. 프로젝트 번호가 숫자가 아니면 **설정 실수**로 보고 막는다
 * (프로젝트 ID 를 잘못 넣는 것이 실제로 가장 흔하다).
 */
export const buildPickerRequirements = (
  env: GoogleSheetsEnv,
  accessToken: string
): LedgerResult<PickerRequirements> => {
  if (accessToken.trim().length === 0) return ledgerErr(ledgerError('not-authorized'));
  if (env.apiKey.trim().length === 0) return ledgerErr(ledgerError('disabled'));
  if (!/^\d+$/.test(env.projectNumber.trim())) return ledgerErr(ledgerError('disabled'));

  return ledgerOk({
    oauthToken: accessToken,
    developerKey: env.apiKey,
    appId: env.projectNumber.trim(),
    mimeTypes: PICKER_MIME_TYPE
  });
};

export type PickedSpreadsheet = {
  readonly spreadsheetId: string;
};

/** 피커 콜백 데이터에서 스프레드시트 ID 만 뽑는다. 파일명은 **의도적으로 버린다**(준PII). */
export const readPickedSpreadsheet = (data: unknown): PickedSpreadsheet | null => {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.action !== 'picked') return null;
  const docs = record.docs;
  if (!Array.isArray(docs) || docs.length === 0) return null;
  const first = docs[0];
  if (!first || typeof first !== 'object') return null;
  const id = (first as Record<string, unknown>).id;
  if (typeof id !== 'string' || id.length === 0) return null;
  return { spreadsheetId: id };
};

/** 사용자가 취소했는지. 취소는 실패가 아니다. */
export const isPickerCancelled = (data: unknown): boolean =>
  !!data && typeof data === 'object' && (data as Record<string, unknown>).action === 'cancel';

/* ── 브라우저 부분 ──────────────────────────────────────────────────────────── */

type PickerBuilder = {
  addView: (view: unknown) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setCallback: (callback: (data: unknown) => void) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

type DocsViewCtor = new (viewId?: unknown) => {
  setIncludeFolders: (value: boolean) => unknown;
  setMimeTypes: (mimeTypes: string) => unknown;
  setSelectFolderEnabled: (value: boolean) => unknown;
};

type PickerNamespace = {
  PickerBuilder: new () => PickerBuilder;
  DocsView: DocsViewCtor;
  ViewId: Record<string, unknown>;
};

type GapiNamespace = {
  load: (name: string, callback: () => void) => void;
  picker?: { api?: PickerNamespace };
};

let pickerPromise: Promise<PickerNamespace> | null = null;

const readGapi = (): GapiNamespace | null => {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as Record<string, unknown>).gapi;
  if (!candidate || typeof candidate !== 'object') return null;
  return candidate as GapiNamespace;
};

const readPickerNamespace = (): PickerNamespace | null => {
  if (typeof window === 'undefined') return null;
  const google = (window as unknown as Record<string, unknown>).google;
  if (!google || typeof google !== 'object') return null;
  const picker = (google as Record<string, unknown>).picker;
  if (!picker || typeof picker !== 'object') return null;
  return picker as PickerNamespace;
};

/** gapi + picker 모듈을 한 번만 불러오고 메모이즈한다. */
export const loadPickerApi = (): Promise<PickerNamespace> => {
  if (pickerPromise) return pickerPromise;

  pickerPromise = new Promise<PickerNamespace>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('브라우저 환경에서만 피커를 초기화할 수 있습니다.'));
      return;
    }

    const finish = (): void => {
      const gapi = readGapi();
      if (!gapi) {
        reject(new Error('구글 피커를 불러오지 못했습니다.'));
        return;
      }
      gapi.load('picker', () => {
        const namespace = readPickerNamespace();
        if (namespace) resolve(namespace);
        else reject(new Error('구글 피커를 불러오지 못했습니다.'));
      });
    };

    if (readGapi()) {
      finish();
      return;
    }

    const script = document.createElement('script');
    script.src = GAPI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error('구글 피커를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    pickerPromise = null;
    throw error;
  });

  return pickerPromise;
};

/**
 * 피커를 연다. 사용자가 취소하면 `null`(실패가 아니다).
 * `accessToken` 은 **이미 받아 둔 토큰**이어야 한다 — 이 함수는 토큰을 요청하지 않는다.
 */
export const openSpreadsheetPicker = async (params: {
  readonly accessToken: string;
}): Promise<LedgerResult<PickedSpreadsheet | null>> => {
  const env = getGoogleSheetsEnv();
  if (!env) return ledgerErr(ledgerError('disabled'));

  const requirements = buildPickerRequirements(env, params.accessToken);
  if (!requirements.ok) return ledgerErr(requirements.error);

  let picker: PickerNamespace;
  try {
    picker = await loadPickerApi();
  } catch {
    return ledgerErr(ledgerError('network-error'));
  }

  return new Promise<LedgerResult<PickedSpreadsheet | null>>((resolve) => {
    const view = new picker.DocsView(picker.ViewId.SPREADSHEETS);
    view.setIncludeFolders(false);
    view.setSelectFolderEnabled(false);
    view.setMimeTypes(requirements.value.mimeTypes);

    const built = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(requirements.value.oauthToken)
      .setDeveloperKey(requirements.value.developerKey)
      .setAppId(requirements.value.appId)
      .setCallback((data: unknown) => {
        if (isPickerCancelled(data)) {
          resolve(ledgerOk(null));
          return;
        }
        const picked = readPickedSpreadsheet(data);
        if (picked) resolve(ledgerOk(picked));
      })
      .build();

    built.setVisible(true);
  });
};

/** 테스트용 — 메모이즈된 피커 프로미스를 버린다. */
export const resetPickerForTest = (): void => {
  pickerPromise = null;
};
