import styled from '@emotion/styled';
import { color, font, motion, space } from '@/shared/styles';

/**
 * 첨부 CTA 밑 미리보기 **아코디언(디스클로저)** — 기본 접힘.
 * 상세의 `AttachUnit`(단일 surface/테두리/radius) 안에서 CTA 배너 바로 아래에 seam 없이 이어지는
 * **하단 섹션**이다 — 자체 테두리·radius·배경을 갖지 않고 유닛의 것을 물려받는다(한 덩어리로 읽히게).
 */
export const PreviewAccordion = styled.section`
  display: block;
`;

/**
 * 디스클로저 헤더 = 네이티브 button. Enter/Space 토글은 버튼 기본 동작(추가 핸들러 불요).
 * 위 CTA 배너와의 경계는 `border-top` 한 줄(이중 테두리 없이 seam으로만).
 */
export const PreviewHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[4]} clamp(${space[4]}, 3vw, ${space[5]});
  border: 0;
  border-top: 1px solid ${color.border};
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }
`;

/** 헤더 라벨 — 남는 폭을 차지해 셰브론을 우측 끝으로 민다. */
export const PreviewHeaderText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/** 디스클로저 셰브론(장식) — 열림 상태는 aria-expanded가 말한다. 회전만 담당. */
export const Chevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.textMuted};
  transition: transform ${motion.base} ${motion.ease};
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;

/**
 * 펼침 영역(region). 접힘일 때 `hidden`으로 display:none — 파이는 펼칠 때만 마운트하므로
 * (호출부 조건 렌더) 여기선 여백·구분선만 준다. display를 직접 두지 않아 `[hidden]`이 이긴다.
 */
export const PreviewPanel = styled.div`
  padding: clamp(${space[4]}, 3vw, ${space[5]});
  border-top: 1px solid ${color.border};

  &[hidden] {
    display: none;
  }
`;

/** 숫자(SimSummaryStats card) → 파이 세로 스택. 파이는 폭을 꽉 채워 외곽 라벨이 잘리지 않게. */
export const PreviewBody = styled.div`
  display: grid;
  gap: ${space[4]};
`;

/**
 * 반응형 차트 프레임 — 시뮬레이터 파이(`allocationPieOption`)를 그대로 그린다. ResponsiveEChart가
 * 컨테이너 크기에 맞춰 리사이즈하므로 여기서 높이(정해진 값)만 준다. role="img"+aria-label은 렌더 시 부여.
 */
export const ChartFrame = styled.div`
  width: 100%;
  height: clamp(240px, 56vw, 300px);
  min-width: 0;
`;
