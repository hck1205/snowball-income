import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  PICK_RADIUS,
  cardElevation,
  color,
  elevation,
  font,
  media,
  motion,
  pageHue,
  pageHueMix,
  radius,
  space
} from '@/shared/styles';

/**
 * ── 이 화면의 면 배치 (SurfaceKind) ─────────────────────────────────────────────
 *
 * | 면 | 종류 | 처방 |
 * |---|---|---|
 * | 달력 보드 · 상세 카드 | **data**(읽는 면) | 중립 면 + `DATA_RADIUS`. 채도는 선·점(L1)에만 |
 * | 빈 상태 안내 카드 | **brand**(고르는 면) | 이 화면의 **유일한** 색면 전환 + `PICK_RADIUS` |
 *
 * 🔴 색면 예산은 **히어로 + 빈 상태 카드 = 2** 다(라우트 기준선). 세 번째 틴트 면을 만들지 마라 —
 * 카드 머리 띠가 중립 침강면(`surfaceSunken`)인 것이 그 이유다. 색을 쓰고 싶으면 면이 아니라
 * **6px 이하의 줄**(`pageHueMix`)로 써라(틴트 판정 하한은 높이 8px 이다).
 */
export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/** 두 카드가 공유하는 패딩. 값이 갈리면 두 카드가 다른 부품처럼 보인다 — 한 자리에서 소유한다. */
const SURFACE_PAD = 'clamp(16px, 2.4vw, 28px)';

/**
 * 카드 머리 **막대**. 카드 안쪽에 앉은 중립 침강면이고, 글리프 배지 + 이름 + 오른쪽 슬롯을 담는다.
 *
 * 🔴 3변 bleed(음수 마진으로 카드 세 변에 붙이기)를 **일부러 쓰지 않았다.** 두 가지가 걸린다:
 *  ① 그러려면 위쪽 두 모서리만 둥근 비균일 반경이 필요한데, 이 파일에는 `LiveRegion` 의
 *     `width: 1px` 이 있어 `test/shared/radiusShape.test.ts` 의 런 분할(중괄호 기준)에서 둘이
 *     한 조각에 묶인다 — 가드를 우회하는 형태로 적는 대신 규칙에 맞는 모양을 골랐다.
 *  ② bleed 를 깔끔히 자르려면 카드에 `overflow: hidden` 이 필요한데, 이 카드 안에는 날짜 칩
 *     **툴팁**(절대 배치, 포털 아님)이 산다 — 가장자리 칸의 말풍선이 잘린다.
 *
 * 네 모서리 균일 반경이라 얇은 요소 규칙과도 무관하고, **중립 면**이라 틴트 예산과도 무관하다.
 */
const headBand = `
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

/**
 * 카드 머리의 **글리프 배지** — 이 화면이 처음 갖는 부품이다.
 *
 * 라우트 얼굴색(`--sb-page-hue`)에서 파생한 옅은 면 + 같은 hue 의 아이콘. 폭 36px 이라 틴트 면
 * 판정(≥180px) 밖이고, 🔴 **파생 면 위에 텍스트를 얹지 않는다** — 여기 들어가는 것은 aria-hidden
 * 아이콘뿐이고, 카드 이름은 옆의 중립색 글자가 말한다.
 */
export const SectionGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  border: 1px solid ${pageHueMix(38, 'transparent')};
  background: ${pageHueMix(14)};
  color: ${pageHue};
`;

/** 머리 띠의 이름 — 중립색 글자다(색은 글리프가 진다). */
export const SectionLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

/** 머리 띠에서 오른쪽 끝으로 밀어 두는 슬롯(필터 버튼·토글). */
export const HeadSpacer = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/*
 * 히어로는 여기 없다 — 2026-07-31 에 **공용 `components/common/PageHero` 로 수렴**했다.
 * 구 로컬 `PageHero`/`HeroTitleRow`/`HeroIconBadge`/`HeroTitle`/`HeroLede`/`AsOfLine` 은
 * 컴포넌트의 루트·내부 구조와 `icon`/`title`+`titleAs`/`lede`/`meta` 슬롯이 받는다.
 * 페이지 얼굴색(틸)은 라우트가 발행하는 `--sb-page-hue` 가 준다(`shared/hooks/usePageHue`).
 *
 * ⚠ 구 `HeroDisclaimer`(예상 지급일 고지)는 잠시 `notice` 슬롯에 들어갔다가 **2026-07-31 에
 * 페이지 하단 `FootNoteCard` 로 내려갔다** — 제목·리드·주의문 3줄·기준일을 한 면에 쌓자 히어로가
 * 본문 3덩어리(222px)가 되어 각주처럼 읽혔다. 이 화면은 `notice` 슬롯을 쓰지 않는다.
 */

/**
 * 라이브 리전은 **처음부터 끝까지 마운트 상태를 유지**한다. 시각적으로만 숨기고 텍스트만 바꾼다 —
 * `display:none`이나 조건부 언마운트는 접근성 트리에서 노드를 지워 이후 변경이 낭독되지 않는다.
 */
export const LiveRegion = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

