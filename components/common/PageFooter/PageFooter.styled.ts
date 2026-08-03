import styled from '@emotion/styled';
import { PICK_RADIUS, brandPanel, color, font, iconOpticalAlign, space, surface } from '@/shared/styles';

/**
 * 공용 페이지 푸터 — **브랜드 패널**.
 *
 * 앞서 이 앱에는 푸터가 **네 벌**로 흩어져 있었다: 시뮬레이터의 `LandingDisclaimer`(가운데 정렬 문단),
 * 내 포트폴리오와 배당 캘린더의 `FootNoteCard`(좌측 2px 레일 + 각주 줄), 그리고 티커 허브는 아예
 * 아무것도 없었다. 같은 성격의 고지가 화면마다 다른 자리·다른 모양으로 나오면 사용자는 그것을
 * "이 화면에만 붙은 특별한 경고"로 읽는다. 2026-07-28 에 한 벌로 합쳤고, 그때 고른 모양은
 * **중립 면 + 좌측 2px 레일**이었다 — 본문 흐름에서 튀지 않는 각주 카드였다.
 *
 * ## 2026-08-03 — 각주 카드에서 브랜드 패널로
 * 그 모양의 문제는 "튀지 않는다"가 곧 **브랜드가 어디에도 서지 않는다**였다는 점이다. 이 앱의 심볼은
 * 금화를 문 하마인데 라이트 테마의 제품 화면에는 금색이 **한 픽셀도** 없었다. 금색은 밝은 면 위에서
 * 1.83:1 로 죽기 때문에(2026-08-03 실측) 갈 곳이 네이비 패널 위뿐이고, 그 패널이 합법적으로 설 수 있는
 * 자리는 세 곳(마무리 CTA · 이 푸터 · 공유 카드)뿐이다.
 *
 * 그중 **매 화면 하단에 서는 것은 이 푸터 하나**다. 그래서 여기가 브랜드가 전 화면에서 한 번씩
 * 말하는 자리가 된다 — 각주를 읽히게 하는 일과 충돌하지 않는다(패널 위 대비는 아래 표대로 전부 AA).
 *
 * ```
 *   on-panel        흰 글자 / panel   16.24:1  ✅ 공통 고지·브랜드명
 *   on-panel-gold   금색    / panel    8.86:1  ✅ 심볼·법무 링크·1px 선
 *   on-panel-muted  연보라  / panel    8.20:1  ✅ 각주
 * ```
 *
 * 🔴 **금색을 이 패널 밖으로 꺼내지 마라.** 범용 `gold` 토큰은 일부러 존재하지 않고,
 * `shared/styles/contrast.test.ts` 가 그 사용을 잡는다.
 *
 * ⚠ 기하는 **카드**다(전폭 직각 띠가 아니다). 이 푸터는 페이지 스택의 마지막 형제로 들어가며
 * 좌우 여백을 부모가 이미 갖고 있어서, 직각 띠로 만들면 본문만 안쪽으로 들어간 어색한 면이 된다.
 * 반경은 `PICK_RADIUS`(brand 면의 반경)를 쓴다 — 이 면은 "읽는 면"이 아니라 브랜드가 말하는 면이다.
 */
export const FooterRoot = styled.footer`
  display: grid;
  gap: ${space[4]};
  margin: 0;
  ${surface(PICK_RADIUS, 'clamp(18px, 2.6vw, 26px)')}
  ${brandPanel()}
`;

/**
 * 브랜드 줄 — 심볼 + 워드마크 | 법무 링크.
 *
 * 법무 링크를 **여기 위로 올렸다.** 예전에는 각주·고지 아래 마지막 줄이었는데, 그 자리는 텍스트가
 * 길어질수록 아래로 밀려 화면 밖으로 나간다. 개인정보처리방침·이용약관은 구글 OAuth 심사가 실제로
 * 여는 주소이자 이 앱의 **유일한 상시 진입점**이라, 푸터 안에서도 먼저 보이는 자리에 둔다.
 * (읽는 순서는 그대로 유지된다 — 각주와 고지가 그 아래로 이어진다.)
 */
export const FooterMasthead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]} ${space[4]};
`;

/**
 * 워드마크. 🔴 **링크가 아니다** — 브랜드 링크는 헤더 워드마크 하나뿐이라는 계약이 있고
 * (`test/community/PrimaryNav.test.tsx`), 같은 이름의 링크가 둘이 되면 그 계약이 모호해진다.
 * 여기서는 "이 패널이 누구인가"만 말한다.
 */
export const BrandMark = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.onPanel};
`;

/**
 * 하마 심볼. 금색은 이 패널 위에서만 합법이고(8.86:1), 워드마크 텍스트가 바로 옆에서 이름을
 * 말하므로 그림 자체는 장식이다(`BrandGlyph` 기본값 = `aria-hidden`).
 *
 * 세로 정렬은 `iconOpticalAlign('display', …)` 이 잡는다 — `font.display`(원본 Gmarket Sans)는
 * 잉크 중심이 라인박스 중심보다 **0.100em 위**라, 보정 없이 `align-items: center` 만 쓰면
 * 심볼이 글자보다 아래로 앉아 보인다(이 레포에서 반복 재발한 결함이다).
 */
export const BrandSymbol = styled.span`
  display: inline-flex;
  color: ${color.onPanelGold};
  ${iconOpticalAlign('display', font.size.xl)}
`;

/**
 * 브랜드 줄과 본문(각주·고지)을 가르는 금색 헤어라인.
 *
 * 높이 1px 이라 `tintscan` 의 면 판정(높이 ≥8px)에 걸리지 않는다 — 색을 예산 없이 쓸 수 있는
 * L1 자리다. 왼쪽에서 오른쪽으로 사라지게 두어 선이 화면을 가로로 자르지 않게 한다.
 */
export const PanelRule = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, ${color.onPanelGold} 70%, transparent),
    color-mix(in srgb, ${color.onPanelGold} 18%, transparent) 55%,
    transparent
  );
`;

export const NotesGroup = styled.div`
  display: grid;
  gap: ${space[1]};
`;

export const NotesTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.onPanel};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.onPanelMuted};
`;

/**
 * 전 화면 공통 고지. 접힘·닫기 없이 항상 읽힌다(aria-hidden 금지).
 * 각주(`onPanelMuted`)보다 한 단계 진하게 둔다 — 법적 성격이 있어 먼저 읽혀야 한다
 * (구 `LandingDisclaimer` 가 `textSecondary` / `textMuted` 로 세워 둔 위계를 패널 위로 그대로 옮긴 것).
 */
export const SiteNotice = styled.p`
  margin: 0;
  max-width: 78ch;
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.onPanel};
`;

/**
 * 법무 문서 링크 줄(개인정보처리방침·이용약관).
 *
 * 🔴 `href` 는 계약이다 — `PageFooter.test.ts` 가 `/privacy`·`/terms` 를 잠근다.
 *
 * 링크 밑줄은 남긴다. 금색은 이 패널에서 "누를 수 있는 것"의 색이지만, 색만으로 링크를 구분하면
 * 색각 이상 사용자가 구분하지 못한다(WCAG 1.4.1). 밑줄이 두 번째 채널이다.
 */
export const LegalLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[4]};
`;

export const LegalLink = styled.a`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.onPanelGold};
  text-underline-offset: 3px;

  &:hover {
    color: ${color.onPanel};
  }
`;
