import styled from '@emotion/styled';
import { ModalBody, ModalPanel } from '@/components/common';
import { color, font, space, subtleScrollbar } from '@/shared/styles';

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
 * TickerModal 전용 패널.
 *
 * ⚠ 여기 있던 `overflow: hidden` 이 "모바일에서 티커 생성 모달이 스크롤 안 됨"의 근본원인이었다.
 * 원래 의도는 **거터**였다 — 공용 ModalPanel 의 `scrollbar-gutter: stable` 이 스크롤이 없어도
 * 우측 거터를 상시 예약해 모달 오른쪽에 비대칭 여백을 남기는 것. 그런데 스크롤 자체를 꺼서 고쳤고,
 * 그 전제("리스트 wrapper 130px 로 콘텐츠가 패널 높이 안에 들어온다")는 **좁은 폭에서 깨진다**:
 * 제목·설명·탭·검색행·상태줄·캡션 2줄·칩 목록(130px)·프리셋 요약 폼(모바일 2열 = 3행)·액션이
 * 세로로 쌓여 `max-height: min(88vh, 760px)` 를 넘고, 넘친 부분(=저장/생성 버튼)이 잘린 채
 * 스크롤도 불가능해 손이 닿지 않았다.
 *
 * 수정: 세로 스크롤만 되살리고 **거터는 `auto` 로 유지**한다 — `auto` 는 스크롤바가 실제로 있을
 * 때만 자리를 쓰므로, 안 넘치는 데스크톱에서는 예전과 똑같이 비대칭 여백이 없다(원래 문제 재발 없음).
 * 가로는 계속 `hidden`(칩 그리드가 1px 삐져나와 가로 스크롤바가 생기는 걸 막던 기존 동작 유지).
 *
 * 필터 드로어는 이 패널이 아니라 위 `ModalShell` 의 absolute 형제라, 패널이 스크롤해도 함께
 * 밀리지 않는다(그 계약이 ModalShell 이 존재하는 이유다 — 스크롤 복구 후에도 그대로 성립).
 *
 * (공용 ModalPanel 은 다른 모달과 공유라 불변 — 여기서만 스코프 override.)
 */
export const TickerModalPanel = styled(ModalPanel)`
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: auto;
  /* 패널 끝에서 배경 페이지로 스크롤이 번지지 않게(모바일 터치). */
  overscroll-behavior: contain;
  ${subtleScrollbar}

  /*
   * 모바일 주소창이 떠 있으면 vh(large viewport)는 실제 보이는 높이보다 크다 — 그 차이만큼
   * 패널 아래가 화면 밖으로 나가 액션 버튼이 가려진다. dvh 지원 브라우저에서만 승격(미지원이면
   * 이 선언이 통째로 무시돼 ModalPanel 의 min(88vh, 760px)가 그대로 폴백).
   * (이 파일은 css 템플릿 리터럴이라 주석에 백틱 금지)
   */
  max-height: min(88dvh, 760px);
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
