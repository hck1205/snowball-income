import styled from '@emotion/styled';
import { color } from '@/shared/styles';

/**
 * 셸 루트. 헤더는 공용 `AppHeader`(자체 sticky·글래스)가 소유하므로 여기서는 세로 스택과 본문 폭만 정한다.
 *
 * 🔴 구 `--tk-header-h`(헤더 높이 하드코딩)는 삭제했다. 헤더 구성이 바뀔 때마다 56 → 80 → 88px 로
 * 세 번 고쳐졌고 그때마다 목차 바가 헤더와 어긋나거나 두 번째 줄이 잘렸다. 이제 `AppHeader` 가
 * 자기 높이를 실측해 `--sb-app-header-h` 로 발행한다(`shared/styles` 의 `appHeaderHeight`).
 */
export const ShellRoot = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: ${color.text};
`;

/**
 * 🔴 **앱 공통 콘텐츠 폭 = 1200px**(2026-08-02 사용자 결정: "시뮬레이터 사이즈 기준으로 통일").
 *
 * 그전에는 이 셸만 1120px 이라 실측상 콘텐츠가 **1040px** 로 서고, 시뮬레이터·커뮤니티·헤더는
 * **1160px** 로 서서 라우트를 옮길 때마다 본문 좌우 경계가 눈에 띄게 움직였다(1280 기준).
 * 이 셸 하나가 내 포트폴리오·배당 캘린더·랜딩·ETF 허브/상세·가계부·법무·404 를 전부 덮으므로
 * 여기 한 줄이 그 전부를 맞춘다.
 *
 * ⚠ 같은 값이 `Main.shared.styled.ts`(시뮬레이터)·`CommunityLayout.styled.ts`·`AppHeader.styled.ts`
 * 에도 있다 — 넷이 같은 수여야 경계가 맞는다. 하나만 바꾸면 그 페이지만 어긋난다.
 */
export const ShellMain = styled.main`
  flex: 1 1 auto;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  /* 🔴 좌우 패딩도 시뮬레이터('FeatureLayout')와 같은 값이어야 콘텐츠 경계가 실제로 맞는다.
     max-width 만 맞추고 패딩이 40px vs 20px 로 갈리면 1280 에서 1120 vs 1160 으로 여전히 어긋난다
     (2026-08-02 실측). 세로 패딩은 이 셸의 화면들이 히어로로 시작하므로 그대로 둔다. */
  padding: clamp(20px, 4vw, 48px) clamp(12px, 2vw, 20px) 64px;
`;
