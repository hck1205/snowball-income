// @vitest-environment node — 환경변수 게이트만 본다. DOM 없음.
import { describe, expect, it } from 'vitest';

import {
  GOOGLE_SHEETS_SCOPE,
  GoogleSheetsDisabledError,
  isGoogleSheetsEnabled,
  readGoogleSheetsEnv,
  requireGoogleSheetsEnv
} from '@/shared/lib/googleSheets';

const FULL = {
  VITE_GOOGLE_CLIENT_ID: '1234-abc.apps.googleusercontent.com',
  VITE_GOOGLE_API_KEY: 'AIzaSyExampleKey',
  VITE_GOOGLE_PROJECT_NUMBER: '987654321012'
};

describe('가계부 환경변수 게이트', () => {
  it('세 값이 모두 있으면 설정을 만든다', () => {
    expect(readGoogleSheetsEnv(FULL)).toEqual({
      clientId: '1234-abc.apps.googleusercontent.com',
      apiKey: 'AIzaSyExampleKey',
      projectNumber: '987654321012'
    });
  });

  it.each([
    ['VITE_GOOGLE_CLIENT_ID'],
    ['VITE_GOOGLE_API_KEY'],
    ['VITE_GOOGLE_PROJECT_NUMBER']
  ])('%s 가 없으면 기능 전체가 꺼진다 (반쯤 켜진 상태 금지)', (missingKey) => {
    const source: Record<string, unknown> = { ...FULL };
    delete source[missingKey];
    expect(readGoogleSheetsEnv(source)).toBeNull();
  });

  it('공백만 있는 값은 없는 것으로 본다', () => {
    expect(readGoogleSheetsEnv({ ...FULL, VITE_GOOGLE_API_KEY: '   ' })).toBeNull();
  });

  it('문자열이 아닌 값은 없는 것으로 본다', () => {
    expect(readGoogleSheetsEnv({ ...FULL, VITE_GOOGLE_PROJECT_NUMBER: 987654321012 })).toBeNull();
  });

  it('앞뒤 공백은 잘라낸다', () => {
    const trimmed = readGoogleSheetsEnv({ ...FULL, VITE_GOOGLE_CLIENT_ID: '  client-id  ' });
    expect(trimmed?.clientId).toBe('client-id');
  });
});

describe('기본 배포 형태 = 꺼짐', () => {
  it('테스트 환경에는 구글 자격증명이 없어 기능이 꺼져 있다', () => {
    // vitest.config.ts 가 VITE_GOOGLE_* 를 빈 문자열로 고정한다 — 개발자 로컬 .env 에 좌우되지 않는다.
    expect(import.meta.env.VITE_GOOGLE_CLIENT_ID).toBe('');
    expect(isGoogleSheetsEnabled).toBe(false);
  });

  it('꺼진 채로 설정을 요구하면 전용 에러를 던진다', () => {
    expect(() => requireGoogleSheetsEnv()).toThrow(GoogleSheetsDisabledError);
  });
});

describe('OAuth 스코프', () => {
  it('요청하는 스코프는 drive.file 하나뿐이다', () => {
    // 🔴 spreadsheets / spreadsheets.readonly 는 민감 스코프라 앱 검증에 걸린다.
    expect(GOOGLE_SHEETS_SCOPE).toBe('https://www.googleapis.com/auth/drive.file');
  });
});
