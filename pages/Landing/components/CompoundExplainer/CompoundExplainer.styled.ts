import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { cardElevation, color, font, media, radius, space } from '@/shared/styles';

/**
 * S4 "배당을 다시 넣으면 무엇이 달라지나".
 *
 * 문단 폭을 60ch 로 묶는다 — 1120px 컨테이너에서 한 줄이 90자를 넘으면 눈이 다음 줄 첫 글자를 잃는다.
 * 이 섹션은 랜딩에서 가장 긴 산문이라 그 손실이 가장 크게 난다.
 *
 * 진입은 문장 안 인라인 링크 하나다. 여기에 큰 버튼을 또 두면 히어로 CTA 와 경쟁한다.
 */

/**
 * 넓은 폭에서 [산문][곁가지 카드] 2단.
 *
 * 🔴 **산문 폭 60ch 는 이 컨테이너가 아니라 `ExplainerProse` 가 갖는다.** 예전에는 여기가 60ch 라
 * 1040px 섹션에서 **440px(42%)가 빈 칸**이었고, 12칸 격자(S5)·카드 8장(S6) 사이에서 이 섹션만
 * 밀도가 비어 랜딩에서 가장 평평했다. 새 장치를 발명하지 않고 **이미 있는 `FactorCard` 를 그 빈
 * 자리로 옮겼을 뿐**이다(새 토큰 0 · 새 색 0 · 모션 0).
 *
 * ⚠ 60ch 를 줄이지 마라 — 이 섹션은 랜딩에서 가장 긴 산문이고, 한 줄이 길어지면 눈이 다음 줄
 * 첫 글자를 잃는다.
 */
export const ExplainerBody = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;

  ${media.up('layout')} {
    grid-template-columns: minmax(0, 60ch) minmax(260px, 340px);
    column-gap: clamp(24px, 3vw, 40px);
    align-items: start;
  }
`;

/** 문단 2개 + 인라인 링크. 좁은 폭에서는 링크가 산문 끝에 붙는다(설명 문단의 마무리다). */
export const ExplainerProse = styled.div`
  display: grid;
  gap: ${space[3]};
  max-width: 60ch;
  min-width: 0;
`;

export const ExplainerParagraph = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;
`;

/** 곁가지 — 본문이 말한 네 값의 이름표. 부속 면(면색만)이라 테두리·그림자를 갖지 않는다. */
export const FactorCard = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  padding: clamp(14px, 2vw, 20px);
  border-radius: ${radius.lg};
  ${cardElevation('sunken')}
`;

export const FactorTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const FactorList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 이 섹션은 등급 B(chapter)라 페이지 정체색을 머리 룰만이 아니라 칩에서도 갖는다.
 * 색이 유일한 신호가 아니다 - 칩 안 낱말(배당률·배당 성장률·투자 기간·배당소득세율)이 내용을 말한다.
 */
export const FactorItem = styled.li`
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.identityBorder};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-size: ${font.size.xs};
  color: ${color.identityText};
`;

/** 인라인 링크가 앉는 줄. 전역 p 여백에 기대지 않는다(섹션 gap 이 간격을 소유한다). */
export const InlineLinkLine = styled.p`
  margin: 0;
`;

export const InlineLink = styled(Link)`
  font-size: ${font.size.sm};
  color: ${color.brand};
`;
