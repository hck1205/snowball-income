import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  media,
  radius,
  space,
  topRail
} from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 빈 상태 — 첫 방문자가 보는 유일한 화면                                        */
/* -------------------------------------------------------------------------- */

/**
 * 🔴 **빈 상태는 "없음"을 알리는 자리가 아니라 이 화면의 첫인상이다.**
 *
 * 종전에는 1160×406px 짜리 흰 판 한가운데에 96px 마스코트와 버튼 하나가 떠 있었다 — 넓이의
 * 대부분이 빈 공간이었다. 지금은 **2열 보드**다: 왼쪽이 권유(마스코트 · 제목 · 본문 · CTA),
 * 오른쪽이 근거(등록하면 무엇을 보는가 3줄 + 빠른 시작 칩). 같은 높이에서 정보가 세 배다.
 *
 * 면은 중립이고 색은 상단 6px accent 레일 하나다(높이 6 < 면 하한 8 → 예산 무침범).
 * 🔴 배경을 채우지 마라 — 세 번째 면이 되는 순간 `tools/dev/tintscan.mjs` 가 exit 1 이다.
 *
 * 🔴 아래 `overflow: hidden` **이 레일을 자르는 유일한 장치다.** 지우면 6px 띠가 둥근 모서리
 *    밖으로 나간다 — 이 레포에서 최소 세 번 재발한 결함이라 처방을 `topRail()` 한 곳으로 모았고
 *    (`shared/styles/surfaces.ts`), `shared/styles/geometry.test.ts` 가 소스로 감시한다.
 *    ⚠ 레일에 같은 반경을 주는 우회는 오답이다 — 6px 짜리 띠에서는 CSS 가 반경을 비례축소해
 *      오히려 모서리에 틈이 생긴다(근거는 `topRail` 주석).
 */
export const EmptyBoard = styled.section`
  ${cardElevation('base')}
  position: relative;
  overflow: hidden;
  display: grid;
  gap: clamp(24px, 4vw, 40px);
  align-items: center;
  padding: clamp(28px, 4vw, 44px) clamp(20px, 3vw, 36px);
  border-radius: ${PICK_RADIUS};

  ${media.up('tabletSm')} {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }

  &::before {
    ${topRail(PICK.railHeight)}
    background: ${color.accent};
  }
`;

export const EmptyLead = styled.div`
  display: grid;
  justify-items: start;
  gap: ${space[4]};
  min-width: 0;
`;

/**
 * 빈 상태의 마스코트(96px). **빈 상태 세 곳에만** 사는 크기다 — 값이 있는 화면에 캐릭터를 세우면
 * 숫자와 시선을 다툰다. `BrandGlyph` 는 `currentColor` 계약이라 색은 여기서 준다(`identity`).
 */
export const EmptyMascot = styled.div`
  display: inline-flex;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px)을 쓴다.
 *
 * 종전 값은 `clamp(26px, 3.4vw, 34px)` 이었다. 두 가지가 틀렸다:
 *  ① **하드코딩 px** 이라 타이포 스케일 밖이다(34·26 은 스케일에 없는 값이다).
 *  ② @1280 에서 34px 이 되어 **이 페이지의 h1(30px)보다 커졌다** — 빈 상태 제목이 페이지 제목을
 *     이기는 위계 역전이다. 시뮬레이터·캘린더의 빈 상태는 이미 20~30 곡선을 쓰고 있었고,
 *     같은 역할이 화면마다 18·20·30·34 로 흩어져 있던 것을 이 값으로 모았다.
 */
export const EmptyTitle = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 42ch;
  font-size: ${font.size.base};
  color: ${color.textSecondary};
  line-height: ${font.leading.normal};
`;

/** 오른쪽 절반 — 중립 면 위에 근거 세 줄 + 빠른 시작. */
export const EmptyAside = styled.div`
  ${cardElevation('sunken')}
  display: grid;
  gap: ${space[4]};
  align-content: start;
  min-width: 0;
  padding: clamp(18px, 2.4vw, 26px);
  border-radius: ${DATA_RADIUS};
`;

export const PreviewLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.textMuted};
`;

export const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[3]};
`;

/** 번호가 앞장서는 행. 숫자는 장식이 아니라 "세 가지"라는 사실을 형태로 말한다. */
export const PreviewItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  column-gap: ${space[3]};
  row-gap: 2px;
  min-width: 0;
`;

export const PreviewMark = styled.span`
  grid-row: 1 / span 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const PreviewTerm = styled.strong`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const PreviewBody = styled.span`
  min-width: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/** 칩은 폭 <180px 라 면으로 세어지지 않는다(예산 무침범). 격자로 두어 손가락 대상이 커진다. */
export const QuickPickList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: ${space[2]};
`;

export const QuickPickItem = styled.li`
  display: grid;

  > * {
    width: 100%;
    justify-content: center;
  }
`;

export const QuickPickBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;
