import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

/* -------------------------------------------------------------------------- */
/* 리빌 공통 — 히어로(시간 기반) · 섹션(스크롤 기반)이 나눠 쓰는 이징/키프레임        */
/* -------------------------------------------------------------------------- */

/** Apple 마케팅 페이지풍 이징 — 초기 가속 없이 길게 감속하며 안착. */
export const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * 등장 키프레임 — **시간 기반 마운트 리빌(히어로)과 스크롤 기반 리빌(섹션)이 같은 키프레임을 공유**한다.
 * 은은하게: opacity 0→1, translateY 24px→0. 과한 점프·바운스·블러 없음
 * (blur 는 중간 스크롤 구간에 텍스트가 흐릿하게 남아 사용자 요청으로 제거 — 2026-07-22).
 */
export const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;

/** 목차 진행 레일 — 스크롤 타임라인에 매여 위에서 아래로 자란다(스크롤 진행도 = 애니메이션 진행도). */
export const scrollRail = keyframes`
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
`;

/**
 * 히어로(첫 화면·above-the-fold) 요소용 **시간 기반 마운트 리빌**.
 *
 * `view()` 스크롤 타임라인은 로드 시점에 이미 뷰포트 안에 있는 요소를 애니메이트하지 못한다(entry 구간이
 * 이미 지나 있어 곧장 종료 상태로 스냅된다). 그래서 히어로는 스크롤 연동 대신 마운트 애니메이션으로
 * `$delay` stagger 한다 — CSS 애니메이션이라 JS 트리거가 필요 없고 전 브라우저에서 동작한다.
 */
export const HeroReveal = styled.div<{ $delay?: number }>`
  animation: ${revealIn} 620ms ${REVEAL_EASE} both;
  animation-delay: ${({ $delay = 0 }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
