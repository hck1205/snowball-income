import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 위젯 컨테이너 — 주변 도구 카드(Card)와 같은 시각 언어(surface + border + radius.lg)를 쓰되,
 * 상단 아이콘 배지 + 타이틀로 **독립된 "환율 위젯"** 으로 읽히게 한다.
 * `width:100% + min-width:0` 로 좁은 좌패널에서도 가로 오버플로가 없다(AC12).
 */
export const Root = styled.section`
  display: grid;
  gap: ${space[3]};
  width: 100%;
  min-width: 0;
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: clamp(14px, 1.8vw, 18px);
  color: ${color.text};
`;

/** 위젯 정체성 헤더 — 통화 교환 아이콘 배지 + 타이틀. 어떤 상태에서도(실패 포함) 항상 보인다. */
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 통화 교환 아이콘 배지 — accent(오로라) 틴트. accent 는 **크롬(배지·아이콘) 전용**이고
 * 데이터 상승/하락색이 아니라서(presets 주석) 손익 오해를 만들지 않는다. Chip accent 변형과 동일 토큰 3종.
 */
export const IconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: ${radius.sm};
  background: ${color.accentSubtle};
  border: 1px solid ${color.accentBorder};
  color: ${color.accentText};
`;

/** "원↔달러 환율" 라벨 — 시맨틱 heading(주변 카드 h2 와 동렬), 시각적으론 값보다 작은 라벨. */
export const Title = styled.h2`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
`;

/** 값 + as-of 를 한 줄에. 좁아지면 자연스럽게 줄바꿈된다(오버플로 방지). */
export const RateLine = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[1]} ${space[3]};
  margin: 0;
`;

/**
 * "$1 ≈ 1,478원" — 위계의 앵커(크게·굵게).
 * ⚠ 값 숫자는 **중립 토큰(text)만** — 환율은 P&L 이 아니라 accent·빨강/파랑(손익색)을 쓰지 않는다.
 */
export const Rate = styled.span`
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

export const RateValue = styled.strong`
  color: ${color.text};
  font-weight: ${font.weight.extrabold};
`;

/** "2026-07-23 기준" — 보조 정보라 muted. */
export const AsOf = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  ${font.numeric}
`;

/** 옅은 '업데이트 실패' 표식 — 손익색이 아니라 중립 muted. */
export const StaleMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/** 상시 노출 안내(AC3) — 접기/닫기 없이 항상 보인다(오해 차단). */
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
 * 로딩 스켈레톤 바 — 성공 상태와 **같은 줄 구성/높이**로 렌더해 레이아웃 점프를 없앤다.
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
