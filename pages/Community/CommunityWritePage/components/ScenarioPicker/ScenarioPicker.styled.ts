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

  /*
   * 🔴 hover 는 **테두리만** 바꾼다. 여기 있던 면색 hover(surfaceHover)를 2026-08-03 에 지웠다 —
   *   이 카드는 인스펙터 타일(surfaceSunken) 위에 앉는 흰 카드인데, velog 라이트에서
   *   surface-hover 와 surface-sunken 이 같은 값(#f1f3f5)이 되어 **hover 하는 순간 카드가
   *   패널에 잠겨 사라졌다**(실측). 2px 테두리가 border→borderStrong 으로 가는 변화는
   *   1.49:1 → 3.3:1 이라 그 자체로 충분히 크다.
   */
  &:hover {
    border-color: ${color.borderStrong};
  }

  &:active {
    transform: scale(0.99);
  }

  &[aria-checked='true'] {
    border-color: ${color.brand};
    background: ${color.surface};
  }

  /*
   * 비활성(무효 payload): **면을 비우고** dashed 로 말한다. 호버·선택 효과는 이 블록이
   * 뒤에 와서 같은 특이도로 덮으므로 무효다(테두리색·transform 둘 다).
   *
   * 🔴 transparent 이지 surfaceSunken 이 아니다 — 다만 **지금 화면에서 픽셀은 같다.**
   *   부모가 InspectorSection(= surfaceSunken)이라 투명은 그 색을 그대로 드러낸다(2026-08-03
   *   실측). 바뀐 것은 값이 아니라 계약이다: 이 카드는 **자기 면을 주장하지 않는다.** 그래서
   *   같은 부품이 흰 Sheet 위로 옮겨가도 "여긴 카드가 아니다"가 유지된다 — sunken 을 박아
   *   두면 흰 지면 위에서 홀로 회색 상자가 되어 오히려 활성 카드보다 튄다.
   *   격은 면색이 아니라 점선 2px + muted 글자 + 사유 문장, 세 채널이 진다
   *   (같은 판단: CommentSection.styled.ts 의 DeletedBody).
   * 🔴 점선을 borderStrong 으로 올리지 않는다 — 활성 카드의 실선이 border(sunken 위 1.34:1)
   *   인데 비활성만 2.99:1 로 올리면 **못 고르는 카드가 고를 수 있는 카드보다 크게 말한다**.
   */
  &[aria-disabled='true'] {
    background: transparent;
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
