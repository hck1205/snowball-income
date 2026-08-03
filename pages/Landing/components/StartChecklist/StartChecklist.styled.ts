import styled from '@emotion/styled';
import { PICK, PICK_RADIUS, cardElevation, color, font, iconFirstLineAlign, media, space } from '@/shared/styles';

/**
 * S7 "시작하기 전에" — **중립 면 + 상단 6px 레일**이다(2026-08-03 개편).
 *
 * ## 왜 wash 를 걷어냈나 — 예산 거래다, 취향이 아니다
 * `tintscan` 은 «폭 ≥180px **그리고** 높이 ≥8px + 비중립 배경» 을 틴트 면으로 세고, 랜딩의
 * 기준선은 **2**(확정 결정, 올릴 수 없다)다. 이번 개편이 마무리 CTA 를 브랜드 패널(네이비)로
 * 올리면서 그 자리가 ②를 가져갔다 — 히어로 그라디언트가 ①, 마무리 패널이 ②다.
 * 그래서 이 카드의 `gradient-hero-soft` 배경(면 ③이 될 값)을 **레일로 내렸다**:
 * 상단 6px 컬러 줄은 높이 하한 8px 에 못 미쳐 **세어지지 않는다**(4px 오로라 리본과 같은 취급).
 *
 * 색이 줄어든 것이 아니라 **자리를 옮겼다** — 프리셋 카드 8~13장이 같은 어휘의 레일 캡을 얻었고,
 * 이 카드도 그 어휘를 그대로 쓴다. accent 축인 이유는 섹션 배지·순서 번호·주의 글리프가 이미
 * 전부 accent 라서다(한 카드 안에서 축이 갈리지 않는다).
 *
 * 🔴 배경을 다시 채우지 마라. 세 번째 면이 되는 순간 `tools/dev/tintscan.mjs` 의 `/` 항목이 exit 1 이다.
 * ⚠ 오른쪽 목록을 경고 배너(Banner tone='warning')로 만들지 마라 — 같은 이유로 면이 하나 더 는다.
 * 두 목록의 성격 차이는 **마크업**이 말한다: 왼쪽은 순서 있는 목록(ol), 오른쪽은 점 목록(ul)이다.
 */

export const ChecklistCard = styled.div`
  ${cardElevation('base')}
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 3vw, 32px);
  min-width: 0;
  /* 레일이 3변으로 붙으려면 모서리에서 잘라야 한다. */
  overflow: hidden;
  padding: clamp(20px, 2.8vw, 32px);
  /* 고르는 면(PickCard)과 같은 반경 대역 — 프리셋 카드 바로 다음에 오는 카드라 각이 갈리면 눈에 띈다. */
  border-radius: ${PICK_RADIUS};

  /* 상단 컬러 레일. 의사요소라 DOM 열거 대상이 아니고, 6px 은 면 하한(8px)에도 못 미친다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${PICK.railHeight};
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
`;

export const ChecklistTitle = styled.h3`
  margin: 0;
  font-family: ${font.display};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/** 순서가 내용인 목록 — 번호는 브라우저가 그린다(우리가 문자열로 적지 않는다). */
export const StepList = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding-left: 1.35em;
  color: ${color.text};
`;

export const StepItem = styled.li`
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;

  /*
   * 이 섹션의 tone 은 accent 다 — 섹션 배지·상단 레일과 **같은 색축**을 번호가 잇는다.
   * 카드 배경이 wash(gradient-hero-soft)에서 중립 surface 로 내려오면서 이 쌍은 오히려
   * **더 안전해졌다**: accent-text on surface 는 contrast.test.ts 가 16테마 전부에서 재는
   * 정식 쌍이다(파생 면이 아니라 토큰 대 토큰). 본문은 계속 text 라 번호가 본문보다 튀지 않는다.
   */
  &::marker {
    color: ${color.accentText};
  }
`;

export const StepClosing = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const CautionList = styled.ul`
  display: grid;
  gap: ${space[2]};
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
  gap: ${space[2]};
  align-items: flex-start;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.text};
  word-break: keep-all;

  svg {
    color: ${color.accentText};
    ${iconFirstLineAlign(font.size.sm, font.leading.relaxed, 16)}
  }
`;
