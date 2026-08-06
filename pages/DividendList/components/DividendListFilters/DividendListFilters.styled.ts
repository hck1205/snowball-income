import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 세 축 필터 판.
 *
 * 표 바로 위에 **자기 면**을 갖는 이유: 종전의 섹터 칩 한 줄은 표와 같은 면 위에 떠 있어서
 * "표의 일부"로 읽혔다. 축이 셋이 되면 그 줄은 8~14개 칩이 흘러가는 덩어리가 되므로, 면과
 * 테두리로 "여기까지가 조건, 아래가 결과"를 먼저 갈라야 한다.
 *
 * ⚠ 면은 `surfaceSunken` 이다(카드가 아니라 **패인 자리**). 표는 캔버스 위에 그대로 서므로
 *   필터가 솟은 카드가 되면 결과보다 조건이 무거워 보인다.
 */
export const FiltersPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

/**
 * 축 한 줄 = 라벨 + 칩들. 라벨이 **자기 폭만** 갖고 칩이 남는 폭을 먹는다(반대로 두면 칩 줄이
 * 접힐 때 라벨이 눌린다 — 표의 행 카드에서 같은 함정을 이미 겪었다).
 */
export const AxisRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  min-width: 0;

  /*
   * 좁은 폭에서는 라벨을 칩 줄 **위로** 올린다. 390 실측(2026-08-04 · 배당챔피언, 칩이 몇 줄로
   * 접히는지를 잰 값): 라벨 기둥을 남기면 칩이 쓸 폭이 332 → 240px 로 줄어
   * 배당률·성장 축이 1줄에서 **2줄**, 섹터 축이 4줄에서 **5줄**이 된다. 라벨 하나를 옆에 세우려고
   * 세 축이 세로로 3줄씩 자라는 거래는 남는 게 없다.
   */
  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
    gap: ${space[1]};
  }
`;

export const AxisLabel = styled.span`
  flex: 0 0 auto;
  min-width: 88px;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/** 세 축이 함께 걸린다는 사실을 말하는 한 줄. 칩 아래에 둔다(읽기 전에 조작할 수 있어야 한다). */
export const FilterHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

/**
 * 지금 걸린 조건을 **글자로** 말하는 줄. 필터가 걸렸을 때만 그린다.
 *
 * 🔴 이 줄이 이 화면의 **색 아닌 채널**이다. 칩의 선택 표시는 (테두리·면·굵기)지만 그중 두 개가
 * 색이고, 굵기 하나만으로는 "무엇을 골랐는지"를 멀리서 알 수 없다. 조건을 문장으로 다시 쓰면
 * 색을 못 보는 사용자도, 칩 줄을 스크롤로 지나친 사용자도 상태를 잃지 않는다.
 */
export const ActiveRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const ActiveBadge = styled.span`
  flex: 0 0 auto;
  padding: 1px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const ActiveText = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  overflow-wrap: anywhere;
`;
