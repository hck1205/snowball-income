// @vitest-environment node — 문자열을 만드는 순수 유틸이라 DOM 이 필요 없다 (기준: vitest.config.ts)
import { heroIconOpticalAlign, iconFirstLineAlign, iconOpticalAlign } from '@/shared/styles';

/**
 * **아이콘 ↔ 글자 세로 정렬 상수의 계약.**
 *
 * 이 레포에서 가장 자주 재발한 결함 영역이라(pitfalls "세로 정렬"), 실측으로 정한 사실을
 * 문자열 계약으로 못 박는다. jsdom 은 레이아웃을 계산하지 않아 **잔차 px 은 여기서 잴 수 없다** —
 * 잴 수 있는 것은 "어느 자리에 보정을 걸고 어느 자리에 안 거는가"뿐이고, 그게 정확히
 * 2026-07-30 에 틀려 있던 부분이다.
 *
 * ## 실측(헤드리스 크롬 + `TextMetrics`, 2026-07-30)
 *
 * 어긋남 = `(actualAsc − actualDesc)/2 − (fontAsc − fontDesc)/2`, 글자 크기로 나눈 값.
 *
 * | 서체 | 실측 | 판정 |
 * |---|---|---|
 * | `font.display`(Snowball Display 800, 30px) — 실제 히어로 제목 7개 | 0.0875 ~ 0.1187, **평균 0.0997** | 보정 필요 → 0.1 |
 * | `font.sans`(Wanted Sans, 12px) — 본문 | **±0.0039**(≈0.05px) | **보정 불필요** |
 *
 * 같은 DOM 을 세 벌 그려 잰 잔차(아이콘 중심 − 첫 줄 잉크 중심):
 * 구 유틸(margin + translateY −0.1em) **−0.92px** / 현행(margin 만) **+0.28px** /
 * 옛 `margin-top: 2px` **+1.89px**.
 */
describe('iconOpticalAlign — 헤딩 서체 전용 잉크 보정', () => {
  it('제목 크기를 기준으로 위로 올린다 (아이콘 자신의 em 이 아니다)', () => {
    expect(iconOpticalAlign('30px')).toContain('translateY(calc(30px * -0.1))');
  });

  it('히어로 배지는 같은 유틸을 히어로 제목 크기로 적용한 것이다 (복제본이 아니다)', () => {
    expect(heroIconOpticalAlign).toContain('* -0.1))');
    expect(heroIconOpticalAlign).toContain('clamp(');
  });
});

describe('iconFirstLineAlign — 본문 서체, 첫 줄 라인박스 정렬', () => {
  it('아이콘을 첫 줄 라인박스 중심까지만 내린다', () => {
    expect(iconFirstLineAlign('12px', 1.4)).toContain('margin-top: calc((12px * 1.4 - 16px) / 2)');
  });

  it('아이콘 크기를 바꾸면 내리는 양도 함께 바뀐다', () => {
    expect(iconFirstLineAlign('14px', 1.5, 20)).toContain('margin-top: calc((14px * 1.5 - 20px) / 2)');
  });

  /*
   * 🔴 이 단정이 이번 수정의 핵심이다. 본문 서체(Wanted Sans)는 라인박스 중심과 잉크 중심이
   * 사실상 겹치는데(±0.0039em) 헤딩 서체의 0.1em 을 그대로 가져다 쓰고 있었다 — 없던 오차를
   * 1.2px 만든 셈이다. 되돌리면 여기서 빨개진다.
   */
  it('잉크 보정(translateY)을 걸지 않는다 — 본문 서체는 보정이 필요 없다', () => {
    expect(iconFirstLineAlign('12px', 1.4)).not.toContain('translateY');
  });
});
