import styled from '@emotion/styled';
import { PICK_RADIUS, color, font, media, radius, sectionTitleFontSize, space, surface } from '@/shared/styles';
import { EMPTY_PAD } from './constants';

/* ── 빈 상태 ───────────────────────────────────────────────────────────────── */

/**
 * 고르는 면(brand)이라 마스코트가 사는 자리다. 종전에는 점선 상자 안에 제목 두 줄 + 사각형 열 개가
 * 전부였다 — 첫 화면인데 브랜드도 초점도 없었다.
 */
/*
 * 🔴 **점선**이다(실선이 아니다). 이 앱에서 "아직 아무것도 없다"는 점선 테두리 + 맨몸 마스코트로
 * 말한다 — 커뮤니티 피드·내가 쓴 글의 빈 상태와 같은 어휘여야 한 제품으로 읽힌다.
 * 실선 + 회색 배지였을 때는 위쪽 덱·아래 표와 같은 무게의 카드로 보여, 빈 상태라는 사실 자체가
 * 화면에서 읽히지 않았다.
 * ⚠ 저쪽 두 화면이 함께 까는 파스텔 워시는 여기서 **뺀다** — 채도 면은 늘리지 않는다.
 *
 * ── 🔴 2026-08-03 흰 캔버스: 면 `surface` → `surfaceMuted`, 점선 `border` → `borderStrong` ──
 * 이 패널은 첫 화면 전체를 차지하는데, 흰 캔버스에서 `surface` 는 **페이지 배경과 같은 값**이라
 * 면이 통째로 사라졌다(구 회색 캔버스에서는 흰 카드 자체가 덩어리였다). 남은 것은 1.49:1 짜리
 * 점선 하나뿐이었고, 그건 "여기 뭔가 비어 있다"를 말하기엔 너무 조용하다.
 * 그래서 이 앱이 "비어 있음"에 쓰는 **공통 어휘**로 맞춘다 — 점선 `borderStrong`(3.2~3.4:1) +
 * `surfaceMuted` 속삭임 면(`FeedStates.EmptyRoot` · 허브의 `EmptyState` 와 같은 값).
 * 🔴 `surfaceSunken` 까지 내리지 않는 이유도 저쪽과 같다: velog 라이트에서 sunken 은
 * `surfaceHover` 와 같은 값이라, 이 어휘를 쓰는 다른 빈 상태 패널(버튼을 품는다)에서 hover 가 죽는다.
 * 값을 자리마다 다르게 고르면 어휘가 아니게 되므로 여기서도 muted 로 통일한다.
 */
export const EmptyBlock = styled.section`
  ${surface(PICK_RADIUS, EMPTY_PAD)}
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]} clamp(${space[4]}, 3vw, ${space[8]});
  border: 1px dashed ${color.borderStrong};
  background: ${color.surfaceMuted};
  min-width: 0;

  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }
`;

/** 마스코트는 배지에 가두지 않는다 — 커뮤니티 빈 상태(FeedStates.EmptyMark)와 같은 맨몸 96px 이다. */
export const EmptyGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  color: ${color.identity};
`;

export const EmptyBody = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const EmptyTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const EmptyLede = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
`;

/** 1종만 골랐을 때. 빈 상태와 같은 자리지만 **다른 말**을 한다(고른 것이 없는 척하지 않는다). */
export const PartialNotice = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.accentBorder};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;
