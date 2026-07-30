// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 앱 카피 어미 계약 — **소스 레벨**로 잠근다.
 *
 * 앱 전체 카피는 격식체("~습니다")로 통일한다(확정 결정). 요청·권유는 격식체 안에서
 * "~해 주세요"·"~하세요"·"~해 보세요"를 쓴다. 2026-07-30 에 커뮤니티를 정리하고,
 * 2026-07-31 에 나머지 화면(클라우드 동기화·PDF 리포트·투어·비중 조절·통화·포트폴리오)까지
 * 넓히면서 이 가드도 **레포 전체**로 확대했다(원래는 커뮤니티 3개 폴더만 봤다).
 *
 * 렌더 테스트로는 못 잡는다. 문장 하나가 해요체로 되돌아가도 그 화면의 테스트는 그대로 통과하고
 * (문구를 단정하는 테스트가 붙은 카피는 극히 일부다), 어긋남은 "갤러리 → 프로필"처럼 화면을
 * **연달아** 봐야 드러난다. 그래서 문자열 자체를 소스에서 훑는다.
 *
 * ## 무엇을 보나
 * - 대상: 앱 코드 전체(`components`·`pages`·`shared`·`jotai`·`router`·`utils`·`api`·`server`)의 `.ts`/`.tsx`.
 * - 접근성 텍스트(`aria-label`·`alt`·`title`)도 **같은 규칙**이다 — 눈에 안 보인다고 말투가 달라지면
 *   스크린리더 사용자만 다른 앱을 쓰는 셈이다. 그래서 문자열을 구분하지 않고 전부 본다.
 * - 제외: `*.test.ts(x)`(목 데이터의 **사용자 게시글 본문**은 앱 카피가 아니다),
 *   `*.styled.ts`(CSS), 그리고 **주석**(설계 메모는 카피가 아니고, 이 규칙 자체를 설명하려면
 *   금지어를 적어야 한다).
 * - 제외: 개발자용 CLI(`tools/`·`scripts/`) — 사용자가 읽는 화면이 아니다.
 *
 * ## 예외 1 — 티커 FAQ의 `question`
 * `shared/constants/tickers/*`의 FAQ **질문**("SCHD 배당률은 얼마인가요?")은 앱이 사용자에게 하는
 * 말이 아니라 **사용자가 검색창에 치는 질문을 그대로 옮긴 것**이다(FAQPage 구조화 데이터의 질문 필드).
 * "얼마입니까?"로 바꾸면 검색 질의와 어긋나고 읽는 사람의 목소리도 아니게 된다. 그래서 `question:`
 * 값만 스캔에서 뺀다 — 같은 파일의 `answer`(앱의 목소리)는 **그대로 검사한다**.
 *
 * ## 예외 2 — 명사 화이트리스트
 * `개요`·`필요`는 어미가 아니라 명사다(`navLabel: '개요'`, `detailLabel: '확인 필요'`).
 * `좋아요`는 **둘 다**여서 문맥으로 가른다 — 아래 `isAllowed` 참고.
 */

const REPO_ROOT = resolve(__dirname, '../..');

/** 사용자에게 보이는 문자열이 사는 곳 전부. 새 최상위 폴더가 생기면 여기에 추가한다. */
const ROOTS = ['components', 'pages', 'shared', 'jotai', 'router', 'utils', 'api', 'server'];

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

