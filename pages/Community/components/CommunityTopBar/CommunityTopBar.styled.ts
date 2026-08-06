import styled from '@emotion/styled';
import { appHeaderHeight, color, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * 좌(목록 복귀) ↔ 우(화면 액션) 한 줄.
 *
 * 320px 폭 예산: 좌우 패딩 24px 를 뺀 296px 안에
 * "← 목록"(아이콘16 + gap4 + 라벨 2자 24 + 좌우패딩 24 ≈ 68px)
 * + "수정"(≈ 68px) + "삭제"(≈ 68px) + gap 8×2 = 220px → 들어간다.
 * 그래도 `flex-wrap` 을 켜 두는 이유는 사용자 글꼴 확대(브라우저 줌·시스템 폰트)에서 예산이 깨질 때
 * **잘리는 대신 줄을 바꾸게** 하기 위해서다(잘림 금지 원칙).
 *
 * ## 🔴 스크롤을 따라온다 (2026-08-05 사용자 지시)
 * 그전에는 글 맨 위에만 있어서, 긴 글을 읽다가 목록으로 돌아가거나 수정하려면 **맨 위까지 되돌아가야**
 * 했다. 글쓰기 화면의 커맨드 바(`CommunityWritePage.styled.ts` 의 `CommandBar`)가 이미 같은 문제를
 * 같은 방법으로 풀어 두었기에 그 처방을 그대로 가져온다 — 두 화면이 다른 방식으로 붙어 다니면
 * 사용자는 같은 줄이 화면마다 다르게 군다고 느낀다.
 *
 * ⚠ sticky 기준선은 `AppHeader` 가 **실측해 발행하는 변수**다 — 헤더가 1줄/2줄로 바뀌어도 어긋나지 않는다.
 * ⚠ 붙어 있는 동안 본문이 뒤로 지나가므로 **불투명한 면과 그림자**가 필요하다. 투명하게 두면
 *   글자가 본문 위에 겹쳐 읽히지 않는다.
 */
export const TopBarRow = styled.div<{ $sticky: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-bottom: ${space[3]};

  ${({ $sticky }) =>
    $sticky
      ? `
        position: sticky;
        top: calc(${appHeaderHeight} + ${space[2]});
        z-index: ${zIndex.stickyAction};
        padding: ${space[2]} ${space[3]};
        border-radius: ${radius.lg};
        background: ${color.surfaceRaised};
        box-shadow: ${shadow.e2};
      `
      : ''}
`;

/** 우측 액션 묶음(상세의 수정·삭제). 소유자가 아니면 아예 렌더되지 않는다. */
export const TopBarActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  margin-left: auto;
`;
