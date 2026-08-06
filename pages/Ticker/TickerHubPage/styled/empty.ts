import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, motion, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 빈 상태                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 검색·필터가 아무것도 못 찾았을 때 — 이 화면에서 **가장 자주 방치되는 자리**다.
 *
 * 종전 빈 상태는 회색 점선 상자 안의 한 문장뿐이었다(그마저도 레지스트리가 통째로 빌 때만 떴다).
 * 여기서는 마스코트 + 무엇을 어떻게 바꾸면 되는지 + **바로 누를 수 있는 대안 티커 3종**을 준다.
 * 빈 화면이 막다른 길이 되지 않게 하는 것이 이 블록의 유일한 일이다.
 *
 * ⚠ 면은 중립이다(마스코트가 서는 브랜드 표면이지만 채도 면은 아니다).
 *
 * 🔴 면이 `surface` 가 아니라 `surfaceMuted` 인 이유: 흰 캔버스에서 `surface` 는 페이지 배경과
 * **같은 값**이라 이 패널이 통째로 사라진다(구 회색 캔버스에서는 흰 카드가 곧 덩어리였다).
 * 그리고 `surfaceSunken` 까지 내리지 않는 이유는 이 패널이 **버튼을 품기 때문**이다 — velog
 * 라이트에서 sunken 과 `surfaceHover` 가 같은 값(#f1f3f5)이라 아래 조건 지우기·대안 칩이
 * hover 피드백을 잃는다. 같은 판정을 `FeedStates.EmptyRoot` 가 먼저 실측으로 적어 뒀다.
 */
export const EmptyState = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(32px, 5vw, 56px) ${space[4]};
  border-radius: ${DATA_RADIUS};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surfaceMuted};
  text-align: center;
`;

export const EmptyGlyph = styled.span`
  display: inline-flex;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px).
 * 종전 `clamp(lg, 2vw, 2xl)` 은 @1280 에서 20px 이라 **바로 아래 티커 카드 제목(20px)과 같은 크기**였다.
 * 같은 크기는 위계가 아니다 — 빈 상태에서 제일 먼저 읽혀야 할 문장이 카드 한 장과 동급이었다.
 */
export const EmptyTitle = styled.p`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;

export const EmptyText = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${space[2]};
  margin-top: ${space[1]};
`;

/** 빈 상태의 대안 티커 칩 — 폭이 짧아(<180px) 면으로 세어지지 않는다. */
export const EmptySuggestion = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  ${font.numeric};
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
    background: ${color.surfaceHover};
  }
`;
