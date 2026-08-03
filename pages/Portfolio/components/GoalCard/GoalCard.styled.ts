import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  cardElevation,
  color,
  font,
  iconFirstLineAlign,
  media,
  radius,
  sectionTitleFontSize,
  space
} from '@/shared/styles';

/**
 * 보유 목록 카드와 **같은 본문 면**(`cardElevation('base')` · `DATA_RADIUS`)이다. 주역은 이 화면에서
 * 요약 카드("지금 받는 배당") 하나뿐이라 목표 카드는 한 단계 아래에 선다 — 예전에는 세 카드가
 * 모두 테두리 + `elevation[1]` 을 함께 갖고 있어서 위계가 **내용물에만** 있었고, 훑어볼 때는
 * 셋이 같은 무게로 보였다.
 *
 * 페이지의 `PortfolioPage/styled` 를 가져다 쓰지 않고 여기에 **복제**한다: 컴포넌트가 페이지 styled 를
 * 직접 import 하면 `페이지 → 컴포넌트 → 페이지` 순환이 생긴다(카피를 형제 폴더에 둔 이유와 같다).
 * 복제되는 것은 **기하**뿐이고 위계 선언은 `shared/styles` 한 곳에서 온다.
 */
/**
 * 🔴 **이 화면의 서사적 정점.** 세 카드 중 유일하게 **왼쪽 6px 세로 레일**을 갖는다 —
 * 훑어보는 눈이 "여기가 목표 이야기"를 카드를 읽기 전에 잡게 하는 표식이다.
 *
 * 레일이 면 예산을 안 먹는 이유: `tintscan` 의 면 판정은 폭 ≥180px **AND** 높이 ≥8px 인데
 * 이 띠는 폭 6px 이다(`PICK.railHeight` 와 같은 값·같은 논리 — 두께로 "선"에 남는다).
 * 🔴 6px 을 두 자릿수로 키우지 마라. 색은 `accentAlt`(목표·추천 축)이고, 도달 여부는
 * 색이 아니라 카드 머리의 배지와 상태 줄이 말한다.
 */
export const CardRoot = styled.section`
  position: relative;
  min-width: 0;
  display: grid;
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  padding-left: clamp(22px, 2.4vw, 34px);
  /* 읽는 면(data)의 반경 — 페이지의 다른 두 카드와 같은 대역이다(cardGeometry 와 한 값). */
  border-radius: ${DATA_RADIUS};
  overflow: hidden;
  ${cardElevation('base')}

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 6px;
    background: ${color.accentAlt};
  }
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 제목 + 상태 배지를 한 덩어리로 묶는다(우측 액션 버튼과 갈라놓는다). */
export const CardTitleGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 섹션 제목 — 4px 오로라 리본에서 **아이콘 배지**로 바뀌었다(요약·보유 카드와 같은 어법).
 * 배지 한 변 30px 이라 면으로 세어지지 않고, 카드마다 다른 아이콘이 "무슨 카드인가"를 글리프로 말한다.
 */
export const CardTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  /* 전 페이지 공통 규칙(2026-07-29) — 카드마다 다른 축소 곡선을 두지 않는다. 페이지의 다른
     두 카드 제목과 **같은 함수**에서 나온다(구 고정 16px 은 그 규칙 밖에 있었다). */
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const CardTitleBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: ${radius.md};
  background: ${color.identitySubtle};
  color: ${color.identityText};
`;

/**
 * 도달/미도달 **배지**. 상태 줄과 같은 사실을 한 낱말로 말한다 — 훑어보는 눈은 문장을 안 읽는다.
 *
 * 🔴 색은 거들 뿐이다: 배지에는 언제나 **글자**가 있고(`goal.badge.*`), 회색조에서도 테두리와
 * 문구로 구분된다. 면(틴트)을 주지 않고 1px 테두리만 쓰는 이유는 `Banner`·`StatusLine` 이 세운
 * 규칙과 같다 — 면은 강한 톤에만, 그리고 이 화면의 면 예산은 이미 히어로가 쓰고 있다.
 */
export const StateBadge = styled.span<{ tone: 'success' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ tone }) => (tone === 'success' ? color.success : color.warning)};
  color: ${({ tone }) => (tone === 'success' ? color.success : color.warning)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }
