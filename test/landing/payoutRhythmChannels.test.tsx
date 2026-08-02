import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LANDING_COPY, LANDING_PAYOUT_RHYTHM_TICKERS } from '@/pages/Landing/copy';
import { RHYTHM_MONTHS, buildPayoutRhythmRows } from '@/pages/Landing/components';
import PayoutRhythm from '@/pages/Landing/components/PayoutRhythm/PayoutRhythm';

/**
 * S5 12칸 리듬 — **"색이 유일한 정보 채널이면 안 된다"** 를 실제로 잠근다.
 *
 * ## 왜 두 층으로 나눠 잠그나 (jsdom 실측, 2026-08-02)
 * 이 칸의 신호는 넷이다: 면색 · 글자색 · **사방 1px 링** · **굵기**. 그중 색 두 가지는
 * 회색조로 보면 사라진다(부품 주석의 실측: 지급/미지급 면 대비 1.01~1.18:1). 남는 것이 링과 굵기다.
 * 그런데 jsdom 이 그 둘을 보는 방식이 **정반대로 갈린다** — 실측한 그대로 적는다:
 *
 * ```
 *   지급 칸  font-weight "700"   border ""                    ← 링이 안 보인다
 *   미지급   font-weight "400"   border "1px solid transparent" ← 투명 링만 보인다
 * ```
 *
 * `border: 1px solid var(--sb-accent-alt-text)` 은 **단축 속성 안의 `var()`** 라 cssstyle 이 통째로
 * 버린다(pitfalls 2026-07-31 과 같은 제약). 반면 미지급 쪽 `1px solid transparent` 에는 `var()` 가
 * 없어 그대로 계산된다. 즉 **렌더 테스트로 링을 단정하면 진실과 반대로 읽는다** — "지급 칸에는
 * 테두리가 없고 미지급 칸에만 있다"는 결론이 나온다. 그래서:
 *
 *   · **굵기**(400/700 리터럴) → 렌더 층에서 `getComputedStyle` 로 잠근다.
 *     className 이 아니라 **CSS 결과값**을 보는 것이라 `.cursor/rules` 의 금지 대상이 아니다.
 *   · **링** → 소스 계약으로 잠근다. 주석을 먼저 걷어낸다(이 레포의 주석은 규칙을 그대로 서술한다).
 *
 * ⚠ 이 파일이 **증명하지 못하는 것**: 실제 브라우저에서 그 링이 몇 픽셀로 그려지는가,
 * 그 색이 면과 충분히 대비되는가. 그건 `uiprobe`/`contrast.test.ts` 의 몫이다.
 */

const REPO_ROOT = process.cwd();
const RHYTHM_DIR = join(REPO_ROOT, 'pages', 'Landing', 'components', 'PayoutRhythm');

/** 서술적 주석이 규칙 문장을 그대로 담고 있는 레포다 — 세기 전에 반드시 걷어낸다. */
const stripComments = (raw: string): string =>
  raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/**
 * 이름을 앵커로 styled 템플릿 **한 덩어리**만 떠낸다.
 * "파일의 첫 블록"을 쓰면 한 파일에 여러 styled 가 사는 이 파일에서 엉뚱한 블록을 검사한다
 * (pitfalls 2026-07-31 `reduceBlockOf` 와 같은 이유).
 */
const styledBlock = (source: string, name: string): string => {
  const start = source.indexOf(`export const ${name} = styled`);
  expect(start, `${name} styled 선언을 찾지 못했다`).toBeGreaterThanOrEqual(0);
  const open = source.indexOf('`', start);
  const end = source.indexOf('\n`;', open);
  expect(end, `${name} 템플릿의 끝을 찾지 못했다`).toBeGreaterThan(open);
  return source.slice(open + 1, end);
};

/** 블록에서 한 CSS 선언의 값만 뽑아 공백을 접는다. 값 안에 `;` 가 없는 선언 전용이다. */
const declarationOf = (block: string, property: string): string | null => {
  const match = new RegExp(`(?:^|\\n)\\s*${property}\\s*:([^;]*);`).exec(block);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
};

const rhythmSource = stripComments(readFileSync(join(RHYTHM_DIR, 'PayoutRhythm.styled.ts'), 'utf8'));
const cellBlock = styledBlock(rhythmSource, 'RhythmCell');

const renderRhythm = () =>
  render(
    <MemoryRouter>
      <PayoutRhythm />
    </MemoryRouter>
  );

