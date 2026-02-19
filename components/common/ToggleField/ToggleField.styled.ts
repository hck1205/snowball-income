import styled from '@emotion/styled';

export const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #314d60;
  font-size: 14px;
`;

export const ToggleHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

export const HelpButton = styled.button`
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 999px;
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;

export const ToggleControl = styled.span<{ checked: boolean; disabled?: boolean; controlWidth?: string }>`
  width: ${({ controlWidth }) => controlWidth ?? '56px'};
  height: 24px;
  border-radius: 999px;
  border: 1px solid ${({ disabled }) => (disabled ? '#d4dde5' : '#2f6f93')};
  background: ${({ checked, disabled }) => (disabled ? '#eef3f7' : checked ? '#d7eaf6' : '#f2f6f9')};
  position: relative;
  transition: background-color 0.15s ease;
`;

export const ToggleStateText = styled.span<{ checked: boolean; disabled?: boolean; stateTextColor?: string }>`
  position: absolute;
  top: 50%;
  left: ${({ checked }) => (checked ? '8px' : 'auto')};
  right: ${({ checked }) => (checked ? 'auto' : '8px')};
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 700;
  color: ${({ checked, disabled, stateTextColor }) => stateTextColor ?? (disabled ? '#9eb0be' : checked ? '#2f6f93' : '#5f7485')};
  letter-spacing: 0.2px;
  user-select: none;
`;

export const ToggleThumb = styled.span<{ checked: boolean; disabled?: boolean }>`
  position: absolute;
  top: 1px;
  left: ${({ checked }) => (checked ? 'calc(100% - 21px)' : '1px')};
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: ${({ checked, disabled }) => (disabled ? '#c8d4de' : checked ? '#2f6f93' : '#8ca2b2')};
  transition: left 0.15s ease, background-color 0.15s ease;
`;

export const HiddenCheckbox = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
`;
