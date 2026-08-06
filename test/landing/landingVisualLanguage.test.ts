// @vitest-environment node — 소스 스캔 (기준: vitest.config.ts)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 랜딩 **시각 언어**(docs/landing-visual-language-spec.md)의 계약 중 **DOM 에 흔적을 남기지 않는 것들**.
 *
 * 등급(`emphasis`)은 제목 아래 2px 룰 **하나**로만 나타나고, 그 룰은 Emotion 클래스 안의
 * `border-bottom` 이라 jsdom 이 보지 못한다. 클래스명으로 테스트하는 것은 금지돼 있고(`.cursor/rules`),
 * 그렇다고 잠그지 않으면 "본론이 무엇인가"라는 판단이 조용히 넷·다섯으로 불어난다 — 그 순간 위계가
 * 아니라 소음이 된다. 그래서 여기서는 **뷰 소스의 배정표**를 계약으로 잠근다.
 *
 * ⚠ 이 방식의 한계를 알고 쓴다: 소스 스캔은 "그렇게 쓰여 있다"를 확인할 뿐 "그렇게 그려진다"를
 * 확인하지 못한다. 그려지는 쪽은 uiprobe 실측이 본다.
 */

const REPO_ROOT = process.cwd();
const LANDING_ROOT = join(REPO_ROOT, 'pages', 'Landing');
const VIEW_PATH = join(LANDING_ROOT, 'LandingPage', 'LandingPage.view.tsx');

/** 이 레포는 서술적 주석이 길다 — 금지어 스캔은 반드시 주석을 걷어내고 본다. */
const stripComments = (raw: string): string =>
  raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const listSourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

const landingSources = listSourceFiles(LANDING_ROOT).map((path) => ({
  path: relative(REPO_ROOT, path).split(sep).join('/'),
  code: stripComments(readFileSync(path, 'utf8'))
}));

/**
 * `<LandingSection …>` 블록마다 (섹션 키, 등급) 한 쌍을 뽑는다.
 * 여는 태그의 끝(`>`)으로 자르지 않는 이유: 속성 안 아이콘 JSX(`<BookOpen … />`)가 먼저 `>` 를 낸다.
 * 대신 **다음 `<LandingSection` 까지**를 한 덩어리로 보고 각 덩어리의 첫 값을 읽는다.
 */
const readSectionEmphasis = (): { key: string; emphasis: string }[] => {
  const code = stripComments(readFileSync(VIEW_PATH, 'utf8'));

  return code
    .split('<LandingSection')
    .slice(1)
    .map((chunk) => ({
      key: /sectionId\('([^']+)'\)/.exec(chunk)?.[1] ?? '(id 없음)',
      emphasis: /emphasis="([^"]+)"/.exec(chunk)?.[1] ?? '(등급 없음)'
    }));
};

describe('랜딩 섹션 등급(emphasis) 배정', () => {
  /**
   * 🔴 **본론은 두 장뿐이다** — S4 복리("왜 하는가")와 S6 프리셋("무엇을 고르는가").
   * 이 둘만 제목 아래 2px hue 룰을 갖는다. 셋이 되는 순간 강조는 강조가 아니다.
   */
  it('배정표가 그대로다 — chapter 는 복리·프리셋 둘뿐', () => {
    expect(readSectionEmphasis()).toEqual([
      /* 2026-08-06 합류 — 처음 온 사람의 길. 먼저 오지만 support 다(본론은 여전히 둘뿐). */
      { key: 'start', emphasis: 'support' },
      { key: 'concept', emphasis: 'support' },
      { key: 'compound', emphasis: 'chapter' },
      { key: 'payout', emphasis: 'support' },
      { key: 'presets', emphasis: 'chapter' },
      { key: 'checklist', emphasis: 'support' },
      { key: 'faq', emphasis: 'reference' }
    ]);
  });

  it('등급을 빠뜨린 섹션이 없다 — 기본값이 없으므로 누락은 곧 사고다', () => {
    const missing = readSectionEmphasis().filter((section) => section.emphasis === '(등급 없음)');

    expect(missing).toEqual([]);
  });

  /** 🔴 `emphasis` 에 기본값을 주면 다음 사람이 등급을 **정하지 않고** 섹션을 추가한다. */
  it('LandingSection 이 emphasis 에 기본값을 두지 않는다', () => {
    const component = stripComments(
      readFileSync(join(LANDING_ROOT, 'components', 'LandingSection', 'LandingSection.tsx'), 'utf8')
    );

    expect(component).not.toMatch(/emphasis\s*=\s*['"]/);
    expect(component).toMatch(/\bemphasis\b/);
  });
});

describe('랜딩 모션 규율 — 스크롤 진입 애니메이션 0건', () => {
  /**
   * 🔴 확정 금지다. 초기 `opacity: 0` 은 테스트 스텁·reduced-motion 환경에서 콘텐츠를 **영영**
   * 숨긴 사고 이력이 있고, 그 실패는 화면이 비어 있을 뿐 아무 에러도 내지 않는다.
   * 허용 모션은 호버·누름·`<details>` 펼침뿐이다.
   */
  it('리빌·키프레임·스크롤 스냅·초기 투명도가 소스에 없다', () => {
    const forbidden: { pattern: RegExp; why: string }[] = [
      { pattern: /IntersectionObserver/, why: '스크롤 진입 리빌' },
      { pattern: /@keyframes/, why: '키프레임 애니메이션' },
      { pattern: /\banimation(-name)?\s*:/, why: '자동 재생 애니메이션' },
      { pattern: /scroll-snap/, why: '스크롤 스냅' },
      { pattern: /opacity\s*:\s*0\s*[;`\n]/, why: '초기 투명도 0(콘텐츠 영구 은닉 사고 이력)' }
    ];

    const offenders = landingSources.flatMap(({ path, code }) =>
      forbidden.filter(({ pattern }) => pattern.test(code)).map(({ why }) => `${path} → ${why}`)
    );

    expect(offenders).toEqual([]);
  });

  /** 🔴 오버레이·모달 연쇄·진행률 투어는 사용자가 명시적으로 거부한 형태다. */
  it('모달·투어 부품을 끌어오지 않는다', () => {
    const offenders = landingSources.flatMap(({ path, code }) =>
      [/role\s*=\s*["']dialog["']/, /TourGuide/, /aria-modal/]
        .filter((pattern) => pattern.test(code))
        .map((pattern) => `${path} → ${pattern.source}`)
    );

    expect(offenders).toEqual([]);
  });
});
