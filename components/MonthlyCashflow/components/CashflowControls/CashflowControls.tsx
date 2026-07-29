import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { CashflowControlsProps } from './CashflowControls.types';
import {
  CashflowHeaderControls,
  CashflowTotalLabel,
  CashflowTotalValue,
  ViewToggleButton,
  ViewToggleGroup,
  YearSelect
} from './CashflowControls.styled';

/** 헤더 컨트롤: 연도 선택 · 배당 합계 · 차트/캘린더 보기 전환(좁아지면 아랫줄로 접힌다). */
function CashflowControls({
  years,
  selectedYear,
  onSelectYear,
  totalDividend,
  formatAmount,
  viewMode,
  onChangeViewMode
}: CashflowControlsProps) {
  return (
    <CashflowHeaderControls>
      <YearSelect
        size="md"
        width="116px"
        aria-label="실지급 배당 연도 선택"
        value={selectedYear ?? ''}
        onChange={(event) => {
          const nextYear = Number(event.target.value);
          trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
            field_name: 'monthly_cashflow_selected_year',
            value: nextYear
          });
          onSelectYear(nextYear);
        }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </YearSelect>
      <CashflowTotalLabel>
        {/* 합계는 원화에서 이미 합산된 값이다 — 여기서 표시 직전에 한 번만 환산한다.
            한 줄 ↔ 두 줄 전환은 순수 CSS다(styled 참고) — 마크업은 폭과 무관하게 하나다. */}
        {selectedYear ? (
          <>
            배당 합계: <CashflowTotalValue>{formatAmount(totalDividend)}</CashflowTotalValue>
          </>
        ) : (
          '실지급 배당 데이터 없음'
        )}
      </CashflowTotalLabel>
      {/* 보기 전환은 맨 우측(사용자 지정 위치). */}
      <ViewToggleGroup role="group" aria-label="월별 배당 보기 방식">
        {(
          [
            ['chart', '차트'],
            ['calendar', '캘린더']
          ] as const
        ).map(([mode, label]) => (
          <ViewToggleButton
            key={mode}
            type="button"
            $active={viewMode === mode}
            aria-pressed={viewMode === mode}
            onClick={() => {
              if (viewMode === mode) return;
              trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
                field_name: 'monthly_cashflow_view_mode',
                value: mode
              });
              onChangeViewMode(mode);
            }}
          >
            {label}
          </ViewToggleButton>
        ))}
      </ViewToggleGroup>
    </CashflowHeaderControls>
  );
}

export default CashflowControls;
