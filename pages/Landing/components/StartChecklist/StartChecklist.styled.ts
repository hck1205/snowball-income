import styled from '@emotion/styled';
import { cardElevation, color, font, iconFirstLineAlign, media, radius, space } from '@/shared/styles';

/**
 * S7 "시작하기 전에" — 랜딩의 **마지막 틴트 면**이다.
 *
 * 🔴 랜딩의 틴트 면은 정확히 2개다: 히어로 그라디언트(hero) + 이 카드(hero-soft).
 * 세 번째를 넣고 싶어지면 대신 글리프·1px 테두리·작은 배지로 색을 써라.
 * 배경은 공용 Card 의 wash 톤과 **같은 토큰**(gradient-hero-soft)이다 — 이미 8프리셋 x
 * 라이트/다크 대비 검증을 통과한 값이고, 히어로와 같은 어휘라 화면이 따로 놀지 않는다.
 *
 * ⚠ 오른쪽 목록을 경고 배너(Banner tone='warning')로 만들지 마라 — 그 순간 틴트 면이 3개가 된다.
 * 두 목록의 성격 차이는 **마크업**이 말한다: 왼쪽은 순서 있는 목록(ol), 오른쪽은 점 목록(ul)이다.
 */

export const ChecklistCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 3vw, 32px);
  min-width: 0;
  padding: clamp(16px, 2.4vw, 28px);
  border-radius: ${radius.xl};
  ${cardElevation('base')}
  background: ${color.gradientHeroSoft};

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
   * 이 섹션의 tone 은 accent 다 — 섹션 배지와 **같은 색축**을 번호가 잇는다. 색을 넣기 전에
   * 8프리셋 x 라이트/다크 16조합을 브라우저에서 실측했다: accent-text 대 이 카드의 실제 렌더
   * 배경(gradient-hero-soft) 최악 지점이 최저 4.76:1(vivid/light), 최고 11.86:1(ink/dark)로
   * 전부 AA 4.5 를 넘는다(2026-08-01). 본문은 계속 text 라 번호가 본문보다 튀지 않는다.
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
 * 왼쪽 순서 번호와 같은 accent 축이라 두 목록이 한 카드로 읽힌다 — 대비 실측 근거는 StepItem 주석.
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
