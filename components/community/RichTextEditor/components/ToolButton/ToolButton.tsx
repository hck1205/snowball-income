import { ToolbarButton } from '../../RichTextEditor.styled';
import type { ToolButtonProps } from './ToolButton.types';

/** 접근명은 라벨 그대로 두고 툴팁(title)에만 단축키를 덧붙인다. */
const withShortcut = (label: string, shortcut?: string) => (shortcut ? `${label} (${shortcut})` : label);

/** 재사용 툴바 버튼 — `RichTextToolbar`의 모든 그룹이 이 버튼으로 조립된다. */
const ToolButton = ({ label, shortcut, active, disabled, onClick, children }: ToolButtonProps) => (
  <ToolbarButton
    type="button"
    aria-label={label}
    title={withShortcut(label, shortcut)}
    {...(active === undefined ? {} : { 'aria-pressed': active, active })}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </ToolbarButton>
);

export default ToolButton;
