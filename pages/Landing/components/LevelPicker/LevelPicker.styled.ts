import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, motion, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 랜딩 히어로의 **수준 4갈래** — 이 지면의 첫 갈림길.
 *
 * 🔴 여기는 히어로 CTA 자리를 **대체**한 블록이다(2026-08-17 사용자 결정). 그전에는
 * `배당 계산 시작하기`·`보유 종목으로 계산` 두 버튼이 있었는데 둘 다 이미 아는 사람용이었다.
 * 그래서 이 블록의 성패 기준은 하나다 — **네 칸이 전부 접힘 위에 있는가.**
 * 390×664(iOS Safari 의 100svh 최소)에서 헤더 56 + 제목 블록 + 이 그리드가 그 예산 안이어야 한다.
 * 카드에 줄을 더하거나 패딩을 키우기 전에 그 폭에서 재라.
 *
 * 🔴 **카드가 맞다**(StartPath 의 "줄" 과 반대다). 저쪽은 순서를 말하므로 세로 줄이지만, 여기는
 * **동등한 선택지 넷**이라 순서가 없다. 2×2 로 놓으면 넷을 한눈에 훑을 수 있고, 세로 목록이면
 * 마지막 칸이 접힘 아래로 밀린다.
 *
 * 🔴 **새 틴트 면을 만들지 않는다.** 랜딩의 면 예산은 마무리 패널과 푸터가 이미 쓰고 있다 —
 * 네 칸을 색으로 구분하려 들면 그 순간 히어로가 대시보드가 된다. 구분은 테두리와 여백이 한다.
 *
 * ⚠ 진입 애니메이션 금지(랜딩 모션 0 규율). 호버·누름만 기존 토큰 안에서 쓴다.
 * -------------------------------------------------------------------------- */

export const PickerRoot = styled.nav`
  display: grid;
  gap: ${space[3]};
  margin-top: ${space[5]};
`;

/**
 * 2×2. 좁은 폭에서도 **2열을 유지한다** — 1열로 떨어뜨리면 네 번째 칸이 접힘 아래로 사라져
 * 이 블록의 존재 이유가 없어진다(위 접힘 예산).
 */
export const PickerGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    gap: ${space[3]};
  }
`;

export const PickerItem = styled.li`
  min-width: 0;
`;

export const PickerCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  height: 100%;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;
  transition: border-color ${motion.ease}, background ${motion.ease};

  &:hover {
    border-color: ${color.textMuted};
    background: ${color.surfaceHover};
  }

  ${media.up('mobileWide')} {
    padding: ${space[4]};
    gap: ${space[2]};
  }
`;

/** 분류 라벨. 🔴 주인공이 아니다 — 아래 진술 문장보다 작고 흐리게 유지해라(그 이유는 데이터 파일 주석). */
export const CardName = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

/** 사용자가 자기 상태를 알아보는 문장. 이 블록에서 눈이 먼저 닿아야 하는 곳이다. */
export const CardStatement = styled.strong`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: 1.45;
  color: ${color.text};

  ${media.up('mobileWide')} {
    font-size: ${font.size.base};
  }
`;

/**
 * 도착지에서 무엇을 하게 되는지. 좁은 폭에서는 **감춘다** — 접힘 예산이 여기서 가장 먼저 깨진다
 * (네 칸 × 두 줄이 붙으면 마지막 행이 접힘 아래로 내려간다).
 */
export const CardOutcome = styled.span`
  display: none;
  font-size: ${font.size.xs};
  line-height: 1.5;
  color: ${color.textMuted};

  ${media.up('mobileWide')} {
    display: block;
  }
`;

/**
 * 직행로. 🔴 **버튼이 아니라 글줄이다.** 버튼으로 만들면 위 네 칸과 무게가 비슷해져 "다섯 갈래"가
 * 되고, 그러면 갈림길을 넷으로 좁힌 의미가 사라진다. 이미 아는 사용자가 잃을 길만 메운다.
 */
export const DirectLink = styled(Link)`
  justify-self: start;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  text-decoration: none;

  &:hover {
    color: ${color.text};
    text-decoration: underline;
  }
`;
