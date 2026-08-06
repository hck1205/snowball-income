import styled from '@emotion/styled';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  hitAreaWithin,
  media,
  motion,
  pressTransition,
  pressableSubtle,
  radius,
  sectionTitleFontSize,
  space,
  surface
} from '@/shared/styles';

/* ── 선택 덱 ───────────────────────────────────────────────────────────────── */

/**
 * 고르는 면(brand)이다 — 여기서 무언가를 고르면 화면이 바뀐다. 그래서 반경도 `PICK_RADIUS`(30~34)로
 * 아래 표 카드(`DATA_RADIUS` 24~28)와 갈린다.
 */
export const Deck = styled.section`
  ${cardElevation('base')}
  ${surface(PICK_RADIUS, PICK.pad)}
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const DeckHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const DeckTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/**
 * 남은 자리를 **숫자로** 말한다. 아래 빈 슬롯이 같은 사실을 도형으로 말하므로 채널이 둘이다
 * (문장 하나에만 의존하던 종전보다 먼저 읽힌다).
 */
export const DeckCount = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

/**
 * 정원 4자리. 좁은 폭에서는 두 칸씩, 넓어지면 네 칸이 한 줄에 선다 —
 * 칩이 개수만큼 흐르던 종전과 달리 **총 자리 수가 항상 보인다**.
 */
export const SlotGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('tablet')} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

/**
 * 고른 종목 한 자리.
 *
 * 왼쪽 **3px 귀**가 그 종목의 시리즈 색이다(`assignSeries`). 폭 3px 이라 면이 아니라 선이고,
 * 같은 색이 아래 표 열 머리와 지급월 마크에 그대로 다시 나온다 — 색이 길찾기 단서가 되는 지점.
 * 🔴 그래도 색이 유일한 채널은 아니다: 티커 글자가 항상 함께 있다.
 */
export const Slot = styled.li<{ $series: string }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  overflow: hidden;
  padding: ${space[2]} ${space[2]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${({ $series }) => $series};
  }
`;

export const SlotBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

/** 티커는 이 자리의 이름이다 — 종전 칩(13px)보다 한 단 키워 먼저 읽히게 한다. */
export const SlotTicker = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  ${font.numeric}
`;

export const SlotName = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

/**
 * 자리 비우기. 종전 `Chip` 의 × 와 **같은 일**을 하고 접근名도 같다 — 진입점이 사라지지 않는다.
 * 히트 영역은 형제 간격(8px)을 넘지 않게 넓힌다(겹치면 옆 자리가 지워진다).
 */
export const SlotRemove = styled.button`
  ${pressableSubtle}
  ${hitAreaWithin(space[2])}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  /* 🔴 자기 transition 목록에 pressTransition 을 끼운다 — 안 끼우면 이 선언이 누름 믹스인의
     transform 전환을 통째로 덮어 버린다(test/shared/pressTransition.test.ts 가 잠근다). */
  transition:
    color ${motion.fast} ${motion.ease},
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover {
    border-color: ${color.border};
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 아직 안 채운 자리. **장식이 아니라 정보다** — 몇 개를 더 넣을 수 있는지 도형으로 말한다.
 * 스크린리더에는 위 `DeckCount` 숫자가 이미 같은 사실을 말하므로 여기서는 감춘다.
 */
export const SlotGhost = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  min-height: 46px;
  min-width: 0;
`;

/**
 * 셀렉트 줄.
 *
 * 🔴 셀렉트를 슬롯·설명과 **한 줄에 두지 않는다**(2026-08-02 사용자 지시 — 개편에서도 유지).
 * 한 줄이면 셋이 폭을 다퉈 셀렉트가 긴 종목명을 못 담고, 고른 개수가 늘수록 셀렉트가 밀린다.
 */
export const AddRow = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const PickerHint = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
