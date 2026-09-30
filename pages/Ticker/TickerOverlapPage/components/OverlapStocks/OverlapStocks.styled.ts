import styled from '@emotion/styled';
import {
  color,
  font,
  media,
  radius,
  space
} from '@/shared/styles';

/* OverlapStocks 의 스타일 — 원래 TickerOverlapPage.styled.ts 에서 값 변경 없이 옮겼다. 규율은 ../../styled/index.ts 머리말. */

export const StockList = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

/** 겹치는 종목은 가라앉은 면으로 한 덩어리가 되고, 한 곳에만 있는 종목은 면 없이 그 아래 선다. */
export const StockRow = styled.li<{ $shared: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto minmax(72px, 1fr) 60px;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${({ $shared }) => ($shared ? color.surfaceSunken : 'transparent')};
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr) auto 56px;
  }
`;

export const StockName = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textMuted};
    font-family: ${font.dataNumeric};
    font-size: ${font.size['2xs']};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${font.numeric}
  }
`;

export const HolderDots = styled.span`
  display: inline-flex;
  gap: 3px;
`;

export const ExposureBar = styled.span`
  display: block;
  height: 6px;
  overflow: hidden;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};

  ${media.down('mobile')} {
    display: none;
  }
`;

export const ExposureFill = styled.span<{ $shared: boolean; $ratio: number }>`
  display: block;
  width: ${({ $ratio }) => `${Math.round(Math.min(1, Math.max(0, $ratio)) * 1000) / 10}%`};
  height: 100%;
  border-radius: ${radius.pill};
  background: ${({ $shared }) => ($shared ? color.warning : color.textMuted)};
  transition: width 500ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ExposureValue = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-align: right;
  ${font.numeric}
`;
