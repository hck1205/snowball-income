import { DATA_RADIUS, cardElevation, space } from '@/shared/styles';

/*
 * 여러 관심사 파일이 **공유하는 면 조각**만 여기 산다(데크·작업대·빈 상태가 같이 쓴다).
 * 밖으로는 내보내지 않는다 — `styled/index.ts` 는 이 파일을 재수출하지 않는다.
 */

/** 두 본문 카드가 공유하는 패딩. 값이 갈리면 두 열이 다른 부품처럼 보인다 — 한 자리에서 소유한다. */
export const SURFACE_PAD = 'clamp(16px, 2vw, 24px)';

/** 목록 열(주역)과 지도 열이 공유하는 본문 카드. 위계 수단은 테두리 하나뿐이다. */
export const bodyCard = `
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
`;
