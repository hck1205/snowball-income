import { useId } from 'react';
import { X } from 'lucide-react';
import { ICON } from '@/shared/styles';
import { TICKER_OVERLAP_COPY } from '../../../copy';
import { Button } from '@/components/common';
import {
  MAX_OVERLAP_ETFS,
  OVERLAP_WEIGHT_MAX,
  OVERLAP_WEIGHT_MIN,
  OVERLAP_WEIGHT_STEP,
  formatPercent
} from '../../../utils';
import { PickSurface, SeriesDot, SurfaceCount, SurfaceHead, SurfaceTitle, VisuallyHidden } from '../../styled';
import type { OverlapBasketProps } from './OverlapBasket.types';
import {
  Slot,
  SlotBody,
  SlotGhost,
  SlotGrid,
  SlotMeta,
  SlotRemove,
  SlotTicker,
  WeightHead,
  WeightHint,
  WeightList,
  WeightRow,
  WeightSlider,
  WeightTicker,
  WeightTitle,
  WeightValue
} from './OverlapBasket.styled';

const copy = TICKER_OVERLAP_COPY;

/**
 * 바구니 — 비교 화면의 덱과 같은 모양. 빈 자리가 남은 개수를 도형으로 말한다.
 * 둘 이상 담으면 아래에 **비중** 슬라이더가 선다. 슬라이더 값은 상대 비중이고, 옆 숫자는 합이 100% 인 몫이다.
 */
export default function OverlapBasket({
  slots,
  seriesOf,
  isEqualWeight,
  onRemove,
  onWeightChange,
  onEqualize
}: OverlapBasketProps) {
  const baseId = useId();
  const emptySlotCount = Math.max(0, MAX_OVERLAP_ETFS - slots.length);

  return (
    <PickSurface aria-labelledby={`${baseId}-title`}>
      <SurfaceHead>
        <SurfaceTitle id={`${baseId}-title`}>{copy.basket.title}</SurfaceTitle>
        <SurfaceCount>
          <VisuallyHidden>{copy.basket.countLabel} </VisuallyHidden>
          {copy.basket.count(slots.length)}
        </SurfaceCount>
      </SurfaceHead>
      <SlotGrid aria-label={copy.basket.slotsLabel}>
        {slots.map((slot) => (
          <Slot key={slot.ticker} $series={seriesOf(slot.ticker)}>
            <SlotBody>
              <SlotTicker>{slot.ticker}</SlotTicker>
              <SlotMeta>
                {slot.status === 'loading'
                  ? copy.basket.loading
                  : slot.status === 'error'
                    ? copy.basket.loadError
                    : slot.asOfDate}
              </SlotMeta>
            </SlotBody>
            <SlotRemove type="button" aria-label={copy.picker.removeAria(slot.ticker)} onClick={() => onRemove(slot.ticker)}>
              <X size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
            </SlotRemove>
          </Slot>
        ))}
        {Array.from({ length: emptySlotCount }, (_, index) => (
          <SlotGhost key={`ghost-${index}`} aria-hidden>
            {copy.basket.emptySlot}
          </SlotGhost>
        ))}
      </SlotGrid>

      {slots.length >= 2 ? (
        <>
          <WeightHead>
            <WeightTitle id={`${baseId}-weights`}>{copy.basket.weightTitle}</WeightTitle>
            <Button variant="ghost" size="sm" disabled={isEqualWeight} onClick={onEqualize}>
              {copy.basket.equalize}
            </Button>
          </WeightHead>
          <WeightList aria-labelledby={`${baseId}-weights`}>
            {slots.map((slot) => (
              <WeightRow key={slot.ticker}>
                <WeightTicker>
                  <SeriesDot $series={seriesOf(slot.ticker)} aria-hidden />
                  {slot.ticker}
                </WeightTicker>
                <WeightSlider
                  type="range"
                  min={OVERLAP_WEIGHT_MIN}
                  max={OVERLAP_WEIGHT_MAX}
                  step={OVERLAP_WEIGHT_STEP}
                  value={slot.weight}
                  aria-label={copy.basket.weightAria(slot.ticker)}
                  aria-valuetext={copy.basket.weightValue(formatPercent(slot.share))}
                  $series={seriesOf(slot.ticker)}
                  onChange={(event) => onWeightChange(slot.ticker, Number(event.target.value))}
                />
                <WeightValue aria-hidden>{copy.basket.weightValue(formatPercent(slot.share))}</WeightValue>
              </WeightRow>
            ))}
          </WeightList>
          <WeightHint>{copy.basket.weightHint}</WeightHint>
        </>
      ) : null}
    </PickSurface>
  );
}
