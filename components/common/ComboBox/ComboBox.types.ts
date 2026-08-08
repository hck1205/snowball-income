export type ComboBoxProps = {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** 제안 목록. 🔴 **제안일 뿐 강제가 아니다** — 목록에 없는 값도 그대로 저장된다. */
  readonly options: readonly string[];
  readonly placeholder?: string;
  /** 목록의 접근명. 보이지는 않지만 보조기기가 "무엇의 목록인가"를 알아야 한다. */
  readonly listLabel: string;
  readonly ariaInvalid?: boolean;
  readonly ariaDescribedBy?: string;
  /** 자동 포커스 대상 찾기용(`[data-field="…"]`). 이 레포의 폼이 쓰는 관례다. */
  readonly dataField?: string;
  /** 한 번에 보이는 최대 항목 수. 그보다 많으면 스크롤한다. */
  readonly visibleOptionCount?: number;
};
