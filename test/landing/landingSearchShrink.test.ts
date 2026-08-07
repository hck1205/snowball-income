import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 랜딩 검색 상자가 **좁은 폭에서 줄어드는가** — 소스로 잠근다.
 *
 * ## 🔴 왜 렌더 테스트가 아니라 소스인가
 * 2026-08-07 Android Chrome 에서 이 상자가 페이지 전체에 가로 스크롤을 만들었다. 원인은
 * flex 항목의 기본 min-width 가 auto 여서, input 이 **플레이스홀더 글자 폭보다 작아지지
 * 못한 것**이다("SCHD, JEPI 같은 종목을 검색해 보세요").
 *
 * 🔴 **이 결함은 폰트 폭에 따라 갈린다.** 같은 393px 에서도 윈도우 헤드리스(좁은 한글 폴백)에서는
 * 아슬아슬하게 들어오고 안드로이드(넓은 폴백)에서는 넘친다 — 실제로 CDP 모바일 에뮬레이션
 * (mobile:true · DPR 3 · Android UA)으로도 재현되지 않았다. jsdom 은 레이아웃 자체가 없으니
 * 더더욱 못 본다. **그래서 재는 것은 픽셀이 아니라 "줄어들 수 있게 선언했는가"다.**
 *
 * ⚠ 이 파일이 빨개지면 픽셀을 재지 말고 선언을 되돌려라 — 실측으로는 안 잡히는 종류의 결함이다.
 */
/* ⚠ __dirname 을 쓴다 — 이 레포의 소스 스캔 테스트 관례다(shared/styles/geometry.test.ts).
   import.meta.url 은 환경에 따라 파일 URL 이 아닐 수 있어 읽기가 통째로 실패한다. */
const SOURCE = readFileSync(
  resolve(__dirname, '../../pages/Landing/components/LandingSearch/LandingSearch.styled.ts'),
  'utf-8'
);

/** `export const X = styled.tag\`…\`` 한 덩어리를 꺼낸다(이 레포의 표기 관례). */
const blockOf = (name: string): string => {
  const start = SOURCE.indexOf(`export const ${name} = styled`);
  expect(start, `${name} 선언을 찾지 못했다`).toBeGreaterThan(-1);
  const open = SOURCE.indexOf('`', start);
  const close = SOURCE.indexOf('\n`;', open);
  return SOURCE.slice(open, close);
};

describe('랜딩 검색 — 좁은 폭에서 상자가 줄어든다', () => {
  /**
   * 🔴 이 단정이 사고를 직접 막는다. 지우면 안드로이드에서 가로 스크롤이 되돌아온다.
   */
  it('입력을 감싸는 상자가 내용보다 작아질 수 있다 (min-width: 0)', () => {
    expect(blockOf('SearchInputWrap')).toMatch(/min-width:\s*0/);
  });

  it('상자가 부모를 넘지 않는다 (max-width: 100%)', () => {
    expect(blockOf('SearchInputWrap')).toMatch(/max-width:\s*100%/);
  });

  /**
   * input 은 size 특성(기본 20자)에서 오는 고유 폭을 갖는다 — width 100% 가 그것을 무력화한다.
   * min-width: 0 과 **한 쌍**이라 둘 다 있어야 한다.
   */
  it('입력이 자기 고유 폭 대신 남는 자리를 쓴다 (min-width: 0 + width: 100%)', () => {
    const input = blockOf('SearchInput');
    expect(input).toMatch(/min-width:\s*0/);
    expect(input).toMatch(/width:\s*100%/);
  });

  /** ⚠ 고정 폭이 하나라도 끼면 위 셋이 무의미해진다. */
  it('상자·입력 어디에도 고정 px 폭이 없다', () => {
    for (const name of ['SearchInputWrap', 'SearchInput']) {
      expect(blockOf(name), name).not.toMatch(/(?:^|\s)(?:min-)?width:\s*\d+px/);
    }
  });
});
