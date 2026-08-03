import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  colorCap,
  font,
  innerRadius,
  motion,
  pickLift,
  pickTitleFontSize,
  pressTransition,
  pressableSubtle,
  radius,
  space
} from '@/shared/styles';
import type { PickCapHeight } from './PickCard.types';

/** 캡의 3변 bleed — 카드 반경·패딩에서 파생한다(손으로 적으면 반드시 어긋난다). */
const CAP_BLEED = colorCap(PICK_RADIUS, PICK.pad);

/**
 * **고르는 카드의 면.**
 *
 * 위계 선언(배경·테두리·그림자)은 `cardElevation('pick')` 한 곳에서만 나온다 — 여기서 개별 속성을
 * 다시 적으면 "테두리와 그림자를 동시에 갖는 카드"가 조용히 되살아난다(공용 Card 와 같은 규율).
 *
 * ⚠ 공용 Card 의 `content-visibility: auto` 를 **일부러 쓰지 않는다.** 고르는 카드는 격자로 여러 장이
 * 깔리는데, 뷰포트 밖 요소의 측정을 그것이 거짓말로 만든다 — `tintscan`·`archclip` 같은 실측 도구가
 * 바로 그 함정에 빠진 이력이 있다(2026-07-29). 이 카드는 예산 계산의 대상이라 항상 측정 가능해야 한다.
 *
 * ⚠ hover 에서 `transform` 을 쓰므로 이 면은 **스태킹 컨텍스트**를 만든다. 카드 안에서 밖으로 나가는
 * 팝오버·드롭다운을 띄우지 마라.
 */
export const PickCardRoot = styled.article<{ $selected: boolean; $disabled: boolean; $interactive: boolean }>`
  ${cardElevation('pick')}
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: ${PICK_RADIUS};
  padding: ${PICK.pad};
  --sb-inner-radius: ${innerRadius(PICK_RADIUS, PICK.pad)};
  color: ${color.text};
  /* 캡이 3변으로 비어져 나가므로 모서리에서 잘라 준다. */
  overflow: hidden;
  transition:
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease},
    ${pressTransition};

  ${({ $interactive, $disabled }) =>
    $interactive && !$disabled
      ? `
  &:hover {
    ${pickLift}
  }

  /* 스트레치 컨트롤은 카드 안쪽 작은 요소라, 포커스 링만으로는 "이 카드"라고 읽히지 않는다. */
  &:focus-within {
    ${pickLift}
  }
`
      : ''}

  ${({ $interactive, $disabled }) => ($interactive && !$disabled ? pressableSubtle : '')}

  /*
   * 선택 상태 — 안쪽 1px 링을 더해 테두리를 2px 로 읽히게 한다. 면을 채우지 않는 이유는
   * 카드가 폭 180px 을 넘어 곧바로 틴트 면 예산을 먹기 때문이다. 색만으로 말하지도 않는다
   * (체크 배지가 함께 뜬다 — PickCard.tsx).
   */
  ${({ $selected }) =>
    $selected
      ? `
  border-color: ${color.brandBorder};
  box-shadow: inset 0 0 0 1px ${color.brandBorder};
`
      : ''}

  ${({ $disabled }) =>
    $disabled
      ? `
  opacity: 0.55;
  cursor: not-allowed;
`
      : ''}
`;

/**
 * **레일 캡** — 상단 6px 컬러 줄.
 *
 * 🔴 높이를 `PICK.railHeight` 밖의 값으로 적지 마라. 8px 이 되는 순간 `tintscan` 이 이 줄을
 * **면**으로 세기 시작해 그 라우트의 예산(화면당 2면)이 조용히 터진다.
 */
export const PickCardRail = styled.div<{ $rail: string }>`
  ${CAP_BLEED}
  height: ${PICK.railHeight};
  background: ${({ $rail }) => $rail};
`;

const CAP_HEIGHT: Record<PickCapHeight, string> = {
  sm: PICK.capHeight.sm,
  md: PICK.capHeight.md,
  lg: PICK.capHeight.lg
};

/**
 * **틴트 캡** — L2 틴트 면.
 *
 * ⚠ 이 캡은 `tintscan` 이 **면으로 센다.** 이걸 쓰는 격자에는 반드시 `PickCardGrid cluster` 를
 * 씌워라(= `data-tint-cluster="pick-grid"`). 안 씌우면 카드 장수만큼 면이 세어진다.
 */
