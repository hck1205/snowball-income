// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * **reduced-motion 에서 "작업 중" 신호가 죽지 않는다는 계약.**
 *
 * 전역 리셋(`shared/styles/globalStyles.ts`)이 `animation-duration: 0.01ms` 와
 * `animation-iteration-count: 1` 을 **`!important` 로** 건다. 그래서 무한 애니메이션은
 * reduced-motion 사용자에게 **첫 프레임에서 얼어붙고**, 로컬에서 그 두 속성을 `!important` 로
 * 되찾지 않으면 어떤 값을 적어도 무시된다(2026-07-30 감사에서 11곳 발견).
 *
 * 🔴 **렌더 테스트로는 못 잡는다.** jsdom 은 `@media` 를 평가하지 않아 `prefers-reduced-motion`
 * 블록이 통째로 사라진 뮤턴트에서도 전 스위트가 초록이다. 그래서 소스 계약으로 잠근다
 * (선례 `test/shared/appHeaderSingleSource.test.ts` · `shared/styles/typography.test.ts`).
 *
 * ## 되찾는 것과 놔두는 것의 경계 (DESIGN.md §7 "모션이 유일한 피드백 채널이면 안 된다")
 *
 * - **스피너 = 되찾는다.** 스피너가 말하는 것은 "**아직 살아 있다**"인데, 멈춘 링은 그 말을 못 한다.
 *   옆에 정적 텍스트가 있어도 텍스트는 "시작했다"까지만 말한다. 되찾을 때는 **회전이 아니라
 *   불투명도 펄스** — 움직임이 없어 전정계에 안전하면서 단서는 남는다.
 * - **스켈레톤 = 정지가 정답.** 스켈레톤이 말하는 것은 "이 자리에 올 값이 아직 없다"이고 그건
 *   회색 막대의 *모양*이 통째로 말한다. 게다가 펄스의 쉬는 프레임이 `opacity: 1` 이라 **정지가
 *   가장 잘 보이는 프레임**이다.
 *
 * 새 자리를 만들 때 이 표에 넣어라. 판정이 갈리면 "모션을 지웠을 때 화면에 무엇이 남는가"를 본다.
 */
const REPO_ROOT = resolve(__dirname, '../..');

const read = (path: string) => readFileSync(resolve(REPO_ROOT, path), 'utf-8');

/** reduce 블록 하나를 통째로 떠낸다(중첩 없는 단순 블록 전제 — 이 레포의 모든 자리가 그렇다). */
const reduceBlockOf = (source: string): string | null => {
  const start = source.indexOf('@media (prefers-reduced-motion: reduce)');
  if (start === -1) return null;

  const open = source.indexOf('{', start);
  if (open === -1) return null;

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
};

/** "작업 중"을 말하는 자리 — 전역 리셋을 되찾아야 한다. */
const SPINNERS = [
  {
    label: '클라우드 저장 중 배지',
    file: 'components/CloudSyncIndicator/CloudSyncIndicator.styled.ts'
  },
  {
    label: '더보기 메뉴의 PDF 생성 스피너',
    file: 'components/HeaderOverflowMenu/HeaderOverflowMenu.styled.ts'
  }
] as const;

/** "값이 아직 없다"를 말하는 자리 — 정지가 정답이다(정적 단서가 모양 자체에 있다). */
const SKELETONS = [
  { label: '환율 위젯', file: 'components/ExchangeRateWidget/ExchangeRateWidget.styled.ts' },
  { label: '지수 스트립', file: 'components/MarketIndexStrip/MarketIndexStrip.styled.ts' },
  {
    label: '캘린더 날짜 칸',
    file: 'pages/DividendCalendar/components/MonthCalendar/MonthCalendar.styled.ts'
  }
] as const;

describe('reduced-motion — 전역 리셋이 죽인 신호를 되찾는 자리', () => {
  it('전역 리셋이 정말 !important 로 애니메이션을 죽인다 (이 계약의 전제)', () => {
    const globals = read('shared/styles/globalStyles.ts');
    const block = reduceBlockOf(globals);

    expect(block).not.toBeNull();
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/animation-iteration-count:\s*1\s*!important/);
  });

  it.each(SPINNERS)('$label 은 duration·iteration-count 를 !important 로 되찾는다', ({ file }) => {
    const block = reduceBlockOf(read(file));

    expect(block).not.toBeNull();
    // 이름만 바꾸면 여전히 0.01ms 1회로 끝난다 — 두 속성을 함께 회수해야 실제로 돈다.
    expect(block).toMatch(/animation-duration:[^;]*!important/);
    expect(block).toMatch(/animation-iteration-count:\s*infinite\s*!important/);
  });

  it.each(SPINNERS)('$label 은 회전이 아니라 불투명도 펄스로 되찾는다 (전정계 안전)', ({ file }) => {
    const source = read(file);
    const block = reduceBlockOf(source);

    // 되찾는 키프레임 이름이 실제로 그 파일에 정의돼 있고, 그 안에 rotate 가 없어야 한다.
    const name = /animation-name:\s*([\w-]+)/.exec(block ?? '')?.[1];
    expect(name).toBeTruthy();

    const keyframes = new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n  \\}`).exec(source)?.[1];
    expect(keyframes, `${name} 키프레임 정의를 찾지 못했다`).toBeTruthy();
    expect(keyframes).toMatch(/opacity/);
    expect(keyframes).not.toMatch(/rotate/);
  });
});

describe('reduced-motion — 일부러 정지시키는 자리(스켈레톤)', () => {
  it.each(SKELETONS)('$label 스켈레톤은 되찾지 않는다 (모양 자체가 정적 단서)', ({ file }) => {
    const block = reduceBlockOf(read(file));

    expect(block).not.toBeNull();
    expect(block).toMatch(/animation:\s*none/);
    // 되찾기 흔적이 섞이면 위 "스피너/스켈레톤" 경계가 무너진 것이다.
    expect(block).not.toMatch(/!important/);
  });
});
