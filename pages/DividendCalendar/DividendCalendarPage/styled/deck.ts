import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  cardElevation,
  color,
  elevation,
  font,
  media,
  motion,
  pageHue,
  radius,
  space
} from '@/shared/styles';
import { SURFACE_PAD } from './surfaces';

/* -------------------------------------------------------------------------- */
/* 1층 — 요약 데크                                                              */
/* -------------------------------------------------------------------------- */

/**
 * 화면의 **주역 면**. 위계 수단은 그림자 하나뿐이다(`raised`) — 아래 두 열은 테두리로 간다.
 * 구 처방에서는 달력 보드가 이 자리를 차지했는데, 달력은 답이 아니라 지도다.
 */
export const MonthDeck = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('raised')}
`;

/**
 * 데크의 조작 줄 — 월 이동 묶음(왼쪽)과 종목 선택(오른쪽).
 *
 * 구 화면에서는 이 둘이 서로 다른 층에 있었다(선택은 카드 머리 띠, 월 이동은 그 아래 툴바).
 * 조작은 한 줄에 모은다 — "무엇을 보는가(종목)"와 "언제를 보는가(달)"는 같은 종류의 결정이다.
 */
export const DeckBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 조작 줄·카드 머리에서 오른쪽 끝으로 밀어 두는 슬롯. */
export const HeadSpacer = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/**
 * 드로어를 여는 주 진입점 — 이 화면에서 **유일한 솔리드 브랜드 면(L3)** 이다.
 * "여기서 고르면 화면이 바뀐다"를 말하는 자리라 색면 사다리의 맨 위를 여기에 쓴다.
 * 🔴 L3 는 화면당 하나다. 다른 곳에 brand 채움을 만들지 마라.
 * ⚠ 폭이 180px 미만이라 틴트 면 판정 밖이다.
 */
export const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
    box-shadow: ${elevation[2]};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: background ${motion.fast} ${motion.ease};

    &:hover {
      transform: none;
    }
  }

  /*
   * 좁은 폭에서는 **줄을 통째로 쓴다.** 그냥 두면 월 이동 묶음과 이 버튼이 한 줄을 억지로 나눠
   * 갖다가 넘치는 쪽만 아래로 떨어져, 오른쪽 끝에 있던 버튼이 갑자기 왼쪽에 홀로 서는 어중간한
   * 모양이 된다. 어차피 줄이 갈릴 폭이면 의도적으로 갈라 손가락이 닿는 폭을 준다.
   */
  ${media.down('mobileWide')} {
    flex: 1 1 100%;
    justify-content: center;
  }
`;

/**
 * 선택 수 배지. 숫자만으론 의미가 안 서므로 버튼 접근명(`picker.open`)이 문장으로 다시 말한다.
 * 솔리드 브랜드 면 위에 앉으므로 **반전**한다 — 검증 쌍(brand-text / surface)만 쓴다.
 */
export const FilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 ${space[1]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/**
 * 데크의 마지막 줄 — 그 달의 집계를 **문장**으로 한 번 더 말한다.
 *
 * 위의 판이 "다음 한 건"만 말하므로 전체 건수는 여기서만 나온다(같은 사실을 두 무게로 적지 않는다).
 * 왼쪽 4px 캡슐이 라우트 얼굴색을 찍는다(선이라 면 예산과 무관하다).
 */
export const MonthSummaryLine = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  ${font.numeric}

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 4px;
    height: 14px;
    border-radius: ${radius.pill};
    background: ${pageHue};
  }
`;
