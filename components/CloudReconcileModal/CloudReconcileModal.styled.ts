import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 충돌 화해 모달의 시각 언어. 백드롭·패널·제목·본문은 공용 Modal 프리미티브(`@/components/common/Modal`)를
 * 재사용하고, 여기엔 **비교 요약(좌 이 기기 / 우 클라우드)** 과 **3택 선택 목록**만 정의한다.
 */

/** 좌(이 기기)/우(클라우드) 비교 — 데스크톱 2열, 좁은 폭에서 1열 스택. */
export const CompareRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${space[3]};

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

/** 한 측 요약 카드 — 패널 위에서 자체 카드로 뜨도록 surfaceSunken. */
export const CompareCol = styled.section`
  display: grid;
  gap: ${space[2]};
  align-content: start;
  padding: ${space[3]};
  background: ${color.surfaceSunken};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
`;

export const CompareHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;
`;

export const CompareLabel = styled.h4`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/** 더 최근에 편집된 측에 붙는 "최근 편집" 태그(장식 배지 — accent 허용 범위). */
export const RecentTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 ${space[2]};
  min-height: 20px;
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
`;

export const CompareCount = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const TabChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const TabChip = styled.li`
  padding: ${space[1]} ${space[2]};
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CompareMeta = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/** 3택 선택 목록 — 세로 스택(선택지마다 제목 + 보조 설명 2줄 구조). */
export const ChoiceList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/**
 * 선택 버튼(공통). `recommended`(블렌드)는 브랜드 강조로 눈에 띄게, 파괴적 선택지는 중립 면색.
 * 좌측 정렬 + 제목/보조설명 세로 스택이라 공용 Button(중앙 정렬)이 아니라 자체 버튼으로 만든다.
 */
export const ChoiceButton = styled.button<{ recommended?: boolean }>`
  display: grid;
  gap: ${space[1]};
  width: 100%;
  text-align: left;
  padding: ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${({ recommended }) => (recommended ? color.brandBorder : color.border)};
  background: ${({ recommended }) => (recommended ? color.brandSubtle : color.surface)};
  color: ${color.text};
  font-family: inherit;
  cursor: pointer;
  transition:
    filter ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    filter: brightness(0.98);
    border-color: ${({ recommended }) => (recommended ? color.brandBorder : color.borderStrong)};
  }
`;

export const ChoiceTitleRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
`;

/** "추천" 배지 — 블렌드(비파괴)를 기본 권장으로 안내. */
export const RecommendBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 ${space[2]};
  min-height: 20px;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

/** 선택지 보조 설명. `destructive`(…사라집니다)는 danger 톤으로 파괴성을 미리 경고한다. */
export const ChoiceHint = styled.span<{ destructive?: boolean }>`
  font-size: ${font.size.sm};
  color: ${({ destructive }) => (destructive ? color.danger : color.textSecondary)};
`;
