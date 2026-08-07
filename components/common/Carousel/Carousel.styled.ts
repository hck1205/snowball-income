import styled from '@emotion/styled';
import { color, font, hiddenScrollbar, media, motion, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 캐러셀 — **긴 목록을 한 줄로 접는 장치**.
 *
 * 🔴 이것은 장식이 아니다(2026-08-07 사용자 정정). 목적은 "생기"가 아니라 **한 번에 보이는 양을
 * 줄이는 것**이다 — 카드가 열 장 넘게 세로로 늘어서면 처음 온 사람은 그 길이만 보고 나간다.
 * 가로 한 줄로 접으면 같은 정보가 **화면 한 칸**이 되고, 페이지가 그만큼 짧아진다.
 *
 * 🔴 구현은 **네이티브 스크롤 + scroll-snap** 이다. transform 페이징으로 만들지 마라 —
 * 그러면 터치 스와이프·관성·키보드 스크롤·접근성 포커스 이동을 전부 손으로 다시 만들어야 하고,
 * 카드 폭이 가변이면 계산이 어긋난다. 브라우저가 이미 잘하는 일을 뺏지 않는다.
 * -------------------------------------------------------------------------- */

export const CarouselRoot = styled.div`
  position: relative;
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 스크롤 궤도.
 *
 * ⚠ `scroll-padding` 이 없으면 스냅된 카드가 창 왼쪽 끝에 딱 붙어 잘린 것처럼 보인다.
 * ⚠ 스크롤바는 숨긴다 — 아래 점·화살표가 위치를 이미 말하고, 가로 스크롤바는 카드 밑에
 *   회색 띠를 하나 더 그린다.
 */
export const CarouselTrack = styled.ul`
  display: flex;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 2px;
  ${hiddenScrollbar}

  /* 🔴 그림자·부상 연출이 잘리지 않게 위아래로 숨 쉴 자리를 준다(overflow-x 는 세로도 자른다). */
  padding-block: 4px;

  > li {
    flex: 0 0 auto;
    scroll-snap-align: start;
    min-width: 0;
    /* 한 화면에 보이는 장 수 — 1 → 2 → 3. 카드 폭이 아니라 **칸 수**로 정한다. */
    width: calc(100% - ${space[3]});

    ${media.up('mobileWide')} {
      width: calc((100% - ${space[3]}) / 2);
    }

    ${media.up('tabletSm')} {
      width: calc((100% - ${space[3]} * 2) / 3);
    }
  }
`;

/** 아래 줄 — 점(위치) + 화살표(이동). 둘 다 없으면 "더 있다"를 아무도 모른다. */
export const CarouselFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const CarouselDots = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
`;

/**
 * 위치 점.
 *
 * 🔴 버튼이다(장식 점이 아니다) — 눌러서 그 칸으로 간다. 폭 <180px 라 색면 예산 밖이다.
 * ⚠ 접근명은 "N번째"다. 점만 있으면 스크린리더에서 정체 없는 버튼이 여러 개 늘어선다.
 */
export const CarouselDot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '18px' : '7px')};
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: ${radius.pill};
  background: ${({ $active }) => ($active ? color.brand : color.borderStrong)};
  cursor: pointer;
  transition:
    width ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CarouselArrows = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
`;

/**
 * 이동 화살표.
 *
 * 🔴 끝에 닿으면 **숨기지 않고 비활성화**한다. 사라지면 옆 버튼이 그 자리로 밀려와, 연달아
 * 누르던 손가락이 다른 버튼을 누른다.
 */
export const CarouselArrow = styled.button`
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  transition:
    border-color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
  }

  &:disabled {
    color: ${color.textMuted};
    cursor: default;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** "3 / 7" — 점만으로는 몇 장인지 세기 어렵다. 숫자가 그 일을 한다. */
export const CarouselCount = styled.span`
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  white-space: nowrap;
  ${font.numeric};
`;