/** 티커 FAQ의 질문 필드(한 줄 문자열)만 지운다. 위 "예외 1" 참고. */
const stripFaqQuestions = (source: string): string => source.replace(/^\s*question:\s*'[^\n]*$/gm, ' ');

/** 예외는 티커 콘텐츠에만 준다 — 다른 곳의 `question:`(예: 확인 모달)은 앱의 목소리라 그대로 본다. */
const TICKER_CONTENT_DIR = 'shared/constants/tickers/';

/**
 * 해요체 종결어미 후보. 어미 목록을 열거하지 않고 **"문장 끝에 오는 `요`/`죠`"** 를 통째로 잡는다 —
 * 해요체는 활용에 따라 끝 음절이 제각각이라(`없어요`·`사라져요`·`이에요`·`할까요`·`보여요`)
 * 열거하면 반드시 빠뜨린다.
 *
 * **문장 끝 자리에서만** 본다 — 종결 부호(`.?!…`)나 문자열/JSX 텍스트의 끝(따옴표·백틱·`<`·개행),
 * 그리고 조각을 잇는 구분자(`·`·`—`, 앞의 공백 포함)가 뒤따를 때. 구분자를 넣은 이유: 이 앱은
 * "저장됐어요 · 방금 전", "실패했어요 — 이 기기에는…"처럼 **가운뎃점·줄표로 잇는 문장**이 많아
 * 종결 부호만 보면 그대로 새어 나갔다(실제로 5건이 초기 스캔을 통과했다).
 */
const SENTENCE_FINAL_YO = /[가-힣]*[가-힣](?:요|죠)(?=[.?!…'"`<\n]|[ \t]*[·—]|$)/g;

/** 어미가 아니라 명사인 낱말. 새로 걸리면 **명사임이 분명할 때만** 추가한다. */
const NOUN_ALLOWLIST = new Set(['개요', '필요']);

/**
 * 통과시킬 것.
 * - `~세요` — 격식체 안의 **요청·권유**형이라 허용이다("남겨 주세요", "고르세요", "계산해 보세요").
 * - 명사(`개요`·`필요`).
 * - `좋아요` — **기능 이름(명사)일 때만**. "추천 포트폴리오로 시작해도 좋아요"처럼 앞에 다른 한글이
 *   붙으면 그건 형용사 어미다(실제로 투어 문구가 이 구멍으로 새 있었다). 그래서 앞이 한글이 아닐 때
 *   (`'좋아요'`·`'좋아요 취소'`처럼 라벨의 시작)나 기능 나열(`좋아요·댓글`)일 때만 통과시킨다.
 */
const isAllowed = (text: string, word: string, index: number): boolean => {
  if (word.endsWith('세요') || NOUN_ALLOWLIST.has(word)) return true;
  if (word !== '좋아요') return false;
  const before = text.slice(0, index).trimEnd().slice(-1);
  const after = text.slice(index + word.length).trimStart().slice(0, 1);
  return !/[가-힣]/.test(before) || after === '·';
};

const findInformal = (text: string): string[] =>
  [...text.matchAll(SENTENCE_FINAL_YO)]
    .filter((match) => !isAllowed(text, match[0], match.index ?? 0))
    .map((match) => match[0]);

type Hit = { path: string; text: string };

const FILES = ROOTS.flatMap((root) => collect(resolve(REPO_ROOT, root)))
  .map((file) => relative(REPO_ROOT, file).split(sep).join('/'))
  .map((path) => {
    const source = stripComments(readFileSync(resolve(REPO_ROOT, path), 'utf-8'));
    return { path, source: path.startsWith(TICKER_CONTENT_DIR) ? stripFaqQuestions(source) : source };
  });

const HITS: Hit[] = FILES.flatMap(({ path, source }) => findInformal(source).map((text) => ({ path, text })));

describe('앱 카피 어미', () => {
  it('스캔 대상 파일을 실제로 찾는다 (경로가 바뀌면 무음 통과하지 않게)', () => {
    expect(FILES.length).toBeGreaterThan(300);
    for (const anchor of [
      'shared/constants/community/copy.ts',
      'shared/constants/allocation/copy.ts',
      'components/CloudSyncIndicator/CloudSyncIndicator.utils.ts',
      'pages/Portfolio/copy/portfolioCopy.ts'
    ]) {
      expect(FILES.some(({ path }) => path === anchor)).toBe(true);
    }
  });

  it('사용자에게 보이는 문자열에 해요체 어미가 없다', () => {
    const report = HITS.map(({ path, text }) => `${path} — "${text}"`);
    expect(report).toEqual([]);
  });

  it('격식체 카피와 명사는 그대로 통과시킨다 (탐지기 자체 검증)', () => {
    const formal = [
      '아직 글이 없습니다',
      '첫 글을 남겨 주세요.',
      '첨부할 시나리오를 고르세요.',
      '내 조건에서 직접 계산해 보세요.',
      '좋아요·댓글을 남길 수 있습니다.',
      '시나리오를 공유하고 좋아요 · 댓글을 남길 수 있습니다.',
      '좋아요 처리에 실패했습니다.',
      '좋아요',
      '주요 메뉴',
      '개요',
      '확인 필요',
      '모든 변경사항이 저장됐습니다 · 방금 전'
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
      '그렇게 하죠.',
      '모든 변경사항이 저장됐어요 · 방금 전',
      '클라우드 저장에 실패했어요 — 이 기기에는 저장돼 있어요.',
      '추천 포트폴리오로 시작해도 좋아요'
    ];
    for (const line of informal) {
      expect(findInformal(line).length).toBeGreaterThan(0);
    }
  });

  it('티커 FAQ의 질문(사용자 목소리)만 예외로 빼고, 답변은 계속 검사한다', () => {
    const source = ["  question: 'SCHD 배당률은 얼마인가요?',", "  answer: '주가에 따라 달라져요.'"].join('\n');
    expect(findInformal(stripFaqQuestions(source))).toEqual(['달라져요']);
  });
});
