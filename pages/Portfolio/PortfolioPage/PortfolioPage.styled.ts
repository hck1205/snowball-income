import styled from '@emotion/styled';
import {
  color,
  elevation,
  font,
  heroIconOpticalAlign,
  heroTitleFontSize,
  media,
  radius,
  space
} from '@/shared/styles';

/**
 * 이 파일의 히어로·타일 그리드·빈 상태·조건 요약·각주는 **배당 캘린더 페이지와 같은 모양**을
 * 의도적으로 **복제**한 것이다. 페이지 간 styled 를 직접 import 하면 두 화면이 서로의 레이아웃 변경에
 * 묶이고(한쪽을 고치면 다른 쪽이 조용히 바뀐다) lazy 청크도 섞인다 — 캘린더가 세운 관례를 따른다.
 * 반대로 `StatTile`·`Banner`·`Button`·`Chip`·`InputField` 같은 **공용 프리미티브는 재사용**한다.
 */

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
  ${heroIconOpticalAlign}
`;

/** 이 페이지의 유일한 `<h1>`. */
export const HeroTitle = styled.h1`
  margin: 0;
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HeroLede = styled.p`
  margin: 0;
  width: 100%;
  font-size: clamp(${font.size.base}, 2vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/** 시세 기준일 · 환율 기준. "무엇을 근거로 계산했나"를 첫 화면에서 밝힌다. */
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

const cardSurface = `
  min-width: 0;
  display: grid;
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};
  box-shadow: ${elevation[1]};
`;

export const SummaryCard = styled.section`
  ${cardSurface}
`;

export const HoldingsCard = styled.section`
  ${cardSurface}
  gap: ${space[3]};
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 섹션 제목 + 오로라 리본. */
export const CardTitle = styled.h2`
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

/** 카드 제목 아래 한 줄(로컬 저장 고지). 제목과 경쟁하지 않게 한 단계 작고 흐리다. */
export const CardSubtitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/**
 * 타일 그리드. hero 슬롯은 전 폭을 차지한다.
 * jsdom은 `@media`를 평가하지 않으므로 반응형 분기는 **CSS만으로** 만든다(DOM은 한 벌).
 */
export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space[3]};

  ${media.down('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  display: grid;
`;

/**
 * 개념 구분 안내(월 평균 vs 이번 달). 경고가 아니라 **본문**이라 role 을 주지 않고,
 * 면(surfaceSunken)으로만 한 겹 눌러 둔다.
 */
export const NoteLine = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

/** 요약 하단의 "무엇이 빠졌는가" 줄. 대비가 검증된 warning/warningSurface 쌍만 쓴다. */
export const ExcludedNote = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${color.warningSurface};
  color: ${color.warning};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/** 버튼 아래 사유 1줄. **무음 비활성 금지** — 비활성 버튼 옆에는 언제나 이유가 있다. */
export const ActionHint = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/** 빈 상태도 하나의 화면이다 — 점선(미확정)에 브랜드 틴트를 얹어 "여기서 시작하라"로 읽히게 한다. */
export const EmptyStateCard = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 28px);
  border: 1px dashed ${color.brandBorder};
  border-radius: ${radius.xl};
  background: ${color.brandSubtle};
`;

export const EmptyTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
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

export const QuickPickItem = styled.li`
  display: inline-flex;
`;

/** 값이 오기 전 자리. 로딩임을 형태로 말한다(숫자를 지어내지 않는다). */
export const SkeletonBar = styled.span`
  display: inline-block;
  width: 96px;
  height: 1em;
  border-radius: ${radius.xs};
  background: ${color.surfaceMuted};
`;

/** 목록 자리의 로딩 골격. 실제 행 수를 모르므로 3줄만 세워 "곧 온다"만 말한다. */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: block;
  height: 44px;
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

/** 실행 취소 배너 내부 — 문장과 되돌리기 버튼을 한 줄에 둔다. */
export const UndoRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

/** 가정 요약 — 접힘. 면(surface)을 새로 만들지 않고 왼쪽 선 하나로 "부속 정보"임을 말한다. */
export const AssumptionsDetails = styled.details`
  border-left: 2px solid ${color.border};
  padding: 0 0 0 ${space[4]};
`;

export const AssumptionsSummary = styled.summary`
  cursor: pointer;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const AssumptionsBody = styled.div`
  display: grid;
  gap: ${space[3]};
  margin: ${space[3]} 0 0;
`;

export const TaxFieldSlot = styled.div`
  max-width: 200px;
`;

/**
 * 가정 요약 안의 두 번째 그룹 제목(예상 달성 시점 계산 조건).
 *
 * 접힘 블록을 새로 만들지 않고 **그룹 제목 한 줄**로 소속을 밝힌다 — 같은 라벨(배당소득세)이 두 번
 * 나와도 각 행이 자기 기준을 말하면 모순이 아니다. `h3`(카드 `h2` 아래 위계)로 두어 제목 목록에서도 읽힌다.
 */
export const AssumptionsGroupTitle = styled.h3`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
`;

export const AssumptionsGroupNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const ConditionsList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${space[2]} ${space[4]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const ConditionRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const ConditionTerm = styled.dt`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const ConditionValue = styled.dd`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

/** 각주 묶음 — 본문과 같은 무게로 나열되지 않게 한 덩어리로 눌러 둔다. */
export const FootNoteCard = styled.footer`
  display: grid;
  gap: ${space[1]};
  padding: ${space[3]} ${space[4]};
  border-left: 2px solid ${color.border};
`;

export const FootNoteTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const FootNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;
