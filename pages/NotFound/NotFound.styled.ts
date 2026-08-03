import styled from '@emotion/styled';
import { color, font, radius, sectionTitleFontSize, space } from '@/shared/styles';

/**
 * 404 화면의 스타일.
 *
 * 이 화면은 **페이지 hue 를 발행하지 않는다**(`shared/hooks/usePageHue` 의 미배정 라우트 → 폴백 brand).
 * 정체성이 없는 화면에 색을 하나 더 만들면 사용자가 "여기가 어느 섹션인가"를 잘못 배운다.
 * 그래서 히어로 크롬은 폴백색 그대로 두고, 이 파일은 **길 안내 목록**의 골격만 정한다.
 *
 * ## 2026-08-03 — 안내 카드에서 고르는 카드로
 * 예전에는 바깥 안내 카드(base) 안에 길 안내 칸(sunken)이 들어앉은 **카드 안의 카드**였다.
 * 두 겹 다 무채색이라 "여기서 고르면 화면이 바뀐다"는 신호가 어디에도 없었고, 막다른 길에 도착한
 * 사용자에게 가장 필요한 것이 바로 그 신호였다.
 *
 * 이제 목적지는 공용 `PickCard`(고르는 면)로 그린다 — 카드마다 다른 축의 **6px 레일 캡 + 40px 글리프**가
 * 서고, 카드 전체가 눌린다. 바깥 껍데기는 걷어냈다: 고르는 카드를 또 다른 카드가 감싸면 반경이 두 번
 * 겹쳐 카드가 뒤로 물러난다.
 *
 * 🔴 레일 캡(6px)을 고른 이유는 예산이다 — `tintscan` 의 면 판정은 높이 ≥8px 이라 레일은 세어지지 않는다.
 * 여기서 틴트 캡(48~88px)을 쓰면 목적지 3장이 곧바로 3면이 되어 화면당 2면 상한을 깬다.
 */

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/** 요청했던 주소를 그대로 보여 주는 줄. 무엇이 잘못됐는지는 주소가 가장 정확하게 말한다. */
export const RequestedPath = styled.code`
  display: inline-block;
  max-width: 100%;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/**
 * 길 안내 구역.
 *
 * 🔴 `section` + `aria-labelledby` 조합을 유지하라 — 접근명을 가진 `section` 만 `region` 랜드마크가
 * 되고, `test/router/notFoundRoute.test.tsx` 가 그 region 으로 범위를 좁혀 목적지 3개를 확인한다
 * (상단 내비에 같은 이름의 링크가 있어 범위를 좁히지 않으면 검사가 무의미해진다).
 */
export const DestinationSection = styled.section`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const DestinationTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/** 카드 본문의 한 줄 설명. 카드 제목이 목적지 이름을 말하고, 이 줄이 "거기서 무엇을 하는가"를 말한다. */
export const DestinationHint = styled.span`
  display: block;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;
