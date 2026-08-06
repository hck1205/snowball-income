import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, space } from '@/shared/styles';

/**
 * S4 "배당을 다시 넣으면 무엇이 달라지나".
 *
 * 문단 폭을 60ch 로 묶는다 — 한 줄이 90자를 넘으면 눈이 다음 줄 첫 글자를 잃는다.
 * 이 섹션은 랜딩에서 가장 긴 산문이라 그 손실이 가장 크게 난다.
 *
 * 진입은 문장 안 인라인 링크 하나다. 여기에 큰 버튼을 또 두면 히어로 CTA 와 경쟁한다.
 *
 * ## 2026-08-03 형태 변경 두 가지
 *  ① **곁가지 카드에서 상자를 걷어냈다.** 장 껍데기가 스파인이 되면서 본문 밭 안의 상자는
 *     "카드 안의 카드"가 됐다 — 대신 세로 2px 룰(identity)이 곁가지임을 말한다. 랜딩에서 상자를
 *     줄이는 방향이 이번 리워크의 축이다(before 는 전 섹션이 카드였다).
 *  ② **알약 칩 4개 → 번호가 붙은 목록.** 제목이 "네 가지"라고 약속하므로 화면도 셀 수 있어야 한다.
 */

/**
 * 넓은 폭에서 [산문][곁가지] 2단.
 *
 * 🔴 **산문 폭 60ch 는 이 컨테이너가 아니라 `ExplainerProse` 가 갖는다.** 60ch 를 줄이지 마라 —
 * 이 섹션은 랜딩에서 가장 긴 산문이고, 한 줄이 길어지면 눈이 다음 줄 첫 글자를 잃는다.
 *
 * ⚠ 경계가 `layout` 이 아니라 `tablet` 이다: 장 껍데기가 이미 ≥layout 에서 기둥을 떼어 갔으므로
 * 본문 밭의 폭은 컨테이너 폭이 아니다(1280 실측 밭 폭 약 800px). 밭 안에서 2단이 되려면 더 이른
 * 경계가 필요하다.
 */
export const ExplainerBody = styled.div`
  display: grid;
  gap: clamp(20px, 2.4vw, 32px);
  min-width: 0;

  ${media.up('tablet')} {
    grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
    column-gap: clamp(24px, 3vw, 44px);
    align-items: start;
  }
`;

/** 문단 + 인라인 링크. 좁은 폭에서는 링크가 산문 끝에 붙는다(설명 문단의 마무리다). */
export const ExplainerProse = styled.div`
  display: grid;
  gap: ${space[4]};
  max-width: 60ch;
  min-width: 0;
`;

/**
 * 🔴 이 장의 **결론 문단**이다 — 복리가 무엇인지를 정의하는 문장이라 리드 급으로 선다.
 * 문단이 늘어나도 자동으로 첫 문단을 키우지 마라(어느 문단이 결론인지는 사람이 정한다).
 */
export const ExplainerLead = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: clamp(${font.size.md}, calc(0.6rem + 0.55vw), ${font.size.xl});
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;
`;

export const ExplainerParagraph = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

/**
 * 곁가지 — 본문이 말한 네 값의 이름표. **면이 아니라 세로 룰**이다(상자 안의 상자를 만들지 않는다).
 * 룰 색이 identity 인 이유: 이 장은 등급 chapter 라 장 머리 룰도 페이지 hue 축이다.
 */
export const FactorCard = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;
  padding-left: clamp(14px, 1.6vw, 20px);
  border-left: 2px solid ${color.identityBorder};
`;

export const FactorTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const FactorList = styled.ol`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const FactorItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: ${space[3]};
  padding: ${space[2]} 0;

  & + & {
    border-top: 1px solid ${color.border};
  }
`;

/** 번호. 데이터 서체 고정폭이라 네 줄의 이름 시작선이 흔들리지 않는다. */
export const FactorIndex = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric}
`;

export const FactorName = styled.span`
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.identityText};
  word-break: keep-all;
`;

/** 인라인 링크가 앉는 줄. 전역 p 여백에 기대지 않는다(섹션 gap 이 간격을 소유한다). */
export const InlineLinkLine = styled.p`
  margin: 0;
`;

export const InlineLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.brand};
  text-decoration: none;
  /* 밑줄을 기본으로 둔다 — 산문 안의 링크라 색만으로는 링크임이 전달되지 않는다. */
  text-decoration-line: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  transition: gap ${motion.fast} ${motion.ease};

  svg {
    flex: none;
  }

  &:hover {
    gap: ${space[3]};
  }
`;
