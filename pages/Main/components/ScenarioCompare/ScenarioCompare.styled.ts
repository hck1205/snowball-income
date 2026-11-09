import styled from '@emotion/styled';
import { ModalPanel } from '@/components/common';
import { color, font, space, subtleScrollbar } from '@/shared/styles';

/**
 * 진입 버튼 자리 — 탭 줄과 결과 사이(ResultBoard 의 notices 슬롯), 오른쪽 정렬.
 * 🔴 탭 줄 **옆**에 두지 않는다: 그 줄은 좁은 폭에서 가장 먼저 눌리는 자리라 컨트롤을 옮겨 낸 이력이 있다
 *   (ScenarioTabsRow 주석, 2026-07-29).
 */
export const CompareEntry = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/**
 * 비교 모달 패널 — 공용 모달의 lg(720px)보다 넓다. 차트 둘 + 탭 열 최대 10개의 표가 들어가야 해서다.
 * 🔴 공용 `ModalPanel` 의 폭 규칙("lg 는 칸 많은 폼 전용")을 바꾸지 않고 여기서만 넓힌다.
 */
export const WidePanel = styled(ModalPanel)`
  && {
    width: min(1120px, 100%);
    max-height: min(92vh, 1000px);
    overflow-y: auto;
    ${subtleScrollbar}
  }
`;

export const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const PanelSub = styled.p`
  margin: ${space[1]} 0 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;
