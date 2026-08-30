import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 첫 화면(/)의 레이아웃.
 *
 * 🔴 이 지면은 **한 화면**이다. /about 처럼 아래로 길어지기 시작하면 목표 여섯이 "첫 화면"이
 * 아니게 되고, 그 순간 2026-08-27 의 교체가 없던 일이 된다. 섹션을 더하고 싶으면 /about 에 쓴다.
 *
 * ## 하단 둘도 카드다 (2026-08-27 사용자 지시)
 * 출구("천천히 둘러보기")와 재방문("이어서 계산하기")을 처음엔 글줄로 두었다가 **"하나도 안 읽힌다"**
 * 는 지적을 받았다. 목표 여섯이 카드로 서 있는 화면에서 그 아래 맨 글줄은 화면의 일부로 읽히지
 * 않는다 — 형태가 다르면 위계가 아니라 **잔여물**로 보인다.
 * 🔴 다만 **목표 카드보다 약해야** 한다. 이 둘이 같은 무게로 서면 방문자가 여섯 대신 이 둘을 먼저
 *   고르게 되고, 그러면 목표 화면을 만든 이유가 사라진다. 그래서 틴트가 아니라 중립 면이고,
 *   테두리도 한 단 흐리다.
 * -------------------------------------------------------------------------- */

export const HomeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[6]};
  padding-bottom: ${space[7]};
`;

export const HeroBlock = styled.div`
  display: flex;
  flex-direction: column;

  /* 🔴 포커스 링을 만들지 않는다 — 전역 규칙이 [tabindex='-1'] 을 대상에서 제외한다. */
  &:focus {
    outline: none;
  }
`;

/**
 * 목표 **아래**의 카드들 — **두 줄**이다(2026-08-27 사용자 지시).
 *
 *   1행: 성향 테스트 — 전폭 한 줄. "어떤 구성이 맞을지 모르겠다면"이 이 지면에서 목표 여섯 다음으로
 *        많은 사람이 해당하는 상태라, 반쪽 카드로 접어 두면 눈에 걸리지 않는다.
 *   2행: 둘러보기 · 이어서 계산하기 — **반반**. 둘은 같은 급의 곁길이다.
 *
 * ⚠ 목표 그리드 위로 올리지 마라 — 접힘 예산이 그리드에 걸려 있다(GoalPicker.styled 머리말).
 * ⚠ 좁은 폭에서는 전부 1열이다. 390 에서 반반으로 두면 두 카드 모두 글자가 접혀 읽히지 않는다.
 */
export const HeroExtras = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[5]};

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: ${space[3]};
  }

  /*
   * 🔴 **2행의 칸이 하나뿐일 때는 그것도 전폭이다.** "이어서 계산하기"는 저장된 작업이 있을 때만
   * 그려지므로 첫 방문자에게는 2행에 둘러보기 하나만 남는다 — 반쪽 카드가 왼쪽에 떠 있고 오른쪽이
   * 비면 레이아웃이 깨진 것처럼 보인다.
   * 선택자 뜻: "두 번째 자식인데 동시에 마지막" = 자식이 정확히 둘(테스트 + 둘러보기)인 경우다.
   */
  ${media.up('mobileWide')} {
    > :nth-child(2):last-child {
      grid-column: 1 / -1;
    }
  }
`;

