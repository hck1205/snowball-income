// @vitest-environment node — 토큰 수명·스코프·피커 파라미터의 순수 규칙.
import { describe, expect, it } from 'vitest';

import {
  GOOGLE_SHEETS_SCOPE,
  PICKER_MIME_TYPE,
  TOKEN_EXPIRY_SKEW_SECONDS,
  buildPickerRequirements,
  createAccessTokenStore,
  hasRequiredScope,
  isAccessTokenUsable,
  isPickerCancelled,
  openSpreadsheetPicker,
  readPickedSpreadsheet,
  requestAccessToken,
  toAccessToken,
  type GoogleSheetsEnv
} from '@/shared/lib/googleSheets';

const ENV: GoogleSheetsEnv = {
  clientId: 'client-id.apps.googleusercontent.com',
  apiKey: 'AIzaSyExample',
  projectNumber: '987654321012'
};

describe('토큰 수명 — 하드코딩하지 않는다', () => {
  it('응답의 expires_in 으로 만료 시각을 계산한다 (여유분을 뺀다)', () => {
    const token = toAccessToken({ access_token: 'abc', expires_in: 3599, scope: GOOGLE_SHEETS_SCOPE }, 1_000_000);
    expect(token).toEqual({ value: 'abc', expiresAt: 1_000_000 + (3599 - TOKEN_EXPIRY_SKEW_SECONDS) * 1000 });
  });

  it('🔴 expires_in 이 없으면 수명을 지어내지 않는다 (1시간을 가정하지 않는다)', () => {
    expect(toAccessToken({ access_token: 'abc' }, 0)?.expiresAt).toBeNull();
    expect(toAccessToken({ access_token: 'abc', expires_in: -5 }, 0)?.expiresAt).toBeNull();
    expect(toAccessToken({ access_token: 'abc', expires_in: 'soon' }, 0)?.expiresAt).toBeNull();
  });

  it('문자열로 온 expires_in 도 읽는다', () => {
    expect(toAccessToken({ access_token: 'abc', expires_in: '600' }, 0)?.expiresAt).toBe(
      (600 - TOKEN_EXPIRY_SKEW_SECONDS) * 1000
    );
  });

  it('토큰 값이 없으면 토큰이 아니다', () => {
    expect(toAccessToken({ expires_in: 3600 }, 0)).toBeNull();
    expect(toAccessToken({ access_token: '   ' }, 0)).toBeNull();
    expect(toAccessToken(null, 0)).toBeNull();
  });

  it('만료를 모르는 토큰은 일단 쓴다 — 실패는 401 로 드러난다', () => {
    expect(isAccessTokenUsable({ value: 'abc', expiresAt: null }, Date.now())).toBe(true);
  });

  it('만료된 토큰은 쓰지 않는다', () => {
    expect(isAccessTokenUsable({ value: 'abc', expiresAt: 100 }, 101)).toBe(false);
    expect(isAccessTokenUsable({ value: 'abc', expiresAt: 100 }, 99)).toBe(true);
  });
});

describe('토큰 보관소 — 메모리에만', () => {
  it('저장했다 읽고, 지우면 사라진다', () => {
    let now = 0;
    const store = createAccessTokenStore(() => now);
    store.write({ value: 'abc', expiresAt: 1000 });
    expect(store.read()?.value).toBe('abc');
    store.clear();
    expect(store.read()).toBeNull();
  });

  it('만료된 토큰은 읽히지 않는다', () => {
    let now = 0;
    const store = createAccessTokenStore(() => now);
    store.write({ value: 'abc', expiresAt: 500 });
    now = 501;
    expect(store.read()).toBeNull();
  });
});

describe('스코프 확인', () => {
  it('응답 스코프에 drive.file 이 있어야 한다', () => {
    expect(hasRequiredScope({ scope: `${GOOGLE_SHEETS_SCOPE} openid` })).toBe(true);
  });

  it('🔴 사용자가 동의를 해제하면 토큰이 있어도 접근할 수 없다', () => {
    expect(hasRequiredScope({ scope: 'openid email' })).toBe(false);
    expect(hasRequiredScope({})).toBe(false);
  });

  it('부분 문자열 일치로 통과시키지 않는다', () => {
    expect(hasRequiredScope({ scope: 'https://www.googleapis.com/auth/drive.file.readonly' })).toBe(false);
  });
});

describe('피커 파라미터 — 누락이 가장 흔한 실패 지점', () => {
  it('세 값이 다 있으면 요구사항을 만든다', () => {
    const result = buildPickerRequirements(ENV, 'token-abc');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      oauthToken: 'token-abc',
      developerKey: 'AIzaSyExample',
      appId: '987654321012',
      mimeTypes: PICKER_MIME_TYPE
    });
  });

  it('🔴 토큰 없이 피커를 열 수 없다 — 순서가 뒤바뀌면 조용히 실패한다', () => {
    const result = buildPickerRequirements(ENV, '   ');
    expect(result.ok === false && result.error.code).toBe('not-authorized');
  });

  it('🔴 프로젝트 "번호" 가 아니면(=프로젝트 ID) 막는다', () => {
    const result = buildPickerRequirements({ ...ENV, projectNumber: 'my-project-id' }, 'token-abc');
    expect(result.ok === false && result.error.code).toBe('disabled');
  });

  it('developer key 가 비면 막는다', () => {
    expect(buildPickerRequirements({ ...ENV, apiKey: '' }, 'token-abc').ok).toBe(false);
  });

  it('스프레드시트만 고를 수 있다', () => {
    expect(PICKER_MIME_TYPE).toBe('application/vnd.google-apps.spreadsheet');
  });
});

describe('피커 결과 해석', () => {
  it('고른 시트의 ID 만 읽고 파일명은 버린다 (준PII)', () => {
    const picked = readPickedSpreadsheet({ action: 'picked', docs: [{ id: 'sheet-9', name: '우리집 가계부' }] });
    expect(picked).toEqual({ spreadsheetId: 'sheet-9' });
  });

  it('취소는 실패가 아니다', () => {
    expect(isPickerCancelled({ action: 'cancel' })).toBe(true);
    expect(readPickedSpreadsheet({ action: 'cancel' })).toBeNull();
  });
});

describe('꺼진 상태에서의 호출', () => {
  it('환경변수가 없으면 토큰을 요청하지 않고 disabled 를 돌려준다', async () => {
    const result = await requestAccessToken();
    expect(result.ok === false && result.error.code).toBe('disabled');
  });

  it('환경변수가 없으면 피커도 열지 않는다', async () => {
    const result = await openSpreadsheetPicker({ accessToken: 'token-abc' });
    expect(result.ok === false && result.error.code).toBe('disabled');
  });
});
