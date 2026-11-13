import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 안내 지면 세 장(휴장일 · FOMC · 이번 주)이 함께 쓰는 목록 부품(2026-11-12 정렬 재작업, 11-13 분리).
 * 공용 DataTable 은 태블릿 이하에서 카드로 접혀 일정 하나가 4줄 카드가 됐다 — 그래서 한 줄 = 고정 열 그리드
 * (날짜 · 내용 · 오른쪽 값). 지난 일정은 흐리게, 다음 일정은 테두리와 "다음" 배지로 — 색만이 아니라 글자가 함께 말한다.
 * 2026-11-13: 보조 글(시간·설명·배지)을 한 단계씩 키웠다 — 네이버 검색으로 들어오는 독자가 40대 이상이다.
 */
export const List = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export type RowState = 'past' | 'next' | 'normal';

export const Row = styled('li', { shouldForwardProp: (prop) => prop !== 'state' })<{ state?: RowState }>`
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

  /* 좁은 폭: 배지 · 시각 · "한국시간"을 한 줄로 흘린다 — 세로로 쌓으면 일정 하나가 5줄이 됐다(2026-11-13, 320px). */
  ${media.down('mobileNarrow')} {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${space[1]} ${space[2]};
    text-align: left;
  }
`;

export const SideValue = styled.strong`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  white-space: nowrap;
`;

export type BadgeTone = 'brand' | 'alt' | 'muted' | 'warn';

export const Badge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: BadgeTone }>`
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
