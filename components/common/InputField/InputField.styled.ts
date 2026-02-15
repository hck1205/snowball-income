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
  font-family: inherit;
  color: inherit;

  &[type='date'] {
    font-family: inherit;
  }

  &[type='date']::-webkit-datetime-edit,
  &[type='date']::-webkit-datetime-edit-text,
  &[type='date']::-webkit-datetime-edit-month-field,
  &[type='date']::-webkit-datetime-edit-day-field,
  &[type='date']::-webkit-datetime-edit-year-field {
    font: inherit;
    color: inherit;
  }
`;

export const BaseSelect = styled.select`
  width: 100%;
  min-width: 0;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 28px 8px 10px;
  font-size: 14px;
  background-color: #fff;
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #5e7688 50%), linear-gradient(135deg, #5e7688 50%, transparent 50%);
  background-position: calc(100% - 14px) calc(50% - 1px), calc(100% - 10px) calc(50% - 1px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
`;
