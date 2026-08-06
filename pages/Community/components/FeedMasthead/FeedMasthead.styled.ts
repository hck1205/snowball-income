import styled from '@emotion/styled';
import {
  PICK_RADIUS,
  brandPanel,
  color,
  font,
  heroTitleFontSize,
  hitArea,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

/**
 * 커뮤니티 목록 두 화면(갤러리·게시판)의 **머리 면**.
 *
 * 지금까지 두 목록은 머리가 없었다 — 갤러리는 검색줄부터, 게시판은 h1 한 줄부터 시작해
 * "이 화면이 무엇인가"를 아무것도 말하지 않았고, 그 결과 두 화면이 같은 회색 목록으로 보였다.
 *
 * 반전 네이비 면(brandPanel)을 쓰는 이유는 둘이다.
 * 1) 목록은 **고르는 지면**(brand)이다 — 카드/행을 눌러 화면이 바뀐다. 반전 면은 그 성격을
 *    한 번에 말하고, 아래로 이어지는 밝은 카드 격자와 명도 대비를 만든다.
 * 2) 금색(onPanelGold)이 합법인 유일한 조합이 이 면이다. 소제목 금색·모서리 금색 링이
 *    여기서만 살 수 있고, 그것이 이 앱 안에서 "브랜드가 직접 말하는 자리"의 표식이 된다.
 *
 * ⚠ 이 면은 `tintscan` 이 **면 1개로 센다.** 목록 화면의 색면 예산은 여기서 1을 쓰고,
 *   나머지 1은 빈 상태 패널(FeedStates)이 상호배타적으로 쓴다 — 카드·행은 6px 레일과
 *   중립 면만 쓰므로 예산을 먹지 않는다.
 */
/*
 * ⚠ `header` 가 아니라 `section` 이다. `header` 는 접근성 트리에서 **banner 랜드마크**로 잡히고
 *   (테스트 도구의 역할 계산은 article/section 안이라는 예외를 적용하지 않는다), 그러면 앱 헤더와
 *   목록 머리 면이 같은 랜드마크로 두 개가 된다 — 스크린리더 사용자가 "머리말"을 두 번 만난다.
 *   이 면은 페이지의 소개 블록이지 사이트의 머리말이 아니다.
 */
export const MastheadRoot = styled.section`
  ${brandPanel()}
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  /* 하마 자리를 걷었으므로 한 칸이다 — 빈 auto 칸을 남기면 오른쪽에 이유 없는 여백이 생긴다. */
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: clamp(${space[4]}, 3vw, ${space[10]});
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[6]}, 3.2vw, ${space[10]}) clamp(${space[5]}, 3.2vw, ${space[10]});
  margin-bottom: clamp(${space[5]}, 2.4vw, ${space[8]});

  /*
   * 🔴 장식 원 두 개(금색 링)를 걷어냈다(2026-08-03 사용자 지시).
   * 이 면은 이미 네이비 패널이라 브랜드가 충분히 말하고 있고, 링은 그 위에 얹힌 두 번째 발화였다.
   * ⚠ 되살리지 마라 — 되살릴 거면 isolation · z-index -1 · overflow hidden 세 줄이 함께 필요하다
   *   (링이 패널 밖으로 새지 않게 잡던 장치다).
   * ⚠ 이 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊겨 앱이 부팅하지 않는다(방금 겪었다).
   */
`;

export const MastheadBody = styled.div`
  min-width: 0;
`;

/** 금색 소제목 + 금색 짧은 선. 색만으로 말하지 않도록 낱말이 축 이름을 그대로 갖는다. */
export const MastheadEyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
  margin: 0 0 ${space[3]};
  color: ${color.onPanelGold};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.16em;

  &::after {
    content: '';
    width: 32px;
    height: 1px;
    background: ${color.onPanelGold};
  }
`;

/**
 * 화면 이름 — 이 목록에서 가장 큰 글자다.
 * 히어로 스케일(`heroTitleFontSize`, 20~30px)을 쓰는 이유: 카드 제목이 16~20px 이라
 * 그 대역을 확실히 넘어서야 "제목 → 카드"의 위계가 한눈에 선다.
 */
export const MastheadTitle = styled.h1`
  margin: 0;
  color: ${color.onPanel};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

export const MastheadLead = styled.p`
  margin: ${space[3]} 0 0;
  max-width: 48ch;
  color: ${color.onPanelMuted};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

/**
 * 반전 면 위의 주 행동.
 *
 * 공용 `Button variant="primary"`(brand 채움)를 쓰지 않는 이유는 대비다 — brand 면색은
 * 8프리셋 × 라이트/다크에서 **밝은 배경 위 기준**으로만 검증돼 있고, 네이비 위에서의
 * 경계 대비(3:1)는 검증 밖이다. 반대로 onPanel/panel 쌍은 **16.24:1 로 실측된 값**이라
 * 어느 프리셋에서도 안전하다. 반전 면 위에서는 반전 버튼을 쓴다.
 */
export const MastheadAction = styled.button`
  ${hitArea()}
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 44px;
  margin-top: clamp(${space[5]}, 2vw, ${space[6]});
  padding: 0 ${space[6]};
  border: 0;
  border-radius: ${radius.pill};
  background: ${color.onPanel};
  color: ${color.panel};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    opacity ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    opacity: 0.88;
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid ${color.onPanelGold};
    outline-offset: 3px;
  }

  svg {
    flex: 0 0 auto;
  }
`;

/**
 * 마스코트 자리 — 브랜드 면에만 산다(데이터 면 금지).
 * 좁은 폭에서는 지운다: 글자 폭을 뺏는 순간 제목이 세 줄로 무너진다.
 */
export const MastheadMark = styled.div`
  display: grid;
  place-items: center;
  color: ${color.onPanel};

  ${media.down('tabletSm')} {
    display: none;
  }
`;
