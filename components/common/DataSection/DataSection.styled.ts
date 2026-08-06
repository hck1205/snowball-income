import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * "자료를 정리해 보여 주는 화면"들의 공통 조판.
 *
 * ## 왜 공용인가
 * 2026-08-04 에 자료형 화면이 셋 늘었다(국회의원 거래 · 국민연금 · 증시 캘린더). 셋 다 구조가 같다:
 * **제목 밑줄 한 선 → 부제 → 표/타일**. 이걸 페이지마다 복사하면 네 벌이 되고(대가들의 포트폴리오가
 * 이미 한 벌을 갖고 있다), 조판을 한 번 손보려면 네 군데를 고쳐야 한다.
 *
 * ## 🔴 섹션을 카드로 두르지 않는다
 * 표를 카드에 넣으면 면이 세 겹(페이지 → 카드 → 표)이 되어 어디가 데이터고 어디가 장식인지
 * 흐려진다. 제목은 **밑줄 한 선** 위에 서고 표는 그 아래 지면에 바로 눕는다 — 섹션이 카드가 아니라
 * 편집 지면의 단락으로 읽힌다.
 */

/** 섹션들을 쌓는 바깥 통. 간격 하나만 여기서 정한다 — 섹션마다 margin 을 흩뿌리지 않는다. */
export const SectionStack = styled.div`
  display: grid;
  gap: clamp(28px, 4vw, 48px);
  min-width: 0;
  margin-top: ${space[6]};
`;

export const SectionRoot = styled.section`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SectionHead = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/**
 * 섹션 제목. 🔴 위계는 색이 아니라 **크기 대비**가 만든다 — `font.display` 는 Bold 한 벌만 실려
 * 굵기로는 단을 못 나눈다(`shared/styles/tokens.ts` 주석).
 */
export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 1.9vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
`;

export const SectionSubtitle = styled.p`
  margin: 0;
  max-width: 62ch;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 지표 타일 줄. `auto-fit` + `minmax` 라 폭이 줄면 열 수가 알아서 준다 —
 * 중단점을 손으로 적으면 타일 수가 바뀔 때마다 그 표가 낡는다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 자료의 한계를 적는 판.
 *
 * 🔴 **경고 색을 쓰지 않는다.** 여기 적히는 것은 사고가 아니라 그 자료의 **성질**이다
 * (신고가 구간이다 · 45일 늦다 · 일부만 담긴다). 빨간 판에 넣으면 "뭔가 잘못됐다"로 읽히고
 * 두 번째 방문부터는 아예 안 읽는다. 중립 면 + 왼쪽 귀 한 줄로 본문과 같은 무게로 둔다.
 */
export const NotePanel = styled.div<{ $tone?: 'neutral' | 'brand' }>`
  display: grid;
  gap: ${space[3]};
  padding: clamp(${space[4]}, 2.4vw, ${space[6]});
  border: 1px solid ${({ $tone }) => ($tone === 'brand' ? color.brandBorder : color.border)};
  ${({ $tone }) => ($tone === 'brand' ? '' : `border-left: 3px solid ${color.accentAlt};`)}
  border-radius: ${radius.lg};
  background: ${({ $tone }) => ($tone === 'brand' ? color.brandSubtle : color.surfaceSunken)};
`;

export const NoteList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** 글머리는 점 하나. 숫자를 매기면 "1번이 가장 중요하다"는 없는 위계가 생긴다. */
export const NoteItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.7;

  &::before {
    content: '·';
    color: ${color.textMuted};
    font-weight: ${font.weight.bold};
  }

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

/** 표 위·아래의 한 줄 — 기준일·건수처럼 표를 읽는 데 필요한 전제. */
export const SectionMeta = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]} ${space[4]};
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: 1.6;
`;

export const SectionLink = styled.a`
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;
