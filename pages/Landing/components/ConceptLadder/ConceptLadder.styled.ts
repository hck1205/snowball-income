import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';

/**
 * S3 "배당을 알기 전에, 세 단어" — 주식 → ETF → 배당주.
 *
 * 🔴 **한 섹션 안의 3단이다.** 섹션 셋으로 쪼개지 않는다(투어처럼 읽힌다). 하나의 section,
 * 하나의 h2, 그 안에 h3 셋이다.
 *
 * 🔴 **상자가 아니라 격자다.** 같은 크기 카드 3장을 가로로 세우는 것은 이 페이지에서 반복되던
 * 어법이었다 — 항목마다 **자기 상단 2px 룰**이 그 자리를 대신하고, 룰이 3등분되어 있다는 사실
 * 자체가 "셋을 비교하라"고 말한다.
 *
 * ## 2026-08-03: 열 사이 1px 세로선 → 항목별 상단 2px 룰
 * before 의 세로선은 3열일 때만 존재했고(1열로 접히면 가로선으로 바뀌었다), 항목의 시작을
 * 표시하지 못했다. 지금은 폭에 상관없이 **항목마다 룰 하나**다 — 위 장 머리 룰(1~2px)과 같은
 * 어휘라 문서 전체가 같은 조판 규칙으로 읽힌다.
 * 룰 색이 accent 인 이유: 이 장의 배지·번호가 이미 accent 축이다(한 장 안에서 축이 갈리지 않는다).
 * 색이 유일한 신호가 아니다 — 룰 아래 큰 숫자가 같은 경계를 말한다.
 */

export const ConceptGrid = styled.ol`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
  gap: clamp(20px, 2.6vw, 36px);

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ConceptItem = styled.li`
  display: grid;
  /* 🔴 3열 비교의 전제는 "셋이 같은 자리에서 시작한다"이다. 기본값(stretch)이면 남는 높이가
     행 사이로 배분돼 용어의 baseline 이 열마다 갈린다(2026-08-01 실측: 646/641/636). */
  align-content: start;
  gap: ${space[2]};
  min-width: 0;
  padding-top: ${space[4]};
  border-top: 2px solid ${color.accentBorder};
`;

/**
 * 순서 숫자 — **이 격자의 가장 큰 잉크**다.
 *
 * 데이터 서체 + 30~38px + `text-muted`. 색을 얹지 않는 이유는 채도 예산이 아니라 역할이다:
 * 숫자는 "몇 번째"만 말한다. 무슨 축인지는 위 2px 룰(accent)과 장 머리 배지가 이미 말한다.
 * 🔴 원문자(①②③)로 되돌리지 마라 — 배지를 지운 지금도 마찬가지다. 유니코드 원문자는 서체마다
 * 자간·기준선이 달라 세 열의 숫자 높이가 어긋난다.
 */
export const ConceptOrder = styled.span`
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['4xl']}, calc(0.7rem + 1.5vw), ${font.size['5xl']});
  font-weight: ${font.weight.bold};
  line-height: 1;
  letter-spacing: -0.04em;
  color: ${color.textMuted};
  ${font.numeric}
`;

export const ConceptTitle = styled.h3`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  /* 🔴 장 제목(h2, 20~30px)과 본문(13px) 사이의 단이다. before 는 14px 이라 본문과 붙어 있었다. */
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const ConceptBody = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;
