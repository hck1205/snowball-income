import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const CashflowHeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  /* 줄이 카드 남은 폭을 전부 차지해야 마지막 자식(보기 토글)의 margin-left:auto 가 진짜 맨 우측이 된다.
     inline-flex(내용 폭)이던 시절엔 토글이 "컨트롤 묶음의 끝"에만 붙어 우측 정렬로 보이지 않았다. */
  flex: 1 1 auto;
  min-width: 0;
`;

/* 연도 셀렉트는 공용 프리미티브(`@/components/common` Select, size='md', width='116px')가 그린다. */

export const CashflowTotalLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric};

  /* 합계 금액만 도드라지게 — 라벨("배당 합계:")은 보조로 남긴다(사용자 요청 2026-07-25). */
  strong {
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }
`;

export const ViewToggleGroup = styled.div`
  display: inline-flex;
  /* 컨트롤 줄(flex:1)의 남는 공간을 왼쪽으로 몰아 토글을 줄의 실제 맨 우측에 고정한다. */
  margin-left: auto;
  border: 1px solid ${color.border};
  border-radius: ${space[2]};
  overflow: hidden;
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  border: 0;
  padding: ${space[1]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brandSubtle : 'transparent')};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;
