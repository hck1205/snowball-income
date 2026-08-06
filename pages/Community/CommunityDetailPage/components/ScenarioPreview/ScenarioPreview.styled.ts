import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 첨부 카드 안의 **디스클로저**(기본 접힘) — 조건 3칸 아래에 이어 붙는 하단 섹션이다.
 * 자체 테두리·radius·배경을 갖지 않고 카드의 것을 물려받는다(한 덩어리로 읽히게).
 *
 * 리워크에서 바뀐 것: 셰브론이 **원형 배지**가 됐고(누를 수 있는 것이 어디인지 형태로 말한다),
 * 헤더 전체가 hover 에서 면색을 얻어 행이 통째로 버튼임을 알린다.
 */
export const PreviewAccordion = styled.section`
  display: block;
`;

export const PreviewHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[4]} clamp(${space[4]}, 3vw, ${space[6]});
  border: 0;
  border-top: 1px solid ${color.border};
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }

  /* ⚠ Emotion 컴포넌트 셀렉터(@emotion/babel-plugin)는 이 레포에 설치돼 있지 않다 —
     자식 강조는 data 어트리뷰트로 건다(Chevron 이 data-preview-chevron 를 낸다). */
  &:hover [data-preview-chevron] {
    background: ${color.surface};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

/** 헤더 라벨 — 남는 폭을 차지해 셰브론을 우측 끝으로 민다. */
export const PreviewHeaderText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/** 셰브론 배지(장식) — 열림 상태는 aria-expanded 가 말한다. 회전과 면색만 담당. */
export const Chevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  transition: transform ${motion.base} ${motion.ease}, background ${motion.fast} ${motion.ease};
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;

/**
 * 펼침 영역(region). 접힘일 때 `hidden` 으로 display:none — 파이는 펼칠 때만 마운트하므로
 * (호출부 조건 렌더) 여기선 여백·구분선만 준다. display 를 직접 두지 않아 `[hidden]` 이 이긴다.
 */
export const PreviewPanel = styled.div`
  padding: clamp(${space[4]}, 3vw, ${space[6]});
  border-top: 1px solid ${color.border};
  background: ${color.surfaceSunken};

  &[hidden] {
    display: none;
  }
`;

/** 숫자(SimSummaryStats card) → 파이 세로 스택. 파이는 폭을 꽉 채워 외곽 라벨이 잘리지 않게. */
export const PreviewBody = styled.div`
  display: grid;
  gap: ${space[5]};
`;

/**
 * 반응형 차트 프레임 — 시뮬레이터 파이(`allocationPieOption`)를 그대로 그린다. ResponsiveEChart 가
 * 컨테이너 크기에 맞춰 리사이즈하므로 여기서 높이(정해진 값)만 준다. role="img"+aria-label 은 렌더 시 부여.
 */
export const ChartFrame = styled.div`
  width: 100%;
  height: clamp(260px, 56vw, 320px);
  min-width: 0;
`;
