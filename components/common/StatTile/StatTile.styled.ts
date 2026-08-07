import styled from '@emotion/styled';
import { color, font, iconSwapIn, motion, radius, space } from '@/shared/styles';
import type { StatEmphasis, StatStatus, StatTone } from './StatTile.types';

/**
 * 지표 타일.
 *
 * 고치려는 문제: 예전에는 "최종 자산 가치"(사용자가 이 앱을 켠 이유)와 "누적 세금"(부연 정보)이
 * **완전히 같은 카드·같은 글자 크기**였다. 위계가 없으면 사용자는 매번 6개를 다 읽어야 한다.
 *
 * 위계를 만드는 수단(색이 아니라 **크기·무게·기하**):
 *  - hero: 값 28~44px + 좌측 오로라 리본 + 1px 액센트 테두리. 한눈에 먼저 잡힌다.
 *  - default: 값 18px. 조용히 뒤로 물러난다.
 * 색은 방향성(상승/하락)에만 남겨둔다 — 색까지 위계에 쓰면 데이터의 색이 의미를 잃는다.
 *
 * 🔴 **hero 의 면은 중립이다** (2026-08-03 확정. 종전 accent-subtle 틴트 면을 내렸다.)
 * 이 타일이 사는 곳은 결과 요약·티커 허브·커뮤니티 목록 같은 **읽는 면(data)** 이고, 그런 면에는
 * 선·점·테두리 말고 채도면을 두지 않는다 — 숫자의 신뢰감이 거기서 무너진다. 시뮬레이터에서 이
 * 타일이 반납한 색면 예산은 **활성 시나리오 탭의 솔리드**(고르는 자리)가 받았다: 총량 불변, 위치 이동.
 * 남은 액센트는 1px 테두리와 4px 리본뿐이라 색면 예산에 잡히지 않는다(폭 180px·높이 8px 미만).
 * ⚠ **값(TileValue)은 여기 해당 없음** — 숫자에 accent·손익색을 쓰지 않는다는 규칙은 그대로다.
 */

const TONE: Record<StatTone, string> = {
  neutral: color.text,
  positive: color.dataPositive,
  negative: color.dataNegative
};

/**
 * **값이 크게 서는 단계인가**(hero · lead).
 *
 * 🔴 시그니처(리본 · 액센트 테두리 · hero 서체)와 **크기**를 가르는 축이다. `lead` 는 크기만
 * hero 를 따라가고 시그니처는 받지 않는다 — 근거는 `StatTile.types.ts` 의 emphasis 주석.
 */
const isBig = (emphasis: StatEmphasis): boolean => emphasis !== 'default';

