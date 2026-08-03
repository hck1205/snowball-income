import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, motion, radius, space } from '@/shared/styles';

/**
 * 월 이동 — "어느 기간인가".
 *
 * ## 2026-08-03 재설계
 * 원본은 캘린더 툴바를 복제한 **알약(pill) 한 줄**이었고, 탭 줄과 같은 층에 나란히 서 있었다.
 * 지금 두 컨트롤은 한 틀(`ScopePanel`)을 공유하므로 **형태로 갈라야** 한다 —
 *  - 탭 줄: 자기 면 없는 왼쪽 정렬 라벨 줄.
 *  - 월 이동: **가라앉은 면 + 둥근 사각(알약 아님) + 가운데 큰 제목**.
 * 그리고 이 화면에서 월 제목은 요약 카드의 이름(`aria-labelledby`)이기도 하므로 시각적으로도
 * 그만한 무게를 가져야 한다 — 그래서 제목을 한 단 키우고 좌우 버튼을 양 끝으로 밀었다.
 *
 * 🔴 **의도적 로컬 복제**의 원본은 `pages/DividendCalendar/.../CalendarToolbar.styled.ts` 다.
 * 페이지 간 styled import 는 두 화면을 서로의 레이아웃 변경에 묶고 lazy 청크를 섞는다.
 * 원본이 바뀌었다고 여기를 따라 고칠 의무는 없다 — 두 화면은 독립적으로 진화한다.
 */

export const NavRoot = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: ${space[2]};
  position: relative;
  min-width: 0;
  padding: ${space[2]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

/** 제목 크기를 상수로 뽑는 이유: 아래 버튼의 광학 보정이 **이 값을 기준으로** 계산된다. */
const MONTH_TITLE_FONT_SIZE = `clamp(${font.size.lg}, 2.6vw, ${font.size['2xl']})`;

/**
 * 🔴 `min-width` 를 쓰지 않는다 — 이 줄은 이제 격자(1fr)라 제목 칸의 폭이 고정이고,
 * 월을 넘겨도 좌우 버튼이 흔들리지 않는다(예전에는 `9ch` 로 흉내 냈다).
 */
export const MonthTitle = styled.h2`
  margin: 0;
  min-width: 0;
  text-align: center;
  font-size: ${MONTH_TITLE_FONT_SIZE};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: ${color.text};
  ${font.numeric}
`;

const navButtonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.sm};
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

/**
 * "이번 달" — 아이콘 전용(접근명만 텍스트). 이미 이번 달이면 누를 이유가 없어 비활성이다.
 *
 * 🔴 세 버튼 중 **이것만 액센트**다. 좌우 화살표는 "한 칸 이동"이고 이것은 "원점 복귀"라 격이
 * 다르다 — 셋이 같은 모양이면 원점이 어디인지 화면이 말하지 않는다. 폭 36px 이라 색면 예산과 무관하다.
 */
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