`;

/**
 * 타일 그리드. jsdom 은 `@media` 를 평가하지 않으므로 반응형 분기는 **CSS만으로** 만든다(DOM 은 한 벌).
 * 브레이크포인트는 요약 카드의 `TileGrid` 와 동일하게 맞춰 두 카드의 열이 같은 폭에서 함께 접힌다.
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

/**
 * 기준 안내 한 줄 — **경고가 아니라 본문**이다. 그래서 `role` 을 주지 않고(진입마다 낭독되면 소음),
 * warning/danger 톤도 쓰지 않는다. 면(surfaceSunken)으로만 한 겹 눌러 둔다.
 *
 * 문장이 길면 인라인 액션이 아래 줄로 자연스럽게 내려간다(`flex-wrap` + 텍스트의 `flex: 1 1 240px`).
 */
export const BasisNote = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};

  /* 아이콘은 문단 가운데가 아니라 **첫 줄**에 맞춘다 — 보정은 공용 유틸이 글자 크기·행간에서 계산한다. */
  svg {
    ${iconFirstLineAlign(font.size.xs, font.leading.snug)}
  }
`;

export const BasisNoteText = styled.span`
  flex: 1 1 240px;
  min-width: 0;
`;

/**
 * 도달/미도달 한 줄. **색 단독 금지** — 아이콘·문장·색 세 겹으로 같은 사실을 말한다.
 *
 * 🔴 **두 톤의 표현이 다르다 — 실수가 아니다.** `components/common/Banner` 가 세운 규칙과 같다:
 * **면(틴트)은 강한 톤에만 준다.**
 *  - `success`(도달) → 중립 면(`surface`) + 1px `success` 테두리. 좋은 소식은 면을 차지할 이유가 없다.
 *  - `warning`(미도달) → 중립 면(`surface-muted`) + **3px** `warning` 왼쪽 선. 강조는 선 두께가
 *    success(1px)의 3배라는 사실이 만든다.
 * 왜 이 카드까지: `DESIGN.md` §2-6 의 "한 화면에 틴트 면 최대 2개"는 **컴포넌트가 아니라 화면**에
 * 걸리는 상한이라, 배너만 고쳐도 이 줄이 히어로·푸터와 겹치면 다시 넘는다
 * (실측 도구 `tools/dev/tintscan.mjs`).
 * ⚠ 부품을 공유하지 않는 이유: 이건 배너가 아니라 카드 안 한 줄이다(role 없음 — 진입마다 낭독되면 소음).
 *
 * ## 2026-08-03 — warning 틴트 면을 **중립 면 + 굵은 왼쪽 선**으로 내렸다
 * 종전 `warningSurface` 면은 카드 전폭(1280px 기준 700px 대)이라 면 판정(폭 ≥180 AND 높이 ≥8)을
 * 넘겼다. 이 화면의 예산 2 는 히어로와 푸터가 이미 다 쓰고 있어서 **미도달 상태가 곧 초과**였다
 * (기본 tintscan 이 빈 상태만 재는 바람에 잡히지 않았다). 색은 사라지지 않았다 — 선·글자·아이콘
 * 셋이 여전히 같은 사실을 말한다(색 단독 금지 유지).
 *
 * 대비: `success/surface`(최저 5.22:1)는 `shared/styles/contrast.test.ts` 순회 목록에 있다.
 * ⚠ `warning on surface-muted` 는 그 목록에 **없는 쌍**이라 실측을 여기 남긴다 — 8프리셋 ×
 * 라이트/다크 전수 **최저 4.88:1**(ink/light)로 AA 통과. 같은 조건에서 `warning on surface` 는 5.10,
 * `warning on surface-sunken` 은 **4.18 로 미달**이라 쓰지 않았다(2026-08-03 실측).
 */
export const StatusLine = styled.p<{ tone: 'success' | 'warning' }>`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.lg};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${({ tone }) => (tone === 'success' ? color.success : color.warning)};
  border: 1px solid ${({ tone }) => (tone === 'success' ? color.success : 'transparent')};
  border-left: ${({ tone }) => (tone === 'success' ? `1px solid ${color.success}` : `3px solid ${color.warning}`)};
  background: ${({ tone }) => (tone === 'success' ? color.surface : color.surfaceMuted)};

  svg {
    flex: 0 0 auto;
  }
`;

/** 상태 문장 다음 줄의 행동 버튼. 좁은 폭에서는 자연스럽게 아래로 내려온다. */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;
