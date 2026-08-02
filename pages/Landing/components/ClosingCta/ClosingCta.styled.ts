import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, pressTransition, pressable, radius, space } from '@/shared/styles';

/**
 * 페이지를 닫는 줄.
 *
 * 히어로의 상단 4px hue 리본으로 열고 여기 2px hue 룰로 닫는다 — **같은 어휘의 수미상관**이다.
 * 새 장치를 발명한 것이 아니라 이미 있는 두께 체계를 한 단 낮춰 재사용했다.
 *
 * 🔴 **헤딩이 없다.** 여기에 h2 를 주면 문서의 h2 순서 계약(랜딩 구조 테스트)이 깨지고, "질문"도
 * "장"도 아닌 것이 목차에 들어간다. 이 줄은 마지막 액션이지 챕터가 아니다.
 */

export const ClosingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[4]};
  min-width: 0;
  padding-top: clamp(16px, 2.4vw, 24px);
  border-top: 2px solid ${color.identity};
`;

export const ClosingNote = styled.p`
  margin: 0;
  min-width: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

/**
 * S6 의 BrowserCta 와 같은 부품 어법이되 이쪽만 primary 채움이다 — 페이지의 마지막 액션이라
 * 고스트로 두면 "닫는다"는 뜻이 서지 않는다.
 *
 * 🔴 라벨 색은 반드시 onBrand 다. 흰색을 하드코딩하면 velog·sunset·ink 다크 프리셋에서 라벨이
 * 반전된다.
 * 🔴 gradientCta 는 **버튼 채움 전용**이다 - gradientAurora·gradientHero 와 교차 사용하지 않는다.
 * ⚠ flex: 0 0 auto 는 취향이 아니다 — 좁은 폭에서 전폭으로 늘어나면 틴트 면 스캐너의 하한
 * (폭 180px 이상 · 높이 8px 이상)에 걸릴 여지가 생긴다. 랜딩의 면 예산은 정확히 2개다.
 *
 * 🔴 **호버에 filter 를 걸지 마라.** brightness() 는 요소 전체에 걸려 배경만 밝히는 것이 아니라
 * 라벨까지 함께 민다 — onBrand 흰 라벨은 255 에서 잘리고 배경만 올라가 **대비가 내려간다**
 * (실측 aurora/light 4.84 → 4.46 · aurora/dark 4.62 → 4.25 · forest/dark 4.87 → 4.49, 전부 AA 미달).
 * 원인이 토큰이 아니라 CSS 필터라 contrast.test.ts 의 on-brand/cta-stop 가드가 **원리적으로 못 본다**.
 * 채움 버튼의 호버 연출은 components/common/Button 이 소유한다(배경 위치만 움직여 라벨 색을 불변으로 둔다).
 */
export const ClosingLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
  height: 44px;
  padding: 0 ${space[5]};
  border-radius: ${radius.sm};
  background: ${color.gradientCta};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.onBrand};
  text-decoration: none;
  transition: ${pressTransition};
  ${pressable}
`;
