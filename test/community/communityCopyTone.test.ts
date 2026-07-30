// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 커뮤니티 카피 어미 계약 — **소스 레벨**로 잠근다.
 *
 * 앱 전체 카피는 격식체("~습니다")로 통일한다(확정 결정). 요청·권유는 격식체 안에서
 * "~해 주세요"·"~하세요"를 쓴다. 커뮤니티만 해요체("~해요/~돼요/~없어요/~이에요/~할까요")로
 * 남아 있어 화면을 옮길 때마다 말투가 갈리던 것을 2026-07-30 에 정리했다.
 *
 * 렌더 테스트로는 못 잡는다. 문장 하나가 해요체로 되돌아가도 그 화면의 테스트는 그대로 통과하고
 * (문구를 단정하는 테스트가 붙은 카피는 극히 일부다), 어긋남은 "갤러리 → 프로필"처럼 화면을
 * **연달아** 봐야 드러난다. 그래서 문자열 자체를 소스에서 훑는다.
 *
 * ## 무엇을 보나
 * - 대상: `shared/constants/community` · `components/community` · `pages/Community` 의 `.ts`/`.tsx`.
 * - 접근성 텍스트(`aria-label`·`alt`)도 **같은 규칙**이다 — 눈에 안 보인다고 말투가 달라지면
 *   스크린리더 사용자만 다른 앱을 쓰는 셈이다. 그래서 문자열을 구분하지 않고 전부 본다.
 * - 제외: `*.test.ts(x)`(목 데이터의 **사용자 게시글 본문**은 앱 카피가 아니다),
 *   `*.styled.ts`(CSS), 그리고 **주석**(설계 메모는 카피가 아니고, 이 규칙 자체를 설명하려면
 *   금지어를 적어야 한다).
 *
 * ## 화이트리스트
 * - `좋아요` — 어미가 아니라 **기능 이름(명사)**이다. 그 자체로 하나의 라벨인 경우만 통과시킨다
 *   (`'좋아요'`). 문장 중간의 "좋아요·댓글", "좋아요 처리에 실패했습니다"는 어미 자리가 아니라
 *   애초에 걸리지 않는다.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const ROOTS = ['shared/constants/community', 'components/community', 'pages/Community'];

const collect = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collect(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) && !/\.styled\.ts$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

/**
 * 주석 제거. 블록 주석과 줄 주석을 지우되, `https://` 처럼 **콜론 뒤의 `//`** 는 URL 이라 남긴다
 * (`linkUrlPlaceholder: 'https://'`).
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/**
 * 해요체 종결어미 후보. 어미 목록을 열거하지 않고 **"문장 끝에 오는 `요`/`죠`"** 를 통째로 잡는다 —
 * 해요체는 활용에 따라 끝 음절이 제각각이라(`없어요`·`사라져요`·`이에요`·`할까요`·`보여요`)
 * 열거하면 반드시 빠뜨린다.
 *
 * **문장 끝 자리에서만** 본다 — 종결 부호(`.?!…`)나 문자열/JSX 텍스트의 끝(따옴표·백틱·`<`·개행)이
 * 뒤따를 때. 그래야 "좋아요·댓글", "주요 메뉴" 처럼 어미 자리가 아닌 `요`를 건드리지 않는다.
 */
const SENTENCE_FINAL_YO = /[가-힣]*[가-힣](?:요|죠)(?=[.?!…'"`<\n]|$)/g;

/**
 * 걸러낼 것 2종.
 * - `~세요` — 격식체 안의 **요청·권유**형이라 허용이다("남겨 주세요", "고르세요").
 * - `좋아요` — 어미가 아니라 **기능 이름(명사)**. 문장 중간의 "좋아요·댓글"은 애초에 안 걸리고,
 *   `likeAria` 처럼 그 자체가 라벨인 경우만 여기서 통과한다.
 */
const NOUN_ALLOWLIST = new Set(['좋아요']);
const isAllowed = (word: string): boolean => word.endsWith('세요') || NOUN_ALLOWLIST.has(word);

const findInformal = (text: string): string[] =>
  [...text.matchAll(SENTENCE_FINAL_YO)].map((match) => match[0]).filter((word) => !isAllowed(word));

type Hit = { path: string; text: string };

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root))).map((file) => ({
  path: relative(REPO_ROOT, file).split(sep).join('/'),
  source: stripComments(readFileSync(file, 'utf-8'))
}));

const HITS: Hit[] = FILES.flatMap(({ path, source }) => findInformal(source).map((text) => ({ path, text })));

describe('커뮤니티 카피 어미', () => {
  it('스캔 대상 파일을 실제로 찾는다 (경로가 바뀌면 무음 통과하지 않게)', () => {
    expect(FILES.length).toBeGreaterThan(30);
    expect(FILES.some(({ path }) => path === 'shared/constants/community/copy.ts')).toBe(true);
  });

  it('사용자에게 보이는 문자열에 해요체 어미가 없다', () => {
    const report = HITS.map(({ path, text }) => `${path} — "${text}"`);
    expect(report).toEqual([]);
  });

  it('격식체 카피와 명사 "좋아요"는 그대로 통과시킨다 (탐지기 자체 검증)', () => {
    const formal = [
      '아직 글이 없습니다',
      '첫 글을 남겨 주세요.',
      '첨부할 시나리오를 고르세요.',
      '좋아요·댓글을 남길 수 있습니다.',
      '좋아요 처리에 실패했습니다.',
      '좋아요',
      '주요 메뉴'
    ];
    for (const line of formal) {
      expect(findInformal(line)).toEqual([]);
    }
  });

  it('해요체가 되돌아오면 잡는다 (탐지기 자체 검증)', () => {
    const informal = [
      '아직 글이 없어요',
      '나가면 사라져요.',
      '댓글을 삭제할까요?',
      '세후 월 배당 기준이에요.',
      '새 닉네임이 보여요.',
      '갤러리에 노출돼요.',
      '그렇게 하죠.'
    ];
    for (const line of informal) {
      expect(findInformal(line).length).toBeGreaterThan(0);
    }
  });
});
