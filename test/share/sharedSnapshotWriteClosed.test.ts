// @vitest-environment node — 소스를 파일로 읽는 가드 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 공유 링크의 **DB 쓰기 경로가 닫힌 채로 있는지** 지킨다 (2026-08-09 결정).
 *
 * ## 무엇을 지키나
 *
 * 앱은 공유 링크를 **lz-string `?share=` 한 길로만** 만든다. `shared_snapshots` 테이블에 새로
 * 써서 짧은 `?s=` 링크를 주던 길은 닫혔다 — 그 RPC 는 로그인 없이 누구나 부를 수 있는데
 * 횟수 제한도 만료도 정리도 없어서, 반복 호출만으로 무료 용량을 채울 수 있었다.
 *
 * 동시에 **이미 나간 `?s=` 링크는 계속 열려야 한다.** 공유 URL 은 사용자 자산이다.
 *
 * ## 🔴 왜 소스를 읽어서 지키나
 *
 * 이 계약은 깨져도 **아무 오류가 안 난다.**
 *   · 쓰기를 되살리면 → 기능은 멀쩡히 동작한다. 구멍만 조용히 돌아온다.
 *   · 읽기를 지우면 → 남이 받은 옛 링크만 안 열린다. 우리 화면에서는 안 보인다.
 * 렌더 테스트로는 "안 일어나야 할 일"과 "계속 일어나야 할 일"을 둘 다 잡을 수 없다.
 *
 * ⚠ 실제로 이 자리에 테스트가 **하나도 없었다.** 쓰기 경로를 통째로 들어내는 변경을 했는데
 *   기존 테스트가 전부 초록이었다 — 그래서 이 파일을 만들었다.
 * ⚠ 파일을 읽는 테스트라 모듈 그래프에 안 잡힌다. `verify --quick` 의 레포 전수 가드로 돈다.
 */

const REPO_ROOT = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf8');

/**
 * 생성 RPC 이름을 **입에 올려도 되는** 자리.
 *
 * 🔴 여기 없는 파일에서 이 이름이 나오면 쓰기 경로가 되살아난 것이다. 되살리려면 **레이트리밋을
 *    함께** 붙이고, 이 목록과 마이그레이션 주석을 같이 고쳐라.
 */
const WRITE_RPC_ALLOWLIST = [
  /* IO 레이어의 정의. 호출하는 곳이 없어 무해하고, 되돌릴 때 로직을 다시 쓰지 않게 남겨 둔다. */
  'shared/lib/supabase/sharedSnapshots.ts',
  /* 생성된 DB 타입 — 함수가 DB 에 남아 있으므로(권한만 회수) 여기 있는 게 정상이다. */
  'shared/lib/supabase/types.ts'
];

/** 앱 코드에서 훑을 폴더. 테스트·마이그레이션·문서는 대상이 아니다. */
const APP_DIRS = ['pages', 'components', 'jotai', 'shared', 'server', 'utils', 'router'];

