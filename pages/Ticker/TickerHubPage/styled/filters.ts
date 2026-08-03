import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/* ── 조건 칩·정렬·보기 ────────────────────────────────────────────────────── */

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 지급 주기 칩 묶음.
 *
 * 🔴 면은 중립이고, 눌린 칩은 **테두리 굵기와 글자 무게**로 말한다. 폭이 짧아(<180px) 채도를 깔아도
 * 면으로 세어지진 않지만, 눌린 칩만 색면이 되면 그 색이 카테고리 색·티커 색과 세 번째 색 축이 되어
 * 화면의 색 문법이 깨진다. 색 축은 둘로 족하다(카테고리 · 티커).
 */
export const FrequencyChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px ${space[3]};
  border-radius: ${radius.pill};
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.surface : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? color.brand : color.border)};
  color: ${({ $active }) => ($active ? color.text : color.textSecondary)};
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  transition: border-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
    color: ${color.text};
  }
`;

/** 정렬 셀렉트. 네이티브 `select` 라 모바일에서 OS 피커가 뜬다(직접 만든 드롭다운보다 낫다). */
export const SortSelect = styled.select`
  min-width: 0;
  flex: 1 1 auto;
  padding: 7px ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
`;

/**
 * 보기 전환(격자 ⇄ 표) — 이 화면에서 **밀도를 사용자가 고르는** 장치.
 *
 * 카드 격자는 처음 훑을 때 좋고, 표는 27종을 배당률·운용보수로 **비교할 때** 좋다. 둘 중 하나만
 * 두면 반대편 목적이 항상 손해를 본다. 트랙·활성 조각 모두 중립 면이다(예산 0 소모).
 */
export const ViewToggle = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  padding: 2px;
  gap: 2px;
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px ${space[2]};
  border: none;
  border-radius: ${radius.xs};
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.surface : 'transparent')};
  color: ${({ $active }) => ($active ? color.text : color.textMuted)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  box-shadow: ${({ $active }) => ($active ? `inset 0 0 0 1px ${color.border}` : 'none')};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }
`;
