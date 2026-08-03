import { Info } from 'lucide-react';
import { Card, ToggleField } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerDividendBody } from '../../types';
import type { LedgerDividendCardProps } from './LedgerDividendCard.types';
import {
  CoverageLabel,
  CoverageRow,
  CoverageValue,
  MetricHint,
  MetricLabel,
  MetricStack,
  MetricValue,
  Note,
  NoteList,
  StateNote
} from './LedgerDividendCard.styled';

const copy = LEDGER_COPY;

/** "지금은 값이 없다"를 말하는 한 줄. 갈래마다 문장이 다르므로 문장만 받는다. */
const renderStateNote = (text: string) => (
  <StateNote>
    <Info size={16} strokeWidth={1.8} aria-hidden focusable={false} />
    <span>{text}</span>
  </StateNote>
);

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
 *
 * ⚠ 2026-08-03 — 이 카드는 왼쪽 범위 레일(280px)에 산다. 지표는 가로 격자가 아니라 **세로 스택**이다
 *   (styled 파일 머리말 참고).
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
      {model.body === null ? renderStateNote(copy.dividend.off) : renderBody(model.body, monthLabel)}
    </Card>
  );
}

/**
 * 갈래마다 **다른 문장**을 쓴다 — "값이 없다"를 전부 같은 말로 접으면 사용자가 무엇을 하면 되는지
 * 알 수 없다(못 읽음 / 보유 없음 / 이 달 지급 없음은 서로 다른 사건이다).
 */
const renderBody = (body: LedgerDividendBody, monthLabel: string) => {
  if (body.kind === 'loading') return renderStateNote(copy.dividend.loading);
  if (body.kind === 'unavailable') return renderStateNote(copy.dividend.unavailable);
  if (body.kind === 'no-holdings') return renderStateNote(copy.dividend.noHoldings);
  if (body.kind === 'no-payout') return renderStateNote(copy.dividend.noPayout(monthLabel));

  /* 🔴 환율이 없으면 원화도 커버율도 만들지 않는다 — 달러 원값과 사유만 말한다. */
  if (body.kind === 'fx-unavailable') {
    return (
      <>
        <MetricStack>
          <div>
            <MetricLabel>{copy.dividend.amountLabel(monthLabel)}</MetricLabel>
            <MetricValue>{body.usdText}</MetricValue>
            <MetricHint>{copy.dividend.usdHint}</MetricHint>
          </div>
        </MetricStack>
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
      <MetricStack>
        <div>
          <MetricLabel>{copy.dividend.amountLabel(monthLabel)}</MetricLabel>
          <MetricValue>{body.amountText}</MetricValue>
          <MetricHint>{copy.dividend.amountHint}</MetricHint>
        </div>

        {/* 🔴 지출이 0 인 달에는 커버율 줄 자체를 만들지 않는다(아래 사유 줄이 그 자리를 대신한다). */}
        {body.coverageText === null ? null : (
          <CoverageRow>
            <CoverageLabel>{copy.dividend.coverageLabel}</CoverageLabel>
            <CoverageValue>{body.coverageText}</CoverageValue>
          </CoverageRow>
        )}
      </MetricStack>

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
