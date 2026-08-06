import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* -------------------------------------------------------------------------- */
/* 자주 묻는 질문                                                                */
/* -------------------------------------------------------------------------- */

export const FaqList = styled.div`
  display: grid;
  gap: ${space[2]};
  max-width: ${MEASURE};
`;

/**
 * 질문 하나.
 *
 * 🔴 `details/summary` 를 쓰는 이유는 **JS 없이 열린다**는 것 하나다 — 크롤러도 사람도 같은 DOM 을
 * 본다(티커 상세 FAQ 와 같은 처방이고, FAQPage JSON-LD 와도 문장이 갈리지 않는다).
 *
 * 종전에는 위아래 1px 선만 있는 목록이라 문단 흐름에 묻혔다. 이제 각 질문이 카드가 되어 "여기부터는
 * 묻고 답하는 구간"이 형태로 읽힌다.
 */
export const FaqItem = styled.details`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover,
  &[open] {
    border-color: ${color.borderStrong};
  }
`;

export const FaqSummary = styled.summary`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[4]};
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  word-break: keep-all;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
    border-radius: ${radius.md};
  }

  /* 열림 표시 — 오른쪽 끝의 +/−. 회색조에서도 남는 **모양** 채널이다. */
  &::after {
    content: '+';
    justify-self: end;
    color: ${color.textMuted};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.lg};
    line-height: 1;
  }

  details[open] &::after {
    content: '\\2212';
  }
`;

/** 질문 번호. 목록을 훑을 때 몇 번째인지 세지 않아도 되게 한다. */
export const FaqIndex = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

export const FaqAnswer = styled.p`
  margin: 0;
  padding: 0 ${space[4]} ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;
