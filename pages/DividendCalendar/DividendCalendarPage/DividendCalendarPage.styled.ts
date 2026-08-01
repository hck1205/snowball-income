import styled from '@emotion/styled';
import {
  cardElevation,
  color,
  elevation,
  font,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
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
export const BoardCard = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};
  box-shadow: ${elevation[1]};
`;

/** 필터 진입 + 선택 요약 한 줄. 달력 위 첫 줄이라 "무엇을 보고 있는지"를 먼저 말한다. */
export const BoardHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/** 드로어를 여는 주 진입점 — 브랜드 톤 솔리드로 "여기서 시작한다"를 말한다. */
export const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtleHover};
    box-shadow: ${elevation[1]};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 선택 수 배지. 숫자만으론 의미가 안 서므로 버튼 접근명(`picker.open`)이 문장으로 다시 말한다. */
export const FilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 ${space[1]};
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/** 툴바와 달력 사이의 한 줄 요약 — "이 달에 몇 건이 잡혀 있나". */
export const MonthSummaryLine = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  ${font.numeric}
`;

/**
 * 달력 아래 상세 **구역 전체**(탭 컨트롤 + 패널 + 범례)를 담는 래퍼.
 *
 * 사용자 정정(2026-07-25): 배경이 필요한 건 안쪽 흰 박스가 아니라 **이 한 겹 밖 래퍼**다.
 * `surfaceMuted`는 페이지 바탕과 구분이 안 돼 "탭 영역이 하나의 구역"으로 읽히지 않았다 →
 * 히어로와 같은 **브랜드 틴트**로 올린다(같은 색 언어로 "이 페이지의 구역"임을 말한다).
 * 위계 규칙: **래퍼는 틴트(라이트=연브랜드/다크=어두운 브랜드), 안쪽 패널은 밝게**(surfaceRaised).
 * 대비는 검증 쌍만 사용 — text·text-secondary·brand-text / brand-subtle (shared/styles/contrast.test.ts).
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
  padding: clamp(16px, 2.4vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surfaceRaised};
  box-shadow: ${elevation[1]};
`;

/*
 * 구 `FootNoteCard`(각주 묶음)도 공용 `PageFooter` 로 수렴했다 — 좌측 2px 레일이라는 이 모양이
 * 그대로 정본이 되어 시뮬레이터·티커 허브까지 같은 자리·같은 무게를 갖는다(2026-07-31).
 */

/** 상세 카드의 머리 한 줄 — 왼쪽 제목, 오른쪽 미정 토글(있을 때만). */
export const DetailHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  flex-wrap: wrap;
`;

/** 섹션의 유일한 라벨(사용자 결정 2026-07-26). 오로라 리본이 섹션 시작을 눈으로 찍는다. */
export const DetailTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
  }
`;

/**
 * 날짜 미정 보기 토글(구 2버튼 탭의 후신 — "지급 일정 목록" 탭은 제목과 중복이라 폐기).
 * `role="tab"` 대신 `aria-pressed` — 레포 관례(MonthlyCashflow의 ViewToggleGroup)이고,
 * 탭 롤은 화살표 키 이동 계약을 동반하는데 이 화면은 그것을 구현하지 않는다.
 */
export const UndatedToggleButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? color.brand : color.border)};
  border-radius: ${radius.pill};
  padding: ${space[1]} ${space[3]};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  /* 눌린 상태는 **솔리드 브랜드** — on-brand/brand 는 전 팔레트 대비 검증 쌍이다. */
  color: ${({ $active }) => ($active ? color.onBrand : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brand : color.surface)};
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? color.brandHover : color.surfaceHover)};
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
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 28px);
  border-radius: ${radius.lg};
  ${cardElevation('raised')}
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
  gap: ${space[1]};
`;

export const QuickPickItem = styled.li`
  display: inline-flex;
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

