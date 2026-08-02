// @vitest-environment node — 파일을 읽어 문자열만 본다 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 법무 고지문(`/privacy`·`/terms`)이 **사람이 아닌 소비자**에게도 보이는지 잠근다.
 *
 * 이 앱에는 AI·크롤러용 표면이 3종 있고 **서로를 전혀 모른다**: `public/llms.txt`,
 * `public/llms-full.txt`, `public/ai-overview.json`. 실제로 한 번은 앞의 둘만 고쳐
 * `ai-overview.json` 만 `"collects_personal_data": false` 로 남았다 — 화면에서는 아무 일도
 * 일어나지 않으므로 사람이 셋을 동시에 열지 않는 한 드러나지 않는다. 그래서 셋을 한 테스트에
 * 묶는다: **하나를 고치면 나머지 둘도 여기서 걸린다.**
 *
 * 잠그는 것은 네 가지다.
 *  ① **포인터** — 셋 다 `/privacy`·`/terms` 를 가리킨다. 구글 OAuth 동의 화면 심사와 답변형
 *     검색이 방침을 찾는 경로가 이것뿐이다(사이트맵도 함께 본다 — 푸터 링크 외에 유일한 진입로다).
 *  ② 🔴 **사실** — "서버·계정·개인 데이터가 없다"는 서술을 되살리지 못하게 한다. 앱에는 소셜
 *     로그인·커뮤니티·클라우드 저장이 실제로 있으므로 그 문장은 거짓이고, 방침 문서와도 모순된다.
 *     ⚠ "no account is needed to use the calculator"(계산에 로그인이 필요 없다)는 참이라 금지하지
 *     않는다 — 금지 대상은 **수집·백엔드 자체가 없다**는 주장뿐이다.
 *  ③ 🔴 **가계부의 로그인 조건** — ①②는 "거짓 주장이 되살아나는 것"만 본다. **기능 열거의 누락**은
 *     원리적으로 못 잡아서, `/ledger` 가 앱 로그인 뒤로 들어간 개정(2026-08-01)이 표면 3종을 그대로
 *     통과했다. 가계부를 쓰려면 계정이 생긴다 = 개인정보 수집의 **조건**이므로 고지 대상이다.
 *     세 사실을 함께 본다: **로그인 필요 · 이용자 본인의 구글 시트 · 우리 서버 미경유**.
 *     ⚠ 이 검사는 **줄 단위**다 — 가계부 서술을 여러 줄로 쓸 때는 각 줄이 "가계부"(또는 `ledger`)를
 *     포함하게 두어라(영문 표면은 문단이 감기므로 특히). 줄이 길어지는 것보다 이 편이 낫다.
 *  ③-1 🔴 **가계부 블렌딩(두 가계부 합쳐보기)의 새 사실** — 2026-08-02 가계부 고도화가 만든 새 사실:
 *     블렌딩으로 연결하는 두 번째 시트는 **이용자 본인 소유가 아니라 다른 사람이 공유해 준 시트일 수
 *     있다**(`shared/lib/googleSheets/picker.ts:4-6` — `drive.file` + 피커는 소유 여부와 무관하게 접근권을
 *     준다). 그 사실과, 블렌딩도 서버를 거치지 않는다는 사실이 표면에 있어야 한다
 *     (`docs/ledger-advanced-spec-2026-08-02.md` §7 리스크 #6).
 *  ③-2 🔴 **배당 겹쳐 보기의 새 사실** — 포트폴리오 보유 기준 **예상**(추정) 배당을 화면에만 보여주고,
 *     시트에 기록하지 않으며, 가계부의 수입·지출 합계에도 포함하지 않는다(`pages/Ledger/utils/
 *     ledgerDividend.ts` 상단 주석). 날조 금지·손익 미반영 원칙이 AI 표면에도 반영돼야 한다.
 *  ④ **비유 금지** — "눈덩이·스노우볼"은 어떤 카피에도 쓰지 않는다(확정 결정). 브랜드명
 *     "Snowball Income"은 이름이라 예외지만, `배당 재투자(스노우볼)` 같은 **개념 설명 괄호**는 아니다.
 *     `copyTone.test.ts` 는 `.ts`/`.tsx` 만 훑어 이 세 파일을 보지 않는다 — 그래서 여기서 잠근다.
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const LLMS = readRepoFile('public/llms.txt');
const LLMS_FULL = readRepoFile('public/llms-full.txt');
const AI_OVERVIEW_RAW = readRepoFile('public/ai-overview.json');
const AI_OVERVIEW = JSON.parse(AI_OVERVIEW_RAW) as {
  requires_account: unknown;
  collects_personal_data: unknown;
  ledger: unknown;
  computation: string;
  entrypoints: Record<string, string>;
};

const AI_SURFACES = [
  { name: 'public/llms.txt', text: LLMS },
  { name: 'public/llms-full.txt', text: LLMS_FULL },
  { name: 'public/ai-overview.json', text: AI_OVERVIEW_RAW }
] as const;

/** 되살아나면 안 되는 거짓 주장들. 표면 3종 어디에도 없어야 한다. */
const DISPROVEN_CLAIMS = [
  /no backend/i,
  /no personal data/i,
  /client-side only/i,
  /수집되는 개인 데이터가 없다/,
  /서버·계정·수집되는 개인 데이터가 없다/
] as const;

/**
 * 가계부 서술이 말해야 하는 사실. 표면마다 언어가 달라(llms-full.txt 는 영문) 패턴을 함께 준다.
 * 🔴 `marker` 가 붙은 **줄만** 모아서 본다 — "파일 어딘가에 '로그인'이 있다" 같은 느슨한 검사는
 *    이 파일들에 로그인 얘기가 원래 많아서 아무것도 증명하지 못한다.
 */
const LEDGER_SURFACES = [
  {
    name: 'public/llms.txt',
    text: LLMS,
    marker: /가계부|ledger/i,
    facts: [
      { what: '로그인 필요', pattern: /로그인/ },
      { what: '이용자 본인의 구글 시트', pattern: /구글 스프레드시트/ },
      { what: '우리 서버 미경유', pattern: /서버|데이터베이스/ },
      { what: '블렌딩(가계부 합쳐보기) 설명', pattern: /블렌딩/ },
      { what: '블렌딩 시트가 타인 공유일 수 있음', pattern: /다른 사람이 공유해 준 시트/ },
      { what: '배당 겹쳐 보기 설명', pattern: /배당 겹쳐 보기/ },
      { what: '배당 겹쳐 보기가 가계부 합계에 미포함', pattern: /합계에도 포함하지 않/ }
    ]
  },
  {
    name: 'public/llms-full.txt',
    text: LLMS_FULL,
    marker: /가계부|ledger/i,
    facts: [
      { what: '로그인 필요', pattern: /로그인|sign-?in/i },
      { what: '이용자 본인의 구글 시트', pattern: /구글 스프레드시트|Google Sheet/i },
      { what: '우리 서버 미경유', pattern: /서버|server|database/i },
      { what: '블렌딩(ledger 합쳐보기) 설명', pattern: /blend/i },
      { what: '블렌딩 시트가 타인 공유일 수 있음', pattern: /shared with the user by someone else/i },
      { what: '배당 겹쳐 보기(추정치) 설명', pattern: /estimated dividend/i },
      { what: '배당 겹쳐 보기가 가계부 합계에 미포함', pattern: /not included in the ledger's income\/expense totals/i }
    ]
  },
  {
    name: 'public/ai-overview.json',
    text: AI_OVERVIEW_RAW,
    marker: /가계부|ledger/i,
    facts: [
      { what: '로그인 필요', pattern: /로그인/ },
      { what: '이용자 본인의 구글 시트', pattern: /구글 스프레드시트/ },
      { what: '우리 서버 미경유', pattern: /서버|데이터베이스/ },
      { what: '블렌딩(가계부 합쳐보기) 설명', pattern: /블렌딩/ },
      { what: '블렌딩 시트가 타인 공유일 수 있음', pattern: /다른 사람이 공유해 준 시트/ },
      { what: '배당 겹쳐 보기 설명', pattern: /배당 겹쳐 보기/ },
      { what: '배당 겹쳐 보기가 가계부 합계에 미포함', pattern: /합계에도 포함하지 않/ }
    ]
  }
] as const;

/** 브랜드명(워드마크·타이틀 suffix)은 예외 — 금지 대상은 한글 비유다. */
const FORBIDDEN_METAPHORS = [/스노우볼/, /눈덩이/] as const;

/**
 * 블록 주석과 줄 주석을 걷어낸 소스. 주석도 결국 같은 낱말을 담으므로, 걷어내지 않으면
 * "설명만 있고 코드에는 없는" 상태를 통과로 오판한다.
 * ⚠ 줄 주석은 **줄 첫머리에 오는 것만** 지운다 — `https://` 같은 문자열이 잘려나가지 않게.
 */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

describe('법무 고지문 표면 일관성', () => {
  it.each(AI_SURFACES)('$name 이 /privacy 와 /terms 를 가리킨다', ({ text }) => {
    expect(text).toContain('/privacy');
    expect(text).toContain('/terms');
  });

  it.each(AI_SURFACES)('$name 이 "서버·계정·개인 데이터가 없다"고 말하지 않는다', ({ text }) => {
    for (const claim of DISPROVEN_CLAIMS) {
      expect(text).not.toMatch(claim);
    }
  });

  /**
   * JSON 은 문자열 검색만으로는 부족하다 — 값이 `false`(불리언)로 되돌아가도 파일 어딘가에
   * `/privacy` 가 남아 있으면 위 검사를 통과한다. 실제로 그렇게 드리프트했다.
   */
  it('🔴 ai-overview.json 의 사실 필드가 "없다"(false)로 되돌아가지 않는다', () => {
    expect(AI_OVERVIEW.requires_account).not.toBe(false);
    expect(AI_OVERVIEW.collects_personal_data).not.toBe(false);
    // 수집 사실을 인정하는 것으로 끝내지 않고, 상세를 어디서 보는지까지 가리켜야 한다.
    expect(String(AI_OVERVIEW.collects_personal_data)).toContain('/privacy');
    expect(AI_OVERVIEW.entrypoints.privacy).toBe('/privacy');
    expect(AI_OVERVIEW.entrypoints.terms).toBe('/terms');
  });

  it.each(LEDGER_SURFACES)('$name 이 가계부의 로그인 조건과 저장 위치를 말한다', ({ text, marker, facts }) => {
    const ledgerLines = text.split('\n').filter((line) => marker.test(line));

    // 가계부 서술 자체가 없으면 여기서 끝난다 — 기능을 더하고 표면을 안 고친 경우.
    expect(ledgerLines.length).toBeGreaterThan(0);

    const ledgerText = ledgerLines.join('\n');
    for (const { what, pattern } of facts) {
      expect(ledgerText, `가계부 서술에 "${what}"이(가) 없다`).toMatch(pattern);
    }
  });

  /**
   * `requires_account` 는 "계정이 필요한 기능"의 열거다. 가계부가 여기 빠지면 위 줄 검사를
   * 통과하고도(다른 필드에 문장이 있으면) 열거만 낡은 상태가 된다 — 구조로 한 번 더 못 박는다.
   */
  it('🔴 ai-overview.json 의 requires_account 열거에 가계부가 있다', () => {
    expect(String(AI_OVERVIEW.requires_account)).toContain('가계부');
    expect(String(AI_OVERVIEW.ledger)).toContain('/ledger');
  });

  it.each(AI_SURFACES)('$name 에 "눈덩이·스노우볼" 비유가 없다', ({ text }) => {
    for (const metaphor of FORBIDDEN_METAPHORS) {
      expect(text).not.toMatch(metaphor);
    }
  });

  /**
   * 사이트맵은 크롤러가 두 문서에 도달하는 **짧은 경로**다(푸터 링크만 있으면 크롤 깊이가 깊다).
   * `public/sitemap.xml` 이라는 파일은 없고 `vite.config.ts` 의 배열이 유일한 정본이라,
   * 여기서 원본을 본다. 우선순위·주기까지 함께 고정한다 — 본문 페이지와 경쟁하면 안 된다.
   */
  it('사이트맵 정본(vite.config.ts)에 두 경로가 최하위 우선순위로 남아 있다', () => {
    const source = stripComments(readRepoFile('vite.config.ts'));

    expect(source).toMatch(/path: '\/privacy', priority: '0\.2', changefreq: 'yearly'/);
    expect(source).toMatch(/path: '\/terms', priority: '0\.2', changefreq: 'yearly'/);
  });
});
