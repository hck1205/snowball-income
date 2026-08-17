// @vitest-environment node — 데이터만 본다.
import { describe, expect, it } from 'vitest';
import {
  INVESTOR_AXES,
  INVESTOR_AXIS_IDS,
  INVESTOR_QUESTIONS,
  INVESTOR_TYPE_CODES,
  INVESTOR_TYPE_PROFILES
} from '@/shared/constants/investorType';
import { findInvestor } from '@/shared/constants/investors';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';

/**
 * 성향 테스트 **데이터의 불변식**.
 *
 * 이 파일이 막는 것은 로직 버그가 아니라 **데이터가 조용히 어긋나는 것**이다 — 문항을 하나 더 넣어
 * 축 해상도가 갈리거나, 프리셋 id 를 오타 내서 결과의 "계산기로 열기"가 아무것도 안 하거나,
 * 대가 CIK 가 공시 스냅샷에 없어 카드가 비는 종류의 사고다. 전부 화면에서는 조용히 실패한다.
 */

describe('축', () => {
  it('네 축이고 id 가 중복되지 않는다', () => {
    expect(INVESTOR_AXES).toHaveLength(4);
    expect(new Set(INVESTOR_AXIS_IDS).size).toBe(4);
  });
});

describe('문항', () => {
  it('12문항이다', () => {
    expect(INVESTOR_QUESTIONS).toHaveLength(12);
  });

  it('문항 id 가 중복되지 않는다', () => {
    const ids = INVESTOR_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('축마다 문항 수가 같다', () => {
    /**
     * 🔴 한 축만 문항이 많으면 그 축의 해상도만 높아진다. 정규화가 0~100 으로 눌러 주기 때문에
     * **점수만 봐서는 눈치챌 수 없다** — 그래서 데이터에서 막는다.
     */
    const counts = INVESTOR_AXIS_IDS.map(
      (axisId) => INVESTOR_QUESTIONS.filter((question) => question.axis === axisId).length
    );
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBe(3);
  });

  it('모든 문항의 선택지가 넷이고 점수가 배열 순서와 같다', () => {
    // 순서가 곧 점수라는 규약(`investorTypeQuestions` 규율 2). 문구만 고치다 순서를 바꾸면 채점이 뒤집힌다.
    for (const question of INVESTOR_QUESTIONS) {
      expect(question.options).toHaveLength(4);
      question.options.forEach((option, index) => {
        expect(option.score).toBe(index);
      });
    }
  });

  it('선택지 문구가 비어 있지 않다', () => {
    for (const question of INVESTOR_QUESTIONS) {
      expect(question.question.trim().length).toBeGreaterThan(0);
      for (const option of question.options) expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('유형', () => {
  it('여섯 유형이고 id·코드가 중복되지 않는다', () => {
    expect(INVESTOR_TYPE_PROFILES).toHaveLength(6);

    const ids = INVESTOR_TYPE_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);

    const codes = Object.values(INVESTOR_TYPE_CODES);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('모든 유형에 공유 코드가 있다', () => {
    // 코드가 빠진 유형은 결과를 공유할 수 없다(링크가 유형을 못 싣는다).
    for (const profile of INVESTOR_TYPE_PROFILES) {
      expect(INVESTOR_TYPE_CODES[profile.id]).toBeTruthy();
    }
  });

  it('기준 좌표가 모든 축에 대해 0~100 안에 있다', () => {
    for (const profile of INVESTOR_TYPE_PROFILES) {
      for (const axisId of INVESTOR_AXIS_IDS) {
        const value = profile.ideal[axisId];
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('기준 좌표가 서로 다르다', () => {
    // 두 유형의 좌표가 같으면 하나는 **영원히 선택되지 않는다**(거리 동점에서 항상 뒤로 밀린다).
    const packed = INVESTOR_TYPE_PROFILES.map((profile) =>
      INVESTOR_AXIS_IDS.map((axisId) => profile.ideal[axisId]).join(',')
    );
    expect(new Set(packed).size).toBe(packed.length);
  });

  it('추천 프리셋 id 가 실제 프리셋에 있다', () => {
    // `Set<string>` 로 넓힌다 — 프리셋 id 는 리터럴 유니온이고 프로필의 presetId 는 string 이라,
    // 좁은 Set 에 넣으면 "있는지 묻는 것"조차 타입 에러가 된다(묻는 게 이 테스트의 목적이다).
    const presetIds = new Set<string>(PORTFOLIO_PRESET_PLACEHOLDERS.map((preset) => preset.id));
    for (const profile of INVESTOR_TYPE_PROFILES) {
      expect(presetIds.has(profile.presetId)).toBe(true);
    }
  });

  it('닮은 대가의 CIK 가 실제 공시 스냅샷에 있다', () => {
    /**
     * 🔴 CIK 를 이름 대신 키로 쓰는 이유가 이 검사다. 이름은 표기가 흔들리지만(워런/워렌) CIK 는
     * SEC 가 정한 식별자라 흔들리지 않는다. 스냅샷이 갱신되며 누군가 빠지면 여기서 걸린다.
     */
    for (const profile of INVESTOR_TYPE_PROFILES) {
      for (const match of profile.investors) {
        expect(findInvestor(match.cik), `${profile.name} → ${match.person} (${match.cik})`).not.toBeNull();
      }
    }
  });

  it('대가를 못 대는 유형은 빈 배열로 둔다 (억지 매칭 금지)', () => {
    /**
     * 13F 는 보유 종목·종목 수·비중을 말하지, "이 사람은 월 현금흐름을 노린다"를 말하지 않는다.
     * 현금흐름 성향 두 유형에 누군가를 채워 넣으면 데이터가 말하지 않는 것을 말하게 된다.
     * ⚠ 이 테스트를 지우고 채우려면 **그 근거가 13F 에서 읽히는지** 먼저 답해라.
     */
    const cashflowTypes = ['monthly-income', 'retirement-ready'];
    for (const id of cashflowTypes) {
      const profile = INVESTOR_TYPE_PROFILES.find((candidate) => candidate.id === id);
      expect(profile?.investors).toEqual([]);
    }
  });

  it('매칭 근거가 공시에서 읽히는 사실로 쓰여 있다', () => {
    // 근거 문장에 숫자(종목 수·비중)가 있어야 한다 — 없으면 인상 비평이다.
    for (const profile of INVESTOR_TYPE_PROFILES) {
      for (const match of profile.investors) {
        expect(match.why, `${match.person}`).toMatch(/\d/);
      }
    }
  });

  it('모든 유형이 이어지는 곳을 최소 하나 가진다', () => {
    for (const profile of INVESTOR_TYPE_PROFILES) {
      expect(profile.next.length).toBeGreaterThan(0);
      for (const link of profile.next) expect(link.to.startsWith('/')).toBe(true);
    }
  });
});
