import { X } from 'lucide-react';
import { ICON } from '@/shared/styles';
import {
  BarActions,
  BarChip,
  BarChips,
  BarCount,
  BarHint,
  BarPanel,
  BarRoot,
  CheckboxInput,
  CheckboxLabel,
  ChipRemove,
  ClearButton,
  CompareLink,
  UnknownSlot
} from './TickerSelector.styled';
import type {
  TickerSelectorBarProps,
  TickerSelectorCheckboxProps,
  TickerSelectorUnknownProps
} from './TickerSelector.types';

/**
 * 고른 종목을 모아 비교로 보내는 **하단 고정 바**.
 *
 * 🔴 선택이 비면 `null` 을 낸다 — 이 컴포넌트를 조건 없이 렌더해도 되게 만드는 계약이다
 * (호출부마다 `selected.length > 0 &&` 를 쓰면 여섯 화면 중 하나는 반드시 빠뜨린다).
 *
 * ⚠ 이 바는 본문 위에 뜬다. 표 마지막 줄이 가려질 수 있으므로, 붙이는 화면은 하단 여백을
 *   확보하거나 표 아래에 이미 다른 구획이 오는지 확인할 것.
 */
export function TickerSelectorBar({ selected, max, min, href, onRemove, onClear }: TickerSelectorBarProps) {
  if (selected.length === 0) return null;

  const canOpen = selected.length >= min;
  const shortfall = min - selected.length;

  return (
    <BarRoot role="region" aria-label="비교할 종목 선택">
      <BarPanel>
        <BarCount>{`${selected.length}개 선택됨 · 최대 ${max}개`}</BarCount>

        <BarChips>
          {selected.map((ticker) => (
            <BarChip key={ticker}>
              {ticker}
              <ChipRemove type="button" aria-label={`${ticker} 선택 해제`} onClick={() => onRemove(ticker)}>
                <X size={12} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
              </ChipRemove>
            </BarChip>
          ))}
        </BarChips>

        <BarActions>
          <ClearButton type="button" onClick={onClear}>
            전체 해제
          </ClearButton>
          {/*
            🔴 미달일 때 **비활성 링크를 두지 않는다**. 눌리지 않는 CTA 는 이유를 말하지 못해서,
               같은 자리에 "몇 개가 더 필요한지"를 그대로 적는다.
          */}
          {canOpen ? (
            <CompareLink to={href}>비교하기 →</CompareLink>
          ) : (
            <BarHint>{`${shortfall}개 더 고르면 비교할 수 있습니다`}</BarHint>
          )}
        </BarActions>
      </BarPanel>
    </BarRoot>
  );
}

/**
 * 종목 표 한 행의 비교 선택 체크박스.
 *
 * 🔴 라벨 텍스트는 **화면에 그리지 않는다**(`aria-label` 로만 준다). 표의 첫 열에 "SCHD 비교에 담기"가
 * 줄마다 반복되면 표가 읽히지 않는다. 대신 접근성 이름은 티커를 포함해 스크린리더에서
 * "체크박스" 스무 개가 구분되게 한다.
 *
 * ⚠ `TickerSelectorBar` 와 **한 파일**에 산다 — 같은 선택 부품의 두 얼굴(행 체크박스·하단 바)이라
 *   폴더 파일 세트(.cursor/rules §3)를 늘리지 않고 한 세트로 묶는다.
 */
export function TickerSelectorCheckbox({
  ticker,
  checked,
  disabled = false,
  disabledReason,
  onToggle
}: TickerSelectorCheckboxProps) {
  return (
    <CheckboxLabel disabled={disabled} title={disabled ? disabledReason : undefined}>
      <CheckboxInput
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={`${ticker} 비교에 담기`}
        onChange={() => onToggle(ticker)}
      />
    </CheckboxLabel>
  );
}

/**
 * 체크박스 대신 서는 `—`. **티커 자체를 모르는 줄**에 쓴다.
 *
 * 🔴 `disabled` 체크박스와 다른 말을 한다. 꺼진 체크박스는 "이 종목은 비교 대상이 아니다"이고,
 * 이쪽은 "우리가 이 줄의 티커를 모른다"다(13F 는 CUSIP 만 준다). 아는 것보다 많이 말하지 않으려고
 * 표식을 나눠 둔 것이니, 비교 표에 자료가 없을 뿐인 줄에는 이걸 쓰지 마라 — 그건 `disabled` 다.
 * 🔴 자리는 체크박스와 **같은 상자**다(`UnknownSlot` 주석).
 */
export function TickerSelectorUnknown({ reason }: TickerSelectorUnknownProps) {
  return <UnknownSlot title={reason}>—</UnknownSlot>;
}
