import { useId } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button, Card } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerFailureListProps } from './LedgerFailureList.types';
import {
  FailureBody,
  FailureItem,
  FailureItems,
  FailureLabel,
  FailureReason,
  FailureSummary,
  RetryAllHint,
  RetryAllRow
} from './LedgerFailureList.styled';

const copy = LEDGER_COPY;

/**
 * §4.8 저장하지 못한 기록.
 *
 * 🔴 요약 배너(호출부)가 `M건 / 전체 N건` 을 **숫자로** 말하고, 실패는 여기 **건별로** 남는다.
 * "일부 실패했습니다" 같은 뭉갠 문장을 쓰지 않는다 — 사용자는 어느 건이 왜 실패했는지 알아야 한다.
 *
 * `Card tone="sunken"` = 부속 위계. 본 목록과 성격이 다른 **재시도 대기열**이라 한 단계 가라앉힌다.
 * 🔴 요약 카드 **밖 형제**로 둔다(`Card` 안 `Card` 금지).
 *
 * ⚠ 항목 안의 카드 면(`surface`)은 `Card` 안 `Card` 가 아니다 — 리스트 항목이지 카드 부품이 아니고,
 * 가라앉은 면 위에서 각 건이 서로 갈려 보이게 하는 최소 수단이다.
 */
export default function LedgerFailureList({ model, retryCountdowns, onRetry, onRetryAll }: LedgerFailureListProps) {
  const hintId = useId();

  return (
    <Card tone="sunken" title={copy.error.partial.listTitle}>
      <FailureItems>
        {model.rows.map((row) => {
          const kindText = row.kind === 'income' ? copy.list.kindIncome : copy.list.kindExpense;
          const blockedSeconds = retryCountdowns.get(row.id) ?? 0;

          return (
            <FailureItem key={row.id}>
              <TriangleAlert size={18} strokeWidth={1.8} aria-hidden focusable={false} />
              <FailureBody>
                <FailureLabel>{copy.error.rowFailed}</FailureLabel>
                <FailureSummary>{`${row.dateText} · ${kindText} · ${row.category} · ${row.amountText}`}</FailureSummary>
                <FailureReason>{row.failure?.body}</FailureReason>
              </FailureBody>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={blockedSeconds > 0}
                aria-label={copy.list.retryAria(row.dateText, row.category, row.amountText)}
                onClick={() => onRetry(row.id)}
              >
                {blockedSeconds > 0 ? copy.error.retryIn(blockedSeconds) : copy.error.retry}
              </Button>
            </FailureItem>
          );
        })}
      </FailureItems>

      <RetryAllRow>
        <Button
          type="button"
          variant="secondary"
          startIcon={<RotateCcw size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
          disabled={model.isRetryAllBlocked}
          aria-describedby={model.isRetryAllBlocked ? hintId : undefined}
          onClick={onRetryAll}
        >
          {copy.error.retryAll}
        </Button>
      </RetryAllRow>

      {model.isRetryAllBlocked ? <RetryAllHint id={hintId}>{copy.error.partial.rateLimitedBlocked}</RetryAllHint> : null}
    </Card>
  );
}
