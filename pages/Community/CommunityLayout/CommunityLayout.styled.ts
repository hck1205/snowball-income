import styled from '@emotion/styled';
import { color, font, radius, space, zIndex } from '@/shared/styles';

/**
 * 🔴 세로 스택 + 100dvh 다(구 `min-height: 100vh` 단독 아님).
 * 푸터를 붙이면서 필요해졌다 — 내용이 짧은 화면(프로필·내 글 0건 등)에서 루트가 내용 높이로
 * 줄면 푸터가 **화면 중간에** 뜬다(티커 셸이 2026-08-03 에 같은 신고를 받았다:
 * `TickerPageShell.styled.ts` ShellRoot 주석). dvh 는 모바일 주소창이 접히고 펴질 때 vh 가
 * 튀는 것을 피한다.
 * ⚠ 이 값만으로는 부족하다 — 본문(`CommunityMain`)이 남는 공간을 먹어야(flex: 1) 푸터가 바닥에 붙는다.
 */
export const LayoutRoot = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${color.bg};
  color: ${color.text};
`;

export const SkipLink = styled.a`
  position: fixed;
  top: -100px;
  left: ${space[3]};
  z-index: ${zIndex.skipLink};
  padding: ${space[2]} ${space[4]};
  border-radius: ${radius.sm};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  transition: top 150ms ease;

  &:focus {
    top: ${space[3]};
  }
`;

export const CommunityMain = styled.main`
  /* 🔴 flex:1 이 있어야 푸터가 바닥에 붙고, width:100% 가 있어야 본문이 쪼그라들지 않는다 —
     세로 flex 컨테이너에서 margin:0 auto 는 cross-axis stretch 를 꺼 버려서, 폭을 명시하지
     않으면 main 이 **내용 폭**으로 줄어든다(커뮤니티 전 화면 레이아웃 붕괴).
     검증된 형태는 TickerPageShell.styled.ts 의 ShellMain 이다. */
  flex: 1 1 auto;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  /* 🔴 세로 시작 여백은 TickerPageShell 의 ShellMain · 시뮬레이터 FeatureLayout 과 **같은 값이어야 한다**
     (2026-08-02 실측: 이 값이 clamp(16px,3vw,24px) 이던 동안 1280 에서 본문 시작이 89px 대 113px 로
     갈려 커뮤니티만 24px 위에서 시작했다). 라우트를 옮길 때 본문 시작선이 튀면 안 된다. */
  padding: clamp(${space[5]}, 4vw, ${space[12]}) clamp(${space[3]}, 4vw, ${space[5]}) ${space[16]};
`;