export const TileRoot = styled.div<{ emphasis: StatEmphasis; status?: StatStatus }>`
  position: relative;
  min-width: 0;
  display: grid;
  gap: ${({ emphasis }) => (isBig(emphasis) ? space[1] : '2px')};
  align-content: start;
  border: 1px solid ${({ emphasis }) => (emphasis === 'hero' ? color.accentBorder : color.border)};
  /* 카드 안에 앉는 면(타일) = 동심 라운드의 '안쪽' 두 조 중 큰 쪽. 컨트롤(8px)과 달리 12px 이다.
     아래 리본·프로그레스의 pill 은 캡슐 형태 자체가 요건이라 이 결정과 무관하다(그대로 둔다). */
  border-radius: ${radius.md};
  /* 🔴 hero 도 중립 면이다 — 위 파일 주석의 "hero 의 면은 중립" 결정. 두 강조가 같은 면을 쓰고,
     위계는 값 크기(28~44px vs 18px) · 액센트 테두리 · 리본 · 패딩이 만든다. */
  background: ${color.surfaceMuted};
  padding: ${({ emphasis }) =>
    emphasis === 'hero'
      ? `${space[4]} ${space[4]} ${space[4]} ${space[5]}`
      : emphasis === 'lead'
        ? space[4]
        : space[3]};
  /*
   * 테두리를 전환 목록에 넣는다 — 상태('status')가 붙는 순간이 **이 타일의 유일한 연출**이라
   * 그 250ms 가 통째로 스냅이면 아무도 못 본다. 250ms 는 UI 전환 상한(300ms) 아래다.
   * reduced-motion 은 globalStyles 의 전역 규칙이 끈다(ProgressFill 과 같은 취급) —
   * 여기 미디어 게이트를 또 두지 않는다. keyframes 를 갖는 hero 모션만 게이트가 필요하다.
   */
  transition: border-color 250ms ${motion.ease};

  /*
   * 달성 상태. **틴트 면을 주지 않는다** — 면색은 계속 중립(surface-muted)이고 1px success
   * 테두리와 체크 글리프가 상태를 말한다. 이 화면(시뮬레이터 결과)에는 이미 히어로 그라디언트 ·
   * hero 타일 액센트 · 종합과세 경고가 서 있어서, 여기 성공 틴트를 얹으면 §2-6 상한(2개)을
   * 한 번에 두 칸 넘긴다 — Banner 의 info 톤과 목표 카드 성공 줄이 2026-07-31 에 같은
   * 이유로 면을 버렸고 이 타일만 예외일 근거가 없다(약한 톤 = 중립 면 + 1px 톤 테두리).
   * 값(TileValue)은 여전히 중립이다 — 숫자에 상태색을 넣지 않는다는 규칙은 예외가 없다.
   * 대비: success × surface-muted 를 contrast.test 가 16조합에서 강제한다.
   */
  ${({ status }) =>
    status === 'success'
      ? `
    border-color: ${color.success};
  `
      : ''}

  /* hero 타일의 좌측 오로라 리본 바 — 시그니처를 화면당 한 군데(주인공 지표)에만 쓴다. */
  ${({ emphasis }) =>
    emphasis === 'hero'
      ? `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: ${space[3]};
      bottom: ${space[3]};
      width: 4px;
      /*
       * 네 모서리 전부 pill = 폭 4px 의 **캡슐**. 오른쪽 두 곳만 pill 로 두면 안 된다 —
       * 브라우저는 한 변의 두 반경 합이 그 변보다 크면 반경을 비례 축소하므로
       * (실측: 4x85.2 박스, 선언 0/999/999/0 → 실효 0/4/4/0) **왼쪽이 완전히 각진 막대**가
       * 되어 12px 로 둥근 타일 위에 직사각형이 붙은 것처럼 보인다(사용자 신고, 2026-07-30).
       * 같은 4px 리본의 선례가 PortfolioPage/DividendCalendarPage 에 있고 둘 다 네 모서리 pill 이다.
       */
      border-radius: ${radius.pill};
      background: ${color.gradientAurora};
    }

    /*
     * hero 로드 모션(§5.1) — CSS animation이라 마운트 시 1회만 돈다.
     * 재계산으로 숫자가 바뀌어도 요소가 리마운트되지 않는 한 반복되지 않는다.
     * keyframes까지 no-preference 미디어 안에 두어 reduced-motion에서는 아예 정의되지 않는다.
     */
    @media (prefers-reduced-motion: no-preference) {
      animation: sb-stat-hero-enter 300ms ${motion.ease};

      &::before {
        transform-origin: top;
        animation: sb-stat-hero-bar 320ms ${motion.ease} 80ms backwards;
      }

      @keyframes sb-stat-hero-enter {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
      }

      @keyframes sb-stat-hero-bar {
        from {
          transform: scaleY(0);
        }
      }
    }
  `
      : `
    &:hover {
      border-color: ${color.borderStrong};
    }
  `};
`;

/**
 * 라벨 줄은 `div`가 아니라 `span`(flex)이다.
 *
 * 이유: 타일의 **가장 가까운 `div` 조상은 타일 루트여야 한다**. 라벨을 div로 감싸면
 * "라벨과 값이 같은 컨테이너에 있다"는 구조가 깨진다 — 실제로 앱 테스트가
 * `getByText(label).closest('div')`로 타일 전체를 읽어 값을 꺼낸다.
 */
