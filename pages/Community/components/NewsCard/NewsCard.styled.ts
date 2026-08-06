import styled from '@emotion/styled';
import { DATA_RADIUS, cardElevation, color, font, media, motion, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 미디어 뉴스 카드 — **바깥 글로 가는 링크가 본체**인 카드.
 *
 * 🔴 이 카드의 주역은 우리 글이 아니라 **원문**이다. 그래서 가장 큰 자리를 썸네일과 원문 제목이
 * 갖고, 공유한 사람과 반응 수는 맨 아래 한 줄로 물러난다. 반대로 두면 "우리가 쓴 글"로 읽힌다.
 * 🔴 카드 전체가 원문으로 가는 링크다(`a[target=_blank]`). 안에 또 다른 링크를 넣지 마라 —
 *   중첩 링크는 유효하지 않은 DOM 이고, 눌러도 어디로 갈지 사용자가 예측할 수 없다.
 * -------------------------------------------------------------------------- */

export const CardList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: ${space[5]} 0 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CardRoot = styled.a`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-width: 0;
  border-radius: ${DATA_RADIUS};
  /* 🔴 반경 안에서 썸네일을 자르는 유일한 장치다 — 지우면 사진 모서리가 카드 밖으로 직진한다. */
  overflow: hidden;
  ${cardElevation('base')}
  color: ${color.text};
  text-decoration: none;
  transition:
    border-color ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover,
    &:focus-visible {
      transform: none;
    }
  }
`;

/**
 * 썸네일 자리. **비율을 고정한다**(16:9) — 원본 크기가 제각각이라 고정하지 않으면 카드마다
 * 높이가 달라 격자가 어긋난다. 그림이 없는 글도 있으므로 이 자리는 통째로 사라질 수 있다.
 */
export const Thumb = styled.span`
  display: block;
  position: relative;
  aspect-ratio: 16 / 9;
  background: ${color.surfaceMuted};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const Body = styled.span`
  display: grid;
  gap: ${space[2]};
  align-content: start;
  padding: ${space[4]};
  min-width: 0;
`;

/** 출처 도메인 — 어디서 온 글인지가 제목보다 **먼저** 읽혀야 신뢰가 선다. */
export const Source = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 원문 제목. 두 줄에서 자른다 — 세 줄이면 카드 높이가 제목 길이에 끌려다닌다.
 * ⚠ 우리가 고쳐 쓴 문장이 아니라 **원문 제목 그대로**다(NewsPayload 주석).
 */
export const Title = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

export const Summary = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/** 공유한 사람이 붙인 한 줄. 원문 요약과 **구분되어야 한다** — 왼쪽 레일이 그 일을 한다. */
export const Note = styled.span`
  display: block;
  padding-left: ${space[3]};
  border-left: 2px solid ${color.borderStrong};
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/** 맨 아랫줄 — 공유한 사람 · 좋아요 · 댓글. 카드의 주역이 아니라서 작고 조용하다. */
export const Foot = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  padding: ${space[3]} ${space[4]};
  border-top: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
`;

export const FootAuthor = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FootAvatar = styled.img`
  width: 18px;
  height: 18px;
  border-radius: ${radius.pill};
  object-fit: cover;
  background: ${color.surfaceMuted};
`;

export const FootStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  ${font.numeric};
`;

/** 오른쪽 끝의 "원문 보기" — 새 창으로 나간다는 사실을 낱말이 진다. */
export const FootLink = styled.span`
  margin-left: auto;
  color: ${color.brandText};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;
