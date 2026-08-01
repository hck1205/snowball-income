import styled from '@emotion/styled';
import {
  cardElevation,
  color,
  font,
  iconFirstLineAlign,
  media,
  radius,
  space
} from '@/shared/styles';

/**
 * 이 파일의 타일 그리드·빈 상태·조건 요약·각주는 **배당 캘린더 페이지와 같은 모양**을
 * 의도적으로 **복제**한 것이다. 페이지 간 styled 를 직접 import 하면 두 화면이 서로의 레이아웃 변경에
 * 묶이고(한쪽을 고치면 다른 쪽이 조용히 바뀐다) lazy 청크도 섞인다 — 캘린더가 세운 관례를 따른다.
 * 반대로 `StatTile`·`Banner`·`Button`·`Chip`·`InputField` 같은 **공용 프리미티브는 재사용**한다.
 *
 * ⚠ **히어로는 이 복제 규칙의 예외**다 — 두 페이지가 같은 자리에서 같은 것을 말해야 하는 유일한
 *   블록이라 2026-07-31 에 공용 `PageHero` 한 벌로 수렴했다(아래 주석 참고).
 */

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/*
 * 히어로는 여기 없다 — 2026-07-31 에 **공용 `components/common/PageHero` 로 수렴**했다.
 * 구 로컬 `PageHero`/`HeroTitleRow`/`HeroIconBadge`/`HeroTitle`/`HeroLede`/`AsOfLine` 은
 * 각각 컴포넌트의 루트 / 내부 구조 / `icon` / `title`+`titleAs` / `lede` / `meta` 슬롯이 받는다.
 * 페이지 얼굴색(그린)은 라우트가 발행하는 `--sb-page-hue` 가 준다(`shared/hooks/usePageHue`).
 * 되살리지 마라 — 같은 심볼명을 export 하는 복제본은 import 경로로만 구분돼 grep 이 못 가른다.
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
 * 카드의 **기하**만 담는다 — 배경·테두리·그림자(위계)는 `cardElevation` 이 층별로 준다.
 * 예전에는 세 카드가 전부 `border` + `elevation[1]` 을 함께 갖고 있어서 **같은 무게**로 보였다.
 */
const cardGeometry = `
  min-width: 0;
  display: grid;
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border-radius: ${radius.xl};
`;

/**
 * 이 화면의 **주역 카드**(화면당 하나) — hero 타일(`emphasis="hero"`)을 가진 바로 그 카드다.
 * 주역 카드와 hero 타일이 갈라지면 눈이 두 곳을 본다.
 */
export const SummaryCard = styled.section`
  ${cardGeometry}
  ${cardElevation('raised')}
`;

export const HoldingsCard = styled.section`
  ${cardGeometry}
  ${cardElevation('base')}
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
/**
 * 인포 아이콘 + 여러 줄 설명. 아이콘은 **문단 가운데가 아니라 첫 줄**에 맞춘다
 * (`align-items: center` 는 두 줄 이상에서 아이콘을 문단 한복판으로 내린다).
 * 보정값은 손으로 적은 `margin-top: 2px` 대신 공용 `iconFirstLineAlign` 이 글자 크기·행간에서 계산한다.
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
    ${iconFirstLineAlign(font.size.xs, font.leading.snug)}
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

/**
 * 빈 상태도 하나의 화면이다 — 점선(미확정)에 틴트를 얹어 "여기서 시작하라"로 읽히게 한다.
 * 틴트는 **accent**다: 이 카드 안에 브랜드 솔리드 CTA("종목 추가")가 서기 때문에, 바탕까지
 * 브랜드면 정작 눌러야 할 버튼이 같은 색 위에 묻힌다(면=크롬, 버튼=액션).
 */
export const EmptyStateCard = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 28px);
  border: 1px dashed ${color.accentBorder};
  border-radius: ${radius.xl};
  background: ${color.accentSubtle};
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

/**
 * 가계부 진입 카드의 본문.
 *
 * 🔴 `Card` 의 `subtitle` 로 넘기지 마라 — `CardSubtitle` 은 12px/textMuted 캡션이라 두 줄짜리
 * 설명문에는 너무 작다(`Card.styled.ts:102-108`). ⚠ `CardContainer` 는 grid 가 아니라 일반 블록이라
 * (gap 없음) 본문과 버튼 사이 간격은 이 마진이 만든다.
 */
export const EntryBody = styled.p`
  margin: 0 0 ${space[4]};
  max-width: 52ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
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

/*
 * 가정 요약(세율 입력 + 계산 조건 + 목표 조건 그룹)의 스타일은
 * `PortfolioPage/components/PortfolioAssumptions`로 옮겼다 — 그 섹션에서만 쓰이고
 * 페이지의 다른 카드와 토큰을 공유하지 않아 완전히 독립적으로 잘라낼 수 있었다.
 */

/*
 * 각주 묶음(구 `FootNoteCard`/`FootNoteTitle`/`FootNote`)은 **공용 `components/common/PageFooter` 로
 * 수렴했다**(2026-07-31). 시뮬레이터·캘린더·티커 허브와 같은 자리·같은 모양이 되었고, 이 화면의
 * 각주 문구는 그 컴포넌트의 `notes` 슬롯으로 **원문 그대로** 들어간다(면책 문구는 합치지 않는다).
 * 다시 로컬로 복제하지 마라 — 히어로가 세 벌이었던 것과 같은 경로다.
 */

/**
 * 히어로의 **다음 배당 D-Day** 한 줄. `PageHero` 의 `notice` 슬롯(= `<p role="note">`) 안에 들어가므로
 * **인라인 요소만** 쓴다(문단 안에 블록을 넣으면 브라우저가 문단을 끊는다).
 */
export const DDayLine = styled.span`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * D-Day 수치.
 *
 * 🔴 **색을 넣지 않는다.** 이 앱에서 색이 붙은 숫자는 손익(빨강=상승/파랑=하락)을 뜻하는데
 * 남은 일수는 손익이 아니다. 위계는 **데이터 서체 + 굵기 + 면색**으로만 만든다
 * (`color.text` 는 검증된 중립 토큰이고, 면은 히어로 배경 위 `surfaceSunken` 이다).
 */
export const DDayValue = styled.strong`
  padding: 2px ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const DDayTickers = styled.span`
  color: ${color.textSecondary};
`;

/**
 * 수치와 종목 사이의 가운뎃점. `aria-hidden` 으로 낭독에서 뺀다 — 스크린리더가 "가운뎃점"을 읽으면
 * 짧은 문장 하나가 세 조각으로 끊긴다(요소 경계만으로도 이미 쉼이 생긴다).
 */
export const DDaySeparator = styled.span`
  color: ${color.textMuted};
`;
