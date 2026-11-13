import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/** 이번 주 — 날짜 묶음. 머리(날짜·건수) 아래 항목 줄들. */
export const DayGroup = styled.section`
  display: grid;
  gap: ${space[2]};
`;

export const DayHead = styled.h2`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  margin: 0;
  padding-bottom: ${space[1]};
  border-bottom: 1px solid ${color.border};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const DayCount = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

/** 이번 주 항목 한 줄 — 시간(고정 폭, 오른쪽 정렬) · 배지 · 내용. */
export const EventRow = styled.li`
  display: grid;
  grid-template-columns: 104px 84px minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};

  &:nth-of-type(odd) {
    background: ${color.surfaceSunken};
  }

  /* 배지는 글자 폭만 — 칸 폭(stretch)으로 늘어나면 알약이 아니라 막대가 된다. */
  > :nth-child(2) {
    justify-self: start;
  }

  ${media.down('mobileNarrow')} {
    grid-template-columns: 88px 72px minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const EventTime = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  text-align: right;
  white-space: nowrap;
  ${font.numeric};
`;

export const EventLabel = styled.span`
  min-width: 0;
  font-size: ${font.size.md};
  color: ${color.text};
  overflow-wrap: anywhere;
`;

export const Emphasis = styled.strong`
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;
