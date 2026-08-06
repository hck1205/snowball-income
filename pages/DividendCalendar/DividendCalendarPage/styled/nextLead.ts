import styled from '@emotion/styled';
import { color, font, media, motion, pageHue, radius, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 1층 데크 안 — 다음 예상 지급 판                                               */
/* -------------------------------------------------------------------------- */

/**
 * **다음 예상 지급 판** — 이 화면의 답이 서는 자리.
 *
 * 버튼인 이유: 누르면 목록의 그 날짜 블록으로 간다(달력 칸을 찾아 누르지 않아도 된다).
 * 접근명은 달력 칸의 이동 버튼과 **다른 문장**이다(`deck.jumpToDay`) — 같으면 한 화면에 같은 이름의
 * 버튼이 둘이 되어 소리로 구분되지 않는다.
 *
 * 🔴 면은 **중립**이다(`surfaceSunken`). 폭이 데크 전폭이라 여기에 틴트를 깔면 라우트 색면 예산
 * (히어로 + 푸터 패널로 이미 2)이 즉시 터진다. 색은 왼쪽 4px 레일과 종목 점만 진다.
 */
const leadPanel = `
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]} ${space[4]};
  width: 100%;
  padding: clamp(14px, 1.6vw, 20px) clamp(16px, 1.8vw, 22px);
  padding-left: clamp(20px, 2.2vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  font-family: inherit;
  text-align: left;
  overflow: hidden;

  /* 라우트 얼굴색 레일. 폭 4px 이라 면이 아니라 선이다(틴트 판정 하한은 높이 8px · 폭 180px). */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: ${pageHue};
  }

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const NextLead = styled.button`
  ${leadPanel}
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 버튼이 **아닌** 판(선택 0종·이 달 지급 없음). 같은 기하를 쓰되 누를 수 있는 척하지 않는다. */
export const NextLeadStatic = styled.div`
  ${leadPanel}
`;

/** 판의 왼쪽 — 라벨 → 날짜 → 종목 칩 순서. */
export const NextLeadMain = styled.span`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** "다음 예상 지급" — 작고 조용한 라벨이 큰 숫자에 이름을 준다. */
export const NextLeadLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

/**
 * 날짜 줄. 이 화면에서 **두 번째로 큰 글자**다(가장 큰 것은 오른쪽 카운트다운).
 * 타이포 대비를 벌리는 자리라 굵기가 아니라 크기로 간다(헤딩 서체는 Bold 한 벌뿐).
 */
export const NextLeadDate = styled.span`
  font-size: clamp(${font.size.xl}, 2.2vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

/** 그 날 들어오는 종목 칩 줄. */
export const NextLeadTickers = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 종목 칩 — **버튼이 아니다**(누를 실체가 없고, 옆의 판 전체가 이미 눌린다).
 * 색 점은 달력 칩·아젠다 막대·범례 점과 같은 사전에서 온다.
 */
export const NextLeadTicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const NextLeadDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
`;

/**
 * 카운트다운 — **이 화면의 주인공 숫자 한 곳**이다(`font.heroNumeric` 은 화면당 한 자리 규칙).
 * 중립 면 위 중립 글자다: 파생 색(pageHue)은 대비 검증 밖이라 텍스트로 쓰지 않는다.
 */
export const NextLeadCountdown = styled.span`
  justify-self: end;
  font-family: ${font.heroNumeric};
  font-size: clamp(${font.size['3xl']}, 4vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  color: ${color.text};
  ${font.numeric}

  ${media.down('mobileWide')} {
    justify-self: start;
  }
`;

/**
 * 이미 지난 일정·지급 없음처럼 "지금 기다릴 것이 없는" 상태의 카운트다운 자리.
 *
 * 이 칩은 **침강면 판 위에** 앉는다 — 그래서 면은 판보다 밝아야 한다(가라앉은 자리에서 한 칸 올라온
 * 알약). 구 `surfaceMuted` 는 판과 1.037:1 이라 알약 모양이 사라졌다. `surface` 로 올려 1.112:1.
 */
export const NextLeadNote = styled.span`
  justify-self: end;
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  white-space: nowrap;

  ${media.down('mobileWide')} {
    justify-self: start;
  }
`;

/** 선택이 없을 때 판이 대신 하는 안내 한 줄. */
export const NextLeadBody = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;
