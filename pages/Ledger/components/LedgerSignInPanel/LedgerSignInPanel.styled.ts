import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 앱 로그인 게이트.
 *
 * ## 무대와 어떻게 다른가 (2026-08-03)
 * 연결 무대(`LedgerConnectPanel`)는 네이비 반전 면이고 여기는 **밝은 중립 면**이다. 일부러 가른다 —
 * 두 화면은 사용자가 연달아 보는 두 관문인데 같은 무게로 서면 "로그인했는데 왜 또?"라는 이 화면의
 * 가장 큰 혼란이 더 커진다. 신원 확인(여기)은 가볍게 지나가고, 시트 권한(무대)이 무겁게 선다.
 *
 * 예전 구조는 제목 + 문장 + 버튼 세 개의 민짜 스택이었다. 지금은 **글리프 배지 + 큰 제목 + 문장**의
 * 카드 한 장이고, 제공자 버튼은 그 안에서 자기 블록을 갖는다.
 */
export const SignInSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  max-width: 560px;
  /* 🔴 카드 자체는 가운데(2026-08-08 사용자 지시). 이 화면에는 이 카드 하나뿐이라 왼쪽에 붙어
     있으면 넓은 화면에서 오른쪽이 통째로 빈다. */
  margin-inline: auto;
  padding: clamp(24px, 4vw, 36px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};
`;

/**
 * 카드 **안쪽 열** — 제목·문장·버튼이 전부 여기 산다.
 *
 * 🔴 이 열이 있는 이유는 하나다: **세 요소의 왼쪽 시작점을 맞추는 것**(2026-08-08 사용자 지시).
 *    카드는 가운데지만 글은 왼쪽에서 시작해야 읽히고, 그 왼쪽이 로그인 버튼의 왼쪽과 어긋나면
 *    같은 카드 안에서 기준선이 둘이 된다. 열 하나로 묶으면 어긋날 자리가 없다.
 *
 * ⚠ 그래서 폭 상한은 **버튼과 같은 값**이다. 여기와 SignInButtons 가 다른 값을 가지면 그 즉시
 *   시작점이 갈린다 — 버튼 쪽 max-width 를 지운 것이 그 때문이다.
 */
export const SignInColumn = styled.div`
  display: grid;
  gap: ${space[4]};
  width: 100%;
  min-width: 0;
  text-align: left;

  ${media.up('mobileWide')} {
    max-width: 380px;
    margin-inline: auto;
  }
`;

/**
 * 제목 + 배지 한 줄. 🔴 배지가 **제목 오른쪽**에 선다(2026-08-08 사용자 지시).
 *
 * 왜 한 줄로 묶었나: 배지를 제목 위 독립 블록으로 두면 세로 스택이 넷(배지·제목·문장·버튼)이 되어
 * 관문치고 길어진다. 한 줄로 접으면 "무엇을 하는 화면인가"가 한 눈높이에서 읽힌다.
 *
 * ⚠ 줄바꿈을 허용하지 않는다 — 배지가 아래로 접히면 오른쪽에 있다는 사실 자체가 사라진다.
 *   대신 배지가 `flex: none` 이라 좁아져도 찌그러지지 않고, 제목이 먼저 줄바꿈한다.
 */
export const SignInHeadRow = styled.div`
  display: flex;
  align-items: center;
  /* 제목은 왼쪽, 배지는 **열의 오른쪽 끝**. 둘 사이가 벌어져도 각자의 기준선은 흔들리지 않는다. */
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

/** 신원 확인임을 형태로 말하는 배지. 폭 48px 이라 면 예산과 무관하다. */
export const SignInGlyph = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${radius.md};
  border: 1px solid ${color.identityBorder};
  color: ${color.identityText};
`;

export const SignInHeading = styled.h2`
  margin: 0;
  max-width: 20ch;
  font-size: clamp(${font.size.xl}, 2.8vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/** 설명문. 한글 산문이라 overflow-wrap 을 건드리지 않는다(줄바꿈은 브라우저 기본에 맡긴다). */
export const SignInBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.md};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 제공자 버튼 스택. 버튼 자체는 공용 `SocialLoginButton`(3사 규정색·로고·정본 카피)이라
 * 여기서 색·라벨을 다시 정의하지 않는다 — 규정 준수의 단일 출처를 쪼개지 않는다.
 *
 * 위에 가로선을 하나 두어 "설명은 여기까지, 아래가 고르는 자리"를 형태로 가른다.
 */
export const SignInButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  width: 100%;
  min-width: 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
`;
