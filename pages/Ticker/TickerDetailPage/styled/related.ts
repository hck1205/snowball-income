import styled from '@emotion/styled';
import { PickCard } from '@/components/common';
import { PICK_RADIUS, cardElevation, color, font, radius, space } from '@/shared/styles';

/* ── 관련 티커: 평면 카드 → 고르는 카드(PickCard) ──────────────────────────── */

/**
 * 관련 티커 하나의 **색 스코프**이자 격자 셀.
 *
 * 허브 카드(`TickerHubPage/styled/` 의 CardScope)와 **같은 변수 이름**을 쓴다 — 같은 티커가
 * 허브 격자·상세 히어로·이 카드에서 모두 같은 색으로 읽힌다.
 * 🔴 `--tk-*` 를 재정의하므로 이 스코프 안은 **현재 티커 색이 아니라 그 관련 티커 색**이다.
 */
export const RelatedScope = styled.li`
  display: grid;
  min-width: 0;

  --tk-ink: var(--tk-related-series, ${color.brandText});
  --tk-text: var(--tk-text-light, var(--tk-ink));
  --tk-solid: var(--tk-from, var(--tk-ink));

  @media (prefers-color-scheme: dark) {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }

  /* 🔴 조상 선택자는 반드시 html[...] 로 쓴다 — 근거는 accent.ts 의 AccentScope 주석과 같다. */
  html[data-theme='light'] & {
    --tk-text: var(--tk-text-light, var(--tk-ink));
  }
  html[data-theme='dark'] & {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }
`;

/** 링크가 걸린 관련 티커 카드. 캡은 **레일**이라 면으로 세어지지 않는다(6px < 8px 하한). */
export const RelatedPickCard = styled(PickCard)`
  height: 100%;
`;

/**
 * 콘텐츠 없는 관련 티커 — 데드엔드 링크 대신 **점선 카드**다(서버 렌더러와 같은 판정).
 * 점선이 "아직 페이지가 없다"를 모양으로 말한다 — 색이나 흐림으로 말하지 않는다.
 */
export const RelatedStaticCard = styled(PickCard)`
  height: 100%;
  border-style: dashed;
  background: ${color.surfaceMuted};

  &:hover {
    ${cardElevation('base')}
    border-style: dashed;
    background: ${color.surfaceMuted};
    transform: none;
  }
`;

export const RelatedSymbol = styled.span`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: var(--tk-text);
  ${font.numeric};
`;

export const RelatedKorean = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

export const RelatedRelation = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/** 페이지가 없는 티커임을 **글자로** 말하는 배지(색이 단독 채널이 되지 않게). */
export const RelatedPendingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px dashed ${color.borderStrong};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  white-space: nowrap;
`;

/**
 * 관련 티커가 하나도 없을 때의 **빈 상태**.
 *
 * 종전에는 목록이 비면 블록 자체가 사라져 페이지가 고지문으로 끝났다 — 검색 유입의 주 착지점에서
 * 가장 나쁜 마무리다. 이제 허브로 돌아가는 목적지 카드가 그 자리를 대신한다.
 */
export const RelatedEmpty = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: start;
  padding: clamp(20px, 3vw, 28px);
  border-radius: ${PICK_RADIUS};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surfaceMuted};
`;

export const RelatedEmptyText = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 격자 폭 상수                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 관련 티커 격자의 최소 열 폭.
 *
 * 300px 인 이유는 **개수**다. 관련 티커는 보통 4종이라 260px(3열)에서는 3 + 1 로 한 장이 홀로
 * 남는다. 300px 이면 본문 열(약 880px)에서 2열이 되어 2 + 2 로 떨어진다.
 */
export const RELATED_MIN_WIDTH = '300px';
