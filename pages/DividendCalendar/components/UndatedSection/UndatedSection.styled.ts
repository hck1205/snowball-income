import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 점선이 "확정되지 않음"을 형태로 말하고, 액센트-Alt 색은 **테두리·아이콘·개수 배지**에만 남긴다.
 * 패널 자체는 아젠다와 같은 밝은 표면이다 — 감싸는 `DetailCard`가 브랜드 틴트라
 * 안쪽까지 틴트면 틴트 위에 틴트가 겹쳐 구역 구분이 무너진다(사용자 정정 2026-07-25).
 * 대비 검증 쌍만 사용: text·text-secondary/surface-raised, accent-alt-text/accent-alt-subtle.
 */
/* 평탄화(2026-07-26): 자체 패널을 벗는다 — 박스는 DetailCard 하나뿐. "확정되지 않음"의 점선은
   개별 칩이 계속 말한다. */
export const UndatedRoot = styled.section`
  display: grid;
  gap: ${space[2]};
`;

export const UndatedHeading = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  svg {
    flex: 0 0 auto;
    color: ${color.accentAltText};
  }
`;

export const UndatedCount = styled.span`
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.accentAltSubtle};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  color: ${color.accentAltText};
  ${font.numeric}
`;

export const UndatedHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

export const UndatedList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/**
 * 한 종목 = 점선 칩. 날짜 칸에 놓을 수 없다는 사실이 모양에서도 읽힌다.
 *
 * 면은 침강면이다 — 이 칩은 흰 카드 위에 앉는데 구 `surfaceMuted` 는 그 위에서 1.03:1 이라
 * 칩이 "면 없는 점선 테두리"가 됐다. 아래 `UndatedDot` 의 링 색도 **반드시 같이** 따라간다
 * (링은 칩 배경을 흉내 내 점을 도려내는 장치라, 색이 갈리면 점 둘레에 밝은 후광이 생긴다).
 */
export const UndatedItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  padding: ${space[1]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.accentAltBorder};
  }
`;

/** 달력 칩·아젠다와 같은 티커 시리즈 색 점(장식, aria-hidden). */
export const UndatedDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  /* 링은 점이 놓인 칩의 배경색과 같아야 또렷하다. */
  box-shadow: 0 0 0 2px ${color.surfaceSunken};
`;

/** 아젠다와 같은 고정폭 티커 열 — 칩이 나란히 놓여도 배지 시작선이 흔들리지 않는다. */
export const UndatedTicker = styled.span`
  flex: 0 0 6ch;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const UndatedName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
