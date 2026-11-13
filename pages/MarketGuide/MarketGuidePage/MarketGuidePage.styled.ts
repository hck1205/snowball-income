import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 미국 증시 안내 지면(2026-11-12 정렬 재작업). 공용 DataTable 은 태블릿 이하에서 카드로 접혀 일정 하나가
 * 4줄 카드가 됐고(25건이면 화면이 끝없이 길다), 데스크톱에서는 열이 화면 끝까지 벌어졌다. 그래서:
 *   - 읽는 폭 상한 880px, 가운데.
 *   - 한 줄 = 고정 열 그리드(날짜/시간 · 배지 · 내용 · 오른쪽 값). 모든 폭에서 같은 열에 같은 정보가 선다.
 *   - 지난 일정은 흐리게, 다음 일정은 테두리와 "다음" 배지로 — 색만이 아니라 글자가 함께 말한다.
 *   - 2026-11-13: 보조 글(시간·설명·배지)을 한 단계씩 키웠다 — 네이버 검색으로 들어오는 독자가 40대 이상이다.
 */
export const GuideStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding-bottom: ${space[7]};
`;

export const List = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Row = styled('li', { shouldForwardProp: (prop) => prop !== 'state' })<{ state?: 'past' | 'next' | 'normal' }>`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${({ state }) => (state === 'next' ? color.brand : color.border)};
  border-radius: ${radius.md};
  background: ${({ state }) => (state === 'next' ? color.brandSubtle : color.surface)};
  opacity: ${({ state }) => (state === 'past' ? 0.55 : 1)};

  ${media.down('mobileNarrow')} {
    grid-template-columns: 64px minmax(0, 1fr);
    > :last-child {
      grid-column: 2;
    }
  }
`;

/** 날짜 블록 — 월은 작게, 일은 크게, 요일은 아래. 세 줄이 세로 가운데. */
export const DateBlock = styled.div`
  display: grid;
  justify-items: center;
  padding: ${space[1]} 0;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  line-height: 1.1;
  ${font.numeric};
`;

export const DateMonth = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const DateDay = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
`;

export const DateWeekday = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const RowMain = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const RowTitle = styled.strong`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  overflow-wrap: anywhere;
`;

export const RowSub = styled.span`
  font-size: ${font.size.base};
  color: ${color.textSecondary};
`;

export const RowSide = styled.div`
  display: grid;
  justify-items: end;
  gap: ${space[1]};
  text-align: right;
  ${font.numeric};

  ${media.down('mobileNarrow')} {
    justify-items: start;
    text-align: left;
  }
`;

export const SideValue = styled.strong`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  white-space: nowrap;
`;

export const Badge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: 'brand' | 'alt' | 'muted' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
  border: 1px solid
    ${({ tone }) => (tone === 'brand' ? color.brandBorder : tone === 'alt' ? color.accentBorder : tone === 'warn' ? color.accentAltBorder : color.border)};
  background: ${({ tone }) =>
    tone === 'brand' ? color.brandSubtle : tone === 'alt' ? color.accentSubtle : tone === 'warn' ? color.accentAltSubtle : color.surfaceSunken};
  color: ${({ tone }) =>
    tone === 'brand' ? color.brandText : tone === 'alt' ? color.accentText : tone === 'warn' ? color.accentAltText : color.textSecondary};
`;

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

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

export const Footnotes = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const RelatedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  margin-top: ${space[4]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;
