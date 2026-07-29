import styled from '@emotion/styled';
import { color, elevation as elevationToken, font, radius, sectionTitleFontSize, space } from '@/shared/styles';
import type { CardElevation, CardTone } from './Card.types';

/**
 * `tone='default'` 일 때 나오는 CSS 는 tone 도입 **이전과 완전히 같다** — 기존 카드 수십 곳의
 * 회귀를 0으로 두기 위한 조건이다. 새 값은 `sunken` 분기에만 들어간다.
 * (새 prop 은 `$` 접두 transient 로 둔다 — `$` 가 없으면 DOM 으로 새는 사고가 반복됐다.)
 */
export const CardContainer = styled.section<{ elevation: CardElevation; $tone: CardTone }>`
  background: ${({ $tone }) => ($tone === 'sunken' ? color.surfaceSunken : color.surface)};
  border: 1px solid ${color.border};
  border-radius: ${({ $tone }) => ($tone === 'sunken' ? radius.md : radius.lg)};
  padding: clamp(16px, 1.8vw, 20px);
  box-shadow: ${({ elevation, $tone }) => ($tone === 'sunken' ? 'none' : elevationToken[elevation])};
  color: ${color.text};
  min-width: 0;
  width: 100%;
  content-visibility: auto;
  contain-intrinsic-size: 280px;
  contain: layout paint style;
`;

/**
 * 카드 제목 줄. **모든 카드 헤더의 좁은 폭 대책이 여기 한 곳에 있다.**
 *
 * `flex-wrap: wrap` 이 없던 시절에는 `titleRight`(연도 셀렉트·토글 묶음 등)가 넓은 카드에서
 * 제목을 눌러 2줄로 꺾거나 자기가 잘렸다. 줄바꿈을 허용하면 안 들어가는 순간 **아랫줄로 내려가고**
 * 둘 다 온전히 보인다 — 카드마다 따로 대처하지 말고 이 규칙을 쓴다.
 */
export const CardHeader = styled.div<{ inlineTitleRight?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: ${({ inlineTitleRight }) => (inlineTitleRight ? 'flex-start' : 'space-between')};
  gap: ${space[2]};
  row-gap: ${space[2]};
  margin: 0 0 ${space[4]};
  min-height: 28px;
`;

export const CardTitleGroup = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  /* 좁은 폭에서 함께 줄어든다 — 규칙은 shared/styles 한 곳(sectionTitleFontSize)이 소유한다.
     카드마다 자기 clamp 를 쓰면 같은 화면 안에서 제목들이 서로 다른 속도로 줄어 위계가 무너진다. */
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  /* 320px에서 titleRight(라벨 달린 토글)에 밀려 제목이 2줄이 될 때, 한국어를 음절이 아니라
     어절 단위로 꺾는다. 그래도 안 맞는 긴 토큰(티커 등)은 anywhere로 넘치지 않게 끊는다. */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const CardSubtitle = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;
