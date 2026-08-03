import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, radius, space, surface } from '@/shared/styles';

/**
 * 이 화면이 세우는 면의 패딩. `surface()` 가 이 값에서 안쪽 라운드까지 파생하므로 상수로 둔다
 * (`TickerComparePage.styled.ts` 가 같은 이유로 같은 형태를 쓴다).
 */
const PANEL_PAD = space[4];

/** 히어로 아래 본문. 섹션 간격 하나만 여기서 정한다 — 섹션마다 margin 을 흩뿌리지 않는다. */
export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  margin-top: ${space[6]};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const Body = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.7;
  max-width: 72ch;
`;

/**
 * 기준 배지 — "연속 증배 50년 이상". 이 화면에서 **가장 먼저 읽혀야 하는 사실**이라 본문이 아니라
 * 자기 면을 갖는다.
 */
export const CriterionBadge = styled.p`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
`;

/** 읽기 주의 — 경고가 아니라 "이 목록을 어떻게 읽어야 하는가"라 중립 면에 둔다. */
export const CautionPanel = styled.div`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;
`;

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
`;

export const FilterLabel = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

/** 표 위의 한 줄 — 지금 몇 종목이 보이는지. 필터를 걸면 사용자가 잃는 맥락을 여기서 되돌려준다. */
export const TableMeta = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/** 출처 목록. `<dl>` 이 아니라 `<ul>` 인 이유: 각 항목이 "자료 하나"라는 동등한 낱개다. */
export const SourceList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const SourceItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const SourceRole = styled.span`
  padding: 1px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

export const SourceLink = styled.a`
  color: ${color.brandText};
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export const SourceDate = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/** 다른 목록으로 가는 카드 줄. 세 목록이 서로를 알고 있어야 하나만 보고 나가지 않는다. */
export const RelatedGrid = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RelatedCard = styled(Link)`
  ${surface(DATA_RADIUS, PANEL_PAD)};
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
  }
`;

export const RelatedTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

export const RelatedMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const HubLink = styled(Link)`
  align-self: flex-start;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;
