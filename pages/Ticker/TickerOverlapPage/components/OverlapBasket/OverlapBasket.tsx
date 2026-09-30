import { useId } from 'react';
import { X } from 'lucide-react';
import { ICON } from '@/shared/styles';
import { TICKER_OVERLAP_COPY } from '../../../copy';
import { MAX_OVERLAP_ETFS } from '../../../utils';
import { PickSurface, SurfaceCount, SurfaceHead, SurfaceTitle, VisuallyHidden } from '../../styled';
import type { OverlapBasketProps } from './OverlapBasket.types';
import { Slot, SlotBody, SlotGhost, SlotGrid, SlotMeta, SlotRemove, SlotTicker } from './OverlapBasket.styled';

const copy = TICKER_OVERLAP_COPY;

/** 바구니 — 비교 화면의 덱과 같은 모양. 빈 자리가 남은 개수를 도형으로 말한다. */
export default function OverlapBasket({ slots, seriesOf, onRemove }: OverlapBasketProps) {
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
    </PickSurface>
  );
}
