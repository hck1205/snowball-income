// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 비교표 열 머리 고정(sticky) 계약 — **소스 레벨**로 잠근다.
 *
 * 사용자 요청(2026-08-03): *"선택한 종목의 지표 비교에서 선택된 티커들을 scroll 내리면 fixed로
 * 할 수 있나"*. 스크롤을 내려도 지금 무엇끼리 비교 중인지가 남아야 한다 — 이 표는 행이 20줄이
 * 넘어서, 머리가 밀려 나가면 남는 것은 **주어 없는 숫자 기둥**이다.
 *
 * ## 🔴 왜 렌더 테스트가 아니라 소스 가드인가
 * jsdom 은 레이아웃을 계산하지 않는다 — `position: sticky` 가 실제로 붙는지는 **원리적으로**
 * 볼 수 없다(getBoundingClientRect 가 전부 0이다). 그래서 이 회귀는 전 스위트가 초록인 채로
 * 들어온다. 실제 붙는지는 실브라우저 실측이 유일한 검증이고(아래 실측표), 이 테스트가 지키는 것은
 * **그 실측을 성립시킨 전제가 조용히 사라지지 않는 것**이다.
 *
 * ## 이 계약이 지키는 진짜 함정
 * CSS 는 overflow 두 축을 따로 놀게 두지 않는다. 한 축이 `auto` 면 나머지 `visible` 은 `auto` 로,
 * **`clip` 은 `hidden` 으로 계산된다.** 그러면 그 상자가 세로 스크롤포트가 되고, 자식의 sticky 는
 * 페이지가 아니라 **그 상자**를 기준으로 잡는다 — 상자는 세로로 안 움직이니 머리가 영영 안 붙는다.
 * 실측(Chrome 150, 1280px): 스크롤 후 열 머리 top 이 **-191px**(화면 밖)이었다.
 *
 * 그래서 처방은 "가로 스크롤 상자를 **넓은 폭에서는 아예 만들지 않는 것**"이다. 이 표는 최대
 * 4종목이라 열이 다섯을 넘지 않고, 940px 부터 가로로 넘치지 않는다(scrollWidth === clientWidth).
 *
 * 실측 (2026-08-03 · Chrome 150 · 4종목):
 * ```
 *   뷰포트   머리 top   앱 헤더   붙음   가로 스크롤   페이지 가로넘침
 *     390      -324      111      ✗       필요            없음
 *     820      -167      105      ✗       필요            없음
 *    1024        97       97      ✓       불필요          없음
 *    1280        97       97      ✓       불필요          없음
 *    1600        97       97      ✓       불필요          없음
 * ```
 *
 * ⚠ **1024px 미만에서는 안 붙는다** — 거기서는 가로 스크롤이 먼저다(좁은 폭에서 열이 잘리면
 *   비교 자체가 성립하지 않는다). 그 폭에서만 뜨는 ScrollHint 가 같은 판단의 다른 얼굴이다.
 */
const STYLED = readFileSync(
  resolve(__dirname, '../../pages/Ticker/TickerComparePage/TickerComparePage.styled.ts'),
  'utf8'
);

/** 선언 블록 하나를 이름으로 떼어 온다(다음 `export const` 직전까지). */
const blockOf = (name: string): string => {
  const start = STYLED.indexOf(`export const ${name} = styled`);
  expect(start, `${name} 선언을 찾지 못했다 — 이름이 바뀌었으면 이 테스트도 함께 고쳐라`).toBeGreaterThan(-1);
  const next = STYLED.indexOf('export const ', start + 1);
  return STYLED.slice(start, next === -1 ? undefined : next);
};

describe('비교표 — 열 머리 고정', () => {
  /**
   * 🔴 계약의 핵심. 가로 스크롤 상자를 **항상** 켜 두면 세로 sticky 가 죽는다.
   * 넓은 폭에서 스크롤포트를 해제하는 미디어 쿼리가 이 부품의 전제다.
   */
  it('넓은 폭에서는 가로 스크롤 상자를 해제한다 — 그래야 sticky 기준이 뷰포트가 된다', () => {
    const scroller = blockOf('TableScroller');

    expect(scroller).toContain('overflow-x: auto');
    expect(scroller).toMatch(/media\.up\('headerStack'\)/);
    // 해제는 두 축을 함께 풀어야 한다 — 한 축만 visible 이면 CSS 가 도로 auto 로 계산한다.
    expect(scroller).toMatch(/media\.up\('headerStack'\)\s*\}?\s*\{[^}]*overflow:\s*visible/);
  });

  /**
   * ⚠ `overflow-y: clip` 은 이 조합에서 **hidden 으로 계산된다**(실측 확인). 회피처럼 보이지만
   * 상자는 그대로 스크롤포트로 남아 머리가 안 붙는다 — 되살아나면 조용히 기능이 죽는다.
   */
  it('overflow-y 를 손으로 적어 스크롤포트를 되살리지 않는다', () => {
    const scroller = blockOf('TableScroller');

    expect(scroller).not.toMatch(/overflow-y:\s*(clip|hidden|auto|scroll)/);
  });

  /** 열 머리와 좌상단 모서리는 둘 다 세로로 붙어야 한다 — 한쪽만 붙으면 표가 어긋나 보인다. */
  it.each([
    ['HeadCell', '종목 열 머리'],
    ['HeadCorner', '좌상단 모서리']
  ])('%s(%s)가 앱 헤더 높이만큼 내려와 붙는다', (name) => {
    const block = blockOf(name);

    expect(block).toContain('position: sticky');
    // 🔴 상수 px 로 적으면 헤더가 2줄이 되는 폭에서 머리가 헤더 밑으로 파고든다.
    expect(block).toContain('top: ${appHeaderHeight}');
  });

  /** 고정된 머리 밑으로 행이 비쳐 지나가면 안 된다 — 배경은 장식이 아니라 기능이다. */
  it.each(['HeadCell', 'HeadCorner'])('%s 는 불투명한 면을 갖는다', (name) => {
    expect(blockOf(name)).toContain('background: ${color.surface}');
  });

  /**
   * 층위: 모서리(양축 고정) > 열 머리(세로) > 항목 열(가로). 어긋나면 좁은 폭에서 가로로 밀 때
   * 항목 이름이 열 머리 **위로** 올라온다.
   */
  it('겹침 순서가 모서리 > 열 머리 > 항목 열이다', () => {
    const z = (name: string) => Number(/z-index:\s*(\d+)/.exec(blockOf(name))?.[1]);

    expect(z('HeadCorner')).toBeGreaterThan(z('HeadCell'));
    expect(z('HeadCell')).toBeGreaterThan(z('MetricCell'));
  });
});