/**
 * 달력 표면. 종목 선택이 우측 드로어로 빠지면서(사용자 결정 2026-07-25) 달력이 본문 전폭을 쓴다.
 * 카드 한 장으로 묶어 히어로 다음 위계를 만든다 — 흰 배경에 표만 떠 있으면 화면이 미완성으로 읽힌다.
 */
/**
 * 달력 표면 = 이 화면의 **주역**이다. 그래서 위계 수단이 그림자다(`raised`) — 구 처방은
 * 테두리 **와** e1 그림자를 함께 갖고 있었는데, 그러면 아래 상세 카드와 완전히 같은 무게로 보인다
 * ("유령 카드"). 이제 두 카드는 주역=그림자 / 본문=테두리로 갈린다.
 */
export const BoardCard = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('raised')}
`;

/**
 * 필터 진입 + 카드 이름 한 줄. 구 처방은 카드 안쪽에 떠 있는 버튼 하나뿐이라 달력이 "어디서
 * 시작하는지"가 없었다 — 지금은 카드 세 변에 붙은 **머리 띠**가 그 자리를 만든다.
 * 부모가 그림자 카드(테두리 없음)라 반경을 그대로 쓴다.
 */
export const BoardHead = styled.div`
  ${headBand}
`;

/**
 * 드로어를 여는 주 진입점 — 이 화면에서 **유일한 솔리드 브랜드 면(L3)** 이다.
 * "여기서 고르면 화면이 바뀐다"를 말하는 자리라 색면 사다리의 맨 위를 여기에 쓴다.
 * 🔴 L3 는 화면당 하나다. 다른 곳에 brand 채움을 만들지 마라(미정 토글은 그래서 틴트로 내려갔다).
 */
export const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
    box-shadow: ${elevation[2]};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: background ${motion.fast} ${motion.ease};

    &:hover {
      transform: none;
    }
  }
`;

/**
 * 선택 수 배지. 숫자만으론 의미가 안 서므로 버튼 접근명(`picker.open`)이 문장으로 다시 말한다.
 * 솔리드 브랜드 면 위에 앉으므로 **반전**한다 — 검증 쌍(brand-text / surface)만 쓴다.
 */
export const FilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 ${space[1]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/**
 * 툴바와 달력 사이의 한 줄 요약 — "이 달에 몇 건이 잡혀 있나".
 * 왼쪽 4px 캡슐이 라우트 얼굴색을 한 번 더 찍는다(선이라 면 예산과 무관하다).
 */
export const MonthSummaryLine = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  ${font.numeric}

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 4px;
    height: 14px;
    border-radius: ${radius.pill};
    background: ${pageHue};
  }
`;

/*
 * ⚠ 구 처방(2026-07-25 "래퍼를 브랜드 틴트로 올린다")은 **폐기됐다** — 아래 블록이 정본이다.
 *   되살리지 마라: 이 화면의 틴트 예산 2개는 히어로와 공용 푸터 패널이 이미 쓰고 있다.
 */
/**
 * 상세 영역의 **유일한** 박스(사용자 결정 2026-07-26 — "박스 안에 박스 안에 박스" 평탄화).
 * 안쪽(아젠다·미정)은 표면을 갖지 않는다 — 위계는 면이 아니라 제목·엣지·간격이 만든다.
 * 브랜드 틴트도 뺐다: 안쪽 표면이 사라지면 틴트는 배경이 아니라 본문색이 되어 버린다.
 */
export const DetailCard = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
`;

/*
 * 구 `FootNoteCard`(각주 묶음)도 공용 `PageFooter` 로 수렴했다 — 좌측 2px 레일이라는 이 모양이
 * 그대로 정본이 되어 시뮬레이터·티커 허브까지 같은 자리·같은 무게를 갖는다(2026-07-31).
 */

/** 상세 카드의 머리 막대 — 달력 보드와 **같은 부품**이다(왼쪽 글리프+제목, 오른쪽 미정 토글). */
export const DetailHead = styled.div`
  ${headBand}
`;

/** 섹션의 유일한 라벨(사용자 결정 2026-07-26). 색은 옆의 글리프 배지가 진다. */
export const DetailTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

/**
 * 날짜 미정 보기 토글(구 2버튼 탭의 후신 — "지급 일정 목록" 탭은 제목과 중복이라 폐기).
 * `role="tab"` 대신 `aria-pressed` — 레포 관례(MonthlyCashflow의 ViewToggleGroup)이고,
 * 탭 롤은 화살표 키 이동 계약을 동반하는데 이 화면은 그것을 구현하지 않는다.
 */
