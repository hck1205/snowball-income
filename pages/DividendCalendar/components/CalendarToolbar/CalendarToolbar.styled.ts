import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/* 좌우 버튼·월 제목을 달력 폭의 정중앙에(사용자 결정 2026-07-25). "이번 달" 버튼은 흐름 그대로 우측. */
export const ToolbarRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  flex-wrap: wrap;
  position: relative;
`;

/** `min-width`+가운데 정렬로 폭을 고정한다 — 월을 넘길 때마다 제목 폭이 흔들리면 버튼이 좌우로 뛴다. */
export const MonthTitle = styled.h2`
  margin: 0;
  min-width: 9ch;
  text-align: center;
  font-size: clamp(${font.size.xl}, 3vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

/** 원형 버튼 + 브랜드 hover — 달력의 주 조작이라 회색 사각형으로 두지 않는다. */
export const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const TodayButton = styled.button`
  /* 절대 배치로 흐름에서 빼야 prev·제목·next 묶음이 진짜 정중앙에 온다 —
     margin-left:auto 방식은 남는 공간을 한쪽만 흡수해 묶음을 왼쪽으로 밀어낸다. */
  position: absolute;
  right: 0;
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.brandSubtleHover};
  }

  /* 이미 이번 달이면 누를 이유가 없다 — 색을 빼서 "지금은 대상이 아님"을 말한다. */
  &:disabled {
    border-color: ${color.border};
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
