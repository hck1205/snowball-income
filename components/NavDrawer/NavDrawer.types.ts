export type NavDrawerProps = {
  /** 여는 버튼의 `aria-controls` 와 짝을 맺는 id. 공통 조상(AppHeader)이 `useId` 로 만들어 내린다. */
  id: string;
  isOpen: boolean;
  onClose: () => void;
};

/** 드로어가 그리는 목적지 하나. 값은 `components/PrimaryNav` 의 그룹 배열에서 온다. */
export type NavDrawerLink = {
  to: string;
  label: string;
  Icon: (props: { size?: number; strokeWidth?: number }) => JSX.Element;
};
