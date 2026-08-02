// @vitest-environment node — index.html 원문을 문자열로 읽어 본다 (DOM 불필요)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LANDING_COPY } from '@/pages/Landing/copy';

/**
 * **정적 셸 본문 ↔ 랜딩 카피의 드리프트 방지.**
 *
 * `index.html` 의 `.app-shell-fallback` 은 **JS 를 실행하지 않는 소비자**(네이버 Yeti·Daumoa·
 * 카카오 스크래퍼·AI 답변 엔진)가 읽는 이 사이트의 전부다. 문구의 정본은
 * `pages/Landing/copy/landingCopy.ts` 이고 셸은 그 사본이다 — 그런데 사본은 **화면에 안 보이므로**
 * 어긋나도 아무도 눈치채지 못한다. 실제로 첫 커밋에서 이미 어긋났고, 하필 바뀐 낱말이 "추천"이라
 * 셸만 "추천 구성 중 하나를 고르라"고 말하는 상태였다(= 투자 권유). 그래서 FAQ 와 같은 방식으로
 * **테스트로 잠근다**.
 *
 * 잠그는 것 셋:
 *  ① **문자 단위 일치** — 랜딩 S1·S3·S4·S5·S7 본문이 셸에 정본 그대로 있다.
 *  ② 🔴 **예외는 목록으로만** — 셸은 축약본이라 정본 문장을 그대로 못 쓰는 자리가 있다. 그 자리는
 *     `DERIVED` 에 "정본의 어느 문장에서, 어느 span 만 바꿔 파생됐는지"를 적어 잠그고, **개수를 센다**
 *     (예외가 늘어나면 가드가 무의미해지므로 숫자를 올릴 때 정말 불가피한지 따져야 한다).
 *  ③ 🔴 **"추천" 금지** — 셸 본문 어디에도 없다. `landingCopy.ts` 가 «"추천 종목"이라고 쓰면 투자
 *     권유가 된다» 고 못 박았고, 셸에는 프리셋 섹션조차 없어 가리킬 대상도 없다.
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const INDEX_HTML = readRepoFile('index.html');

/**
 * 사람이 실제로 읽는 본문만 남긴다 — 주석·태그를 걷고 줄바꿈 들여쓰기를 한 칸으로 접는다.
 * (`landingFaqStructuredData.test.ts` 와 같은 기법. 🔴 **주석을 먼저 지운다** — 이 셸의 주석은
 * 규칙을 서술하느라 금지어를 인용하므로, 원문을 그대로 훑으면 ③이 주석에 걸려 헛빨강이 된다.)
 */
