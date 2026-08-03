import styled from '@emotion/styled';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  iconFirstLineAlign,
  media,
  space,
  topRail
} from '@/shared/styles';

/**
 * S7 "시작하기 전에" — **중립 면 + 상단 6px 레일**이다.
 *
 * ## 왜 wash 를 걷어냈나 — 예산 거래다, 취향이 아니다
 * `tintscan` 은 «폭 ≥180px **그리고** 높이 ≥8px + 비중립 배경» 을 틴트 면으로 세고, 랜딩의
 * 기준선은 **2**(확정 결정, 올릴 수 없다)다. 지금 장부는 ① 마무리 CTA(brand-subtle)
 * ② 푸터 브랜드 패널이다. 그래서 이 카드의 배경(면 ③이 될 값)을 **레일로 내렸다**: 상단 6px 컬러
 * 줄은 높이 하한 8px 에 못 미쳐 **세어지지 않는다**(4px 오로라 리본과 같은 취급).
 *
 * 색이 줄어든 것이 아니라 **자리를 옮겼다** — 프리셋 카드가 같은 어휘의 레일 캡을 얻었고,
 * 이 카드도 그 어휘를 그대로 쓴다. accent 축인 이유는 장 배지·순서 번호·주의 글리프가 이미
 * 전부 accent 라서다(한 카드 안에서 축이 갈리지 않는다).
 *
 * ⚠ 2026-08-03 흰 캔버스 전환으로 히어로가 면을 내놓아 예산 한 장이 풀렸지만, 그 한 장은
 *   **마무리 CTA 가 가져갔다**(근거: `shared/styles/surfaces.ts` 머리말 — "그 화면을 켠 이유"에만).
 *   이 카드는 문서 중간의 참고 카드라 그 자리가 아니다.
 * 🔴 배경을 다시 채우지 마라. 세 번째 면이 되는 순간 `tools/dev/tintscan.mjs` 의 `/` 항목이 exit 1 이다.
 * ⚠ 오른쪽 목록을 경고 배너(Banner tone='warning')로 만들지 마라 — 같은 이유로 면이 하나 더 는다.
 * 두 목록의 성격 차이는 **마크업과 눈썹 문구**가 말한다: 왼쪽은 순서 있는 목록(ol) "앱 안에서",
 * 오른쪽은 점 목록(ul) "앱 밖에서"다.
 *
 * ## 2026-08-03: 두 열 사이에 1px 룰
 * 같은 카드 안에 성격이 다른 두 목록이 있다는 사실을, 여백 32px 하나가 지고 있었다. 세로 룰이
 * 그 경계를 명시한다(좁은 폭에서는 가로 룰로 바뀐다 — 접히는 방향을 따라간다).
 */

export const ChecklistCard = styled.div`
  ${cardElevation('base')}
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 40px);
  min-width: 0;
  /* 🔴 레일이 3변으로 붙으려면 모서리에서 잘라야 한다 — 이 한 줄이 유일한 클리핑 장치다.
     지우면 6px 띠가 34px 반경 모서리 밖으로 직진한다(리본에 반경을 주는 처방은 6px 높이에서
     오히려 틈을 만든다 — 근거는 shared/styles 의 topRail 주석). */
  overflow: hidden;
  padding: clamp(24px, 3vw, 40px);
  /* 고르는 면(PickCard)과 같은 반경 대역 — 프리셋 카드 바로 다음에 오는 카드라 각이 갈리면 눈에 띈다. */
  border-radius: ${PICK_RADIUS};

  /* 상단 컬러 레일. 의사요소라 DOM 열거 대상이 아니고, 6px 은 면 하한(8px)에도 못 미친다.
     선언은 공용 topRail() 이 소유한다 — 레포 전체가 같은 처방을 쓰도록(손으로 적으면 반경·inset 이
     자리마다 갈린다). 여기서 정하는 것은 높이와 색뿐이다. */
  &::before {
    ${topRail(PICK.railHeight)}
    background: ${color.accent};
  }

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ChecklistColumn = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;

  /* 두 열의 경계. 접히는 방향을 따라 세로 룰 ↔ 가로 룰로 바뀐다. */
  ${media.up('tablet')} {
    & + & {
      padding-left: clamp(20px, 3vw, 40px);
      border-left: 1px solid ${color.border};
    }
  }

  ${media.down('tablet')} {
    & + & {
      padding-top: clamp(20px, 3vw, 40px);
      border-top: 1px solid ${color.border};
    }
  }
`;

/**
 * 눈썹 — "앱 안에서" / "앱 밖에서". 이 카드의 **가장 중요한 정보**이고, 제목보다 먼저 읽혀야 한다.
 * `aria-hidden` 인 이유: 바로 아래 제목이 같은 사실을 문장으로 말한다(중복 낭독 방지).
 */
export const ChecklistKind = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.accentText};
`;

export const ChecklistTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  /* 랜딩 h3 한 크기(20px) — ConceptTitle·FactorTitle 과 같은 단이다. */
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/** 순서가 내용인 목록 — 번호는 브라우저가 그린다(우리가 문자열로 적지 않는다). */
export const StepList = styled.ol`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding-left: 1.6em;
  color: ${color.text};
`;

export const StepItem = styled.li`
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;

  /*
   * 이 섹션의 tone 은 accent 다 — 장 배지·상단 레일과 **같은 색축**을 번호가 잇는다.
   * accent-text on surface 는 contrast.test.ts 가 16테마 전부에서 재는 정식 쌍이다
   * (파생 면이 아니라 토큰 대 토큰). 본문은 계속 text 라 번호가 본문보다 튀지 않는다.
   * 크기를 키운 이유: 번호가 본문과 같은 13px 이면 "순서가 있다"가 목록 기호로만 남는다.
   */
  &::marker {
    color: ${color.accentText};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
  }
`;

export const StepClosing = styled.p`
  margin: 0;
  padding-top: ${space[2]};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const CautionList = styled.ul`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 각 항목 앞 글리프는 **경고색이 아니다**(accent-text). 이 목록은 사고를 알리는 배너가 아니라
 * "직접 확인하실 것" 목록이고, 위험색을 쓰면 화면의 정서가 겁주기로 바뀐다.
 * 왼쪽 순서 번호와 같은 accent 축이라 두 목록이 한 카드로 읽힌다 — 대비 근거는 StepItem 주석.
 */
export const CautionItem = styled.li`
  display: flex;
  gap: ${space[3]};
  align-items: flex-start;
  padding: ${space[3]} 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;

  & + & {
    border-top: 1px solid ${color.border};
  }

  &:first-of-type {
    padding-top: 0;
  }

  svg {
    flex: none;
    color: ${color.accentText};
    ${iconFirstLineAlign(font.size.sm, font.leading.relaxed, 16)}
  }
`;