export const PickCardTintCap = styled.div<{ $fill: string; $ink: string; $edge: string; $height: PickCapHeight }>`
  ${CAP_BLEED}
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-height: ${({ $height }) => CAP_HEIGHT[$height]};
  padding: 0 ${PICK.pad};
  background: ${({ $fill }) => $fill};
  color: ${({ $ink }) => $ink};
  border-bottom: 1px solid ${({ $edge }) => $edge};
`;

/**
 * 레일 캡의 글리프 배지. 40px 짜리 작은 면이라 `tintscan` 의 폭 하한(180px)에 걸리지 않는다 —
 * 즉 **색을 예산 없이 쓸 수 있는 자리**다. 색면 사다리의 L1(파생 귀)에 해당한다.
 */
export const PickCardGlyphBadge = styled.span<{ $ink: string }>`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: ${PICK.glyphSize};
  height: ${PICK.glyphSize};
  margin-bottom: ${space[3]};
  border-radius: ${radius.md};
  color: ${({ $ink }) => $ink};
  background: color-mix(in srgb, ${({ $ink }) => $ink} 12%, ${color.surface});
`;

/** 틴트 캡 안의 글리프 — 이미 색면 위라 배지를 두 겹 쌓지 않는다. */
export const PickCardCapGlyph = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  line-height: 0;
`;

export const PickCardCapLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PickCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const PickCardTitleGroup = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

/**
 * 카드 이름. 크기 규칙은 `shared/styles` 한 곳(`pickTitleFontSize`)이 소유한다 —
 * 카드마다 자기 clamp 를 적으면 같은 격자 안에서 제목들이 서로 다른 속도로 줄어든다.
 */
export const PickCardTitle = styled.h3`
  margin: 0;
  font-size: ${pickTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const PickCardSubtitle = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;

/**
 * 제목 오른쪽 슬롯. **스트레치 컨트롤 위로 올린다** — 여기 들어온 버튼(제거·즐겨찾기)이
 * 카드 전체 클릭에 먹히지 않게 하는 자리다.
 */
export const PickCardTitleRight = styled.div`
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
`;

export const PickCardBody = styled.div`
  margin-top: ${space[3]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

/** 하단 액션 줄. `PickCardTitleRight` 와 같은 이유로 컨트롤 위에 뜬다. */
export const PickCardActions = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  margin-top: ${space[3]};
`;

/**
 * **스트레치 컨트롤** — 카드 전체를 누를 수 있게 만드는 장치.
 *
 * 🔴 왜 카드 자체를 `button`/`a` 로 만들지 않는가: 고르는 카드 안에는 **또 다른 버튼**(제거·즐겨찾기)이
 * 들어온다. 버튼 안의 버튼, 링크 안의 링크는 **유효하지 않은 HTML** 이고 브라우저가 DOM 을 재구성해
 * 레이아웃이 무너진다. 그래서 컨트롤은 제목만 감싸고, 의사요소로 카드 전체를 덮는다.
 * 그 위에 뜨는 형제(`PickCardTitleRight`·`PickCardActions`)는 `z-index: 1` 로 되살린다.
 *
 * 포커스 링은 전역 규칙(globalStyles 의 focus-visible)이 이 요소에 그리고, 카드 자신은
 * `:focus-within` 에서 함께 부상해 "이 카드가 선택되었다"를 말한다.
 */
const stretchBase = `
  color: inherit;
  text-decoration: none;
  border-radius: ${radius.xs};
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  text-align: inherit;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }
`;

export const PickCardStretchButton = styled.button`
  ${stretchBase}
`;

export const PickCardStretchAnchor = styled.a`
  ${stretchBase}
`;

export const PickCardStretchLink = styled(Link)`
  ${stretchBase}
`;

/**
 * 선택 배지. **색이 유일한 채널이 되지 않게** 하는 부품이다 — 선택된 카드는 테두리 색만이 아니라
 * 이 배지(모양 + 글자)로도 선택을 말한다. 회색조로 인쇄해도 읽힌다.
 */
export const PickCardSelectedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/**
 * 고르는 카드 격자.
 *
 * 간격이 `space[3]`(12px 고정)이 아니라 `PICK.gap` 인 이유는 부상 그림자가 옆 카드에 닿기 때문이다
 * (`tokens.ts` PICK.gap 주석의 실측).
 */
export const PickCardGridRoot = styled.div<{ $min: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, ${({ $min }) => $min}), 1fr));
  gap: ${PICK.gap};
  list-style: none;
  margin: 0;
  padding: 0;
`;
