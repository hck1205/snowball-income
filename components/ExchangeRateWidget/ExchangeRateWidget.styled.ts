import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { FxChangeDirection } from '@/shared/lib/fx';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 위젯 컨테이너 — 주변 도구 카드(Card)와 같은 시각 언어(surface + border + radius.lg)를 쓰되,
 * 상단 타이틀로 **독립된 "환율 위젯"** 으로 읽히게 한다.
 * `width:100% + min-width:0` 로 좁은 설정 드로어(≤400px)에서도 가로 오버플로가 없다(AC12).
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

/** 위젯 정체성 헤더 — 타이틀. 어떤 상태에서도(실패 포함) 항상 보인다. */
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
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
 * 값 + 전일 대비 변동률을 **한 덩어리**로 묶는다 — 변동률은 그 값에 속한 정보라, 좁은 폭에서 줄바꿈이
 * 일어나도 둘이 갈라지지 않아야 한다(as-of 가 먼저 다음 줄로 떨어진다).
 */
export const RateGroup = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[1]} ${space[2]};
  min-width: 0;
`;

/**
 * "$1 ≈ 1,478원" — 위계의 앵커(크게·굵게).
 * ⚠ 값 숫자는 **중립 토큰(text)만** — 환율은 P&L 이 아니라 accent·빨강/파랑(손익색)을 쓰지 않는다.
 * ⚠ dataNumeric(Inter 서브셋)에 `≈`(U+2248)·`원` 글리프는 없어 그 두 글자만 본문 서체로 폴백한다.
 *   숫자·`$`·콤마만 Inter 로 그려지는 **설계된 동작**이고 회귀가 아니다(tokens.ts 서체 역할표).
 */
export const Rate = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

export const RateValue = styled.strong`
  color: ${color.text};
  font-weight: ${font.weight.extrabold};
`;

/** "전일 대비 +0.32%" 한 덩어리 — 라벨과 값이 절대 갈라지지 않게 nowrap. */
export const Change = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${space[1]};
  white-space: nowrap;
`;

/** 무엇 대비인지 화면으로도 말한다 — 라벨 없는 "+0.32%" 는 기준을 알 수 없다. */
export const ChangeLabel = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/*
 * ⚠ 값 본체는 중립(color.text)이고, 색이 붙는 것은 **전일 대비 변동률뿐**이다.
 * 전일 대비 변동은 손익(P&L)이 아니라 시세의 방향이고, dataPositive/dataNegative 램프는
 * primitives.ts 가 "숫자(데이터)에만" 쓰라고 규정한 바로 그 용도(한국 증권 관례: 상승=적/하락=청)다.
 * 금지는 값 본체에 남는다 — 환율 1,478원·지수 6,755.75 는 상태값이라 색을 칠하면 "손실"로 오독된다.
 * 색은 단독 채널이 아니다: 부호(+/-)와 스크린리더 문장("전일 대비 0.32% 상승")이 방향을 항상 병기하므로
 * 색을 못 보는 사용자도 정보를 하나도 잃지 않는다.
 * 근거는 decisions.md 의 [2026-07-28] 항목이며, 그 항목은 아직 ⏳사용자 승인 대기다 — 확정 결정으로
 * 인용하거나 다른 표면(티커 카드·포트폴리오 표)으로 넓히지 말 것. 미승인으로 결론나면 되돌림은 아래
 * CHANGE_COLOR 맵의 up·down 을 color.textSecondary 로 바꾸는 2줄이다(styled 의 color 만 중립으로
 * 고치면 이 맵이 고아가 돼 noUnusedLocals 에 걸려 tsc 가 깨진다).
 */
const CHANGE_COLOR: Record<FxChangeDirection, string> = {
  up: color.dataPositive,
  down: color.dataNegative,
  flat: color.textSecondary
};

export const ChangeValue = styled.span<{ $direction: FxChangeDirection }>`
  color: ${({ $direction }) => CHANGE_COLOR[$direction]};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/**
 * 스크린리더 전용 문장 — 부호·색이 말하는 방향을 말로 옮긴다.
 * 공용 프리미티브를 만들지 않는 것이 이 레포 관례라 컴포넌트마다 로컬로 둔다.
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/** "2026-07-23 기준" — 보조 정보라 muted. */
export const AsOf = styled.span`
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
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
 *
 * reduced-motion 에서 **일부러 되찾지 않는다**(2026-07-30 판정). 스켈레톤이 말하는 것은
 * "아직 살아 있다"가 아니라 **"이 자리에 올 값이 아직 없다"**이고, 그건 회색 막대의 *모양*이
 * 통째로 말한다 — 펄스가 없어도 단서가 0 이 되지 않는다(스피너와 갈리는 지점).
 * 게다가 펄스의 쉬는 프레임이 `opacity: 1` 이라 **정지 상태가 가장 잘 보이는 프레임**이다.
 * 카드는 `aria-busy` 와 아래 `Disclaimer` 문장을 함께 주므로 스크린리더 쪽 단서도 남는다.
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
