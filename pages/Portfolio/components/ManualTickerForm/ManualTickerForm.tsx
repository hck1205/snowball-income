import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, InputField } from '@/components/common';
import { isSimulationKnownTicker } from '@/shared/constants';
import { PORTFOLIO_COPY } from '../../copy';
import type { ManualTickerFormProps } from './ManualTickerForm.types';
import {
  InvalidNote,
  ManualBody,
  ManualDetails,
  ManualFieldRow,
  ManualForm,
  ManualSummary
} from './ManualTickerForm.styled';

const copy = PORTFOLIO_COPY;

/** 심볼 모양 — 영숫자·점·하이픈 1~10자(BRK.B 같은 실제 표기를 막지 않는다). */
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;

/**
 * 유니버스 밖 종목을 직접 추가하는 폼(드로어 맨 아래, 기본 접힘).
 *
 * 이 종목은 **지급 일정 데이터가 없다** — 이번 달 예상 배당·다음 지급일 계산에서 빠진다는 사실을
 * 폼에서 먼저 말하고, 추가된 뒤에도 행 사유와 요약 하단 줄이 다시 말한다(무음 제외 금지).
 *
 * ⚠ 종목 **이름은 받지 않는다**. 저장 레코드(`manual`)가 주가·배당률만 담기 때문이다 —
 * 화면에 이름 칸을 두고 저장하지 않으면 "적었는데 사라지는" 필드가 된다.
 */
export default function ManualTickerForm({ forceOpen, onSubmit }: ManualTickerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [dividendYield, setDividendYield] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 검색 결과가 0개가 되는 순간 펼친다. 사용자가 직접 접은 뒤에는 다시 강제로 열지 않는다.
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const symbol = ticker.trim().toUpperCase();
      if (!TICKER_PATTERN.test(symbol)) {
        setError(copy.manual.invalidTicker);
        return;
      }
      // 유니버스에 있는 종목을 수동으로 받으면 시세·지급월을 가진 정본을 버리게 된다.
      if (isSimulationKnownTicker(symbol)) {
        setError(copy.manual.duplicateInUniverse(symbol));
        return;
      }

      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setError(copy.manual.invalidPrice);
        return;
      }

      const parsedYield = Number(dividendYield);
      if (!Number.isFinite(parsedYield) || parsedYield < 0 || parsedYield > 100) {
        setError(copy.manual.invalidYield);
        return;
      }

      const result = onSubmit({ ticker: symbol, price: parsedPrice, dividendYield: parsedYield });
      if (!result.ok) {
        setError(copy.manual.duplicateInHoldings(symbol));
        return;
      }

      setError(null);
      setTicker('');
      setPrice('');
      setDividendYield('');
    },
    [dividendYield, onSubmit, price, ticker]
  );

  return (
    <ManualDetails open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <ManualSummary>{copy.manual.summary}</ManualSummary>
      <ManualBody>{copy.manual.body}</ManualBody>

      {/* form 이라 Enter 한 번으로 제출된다(버튼까지 Tab 으로 옮기지 않아도 된다). */}
      <ManualForm onSubmit={submit}>
        <InputField
          label={copy.manual.fieldTicker}
          value={ticker}
          placeholder={copy.manual.fieldTickerPlaceholder}
          onChange={(event) => {
            setTicker(event.target.value);
            if (error) setError(null);
          }}
        />
        <ManualFieldRow>
          <InputField
            label={copy.manual.fieldPrice}
            type="number"
            value={price}
            prefix={copy.manual.priceUnit}
            hint={copy.manual.fieldPriceHint}
            min={0}
            onChange={(event) => {
              setPrice(event.target.value);
              if (error) setError(null);
            }}
          />
          <InputField
            label={copy.manual.fieldYield}
            type="number"
            value={dividendYield}
            suffix={copy.manual.yieldUnit}
            min={0}
            max={100}
            onChange={(event) => {
              setDividendYield(event.target.value);
              if (error) setError(null);
            }}
          />
        </ManualFieldRow>

        <Button type="submit" variant="secondary">
          {copy.manual.submit}
        </Button>

        {/* 무음 실패 금지 — 왜 안 됐는지 문장으로 말한다(색만으로 말하지 않는다). */}
        {error ? <InvalidNote role="status">{error}</InvalidNote> : null}
      </ManualForm>
    </ManualDetails>
  );
}
