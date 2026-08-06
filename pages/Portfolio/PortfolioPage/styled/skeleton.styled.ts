import styled from '@emotion/styled';
import { color, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 로딩 — 값을 지어내지 않고 형태로만 말한다                                     */
/* -------------------------------------------------------------------------- */

/**
 * 값이 오기 전 자리.
 *
 * 🔴 면은 `surfaceSunken` 이다 — 구 값 `surfaceMuted` 는 **흰 카드 위 1.054:1** 이라
 * 골격이 보이지 않았다(실측 2026-08-03). 보이지 않는 골격은 "로딩 중"이 아니라 "빈 화면"이다.
 * `surfaceSunken`(1.112:1)은 흰 캔버스에서 면 사다리의 유일한 진짜 계단이고 tintscan 중립 토큰이다.
 * ⚠ `surfaceMuted` 를 되돌리지 마라 — 그 토큰은 더 어둡게 내릴 수도 없다
 *   (ink 라이트에서 공통 `data-positive` 가 그 면 위 4.50:1 knife-edge — presets/sharedTokens.ts).
 */
export const SkeletonBar = styled.span`
  display: inline-block;
  width: 96px;
  height: 1em;
  border-radius: ${radius.xs};
  background: ${color.surfaceSunken};
`;

/**
 * 목록 자리의 로딩 골격. 종전에는 44px 짜리 회색 막대 세 개였다 — 실제 행과 형태가 달라
 * 값이 들어오는 순간 레이아웃이 튀었다. 지금은 **실제 행의 골격**(왼쪽 이름 덩어리 + 오른쪽 값 셋)이다.
 */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
`;

/** 위 `SkeletonBar` 와 같은 이유로 `surfaceSunken` 이다(구 `surfaceMuted` = 흰 카드 위 1.054:1). */
export const SkeletonCell = styled.span`
  display: block;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${color.surfaceSunken};
`;
