import styled from '@emotion/styled';
import { color, font, media, motion, radius, space, TOUCH_TARGET } from '@/shared/styles';
import type { BannerTone } from './Banner.types';

/**
 * 배너.
 *
 * 톤은 **좌측 액센트 바 + 아주 옅은 배경**으로만 말한다. 배경을 진하게 칠하면
 * 배너가 화면의 주인공이 되어버려서, 정작 주인공인 데이터를 밀어낸다.
 *
 * 본문에 `textMuted`를 쓰지 않는 이유: 옅은 톤 배경 위에서 대비가 AA에 못 미친다.
 * `textSecondary`를 쓴다.
 *
 * ⚠ `text-secondary on accent-subtle` 쌍은 아직 `shared/styles/contrast.test.ts` 의 순회 목록에
 * 없다(`brand-subtle` 쪽만 있다). 실측은 16테마 최저 6.47:1(velog/dark)로 AA 여유가 있지만,
 * **게이트가 없으므로** accent-subtle 을 손대는 사람이 이 배너를 못 본다 — 그 쌍을 목록에 넣는 것이
 * 다음 정리 항목이다.
 */

/**
 * `info` 가 브랜드가 아니라 액센트인 이유: 배너는 **누를 수 없는 정보 표면**이다.
 * 브랜드 축은 사용자가 누르는 것(주 버튼·활성 탭·선택 상태·포커스)에만 남기고, 크롬·정보·장식은
 * 액센트가 맡는다 — 두 축이 같은 색이면 화면에 "액션"이라는 신호가 사라진다.
 * `warning`/`danger` 가 이미 자기 상태색을 쓰므로 hover 도 같은 어법(중립 `surfaceHover`)으로 맞춘다.
 */
const TONE: Record<BannerTone, { border: string; bg: string; accent: string; hover: string }> = {
  info: {
    border: color.accentBorder,
    bg: color.accentSubtle,
    accent: color.accent,
    hover: color.surfaceHover
  },
  warning: {
    border: color.warning,
    bg: color.warningSurface,
    accent: color.warning,
    hover: color.surfaceHover
  },
  danger: {
    border: color.dangerBorder,
    bg: color.dangerSurface,
    accent: color.danger,
    hover: color.surfaceHover
  }
};

export const BannerRoot = styled.section<{ tone: BannerTone; align: 'start' | 'center' }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${space[3]};
  align-items: ${({ align }) => align};
  padding: ${space[4]};
  padding-left: ${space[5]};
  border: 1px solid ${({ tone }) => TONE[tone].border};
  border-radius: ${radius.md};
  background: ${({ tone }) => TONE[tone].bg};
  color: ${color.text};
  overflow: hidden;

  /* 좌측 액센트 바 — 톤을 여기서만 강하게 말한다. */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ tone }) => TONE[tone].accent};
  }

  ${media.down('mobileWide')} {
    padding: ${space[3]};
    padding-left: ${space[4]};
    gap: ${space[2]};
  }
`;

export const BannerContent = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const BannerTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
`;

export const BannerBody = styled.div`
  display: grid;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  overflow-wrap: anywhere;
  /*
   * 배너 본문은 'div' 라 전역 'text-wrap: pretty'(요소 선택자 'p,li,dd,…')를 못 받는다.
   * 안쪽 'p' 는 받지만 배너는 문자열을 직접 넣는 호출부가 많다 — 여기서 한 번에 건다.
   * ⚠ 'keep-all' 금지(한국어 산문은 음절 단위 줄바꿈이 관례 + 좁은 카드 가로 넘침).
   */
  text-wrap: pretty;

  p {
    margin: 0;
  }

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const BannerDismiss = styled.button<{ tone: BannerTone; align: 'start' | 'center' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  /*
   * 음수 마진으로 시각적 여백은 배너 패딩과 맞추면서 터치 타겟 44x44를 지킨다.
   * center 정렬일 때는 위쪽 음수 마진을 빼서(0) 중앙선이 어긋나지 않게 한다.
   */
  margin: ${({ align }) => (align === 'center' ? '0' : `-${space[2]}`)} -${space[2]} 0 0;
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.textSecondary};
  font-family: inherit;
  font-size: ${font.size.xl};
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ tone }) => TONE[tone].hover};
    color: ${color.text};
  }
`;
