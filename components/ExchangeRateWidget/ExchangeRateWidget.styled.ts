import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 위젯 컨테이너 — 좌패널의 도구 카드(Card)보다 가벼운 정보 스트립.
 * `width:100% + min-width:0` 로 좁은 좌패널에서도 가로 오버플로가 나지 않는다(AC12).
 */
export const Root = styled.section`
  display: grid;
  gap: ${space[2]};
  width: 100%;
  min-width: 0;
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: clamp(12px, 1.6vw, 16px);
  color: ${color.text};
`;

/** 환율 값 + as-of 를 한 줄에. 좁아지면 자연스럽게 줄바꿈된다(오버플로 방지). */
export const RateLine = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[1]} ${space[3]};
  margin: 0;
`;

/** "$1 ≈ 1,478원" — 값 텍스트는 **중립 토큰만**(AC11: accent·손익색 금지). */
export const Rate = styled.span`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

export const RateValue = styled.strong`
  color: ${color.text};
  font-weight: ${font.weight.bold};
`;

/** "2026-07-23 기준" — 보조 정보라 muted. */
export const AsOf = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  ${font.numeric}
`;

/** 옅은 '업데이트 실패' 표식 — 손익색이 아니라 중립 muted(AC11). */
export const StaleMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/** 상시 노출 안내(AC3) — 접기/닫기 없이 항상 보인다. */
export const Disclaimer = styled.small`
  display: block;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/** 값이 아예 없을 때의 중립 안내(AC6). */
export const Message = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/**
 * 로딩 스켈레톤 바 — 성공 상태와 **같은 줄 구성/높이**로 렌더해 레이아웃 점프를 없앤다(AC 로딩).
 * `1em` 높이는 담는 요소의 font-size 를 따라가 실제 텍스트 줄 높이에 맞춰진다.
 */
export const SkeletonBar = styled.span<{ w: string }>`
  display: block;
  height: 1em;
  width: ${({ w }) => w};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  animation: ${pulse} 1.2s ${motion.ease} infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
