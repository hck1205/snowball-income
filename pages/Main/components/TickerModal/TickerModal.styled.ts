import styled from '@emotion/styled';
import { ModalBody } from '@/components/common';
import { color, font, radius, space, subtleScrollbar } from '@/shared/styles';

/*
 * 🔴 여기 있던 `ModalShell` · `TickerModalPanel` 은 **삭제됐다**(2026-08-11 모달 → 겹친 드로어).
 *    둘은 "화면 가운데 뜬 520px 패널"의 기하와 스크롤 복구 이력을 담고 있었는데, 이 화면이
 *    공용 `SideDrawer` 위로 옮겨가면서 그 역할을 드로어 패널이 통째로 가져갔다(폭·최대높이·
 *    스크롤·거터 전부). 남겨 두면 "어느 쪽이 진짜 패널인가"가 두 벌이 된다.
 *    필터 드로어의 좌표계 기준이던 relative 셸만 아래 `TickerDrawerLayout` 이 이어받는다.
 */

/**
 * 티커 생성 **드로어 본문**의 배치(2026-08-11 모달 → 겹친 드로어).
 *
 * 🔴 `position: relative` 가 핵심이다 — 프리셋 필터 드로어(`PresetFilterDrawer`)가 뷰포트가 아니라
 *    **이 상자 기준으로 `absolute`** 로 핀된다. 모달 시절의 `ModalShell` 이 하던 역할을 그대로
 *    이어받는다(그 컴포넌트의 좌표계 계약을 바꾸지 않기 위해서다 — 그쪽 주석 참고).
 * ⚠ `min-height: 100%` 는 필터 스크림(`inset: 0`)이 내용이 짧을 때도 본문 전체를 덮게 한다.
 */
export const TickerDrawerLayout = styled.div`
  position: relative;
  min-height: 100%;
  display: grid;
  gap: ${space[4]};
  align-content: start;
`;

/**
 * 프리셋 목록 위의 보조 정보 **한 줄**.
 *
 * 🔴 종전에는 캡션 세 줄(면책 두 줄 + 개수 + 다중선택 안내)이 쌓여 목록보다 큰 덩어리였다
 *    (2026-08-11 사용자 지적: 이 공간이 너무 크다). 셋 다 "훑고 지나가는 정보"라 한 줄로 눕히고,
 *    긴 면책 문장은 같은 뜻의 짧은 형태로 줄였다.
 * ⚠ 개수(`표시: N / 전체: N`)는 **자기 요소**로 남긴다 — 다른 문구와 한 노드에 합치면 그 문자열을
 *   그대로 찾는 테스트들이 전부 깨지고, 필터 결과를 눈으로 확인하는 지점도 흐려진다.
 * ⚠ 좁은 폭에서는 두 조각이 자연스럽게 두 줄로 흐른다(`flex-wrap`) — 줄임표로 자르지 않는다.
 */
export const PickerHintRow = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[1]} ${space[3]};
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.4;
  color: ${color.textMuted};
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

/**
 * 담은 종목(생성 대기) 영역.
 *
 * 🔴 프리셋 탭과 직접 입력 탭 **양쪽에서 같은 자리에 선다** — 탭을 옮겨도 담은 것이 보여야
 *    "다른 탭에서 담은 게 사라졌나" 하는 불안이 없다. 그래서 탭 조건 안이 아니라 밖에 놓는다.
 * ⚠ 면색을 카드(surface)로 두지 않는다 — 모달 안의 또 다른 카드처럼 보이면 폼과 경쟁한다.
 *   옅은 muted 면 + 실선 하나로 "임시 보관함"의 무게만 준다.
 */
export const StagedSection = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

export const StagedHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const StagedTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

/**
 * 담은 종목을 **태그로 흘려 놓는 줄**(2026-08-11 사용자 지시: 태그 형태로, 티커 이름만).
 *
 * 🔴 한 항목이 한 행을 먹던 목록에서 태그 줄로 바꿨다 — 다섯 개를 담아도 두 줄이면 끝난다.
 *    이 상자가 위의 프리셋 목록보다 커지는 순간, 고르는 화면이 아니라 확인하는 화면이 돼 버린다.
 * ⚠ 위의 칩 목록(`PresetChipScrollArea`)과 **둘 다 스크롤을 갖고, 둘 다 짧게 둔다.** 한쪽을 길게
 *   빼면 다른 쪽이 화면 밖으로 밀려 "담았는데 안 보이는" 상태가 된다.
 */
export const StagedTagList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  max-height: clamp(64px, 12vh, 116px);
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0;
  padding: 0;
  list-style: none;
  ${subtleScrollbar}
`;

/**
 * 태그 하나. 프리셋 칩(`PresetChipButton`)의 **선택된 상태와 같은 배색**이다 — 위에서 누른 칩이
 * 아래로 내려온 것이므로 같은 것으로 보여야 한다.
 * ⚠ 클릭 대상은 태그 전체가 아니라 안쪽 ⨯ 버튼이다. 태그 전체를 버튼으로 만들면 "누르면 담기나
 *   빠지나"가 위 칩과 반대로 동작해 헷갈린다.
 */
export const StagedTag = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[1]} ${space[1]} ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

/** 태그 안의 빼기 버튼. 터치 타겟이 작아 보이지만 태그의 패딩이 함께 눌리는 영역을 넓힌다. */
export const StagedTagRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: ${radius.pill};
  background: transparent;
  color: inherit;
  font-size: ${font.size.xs};
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: ${color.surface};
  }
`;

export const StagedRemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${color.text};
    border-color: ${color.textMuted};
  }
`;

/** 직접 입력 폼 아래의 "목록에 담기" 줄 — 생성(주 버튼)과 무게가 겹치지 않게 오른쪽 정렬 보조 버튼. */
export const StageActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;
