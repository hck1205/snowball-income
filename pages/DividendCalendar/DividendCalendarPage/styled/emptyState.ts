import styled from '@emotion/styled';
import { PICK, PICK_RADIUS, cardElevation, color, font, media, radius, space, topRail } from '@/shared/styles';
import { bodyCard } from './surfaces';

/* -------------------------------------------------------------------------- */
/* 빈 상태 — "고르는 면"이 화면의 절반을 갖는다                                   */
/* -------------------------------------------------------------------------- */

/**
 * 구 처방은 예시 격자 **위에 카드를 절대 배치로 띄웠다**(top 33%, 반투명 아님). 겹침은 두 층이 서로를
 * 가리고, 좁은 폭에서는 겹치지 않게 다시 분기해야 했다. 이제는 겹치지 않는다 —
 * **왼쪽에 고르는 카드, 오른쪽에 흐린 예시 달력**으로 나란히 선다(작업대와 같은 2열 골격).
 */
export const StartBench = styled.div`
  display: grid;
  gap: clamp(16px, 1.8vw, 20px);
  min-width: 0;
  align-items: start;

  ${media.up('layout')} {
    /*
     * 🔴 40 : 60 이다(2026-08-03 사용자 지시). 종전은 왼쪽 1fr + 오른쪽 clamp(360~500px) 라
     * **폭에 따라 비율이 널뛰었다** — 1280 에서 약 62:38, 1920 에서 약 72:28 로 달력이 계속 좁아졌다.
     * fr 두 개로 잡으면 어느 폭에서든 같은 비율이라 달력 칸이 일정하게 넓다.
     */
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
`;

/**
 * 빈 상태도 하나의 화면이다. 이 화면의 **유일한 "고르는 면"**(brand)이라 `PICK_RADIUS`(30~34px)를
 * 쓴다 — 옆에 선 data 면(24~28px)과 반경이 갈려 "고르는 것 / 읽는 것"이 형태로 읽힌다.
 *
 * 🔴 면색은 **쓰지 않는다.** 라우트의 색면 예산 2개가 히어로와 공용 푸터 패널로 이미 차 있다.
 * 대신 **6px 레일 캡**을 쓴다(면 판정 하한 8px 바로 아래).
 */
export const StartCard = styled.div`
  position: relative;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(22px, 3vw, 32px);
  border-radius: ${PICK_RADIUS};
  ${cardElevation('raised')}
  /* 🔴 아래 레일을 카드 모서리에서 잘라내는 **유일한 장치**다. 이 카드 안에는 툴팁·팝오버가 없으므로
     안전하다(지도 카드가 3변 bleed 를 포기한 이유가 그 반대 경우다 — workbench.ts 의 CardHead 주석). */
  overflow: hidden;

  /*
   * 상단 리본은 공용 topRail() 이 낸다(2026-08-03). 손으로 적던 top/left/right 를 헬퍼로 바꾼
   * 이유는 모양이 아니라 **감사**다: 소스 레벨 리본 가드(shared/styles/geometry.test.ts)가 잡는
   * 서명은 inset:0 0 auto 0 과 topRail( 둘뿐이라, 구 표기는 반경을 가진 이 카드에서 overflow 가
   * 지워져도 조용히 통과했다. 이제는 문다.
   * ⚠ 높이는 PICK.railHeight(6px) — 8px 이 되는 순간 tintscan 이 선이 아니라 면으로 세어 이 라우트의
   *   틴트 예산을 먹는다. 올리지 마라.
   */
  &::before {
    ${topRail(PICK.railHeight)}
    background: ${color.gradientAurora};
  }
`;

/**
 * 빈 상태 카드의 얼굴 — 48px 글리프 배지.
 * 폭 48px 이라 틴트 면 판정(≥180px) 밖이고, 대비는 검증 쌍(brand-text / brand-subtle)만 쓴다.
 */
export const EmptyGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: 48px;
  height: 48px;
  border-radius: ${radius.lg};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  color: ${color.brandText};
`;

/**
 * "예시 · 실제 데이터가 아닙니다" 라벨.
 *
 * 🔴 **색만으로 구분하지 않기 위한 장치다** — 흐린 칩은 시각 신호일 뿐이라 고대비 모드·스크린리더에
 * 아무것도 전하지 못한다. 이 텍스트가 그 자리를 메운다(표 접근명·캡션이 같은 말을 한 번 더 한다).
 * 지우지 마라: 지우는 순간 예시가 실제 지급 예정으로 읽힌다.
 */
export const PreviewBadge = styled.p`
  justify-self: start;
  margin: 0;
  padding: ${space[1]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.pill};
  /* 🔴 이 칩은 **놓치면 안 되는** 고지다(예시를 실제 지급으로 읽는 사고를 막는 유일한 텍스트).
     흰 카드 위에서 muted(1.03:1)는 면이 없는 것과 같아 점선 하나에 전부를 걸고 있었다. */
  background: ${color.surfaceSunken};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.01em;
  color: ${color.textSecondary};
`;

/** 고르는 면의 제목이라 본문과의 대비를 크게 벌린다(굵기가 아니라 크기로 — 헤딩 서체는 Bold 한 벌). */
export const EmptyTitle = styled.p`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 44ch;
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

export const QuickPickList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/** 색 점 + 칩 한 벌. 폭이 180px 을 넘지 않으므로 여기서 색을 써도 면 예산과 무관하다. */
export const QuickPickItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

/**
 * 추천 칩 앞의 종목 색 점 — **누르기 전에 이미 그 종목의 색을 보여 준다.**
 * 옆에 깔린 예시 달력의 같은 종목 칩이 같은 색 점을 달고 있어, 누르면 그 색이 그대로 선명해진다.
 * 색은 인라인 style 로 들어온다(화면 전체가 공유하는 색 사전). 장식이라 aria-hidden 이다.
 */
export const QuickPickDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

/**
 * 예시 달력이 앉는 판. 실제 지도 카드와 **같은 기하**를 쓰되 한 겹 뒤로 물러난다 —
 * "여기 이런 것이 뜬다"는 자리 표시이지 읽을 데이터가 아니다.
 *
 * ⚠ 안의 달력이 스스로 침강면 판을 갖게 된 뒤(2026-08-03)로 이 판과 그 판은 **같은 색**이다.
 * 일부러 그대로 뒀다 — 여기서 격을 말하는 것은 옆에 선 `StartCard`(raised)와의 차이이고,
 * 예시 달력의 날짜 타일은 여전히 흰색이라 격자 구조는 실제 지도와 똑같이 읽힌다.
 */
export const PreviewPane = styled.div`
  ${bodyCard}
  background: ${color.surfaceSunken};
`;
