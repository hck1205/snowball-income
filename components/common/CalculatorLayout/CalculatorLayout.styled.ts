import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 계산기 지면 공통 골격(2026-11-13 추출) — 세금 계산기(`/dividend/tax`)와 은퇴 후 월 소득(`/retirement/income`)이
 * 똑같이 복사해 쓰던 것을 한 곳으로 모았다. 계산기를 하나 더 만들면 여기서 시작한다.
 *   - 읽는 폭 상한 960px, 가운데 — 넓은 화면에서 입력 칸이 끝없이 늘어나지 않게.
 *   - 패널 = 테두리 카드. 안쪽 여백은 화면 폭에 따라 16~24px.
 *   - 입력 격자 = 좁은 폭 1열, mobileWide 이상 2열. 칸은 공용 InputField 와 같은 치수를 쓴다.
 *   - 설명 글은 md(15px) — 이 지면들의 독자는 40대 이상 은퇴 준비층이다(사이트 기본 13~14px보다 한 단계 크게).
 */
export const CalculatorStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: ${space[7]};
  /* 한글은 단어 단위로 꺾는다("연금소/득세" 방지), 띄어쓰기 없는 긴 글은 그래도 넘치지 않게. */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const CalculatorPanel = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[4]}, 3vw, ${space[6]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

export const CalculatorPanelTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const CalculatorFormGrid = styled.div`
  display: grid;
  gap: ${space[4]};
  align-items: start;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: ${space[5]};
  }
`;

export const CalculatorNote = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;
