// @vitest-environment node — 소스를 직접 읽어 지키는 계약(런타임 테스트로는 잡히지 않는다).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LEDGER_ERROR_MESSAGE, ledgerError } from '@/shared/lib/googleSheets';

const MODULE_DIR = join(process.cwd(), 'shared', 'lib', 'googleSheets');

const sourceFiles = readdirSync(MODULE_DIR).filter((file) => file.endsWith('.ts'));

/** 주석은 먼저 지운다 — 주석 속 설명이 가드에 걸리면 아무도 가드를 못 고친다. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const read = (file: string): string => stripComments(readFileSync(join(MODULE_DIR, file), 'utf8'));

describe('가드 자체가 살아 있는지', () => {
  it('검사 대상 파일이 실제로 잡힌다', () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(10);
    expect(sourceFiles).toContain('index.ts');
  });
});

describe('🔴 액세스 토큰은 메모리에만 산다', () => {
  const STORAGE_API = /localStorage|sessionStorage|document\.cookie|indexedDB/;

  /**
   * 저장소를 만질 수 있는 파일의 **허용 목록**.
   *
   * 🔴 여기 이름을 더할 때는 반드시 "무엇을 저장하고, 왜 그것은 가계부 값이 아닌가"를 함께 적어라.
   *    이유 없이 늘어나면 이 가드는 "예외 목록"이 되어 존재 의미가 사라진다.
   *
   *   - `mapping.ts`      — 시트 ID · 탭 ID · 열 인덱스. "이 시트를 어떻게 읽을지"의 설정이고
   *                          가계부 행(날짜·금액·메모)은 한 글자도 담기지 않는다.
   *   - `valueMapping.ts` — 학습된 **별칭표**("식료품비 → 식비"). 사람의 어휘 사전이지 가계부 값이
   *                          아니다. 이게 없으면 사용자가 한 번 이어 준 답을 매번 다시 물어야 해서
   *                          매핑이 한 번 쓰고 버려진다(2026-08-08 P3).
   *
   * 🔴 토큰을 다루는 `auth.ts` 는 **영원히 여기 오면 안 된다** — 오는 순간
   *    "탭을 닫으면 사라진다"는 전제가 깨진다.
   */
  const STORAGE_ALLOWED = ['mapping.ts', 'valueMapping.ts'];

  it('저장소 API 를 쓰는 파일은 허용 목록뿐이다', () => {
    const offenders = sourceFiles.filter((file) => STORAGE_API.test(read(file)));

    expect(offenders).toEqual(STORAGE_ALLOWED);
  });

  it('🔴 토큰을 다루는 파일은 저장소를 만지지 않는다', () => {
    expect(STORAGE_API.test(read('auth.ts'))).toBe(false);
  });
});

describe('🔴 요청하는 스코프는 drive.file 하나뿐이다', () => {
  it('민감 스코프 문자열이 코드에 없다', () => {
    const scopes = new Set<string>();
    for (const file of sourceFiles) {
      for (const match of read(file).matchAll(/https:\/\/www\.googleapis\.com\/auth\/[A-Za-z.]+/g)) {
        scopes.add(match[0]);
      }
    }
    // spreadsheets / spreadsheets.readonly 는 앱 검증(수 주)에 걸린다.
    expect([...scopes]).toEqual(['https://www.googleapis.com/auth/drive.file']);
  });
});

describe('🔴 준PII 를 로그·계측으로 내보내지 않는다', () => {
  it('콘솔 출력이 없다', () => {
    const offenders = sourceFiles.filter((file) => /console\.(log|info|warn|error|debug)/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('계측(GA) 을 부르지 않는다', () => {
    const offenders = sourceFiles.filter((file) => /analytics|gtag|dataLayer/i.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('실패 문구는 정적이라 값이 섞일 수 없다', () => {
    for (const [code, message] of Object.entries(LEDGER_ERROR_MESSAGE)) {
      expect(ledgerError(code as keyof typeof LEDGER_ERROR_MESSAGE).message).toBe(message);
      expect(message).not.toMatch(/[0-9]{3,}/); // 금액·ID 조각이 들어갈 자리가 없다
    }
  });
});

describe('🔴 서버리스 프록시를 두지 않는다', () => {
  it('api/ 에 구글 시트 호출이 없다', () => {
    // CORS 가 실측으로 통과하므로 프록시가 필요 없다 — 생기면 토큰이 서버를 지나게 된다.
    const apiDir = join(process.cwd(), 'api');
    const offenders = readdirSync(apiDir)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
      .filter((file) => /sheets\.googleapis\.com|googleSheets/.test(readFileSync(join(apiDir, file), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('초기 번들 예산', () => {
  it('가계부 모듈은 shared/lib 배럴에 물려 있지 않다', () => {
    // `@/shared/lib` 는 앱 전역에서 import 된다 — 여기 물리면 가계부를 안 쓰는 사용자도 받는다.
    const barrel = readFileSync(join(process.cwd(), 'shared', 'lib', 'index.ts'), 'utf8');
    expect(barrel).not.toContain('googleSheets');
  });

  it('GIS·피커 스크립트는 지연 로드한다 (정적 script 태그 없음)', () => {
    const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(indexHtml).not.toContain('accounts.google.com/gsi/client');
    expect(indexHtml).not.toContain('apis.google.com/js/api.js');
  });
});
