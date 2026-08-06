import { ArrowRight } from 'lucide-react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY, LANDING_PAYOUT_RHYTHM_TICKERS } from '../../copy';
import { RHYTHM_MONTHS, buildPayoutRhythmRows } from './PayoutRhythm.utils';
import {
  RhythmCard,
  RhythmCell,
  RhythmFootnote,
  RhythmFootnotes,
  RhythmHonesty,
  RhythmLabel,
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
 *
 * ## 2026-08-03: 한 줄 3열 → [이름표 블록][12칸]
 * before 는 티커·요약·트랙이 한 줄에 나란히 서서 종목 이름이 12칸과 같은 무게였다. 지금은 티커가
 * 20px 데이터 서체로 서고 지급 빈도가 그 아래 붙어 **하나의 이름표**가 된다 — 이 표가 비교시키려는
 * 것은 "종목마다 다르다"이므로, 종목 이름이 먼저 읽혀야 한다.
 * 🔴 12칸 트랙은 계속 **행의 마지막 자식**이어야 한다(payoutRhythmChannels 가 그 자리로 찾는다).
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
              aria-label={
                row.isUnknown ? `${row.symbol}, ${copy.unknown}` : copy.monthsAria(row.symbol, row.months)
              }
            >
              <RhythmLabel>
                <RhythmSymbol>{row.symbol}</RhythmSymbol>
                <RhythmSummary>
                  {row.isUnknown ? copy.unknown : copy.frequencySummary(row.months.length)}
                </RhythmSummary>
              </RhythmLabel>
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
        <RhythmFootnotes>
          <RhythmFootnote>{copy.legend}</RhythmFootnote>
          <RhythmFootnote>{copy.footnote}</RhythmFootnote>
        </RhythmFootnotes>
      </RhythmCard>

      <RhythmHonesty>{copy.honesty}</RhythmHonesty>

      <RhythmLinkLine>
        <RhythmLink
          to="/dividend/calendar"
          onClick={() => trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_inline_calendar' })}
        >
          {copy.linkText}
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        </RhythmLink>
      </RhythmLinkLine>
    </>
  );
}
