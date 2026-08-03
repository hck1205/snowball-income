import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';
import type { LedgerStepTone } from './LedgerStepRail.types';

/**
 * 연결 절차 표시줄의 스타일.
 *
 * 🔴 **색이 단독 채널이 아니다.** 지난 단계는 체크 글리프, 지금 단계는 굵기 + 채운 원, 남은 단계는
 * 점선 테두리로 말한다 — 회색조로 인쇄해도 세 상태가 구분된다.
 * 🔴 이 줄은 **면이 아니라 선**이다. 원 지름 26px 은 폭 180px 하한에 한참 못 미치고 배경도 깔지
 * 않으므로 `tintscan` 의 틴트 면 예산을 먹지 않는다.
 */

export type StepState = 'done' | 'current' | 'todo';

const railInk = (tone: LedgerStepTone) => (tone === 'panel' ? color.onPanel : color.text);
const railMuted = (tone: LedgerStepTone) => (tone === 'panel' ? color.onPanelMuted : color.textMuted);
const railAccent = (tone: LedgerStepTone) => (tone === 'panel' ? color.onPanelGold : color.brandText);

/**
 * 단계 줄. 🔴 **가로를 꽉 채운다**(2026-08-03 사용자 지시: "100% 넓게 펼쳐줘, 중간에 step이 더
 * 들어갈지도 몰라"). 그래서 항목 사이를 `space-between` 이 아니라 **잇는 선이 늘어나서** 채운다 —
 * space-between 은 항목 수가 바뀔 때마다 간격이 널뛰지만, 선이 늘어나면 단계가 셋이든 다섯이든
 * 같은 리듬이 유지된다(단계 추가가 예고된 화면이라 이게 요구사항이다).
 * ⚠ 그래서 `StepItem` 의 잇는 선은 고정폭이 아니라 남는 공간을 먹어야 한다 — 거기 주석 참고.
 */
export const StepRailRoot = styled.ol`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
  min-width: 0;
`;

/** 단계 사이의 잇는 선. 마지막 항목 뒤에는 그리지 않는다(끝이 열려 보이면 단계가 더 있어 보인다). */
export const StepItem = styled.li<{ $tone: LedgerStepTone; $state: StepState }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${({ $tone, $state }) => ($state === 'todo' ? railMuted($tone) : railInk($tone))};

  &:not(:last-of-type)::after {
    content: '';
    display: block;
    width: clamp(16px, 3vw, 32px);
    height: 1px;
    margin-left: ${space[1]};
    background: currentColor;
    opacity: 0.4;
  }

  ${media.down('mobileWide')} {
    &:not(:last-of-type)::after {
      width: 12px;
    }
  }
`;

/**
 * 단계 번호가 앉는 원. 지금 단계만 채워지고 나머지는 테두리다 —
 * "여기까지 왔다"를 형태로 말하는 부분이라 색을 빼도 성립한다.
 */
export const StepBadge = styled.span<{ $tone: LedgerStepTone; $state: StepState }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
  transition: border-color ${motion.fast} ${motion.ease};

  ${({ $tone, $state }) => {
    if ($state === 'current') {
      return `
        border: 1px solid ${railAccent($tone)};
        background: ${railAccent($tone)};
        color: ${$tone === 'panel' ? color.panel : color.onBrand};
      `;
    }
    if ($state === 'done') {
      return `
        border: 1px solid ${railAccent($tone)};
        background: transparent;
        color: ${railAccent($tone)};
      `;
    }
    return `
      border: 1px dashed ${railMuted($tone)};
      background: transparent;
      color: ${railMuted($tone)};
    `;
  }}
`;

export const StepText = styled.span<{ $state: StepState }>`
  font-size: ${font.size.sm};
  font-weight: ${({ $state }) => ($state === 'current' ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
`;
