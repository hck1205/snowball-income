import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 택1 카드 피커 — 리워크에서 **선택 신호가 면색에서 형태로 바뀌었다**.
 *
 * 전: 선택 카드 = `brandSubtle` 채움 + `brandBorder` 1px.
 * 후: 선택 카드 = **2px 테두리 + ✓ 배지 + 굵어진 제목**. 면은 중립 그대로다.
 *
 * 근거 둘. ①글쓰기는 data 면이라 채도면 예산이 없다(라디오가 8장이면 예산이 즉시 붕괴한다).
 * ②채움은 "비활성 회색 채움"과 밝기가 가까워, 저대비 프리셋에서 선택과 비활성이 헷갈렸다.
 * 테두리 두께·배지·굵기는 회색조에서도 남는 채널이다.
 */

/** 첨부 완료 배지 — 원형 ✓. 의미는 카드 제목 굵기와 2px 테두리가 함께 전달한다. */
export const AttachCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  line-height: 1;
`;

/**
 * 라디오그룹 컨테이너. 인스펙터 칼럼(340px)에 앉으므로 실질적으로 1열이지만, 넓은 자리에 놓여도
 * 무너지지 않게 auto-fill 을 유지한다.
 * (구 버전의 scrollbar-gutter:stable 은 우측에 스크롤바 폭을 상시 예약해 다른 필드와 우측 정렬이
 *  어긋났다 — 사용자 피드백으로 제거했고 되살리지 않는다.)
 */
export const PickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${space[2]};
`;

/**
 * 카드 = role="radio" 버튼. 선택 상태는 `aria-checked` 어트리뷰트 셀렉터로만 스타일링해
 * 시각과 접근성이 어긋날 여지를 없앤다.
 *
 * 🔴 방향키 로빙 포커스(ScenarioPicker.tsx)는 스타일과 무관하게 그대로다 — 여기서 바꾼 것은
 * 테두리·면색·여백뿐이고 tabIndex/aria 는 손대지 않았다.
 */
export const ScenarioOption = styled.button`
  display: grid;
  gap: ${space[1]};
  width: 100%;
  min-width: 0;
  padding: ${space[4]};
  /* 평상시에도 2px 을 쓴다 — 선택 시 두께가 바뀌면 카드 안 내용이 1px 씩 움직인다. */
  border: 2px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  text-align: left;
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:active {
    transform: scale(0.99);
  }

  &[aria-checked='true'] {
    border-color: ${color.brand};
    background: ${color.surface};
  }

  /* 비활성(무효 payload): 가라앉은 면 + dashed. 호버·선택 효과 무효. */
  &[aria-disabled='true'] {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    border-style: dashed;
    border-color: ${color.border};
    cursor: not-allowed;
    transform: none;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const OptionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const OptionTitle = styled.strong<{ muted?: boolean }>`
  min-width: 0;
  /* 비활성 카드에선 제목도 muted(색만으로 의미 전달 아님 — dashed·텍스트 병기). */
  color: ${({ muted }) => (muted ? color.textMuted : color.text)};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 컨텍스트 줄 — 프리뷰/첨부 카드와 동일 토큰(textSecondary, sm, numeric). 선택 가능 카드에만 렌더된다. */
export const OptionContext = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  ${font.numeric}
`;

/** 비활성 사유 — issueMessage 텍스트. */
export const OptionUnavailable = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;
