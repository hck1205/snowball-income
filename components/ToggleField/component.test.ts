import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ToggleField from './component';

describe('ToggleField', () => {
  it('handles click event', () => {
    const onChange = vi.fn();
    render(createElement(ToggleField, { label: '재투자', checked: false, onChange }));

    fireEvent.click(screen.getByLabelText('재투자'));
    expect(onChange).toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(createElement(ToggleField, { label: '재투자', checked: false, disabled: true, onChange: () => undefined }));
    expect(screen.getByLabelText('재투자')).toBeDisabled();
  });
});