/**
 * 행마다 12칸 트랙(행의 **마지막** 자식). 행 순서 그대로.
 *
 * ⚠ `span[aria-hidden]` 으로 잡지 않는다 — 그러면 `aria-hidden` 이 빠지는 회귀에서 **굵기 테스트까지**
 * "트랙 0개"로 함께 빨개져 원인을 가리킨다고 착각하게 된다(실측). 접근성 계약은 전용 테스트가 본다.
 */
const monthTracks = (container: HTMLElement): HTMLElement[] =>
  [...container.querySelectorAll('li')].map((row) => row.lastElementChild as HTMLElement);

describe('S5 12칸 리듬 — 색이 아닌 채널', () => {
  /**
   * 🔴 **굵기 채널.** 이것이 사라지면(두 상태가 같은 굵기가 되면) 회색조 화면에서 지급/미지급이
   * 구분되지 않는다 — ink 프리셋은 accentAlt 가 무채라 실제로 그런 화면이다.
   */
  it('지급 칸과 미지급 칸의 글자 굵기가 실제로 다르다(700 대 400)', () => {
    const rows = buildPayoutRhythmRows(LANDING_PAYOUT_RHYTHM_TICKERS);
    const { container } = renderRhythm();
    const tracks = monthTracks(container);

    expect(tracks).toHaveLength(rows.length);

    let paidSeen = 0;
    let unpaidSeen = 0;

    rows.forEach((row, index) => {
      const cells = [...tracks[index].children] as HTMLElement[];
      expect(cells).toHaveLength(RHYTHM_MONTHS.length);

      RHYTHM_MONTHS.forEach((month, cellIndex) => {
        const weight = getComputedStyle(cells[cellIndex]).fontWeight;
        if (row.months.includes(month)) {
          expect(weight, `${row.symbol} ${month}월(지급)`).toBe('700');
          paidSeen += 1;
        } else {
          expect(weight, `${row.symbol} ${month}월(미지급)`).toBe('400');
          unpaidSeen += 1;
        }
      });
    });

    /*
     * 🔴 두 상태를 실제로 봤는지 못 박는다. 스냅샷이 바뀌어 한쪽만 남으면 위 루프는
     * **아무것도 검사하지 않은 채** 초록이 된다("요소 0건 = 위반 0건" 형태의 무음 통과).
     */
    expect(paidSeen).toBeGreaterThan(0);
    expect(unpaidSeen).toBeGreaterThan(0);
  });

  /**
   * 🔴 **미지급 칸은 사라지지 않는다.** 지급 달만 그리면 "12달 중 이만큼"이라는 비율이 화면에서
   * 없어지고, 행마다 칸 수가 달라져 세로 비교(이 표의 유일한 존재 이유)가 무너진다.
   */
  it('행마다 12칸이 그대로 있고, 칸 라벨은 1~12월이다', () => {
    const { container } = renderRhythm();

    for (const track of monthTracks(container)) {
      const labels = [...track.children].map((cell) => cell.textContent);
      expect(labels).toEqual(RHYTHM_MONTHS.map(String));
    }
  });

  /**
   * 🔴 12칸은 **장식**이다 — 접근명과 요약 텍스트가 같은 사실을 이미 말한다.
   * `aria-hidden` 이 빠지면 스크린리더가 행마다 "1 2 3 4 …"를 한 번 더 읽는다(중복 낭독).
   */
  it('12칸 트랙은 접근성 트리에서 감춰져 있고, 행 접근명이 사실을 말한다', () => {
    const rows = buildPayoutRhythmRows(LANDING_PAYOUT_RHYTHM_TICKERS);
    const { container } = renderRhythm();
    const items = [...container.querySelectorAll('li')];

    expect(items).toHaveLength(rows.length);

    rows.forEach((row, index) => {
      const item = items[index];
      const track = item.querySelector('span[aria-hidden]');
      expect(track, `${row.symbol} 행의 12칸 트랙이 aria-hidden 이 아니다`).not.toBeNull();

      const label = item.getAttribute('aria-label') ?? '';
      expect(label).toContain(row.symbol);
      // 지급 월이 접근명 안에 전부 들어 있다(칸을 못 보는 사용자도 같은 사실을 얻는다).
      for (const month of row.months) expect(label).toContain(`${month}월`);
    });

    // 숫자 칸은 하나도 접근성 트리에 노출되지 않는다.
    const exposedNumbers = [...container.querySelectorAll('span')].filter(
      (el) => /^(1[0-2]|[1-9])$/.test(el.textContent ?? '') && el.closest('[aria-hidden]') === null
    );
    expect(exposedNumbers).toEqual([]);
  });
});