export const TileLabelRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  width: 100%;
`;

/**
 * 상태 글리프(달성 ✓). 라벨 **왼쪽**에 앉아 "이 타일이 달라졌다"를 면색과 함께 말한다.
 *
 * `$enter` 일 때만 등장 모션이 돈다 — 이미 달성된 화면을 새로 고칠 때마다 재생되면
 * 그건 축하가 아니라 소음이다. "처음 달성한 그 순간"의 판정은 호출부가 소유한다.
 *
 * 🔴 색은 **면과 이 글리프까지**다. 값(TileValue)에는 상태색이 닿지 않는다.
 */
export const TileStatusGlyph = styled.span<{ $enter: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.success};

  svg {
    width: 14px;
    height: 14px;
  }

  ${({ $enter }) => ($enter ? iconSwapIn : '')}
`;

export const TileLabel = styled.span<{ emphasis: StatEmphasis }>`
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${({ emphasis }) => (isBig(emphasis) ? font.size.sm : font.size.xs)};
  font-weight: ${({ emphasis }) => (isBig(emphasis) ? font.weight.semibold : font.weight.medium)};
  /*
   * hero 라벨이 accent-text 가 아니라 text 인 이유: 면이 중립(surface-muted)으로 내려오면서
   * accent-text × surface-muted 는 contrast.test 가 재지 않는 조합이 된다. 검증된 쌍
   * (text × surface-muted)으로 되돌리고, 강조는 굵기(semibold)와 크기(sm)가 맡는다.
   */
  color: ${({ emphasis }) => (isBig(emphasis) ? color.text : color.textMuted)};
  line-height: ${font.leading.snug};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/*
 * 🔴 `<p>` 가 아니라 **display:block 인 span** 이다(2026-08-07). 잘렸을 때 `OverflowTooltip` 이 이
 * 요소를 툴팁 앵커(span)로 감싸는데, span 안의 `<p>` 는 유효하지 않은 중첩이다(span 은 구문 콘텐츠만
 * 담는다). 낭독 순서는 그대로다 — 라벨과 값은 여전히 별개의 블록으로 차례대로 읽힌다.
 */
export const TileValue = styled.span<{ emphasis: StatEmphasis; tone: StatTone }>`
  display: block;
  margin: 0;
  min-width: 0;
  /*
   * 서체로도 위계를 나눈다: hero 값만 heroNumeric(LINE Seed), 나머지는 dataNumeric(Inter).
   * hero 서체는 화면당 한 곳이어야 의미가 있다 — StatTile.types.ts의 hero 규칙과 같은 제약이다.
   */
  font-family: ${({ emphasis }) => (emphasis === 'hero' ? font.heroNumeric : font.dataNumeric)};
  /* hero도 값 색은 text 그대로 — 그라데이션 텍스트 금지(핵심 숫자의 가독이 시그니처보다 우선). */
  color: ${({ tone }) => TONE[tone]};
  font-weight: ${({ emphasis }) => (emphasis === 'hero' ? font.weight.extrabold : font.weight.bold)};
  line-height: ${font.leading.tight};
  letter-spacing: ${({ emphasis }) => (emphasis === 'hero' ? '-0.03em' : '-0.02em')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${font.numeric};

  /*
   * 🔴 **값은 우측정렬한다** (tabular-nums 와 한 쌍). 타일은 대부분 1fr 격자에 나란히 서므로
   * 좌측정렬이면 자릿수가 다른 값끼리 **마지막 자리가 어긋난다** — 금융 화면에서 안 맞는 숫자는
   * 그 자체로 신뢰를 깎는다. 우측 끝을 맞춰야 등폭 숫자가 비로소 하나의 열로 읽힌다.
   *
   * hero·lead 는 예외로 좌측이다: 값이 라벨 바로 아래 큰 글자로 서는 형태라 맞출 이웃이 없고,
   * 우측으로 보내면 라벨(과 hero 의 오로라 리본)에서 카드 폭만큼 떨어져 한 덩어리로 안 읽힌다.
   */
  text-align: ${({ emphasis }) => (isBig(emphasis) ? 'start' : 'end')};

  /*
   * hero·lead 는 화면 폭에 따라 자란다. 좁은 화면에서 숫자가 잘리지 않도록 clamp.
   * ⚠ lead 의 상한이 한 단 낮다 — 같은 줄에 hero 가 함께 서면 둘의 크기가 같아져 주역이 사라진다.
   *   국민연금 요약이 정확히 그 배치다(신고 총액 hero + 나머지 셋 lead).
   */
  font-size: ${({ emphasis }) =>
    emphasis === 'hero'
      ? `clamp(28px, 4vw, ${font.size['6xl']})`
      : emphasis === 'lead'
        ? `clamp(22px, 2.6vw, ${font.size['4xl']})`
        : font.size.lg};
`;

/**
 * 목표 달성 진행률 바(§4.4).
 *
 * `div`가 아니라 `span`인 이유: 타일의 가장 가까운 `div` 조상은 타일 루트여야 한다
 * (TileLabelRow 주석 참고 — 앱 테스트가 `closest('div')`로 타일 전체를 읽는다).
 * 색만으로 전달하지 않는다 — 호출부(StatTile.tsx)가 hint 문장을 반드시 병기한다.
 */
export const ProgressTrack = styled.span`
  display: block;
  width: 100%;
  height: 6px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.progressTrack};
