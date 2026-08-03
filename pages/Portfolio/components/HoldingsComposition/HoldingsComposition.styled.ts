import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 비중 도넛 + 범례.
 *
 * 🔴 **도넛 지름은 148px 로 고정한다.** `tintscan` 의 면 판정은 폭 ≥180px **AND** 높이 ≥8px 이라
 * 148px 원은 색이 가득 차 있어도 면으로 세어지지 않는다 — 이 화면의 틴트 면 예산(2)은 히어로와
 * 상태 줄이 이미 쓰고 있어 여유가 없다. 커지고 싶으면 예산을 먼저 내려라(올리는 방향은 금지).
 */
export const CompositionRoot = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
  padding-top: ${space[1]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const DonutFrame = styled.div`
  flex: 0 0 auto;
  position: relative;
  width: 148px;
  height: 148px;
  align-self: center;
`;

/**
 * 색 원판. 가운데는 `mask` 로 뚫는다 — 위에 면색 원을 얹으면 그 원이 부모 카드의 배경색을
 * 따라가지 못해(요약 카드는 `surfaceRaised`) 다크에서 가운데만 다른 밝기로 뜬다.
 * `mask` 미지원 브라우저에서는 채운 원(파이)이 되고, 뜻은 그대로 읽힌다.
 */
export const DonutDisc = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  mask: radial-gradient(circle, transparent 58%, currentColor 58.5%);
  -webkit-mask: radial-gradient(circle, transparent 58%, currentColor 58.5%);
`;

/** 도넛 한가운데의 보유 종수. 도넛이 장식이라도 그 안의 숫자는 사실이라 글자로 남긴다. */
export const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  text-align: center;
  pointer-events: none;
`;

export const DonutCenterValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

export const DonutCenterLabel = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const LegendBlock = styled.div`
  flex: 1 1 220px;
  min-width: 0;
  display: grid;
  gap: ${space[2]};
`;

export const LegendTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const LegendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

/** 범례 한 줄 — 점 · 이름 · (선) · 값. 값은 우측 정렬 + tabular 라 세로로 자릿수가 맞는다. */
export const LegendItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

/** 10px 점 — 폭·높이 모두 면 하한 밖이다. 색은 표의 종목 귀와 **같은 값**이다. */
export const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: ${radius.pill};
`;

export const LegendName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const LegendValue = styled.span`
  text-align: right;
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric}
`;
