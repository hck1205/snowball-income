import { DIVIDEND_LIST_HUB_PATH, INVESTOR_TYPE_PATH } from '@/shared/constants/routes';

/**
 * 랜딩 히어로의 **수준 4갈래**.
 *
 * ## 왜 생겼나 (2026-08-17 사용자 결정)
 * 이 지면의 히어로 CTA 는 `배당 계산 시작하기` · `보유 종목으로 계산` 둘이었다 — 전부 **이미 무엇을
 * 할지 아는 사람**용이다. 배당을 모르는 방문자는 4천 픽셀짜리 문서를 스스로 훑어 자기 자리를 찾아야
 * 했고, 입문자용 5걸음 경로(`StartPath`)는 있는데도 문서 중간에 묻혀 발견되지 않았다.
 * 후킹이 약했던 원인은 콘텐츠 부족이 아니라 **분기가 없는 것**이었다.
 *
 * ## 🔴 레벨 이름이 아니라 **자기 진술 문장**으로 고르게 한다
 * "중급자입니까?" 는 자기 판단이 흔들린다(겸손한 사람은 초보를 고르고 그 반대도 있다).
 * "포트폴리오는 있다" 는 사실이라 흔들리지 않는다. `statement` 가 카드의 주인공이고 `name` 은
 * 분류 라벨일 뿐이다 — 크기·무게를 뒤집지 마라.
 *
 * ## 도착지는 **이미 있는 화면**이다
 * 넷 중 신규 화면은 중급자의 성향 테스트 하나뿐이다(사용자 결정). 나머지 셋은 기존 지면으로 보낸다 —
 * 새 화면을 만드는 것보다 **묻혀 있던 것을 꺼내는 쪽**이 이 문제의 실제 해법이었다.
 *
 * ⚠ `id` 는 계측 파라미터(`level_id`)의 출처다. 바꾸면 그 이전 데이터와 시계열이 끊긴다.
 */

export type LandingLevelId = 'beginner' | 'novice' | 'intermediate' | 'advanced';

export type LandingLevel = {
  readonly id: LandingLevelId;
  /** 분류 라벨. 카드에서 작게 선다. */
  readonly name: string;
  /** 카드의 주인공 — 사용자가 자기 상태를 알아보는 문장. */
  readonly statement: string;
  /** 도착지에서 무엇을 하게 되는지 한 줄. */
  readonly outcome: string;
  readonly to: string;
};

export const LANDING_LEVELS: readonly LandingLevel[] = [
  {
    id: 'beginner',
    name: '완전 입문자',
    statement: '주식도 배당도 뭔지 잘 모르겠습니다',
    outcome: '계좌 여는 법부터 다섯 걸음으로 안내합니다',
    to: '/guide/how-to-start-investing'
  },
  {
    id: 'novice',
    name: '초보자',
    statement: '계좌는 있는데 뭘 사야 할지 모르겠습니다',
    outcome: '배당을 오래 늘려 온 기업 목록과 구성 예시를 봅니다',
    to: DIVIDEND_LIST_HUB_PATH
  },
  {
    id: 'intermediate',
    name: '중급자',
    statement: '포트폴리오는 있고, 제 성향에 맞는지 알고 싶습니다',
    outcome: '12문항으로 성향을 보고 닮은 투자자와 구성을 찾습니다',
    to: INVESTOR_TYPE_PATH
  },
  {
    id: 'advanced',
    name: '고수',
    statement: '설명은 됐고 도구만 쓰겠습니다',
    outcome: '종목 비교 · 대가들의 13F · 시장 통계로 바로 갑니다',
    to: '/ticker/compare'
  }
] as const;

export const findLandingLevel = (id: string): LandingLevel | undefined =>
  LANDING_LEVELS.find((level) => level.id === id);
