import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 색 규율: 전부 기존 시맨틱 토큰(`var(--sb-*)`) — 새 hex 0. 상태(active·error·focus)는 전부
 * **prop 기반** styled(`styled.el<{prop}>`)로 분기한다 — Emotion 컴포넌트 셀렉터(`${Parent} &`)는
 * 이 레포 테스트 변환에서 런타임 throw(babel-plugin 없음)라 금지. 모션은 duration만(delay 금지).
 */

/** 트리거+패널 루트(바깥클릭·Esc·Tab-out 감지 컨테이너). 팝오버는 이 루트에 absolute 앵커. */
export const FilterRoot = styled.div`
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
`;

/**
 * 검색 컨트롤(Select / SearchInputWrap)과 같은 36px 규격 트리거 — 전 폭에서 **아이콘 전용**이다.
 * 라벨("정밀 검색")을 넣으면 390px 에서 검색 입력이 70px 더 줄어든다 → 라벨은 `aria-label` 이 갖고,
 * 적용된 필터 수는 배지 + aria-label 이 함께 알린다(색·숫자 단독 아님).
 */
export const FilterTrigger = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  height: 36px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${({ active }) => (active ? color.brandBorder : color.borderStrong)};
  background: ${({ active }) => (active ? color.brandSubtle : color.surface)};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  line-height: 1;
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }

  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

/** 활성 필터 개수 배지 — brand 채움 위 라벨은 반드시 onBrand(하드코딩 흰색 금지). 상태 정본은 aria. */
export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: 1;
  ${font.numeric}
`;

/**
 * 드롭다운 패널 — 트리거에 앵커된 absolute 팝오버 한 벌.
 *
 * 오른쪽 끝을 트리거에 맞추고(`right: 0`) 왼쪽으로 편다. 폭 상한을 `100vw − space[6]` 으로 묶어
 * 모바일에서도 화면 밖으로 나가지 않는다. 갤러리 본문 조상에는 `overflow`/`contain` 이 없어
 * 잘리지 않는다(실측) — 여기에 `Card`(`contain: layout paint style`)를 끼워 넣지 마라.
 */
export const Panel = styled.div`
  position: absolute;
  top: calc(100% + ${space[2]});
  right: 0;
  width: min(360px, calc(100vw - ${space[6]}));
  z-index: ${zIndex.dropdown};
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.e3};
  padding: ${space[4]};
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

export const PanelTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

export const Legend = styled.legend`
  padding: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/** SearchInputWrap과 같은 셸 — focus-within 링 한 겹. */
export const FieldShell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  height: 36px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  min-width: 0;
  flex: 1 1 0;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const NumberInput = styled.input`
  border: 0;
  background: transparent;
  outline: none;
  min-width: 0;
  flex: 1 1 auto;
  color: ${color.text};
  font-size: ${font.size.sm};
  ${font.numeric}

  /* 포커스 링은 감싸는 FieldShell(:focus-within)만 그린다(전역 input:focus-visible 이중 링 무효화). */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  &::placeholder {
    color: ${color.textMuted};
  }
`;

export const Suffix = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const RangeSep = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const RangeUnit = styled.span`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const Hint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const FieldError = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};

  svg {
    flex: 0 0 auto;
  }
`;

export const PanelFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin-top: ${space[3]};
`;
