import styled from '@emotion/styled';

export const FieldLabel = styled.label`
  display: grid;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  color: #314d60;
`;

export const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

export const BaseInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
`;

export const BaseSelect = styled.select`
  width: 100%;
  min-width: 0;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
`;
