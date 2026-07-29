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
      /* 제목 줄 맨 오른쪽 — 좁은 폭에서도 "배당 시뮬레이터" 와 같은 줄에 남는다.
         넓은 화면에서는 결과적으로 "투자 설정" 바로 옆자리가 된다. */
      titleAction={
        <CaptureAction>
          <ResultCaptureButton
            isCapturing={capture.isCapturing}
            failure={capture.failure}
            onCapture={capture.captureResult}
            onDismissFailure={capture.dismissFailure}
          />
        </CaptureAction>
      }
      actions={
        <SettingsSlot
          ref={slotRef}
          $pinned={pinned}
          style={
            box
              ? ({
                  '--pin-left': `${box.left}px`,
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
            /* 투어 1단계의 앵커. 헤더 버튼이 사라졌으므로 이 버튼이 유일한 상시 진입점이자 앵커다
               (앵커가 없으면 투어는 그 단계를 **조용히** 건너뛴다 — test/main/tourAnchors.test.tsx 가 지킨다). */
            dataTour={TOUR_TARGET.openSettings}
          />
        </SettingsSlot>
      }
    />
  );
}

const SimulatorHero = memo(SimulatorHeroComponent);

export default SimulatorHero;
