import { memo } from 'react';
import { LineChart } from 'lucide-react';
import { PageHero } from '@/components/common';
import SettingsEntryButton from '@/pages/Main/components/SettingsEntryButton';
import { useDisplayCurrencyViewAtomValue } from '@/jotai';
import { SIMULATOR_COPY } from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
import type { SimulatorHeroProps } from './SimulatorHero.types';

/**
 * 시뮬레이터 히어로. 공용 `PageHero` 를 그대로 소비한다 — 이 화면만 다른 히어로를 쓰면
 * 페이지를 옮길 때마다 "어디를 봐야 하는지"를 다시 배우게 된다.
 *
 * 제목 레벨은 기본값 `h2` 다. `h1` 은 헤더 워드마크가 갖는다(확정 결정).
 *
 * `meta` 는 **표시 통화가 달러일 때만** 렌더한다 — 시세 기준일은 푸터(`MarketDataAsOf`)가,
 * 환율 위젯은 드로어가 이미 소유하고 있어 원화 모드에서는 여기 적을 새로운 근거가 없다.
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

  return (
    <PageHero
      icon={<LineChart size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
      title={SIMULATOR_COPY.heroTitle}
      lede={SIMULATOR_COPY.heroLede}
      meta={meta}
      actions={
        <SettingsEntryButton
          variant="hero"
          drawerId={drawerId}
          isOpen={isSettingsOpen}
          onOpen={onOpenSettings}
        />
      }
    />
  );
}

const SimulatorHero = memo(SimulatorHeroComponent);

export default SimulatorHero;
