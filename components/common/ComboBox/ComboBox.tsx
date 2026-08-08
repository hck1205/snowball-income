import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ComboBoxProps } from './ComboBox.types';
import { filterComboOptions, isExactMatch, nextActiveIndex } from './ComboBox.utils';
import { ComboEmpty, ComboInput, ComboList, ComboOption, ComboRoot } from './ComboBox.styled';

/**
 * **검색되는 제안 입력** — `<datalist>` 를 대신한다.
 *
 * ## 왜 만들었나 (2026-08-08 사용자 요청)
 *
 * `<datalist>` 는 타이핑하면 걸러 주기는 하지만 **목록을 우리가 제어할 수 없다** — 높이·스크롤·
 * 강조가 브라우저 몫이라, 항목이 서른 개를 넘으면 화면을 덮을 만큼 길게 그려진다. 사용자가
 * "하나하나 눈으로 확인할 필요 없이 검색으로 찾고, 길게 나오지 않게" 하기를 요청했다.
 *
 * ## 🔴 자유 입력을 유지한다
 *
 * 목록에 없는 값도 그대로 저장된다. 이 레포의 원칙이 **"사용자 시트가 정본"** 이라, 우리 사전에
 * 없는 말을 쓴다고 막을 자리가 아니다(같은 판단이 시트 드롭다운의 `strict: false` 에도 있다).
 * 그래서 `<select>` 가 아니라 **콤보박스**이고, 검색 상자를 따로 두지 않고 **입력칸 자체가 검색칸**이다
 * — 상자를 둘로 나누면 "어디에 값이 들어가나"가 모호해진다.
 *
 * ## 🔴 오버레이 층을 새로 만들지 않는다
 *
 * 종전 판단(`LedgerFormModal`)이 우려한 것이 이것이고, 두 가지로 막는다:
 * 1. **포털을 쓰지 않는다** — 목록은 입력 바로 아래 절대 배치라 모달 안에 산다(z-index 다툼 없음).
 * 2. **ESC 를 삼킨다** — 목록이 열려 있을 때 ESC 는 목록만 닫는다. `stopPropagation` 이 없으면
 *    모달이 함께 닫혀, 사용자는 목록을 닫으려다 입력 중이던 내용을 잃는다.
 *
 * ## 접근성
 *
 * ARIA 1.2 콤보박스: 입력이 `role="combobox"` · `aria-expanded` · `aria-controls` ·
 * `aria-activedescendant` 를 들고, 목록은 `role="listbox"`, 항목은 `role="option"` 이다.
 * 🔴 활성 항목을 색만으로 말하지 않는다(면 + 굵기 + `aria-selected`).
 */
export default function ComboBox({
  id,
  value,
  onChange,
  options,
  placeholder,
  listLabel,
  ariaInvalid,
  ariaDescribedBy,
  dataField,
  visibleOptionCount = 7
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  /**
   * 목록을 **열어 둘지**의 판단에 쓰는 값.
   *
   * 🔴 입력값이 제안 하나와 정확히 같으면 목록을 닫는다 — 이미 고른 것을 다시 보여 주는 것은
   *    소음이다. 다만 사용자가 **일부러 열었을 때**(화살표·클릭)는 그 판단을 무른다.
   */
  const forceOpenRef = useRef(false);

  const listId = `${id}-listbox`;
  const filtered = useMemo(() => filterComboOptions(options, value), [options, value]);

  const shouldShow =
    isOpen && (forceOpenRef.current || !isExactMatch(options, value)) && options.length > 0;

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    forceOpenRef.current = false;
  }, []);

  const commit = useCallback(
    (option: string) => {
      onChange(option);
      close();
    },
    [close, onChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        forceOpenRef.current = true;
        setIsOpen(true);
        setActiveIndex((current) => nextActiveIndex(current, filtered.length, event.key === 'ArrowDown' ? 1 : -1));
        return;
      }

      if (event.key === 'Enter') {
        /*
         * 🔴 활성 항목이 있을 때만 삼킨다. 없으면 그대로 흘려 **폼 제출**이 되게 한다 —
         *    목록을 안 쓰는 사용자가 엔터로 저장하지 못하면 그게 더 나쁘다.
         */
        if (shouldShow && activeIndex >= 0 && activeIndex < filtered.length) {
          event.preventDefault();
          commit(filtered[activeIndex]);
        }
        return;
      }

      if (event.key === 'Escape') {
        if (!shouldShow) return;
        /* 🔴 목록이 열려 있을 때의 ESC 는 **목록만** 닫는다. 안 막으면 모달이 함께 닫힌다. */
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }

      if (event.key === 'Tab') close();
    },
    [activeIndex, close, commit, filtered, shouldShow]
  );

  return (
    <ComboRoot>
      <ComboInput
        id={id}
        {...(dataField === undefined ? {} : { 'data-field': dataField })}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={shouldShow}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          shouldShow && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        placeholder={placeholder}
        value={value}
        aria-invalid={ariaInvalid ? true : undefined}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => {
          /* 타이핑하면 목록을 다시 연다 — 검색 결과를 보려고 치는 것이다. */
          forceOpenRef.current = false;
          setIsOpen(true);
          setActiveIndex(-1);
          onChange(event.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        /*
         * ⚠ blur 로 닫는다. 목록 항목의 선택은 `onMouseDown`(blur 보다 먼저)이라 삼켜지지 않는다.
         */
        onBlur={close}
        onKeyDown={handleKeyDown}
      />

      {shouldShow ? (
        <ComboList
          id={listId}
          role="listbox"
          aria-label={listLabel}
          data-rows={visibleOptionCount}
        >
          {filtered.length === 0 ? (
            /* 🔴 목록을 감추지 않고 왜 비었는지 말한다 — 감추면 컨트롤이 고장 난 것처럼 보인다. */
            <ComboEmpty>{'찾는 항목이 없습니다. 그대로 적으셔도 저장됩니다.'}</ComboEmpty>
          ) : (
            filtered.map((option, index) => (
              <ComboOption
                key={option}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  /* 🔴 `onMouseDown` 이다 — `onClick` 은 blur 뒤에 와서 목록이 이미 닫혀 있다. */
                  event.preventDefault();
                  commit(option);
                }}
              >
                {option}
              </ComboOption>
            ))
          )}
        </ComboList>
      ) : null}
    </ComboRoot>
  );
}
