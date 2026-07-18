import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 스와치 점의 실제 색(hex)은 여기에 없다 — 레지스트리(`THEME_PRESETS[..].swatch`) 값을
 * 컴포넌트가 style prop으로 주입한다. 스와치는 "그 프리셋의 고정 대표색"이라 런타임 팔레트를
 * 따라가면 안 되기 때문에 토큰(var(--sb-*))을 쓰지 않는 것이 맞다.
 */

/** 데스크톱 헤더 슬롯. 모바일(드로어 이하)에서는 드로어 인라인 스위처가 진입점이므로 숨긴다. */
export const HeaderPopoverRoot = styled.div`
  position: relative;
  display: inline-flex;

  ${media.down('drawer')} {
    display: none;
  }
`;

/**
 * 모바일 드로어 상단 슬롯. 데스크톱(드로어 초과)에서는 헤더 팝오버가 진입점이므로 숨긴다.
 * 모바일 퍼스트(기본 보임 + up에서 숨김)로 쓴 이유: jsdom은 미디어 쿼리를 평가하지 않아
 * 기본값이 곧 테스트에서 보이는 상태다 — radiogroup 행동 테스트가 이 기본값에 의존한다.
 */
export const DrawerInlineSlot = styled.div`
  display: block;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[1]};

  ${media.up('drawer')} {
    display: none;
  }
`;

/** 트리거 아이콘 + 현재 프리셋 스와치 점 오버레이의 기준 좌표계. */
export const TriggerIconWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

/** 아이콘 우하단의 현재 프리셋 표시 점. 색은 style prop(레지스트리 swatch)으로 주입된다. */
export const TriggerSwatchDot = styled.span`
  position: absolute;
  right: -3px;
  bottom: -2px;
  width: 8px;
  height: 8px;
  border-radius: ${radius.pill};
  /* surface 테두리로 아이콘 획과 분리한다 — 배경이 무엇이든 점이 뭉개지지 않는다. */
  border: 1px solid ${color.surface};
`;

export const Popover = styled.div`
  position: absolute;
  top: calc(100% + ${space[1]});
  right: 0;
  min-width: 208px;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e3};
  z-index: ${zIndex.dropdown};
  padding: ${space[1]};
  /* 프리셋 8종(스펙 §3): 1열 유지 + 스크롤. 420px = 8행 × 40px + 패딩이 기본적으로 다 보이는 높이,
     짧은 뷰포트(60vh)에서만 스크롤이 생긴다. 포커스 이동 시 scrollIntoView는 컴포넌트가 담당. */
  max-height: min(60vh, 420px);
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

/**
 * columns=2는 모바일 드로어 전용(공간 절약, 스펙 §3). **시각 배치일 뿐** —
 * 화살표 키 순회는 DOM 순서 1차원 그대로다(radiogroup 접근성 계약 불변).
 */
export const RadioGroupBox = styled.div<{ columns?: 1 | 2 }>`
  display: grid;
  grid-template-columns: ${({ columns }) => (columns === 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr')};
  gap: 2px;

  /* 드로어 2열은 행 높이 44px(스펙 §3) — 터치 우선 맥락이라 시각 높이 자체를 히트 영역과 맞춘다. */
  ${({ columns }) => (columns === 2 ? 'button { min-height: 44px; }' : '')};
`;

/**
 * 프리셋 한 줄: [스와치 3점] [라벨] [✓].
 * 선택 상태는 `aria-checked` 어트리뷰트로 스타일링한다 — 시각 상태와 접근성 상태가
 * 같은 소스에서 나오므로 어긋날 수 없다.
 */
export const OptionButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: ${radius.xs};
  background: transparent;
  color: ${color.text};
  padding: ${space[2]} ${space[3]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.regular};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease};

  /* 시각 높이는 40px 유지, 히트 영역만 44px로 확장 (기존 ::before 기법). */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    min-height: 44px;
    transform: translate(-50%, -50%);
  }

  &:hover {
    background: ${color.surfaceHover};
  }

  &[aria-checked='true'] {
    font-weight: ${font.weight.bold};
  }
`;

export const SwatchStack = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
`;

/** 14px 원 3개 겹침(-4px). 밝은 스와치도 보이도록 얇은 보더를 두른다. */
export const SwatchDot = styled.span`
  width: 14px;
  height: 14px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};

  & + & {
    margin-left: -4px;
  }
`;

export const OptionLabel = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 선택 표시 ✓ 슬롯. 비선택 행에도 같은 폭을 잡아둔다 —
 * 선택이 이동할 때 라벨이 좌우로 튀지 않는다.
 */
export const CheckSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  color: ${color.brand};

  svg {
    width: 16px;
    height: 16px;
  }
`;
