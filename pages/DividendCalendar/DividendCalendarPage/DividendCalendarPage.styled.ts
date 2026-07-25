import styled from '@emotion/styled';
import { color, elevation, font, motion, radius, space } from '@/shared/styles';

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

export const PageHero = styled.header`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 32px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: ${color.gradientAurora};
  }
`;

/** 아이콘 배지 + 제목을 한 줄로(사용자 결정 2026-07-25 — 세로 스택이 히어로를 불필요하게 높였다). */
export const HeroTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const HeroIconBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.brandText};
  background: ${color.surface};
  border: 1px solid ${color.brandBorder};
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HeroLede = styled.p`
  margin: 0;
  /* 전폭 한 줄(사용자 결정 2026-07-25) — 56ch 제한이 히어로 안에서 조기 줄바꿈을 만들었다. */
  width: 100%;
  font-size: clamp(${font.size.base}, 2vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/** 예상 지급일 고지 — 별도 배너를 없애고 히어로 안에 흡수(사용자 결정 2026-07-25). */
export const HeroDisclaimer = styled.p`
  margin: 0;
  width: 100%;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const AsOfLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

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
export const DetailCard = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.xl};
  background: ${color.brandSubtle};
`;

/** 각주 묶음 — 본문과 같은 무게로 나열되지 않게 한 덩어리로 눌러 둔다. */
export const FootNoteCard = styled.footer`
  display: grid;
  gap: ${space[1]};
  padding: ${space[3]} ${space[4]};
  border-left: 2px solid ${color.border};
`;

/**
 * 달력 아래 상세 전환(지급 일정 목록 ↔ 날짜 미정) 한 줄.
 * `role="tab"` 대신 `aria-pressed` 토글 버튼을 쓴다 — 레포 관례(MonthlyCashflow의 ViewToggleGroup)이고,
 * 탭 롤은 화살표 키 이동 계약을 동반하는데 이 화면은 그것을 구현하지 않는다.
 */
export const DetailTabList = styled.div`
  display: inline-flex;
  justify-self: start;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  padding: 2px;
  gap: 2px;
`;

export const DetailTabButton = styled.button<{ $active: boolean }>`
  border: 0;
  border-radius: ${radius.pill};
  padding: ${space[2]} ${space[4]};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  /* 활성 탭은 **솔리드 브랜드** — 래퍼가 이미 brandSubtle 이라 같은 틴트로는 선택 상태가 안 읽힌다.
     on-brand/brand 는 전 팔레트 대비 검증 쌍이다. */
  color: ${({ $active }) => ($active ? color.onBrand : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brand : 'transparent')};
  transition:
    background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? color.brandHover : color.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

/** 빈 상태도 하나의 화면이다 — 점선(미확정)에 브랜드 틴트를 얹어 "여기서 시작하라"로 읽히게 한다. */
export const EmptyStateCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 28px);
  border: 1px dashed ${color.brandBorder};
  border-radius: ${radius.lg};
  background: ${color.brandSubtle};
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

export const FootNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

