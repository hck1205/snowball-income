import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  DATA_SURFACE,
  PICK,
  cardElevation,
  color,
  font,
  media,
  radius,
  shadow,
  space
} from '@/shared/styles';

/* ── ② 합의 보드 — 시상대 + 정렬 토글 + 막대·이니셜 칩 (data 면) ───────────── */
/* 같은 섹션의 4위 이하 표는 `rankTable.ts` 에 있다. */

export const ConsensusSection = styled.section`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
`;

/**
 * 정렬 토글 — 담은 인원 ↔ 신고 금액.
 * 🔴 두 기준은 **다른 이야기**를 한다(금액 순은 규모 큰 한 사람이 순위를 지배한다).
 * ⚠ 선택을 색으로만 말하지 않는다 — `aria-pressed` 와 굵기·면이 함께 진다.
 */
export const AggregateToggle = styled.div`
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  align-self: end;
  flex: 0 0 auto;
`;

export const AggregateToggleButton = styled.button<{ $selected: boolean }>`
  padding: ${space[1]} ${space[4]};
  border: 0;
  border-radius: ${radius.pill};
  cursor: pointer;
  font-family: inherit;
  font-size: ${font.size.xs};
  white-space: nowrap;
  background: ${({ $selected }) => ($selected ? color.surface : 'transparent')};
  color: ${({ $selected }) => ($selected ? color.text : color.textSecondary)};
  font-weight: ${({ $selected }) => ($selected ? font.weight.bold : font.weight.medium)};
  box-shadow: ${({ $selected }) => ($selected ? shadow.e1 : 'none')};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * **시상대** — 상위 3종만 타일로 크게 뽑는다.
 *
 * 왜 열 줄을 다 같은 크기로 두지 않는가: 1위와 10위가 같은 높이의 줄이면 "가장 많이 겹친 종목"이
 * 목록 안에 묻힌다. 이 섹션의 질문은 *"대가들이 공통으로 무엇을 담았나"* 하나뿐이고, 그 답은
 * 사실상 상위 몇 종이다. 나머지는 표로 내려가 **밀도**를 담당한다.
 */
export const PodiumGrid = styled.ol`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  /*
   * 🔴 넓은 폭에서는 **1위 칸을 넓힌다.** 같은 폭 타일 셋은 "상위 3종"이 아니라 "동급 3개"로
   * 읽힌다 — 순위표에서 가장 중요한 사실은 1위라는 것이고, 비대칭이 그 사실을 말한다.
   * (숫자와 색으로도 이미 말하고 있으므로 폭은 세 번째 채널이다.)
   */
  ${media.up('headerStack')} {
    grid-template-columns: 1.3fr 1fr 1fr;
  }
`;

export const PodiumTile = styled.li`
  ${cardElevation('base')}
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  --sb-inner-radius: ${radius.sm};
  min-width: 0;
`;

export const PodiumHead = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 시상대 순위 숫자. 1위만 액센트 축으로 올린다 — **색이 유일한 채널이 아니다**(글자가 이미 "1"이다).
 * 폭 <180px 이라 예산 밖(L1)이고, 배경을 채우지 않아 대비 계약도 건드리지 않는다.
 */
export const PodiumRank = styled.span<{ $lead: boolean }>`
  flex: 0 0 auto;
  color: ${({ $lead }) => ($lead ? color.accentAltText : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['3xl']}, 3.4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.05em;
  line-height: 1;
  ${font.numeric}
`;

export const PodiumNames = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PodiumTicker = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.display};
  /* 좁은 폭에서 한 단 줄인다 — "ALPHABET INC" 같은 긴 발행사명이 3열에서 잘리던 자리다(실측). */
  font-size: clamp(${font.size.lg}, 1.6vw, ${font.size.xl});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PodiumKorean = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 인원 수 · 금액 두 값. 🔴 금액만 보면 "한 사람이 크게"와 "여럿이 나눠"가 구분되지 않는다. */
export const PodiumMetrics = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const PodiumMetric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PodiumMetricValue = styled.span<{ $align?: 'end' }>`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  text-align: ${({ $align }) => ($align === 'end' ? 'right' : 'left')};
  ${font.numeric}
`;

export const PodiumMetricLabel = styled.span<{ $align?: 'end' }>`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  letter-spacing: 0.06em;
  text-align: ${({ $align }) => ($align === 'end' ? 'right' : 'left')};
`;

/**
 * 막대 트랙.
 * 🔴 높이는 `PICK.railHeight`(6px) 다. 8px 은 tintscan 의 면 하한과 **같은 값**이라
 *    막대 열 줄이 그대로 면 열 개로 세어진다(2026-08-03 이전의 실제 결함).
 */
export const Track = styled.div`
  position: relative;
  height: ${PICK.railHeight};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

export const Bar = styled.div<{ $ratio: number; $color: string }>`
  height: 100%;
  border-radius: ${radius.pill};
  background: ${({ $color }) => $color};
  /* 0~1 을 폭으로 옮긴다. 1% 미만도 눈에 남게 최소 폭을 준다(0 은 0으로 둔다). */
  width: ${({ $ratio }) => ($ratio <= 0 ? '0' : `${Math.max(1.5, $ratio * 100)}%`)};
`;

/**
 * 🔴 **합산 표와 인물 카드를 잇는 다리.** 이 줄을 담은 사람들의 이니셜이 서고, 누르면 그 사람의
 * 보유 표가 열린다. 1차까지 두 블록은 같은 화면에 있으면서 서로를 전혀 몰랐다.
 */
export const HolderStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 이니셜 칩. 26px 원이라 폭 하한(180px) 밖 — 인물 고유색을 예산 없이 쓰는 자리(L1).
 *
 * 🔴 면은 **16% 틴트 · 글자는 중립** 이다. 시리즈 색은 비텍스트 3:1 로만 검증된 색이라
 * (`contrast.test.ts`) 그 위에 글자를 얹으면 대비 계약 밖이 된다 — 모노그램 배지와 같은 처방.
 */
export const HolderChip = styled.button<{ $color: string }>`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: ${radius.pill};
  border: 1px solid ${({ $color }) => $color};
  background: color-mix(in srgb, ${({ $color }) => $color} 16%, ${color.surface});
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.04em;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${({ $color }) => $color} 30%, ${color.surface});
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const HolderCount = styled.span`
  margin-left: ${space[1]};
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
  ${font.numeric}

  /* 좁은 폭에서는 줄바꿈을 허용한다 — 이 한 줄의 nowrap 이 순위표의 최소 폭을 25px 밀어 올렸다. */
  ${media.down('mobileWide')} {
    white-space: normal;
  }
`;
