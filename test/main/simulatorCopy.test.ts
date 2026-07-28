import { describe, expect, it } from 'vitest';
import { SIMULATOR_COPY, TOUR_STEPS } from '@/shared/constants';

/**
 * 시뮬레이터 화면 카피의 **정본**.
 *
 * 왜 상수를 리터럴로 다시 적어 못박는가: 컴포넌트 테스트는 대부분 `SIMULATOR_COPY.x` 를 기대값으로
 * 쓴다(그래야 "세 자리가 같은 상수를 쓴다"를 증명한다). 그런데 그건 **동어반복**이라 문구가 통째로
 * 축약돼도 전부 초록이다 — 실제로 이 레포에서 shortLabel 축약이 전 스위트를 통과한 이력이 있다.
 * 그래서 "무엇을 말하는가"는 여기 한 곳에서 정확일치로 잠근다(`ALLOCATION_COPY` 선례와 같은 형태).
 */

describe('SIMULATOR_COPY — 확정 문자열', () => {
  it('빈 상태 안내는 방향이 아니라 행동을 말한다', () => {
    // 좌측 설정 컬럼이 사라졌으므로 "좌측에서…"류 안내는 전부 거짓이 된다.
    expect(SIMULATOR_COPY.emptyPortfolioHint).toBe('투자 설정을 열어 종목을 추가하면 결과가 나타납니다.');
  });

  it('설정 진입/닫기/제목/조건 수정 라벨', () => {
    expect(SIMULATOR_COPY.settingsClose).toBe('설정 닫기');
    expect(SIMULATOR_COPY.settingsTitle).toBe('투자 설정');
    expect(SIMULATOR_COPY.editCondition).toBe('조건 수정');
    // 설정을 여는 라벨은 하나다 — 구 헤더 버튼의 "설정 열기"는 삭제됐다(2026-07-29).
    expect(SIMULATOR_COPY).not.toHaveProperty('settingsOpen');
  });

  it('히어로 제목과 리드', () => {
    expect(SIMULATOR_COPY.heroTitle).toBe('배당 시뮬레이터');
    expect(SIMULATOR_COPY.heroLede).toBe('포트폴리오와 투자 조건을 넣으면 장기 배당 현금흐름을 계산합니다.');
  });
});

/**
 * **부재 계약** — 화면이 존재하지 않는 것을 가리키지 않는다.
 *
 *  - 방향어("좌측/왼쪽"): 설정이 좌측 고정 컬럼에서 오버레이 드로어로 옮겨가면서 전부 거짓이 됐다.
 *  - 눈덩이/스노우볼 비유: 제품 카피에서 전면 금지된 표현이다(브랜드명은 예외라 여기엔 나오지 않는다).
 *
 * 부재는 눈으로 훑어서는 유지되지 않는다 — 카피를 늘릴 때마다 자동으로 걸리게 둔다.
 */
const BANNED_DIRECTIONS = ['좌측', '왼쪽', '우측', '오른쪽'];
const BANNED_METAPHORS = ['눈덩이', '스노우볼'];

describe('시뮬레이터 카피 — 금지 표현 부재', () => {
  it('SIMULATOR_COPY 에 방향어가 없다', () => {
    const offenders = Object.entries(SIMULATOR_COPY).filter(([, text]) =>
      BANNED_DIRECTIONS.some((word) => text.includes(word))
    );

    expect(offenders).toEqual([]);
  });

  it('가이드 투어 문구에 방향어가 없다', () => {
    const offenders = TOUR_STEPS.filter((step) =>
      BANNED_DIRECTIONS.some((word) => step.title.includes(word) || step.body.includes(word))
    ).map((step) => step.id);

    expect(offenders).toEqual([]);
  });

  it('가이드 투어 문구에 눈덩이/스노우볼 비유가 없다', () => {
    const offenders = TOUR_STEPS.filter((step) =>
      BANNED_METAPHORS.some((word) => step.title.includes(word) || step.body.includes(word))
    ).map((step) => step.id);

    expect(offenders).toEqual([]);
  });

  it('가이드 투어가 삭제된 기능(화면 캡처·JSON 내보내기·Save 패널)을 안내하지 않는다', () => {
    const removed = ['화면 캡처', 'JSON', '내보내기'];
    const offenders = TOUR_STEPS.filter((step) => removed.some((word) => step.body.includes(word))).map(
      (step) => step.id
    );

    expect(offenders).toEqual([]);
  });
});