`;

export const ProgressFill = styled.span`
  display: block;
  height: 100%;
  min-width: 6px;
  border-radius: ${radius.pill};
  /* 표시용 리본 — progress-track 위 stop 최저 대비 3.19:1(라이트)/6.01:1(다크). */
  background: ${color.gradientAurora};
  /* 재계산으로 달성률이 바뀔 때는 부드럽게 이동. reduced-motion 전역 규칙이 끈다. */
  transition: width ${motion.slow} ${motion.ease};

  /* 마운트 시 0 → 목표값으로 1회 차오른다(§5.2). to가 없으면 현재 폭이 종점이 된다. */
  @media (prefers-reduced-motion: no-preference) {
    animation: sb-stat-progress-fill ${motion.slow} ${motion.ease};

    @keyframes sb-stat-progress-fill {
      from {
        width: 0;
        min-width: 0;
      }
    }
  }
`;

/** 위 `TileValue` 와 같은 이유로 span 이다 — 잘리면 툴팁 앵커(span) 안에 들어간다. */
export const TileHint = styled.span<{ emphasis: StatEmphasis }>`
  display: block;
  margin: 0;
  min-width: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  /*
   * 'text-muted' 가 아닌 이유: 이 크기대에서 muted 는 여러 프리셋의 다크 모드가 AA 를 못 넘긴다
   * (2026-07-31 실측, velog 다크 4.05:1). 면이 중립으로 내려온 뒤에도 되돌리지 않는다 —
   * 위계는 크기(xs)와 굵기로 이미 충분히 낮고, 색까지 낮추면 못 읽는다.
   * 검증되는 쌍: shared/styles/contrast.test.ts 의 [text-secondary, surface-muted].
   */
  color: ${color.textSecondary};
  /* 값과 같은 끝선에 선다 — 값만 우측이고 부연이 좌측이면 타일 안에 축이 둘 생긴다. */
  text-align: ${({ emphasis }) => (isBig(emphasis) ? 'start' : 'end')};
  line-height: ${font.leading.snug};
  /*
   * 힌트에도 숫자가 산다("투자 3년차", ETA 기간) — 그래서 값(TileValue)과 같은 규칙을 건다.
   *
   * 본문 서체 Wanted Sans 의 기본 숫자는 **비례폭**이다(실측: '1'=880 / '0'=1280 units).
   * 즉 '1년차' → '4년차' 로 바뀔 때 글자폭이 실제로 달라지고, 이 줄은 'nowrap' + ellipsis 라
   * **말줄임 지점까지 같이 움직인다.** 이론이 아니라 31% 실측차다.
   */
  font-family: ${font.dataNumeric};
  ${font.numeric};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
