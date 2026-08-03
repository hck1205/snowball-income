import styled from '@emotion/styled';
import { color, font, hitAreaWithin, motion, pressTransition, pressable, radius, space } from '@/shared/styles';

/**
 * 게시판 글 분류 필터 줄.
 *
 * ## 이 자리에 있던 것 (2026-08-04 교체)
 * 예전에는 `BoardLegend` — "글 종류: 자유 질문&고민 …" 이라는 **읽기 전용 범례**였고, styled 주석이
 * "🔴 필터가 아니다 … 누를 수 있어 보이는 형태를 주지 않는다"고 못 박고 있었다. 사용자 지시로
 * 그 전제가 뒤집혔다 — 분류는 이제 **누르는 것**이고, 라벨 낱말('글 종류')은 없앤다(칩이 스스로
 * 무엇인지 말하므로 앞에 붙는 명사가 군더더기다).
 *
 * 줄의 껍데기(가로 나열·줄바꿈·하단 헤어라인)는 범례 것을 그대로 물려받는다 — 목록과의 간격이
 * 이미 실측으로 맞춰져 있었고, 바뀐 것은 "누를 수 있는가" 하나뿐이다.
 */
export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin: 0 0 clamp(${space[4]}, 2vw, ${space[6]});
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/**
 * 분류 칩 — `components/common` 의 `Chip` 과 **같은 시각 언어**(pill · 선택=brand 채움)를 쓰되
 * 이 자리에 맞게 한 단 키웠다.
 *
 * 🔴 `Chip` 을 그대로 쓰지 않은 이유 두 가지 (재사용을 먼저 검토했다):
 *  ① `Chip` 은 `aria-pressed` 를 내보내지 않는다(`Chip.types.ts` 에 그 prop 이 없다). 다중 토글에서
 *     그 속성이 없으면 켜짐/꺼짐이 **색으로만** 말해진다 — 이 레포가 반복해서 금지해 온 색 단독 채널이다.
 *  ② `Chip` 은 min-height 28px 이라 목록 상단의 주요 조작 장치로 쓰기엔 손가락에 작다.
 * 40px + `hitAreaWithin(space[2])` 로 히트 영역이 44px 가 되고(min(44, 40+8)), 형제 간격 8px 을
 * 넘지 않아 **옆 칩과 겹치지 않는다**(겹치면 "눌렀는데 다른 게 켜진다" — Chip.styled 의 2026-07-30 사고).
 */
export const FilterChip = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid ${({ $selected }) => ($selected ? color.brandBorder : color.border)};
  border-radius: ${radius.pill};
  background: ${({ $selected }) => ($selected ? color.brandSubtle : color.surface)};
  color: ${({ $selected }) => ($selected ? color.brandText : color.textSecondary)};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${({ $selected }) => ($selected ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, ${pressTransition};

  ${pressable}
  ${hitAreaWithin(space[2])}

  &:hover {
    border-color: ${color.brandBorder};
    background: ${({ $selected }) => ($selected ? color.brandSubtleHover : color.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
