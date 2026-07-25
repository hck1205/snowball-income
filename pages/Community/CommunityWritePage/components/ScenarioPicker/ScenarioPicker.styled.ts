import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 택1 카드 피커 조각 — `CommunityWritePage.styled.ts`에서 옮겨왔다(스타일 값 동일, 마크업/동작 변화 없음).
 */

/** 첨부 완료 표시(✓) — 표시색만 brand, 의미는 옆의 이름 텍스트가 전달한다. */
export const AttachCheck = styled.span`
  color: ${color.brand};
  font-size: 1em;
`;

/* ── State A: 택1 카드 피커 (radiogroup) ──────────────────────────────────── */

/**
 * 라디오그룹 컨테이너. 폼 폭에 **꽉 맞게** — 내부 스크롤/scrollbar-gutter를 두지 않는다.
 * (구 버전은 scrollbar-gutter:stable 로 우측에 스크롤바 폭을 상시 예약해 다른 폼 필드와
 *  우측 정렬이 어긋났다. 사용자 피드백으로 제거.) 옵션 카드는 자연 높이로 흐른다.
 */
export const PickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 카드 = role="radio" 버튼. 선택 상태는 `aria-checked` 어트리뷰트 셀렉터로만 스타일링해
 * 시각과 접근성이 어긋날 여지를 없앤다. 선택 카드 토큰은 첨부됨 AttachCard와 동일
 * (brandBorder/brandSubtle) — "고른 카드 = 첨부될 카드" 연속성.
 */
export const ScenarioOption = styled.button`
  display: grid;
  gap: 2px;
  width: 100%;
  min-width: 0;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  /* surfaceSunken = 폼 surface 패널 위에서 옵션 카드가 자체 카드로 뜨게(velog PreviewBlock과 동일 관례). */
  background: ${color.surfaceSunken};
  text-align: left;
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
  }

  &[aria-checked='true'] {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
  }

  /* 비활성(무효 payload): 회색 + dashed 보더. 호버·선택 효과 무효. */
  &[aria-disabled='true'] {
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    border-style: dashed;
    border-color: ${color.border};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const OptionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const OptionTitle = styled.strong<{ muted?: boolean }>`
  min-width: 0;
  /* 비활성 카드에선 제목도 muted(색만으로 의미 전달 아님 — dashed·텍스트 병기). */
  color: ${({ muted }) => (muted ? color.textMuted : color.text)};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
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
`;
