import styled from '@emotion/styled';
import { color, font, hitAreaWithin, motion, radius, space } from '@/shared/styles';

/**
 * 필드 한 칸(라벨 줄 + 컨트롤). `<label>` 이 아니라 `<div>` 인 이유:
 * 도움말 `?` 버튼이 `<label>` 안에 들어가면 라벨의 클릭 영역과 겹치고,
 * 접근성 트리에서 라벨 이름이 input 과 버튼 양쪽에 붙는다.
 */
export const FieldWrapper = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.label`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/**
 * 도움말 버튼. 시각적으로는 18px 원이지만, ::before로 44x44 히트 영역을 깔아
 * 레이아웃을 바꾸지 않으면서 터치 타겟(WCAG 2.5.5)을 확보한다.
 */
export const HelpButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  /*
   * 🔴 2026-07-30 까지 여기 히트 영역이 무조건 44×44 였다. 이 버튼은 라벨 줄(21px)에 있고
   * 아래 입력칸까지 간격이 8px 뿐이라, 세로 44px 영역이 **입력칸 상단 3.5px 을 덮었다**
   * (게다가 의사요소라 입력칸 위에 그려진다). 입력칸 위쪽을 누르면 도움말이 열렸다.
   *
   * 44px 는 상한이 아니라 희망값이다 — 이웃에 닿지 않는 선까지만 넓힌다.
   */
  ${hitAreaWithin(space[2])}

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

const controlBase = `
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  /* 버튼과 같은 조(카드 안 컨트롤) = 동심 라운드의 '안쪽'. Card.styled.ts 의 CARD_RADIUS 가 이
     값에서 역산되므로 버튼과 반드시 같은 값이어야 한다. */
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

export const BaseInput = styled.input`
  ${controlBase};
  padding: ${space[2]} ${space[3]};
  color: ${color.text};

  /* 단위 기호(prefix/suffix)가 있으면 그 기호를 피해 입력 텍스트 여백을 넓힌다(겹침 방지). */
  &[data-adorn~='prefix'] {
    padding-left: calc(${space[3]} + 1em);
  }
  &[data-adorn~='suffix'] {
    padding-right: calc(${space[3]} + 1.2em);
  }

  &[type='date'] {
    font-family: inherit;
  }

  &[type='date']::-webkit-datetime-edit,
  &[type='date']::-webkit-datetime-edit-text,
  &[type='date']::-webkit-datetime-edit-month-field,
  &[type='date']::-webkit-datetime-edit-day-field,
  &[type='date']::-webkit-datetime-edit-year-field {
    font: inherit;
    color: inherit;
  }

  /* 다크 모드에서 날짜 피커 아이콘이 검게 묻히는 것 방지 */
  &[type='date']::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: var(--sb-picker-filter, none);
  }
`;

/** 입력 + 단위 기호를 겹쳐 배치하는 래퍼. 기호는 입력 위에 절대배치(입력 여백으로 자리 확보). */
export const InputAdornmentWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/** 입력값 앞/뒤의 단위 기호. 클릭이 입력으로 통과하도록 pointer-events 를 끈다. */
export const Adornment = styled.span<{ side: 'prefix' | 'suffix' }>`
  position: absolute;
  ${({ side }) => (side === 'prefix' ? 'left' : 'right')}: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.base};
  line-height: 1;
  pointer-events: none;
`;

/* 셀렉트는 공용 프리미티브 `@/components/common/Select`가 그린다(구 BaseSelect 제거). */

/**
 * 입력 아래 보조 표기(달러 환산 등). 라벨보다 한 단계 작고 흐리게 — **입력값과 경쟁하지 않아야 한다.**
 * 값이 없으면 컴포넌트가 아예 렌더하지 않으므로 여기서 빈 줄 높이를 예약하지 않는다.
 */
export const FieldHint = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  font-variant-numeric: tabular-nums;
  /*
   * 이 앱에서 가장 많이 읽히는 설명·검증 카피가 여기다(모든 필드의 힌트 + zod 에러 메시지).
   * 전역 'text-wrap: pretty' 규칙은 'p,li,dd,…' 요소 선택자라 'span' 인 이 자리를 놓친다
   * ('globalStyles.ts' 본문 블록). DESIGN.md §3 "본문·설명 → pretty" 에 예외는 없다.
   * ⚠ 'keep-all' 은 걸지 않는다 — 한국어 산문은 음절 단위 줄바꿈이 관례이고, 걸면 좁은 필드에서
   * 가로로 넘친다. 'balance' 도 제목 전용이다.
   */
  text-wrap: pretty;
`;
