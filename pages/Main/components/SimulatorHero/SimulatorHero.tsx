import { memo, type CSSProperties } from 'react';
import { LineChart } from 'lucide-react';
import { PageHero } from '@/components/common';
import SettingsEntryButton from '@/pages/Main/components/SettingsEntryButton';
import ResultCaptureButton from '@/pages/Main/components/ResultCaptureButton';
import { useResultCapture, useStickyHeroAction } from '@/pages/Main/hooks';
import { useDisplayCurrencyViewAtomValue } from '@/jotai';
import { SIMULATOR_COPY, TOUR_TARGET } from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
import { CaptureAction, SettingsSlot } from './SimulatorHero.styled';
import type { SimulatorHeroProps } from './SimulatorHero.types';

/**
 * 시뮬레이터 히어로. 공용 `PageHero` 를 그대로 소비한다 — 이 화면만 다른 히어로를 쓰면
 * 페이지를 옮길 때마다 "어디를 봐야 하는지"를 다시 배우게 된다.
 *
 * 제목 레벨은 기본값 `h2` 다. `h1` 은 헤더 워드마크가 갖는다(확정 결정).
 *
 * `meta` 는 **표시 통화가 달러일 때만** 렌더한다 — 시세 기준일은 푸터(`MarketDataAsOf`)가,
 * 환율 위젯은 드로어가 이미 소유하고 있어 원화 모드에서는 여기 적을 새로운 근거가 없다.
 *
 * 설정 진입 버튼은 제목 **우측**(히어로 액션 슬롯)에 있고, 스크롤로 히어로가 헤더 위로 올라가면
 * 같은 버튼이 헤더 아래에 고정된다(`useStickyHeroAction`). 그래서 헤더에 중복 진입점을 둘 필요가
 * 없어졌다 — 헤더의 구 "설정 열기" 버튼은 2026-07-29 에 삭제됐다.
 */
