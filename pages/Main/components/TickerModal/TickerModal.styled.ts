import styled from '@emotion/styled';
import { ModalBody, ModalPanel } from '@/pages/Main/Main.shared.styled';
import { color, font, space } from '@/shared/styles';

/**
 * ModalPanel 밖의 relative 셸 — 프리셋 필터 드로어를 이 셸의 absolute 형제로
 * 핀해 패널에 밀리지 않게 한다(공용 ModalPanel/ModalBackdrop 은 다른 모달과 공유라 불변).
 * 폭은 ModalPanel(min(520px,100%))과 동일, 자체 overflow 없음 → 패널 높이에 shrink-wrap.
 */
export const ModalShell = styled.div`
  position: relative;
  width: min(520px, 100%);
  display: block;
`;

/**
 * TickerModal 전용 패널. 리스트 wrapper(130px)로 콘텐츠가 패널 높이 안에 들어오도록 설계돼
 * 모달 자체 스크롤이 불필요하다. 공용 ModalPanel 의 `scrollbar-gutter: stable` 은 스크롤이 없어도
 * 우측 거터를 상시 예약해 모달 오른쪽에 비대칭 여백을 남기므로, 이 모달에서만 스크롤을 끄고
 * 거터를 해제한다. (공용 ModalPanel 은 다른 모달과 공유라 불변 — 여기서만 스코프 override.)
 */
export const TickerModalPanel = styled(ModalPanel)`
  overflow: hidden;
  scrollbar-gutter: auto;
`;

/** 기존 인라인 `style={{ fontSize: '12px' }}`를 대체하는 보조 설명문. */
export const ModalCaption = styled(ModalBody)`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/**
 * 한 필드 + 그 필드를 설명하는 캡션을 한 그리드 셀로 묶는다.
 * 기대 총수익률(자동계산 필드) 바로 아래에 "총수익률 X% (배당+성장)" 근거를 붙이기 위한 것 —
 * 폼 맨 아래 푸터로 두지 않고 설명 대상 필드에 시각적으로 결합한다.
 */
export const FieldWithCaption = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;