export const UndatedToggleButton = styled.button<{ $active: boolean }>`
  border: ${({ $active }) => ($active ? '2px' : '1px')} solid
    ${({ $active }) => ($active ? color.brandBorder : color.border)};
  border-radius: ${radius.pill};
  padding: ${({ $active }) => ($active ? `calc(${space[1]} - 1px) calc(${space[3]} - 1px)` : `${space[1]} ${space[3]}`)};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.semibold)};
  cursor: pointer;
  /*
   * 눌린 상태는 **틴트 + 2px 테두리 + 굵기**다(구 솔리드 브랜드에서 내렸다).
   * 이 화면의 솔리드 브랜드 면(L3)은 종목 선택 버튼 하나뿐이라, 여기까지 채우면 "가장 강한 면"이
   * 둘이 되어 어느 쪽도 주역이 아니게 된다. 상태는 색 말고도 두 채널이 더 말한다(테두리 두께·굵기).
   * 대비는 검증 쌍만 — brand-text / brand-subtle.
   */
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
 * 예시 격자 + 안내 카드를 한 칸에 겹치는 틀.
 *
 * 좁은 폭에서는 **겹치지 않는다** — 카드 높이가 격자 높이(390px에서 351px)에 육박해 겹치면
 * 격자를 통째로 덮는다. 그때는 카드가 먼저, 격자가 그 아래로 흐른다. DOM 순서가 곧 그 읽기 순서다.
 */
export const PreviewFrame = styled.div`
  position: relative;
  display: grid;
  gap: ${space[3]};
`;

/**
 * 안내 카드의 자리. 넓은 폭에서는 격자 **상단 1/3 지점**에 앵커한다 — 격자를 덮어 없애지 않고
 * (위·아래 주가 그대로 읽힌다) 시선이 가장 먼저 닿는 곳에 선다.
 */
export const PreviewOverlay = styled.div`
  ${media.up('tabletSm')} {
    position: absolute;
    top: 33%;
    left: 50%;
    transform: translateX(-50%);
    width: min(520px, 88%);
    z-index: 2;
  }
`;

/**
 * 빈 상태도 하나의 화면이다. 예시 격자 **위에 뜨는** 카드라 반투명이면 아래 날짜와 글자가 겹쳐
 * 둘 다 못 읽는다 — 불투명 면(`raised`)이 조건이다.
 *
 * 위계 수단은 하나만 쓴다(2026-07-31 카드 3단): 뜬 카드는 **그림자**, 테두리 없음.
 * 구 점선 accent 틴트는 폐기했다 — 틴트 면 상한(≤2)을 히어로와 나눠 쓰던 자리이기도 하고,
 * 흐린 예시 위에 옅은 틴트가 겹치면 두 층이 서로를 지운다.
 */
export const EmptyStateCard = styled.div`
  position: relative;
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 28px);
  /* 고르는 면이므로 **brand 반경**(30~34px)이다 — 뒤에 깔린 data 면(24~28px)과 한 화면에 섞였을 때
     반경이 "고르는 것 / 읽는 것"을 거드는 신호가 된다. */
  border-radius: ${PICK_RADIUS};
  ${cardElevation('raised')}
  /* 아래 레일을 카드 모서리에서 잘라낸다. 이 카드 안에는 툴팁·팝오버가 없으므로 안전하다
     (달력 보드는 칩 툴팁 때문에 같은 수를 쓸 수 없다). */
  overflow: hidden;

  /*
   * 🔴 **레일 캡**(6px). 이 카드는 이 화면의 유일한 "고르는 면"이지만 **면색을 쓰지 않는다** —
   * 라우트의 색면 예산 2개가 히어로와 공용 푸터 패널로 이미 차 있기 때문이다(2026-08-03 실측:
   * 틴트 면을 주면 390px 에서 3개가 된다). 높이 6px 은 면 판정 하한(8px) 바로 아래라 예산 밖이면서
   * 저해상도에서도 색이 읽히는 값이다.
   *
   * ⚠ 반경을 **주지 않는다**. 6px 짜리 띠에 비균일 반경을 적으면 브라우저가 그려주지 않는다
   * (test/shared/radiusShape.test.ts) — 부모의 overflow 로 자르는 것이 이 레포의 처방이다.
   */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${color.gradientAurora};
  }
`;

/**
 * 빈 상태 카드의 얼굴 — 40px 글리프 배지.
 *
 * 폭 40px 이라 틴트 면 판정(≥180px) 밖이고, 대비는 검증 쌍(brand-text / brand-subtle)만 쓴다.
 */
export const EmptyGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: 40px;
  height: 40px;
  border-radius: ${radius.md};
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
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.01em;
  color: ${color.textSecondary};
`;

export const EmptyTitle = styled.p`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 52ch;
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
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
 * 아래 깔린 예시 달력의 같은 종목 칩이 같은 색 점을 달고 있어, 누르면 그 색이 그대로 선명해진다.
 * 색은 인라인 style 로 들어온다(화면 전체가 공유하는 색 사전). 장식이라 aria-hidden 이다.
 */
export const QuickPickDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

export const UnavailableDetails = styled.details`
  flex: 0 0 auto;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[3]};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const UnavailableSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform ${motion.fast} ${motion.ease};
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const UnavailableBody = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const UnavailableList = styled.ul`
  list-style: none;
  margin: ${space[2]} 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const UnavailableItem = styled.li`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
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

/*
 * 구 `FootNote`(각주 한 줄)는 **공용 `components/common/PageFooter` 로 수렴**했다(2026-07-31).
 * 이 화면의 각주 문구는 그 컴포넌트의 `notes` 슬롯으로 원문 그대로 들어간다 — 다시 복제하지 마라.
 */