const collectSources = (dir: string, found: string[] = []): string[] => {
  const { readdirSync } = require('node:fs') as typeof import('node:fs');
  for (const entry of readdirSync(join(REPO_ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collectSources(rel, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(rel);
  }
  return found;
};

/**
 * 주석 줄을 뺀 소스.
 *
 * 🔴 이게 없으면 **이 규칙을 설명하는 주석 자체가 위반으로 잡힌다.** 실제로 그랬다 — 왜 쓰기를
 * 닫았는지 적은 주석에 함수 이름이 들어가 있어서 가드가 자기 근거를 범인으로 지목했다.
 * 규칙을 설명하지 못하게 만드는 가드는 결국 주석을 지우게 만든다.
 *
 * ⚠ 줄 단위 판정이라 `const x = 1; // create_shared_snapshot` 같은 꼬리 주석은 못 거른다.
 *   이 레포의 주석은 거의 전부 JSDoc 블록이라 실용상 충분하고, 못 걸러도 **거짓 양성**(불필요한
 *   실패)이지 거짓 음성(놓침)이 아니다 — 안전한 방향으로 틀린다.
 */
const codeOnly = (source: string): string =>
  source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('*') && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    })
    .join('\n');

describe('🔴 공유 스냅샷 — 쓰기는 닫혀 있다', () => {
  it('⭐ 앱 코드 어디서도 생성 RPC 를 부르지 않는다', () => {
    const offenders = APP_DIRS.flatMap((dir) => collectSources(dir))
      .filter((path) => !WRITE_RPC_ALLOWLIST.includes(path))
      .filter((path) => /create_shared_snapshot|createSharedSnapshot/.test(codeOnly(read(path))));

    expect(
      offenders,
      `쓰기 경로가 되살아났다: ${offenders.join(', ')}\n` +
        '되살리는 것 자체는 괜찮지만 **레이트리밋을 함께** 붙여야 한다 — ' +
        'supabase/migrations/20260811000000_close_shared_snapshot_writes.sql 의 "되돌리는 법" 참고.'
    ).toEqual([]);
  });

  it('⭐ 공유 버튼이 만드는 URL 은 lz-string `?share=` 뿐이다', () => {
    const source = read('pages/Main/hooks/persistence/usePortfolioPersistence.ts');
    const createShareLink = codeOnly(source).slice(codeOnly(source).indexOf('const createShareLink'));
    const body = createShareLink.slice(0, createShareLink.indexOf('\n  };'));

    expect(body).toContain('buildShareUrl');
    /* `?s=` 를 만드는 함수가 여기 다시 들어오면 쓰기 경로가 돌아온 것이다. */
    expect(body).not.toContain('buildDbShareUrl');
  });

  it('마이그레이션이 생성 권한을 회수하고 조회 권한은 남긴다', () => {
    const sql = read('supabase/migrations/20260811000000_close_shared_snapshot_writes.sql');

    expect(sql).toMatch(/revoke execute on function public\.create_shared_snapshot/);
    expect(sql).toMatch(/grant execute on function public\.get_shared_snapshot/);
    /* 함수를 drop 하면 되돌리기가 "권한 한 줄"이 아니게 된다 — key 생성 로직이 그 안에만 있다. */
    expect(sql).not.toMatch(/drop function/i);
  });
});

describe('🔴 이미 나간 ?s= 링크는 계속 열린다', () => {
  /*
   * 읽기 경로는 셋이다. 하나만 사라져도 옛 링크 사용자에게만 보이는 고장이 된다:
   *   · 앱      — 링크를 열었을 때 시나리오를 복원한다
   *   · 미들웨어 — 크롤러에게 나가는 HTML 의 메타태그를 그 공유 내용으로 바꾼다
   *   · OG      — 미리보기 카드 그림을 그 공유 내용으로 그린다
   */
  it.each([
    ['앱(시나리오 복원)', 'pages/Main/hooks/persistence/usePortfolioPersistence.ts', /readDbShareKeyFromHref/],
    ['미들웨어(메타 치환)', 'middleware.ts', /searchParams\.get\('s'\)/],
    ['OG 카드', 'server/handlers/Og/Og.tsx', /searchParams\.get\('s'\)/],
    ['share-html', 'server/handlers/ShareHtml/ShareHtml.ts', /searchParams\.get\('s'\)/]
  ])('%s 가 아직 ?s= 를 읽는다', (_label, path, pattern) => {
    expect(read(path)).toMatch(pattern);
  });

  it('⭐ 조회 RPC 를 부르는 코드가 살아 있다 — 지우면 옛 링크가 전부 죽는다', () => {
    expect(read('shared/lib/supabase/sharedSnapshots.ts')).toContain('get_shared_snapshot');
    expect(read('shared/lib/og/sharedSnapshotRest.ts')).toContain('get_shared_snapshot');
  });
});
