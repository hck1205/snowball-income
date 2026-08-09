export type ComboBoxProps = {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** 제안 목록. 🔴 **제안일 뿐 강제가 아니다** — 목록에 없는 값도 그대로 저장된다. */
  readonly options: readonly string[];
  readonly placeholder?: string;
  /** 목록의 접근명. 보이지는 않지만 보조기기가 "무엇의 목록인가"를 알아야 한다. */
  readonly listLabel: string;
  /**
   * **입력칸 자체의 접근명.**
   *
   * 🔴 `listLabel` 과 다르다 — 저건 목록(listbox)의 이름이고 이건 컨트롤(combobox)의 이름이다.
   *    보이는 라벨이 있으면 줄 필요가 없지만, 없는 자리(종목 비교의 고르기 칸)에서는 이것이
   *    없으면 보조기기가 그 칸을 **이름 없는 콤보박스**로 읽는다.
   */
  readonly ariaLabel?: string;
  readonly ariaInvalid?: boolean;
  readonly ariaDescribedBy?: string;
  /** 자동 포커스 대상 찾기용(`[data-field="…"]`). 이 레포의 폼이 쓰는 관례다. */
  readonly dataField?: string;
  /** 한 번에 보이는 최대 항목 수. 그보다 많으면 스크롤한다. */
  readonly visibleOptionCount?: number;
  /**
   * 고른 뒤 입력칸을 **비운다**(2026-08-09).
   *
   * 🔴 값을 담아 두는 칸이 아니라 **고르는 도구**일 때 쓴다 — 종목 비교의 "종목을 고르세요" 처럼
   *    고르는 즉시 목록에 담기고 칸은 다음 선택을 기다려야 하는 자리다. 고른 값이 칸에 남아 있으면
   *    "이미 담았는데 아직 칸에 있다"로 읽혀 한 번 더 누르게 된다.
   * ⚠ 이때 `value` 는 호출부가 계속 빈 문자열로 준다 — 이 옵션은 **선택 직후 무엇을 넘길지**만 정한다.
   */
  readonly clearOnSelect?: boolean;
  /** 막혀 있나. 🔴 막을 때는 호출부가 **사유를 함께** 세워야 한다(무음 비활성 금지). */
  readonly disabled?: boolean;
  /** 목록에 없는 값도 그대로 둘 수 있나. `false` 면 고른 것만 넘어간다(자유 입력 금지). */
  readonly allowFreeText?: boolean;
};