describe('S5 12칸 리듬 — 링(모양 채널)은 소스 계약으로 잠근다', () => {
  /**
   * 🔴 **두 상태가 같은 두께의 링을 갖는다.** 한쪽만 `none` 으로 바꾸면 box-sizing 덕에 크기는
   * 같아 보이지만, 다음 사람이 반대쪽을 고칠 때 12칸 열이 어긋난다. 그리고 무엇보다 **지급 칸의
   * 링이 사라지면 색이 유일한 채널이 된다.**
   */
  it('지급·미지급 칸이 같은 1px 링 선언을 갖고, 지급 쪽만 색이 있다', () => {
    const border = declarationOf(cellBlock, 'border');

    expect(border, 'RhythmCell 에 border 선언이 없다 — 링 채널이 사라졌다').not.toBeNull();
    expect(border).toMatch(/^1px solid /);
    expect(border).toContain('$paid');
    expect(border).toContain('accentAltText');
    expect(border).toContain("'transparent'");
  });

  /**
   * 🔴 링 색을 낮추지 마라. 부품 주석의 실측 근거 — `accentAltBorder` 는 1.19~2.08:1,
   * `accentAlt` 는 2.69~3.00:1(grape/light 는 3:1 미달)이다. 링이 안 보이면 없는 것과 같다.
   */
  it('링 색을 accentAltBorder·accentAlt 로 낮추지 않는다', () => {
    const border = declarationOf(cellBlock, 'border') ?? '';

    expect(border).not.toMatch(/accentAltBorder/);
    expect(border).not.toMatch(/accentAlt\b(?!Text)/);
  });

  /** 렌더 층이 보는 400/700 이 **어디서 오는지**까지 못 박는다(리터럴 하드코딩 방지). */
  it('굵기가 $paid 분기로 bold ↔ regular 를 가른다', () => {
    const weight = declarationOf(cellBlock, 'font-weight');

    expect(weight, 'RhythmCell 에 font-weight 선언이 없다 — 굵기 채널이 사라졌다').not.toBeNull();
    expect(weight).toContain('$paid');
    expect(weight).toContain('font.weight.bold');
    expect(weight).toContain('font.weight.regular');
  });

  /**
   * 🔴 면색은 **신호로 치지 않지만**, 두 상태가 같은 면을 쓰기 시작하면 링·굵기만 남아 신호가
   * 하나로 줄어든다. 갈라져 있다는 사실만 확인한다(어느 색인지는 대비 게이트의 몫).
   */
  it('면색과 글자색도 여전히 두 상태로 갈린다', () => {
    for (const property of ['background', 'color']) {
      const declaration = declarationOf(cellBlock, property);
      expect(declaration, `RhythmCell 의 ${property} 선언이 없다`).not.toBeNull();
      expect(declaration).toContain('$paid');
    }
  });
});

describe('S5 12칸 리듬 — 범례는 두 상태를 모두 설명한다', () => {
  /**
   * 🔴 **동어반복 금지.** 기대값을 `LANDING_COPY` 에서 파생하면 문장을 줄여도 영원히 초록이다
   * (pitfalls 2026-08-01). 공개 지면의 약속이므로 **리터럴로** 적는다 — 고치려면 여기도 함께 고쳐야
   * 하고, 그 마찰이 바로 원하는 것이다.
   */
  it('범례 문장이 그대로다', () => {
    expect(LANDING_COPY.payout.legend).toBe(
      '테두리가 둘린 진한 칸이 배당을 지급한 달이고, 나머지 옅은 칸은 지급이 없었던 달입니다.'
    );
  });

  /**
   * 카피 상수가 살아 있는 것과 **화면에 실제로 그려지는 것**은 다른 회귀다
   * (`<RhythmFootnote>{copy.legend}</RhythmFootnote>` 한 줄을 지우면 위 테스트는 그대로 초록이다).
   */
  it('범례와 각주가 실제로 렌더된다', () => {
    const { getByText } = renderRhythm();

    expect(getByText(LANDING_COPY.payout.legend)).toBeTruthy();
    expect(getByText(LANDING_COPY.payout.footnote)).toBeTruthy();
  });

  /**
   * 리터럴 단정과 **다른 회귀를 잡는** 의미 단정. 문장을 다시 쓰더라도 ①모양 단서(테두리)
   * ②지급한 달 ③지급이 없던 달 — 셋을 모두 말해야 한다. 색 이름만 남는 범례는 실패다.
   */
  it('범례가 모양 단서와 두 상태를 모두 말한다', () => {
    const legend = LANDING_COPY.payout.legend;

    expect(legend).toMatch(/테두리|링|외곽선/);
    expect(legend).toMatch(/지급한 달|지급하는 달|지급이 있었던/);
    expect(legend).toMatch(/지급이 없|지급하지 않/);
  });
});
