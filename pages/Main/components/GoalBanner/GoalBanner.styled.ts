import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';
import type { LandingGoalKind } from '@/shared/constants/landingGoals';
import type { GoalStatus } from './GoalBanner.types';

/* --------------------------------------------------------------------------
 * 첫 화면에서 고른 목표를 계산기가 되짚는 띠.
 *
 * 🔴 **첫 화면의 시각 언어를 그대로 잇는다** — 자산=accent(틸) · 배당=accentAlt(그린), 아이콘 배지는
 * 떠 있는 중립 면. 여기서 색을 새로 정하면 방문자는 자기가 누른 카드와 이 띠를 연결하지 못한다
 * (pages/Home/components/GoalPicker/GoalPicker.styled.ts 가 그 램프의 정본이다).
 *
 * 🔴 **결과보다 커지지 마라.** 이 띠는 "네가 고른 것이 여기 반영됐다"를 말하는 이정표이지 결과가
 * 아니다. 결과 카드(ResultSummaryCard)보다 시각 무게가 커지면 방문자가 진짜 숫자를 지나친다.
 * -------------------------------------------------------------------------- */

type Toned = { tone: LandingGoalKind };

const toneRamp = (tone: LandingGoalKind) =>
  tone === 'asset'
    ? { fill: color.accent, text: color.accentText, subtle: color.accentSubtle, border: color.accentBorder }
    : {
        fill: color.accentAlt,
        text: color.accentAltText,
        subtle: color.accentAltSubtle,
        border: color.accentAltBorder
      };

export const BannerRoot = styled.section<Toned>`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]};
  border: 1px solid ${({ tone }) => toneRamp(tone).border};
  border-radius: ${radius.md};
  background: ${({ tone }) => toneRamp(tone).subtle};

  ${media.up('mobileWide')} {
    padding: ${space[4]};
    border-radius: ${radius.lg};
  }
`;

/** 첫 화면 카드의 배지와 같은 규칙 — 떠 있는 중립 면 + 축 색 글리프(대비가 보증된 조합). */
export const BannerBadge = styled.span<Toned>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${({ tone }) => toneRamp(tone).border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${({ tone }) => toneRamp(tone).text};

  & > svg {
    width: 55%;
    height: 55%;
  }

  ${media.up('mobileWide')} {
    width: 42px;
    height: 42px;
  }
`;

export const BannerBody = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`;

/** 윗줄 — 무엇을 골랐는가. 라벨("목표")과 이름("1억 만들기")이 한 줄에 앉는다. */
export const BannerHead = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const BannerGoalName = styled.strong`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/**
 * 가운뎃줄 — **이 조건에서의 답**. 배너에서 가장 진한 글자다.
 * 미달·미판정이면 축 색을 쓰지 않는다(닿았다는 인상을 색으로 주면 안 된다).
 */
export const BannerAnswer = styled.p<Toned & { status: GoalStatus }>`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${({ tone, status }) => (status === 'reached' ? toneRamp(tone).text : color.text)};
  word-break: keep-all;

  ${media.up('mobileWide')} {
    font-size: ${font.size.lg};
  }
`;

/**
 * 아랫줄 — 첫 화면이 말했던 값.
 * ⚠ 지우지 마라. 이 줄이 없으면 방문자는 "아까 6년 7개월이라더니 왜 9년이지"에서 멈춘다 —
 *   두 숫자의 전제가 다르다는 것을 여기서만 말한다.
 */
export const BannerEstimate = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  word-break: keep-all;
`;
