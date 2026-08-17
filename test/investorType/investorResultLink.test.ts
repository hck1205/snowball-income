// @vitest-environment node — 순수 함수만 본다.
import { describe, expect, it } from 'vitest';
import { INVESTOR_AXIS_IDS, INVESTOR_TYPE_PROFILES } from '@/shared/constants/investorType';
import { decodeInvestorResult, encodeInvestorResult } from '@/shared/lib/investorType';

/**
 * 결과 **공유 링크의 왕복**.
 *
 * 🔴 공유 링크는 한 번 나가면 회수할 수 없다. 누가 카카오톡에 붙여 둔 링크가 반년 뒤에 열려도
 * 같은 유형을 보여 줘야 한다 — 그래서 이 파일은 "인코딩이 되는가"가 아니라 **"되읽어도 같은가"** 를 본다.
 */

const scoresOf = (values: number[]) =>
  Object.fromEntries(INVESTOR_AXIS_IDS.map((axisId, index) => [axisId, values[index]])) as Record<
    (typeof INVESTOR_AXIS_IDS)[number],
    number
  >;

describe('왕복', () => {
  it('여섯 유형 전부가 인코딩 → 디코딩에서 그대로 돌아온다', () => {
    for (const profile of INVESTOR_TYPE_PROFILES) {
      const scores = scoresOf([12, 34, 56, 78]);
      const encoded = encodeInvestorResult(profile, scores);
      const decoded = decodeInvestorResult(new URLSearchParams(encoded));

      expect(decoded?.profile.id, profile.name).toBe(profile.id);
      expect(decoded?.scores).toEqual(scores);
    }
  });

  it('경계값(0·100)도 보존한다', () => {
    const profile = INVESTOR_TYPE_PROFILES[0];
    const scores = scoresOf([0, 100, 0, 100]);

    const decoded = decodeInvestorResult(new URLSearchParams(encodeInvestorResult(profile, scores)));

    expect(decoded?.scores).toEqual(scores);
  });

  it('사람이 읽을 수 있는 형태다 (압축하지 않는다)', () => {
    const encoded = encodeInvestorResult(INVESTOR_TYPE_PROFILES[0], scoresOf([15, 75, 80, 85]));
    expect(encoded).toContain('15-75-80-85');
  });
});

describe('손상·구버전 방어', () => {
  it('유형 코드가 없으면 null 이다', () => {
    expect(decodeInvestorResult(new URLSearchParams(''))).toBeNull();
    expect(decodeInvestorResult(new URLSearchParams('s=1-2-3-4'))).toBeNull();
  });

  it('모르는 유형 코드는 null 이다 (throw 하지 않는다)', () => {
    expect(() => decodeInvestorResult(new URLSearchParams('t=zz'))).not.toThrow();
    expect(decodeInvestorResult(new URLSearchParams('t=zz'))).toBeNull();
  });

  it('점수가 없어도 유형은 살린다 — 막대만 가운데가 된다', () => {
    /**
     * ⚠ 링크가 죽는 것보다 낫다. 유형은 코드가 이미 확정했으므로 결과 화면은 정상적으로 그려지고,
     *   축 막대만 중립으로 선다.
     */
    const decoded = decodeInvestorResult(new URLSearchParams('t=cv'));

    expect(decoded?.profile.id).toBe('concentrated-value');
    for (const axisId of INVESTOR_AXIS_IDS) expect(decoded?.scores[axisId]).toBe(50);
  });

  it('점수가 모자라면 모자란 축만 가운데로 채운다', () => {
    // 축이 나중에 늘었을 때 옛 링크가 이렇게 온다.
    const decoded = decodeInvestorResult(new URLSearchParams('t=cv&s=10-20'));

    expect(decoded?.scores[INVESTOR_AXIS_IDS[0]]).toBe(10);
    expect(decoded?.scores[INVESTOR_AXIS_IDS[1]]).toBe(20);
    expect(decoded?.scores[INVESTOR_AXIS_IDS[2]]).toBe(50);
  });

  it('숫자가 아닌 점수는 가운데로 떨어진다', () => {
    const decoded = decodeInvestorResult(new URLSearchParams('t=cv&s=abc-20-30-40'));
    expect(decoded?.scores[INVESTOR_AXIS_IDS[0]]).toBe(50);
  });

  it('범위를 벗어난 점수는 0~100 으로 눌린다', () => {
    const decoded = decodeInvestorResult(new URLSearchParams('t=cv&s=-40-999-30-40'));
    for (const axisId of INVESTOR_AXIS_IDS) {
      expect(decoded?.scores[axisId]).toBeGreaterThanOrEqual(0);
      expect(decoded?.scores[axisId]).toBeLessThanOrEqual(100);
    }
  });
});
