import styled from '@emotion/styled';
import { color, font, media, motion, radius, space, TOUCH_TARGET } from '@/shared/styles';
import type { BannerTone } from './Banner.types';

/**
 * 배너.
 *
 * 본문에 `textMuted`를 쓰지 않는 이유: 옅은 톤 배경 위에서 대비가 AA에 못 미친다.
 * `textSecondary`를 쓴다(`text-secondary on surface`·`on warning-surface` 모두 게이트에 있다).
 */

/**
 * 🔴 **톤마다 표현이 다르다 — 실수가 아니다. `info`만 면(틴트)이 없다.**
 *
 * 규칙: **면은 강한 톤에만 준다.**
 *  - `info`             → 중립 면(`surface`) + 1px `accent` 테두리 + 색 있는 아이콘
 *  - `warning`/`danger` → 틴트 면 유지. 경고는 눈에 띄어야 하고, 한 화면에 여러 개 뜨지 않는다.
 *
 * 왜. `DESIGN.md` §2-6 이 "한 화면에 틴트 면 최대 2개"를 규칙으로 두는데, 안내 배너는 이 앱에서
 * **가장 자주 뜨는 표면**이라 그것이 틴트를 먹는 순간 히어로·빈 상태 보드와 겹쳐 상한을 바로 넘긴다
 * (실측 2026-07-31: `/dividend/portfolio` 1280px 에서 틴트 면 3~5개, `tools/dev/tintscan.mjs`).
 * 각각은 옳은 선택인데 겹쳐 놓으면 하나의 큰 색 덩어리로 읽힌다 — 그래서 **가장 흔한 표면부터** 뺀다.
 *
 * 이 규칙의 **단일 지점은 이 파일이다.** 안내 표면을 새로 만들 때 자기 틴트를 선언하지 말고 `Banner`를
 * 쓴다. (같은 규칙을 손으로 따르는 예외: `pages/Portfolio/components/GoalCard` 의 성공 상태 줄 —
 * 배너가 아니라 카드 안 한 줄이라 부품을 공유하지 않는다. 표현 규칙만 같다.)
 *
 * 좌측 컬러 바(구 3px)는 없앴다 — 품질 기준이 "1px 초과 colored border-left 금지"다.
 * 톤은 이제 **테두리 + 아이콘 색**이 말한다(색 단독 금지는 아이콘 모양·문장이 계속 지킨다).
 *
 * `info` 가 브랜드가 아니라 액센트인 이유: 배너는 **누를 수 없는 정보 표면**이다.
 * 브랜드 축은 사용자가 누르는 것(주 버튼·활성 탭·선택 상태·포커스)에만 남기고, 크롬·정보·장식은
 * 액센트가 맡는다 — 두 축이 같은 색이면 화면에 "액션"이라는 신호가 사라진다.
 * `warning`/`danger` 가 이미 자기 상태색을 쓰므로 hover 도 같은 어법(중립 `surfaceHover`)으로 맞춘다.
 *
 * ⚠ 테두리는 `accentBorder`(1.44~2.70:1)가 아니라 **`accent`**(3:1 게이트 `['accent','surface']`)다.
 * 틴트를 뺀 뒤에는 테두리가 톤을 말하는 **유일한 면 신호**라, 장식 경계의 플로어(1.25)로는 사라진다.
 */
const TONE: Record<BannerTone, { border: string; bg: string; accent: string; hover: string }> = {
  info: {
    border: color.accent,
    bg: color.surface,
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${space[3]};
  align-items: ${({ align }) => align};
  padding: ${space[4]};
  border: 1px solid ${({ tone }) => TONE[tone].border};
  border-radius: ${radius.md};
  background: ${({ tone }) => TONE[tone].bg};
  color: ${color.text};
  overflow: hidden;

  /*
   * 톤 아이콘 — 호출부가 넣은 lucide 아이콘은 'currentColor' 라 여기서 색을 준다.
   * 버튼 안 아이콘은 제외한다(액션은 자기 색을 갖는다) — ':not()' 대신 더 구체적인 선택자로 되돌린다.
   */
  svg {
    color: ${({ tone }) => TONE[tone].accent};
  }

  button svg {
    color: inherit;
  }

  ${media.down('mobileWide')} {
    padding: ${space[3]};
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
