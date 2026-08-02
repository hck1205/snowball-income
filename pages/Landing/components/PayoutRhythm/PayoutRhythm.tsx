import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY, LANDING_PAYOUT_RHYTHM_TICKERS } from '../../copy';
import { RHYTHM_MONTHS, buildPayoutRhythmRows } from './PayoutRhythm.utils';
import {
  RhythmCard,
  RhythmCell,
  RhythmFootnote,
  RhythmHonesty,
  RhythmLink,
  RhythmLinkLine,
  RhythmList,
  RhythmMonths,
  RhythmRow,
  RhythmSummary,
  RhythmSymbol
} from './PayoutRhythm.styled';

const copy = LANDING_COPY.payout;

/**
 * S5 — 매달 들어오는 현금(12칸 리듬).
 *
 * 🔴 **약속형 문장을 쓰지 않는다.** 이 섹션은 "지급 달이 다른 종목을 함께 담으면 배당이 들어오는
 * 달이 촘촘해진다"는 사실까지만 말하고 **금액을 말하지 않는다.** 그리고 반드시 정직한 한 문장이
 * 뒤따른다 — 자주 받는 것과 많이 늘어나는 것은 다른 이야기다.
 *
 * 🔴 **숫자를 지어내지 않는다.** 12칸은 `marketData` 스냅샷의 지급 월을 런타임에 읽어 그린다.
 */
export default function PayoutRhythm() {
  // 3줄짜리 정적 목록이라 useMemo 를 쓰지 않는다(초경량 · 렌더마다 같은 결과).
  const rows = buildPayoutRhythmRows(LANDING_PAYOUT_RHYTHM_TICKERS);

  return (
    <>
      <RhythmCard>
        <RhythmList>
          {rows.map((row) => (
            <RhythmRow
              key={row.symbol}
              aria-label={row.isUnknown ? `${row.symbol}, ${copy.unknown}` : copy.monthsAria(row.symbol, row.months)}
            >
              <RhythmSymbol>{row.symbol}</RhythmSymbol>
              <RhythmSummary>
                {row.isUnknown ? copy.unknown : copy.frequencySummary(row.months.length)}
              </RhythmSummary>
              {/* 칸 자체는 장식이다 — 위 접근명과 요약 텍스트가 같은 사실을 이미 말한다. */}
              <RhythmMonths aria-hidden>
                {RHYTHM_MONTHS.map((month) => (
                  <RhythmCell key={month} $paid={row.months.includes(month)}>
                    {month}
                  </RhythmCell>
                ))}
              </RhythmMonths>
            </RhythmRow>
          ))}
        </RhythmList>
        {/* 🔴 시각 부호(링·굵기·면색)를 눈으로 읽는 문장. 각주와 같은 어휘라 새 styled 를 만들지 않는다. */}
        <RhythmFootnote>{copy.legend}</RhythmFootnote>
        <RhythmFootnote>{copy.footnote}</RhythmFootnote>
      </RhythmCard>

      <RhythmHonesty>{copy.honesty}</RhythmHonesty>

      <RhythmLinkLine>
        <RhythmLink
          to="/dividend/calendar"
          onClick={() => trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_inline_calendar' })}
        >
          {copy.linkText}
        </RhythmLink>
      </RhythmLinkLine>
    </>
  );
}
