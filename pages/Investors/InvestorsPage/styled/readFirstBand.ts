import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, media, radius, space } from '@/shared/styles';

/* ── ① 읽기 전 고지 밴드 (지연 경고 + 한계 3항목) ──────────────────────────── */

/**
 * 🔴 **이 화면에서 가장 크게 말해야 하는 블록.**
 *
 * 2차 개편에서 지연 경고와 한계 목록을 **하나로 합쳤다.** 1차에서는 경고 카드 바로 아래에
 * 같은 폭의 중립 카드가 또 서 있어서, 눈이 두 블록을 "비슷한 고지 두 개"로 묶어 읽었다 —
 * 그러면 지연 경고의 특별함이 사라진다. 한 밴드 안에 넣고 **왼쪽 셀만 크게** 두면 밴드 전체가
 * 경고로 읽히고, 한계 셋은 그 경고의 각주 자리로 내려간다.
 *
 * 🔴 **톤을 낮춘 것이 아니라 올렸다**: 제목 lg(16px) → clamp(xl~3xl), 아이콘 40 → 52px,
 *    좌측 띠 5px 유지. 회색조로 인쇄해도 굵은 제목 줄과 경고 글리프가 남는다.
 * ⚠ 색 쌍은 `contrast.test.ts` 가 검증하는 warning/warningSurface 만 쓴다.
 * ⚠ 이 밴드가 라우트의 **두 번째이자 마지막 틴트 면**이다(첫 면은 PageHero).
 */
export const ReadFirstBand = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[5]};
  padding: clamp(18px, 2.2vw, 26px);
  border: 1px solid ${color.warning};
  border-left-width: 5px;
  border-radius: ${DATA_RADIUS};
  background: ${color.warningSurface};
  min-width: 0;

  ${media.up('tabletSm')} {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: clamp(20px, 3vw, 40px);
  }
`;

export const DelayCell = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[4]};
  min-width: 0;
`;

/** 경고 글리프 자리. 52px 정사각이라 폭 하한(180px)에 걸리지 않는다 — 예산 밖의 색 자리(L1). */
export const DelayIcon = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: ${radius.lg};
  border: 2px solid ${color.warning};
  color: ${color.warning};
  background: transparent;
`;

export const DelayText = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 🔴 이 화면의 실질적인 첫 문장. 크기를 내리지 마라. */
export const DelayHeadline = styled.strong`
  display: block;
  color: ${color.warning};
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 2.1vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
`;

export const DelayBody = styled.p`
  margin: 0;
  max-width: 46ch;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

/**
 * 한계 셋이 앉는 오른쪽 셀. 넓은 폭에서는 **세로 실선**으로 갈라 두 이야기임을 밝히고,
 * 좁은 폭에서는 가로선으로 눕는다(경고 아래에 붙는 각주 모양이 된다).
 */
export const LimitsCell = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.warning};

  ${media.up('tabletSm')} {
    padding-top: 0;
    padding-left: clamp(20px, 3vw, 40px);
    border-top: 0;
    border-left: 1px solid ${color.warning};
  }
`;

/**
 * 🔴 여전히 **헤딩**이다(문서 개요에서 빠지면 안 된다). 다만 시각적으로는 이제 밴드의 부제라
 * 아이브로우 급으로 내렸다 — 경고 제목과 같은 크기로 두면 둘이 서로를 깎는다.
 */
export const LimitsHeading = styled.h2`
  margin: 0;
  color: ${color.warning};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
`;

/**
 * 목록을 여는 한 문장("아래 세 가지를 전제로 읽어 주십시오").
 *
 * 🔴 개편에서 이 줄이 한 번 사라졌다 — 블록을 합치며 제목만 옮기고 부제를 흘렸다. 세 항목이
 * **전제**라는 사실을 말하는 것은 이 문장뿐이라(목록만 있으면 "참고 사항"으로 읽힌다) 되살렸다.
 */
export const LimitsLede = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
`;

export const LimitsList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LimitsItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/** 항목 번호. 22px 원이라 폭 하한(180px) 밖 — 경고 면 위에서 같은 축(warning)으로 그린다. */
export const LimitsIndex = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.warning};
  color: ${color.warning};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;
