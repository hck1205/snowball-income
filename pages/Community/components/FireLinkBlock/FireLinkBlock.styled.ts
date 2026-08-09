import styled from '@emotion/styled';
import { DATA_RADIUS, color, elevation, font, radius, space } from '@/shared/styles';

export const Frame = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  min-width: 0;
`;

/**
 * 썸네일 자리.
 *
 * ⚠ 16:9 를 비율로 잡는다 — 유튜브 썸네일이 그 비율이고, 높이를 px 로 고정하면 폭에 따라
 *   위아래가 잘린다.
 */
export const Thumb = styled.div`
  /* 재생 버튼이 이 안에 절대배치로 뜬다 — 기준을 여기서 만든다. */
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

/**
 * 재생 프레임 — 썸네일 자리와 **같은 비율**이라 켤 때 레이아웃이 튀지 않는다.
 */
export const Player = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

/**
 * 재생 버튼 — 썸네일 위에 뜬다.
 *
 * ⚠ 썸네일 `<img>` 는 장식이라 이름이 없다(제목이 바로 아래 있다). 그래서 **이 버튼이**
 *   접근명을 진다(`aria-label`) — 없으면 스크린리더에게 이 자리는 이름 없는 버튼이다.
 */
export const PlayButton = styled.button`
  position: absolute;
  inset: 0;
  margin: auto;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  /* ⚠ 하드코딩 그림자를 쓰지 않는다 — 다크 테마를 따라가지 못한다(test/shared/depthTokens). */
  box-shadow: ${elevation[2]};

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 3px;
  }
`;

export const Source = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

export const Title = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: 1.4;
  color: ${color.text};
`;

/** 원본으로 나가는 유일한 길. 카드가 아니라 여기 하나가 그 일을 진다. */
export const GoLink = styled.a`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.accentBorder};
  border-radius: ${radius.pill};
  background: ${color.accentSubtle};
  text-decoration: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.accentText};

  &:hover {
    background: ${color.surfaceHover};
  }
`;
