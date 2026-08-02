import { Card, StatTile, ToggleField } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerDividendBody } from '../../types';
import type { LedgerDividendCardProps } from './LedgerDividendCard.types';
import { MetricGrid, Note, NoteList } from './LedgerDividendCard.styled';

const copy = LEDGER_COPY;

/**
 * B-4 **배당 겹쳐 보기** — "내 예상 배당이 이 달 지출의 어디까지를 덮는가".
 *
 * 🔴 **월 요약 카드의 형제**다(`Card` 안 `Card` 금지 · 주역 카드는 화면당 1개). 요약 3숫자
 * (수입·지출·합계)에는 여기 숫자가 **한 번도 더해지지 않는다** — 더하면 "가계부 총합"의 정의가
 * 둘이 되고, 사용자가 배당 입금을 시트에 이미 적어 뒀다면 이중 계상이 된다.
 * 🔴 **시트에 쓰지 않는다.** 이 카드에는 쓰기 액션이 없고, 토글은 화면 상태만 바꾼다.
 * 🔴 **손익색 금지 · 색 단독 채널 금지.** 커버율은 숫자와 문장으로 말한다.
 * ⚠ **단일 가계부 뷰 전용**이다 — 두 가계부 블렌딩(B-3) 화면에서는 V1 에서 렌더하지 않는다.
 *   "우리 가계" 지출에 "내 포트폴리오" 배당을 겹치면 귀속이 섞인다(배당은 한 사람 것).
 *
 * 토글이 꺼져 있어도 **카드는 남는다** — 켜는 자리가 사라지면 이 기능을 다시 켤 방법이 없다.
 */
export default function LedgerDividendCard({ model, monthLabel, onToggle }: LedgerDividendCardProps) {
  return (
    <Card
      tone="sunken"
      title={copy.dividend.title}
      subtitle={copy.dividend.subtitle}
      titleRight={
        <ToggleField
          label={copy.dividend.title}
          accessibleName={copy.dividend.toggleAria}
          hideLabel
          checked={model.isOn}
          onChange={(event) => onToggle(event.target.checked)}
        />
      }
    >
      {model.body === null ? <Note>{copy.dividend.off}</Note> : renderBody(model.body, monthLabel)}
    </Card>
  );
}

/**
 * 갈래마다 **다른 문장**을 쓴다 — "값이 없다"를 전부 같은 말로 접으면 사용자가 무엇을 하면 되는지
 * 알 수 없다(못 읽음 / 보유 없음 / 이 달 지급 없음은 서로 다른 사건이다).
 */
const renderBody = (body: LedgerDividendBody, monthLabel: string) => {
  if (body.kind === 'loading') return <Note>{copy.dividend.loading}</Note>;
  if (body.kind === 'unavailable') return <Note>{copy.dividend.unavailable}</Note>;
  if (body.kind === 'no-holdings') return <Note>{copy.dividend.noHoldings}</Note>;
  if (body.kind === 'no-payout') return <Note>{copy.dividend.noPayout(monthLabel)}</Note>;

  /* 🔴 환율이 없으면 원화도 커버율도 만들지 않는다 — 달러 원값과 사유만 말한다. */
  if (body.kind === 'fx-unavailable') {
    return (
      <>
        <MetricGrid>
          <StatTile
            label={copy.dividend.amountLabel(monthLabel)}
            value={body.usdText}
            hint={copy.dividend.usdHint}
          />
        </MetricGrid>
        <NoteList>
          <Note>{copy.dividend.fxUnavailable}</Note>
          {body.unknownScheduleCount > 0 ? (
            <Note>{copy.dividend.unknownSchedule(body.unknownScheduleCount)}</Note>
          ) : null}
        </NoteList>
      </>
    );
  }

  return (
    <>
      <MetricGrid>
        <StatTile
          label={copy.dividend.amountLabel(monthLabel)}
          value={body.amountText}
          hint={copy.dividend.amountHint}
        />
        {/* 🔴 지출이 0 인 달에는 타일 자체를 만들지 않는다(아래 사유 줄이 그 자리를 대신한다). */}
        {body.coverageText === null ? null : (
          <StatTile
            label={copy.dividend.coverageLabel}
            value={body.coverageText}
            hint={copy.dividend.coverageHint(monthLabel)}
          />
        )}
      </MetricGrid>
      <NoteList>
        {body.coverageText === null ? (
          <Note>{copy.dividend.noExpense}</Note>
        ) : (
          <Note>
            {body.coveredCategories.length > 0
              ? copy.dividend.covered(body.coveredCategories)
              : copy.dividend.coveredNone}
          </Note>
        )}
        {body.unknownScheduleCount > 0 ? (
          <Note>{copy.dividend.unknownSchedule(body.unknownScheduleCount)}</Note>
        ) : null}
      </NoteList>
    </>
  );
};
