import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, motion, radius, space } from '@/shared/styles';

/**
 * 원본: `pages/DividendCalendar/components/CalendarToolbar/CalendarToolbar.styled.ts`.
 *
 * 🔴 **의도적 로컬 복제**다. 페이지 간 styled import 는 두 화면을 서로의 레이아웃 변경에 묶고
 * lazy 청크를 섞는다(캘린더가 세운 관례). 공용화하려면 두 화면을 함께 바꿔야 하므로 지금은 하지 않는다.
 * 원본이 바뀌었다고 여기를 따라 고칠 의무는 없다 — 두 화면은 독립적으로 진화한다.
 */

export const NavRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  flex-wrap: wrap;
  position: relative;
  min-width: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
`;

/** 제목 크기를 상수로 뽑는 이유: 아래 버튼의 광학 보정이 **이 값을 기준으로** 계산된다. */
const MONTH_TITLE_FONT_SIZE = `clamp(${font.size.lg}, 2.4vw, ${font.size.xl})`;

/** `min-width` + 가운데 정렬로 폭을 고정한다 — 월을 넘길 때마다 제목 폭이 흔들리면 버튼이 좌우로 뛴다. */
export const MonthTitle = styled.h2`
  margin: 0;
  min-width: 9ch;
  text-align: center;
  font-size: ${MONTH_TITLE_FONT_SIZE};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

const navButtonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.pill};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const NavButton = styled.button`
  ${navButtonBase}
  /* 제목(헤딩 서체)의 **잉크 중심**에 맞춘다 — 한글은 라인박스 중심이 잉크 중심보다 아래라
     'align-items: center' 만으로는 버튼이 낮게 앉는다. 보정 정본은 shared/styles/heroTitleRow.ts. */
  ${iconOpticalAlign('display', MONTH_TITLE_FONT_SIZE)}
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
    color: ${color.text};
  }
`;

/** "이번 달" — 아이콘 전용(접근명만 텍스트). 이미 이번 달이면 누를 이유가 없어 비활성이다. */
export const TodayButton = styled.button`
  ${navButtonBase}
  border: 1px solid ${color.accentBorder};
  background: ${color.accentSubtle};
  color: ${color.accentText};

  &:hover:not(:disabled) {
    border-color: ${color.borderStrong};
  }

  &:disabled {
    border-color: ${color.border};
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    cursor: default;
  }
`;