/** 카드 둘의 공통 골격. 형태가 같아야 "같은 급의 선택지"로 읽힌다. */
const extraCard = `
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  text-align: left;
  transition: transform ${motion.ease}, box-shadow ${motion.ease}, border-color ${motion.ease};

  &:hover {
    transform: translateY(-2px);
    border-color: ${color.borderStrong};
    box-shadow: ${shadow.e2};
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

/**
 * 🔴 출구. 이 카드가 없으면 여섯 중 자기 것이 없는 사람이 갈 곳을 잃는다 —
 * 프리셋 13지선다에서 정확히 그 지적을 받았다(2026-08-23).
 * 톤은 권유가 아니라 **허락**이다: "고르지 않아도 된다".
 */
/**
 * 성향 테스트(2026-08-27). BrowseCard 와 **같은 골격**이되 축 색 테두리 하나만 다르다 —
 * 셋이 한 줄로 읽히면서도 이쪽이 반 단 앞선다. 🔴 틴트 면까지 주지 마라: 그러면 목표 여섯과
 * 같은 급이 되어 방문자가 목표 대신 이것을 먼저 고른다.
 */
/**
 * 성향 테스트 — **1행 전폭의 큰 버튼**(2026-08-27 사용자 지시).
 *
 * 🔴 이전 주석은 "틴트 면까지 주지 마라"였다. 사용자가 **전폭으로 크게** 하라고 정했으므로 그 제약을
 * 걷었다. 다만 목표 여섯을 누르지 않게 하는 선은 지킨다 — **채움(brand solid)은 쓰지 않는다.**
 * 이 지면에서 solid 버튼은 아직 하나도 없고, 그 자리를 곁길이 먼저 가져가면 목표 카드가 부차적으로
 * 읽힌다. 틴트 면 + 축 색 테두리까지가 상한이다.
 * ⚠ 되돌릴 근거는 `cta_click(home_investor_type)` 대 `goal_selected` 의 비율이다.
 */
export const QuizCard = styled(Link)`
  ${extraCard};
  border-color: ${color.accentBorder};
  background: ${color.accentSubtle};
  color: ${color.text};
  text-decoration: none;

  ${media.up('mobileWide')} {
    /* 1행 전폭. 아래 2행이 반반이므로 이 한 줄이 두 칸을 함께 쓴다. */
    grid-column: 1 / -1;
    padding: ${space[4]} ${space[5]};
  }

  /*
   * 🔴 **행동 문구가 이 버튼의 주인공이다**(2026-08-27 사용자 지시). 곁길 카드 셋이 같은 골격을
   * 쓰지만, 전폭 한 줄을 통째로 받은 것은 이것뿐이라 문구도 그만큼 커야 형태와 무게가 맞는다.
   * 아래 카드 둘(둘러보기·이어서)은 sm 그대로 — 셋이 같은 크기면 1행을 전폭으로 만든 뜻이 없다.
   *
   * ⚠ 자식 강조는 **속성 선택자**로 건다. Emotion 컴포넌트 셀렉터는 babel/swc 플러그인이 있어야
   *   하는데 이 프로젝트에는 없다(성향 테스트 화면에서 실제로 터졌다).
   */
  [data-extra-action] {
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
    color: ${color.accentText};
  }

  [data-extra-lead] {
    font-size: ${font.size.xs};
  }

  ${media.up('mobileWide')} {
    [data-extra-action] {
      font-size: ${font.size.xl};
    }
  }

  /* 배지·화살표도 문구에 맞춰 한 단 커진다 — 문구만 키우면 아이콘이 딸려 보인다. */
  [data-extra-badge] {
    width: 44px;
    height: 44px;
    border: 1px solid ${color.accentBorder};
    background: ${color.surface};
    color: ${color.accentText};
  }

  &:hover {
    border-color: ${color.accent};
  }

  &:hover [data-extra-chevron] {
    transform: translateX(3px);
  }
`;

export const BrowseCard = styled(Link)`
  ${extraCard};
  color: ${color.text};
  text-decoration: none;
`;

/** 재방문자에게만 보인다. BrowseCard 와 **같은 형태**여야 둘이 한 줄로 읽힌다. */
export const ResumeCard = styled.button`
  ${extraCard};
  width: 100%;
  font: inherit;
  color: ${color.text};
  cursor: pointer;
`;

/** 아이콘 자리. 목표 카드의 배지보다 약하다(중립 면 + 축 색 글리프). */
export const ExtraBadge = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
`;

export const ExtraBody = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
`;

/** 윗줄 — 상황("아직 잘 모르겠다면"·"전에 계산하던 내용이 남아 있습니다"). */
export const ExtraLead = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  word-break: keep-all;
`;

/** 아랫줄 — 행동. 카드에서 유일하게 진한 글자다. */
export const ExtraAction = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  word-break: keep-all;
`;

/** 오른쪽 꼬리 화살표. 카드가 **누를 수 있는 것**임을 형태로 말한다. */
export const ExtraChevron = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  margin-left: auto;
  color: ${color.textMuted};
  transition: transform ${motion.ease};
`;

/** 면책. 화면 맨 아래, 가장 약한 무게. 🔴 지우지 마라(전 표면 공통 규율). */
export const HomeDisclaimer = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  text-align: center;
  word-break: keep-all;

  ${media.up('mobileWide')} {
    max-width: 60ch;
    margin: 0 auto;
  }
`;
