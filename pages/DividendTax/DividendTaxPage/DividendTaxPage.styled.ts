import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 세금 계산기(2026-11-12, 같은 날 정렬 재작업). 규칙:
 *   - 읽는 폭 상한(960px) — 넓은 화면에서 입력 칸이 끝없이 늘어나지 않게.
 *   - 입력 칸은 공용 InputField 와 **같은 치수**(라벨 base·medium·보조색, 라벨↔컨트롤 space[2], 높이 40px).
 *     건강보험 자격도 같은 높이의 3칸 선택으로 — 같은 줄의 입력창과 윗선·아랫선이 맞는다.
 *   - 결과 카드는 **같은 해부**(작은 제목 → 큰 값 → 상태 배지 → 설명). 상태는 바탕색이 아니라 배지가 말한다.
 *   - 결과 3장은 데스크톱(≥ headerStack)에서만 3열, 그 아래는 세로로 쌓는다(태블릿에서 글이 꺾이지 않게).
 */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: ${space[7]};
`;

export const Panel = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[4]}, 3vw, ${space[6]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const FormGrid = styled.div`
  display: grid;
  gap: ${space[4]};
  align-items: start;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: ${space[5]};
  }
`;

/** InputField 의 FieldWrapper 와 같은 골격(라벨 줄 + 컨트롤). */
export const Field = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

/** 3칸 선택 — 입력창과 같은 높이(40px)·같은 라운드. */
export const Segmented = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 40px;
  padding: 3px;
  gap: 3px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

export const SegmentButton = styled('button', { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  min-width: 0;
  border: 0;
  border-radius: calc(${radius.sm} - 2px);
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  box-shadow: ${({ active }) => (active ? `0 0 0 1px ${color.brandBorder}` : 'none')};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font: inherit;
  font-size: ${font.size.sm};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  cursor: pointer;
  white-space: nowrap;
`;

export const ResultGrid = styled.div`
  display: grid;
  gap: ${space[3]};

  ${media.up('headerStack')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ResultCard = styled.section`
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  align-content: start;
  gap: ${space[2]};
  padding: ${space[4]} ${space[5]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  min-width: 0;
`;

export const Eyebrow = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const BigValue = styled.strong`
  font-size: clamp(${font.size['2xl']}, 3vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: ${color.text};
  ${font.numeric};
`;

export const StatusBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: 'ok' | 'warn' | 'info' }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  /* 주의(warn)는 브랜드(초록)와 갈리는 액센트 계열 — 둘이 비슷한 초록이면 "괜찮다/주의"가 안 읽힌다. */
  border: 1px solid ${({ tone }) => (tone === 'warn' ? color.accentBorder : tone === 'ok' ? color.brandBorder : color.border)};
  background: ${({ tone }) => (tone === 'warn' ? color.accentSubtle : tone === 'ok' ? color.brandSubtle : color.surfaceSunken)};
  color: ${({ tone }) => (tone === 'warn' ? color.accentText : tone === 'ok' ? color.brandText : color.textSecondary)};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

export const PanelHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]} ${space[3]};
`;

export const Compare = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  overflow: hidden;
`;

export const CompareItem = styled('div', { shouldForwardProp: (prop) => prop !== 'best' })<{ best?: boolean }>`
  display: grid;
  /* 라벨이 두 줄로 꺾여도 금액은 칸 아래쪽에 — 두 칸의 금액이 같은 높이에 선다. */
  align-content: space-between;
  gap: ${space[1]};
  padding: ${space[3]} ${space[4]};
  background: ${({ best }) => (best ? color.brandSubtle : color.surface)};

  & + & {
    border-left: 1px solid ${color.border};
  }
`;

export const CompareLabel = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const CompareValue = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

export const Highlight = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
`;

export const ToggleChip = styled('button', { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  min-height: 32px;
  padding: 0 ${space[3]};
  border: 1px solid ${({ active }) => (active ? color.brandBorder : color.borderStrong)};
  border-radius: ${radius.pill};
  background: ${({ active }) => (active ? color.brandSubtle : color.surface)};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
`;

export const Footnotes = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;
