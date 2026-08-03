import styled from '@emotion/styled';
import { color, font, media, motion, space } from '@/shared/styles';

/**
 * S8 자주 묻는 질문.
 *
 * 🔴 **네이티브 details/summary 를 쓴다.** 커스텀 아코디언을 새로 만들지 마라 —
 * 키보드(Enter/Space) 토글과 aria-expanded 를 브라우저가 준다. 티커 상세 FAQ 와 같은 부품 구조다.
 *
 * 🔴 **상자 8개가 아니라 구분선 목록이다.** 각자 테두리와 흰 면을 갖던 8개의 details 는 이 페이지의
 * "전부 카드" 어법을 여덟 번 더 반복하고 있었다. 상자를 지우고 색은 마커로 옮겼다 — 오른쪽 끝에
 * 색 글리프 8개가 세로로 선다. 펼침 표시는 계속 **글리프 모양**(+ 와 −)이 1급 신호다.
 *
 * ⚠ 펼친 항목의 3px 좌측 레일은 폐기했다 — 상자가 사라지면 그 레일은 본문 왼쪽에 떠 있는 막대가 된다.
 * 이 컴포넌트에는 transform 상태가 **하나도 없다.** 다시 넣으려면 먼저 상태를 만들어라
 * (전이가 있으니 상태를 발명하는 순서가 아니다). 펼침 신호는 글리프 모양 + 와 − 가 진다.
 *
 * 기본 상태는 **전부 접힘**이다. 첫 항목을 자동으로 펼치지 않는다 — 그건 페이지 로드
 * 오케스트레이션이고, 이 지면에서 확정 금지된 연출이다.
 *
 * ## 2026-08-03: 마커가 **원 안의 부호**가 됐다
 * 맨 글자 `+` 는 오른쪽 여백에 떠 있는 문장부호로 보였다(누를 수 있다는 신호가 아니었다).
 * 32px 원 테두리 안에 들어가면서 "여기가 토글"이라는 형태를 갖는다 — 이 지면의 다른 원형 요소
 * (히어로 배지·마무리 마크)와 같은 어휘다. 여전히 의사요소라 DOM 이 늘지 않고, 32px 은
 * tintscan 의 면 하한(180px)에 한참 못 미친다.
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
  gap: ${space[4]};
  padding: ${space[4]} 0;
  /* 상자를 지우면 패딩만으로는 터치 타깃 44px 이 보장되지 않는다 - 명시한다. */
  min-height: 60px;
  list-style: none;
  cursor: pointer;
  font-family: ${font.display};
  /* 질문이 이 목록의 1급 정보다 — 답변(13px)과 두 단 벌린다. */
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.01em;
  color: ${color.text};
  word-break: keep-all;
  transition: color ${motion.fast} ${motion.ease};

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    color: ${color.identityText};
  }

  ${media.down('mobileWide')} {
    font-size: ${font.size.lg};
  }

  /* 질문이 두 줄로 감겨도 표식은 첫 줄 오른쪽에 남는다. */
  &::after {
    content: '+';
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: flex-start;
    width: 32px;
    height: 32px;
    border: 1px solid ${color.identityBorder};
    border-radius: 999px;
    font-family: ${font.sans};
    font-size: ${font.size.xl};
    font-weight: ${font.weight.regular};
    line-height: 1;
    /* 이 섹션에서 색이 사는 유일한 자리(배지 제외). 8개가 오른쪽 끝에 세로로 서서 목록의
       오른쪽 가장자리를 만든다. 글리프 모양이 계속 1급 신호다 - 색은 거들 뿐이다. */
    color: ${color.identity};
  }

  /* 펼침 상태 — 글리프가 − 로 바뀌고 면이 찬다. 🔴 잉크는 identity 가 아니라 **identityText** 다:
     identity-subtle 면 위에 검증된 짝은 identity-text 뿐이다(identity 는 채움용 원색이라
     그 면 위에서 대비가 보장되지 않는다). */
  details[open] &::after {
    content: '−';
    background: ${color.identitySubtle};
    color: ${color.identityText};
  }
`;

export const FaqAnswer = styled.div`
  max-width: 72ch;
  padding: 0 ${space[10]} ${space[5]} 0;
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;

  ${media.down('mobileWide')} {
    padding-right: 0;
  }
`;
