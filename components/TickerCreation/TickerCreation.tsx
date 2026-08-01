import { memo } from 'react';
import { Card } from '@/components';
import { TOUR_TARGET } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import type { TickerCreationProps } from './TickerCreation.types';
import {
  HintText,
  TickerChipWrap,
  TickerCreateButton,
  TickerGearButton,
  TickerGridWrap,
  TickerItemButton,
  TickerList
} from '@/components/common';

/**
 * 설정 드로어의 **첫 섹션 — 종목**. 담긴 티커 칩 목록과 "티커 생성"(추가) 하나만 있다.
 *
 * 2026-07-31 재배치: 공유 버튼과 환율 위젯은 여기서 나갔다(→ 드로어 마지막 "도구" 섹션).
 * 이 카드는 이제 한 가지만 말한다 — 무엇을 담을 것인가.
 *
 * 순서도 뒤집혔다. **칩이 먼저, 추가 버튼이 그 다음**이다. 종전에는 전폭 그라디언트 CTA 가 목록 위에
 * 앉아 드로어에서 가장 강한 요소였는데, 실제로 자주 하는 일은 "이미 만든 종목을 담고 빼는" 쪽이다.
 * (버튼의 시각 강도도 그라디언트 채움 → 담백한 외곽선으로 내렸다. 자리와 강도를 함께 낮춘다.)
 */
function TickerCreationComponent({
  topContent,
  tickerProfiles,
  includedTickerIds,
  onOpenCreate,
  onTickerClick,
  onTickerPressStart,
  onTickerPressEnd,
  onOpenEdit
}: TickerCreationProps) {
  return (
    <Card title="종목">
      {topContent}
      {tickerProfiles.length === 0 ? (
        <HintText>아직 생성된 티커가 없습니다.</HintText>
      ) : (
        <TickerGridWrap>
          <TickerList>
            {tickerProfiles.map((profile) => (
              <li key={profile.id}>
                <TickerChipWrap>
                  <TickerItemButton
                    type="button"
                    data-chip="true"
                    selected={includedTickerIds.includes(profile.id)}
                    aria-pressed={includedTickerIds.includes(profile.id)}
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 선택`}
                    onClick={() => onTickerClick(profile)}
                    onKeyDown={(event) => {
                      if (event.key !== 'F2') return;
                      event.preventDefault();
                      onOpenEdit(profile);
                    }}
                    onMouseDown={() => onTickerPressStart(profile)}
                    onMouseUp={onTickerPressEnd}
                    onMouseLeave={onTickerPressEnd}
                    onTouchStart={() => onTickerPressStart(profile)}
                    onTouchEnd={onTickerPressEnd}
                    onTouchCancel={onTickerPressEnd}
                  >
                    {getTickerDisplayName(profile.ticker, profile.name)}
                  </TickerItemButton>
                  <TickerGearButton
                    type="button"
                    data-gear="true"
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 설정`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenEdit(profile);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M9.6 3.4a1 1 0 0 1 1-.8h2.8a1 1 0 0 1 1 .8l.3 1.8a7.5 7.5 0 0 1 1.5.8l1.7-.7a1 1 0 0 1 1.2.4l1.4 2.4a1 1 0 0 1-.2 1.3l-1.4 1.2c.1.6.1 1.1 0 1.7l1.4 1.2a1 1 0 0 1 .2 1.3l-1.4 2.4a1 1 0 0 1-1.2.4l-1.7-.7c-.5.3-1 .6-1.5.8l-.3 1.8a1 1 0 0 1-1 .8h-2.8a1 1 0 0 1-1-.8l-.3-1.8c-.5-.2-1-.5-1.5-.8l-1.7.7a1 1 0 0 1-1.2-.4L2.8 16a1 1 0 0 1 .2-1.3l1.4-1.2a7 7 0 0 1 0-1.7L3 10.6a1 1 0 0 1-.2-1.3l1.4-2.4a1 1 0 0 1 1.2-.4l1.7.7c.5-.3 1-.6 1.5-.8l.3-1.8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </TickerGearButton>
                </TickerChipWrap>
              </li>
            ))}
          </TickerList>
        </TickerGridWrap>
      )}
      <TickerCreateButton
        type="button"
        data-tour={TOUR_TARGET.tickerCreate}
        aria-label="티커 생성 열기"
        onClick={onOpenCreate}
      >
        티커 생성
      </TickerCreateButton>
    </Card>
  );
}

const TickerCreation = memo(TickerCreationComponent);

export default TickerCreation;
