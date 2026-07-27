import { useCallback, useState, type FormEvent } from 'react';
import { Button, Chip, InputField } from '@/components/common';
import {
  TARGET_MONTHLY_DIVIDEND_MAX,
  TARGET_MONTHLY_DIVIDEND_QUICK_VALUES,
  formatTargetMonthlyDividendChipLabel,
  sanitizeTargetMonthlyDividend
} from '@/shared/constants';
import type { GoalSetupPanelProps } from './GoalSetupPanel.types';
import {
  ChipRow,
  InputRow,
  InputSlot,
  InvalidNote,
  SetupBody,
  SetupLead,
  SetupRoot,
  SetupTitle
} from './GoalSetupPanel.styled';

/** 입력은 만원 단위로 받는다(0을 여섯 개 세지 않게) — 원 단위 변환은 커밋 직전 한 번만. */
const MAN_WON = 10_000;
const MAX_MAN_WON = TARGET_MONTHLY_DIVIDEND_MAX / MAN_WON;

const QUICK_CHIPS = TARGET_MONTHLY_DIVIDEND_QUICK_VALUES.map((value) => ({
  value,
  label: formatTargetMonthlyDividendChipLabel(value)
}));

/**
 * 목표 미설정 상태의 설정 패널 — 칩 4개 + 직접 입력.
 *
 * ⚠ **여기서 목표를 저장하지 않는다.** 시뮬레이터 밖에는 자동저장(120ms)도 클라우드 동기화
 * (4초 디바운스 + 3-way base 해시)도 마운트돼 있지 않아, 이 화면에서 쓰면 ①atom에 쓴 값은
 * 시뮬레이터 재진입 시 하이드레이션이 저장값으로 덮어써 조용히 사라지고 ②저장 payload에 직접 쓰면
 * 클라우드 base 해시와 어긋나 다음 세션의 충돌 판정을 바꾼다(state-engineer 검증).
 * 그래서 고른 값은 **라우터 state로 실어 보내고**, 커밋은 시뮬레이터 안에서 한 번만 일어난다.
 *
 * 보내는 쪽에서도 받는 쪽과 **같은 함수**(`sanitizeTargetMonthlyDividend`)로 검증한다 — 규칙이
 * 두 벌로 갈리면 한쪽만 고쳐지는 날이 온다.
 */
export default function GoalSetupPanel({
  title,
  body,
  pickLead,
  chipsLabel,
  inputLabel,
  inputPlaceholder,
  invalidMessage,
  submitLabel,
  onCommitTarget
}: GoalSetupPanelProps) {
  const [manWon, setManWon] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsed = Number(manWon.replace(/,/g, ''));
      const won = Number.isFinite(parsed) ? Math.round(parsed * MAN_WON) : Number.NaN;
      // 0(=목표 없음)은 "설정"이 아니다 — 공용 sanitize(0 허용)에 더해 이 화면은 1만원 이상만 받는다.
      const sanitized = won >= MAN_WON ? sanitizeTargetMonthlyDividend(won) : null;

      if (sanitized === null) {
        setIsInvalid(true);
        return;
      }

      setIsInvalid(false);
      onCommitTarget(sanitized);
    },
    [manWon, onCommitTarget]
  );

  return (
    <SetupRoot>
      <SetupTitle>{title}</SetupTitle>
      <SetupBody>{body}</SetupBody>

      <SetupLead>{pickLead}</SetupLead>
      <ChipRow role="group" aria-label={chipsLabel}>
        {QUICK_CHIPS.map((chip) => (
          <Chip key={chip.value} variant="accentAlt" onClick={() => onCommitTarget(chip.value)}>
            {chip.label}
          </Chip>
        ))}
      </ChipRow>

      {/* form이라 Enter 한 번으로도 커밋된다(버튼까지 Tab으로 옮기지 않아도 된다). */}
      <InputRow onSubmit={submit}>
        <InputSlot>
          <InputField
            label={inputLabel}
            type="number"
            value={manWon}
            placeholder={inputPlaceholder}
            suffix="만원"
            min={1}
            max={MAX_MAN_WON}
            onChange={(event) => {
              setManWon(event.target.value);
              // 고치는 중에 안내가 계속 떠 있으면 방해가 된다 — 다시 입력하면 즉시 내린다.
              if (isInvalid) setIsInvalid(false);
            }}
          />
        </InputSlot>
        <Button type="submit" variant="secondary">
          {submitLabel}
        </Button>
      </InputRow>
      {/* 무음 실패 금지 — 왜 안 됐는지 문장으로 말한다(색만으로 말하지 않는다). */}
      {isInvalid ? <InvalidNote role="status">{invalidMessage}</InvalidNote> : null}
    </SetupRoot>
  );
}
