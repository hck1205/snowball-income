// @vitest-environment node — 소스를 읽어 단정하는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { space } from '@/shared/styles';

/**
 * **페이지 본문이 시작하는 높이는 라우트가 바뀌어도 같아야 한다.**
 *
 * 이 앱의 본문 래퍼는 **세 벌**이다(하나로 합치지 못한 이유는 각 파일 주석에 있다):
 *   - `FeatureLayout`  — 시뮬레이터
 *   - `ShellMain`      — 내 포트폴리오 · 배당 캘린더 · 랜딩 · ETF 허브/상세 · 가계부 · 법무 · 404
 *   - `CommunityMain`  — 배당계산 갤러리 · 게시판 · 글쓰기 · 프로필
 *
 * 셋이 각자 세로 패딩을 갖고 있어서 **한 곳만 고치면 그 라우트만 어긋난다.** 실제로 2026-08-02 에
 * 사용자가 같은 종류의 어긋남을 **두 번 연속** 신고했다:
 *   - 시뮬레이터 93px 대 나머지 113px (FeatureLayout 이 clamp(16px,2.6vw,28px) 이었다)
 *   - 게시판 89px 대 나머지 113px (CommunityMain 이 clamp(16px,3vw,24px) 이었다)
 * 두 결함 모두 전 스위트가 초록인 채로 배포 직전까지 갔다 — 렌더 테스트는 **레이아웃을 계산하지 않고**
 * (jsdom), 화면 단위 테스트는 "이 페이지가 몇 px 에서 시작하는가"를 **다른 페이지와 비교할 수 없다.**
 *
 * 그래서 값을 소스 수준에서 못 박는다(`appHeaderSingleSource.test.ts` · `marketIndexStripPlacement.test.ts`
 * 와 같은 어법). 값을 바꾸는 것은 자유다 — 다만 **셋을 함께** 바꿔야 하고, 그 순간 의도가 기록으로 남는다.
 *
 * ⚠ 가로 패딩은 이 테스트의 대상이 아니다. 이미 세 파일이 같은 값을 쓰고 있고 그 근거가
 *   `TickerPageShell.styled.ts` 의 ShellMain 주석(2026-08-02 "시뮬레이터 사이즈 기준으로 통일")에 있다.
 *   여기서 다시 단정하면 같은 사실을 두 곳이 소유하게 된다.
 */
const REPO_ROOT = resolve(__dirname, '../..');

/** 세로 시작 여백의 정본. 셋이 이 값을 공유한다. */
const EXPECTED_TOP = 'clamp(20px, 4vw, 48px)';

type Wrapper = { label: string; file: string; symbol: string };

const WRAPPERS: Wrapper[] = [
  { label: '시뮬레이터', file: 'pages/Main/Main.shared.styled.ts', symbol: 'FeatureLayout' },
  {
    label: '포트폴리오·캘린더·랜딩·ETF·가계부·법무',
    file: 'pages/Ticker/components/TickerPageShell/TickerPageShell.styled.ts',
    symbol: 'ShellMain'
  },
  {
    label: '커뮤니티(갤러리·게시판)',
    file: 'pages/Community/CommunityLayout/CommunityLayout.styled.ts',
    symbol: 'CommunityMain'
  }
];

/**
 * `styled.x\`…\`` 한 덩어리에서 `padding:` 선언을 꺼낸다.
 *
 * 주석을 먼저 지운다 — 이 레포는 선언 바로 위에 근거를 길게 적는 관례라, 지우지 않으면 주석 안의
 * 예시 값("이 값이 clamp(16px,2.6vw,28px) 이던 동안…")이 선언으로 잡힌다. 실제로 이 테스트를 처음
 * 쓸 때 그 문장에 걸렸다.
 */
const paddingOf = (source: string, symbol: string): string => {
  const start = source.indexOf(`export const ${symbol} = styled`);
  if (start === -1) throw new Error(`${symbol} 을 찾지 못했다 — 심볼 이름이 바뀌었으면 이 목록을 갱신할 것`);

  const open = source.indexOf('`', start);
  const close = source.indexOf('`', open + 1);
  const block = source
    .slice(open + 1, close)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const match = /(?:^|\n)\s*padding:\s*([^;]+);/.exec(block);
  if (!match) throw new Error(`${symbol} 에 padding 선언이 없다`);
  return match[1].replace(/\s+/g, ' ').trim();
};

/** `${space[5]}` 같은 토큰 보간을 실제 값으로 편다 — 세 파일이 표기만 다르고 값은 같을 수 있다. */
const resolveSpaceTokens = (declaration: string): string =>
  declaration.replace(/\$\{space\[(\d+)\]\}/g, (_, index: string) => {
    const value = (space as Record<string, string>)[index];
    if (!value) throw new Error(`space[${index}] 가 스케일에 없다`);
    return value;
  });

/** `padding: <top> <inline> <bottom>` 의 첫 성분. clamp(...) 안의 공백에 속지 않게 괄호 깊이를 센다. */
const topComponent = (declaration: string): string => {
  let depth = 0;
  for (let i = 0; i < declaration.length; i += 1) {
    const ch = declaration[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ' ' && depth === 0) return declaration.slice(0, i);
  }
  return declaration;
};

describe('본문 시작 높이는 라우트가 바뀌어도 같다', () => {
  it.each(WRAPPERS)('$label 래퍼($symbol)의 세로 시작 여백이 정본과 같다', ({ file, symbol }) => {
    const source = readFileSync(resolve(REPO_ROOT, file), 'utf-8');
    const top = topComponent(resolveSpaceTokens(paddingOf(source, symbol)));

    expect(top.replace(/,\s*/g, ', ')).toBe(EXPECTED_TOP);
  });

  it('🔴 세 래퍼가 서로 같은 값을 쓴다 — 하나만 고치면 그 라우트만 어긋난다', () => {
    const tops = WRAPPERS.map(({ file, symbol }) =>
      topComponent(resolveSpaceTokens(paddingOf(readFileSync(resolve(REPO_ROOT, file), 'utf-8'), symbol))).replace(
        /,\s*/g,
        ', '
      )
    );

    expect(new Set(tops).size, `세 래퍼의 시작 여백이 갈렸다: ${tops.join(' / ')}`).toBe(1);
  });
});
