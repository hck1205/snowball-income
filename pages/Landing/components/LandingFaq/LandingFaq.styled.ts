import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * S8 자주 묻는 질문.
 *
 * 🔴 **네이티브 details/summary 를 쓴다.** 커스텀 아코디언을 새로 만들지 마라 —
 * 키보드(Enter/Space) 토글과 aria-expanded 를 브라우저가 준다. 티커 상세 FAQ 와 같은 부품 구조다.
 *
 * 🔴 **상자 8개가 아니라 구분선 목록이다**(2026-08-01 시각 언어 리워크). 각자 테두리와 흰 면을 갖던
 * 8개의 details 는 이 페이지의 "전부 카드" 어법을 여덟 번 더 반복하고 있었고, 그러면서도 유채 요소가
 * **0개**인 유일한 섹션이었다. 상자를 지우고 색은 마커로 옮겼다 - 오른쪽 끝에 색 글리프 8개가
 * 세로로 선다. 펼침 표시는 계속 **글리프 모양**(+ 와 −)이 1급 신호다.
 *
 * ⚠ 펼친 항목의 3px 좌측 레일은 폐기했다 — 상자가 사라지면 그 레일은 본문 왼쪽에 떠 있는 막대가 된다.
 * 레일과 함께 마커 회전도 폐기했으므로 이 컴포넌트에는 transform 상태가 **하나도 없다** —
 * 남아 있던 transition: transform 은 고아 전이라 지웠다. 다시 넣으려면 먼저 상태를 만들어라
 * (전이가 있으니 상태를 발명하는 순서가 아니다). 펼침 신호는 글리프 모양 + 와 − 가 진다.
 *
 * 기본 상태는 **전부 접힘**이다. 첫 항목을 자동으로 펼치지 않는다 — 그건 페이지 로드
 * 오케스트레이션이고, 이 지면에서 확정 금지된 연출이다.
 */

export const FaqList = styled.div`
  display: grid;
  gap: 0;
  min-width: 0;
  border-top: 1px solid ${color.border};
`;

export const FaqItem = styled.details`
  border-bottom: 1px solid ${color.border};
`;

export const FaqSummary = styled.summary`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[3]} 0;
  /* 상자를 지우면 패딩만으로는 터치 타깃 44px 이 보장되지 않는다 - 명시한다. */
  min-height: 44px;
  list-style: none;
  cursor: pointer;
  font-family: ${font.sans};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  word-break: keep-all;

  &::-webkit-details-marker {
    display: none;
  }

  /* 질문이 두 줄로 감겨도 표식은 첫 줄 오른쪽에 남는다. */
  &::after {
    content: '+';
    flex: 0 0 auto;
    align-self: flex-start;
    font-size: ${font.size.xl};
    font-weight: ${font.weight.regular};
    /* 이 섹션에서 색이 사는 유일한 자리(배지 제외). 8개가 오른쪽 끝에 세로로 서서 목록의
       오른쪽 가장자리를 만든다. 글리프 모양이 계속 1급 신호다 - 색은 거들 뿐이다. */
    color: ${color.identity};
  }

  details[open] &::after {
    content: '−';
  }
`;

export const FaqAnswer = styled.div`
  padding: 0 0 ${space[4]};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;