function SimulatorHeroComponent({ drawerId, isSettingsOpen, onOpenSettings }: SimulatorHeroProps) {
  /* 환율 조회·선호 통화에만 반응하는 파생 atom이라 폼 타건으로는 값이 바뀌지 않는다.
     `currency`는 환율이 없으면 원화로 떨어지는 **적용** 통화라 USD면 rate는 항상 있지만,
     타입상 null 가능이므로 근거 문장을 못 만들면 meta 자체를 렌더하지 않는다. */
  const display = useDisplayCurrencyViewAtomValue();
  const meta =
    display.currency === 'USD' && display.rate !== null
      ? `달러로 표시 중 · ${formatKRW(display.rate)} 기준`
      : undefined;

  const { slotRef, pinned, box } = useStickyHeroAction();

  /*
   * 결과 **이미지 저장**. 이 훅은 설계상 어떤 폼 원자도 구독하지 않으므로(시나리오 이름은 클릭 시점
   * 스냅샷) 히어로에서 불러도 타건 리렌더가 번지지 않는다.
   *
   * 결과가 없을 때를 따로 막지 않는다 — 파이프라인이 "저장할 결과가 아직 없습니다…" 안내를
   * 그 자리에서 띄운다(`resultCaptureError`). 조건부로 버튼을 숨기면 히어로 액션 줄의 폭이
   * 결과 유무에 따라 흔들린다.
   */
  const capture = useResultCapture();

  return (
    <PageHero
      icon={<LineChart size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
      title={SIMULATOR_COPY.heroTitle}
      lede={SIMULATOR_COPY.heroLede}
      meta={meta}
      /*
       * ── 두 액션이 **한 슬롯**에 있다 (2026-08-17 사용자 지시: 캡처와 투자 설정 위치를 맞바꿔라) ──
       *
       * 순서가 `[캡처][투자 설정]` 이라 **투자 설정이 줄의 맨 오른쪽**이다. 종전에는 캡처가
       * `titleAction`(제목 줄 전용 슬롯)에 있어서 설정보다 오른쪽에 섰다.
       *
       * 🔴 왜 `titleAction` 을 안 쓰고 둘을 같은 슬롯에 넣었나 — 보이는 순서와 **DOM·포커스 순서가
       *    일치해야** 한다. 두 슬롯은 `actions` → `titleAction` 순으로 렌더되므로, 슬롯을 그대로 두고
       *    화면에서만 뒤집으면 탭 이동이 눈으로 보는 순서와 어긋난다.
       * ⚠ 대가를 알고 고른 것이다: `titleAction` 은 **어느 폭에서도 제목 줄에 남는** 슬롯이라,
       *   캡처 버튼이 ≤640 에서 제목 줄을 떠나 설정 버튼과 함께 아래 줄로 내려간다
       *   (2026-07-29 에 "좁은 화면에서도 제목 옆자리를 지킨다"고 정했던 것을 사용자 결정으로 바꿨다).
       *   되돌리려면 이 주석의 순서 문제(포커스 순서)를 먼저 해결하라.
       */
      actions={
        <>
          <CaptureAction>
            <ResultCaptureButton
              isCapturing={capture.isCapturing}
              failure={capture.failure}
              onCapture={capture.captureResult}
              onDismissFailure={capture.dismissFailure}
            />
          </CaptureAction>
          <SettingsSlot
            ref={slotRef}
            $pinned={pinned}
            /*
             * 🔴 `headerprobe` 가 이 표식으로 승격 버튼을 **정확히** 집는다(랜딩의 `data-landing-cta` 와 같은 방식).
             *
             * 예전에는 프로브가 "화면의 모든 `position: fixed` 버튼"을 승격 액션으로 셌다. 그러다
             * 화면 **아래**에 있어야 할 "맨 위로"(ScrollTopButton)도 fixed 라 함께 잡혀, 5개 라우트가
             * "헤더에서 775px 떨어져 있다"며 늘 빨간불이었다 — 늘 실패하는 가드는 아무도 안 본다.
             * 반대 방향의 위험이 더 컸다: 다른 fixed 버튼이 우연히 헤더 밑 8px 에 서 있으면 승격이
             * 죽었어도 **검사가 통과**한다. 표식으로 집으면 둘 다 사라진다.
             *
             * ⚠ 지우거나 이름을 바꾸면 프로브의 4번 검사가 "요소 0건"으로 실패한다(조용히 통과하지
             *   않는다 — 그게 의도다). tools/dev/headerprobe.mjs 의 STICKY_HERO_ACTION_SELECTOR 와 한 쌍이다.
             */
            data-hero-action="settings"
            data-pinned={pinned ? 'true' : 'false'}
            style={
              box
                ? ({
                    /* 좌측이 아니라 **우측**을 못 박는다 — 붙는 순간 아이콘만 남아 폭이 줄기 때문이다
                       (근거는 `useStickyHeroAction` 의 `right` 필드 주석). */
                    '--pin-right': `${box.right}px`,
                    '--pin-width': `${box.width}px`,
                    '--pin-height': `${box.height}px`,
                    '--pin-top': `${box.top}px`
                  } as CSSProperties)
                : undefined
            }
          >
            <SettingsEntryButton
              variant="hero"
              drawerId={drawerId}
              isOpen={isSettingsOpen}
              onOpen={onOpenSettings}
              /* 고정되면 라벨을 접고 톱니만 남긴다(사용자 지시 2026-08-17). 붙는 자리가 시나리오 탭 바와
                 같은 띠라 폭이 귀하다 — 접근성 이름은 `aria-label` 로 유지된다. */
              iconOnly={pinned}
              /* 투어 1단계의 앵커. 헤더 버튼이 사라졌으므로 이 버튼이 유일한 상시 진입점이자 앵커다
                 (앵커가 없으면 투어는 그 단계를 **조용히** 건너뛴다 — test/main/tourAnchors.test.tsx 가 지킨다). */
              dataTour={TOUR_TARGET.openSettings}
            />
          </SettingsSlot>
        </>
      }
    />
  );
}

const SimulatorHero = memo(SimulatorHeroComponent);

export default SimulatorHero;
