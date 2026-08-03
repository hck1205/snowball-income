import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK,
  PICK_RADIUS,
  brandPanel,
  color,
  font,
  media,
  motion,
  pressTransition,
  pressableSubtle,
  radius,
  space
} from '@/shared/styles';

/**
 * 문서 끝의 **나가는 길**. 이 화면에서 유일하게 색을 크게 쓰는 자리다.
 *
 * 왜 여기인가 — 법무 문서는 처음부터 끝까지 "읽는 면"이라 채도를 넣을 데가 없다(넣으면 조문의
 * 신뢰감이 깎인다). 그런데 다 읽고 난 **마지막 한 화면**은 읽는 면이 아니라 **고르는 면**이다:
 * 형제 문서로 갈지, 앱으로 돌아갈지, 처음부터 다시 볼지. 그래서 여기만 `brandPanel()`(네이비 반전)을
 * 쓰고, 이 앱에서 금색이 합법인 유일한 면이므로 강조도 금색으로 낸다.
 *
 * 🔴 색 예산: **이 패널 하나 = 1/2** 다(2026-08-03 실측, tintscan `/privacy`·`/terms` 1280·390 모두 1개).
 *    히어로가 파스텔 램프에서 흰 면이 되면서 한 장이 풀렸지만 **그 여유를 여기서 쓰지 않는다** —
 *    흰 캔버스의 이득은 절제에서 나오고(`shared/styles/surfaces.ts` 머리말), 조문을 열네 절 읽고
 *    내려온 사람에게 색 면이 둘이면 어느 쪽이 "나가는 길"인지 갈린다. 안쪽 링크들이 배경 없이
 *    테두리만 갖는 것도 같은 이유다(투명 배경은 tintscan 의 중립 집합이라 세어지지 않는다).
 */

export const ExitRoot = styled.section`
  display: grid;
  gap: clamp(16px, 2.4vw, 22px);
  margin-top: clamp(40px, 6vw, 72px);
  padding: clamp(24px, 4vw, 36px);
  border-radius: ${PICK_RADIUS};
  ${brandPanel()}
`;

export const ExitHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const ExitGlyph = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: ${radius.lg};
  border: 1px solid color-mix(in srgb, ${color.onPanelGold} 32%, transparent);
`;

export const ExitHeading = styled.h2`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size.lg}, 2vw, ${font.size['2xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.onPanel};
  word-break: keep-all;
`;

export const ExitLede = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.onPanelMuted};
  word-break: keep-all;
`;

export const ExitList = styled.div`
  display: grid;
  gap: ${space[3]};

  ${media.up('mobile')} {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
`;

/**
 * 링크 한 장. 배경 없이 테두리와 부상만으로 "누를 수 있음"을 말한다(위 색 예산 주석 참고).
 * 누름 피드백은 공용 pressableSubtle 을 쓴다 — 폭이 넓은 면이라 0.96 을 주면 패널이 출렁인다.
 */
const exitTileStyle = `
  display: grid;
  gap: 4px;
  align-content: start;
  padding: ${PICK.pad};
  border-radius: ${radius.lg};
  border: 1px solid color-mix(in srgb, ${color.onPanelMuted} 42%, transparent);
  text-align: left;
  text-decoration: none;
  color: ${color.onPanel};
  background: transparent;
  /* 🔴 pressTransition 을 직접 끼운다 — 누름 믹스인이 transition 을 선언하지 않으므로, 소비처가
     자기 목록만 적으면 scale 전환이 즉시 튄다(가드: test/shared/pressTransition.test.ts). */
  transition: border-color ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover {
    border-color: color-mix(in srgb, ${color.onPanelGold} 70%, transparent);
    transform: translateY(-2px);
  }

  ${pressableSubtle}
`;

export const ExitTileLink = styled(Link)`
  ${exitTileStyle}
`;

export const ExitTileButton = styled.button`
  ${exitTileStyle}
  font: inherit;
  cursor: pointer;
`;

/** 무엇으로 가는지. 금색은 네이비 위에서만 합법이고, 이 패널이 그 자리다. */
export const ExitTileKicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.1em;
  color: ${color.onPanelGold};
`;

export const ExitTileTitle = styled.span`
  font-family: ${font.display};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.onPanel};
`;

export const ExitTileSummary = styled.span`
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.onPanelMuted};
  word-break: keep-all;
`;
