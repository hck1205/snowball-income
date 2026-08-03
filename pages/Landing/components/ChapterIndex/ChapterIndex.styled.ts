import styled from '@emotion/styled';
import { color, font, media, motion, pageHue, space } from '@/shared/styles';

/**
 * 히어로 바로 아래의 **차례** — 여섯 장으로 가는 앵커 목록.
 *
 * ## 형태 판단: 알약 칩이 아니라 **인덱스 행**이다
 * 칩 여섯 개를 늘어놓으면 앱의 필터 바처럼 읽힌다(이 지면에는 필터가 없다). 대신 각 항목이
 * 자기 **상단 2px 룰**과 **번호**를 갖는 행으로 서고, 3열 격자로 배열된다 — 책의 차례 조판이다.
 * 밑에 이어지는 여섯 장의 머리(전폭 룰 + 번호 + 제목)와 **같은 어휘**라, 차례를 본 사람은 장에
 * 도착했을 때 같은 모양을 다시 만난다.
 *
 * 🔴 면을 만들지 않는다. 랜딩의 틴트 면 2개(마무리 CTA · 푸터 패널)는 이미 임자가 있다 —
 * 여기서 쓰는 색은 hover 시 번호에 얹히는 페이지 hue 하나뿐이고, 그건 텍스트 색이라 스캐너 밖이다.
 */

export const IndexRoot = styled.nav`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 눈썹 문구. **헤딩이 아니다** — 여섯 장의 h2 사이에 일곱 번째 제목을 끼우면 문서 개요에서
 * 차례가 장과 같은 급이 된다(그리고 히어로 묶음 안 h2 는 구조 테스트가 금지한다).
 */
export const IndexEyebrow = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.textMuted};
`;

export const IndexList = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 clamp(16px, 2.4vw, 32px);
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.down('tablet')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* 1열이 되면 여섯 행이 세로로 쌓인다 — 데스크톱의 두 줄짜리 조판이 모바일에서는 여섯 줄이므로
     행 높이를 조인다(터치 타깃 44px 은 IndexLink 의 min-height 가 지킨다). */
  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);

    a {
      padding: ${space[2]} 0;
    }
  }
`;

export const IndexItem = styled.li`
  min-width: 0;
`;

/**
 * 한 행. 터치 타깃 44px 을 패딩이 아니라 `min-height` 로 못 박는다(패딩만으로는 두 줄 라벨에서
 * 값이 흔들린다). 상단 룰은 hover 에서 페이지 hue 로 바뀐다 — 색이 유일한 신호가 아니다:
 * 같은 순간 라벨이 진해지고 번호가 hue 를 받는다.
 */
export const IndexLink = styled.a`
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  min-height: 44px;
  padding: ${space[4]} 0;
  border-top: 2px solid ${color.border};
  text-decoration: none;
  color: ${color.textSecondary};
  transition: border-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    border-top-color: ${pageHue};
    color: ${color.text};
  }
`;

/** 장 번호. 장 머리(SectionOrdinal)와 같은 값·같은 서체이고, 크기만 인덱스 급이다. */
export const IndexOrdinal = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.textMuted};
  ${font.numeric}

  /* 🔴 hover 에서 hue 를 **글자에** 얹지 않는다. 페이지 hue 는 라우트가 발행하는 장식 토큰이라
     대응하는 Text 짝이 없다 — 대비 테스트가 볼 수 없는 색 위에 글자를 올리는 셈이 된다.
     hue 는 위쪽 룰(border-top, 비텍스트)이 받고, 글자는 검증된 중립 축에서만 진해진다. */
  a:hover > & {
    color: ${color.text};
  }
`;

export const IndexLabel = styled.span`
  min-width: 0;
  font-family: ${font.display};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;
