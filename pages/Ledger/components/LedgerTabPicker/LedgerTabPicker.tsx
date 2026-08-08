import { useId } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { HintText, Select } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerTabPickerProps } from './LedgerTabPicker.types';
import {
  OpenSheetLink,
  PickerBlock,
  PickerLabel,
  PickerRow,
  PickerStatus
} from './LedgerTabPicker.styled';

const copy = LEDGER_COPY;

/**
 * B-1 탭 선택 — 연결한 파일 안에서 **어느 탭의 내역을 볼지** 고른다.
 *
 * 🔴 **탭이 하나면 드롭다운을 만들지 않는다.** 선택지가 없는 select 는 UI 의 거짓말이다 — 그때는
 * 지금 보고 있는 탭 이름만 문장으로 말한다.
 * 🔴 **네이티브 `<select>`** 다(공용 `Select` 프리미티브). 가로 탭바로 바꾸지 마라 — 탭 20개에서
 * 항목이 스크롤 뒤로 숨고 그 사실을 알릴 방법이 없다(헤더 NavScroller 에서 실측된 사고다).
 * 🔴 **무음 비활성 금지**: 막혀 있으면 언제나 사유 문장이 함께 서고, 컨트롤이 `aria-describedby` 로
 * 그것을 가리킨다(`LedgerMappingCard` 와 같은 처방).
 *
 * ⚠ 2026-08-03 — 라벨을 컨트롤 **위**로 올렸다. 이 줄은 280px 짜리 범위 레일 안에 사는데,
 * 가로 배치에서는 셀렉트가 12ch 로 눌려 탭 제목이 잘렸다.
 */
export default function LedgerTabPicker({ model, sheetUrl, onSelectTab }: LedgerTabPickerProps) {
  const idPrefix = useId();
  const selectId = `${idPrefix}-tab`;
  const hintId = `${idPrefix}-tab-hint`;
  const isBlocked = model.blockedReason !== null;

  /*
   * 🔴 **탭이 하나면 시트로 가는 버튼을 준다**(2026-08-08 사용자 요청).
   *
   * 종전에는 "가계부 탭을 보고 있습니다"라고 적었다. 앱이 만든 시트에서 기록 탭이 아닌 것을
   * 걸러 내면서 이 자리는 **거의 언제나** 그 문장 하나가 됐고, 고를 것이 없는데 자리만 차지하는
   * 줄이 되었다 — 아는 사실을 다시 말하는 것은 정보가 아니다.
   * 그 자리에 실제로 할 일이 있는 것을 놓는다: 시트를 여는 것.
   */
  if (model.options.length <= 1) {
    if (sheetUrl === undefined) return null;
    return (
      <PickerBlock>
        <OpenSheetLink href={sheetUrl} target="_blank" rel="noreferrer noopener">
          <FileSpreadsheet size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.tab.openSheet}
        </OpenSheetLink>
      </PickerBlock>
    );
  }

  return (
    <PickerBlock>
      <PickerRow>
        {/* 라벨-컨트롤은 명시적 htmlFor/id 로 짝짓는다(암시적 중첩에만 기대지 않는다). */}
        <PickerLabel htmlFor={selectId}>{copy.tab.label}</PickerLabel>
        <Select
          id={selectId}
          size="md"
          width="full"
          value={String(model.currentSheetId)}
          disabled={isBlocked || model.isSwitching}
          aria-describedby={isBlocked ? hintId : undefined}
          onChange={(event) => onSelectTab(Number(event.target.value))}
        >
          {model.options.map((option) => (
            <option key={option.sheetId} value={String(option.sheetId)}>
              {option.title}
            </option>
          ))}
        </Select>
        {model.isSwitching ? <PickerStatus>{copy.tab.switching}</PickerStatus> : null}
      </PickerRow>
      {model.blockedReason === null ? null : <HintText id={hintId}>{model.blockedReason}</HintText>}
    </PickerBlock>
  );
}
