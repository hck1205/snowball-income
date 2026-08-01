import styled from '@emotion/styled';
import { cardElevation, color, font, iconFirstLineAlign, media, radius, space } from '@/shared/styles';

/**
 * 보유 목록 카드와 **같은 본문 면**(`cardElevation('base')` · radius.xl)이다. 주역은 이 화면에서
 * 요약 카드("지금 받는 배당") 하나뿐이라 목표 카드는 한 단계 아래에 선다 — 예전에는 세 카드가
 * 모두 테두리 + `elevation[1]` 을 함께 갖고 있어서 위계가 **내용물에만** 있었고, 훑어볼 때는
 * 셋이 같은 무게로 보였다.
 *
 * 페이지의 `PortfolioPage.styled` 를 가져다 쓰지 않고 여기에 **복제**한다: 컴포넌트가 페이지 styled 를
 * 직접 import 하면 `페이지 → 컴포넌트 → 페이지` 순환이 생긴다(카피를 형제 폴더에 둔 이유와 같다).
 * 복제되는 것은 **기하**뿐이고 위계 선언은 `shared/styles` 한 곳에서 온다.
 */
export const CardRoot = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border-radius: ${radius.xl};
  ${cardElevation('base')}
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 섹션 제목 + 오로라 리본(요약·보유 카드와 같은 어법). */
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
 *  - `warning`(미도달) → 틴트 면 유지. 아직 할 일이 남았다는 신호라 눈에 띄어야 한다.
 * 왜 이 카드까지: `DESIGN.md` §2-6 의 "한 화면에 틴트 면 최대 2개"는 **컴포넌트가 아니라 화면**에
 * 걸리는 상한이라, 배너만 고쳐도 이 줄이 히어로·빈 상태 보드와 겹치면 다시 넘는다
 * (실측 도구 `tools/dev/tintscan.mjs`).
 * ⚠ 부품을 공유하지 않는 이유: 이건 배너가 아니라 카드 안 한 줄이다(role 없음 — 진입마다 낭독되면 소음).
 *
 * 대비가 검증된 쌍만 쓴다 — `success/surface`(최저 5.22:1) · `success/successSurface` ·
 * `warning/warningSurface`. 앞의 둘은 `shared/styles/contrast.test.ts` 의 순회 목록에 있다.
 */
export const StatusLine = styled.p<{ tone: 'success' | 'warning' }>`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${({ tone }) => (tone === 'success' ? color.success : color.warning)};
  border: 1px solid ${({ tone }) => (tone === 'success' ? color.success : 'transparent')};
  background: ${({ tone }) => (tone === 'success' ? color.surface : color.warningSurface)};

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
