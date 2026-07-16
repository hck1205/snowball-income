export type ConfirmDialogProps = {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** 파괴적 확인이면 danger 버튼으로. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};
