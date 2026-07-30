import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { IndexChange } from '@/shared/lib/marketIndices';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 스트립 컨테이너 — **투명하다**(배경·테두리 없음). 이 부품이 어떤 면 위에 놓일지 모르기 때문이다
 * (랜딩 히어로의 그라데이션 위일 수도 있다). 면색은 셀이 각자 갖는다 — Item 주석 참고.
 * 카드 안에 카드를 만들지 않는 이유이기도 하다.
 */
export const Root = styled.section`
  display: grid;
  gap: ${space[3]};
  width: 100%;
  min-width: 0;
`;

/** 제목 + 메타. 좁아지면 자연스럽게 줄바꿈된다. */
export const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[1]} ${space[3]};
  min-width: 0;
`;

/** "주요 지수" — 환율 위젯 타이틀과 같은 레벨(h2). 값보다 작은 라벨 위계. */
export const Title = styled.h2`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
`;

/**
 * "전일 대비 · 참고용 시세" — 무엇 대비인지를 헤더가 한 번만 말한다.
 * 셀마다 라벨을 반복하면 5칸이 라벨 밭이 된다(환율 위젯엔 이 자리가 없어 값 옆에 라벨을 둔다).
 */
export const Meta = styled.span`
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/** 옅은 '업데이트 실패' 표식 — 손익색이 아니라 중립 muted(환율 위젯과 동일). */
export const StaleMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/**
 * 지수 목록 — 스크린리더가 "목록, 항목 5개"로 개수와 경계를 먼저 알려 준다.
 * 셀은 링크·버튼이 아니라 **포커서블 요소가 0개**이고 탭 순서에 영향이 없다.
 *
 * 반응형은 브레이크포인트가 아니라 auto-fit 그리드 **한 줄**이 전부다(부품은 자기가 놓인 컨테이너 폭을
 * 모른다 — 뷰포트 1440px 에서도 320px 좌패널 안일 수 있다).
 * min(140px, 100%) 의 100% 는 **필수**다: minmax(140px, 1fr) 만 쓰면 컨테이너가 140px 보다 좁을 때
 * 트랙이 밖으로 삐져나간다. 선례 PortfolioAllocation.styled.ts.
 */
export const List = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 셀 — 🔴 배경은 반드시 color.surface 또는 color.surfaceMuted 중 하나여야 한다.
 * 변동률에 쓰는 dataPositive/dataNegative 는 shared/styles/contrast.test.ts 가 그 두 면 위에서만
 * 전 프리셋 8종 × light/dark = 16테마 4.5:1 을 강제한다. surfaceSunken·bg·그라데이션으로 바꾸면
 * **검증되지 않은 쌍** 위에 데이터색을 얹는 것이다(바꾸려면 contrast.test.ts 에 쌍을 먼저 추가할 것).
 */
export const Item = styled.li`
  display: grid;
  gap: 2px;
  align-content: start;
  min-width: 0;
  padding: ${space[3]};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
`;

/** 지수명 — 로딩 중에도 실제 텍스트로 그린다(무엇을 기다리는지 보이고, 도착 시 레이아웃이 그대로다). */
export const Name = styled.span`
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/**
 * 현재가 — 셀의 앵커.
 * ⚠ 값 숫자는 **중립 토큰(text)만**. 색이 붙는 것은 아래 Change(전일 대비 변동률)뿐이다.
 * ⚠ 서체는 dataNumeric(그 화면의 주인공 숫자 한 곳에만 쓰는 heroNumeric 이 아니다 — 여기 숫자는 5개고
 *   최종 자리는 랜딩 히어로 하단이라 hero 숫자는 히어로가 갖는다).
 */
export const Value = styled.span`
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${font.numeric}
`;

/** 값을 못 받은 자리의 대시 — 크기는 Value 와 같게 두어 셀 높이가 흔들리지 않는다. */
export const ValueMuted = styled.span`
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  ${font.numeric}
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
const CHANGE_COLOR: Record<IndexChange['direction'], string> = {
  up: color.dataPositive,
  down: color.dataNegative,
  flat: color.textSecondary
};

export const Change = styled.span<{ $direction: IndexChange['direction'] }>`
  color: ${({ $direction }) => CHANGE_COLOR[$direction]};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

/** 변동률이 없는 자리(전일값 부재 · 결손). Change 와 같은 크기라 셀 높이가 유지된다. */
export const ChangeMuted = styled.span`
  overflow: hidden;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/** 값이 하나도 없을 때의 중립 안내 — 가짜 시세를 그리지 않는다. */
export const Message = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/**
 * 스크린리더 전용 문장 — 부호·색이 말하는 방향과 단위를 말로 옮긴다.
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

/*
 * 스켈레톤 애니메이션은 ExchangeRateWidget 의 것을 **복제**했다(12줄) — 컴포넌트 간 styled import 는
 * 금지다. 공용 Skeleton 프리미티브 승격은 세 번째 소비처가 생기면 그때.
 */
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/**
 * 로딩 스켈레톤 바 — 값 셀과 **같은 줄 구성/높이**로 렌더해 레이아웃 점프를 없앤다.
 * 1em 높이는 담는 요소의 font-size 를 따라간다.
 *
 * reduced-motion 에서 **일부러 되찾지 않는다**(2026-07-30 판정, ExchangeRateWidget 과 같은 근거):
 * 스켈레톤은 "아직 살아 있다"가 아니라 **"이 자리에 올 값이 아직 없다"**를 말하고 그건 회색 막대의
 * *모양*이 통째로 말한다. 펄스의 쉬는 프레임이 `opacity: 1` 이라 정지가 가장 잘 보이는 프레임이다.
 * (되찾는 쪽은 **스피너** — 그건 모양만으로는 "멈췄다/일한다"를 구분하지 못한다.)
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
