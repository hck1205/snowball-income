import styled from '@emotion/styled';
import { cardElevation, color, font, outerRadius, radius, sectionTitleFontSize, space } from '@/shared/styles';
import type { SurfaceTier } from '@/shared/styles';
import type { CardTone } from './Card.types';

/**
 * 공용 `Card` 의 패딩. **여기가 단일 원천이다** — 아래 바깥 반경이 이 값에서 역산되므로
 * 다른 곳에서 카드 패딩을 따로 적으면 동심이 조용히 어긋난다.
 */
const CARD_PADDING = 'clamp(16px, 1.8vw, 20px)';

/**
 * 바깥 면(카드)의 반경 = **안쪽 컨트롤(8px) + 카드 패딩**(DESIGN.md §6 동심 라운드).
 *
 * 왜 상수 28px 이 아닌가: 패딩이 `clamp(16px, 1.8vw, 20px)` 라 폭마다 달라서, 28px 은 패딩이
 * 20px 로 포화되는 폭(≈1111px 이상)에서만 동심이다 — 390px 에서는 24px 이어야 맞다.
 * `calc()` 만이 모든 폭에서 성립한다(`surfaces.ts` 가 `calc()` 를 쓰는 바로 그 이유).
 *
 * 자식(Button·InputField 8px · StatTile·sunken 12px)의 반경은 **바꾸지 않는다** — 이 결정은
 * "바깥을 키운다"이지 "속을 낮춘다"가 아니다.
 */
const CARD_RADIUS = outerRadius(radius.sm, CARD_PADDING);

/**
 * tone → 면의 격. `wash` 는 **본문 카드의 장식 변형**이라 위계상 `base` 이고 배경만 다르다.
 * (3단의 정의와 "테두리·그림자 동시 선언 금지" 규칙은 `shared/styles/surfaces.ts` 가 소유한다.)
 */
const TIER_BY_TONE: Record<CardTone, SurfaceTier> = {
  default: 'base',
  raised: 'raised',
  sunken: 'sunken',
  wash: 'base'
};

/**
 * 위계 선언(배경·테두리·그림자)은 **`cardElevation` 한 곳에서만** 나온다 — 여기서 개별 속성을
 * 다시 적으면 "테두리와 그림자를 동시에 갖는 카드"가 조용히 되살아난다.
 *
 * (transient prop 은 `$` 접두로 둔다 — `$` 가 없으면 DOM 으로 새는 사고가 반복됐다.)
 */
export const CardContainer = styled.section<{ $tone: CardTone }>`
  ${({ $tone }) => cardElevation(TIER_BY_TONE[$tone])}
  /*
   * wash = 장식 표면(빈 상태·프로모·CTA). 위계는 본문 카드와 같고 **면색만** 바꾼다.
   * gradient-hero-soft 를 그대로 쓴다 — 히어로와 같은 어휘라 화면이 따로 놀지 않고,
   * **이미 8프리셋 × 라이트/다크 대비 검증을 통과한 값**이다(contrast.test.ts 의 HERO_GRADIENTS).
   */
  ${({ $tone }) => ($tone === 'wash' ? `background: ${color.gradientHeroSoft};` : '')}
  /*
   * sunken 은 '가라앉은 면' = 카드 위에 얹힌 **자식** 면이라 StatTile 과 같은 조(tile, 12px)로
   * 묶는다. 바깥 면만 패딩에서 역산한 큰 반경을 갖는다(위 CARD_RADIUS 주석).
   */
  border-radius: ${({ $tone }) => ($tone === 'sunken' ? radius.md : CARD_RADIUS)};
  padding: ${CARD_PADDING};
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