const shellText = () => {
  const shell = INDEX_HTML.slice(INDEX_HTML.indexOf('class="app-shell-fallback"'));
  return shell
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const SHELL = shellText();

type Entry = readonly [label: string, text: string];

/** 셸에 **정본 그대로** 있어야 하는 문장들. */
const EXACT: readonly Entry[] = [
  ['hero.title', LANDING_COPY.hero.title],
  ['hero.lede', LANDING_COPY.hero.lede],

  ['concept.title', LANDING_COPY.concept.title],
  ...LANDING_COPY.concept.items.flatMap(
    (item): readonly Entry[] => [
      [`concept.${item.id}.title`, item.title],
      [`concept.${item.id}.body`, item.body]
    ]
  ),

  ['compound.title', LANDING_COPY.compound.title],
  ...LANDING_COPY.compound.paragraphs.map(
    (paragraph, index): Entry => [`compound.paragraphs[${index}]`, paragraph]
  ),
  ['compound.factorsTitle', LANDING_COPY.compound.factorsTitle],
  ...LANDING_COPY.compound.factors.map((factor, index): Entry => [`compound.factors[${index}]`, factor]),
  ['compound.linkText', LANDING_COPY.compound.linkText],

  ['payout.title', LANDING_COPY.payout.title],
  ['payout.lede', LANDING_COPY.payout.lede],
  ['payout.honesty', LANDING_COPY.payout.honesty],
  ['payout.linkText', LANDING_COPY.payout.linkText],

  ['checklist.title', LANDING_COPY.checklist.title],
  ['checklist.stepsTitle', LANDING_COPY.checklist.stepsTitle],
  ['checklist.steps[1]', LANDING_COPY.checklist.steps[1]],
  ['checklist.steps[2]', LANDING_COPY.checklist.steps[2]],
  ['checklist.stepsClosing', LANDING_COPY.checklist.stepsClosing],
  ['checklist.cautionsTitle', LANDING_COPY.checklist.cautionsTitle],
  ...LANDING_COPY.checklist.cautions.map((caution, index): Entry => [`checklist.cautions[${index}]`, caution])
];

/**
 * 🔴 **파생 문장 = 예외 목록.** 정본을 그대로 못 쓰는 자리만 여기 등록한다.
 *
 * `sharedPrefix`/`sharedSuffix` 가 "정본의 어느 문장에서 파생됐는지"를 명시한다 — 바꿔도 되는 것은
 * 그 사이 span 하나뿐이고, 정본의 앞뒤가 개정되면 이 가드가 빨개져 셸을 함께 고치게 만든다.
 */
const DERIVED = [
  {
    id: 'checklist.steps[0]',
    source: LANDING_COPY.checklist.steps[0],
    shell: '관심 있는 종목을 고릅니다. 시뮬레이터의 예시 구성 중 하나를 골라도 되고, 직접 검색해 담아도 됩니다.',
    sharedPrefix: '관심 있는 종목을 고릅니다.',
    sharedSuffix: '중 하나를 골라도 되고, 직접 검색해 담아도 됩니다.',
    reason:
      '정본의 "위 구성"은 바로 위 프리셋 섹션을 가리키는데 셸에는 그 섹션이 없다. 🔴 대체어로 "추천"을 쓰면 투자 권유가 된다.'
  }
] as const;

/** 🔴 셸 본문에 있어서는 안 되는 낱말. 늘리기는 쉬워도 줄이지는 마라. */
const FORBIDDEN_WORDS = ['추천'] as const;

describe('정적 셸 본문이 랜딩 카피와 일치한다', () => {
  it('가드가 빈 문자열을 훑고 통과하지 않는다', () => {
    expect(SHELL.length).toBeGreaterThan(1000);
    expect(EXACT.length).toBeGreaterThan(20);
  });

  it.each(EXACT)('%s 가 셸에 정본 그대로 있다', (_label, text) => {
    expect(SHELL).toContain(text);
  });

  it('checklist.steps 3줄이 하나도 빠짐없이 다뤄진다', () => {
    const covered = new Set([
      ...EXACT.map(([label]) => label),
      ...DERIVED.map((entry) => entry.id)
    ]);

    LANDING_COPY.checklist.steps.forEach((_step, index) => {
      expect(covered.has(`checklist.steps[${index}]`), `checklist.steps[${index}] 가 가드 밖에 있다`).toBe(true);
    });
  });
});

describe('🔴 셸의 파생 문장(예외)', () => {
  it('예외는 1개뿐이다 — 늘리기 전에 정말 불가피한지 따져라', () => {
    // 예외가 늘어나면 "셸이 정본을 따른다"는 이 가드의 전제가 조용히 무너진다.
    expect(DERIVED).toHaveLength(1);
  });

  it.each(DERIVED.map((entry) => [entry.id, entry] as const))(
    '%s — 정본에서 파생됐고 셸에 그 형태로 있다',
    (_id, entry) => {
      // 파생의 앞뒤는 정본과 같다 = "어느 문장에서 나왔는가"가 코드로 남는다.
      expect(entry.source.startsWith(entry.sharedPrefix)).toBe(true);
      expect(entry.shell.startsWith(entry.sharedPrefix)).toBe(true);
      expect(entry.source.endsWith(entry.sharedSuffix)).toBe(true);
      expect(entry.shell.endsWith(entry.sharedSuffix)).toBe(true);

      expect(SHELL).toContain(entry.shell);
      // 정본을 그대로 쓸 수 있게 됐다면(셸에 프리셋 섹션이 생겼다면) 예외를 지워라.
      expect(SHELL, `${entry.id} 는 이제 정본과 같다 — DERIVED 에서 지워라`).not.toContain(entry.source);
    }
  );
});

describe('🔴 셸 본문의 금지어', () => {
  it.each(FORBIDDEN_WORDS)('본문에 "%s" 이(가) 없다', (word) => {
    expect(SHELL).not.toContain(word);
  });

  it('주석 제거가 실제로 동작한다 — 서술적 주석은 위반이 아니다', () => {
    // 이 셸의 주석은 «"추천"으로 바꾸지 마라» 처럼 금지어를 인용한다. 그 인용에 걸리면 가드가
    // 아무것도 지키지 못하면서 빨개진다(반대로 원문 스캔이면 진짜 위반을 못 볼 수도 있다).
    expect(INDEX_HTML).toContain('추천');
  });
});
