import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* ── FAQ: 상자 목록 → 헤어라인 아코디언 ────────────────────────────────────── */

export const FaqList = styled.div`
  display: grid;
  border-top: 1px solid ${color.border};
`;

/**
 * FAQ 한 항목.
 *
 * 종전에는 항목마다 테두리 상자였다 — 8개가 세로로 쌓이면 상자 경계가 질문보다 강해 목록 전체가
 * 회색 격자로 읽혔다. 헤어라인 하나로 줄이면 질문 글자가 이 블록의 주인공이 된다.
 *
 * 🔴 펼친 항목의 면이 `surfaceMuted` → `surfaceSunken` 이다(2026-08-03 흰 캔버스). 이 목록은
 * 카드 안이 아니라 **페이지 캔버스 위에 바로** 서는데, 캔버스가 흰색이 되면서 muted 는
 * 1.02~1.08:1 이 됐다 — vivid·grape·sunset 에서는 펼친 항목의 면이 아예 없는 것과 같다.
 * sunken(1.11~1.22:1)이 "열려서 들어간 자리"를 8프리셋 전부에서 만든다.
 * ⚠ `summary` 는 컨트롤이지만 hover 가 **글자색만** 바꾸므로, sunken 과 `surfaceHover` 가 같은
 *   값인 프리셋(velog 라이트)에서도 피드백이 겹치지 않는다.
 */
export const FaqItem = styled.details`
  border-bottom: 1px solid ${color.border};

  &[open] {
    background: ${color.surfaceSunken};
  }
`;

export const FaqSummary = styled.summary`
  cursor: pointer;
  list-style: none;
  padding: ${space[4]} ${space[3]};
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 20px;
  align-items: baseline;
  gap: ${space[2]};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '+';
    justify-self: end;
    font-size: ${font.size.xl};
    font-weight: ${font.weight.regular};
    color: ${color.textMuted};
  }

  details[open] &::after {
    content: '−';
    color: var(--tk-text);
  }

  &:hover {
    color: var(--tk-text);
  }
`;

/** 질문 번호 — 목록이 몇 개인지, 지금 몇 번째를 열었는지 말한다. */
export const FaqIndex = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};
`;

export const FaqAnswer = styled.div`
  padding: 0 ${space[3]} ${space[4]} calc(26px + ${space[2]} + ${space[3]});
  max-width: ${MEASURE};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;
