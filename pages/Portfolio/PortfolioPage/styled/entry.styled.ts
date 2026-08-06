import styled from '@emotion/styled';
import { PickCardGrid } from '@/components/common';
import { color, font, media, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 진입 격자 · 실행 취소                                                         */
/* -------------------------------------------------------------------------- */

/**
 * 진입 격자 — 배당 캘린더 · 가계부가 **폭을 절반씩** 나눠 갖는다(2026-08-04 사용자 지시).
 *
 * ## 왜 공용 격자를 그대로 두지 않았나 (1280px 실측)
 * 공용 `PickCardGrid` 는 `auto-fill` 이라 열 수를 **폭이** 정한다. 격자 폭 1160px 이 열 최소폭
 * 280px 로 잘려 `376px × 3칸` 이 됐고, 카드는 둘뿐이라 768px 만 쓰고 오른쪽 392px 이 빈 채로
 * 남았다(1024px 에서도 314px × 3칸 중 두 칸). 여기는 카드 수가 **고정(최대 둘)** 이라 열 수를
 * 폭이 정하게 둘 이유가 없다 — 2열로 못 박으면 1280px 에서 각 572px, 1024px 에서 각 477px 이다.
 *
 * ⚠ 공용 부품은 고치지 않는다 — 커뮤니티 갤러리·빈 상태 격자가 같은 부품을 auto-fill 로 쓴다.
 *   styled() 로 감싸 넘긴 className 을 Emotion 이 부품 자체 스타일 **뒤**에 합치므로 여기 적은
 *   열 규칙이 이긴다. 간격(PICK.gap)과 목록 시맨틱은 부품 것을 그대로 쓴다.
 *
 * ⚠ 가계부가 꺼진 배포(환경변수 없음)에서는 카드가 한 장이라 **왼쪽 절반만 찬다** — 의도다.
 *   남은 한 장이 폭을 다 먹게 하면 같은 카드가 배포마다 다른 크기로 보인다.
 *
 * 접힘은 `mobileWide`(≤640px)에서 1열이다. 같은 페이지의 `GoalCard` 타일 격자가 쓰는 경계와
 * 같은 값이라, 좁은 폭에서 이 화면의 격자들이 **한 폭에서 함께** 접힌다. 641px 에서 각 열이
 * 301px 라 종전 auto-fill 이 요구하던 최소폭(280px)보다 넓다 — 어떤 폭에서도 카드가 지금보다
 * 좁아지지 않는다.
 */
export const EntryGrid = styled(PickCardGrid)`
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 진입 카드(배당 캘린더 · 가계부)의 본문.
 *
 * 🔴 `PickCard` 의 `subtitle` 로 넘기지 마라 — 그 슬롯은 제목 바로 아래 붙는 짧은 캡션이라
 * 두 줄짜리 설명문에는 너무 작다. ⚠ 마진은 0 이다: `PickCard` 의 바디/액션 간격은 그 부품이 낸다.
 */
export const EntryBody = styled.p`
  margin: 0;
  max-width: 46ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 진입 카드의 액션 묶음 — 버튼과 그 **아래** 사유 한 줄.
 *
 * 🔴 사유를 `PickCard` 의 `children`(본문)에 두면 버튼 **위**에 뜬다(부품이 본문 → 액션 순으로
 * 그린다). 비활성 사유는 언제나 그 버튼 곁, 그것도 아래에 있어야 읽는 순서가 맞다.
 */
export const EntryActions = styled.div`
  display: grid;
  justify-items: start;
  gap: ${space[2]};
  min-width: 0;
`;

/** 진입 카드 안, 버튼 아래 사유 한 줄(달력이 비활성일 때). 무음 비활성 금지. */
export const EntryHint = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 실행 취소 배너 내부 — 문장과 되돌리기 버튼을 한 줄에 둔다. */
export const UndoRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;
