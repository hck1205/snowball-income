// @vitest-environment node — 소스 문자열만 본다.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GA4 **예약 의미를 가진 파라미터 이름**을 이벤트에 싣지 못하게 막는다.
 *
 * ## 왜 (2026-08-22 실측)
 * `trackEvent(..., { source: 'main_left_panel' })` 같은 호출이 GA4 의 **유입 출처를 덮어썼다.**
 * 내부 클릭이 새 유입처럼 잡혀 28일 기준 약 28세션이 가짜 출처를 달고 있었다:
 * ```
 *   Unassigned / main_left_panel  19세션
 *   Unassigned / preset            4세션
 *   Unassigned / ticker_chip       3세션
 *   Unassigned / custom            2세션
 * ```
 * 세션 수가 부풀 뿐 아니라 "사람들이 어디서 오는가"라는 질문의 답이 통째로 오염된다. 그리고 이 오염은
 * **화면에 아무 증상이 없다** — 대시보드를 열어 유입을 들여다볼 때에야, 그것도 이상하다고 눈치챌 때에야
 * 드러난다. 그래서 사람의 주의가 아니라 테스트로 막는다.
 *
 * ⚠ 대체 이름은 자유롭게 골라도 된다(`placement`·`origin`·`provider` 를 쓰고 있다). 금지는
 *   **GA4 가 이미 뜻을 정해 둔 이름**뿐이다.
 * ⚠ 이 검사는 `trackEvent(` 호출 뒤 한 덩어리만 본다. 파라미터 객체를 변수로 빼서 넘기면 빠져나간다 —
 *   그때는 이 테스트가 아니라 리뷰가 잡아야 한다(완벽한 그물은 아니고, 흔한 실수를 막는 그물이다).
 */

/** GA4 가 유입 귀속·캠페인 해석에 쓰는 이름들. 이벤트 파라미터로 쓰면 안 된다. */
const RESERVED = ['source', 'medium', 'campaign', 'term', 'content'];

const ROOTS = ['pages', 'components', 'shared', 'jotai', 'router'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });

const files = ROOTS.flatMap((root) => walk(resolve(__dirname, '../../', root)));

/** `trackEvent(` 부터 균형 잡힌 닫는 괄호까지. 중첩 객체·문자열 안의 괄호를 대충 넘기지 않기 위해서다. */
const trackEventCalls = (source: string): string[] => {
  const calls: string[] = [];
  let index = source.indexOf('trackEvent(');

  while (index >= 0) {
    let depth = 0;
    let cursor = index + 'trackEvent'.length;
    for (; cursor < source.length; cursor += 1) {
      if (source[cursor] === '(') depth += 1;
      else if (source[cursor] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    calls.push(source.slice(index, cursor + 1));
    index = source.indexOf('trackEvent(', cursor);
  }

  return calls;
};

describe('GA4 예약 파라미터 금지', () => {
  it('🔴 trackEvent 에 source·medium·campaign 등을 싣지 않는다', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      if (!source.includes('trackEvent(')) continue;

      for (const call of trackEventCalls(source)) {
        // 주석은 뺀다 — 이 금지를 **설명하는** 주석이 스스로 걸리면 안 된다.
        const code = call.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        for (const name of RESERVED) {
          // `{ source }` 축약과 `source: x` 둘 다 잡는다.
          const shorthand = new RegExp(`[{,]\s*${name}\s*[,}]`);
          const explicit = new RegExp(`[{,]\s*${name}\s*:`);
          if (shorthand.test(code) || explicit.test(code)) {
            offenders.push(`${file.split(/[\/]/).slice(-2).join('/')} → ${name}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
