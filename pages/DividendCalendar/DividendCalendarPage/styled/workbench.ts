import styled from '@emotion/styled';
import {
  appHeaderHeight,
  color,
  font,
  media,
  motion,
  pageHue,
  pageHueMix,
  radius,
  sectionTitleFontSize,
  space
} from '@/shared/styles';
import { bodyCard } from './surfaces';

/* -------------------------------------------------------------------------- */
/* 2층 — 작업대(목록 열 + 지도 열)                                              */
/* -------------------------------------------------------------------------- */

/**
 * **주역은 왼쪽 열이다.** 오른쪽 지도 열의 폭을 `clamp` 로 묶어 달력이 아무리 넓은 화면에서도
 * 화면을 지배하지 못하게 한다 — 남는 폭은 전부 목록이 가져간다.
 *
 * 1열 전환은 `layout`(980px) — 이 레포의 좌/우 2단 경계다.
 */
export const Workbench = styled.div`
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

export const LedgerCard = styled.section`
  ${bodyCard}
`;

/**
 * 지도 열은 **따라붙는다**(sticky). 목록이 길어져도 달력이 화면에 남아 있어야 "이 달 어디쯤을
 * 보고 있나"를 잃지 않는다. 1열에서는 그냥 흐른다(붙일 여백이 없다).
 */
export const MapCard = styled.section<{ $solo?: boolean }>`
  ${bodyCard}

  ${media.up('layout')} {
    /* 🔴 solo = 옆에 목록이 없는 상태(고른 종목에 놓을 일정이 하나도 없을 때). 그때 이 카드는
       작업대 밖에서 전폭으로 서고, 붙을 상대가 없으므로 sticky 도 끈다 — 혼자 있는 요소가
       스크롤에 붙으면 "무엇을 따라다니는지"가 없어 그냥 안 움직이는 것처럼 읽힌다. */
    position: ${({ $solo }) => ($solo ? 'static' : 'sticky')};
    /*
     * 🔴 붙는 기준은 **실측 헤더 높이**다 — appHeaderHeight (AppHeader 가 리사이즈마다 써 넣는
     * CSS 변수). 상수를 적으면 안 된다: 앱 헤더는 그 자신이 sticky top 0 이고 1280 실측 97px 이라,
     * 24px 같은 값으로 붙이면 카드 머리("월간 지급 지도")와 요일 줄이 헤더 뒤로 들어가 스크롤 중에
     * 영영 안 보인다. 레포에 같은 처방이 이미 둘 있다
     * (pages/Ledger/…/ScopeRail, pages/Portfolio/…/RailColumn).
     *
     * ⚠ Portfolio 레일과 달리 max-height + overflow-y 는 붙이지 않는다 — 이 카드 안에는 날짜 칩
     *   **툴팁**(절대 배치, 포털 아님)이 살아서 스크롤 상자를 만들면 가장자리 칸의 말풍선이 잘린다
     *   (같은 이유로 위 CardHead 에서 3변 bleed 도 포기했다).
     */
    top: calc(${appHeaderHeight} + ${space[3]});
  }
`;

/**
 * 카드 머리 — 글리프 배지 + 이름 + 오른쪽 슬롯.
 *
 * 🔴 3변 bleed(음수 마진으로 카드 세 변에 붙이기)를 **일부러 쓰지 않았다**: bleed 를 깔끔히
 * 자르려면 카드에 `overflow: hidden` 이 필요한데, 지도 카드 안에는 날짜 칩 **툴팁**(절대 배치,
 * 포털 아님)이 산다 — 가장자리 칸의 말풍선이 잘린다. 대신 아래 1px 구분선이 머리를 만든다.
 */
export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/**
 * 카드 머리의 **글리프 배지**. 라우트 얼굴색에서 파생한 옅은 면 + 같은 hue 의 아이콘.
 * 폭 34px 이라 틴트 면 판정(≥180px) 밖이고, 🔴 **파생 면 위에 텍스트를 얹지 않는다** —
 * 여기 들어가는 것은 aria-hidden 아이콘뿐이고, 카드 이름은 옆의 중립색 글자가 말한다.
 */
export const SectionGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: ${radius.md};
  border: 1px solid ${pageHueMix(38, 'transparent')};
  background: ${pageHueMix(14)};
  color: ${pageHue};
`;

/**
 * 열 제목(h3). 구 처방은 `font.size.sm`(13px) 이라 본문과 거의 같은 무게였다 —
 * 공통 `sectionTitleFontSize`(16~18px)로 올려 제목·본문·캡션의 대비를 벌린다.
 */
export const CardTitle = styled.h3`
  margin: 0;
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/**
 * 제목 옆 개수 — 제목과 같은 줄에서 "몇 건짜리 목록인가"를 먼저 말한다.
 * 흰 카드 위 알약이라 면은 침강면이다(muted 는 1.03:1 이라 알약이 아니라 그냥 글자가 된다).
 */
export const CardCount = styled.span`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
  ${font.numeric}
`;

/**
 * 날짜 미정 보기 토글(구 2버튼 탭의 후신 — "지급 일정 목록" 탭은 제목과 중복이라 폐기).
 * `role="tab"` 대신 `aria-pressed` — 레포 관례이고, 탭 롤은 화살표 키 이동 계약을 동반하는데
 * 이 화면은 그것을 구현하지 않는다.
 *
 * 눌린 상태는 **틴트 + 2px 테두리 + 굵기** 세 채널이다. 이 화면의 솔리드 브랜드 면(L3)은 종목 선택
 * 버튼 하나뿐이라 여기까지 채우면 "가장 강한 면"이 둘이 되어 어느 쪽도 주역이 아니게 된다.
 * ⚠ 폭 180px 미만이라 브랜드 틴트를 써도 면 예산 밖이다.
 */
export const UndatedToggleButton = styled.button<{ $active: boolean }>`
  border: ${({ $active }) => ($active ? '2px' : '1px')} solid
    ${({ $active }) => ($active ? color.brandBorder : color.border)};
  border-radius: ${radius.pill};
  padding: ${({ $active }) =>
    $active ? `calc(${space[1]} - 1px) calc(${space[3]} - 1px)` : `${space[1]} ${space[3]}`};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.semibold)};
  cursor: pointer;
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brandSubtle : color.surface)};
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? color.brandSubtleHover : color.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 지도 카드 안의 **구역 이름**(연간 지급 리듬). 카드 제목(h3)보다 한 단 아래 무게로, 위에 실선을
 * 그어 "여기서부터 다른 이야기"를 말한다 — 카드를 하나 더 만들면 오른쪽 열이 카드 탑이 된다.
 *
 * 헤딩 태그로 올리지 않는다: 이 페이지의 헤딩 순서는 h1 히어로 → h2 월 → h3 카드 제목으로 이미
 * 완결돼 있고, 바로 아래 `details`의 `summary`가 이 표의 접근성 진입점을 이미 갖고 있다.
 */
export const MapZoneLabel = styled.p`
  margin: ${space[1]} 0 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

/**
 * 달력 바로 아래 한 줄 힌트 — "날짜 칸을 누를 수 있다"는 것은 터치에서 보이지 않는다.
 * 데스크톱에서는 커서와 호버 링이 이미 말하므로 좁은 폭에서만 띄운다.
 */
export const BoardHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};

  ${media.up('tabletSm')} {
    display: none;
  }
`;
